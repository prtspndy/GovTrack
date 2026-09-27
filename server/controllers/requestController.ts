import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import {
  RequestModel,
  DocumentTypeModel,
  RequestStatusHistoryModel,
  NotificationModel,
  AuditLogModel,
  IUploadedDocument
} from '../models/index.js';
import { AuthRequest } from '../middleware/auth.js';
import { generateRequestNumber } from '../utils/requestNumber.js';
import { canCitizenCancel } from '../services/statusWorkflow.js';

export async function createRequest(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { documentTypeId, applicationData: rawAppData } = req.body;

    if (!documentTypeId) {
      return res.status(400).json({ success: false, message: 'Document type is required.' });
    }

    const documentType = await DocumentTypeModel.findById(documentTypeId).exec();
    if (!documentType || !documentType.isActive) {
      return res.status(404).json({ success: false, message: 'Selected document type is unavailable.' });
    }

    let applicationData: Record<string, any> = {};
    if (typeof rawAppData === 'string') {
      try {
        applicationData = JSON.parse(rawAppData);
      } catch {
        applicationData = {};
      }
    } else if (rawAppData && typeof rawAppData === 'object') {
      applicationData = rawAppData;
    }

    // Process uploaded documents from multer
    const files = req.files as Express.Multer.File[] | undefined;
    const uploadedDocuments: IUploadedDocument[] = [];

    if (files && files.length > 0) {
      // Map file original names or field keys
      files.forEach((file, index) => {
        uploadedDocuments.push({
          _id: `doc_${Date.now()}_${index}`,
          documentType: file.fieldname || 'Supporting Document',
          originalName: file.originalname,
          storedName: file.filename,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
          uploadedBy: req.user!._id,
          uploadedAt: new Date().toISOString(),
          verificationStatus: 'PENDING'
        });
      });
    }

    const requestNumber = await generateRequestNumber();
    const now = new Date();
    const expectedDate = new Date(now);
    expectedDate.setDate(expectedDate.getDate() + (documentType.processingTime || 7));

    const newRequest = await RequestModel.create({
      requestNumber,
      citizen: req.user._id,
      documentType: documentType._id,
      applicationData,
      uploadedDocuments,
      status: 'SUBMITTED',
      currentDepartment: documentType.department,
      assignedOfficer: 'Pending Assignment',
      remarks: 'Application submitted online by citizen.',
      submittedAt: now.toISOString(),
      lastUpdatedAt: now.toISOString(),
      expectedCompletionDate: expectedDate.toISOString()
    });

    // Create initial Status History
    await RequestStatusHistoryModel.create({
      request: newRequest._id,
      oldStatus: 'NONE',
      newStatus: 'SUBMITTED',
      changedBy: req.user._id,
      changedByRole: 'citizen',
      remarks: 'Application submitted successfully via online citizen portal.',
      timestamp: now.toISOString()
    });

    // Create Notification
    await NotificationModel.create({
      user: req.user._id,
      title: 'Application Submitted',
      message: `Your application for ${documentType.name} (${requestNumber}) has been submitted successfully.`,
      type: 'STATUS_UPDATE',
      request: newRequest._id,
      isRead: false,
      createdAt: now.toISOString()
    });

    // Audit Log
    await AuditLogModel.create({
      user: req.user._id,
      action: 'REQUEST_SUBMITTED',
      request: newRequest._id,
      description: `Citizen submitted request ${requestNumber} for ${documentType.name}`,
      ipAddress: req.ip || '127.0.0.1'
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully.',
      data: newRequest
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getMyRequests(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.max(1, parseInt(String(req.query.limit || '10'), 10));
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const filter: Record<string, any> = {
      citizen: req.user._id
    };

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { requestNumber: new RegExp(search, 'i') },
        { currentDepartment: new RegExp(search, 'i') }
      ];
    }

    const total = await RequestModel.countDocuments(filter);
    const requests = await RequestModel.find(filter)
      .populate(['documentType'])
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    res.json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getRequestById(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const request = await RequestModel.findById(id)
      .populate(['citizen', 'documentType'])
      .exec();

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    // Citizen IDOR check
    const citizenId = (request.citizen as any)?._id || request.citizen;
    if (req.user.role === 'citizen' && String(citizenId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view this request.'
      });
    }

    // Fetch status history for this request
    const statusHistory = await RequestStatusHistoryModel.find({ request: request._id })
      .populate(['changedBy'])
      .sort({ timestamp: 1 })
      .exec();

    res.json({
      success: true,
      data: {
        ...request,
        statusHistory
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function cancelRequest(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const request = await RequestModel.findById(id).exec();
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    // IDOR Check
    const citizenId = (request.citizen as any)?._id || request.citizen;
    if (String(citizenId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (!canCitizenCancel(request.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel request at '${request.status}' stage. Cancellation is only permitted at SUBMITTED stage.`
      });
    }

    const oldStatus = request.status;
    const now = new Date().toISOString();

    const updated = await RequestModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'CANCELLED',
          lastUpdatedAt: now,
          remarks: 'Request cancelled by citizen.'
        }
      },
      { new: true }
    );

    await RequestStatusHistoryModel.create({
      request: id,
      oldStatus,
      newStatus: 'CANCELLED',
      changedBy: req.user._id,
      changedByRole: 'citizen',
      remarks: 'Application cancelled by applicant.',
      timestamp: now
    });

    await NotificationModel.create({
      user: req.user._id,
      title: 'Request Cancelled',
      message: `Your application (${request.requestNumber}) was cancelled as requested.`,
      type: 'STATUS_UPDATE',
      request: id,
      isRead: false,
      createdAt: now
    });

    await AuditLogModel.create({
      user: req.user._id,
      action: 'REQUEST_CANCELLED',
      request: id,
      description: `Citizen cancelled request ${request.requestNumber}`,
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: 'Request cancelled successfully.',
      data: updated
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function uploadAdditionalDocument(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const request = await RequestModel.findById(id).exec();
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const citizenId = (request.citizen as any)?._id || request.citizen;
    if (String(citizenId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'Please select a document to upload.' });
    }

    const docTypeLabel = req.body.documentType || 'Additional Document';
    const now = new Date().toISOString();

    const newDoc: IUploadedDocument = {
      _id: `doc_${Date.now()}`,
      documentType: docTypeLabel,
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      uploadedBy: req.user._id,
      uploadedAt: now,
      verificationStatus: 'PENDING',
      verificationRemarks: 'Uploaded in response to officer request.'
    };

    // Transition back to DOCUMENT_VERIFICATION
    const oldStatus = request.status;
    const updated = await RequestModel.findByIdAndUpdate(
      id,
      {
        $push: { uploadedDocuments: newDoc },
        $set: {
          status: 'DOCUMENT_VERIFICATION',
          lastUpdatedAt: now,
          remarks: `Additional document '${docTypeLabel}' submitted by citizen.`
        }
      },
      { new: true }
    );

    await RequestStatusHistoryModel.create({
      request: id,
      oldStatus,
      newStatus: 'DOCUMENT_VERIFICATION',
      changedBy: req.user._id,
      changedByRole: 'citizen',
      remarks: `Citizen submitted required additional document: ${docTypeLabel}`,
      timestamp: now
    });

    await NotificationModel.create({
      user: req.user._id,
      title: 'Additional Document Received',
      message: `Your document '${docTypeLabel}' has been uploaded. Request has returned to Document Verification.`,
      type: 'DOCUMENT_REQUIRED',
      request: id,
      isRead: false,
      createdAt: now
    });

    await AuditLogModel.create({
      user: req.user._id,
      action: 'ADDITIONAL_DOC_UPLOADED',
      request: id,
      description: `Citizen uploaded additional document: ${docTypeLabel} (${request.requestNumber})`,
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: 'Additional document uploaded successfully. Application returned to verification queue.',
      data: updated
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function downloadUploadedDocument(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id, documentId } = req.params;
    const request = await RequestModel.findById(id).exec();
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const citizenId = (request.citizen as any)?._id || request.citizen;
    if (req.user.role === 'citizen' && String(citizenId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const doc = request.uploadedDocuments?.find((d) => String(d._id) === String(documentId));
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document record not found.' });
    }

    const filePath = path.resolve(process.cwd(), 'uploads', doc.storedName);
    if (!fs.existsSync(filePath)) {
      // Return a simulated government document stream if file was pre-seeded
      res.setHeader('Content-Type', doc.mimeType || 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`);
      return res.send(Buffer.from(`[GovTrack Official Document Archive]\nDocument: ${doc.originalName}\nRequest: ${request.requestNumber}\nType: ${doc.documentType}\nTimestamp: ${doc.uploadedAt}\nVerification Status: ${doc.verificationStatus}`));
    }

    res.download(filePath, doc.originalName);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function downloadFinalDocument(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const request = await RequestModel.findById(id)
      .populate(['documentType', 'citizen'])
      .exec();

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const citizenId = (request.citizen as any)?._id || request.citizen;
    if (req.user.role === 'citizen' && String(citizenId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (!request.finalDocument && request.status !== 'READY_FOR_DOWNLOAD' && request.status !== 'COMPLETED' && request.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Final government document is not yet issued or approved for this application.'
      });
    }

    const docName = request.finalDocument?.originalName || `${request.requestNumber}-Certificate.pdf`;
    const storedPath = request.finalDocument?.path;

    if (storedPath && fs.existsSync(storedPath)) {
      return res.download(storedPath, docName);
    }

    // Generate certified digital document buffer for download
    const docType = (request.documentType as any)?.name || 'Government Certificate';
    const citizenName = `${(request.citizen as any)?.firstName || 'Citizen'} ${(request.citizen as any)?.lastName || ''}`.trim();
    const certificateText = `
================================================================================
                    GOVERNMENT OF CITIZEN SERVICES (DEMO)
                 DIRECTORATE OF CITIZEN IDENTITY & CERTIFICATION
================================================================================

CERTIFICATE ID: ${request.requestNumber}
DATE OF ISSUE : ${new Date(request.lastUpdatedAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
DEPARTMENT    : ${request.currentDepartment || 'General Administration'}

--------------------------------------------------------------------------------
                         OFFICIAL DIGITAL CERTIFICATE
--------------------------------------------------------------------------------

This is to certify that:

Applicant Name   : ${citizenName.toUpperCase()}
Document Type    : ${docType.toUpperCase()}
Application No   : ${request.requestNumber}
Issuing Officer  : ${request.assignedOfficer || 'Authorized Officer'}
Verification Ref : VER-${request._id.substring(0, 8).toUpperCase()}

Application Summary Data:
${JSON.stringify(request.applicationData, null, 2)}

STATUS: OFFICIALLY APPROVED & DIGITALLY VERIFIED
Remarks: ${request.remarks || 'Document satisfies statutory criteria.'}

--------------------------------------------------------------------------------
Notice: This is a verified electronic certificate issued under the GovTrack
Digital Portal prototype. Digitally verifiable via portal tracking number.
================================================================================
`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${request.requestNumber}_${docType.replace(/\s+/g, '_')}.txt"`);
    res.send(certificateText);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
