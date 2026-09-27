import { Response } from 'express';
import {
  RequestModel,
  RequestStatusHistoryModel,
  NotificationModel,
  AuditLogModel,
  UserModel,
  DocumentTypeModel,
  RequestStatus,
  IUploadedDocument
} from '../models/index.js';
import { AuthRequest } from '../middleware/auth.js';
import { isValidTransition } from '../services/statusWorkflow.js';

export async function getAllRequests(req: AuthRequest, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.max(1, parseInt(String(req.query.limit || '15'), 10));
    const status = req.query.status as string | undefined;
    const documentType = req.query.documentType as string | undefined;
    const search = req.query.search as string | undefined;
    const sortBy = (req.query.sortBy as string) || 'submittedAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const filter: Record<string, any> = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (documentType && documentType !== 'ALL') {
      filter.documentType = documentType;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      // Find matching users first for citizen name/email search
      const matchedUsers = await UserModel.find({
        $or: [{ firstName: regex }, { lastName: regex }, { email: regex }, { mobileNumber: regex }]
      }).exec();
      const userIds = matchedUsers.map((u) => u._id);

      filter.$or = [
        { requestNumber: regex },
        { currentDepartment: regex },
        { citizen: { $in: userIds } }
      ];
    }

    const total = await RequestModel.countDocuments(filter);
    const requests = await RequestModel.find(filter)
      .populate(['citizen', 'documentType'])
      .sort({ [sortBy]: sortOrder })
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
    const { id } = req.params;
    const request = await RequestModel.findById(id)
      .populate(['citizen', 'documentType'])
      .exec();

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const statusHistory = await RequestStatusHistoryModel.find({ request: id })
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

export async function updateRequestStatus(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { status: targetStatus, remarks, assignedOfficer } = req.body;

    if (!targetStatus) {
      return res.status(400).json({ success: false, message: 'New status is required.' });
    }

    const request = await RequestModel.findById(id).populate(['citizen', 'documentType']).exec();
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const currentStatus = request.status;
    const newStatus = targetStatus as RequestStatus;

    if (!isValidTransition(currentStatus, newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition: Cannot transition from '${currentStatus}' to '${newStatus}'.`
      });
    }

    const now = new Date().toISOString();
    const officerName = assignedOfficer || `${req.user.firstName} ${req.user.lastName} (${req.user.email})`;

    const updateFields: any = {
      status: newStatus,
      lastUpdatedAt: now,
      assignedOfficer: officerName
    };

    if (remarks) {
      updateFields.remarks = remarks.trim();
    }

    if (newStatus === 'COMPLETED') {
      updateFields.completedAt = now;
    }

    if (newStatus === 'REJECTED' && remarks) {
      updateFields.rejectionReason = remarks.trim();
    }

    const updated = await RequestModel.findByIdAndUpdate(id, { $set: updateFields }, { new: true });

    // Status History
    await RequestStatusHistoryModel.create({
      request: id,
      oldStatus: currentStatus,
      newStatus,
      changedBy: req.user._id,
      changedByRole: 'admin',
      remarks: remarks || `Status updated to ${newStatus} by officer ${officerName}.`,
      timestamp: now
    });

    // Notify citizen
    const citizenId = (request.citizen as any)?._id || request.citizen;
    const docTypeName = (request.documentType as any)?.name || 'Document';
    await NotificationModel.create({
      user: citizenId,
      title: `Status Updated: ${newStatus.replace(/_/g, ' ')}`,
      message: `Your ${docTypeName} request (${request.requestNumber}) has moved to ${newStatus.replace(/_/g, ' ')}. ${remarks ? `Remarks: ${remarks}` : ''}`,
      type: 'STATUS_UPDATE',
      request: id,
      isRead: false,
      createdAt: now
    });

    // Audit Log
    await AuditLogModel.create({
      user: req.user._id,
      action: 'STATUS_UPDATED',
      request: id,
      description: `Officer updated request ${request.requestNumber} status from ${currentStatus} to ${newStatus}`,
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: `Request status successfully updated to ${newStatus}.`,
      data: updated
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function verifyDocument(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id, documentId } = req.params;
    const { status, remarks } = req.body; // status: 'VERIFIED' | 'REJECTED'

    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'VERIFIED' or 'REJECTED'." });
    }

    if (status === 'REJECTED' && !remarks) {
      return res.status(400).json({ success: false, message: 'Remarks are mandatory when rejecting a document.' });
    }

    const request = await RequestModel.findById(id).populate(['citizen', 'documentType']).exec();
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const docs = request.uploadedDocuments || [];
    const docIndex = docs.findIndex((d) => String(d._id) === String(documentId));
    if (docIndex === -1) {
      return res.status(404).json({ success: false, message: 'Document not found in request.' });
    }

    docs[docIndex].verificationStatus = status;
    docs[docIndex].verificationRemarks = remarks || (status === 'VERIFIED' ? 'Verified by officer' : 'Rejected');

    const updated = await RequestModel.findByIdAndUpdate(
      id,
      {
        $set: {
          uploadedDocuments: docs,
          lastUpdatedAt: new Date().toISOString()
        }
      },
      { new: true }
    );

    const docName = docs[docIndex].documentType || docs[docIndex].originalName;
    const citizenId = (request.citizen as any)?._id || request.citizen;

    await NotificationModel.create({
      user: citizenId,
      title: `Document ${status === 'VERIFIED' ? 'Verified' : 'Verification Rejected'}`,
      message: `Your document '${docName}' for request ${request.requestNumber} was ${status.toLowerCase()}. ${remarks ? `Note: ${remarks}` : ''}`,
      type: 'DOCUMENT_REQUIRED',
      request: id,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    await AuditLogModel.create({
      user: req.user._id,
      action: status === 'VERIFIED' ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_REJECTED',
      request: id,
      description: `Officer marked document '${docName}' as ${status}. Note: ${remarks || 'None'}`,
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: `Document marked as ${status}.`,
      data: updated
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function requestAdditionalDocument(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { documentName, instructions } = req.body;

    if (!documentName || !instructions) {
      return res.status(400).json({ success: false, message: 'Document name and instructions are required.' });
    }

    const request = await RequestModel.findById(id).populate(['citizen', 'documentType']).exec();
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const oldStatus = request.status;
    const now = new Date().toISOString();
    const updatedRemarks = `Additional document requested: "${documentName}". Instructions: ${instructions}`;

    const updated = await RequestModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'ADDITIONAL_DOCUMENT_REQUIRED',
          remarks: updatedRemarks,
          lastUpdatedAt: now
        }
      },
      { new: true }
    );

    await RequestStatusHistoryModel.create({
      request: id,
      oldStatus,
      newStatus: 'ADDITIONAL_DOCUMENT_REQUIRED',
      changedBy: req.user._id,
      changedByRole: 'admin',
      remarks: updatedRemarks,
      timestamp: now
    });

    const citizenId = (request.citizen as any)?._id || request.citizen;
    await NotificationModel.create({
      user: citizenId,
      title: 'Action Required: Additional Document Needed',
      message: `For request ${request.requestNumber}: Please upload "${documentName}". Instructions: ${instructions}`,
      type: 'DOCUMENT_REQUIRED',
      request: id,
      isRead: false,
      createdAt: now
    });

    await AuditLogModel.create({
      user: req.user._id,
      action: 'ADDITIONAL_DOC_REQUESTED',
      request: id,
      description: `Officer requested additional document "${documentName}" for request ${request.requestNumber}`,
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: 'Additional document request dispatched to applicant.',
      data: updated
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function uploadFinalDocument(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const request = await RequestModel.findById(id).populate(['citizen', 'documentType']).exec();
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const file = req.file;
    const now = new Date().toISOString();
    const docTypeName = (request.documentType as any)?.name || 'Government Certificate';

    const finalDoc = file
      ? {
          originalName: file.originalname,
          storedName: file.filename,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
          uploadedAt: now
        }
      : {
          originalName: `${request.requestNumber}_${docTypeName.replace(/\s+/g, '_')}.pdf`,
          storedName: `cert_${request.requestNumber}.pdf`,
          mimeType: 'application/pdf',
          size: 10240,
          path: '',
          uploadedAt: now
        };

    const oldStatus = request.status;
    const updated = await RequestModel.findByIdAndUpdate(
      id,
      {
        $set: {
          finalDocument: finalDoc,
          status: 'READY_FOR_DOWNLOAD',
          remarks: 'Official digital document signed and issued. Ready for citizen download.',
          lastUpdatedAt: now
        }
      },
      { new: true }
    );

    await RequestStatusHistoryModel.create({
      request: id,
      oldStatus,
      newStatus: 'READY_FOR_DOWNLOAD',
      changedBy: req.user._id,
      changedByRole: 'admin',
      remarks: 'Official certificate/document uploaded and issued for citizen download.',
      timestamp: now
    });

    const citizenId = (request.citizen as any)?._id || request.citizen;
    await NotificationModel.create({
      user: citizenId,
      title: 'Certificate Ready for Download!',
      message: `Your ${docTypeName} (${request.requestNumber}) has been signed and is now ready for digital download.`,
      type: 'DOCUMENT_READY',
      request: id,
      isRead: false,
      createdAt: now
    });

    await AuditLogModel.create({
      user: req.user._id,
      action: 'FINAL_DOCUMENT_UPLOADED',
      request: id,
      description: `Officer issued and uploaded final certificate for request ${request.requestNumber}`,
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: 'Official digital document issued successfully. Application is ready for download.',
      data: updated
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getDashboardStats(_req: AuthRequest, res: Response) {
  try {
    const allRequests = await RequestModel.find().populate(['documentType']).exec();
    const totalRequests = allRequests.length;

    let pendingCount = 0;
    let underReviewCount = 0;
    let docVerificationCount = 0;
    let processingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let readyForDownloadCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    const statusCounts: Record<string, number> = {};
    const docTypeCounts: Record<string, number> = {};
    const monthlyCounts: Record<string, number> = {};

    allRequests.forEach((req) => {
      // By Status
      statusCounts[req.status] = (statusCounts[req.status] || 0) + 1;

      if (['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENT_VERIFICATION', 'ADDITIONAL_DOCUMENT_REQUIRED', 'PROCESSING'].includes(req.status)) {
        pendingCount++;
      }
      if (req.status === 'UNDER_REVIEW') underReviewCount++;
      if (req.status === 'DOCUMENT_VERIFICATION') docVerificationCount++;
      if (req.status === 'PROCESSING') processingCount++;
      if (req.status === 'APPROVED') approvedCount++;
      if (req.status === 'REJECTED') rejectedCount++;
      if (req.status === 'READY_FOR_DOWNLOAD') readyForDownloadCount++;
      if (req.status === 'COMPLETED') completedCount++;
      if (req.status === 'CANCELLED') cancelledCount++;

      // By Document Type
      const dtName = (req.documentType as any)?.name || 'General';
      docTypeCounts[dtName] = (docTypeCounts[dtName] || 0) + 1;

      // By Month
      const date = new Date(req.submittedAt || Date.now());
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyCounts[monthYear] = (monthlyCounts[monthYear] || 0) + 1;
    });

    const requestsByStatus = Object.keys(statusCounts).map((status) => ({
      name: status.replace(/_/g, ' '),
      rawStatus: status,
      count: statusCounts[status]
    }));

    const requestsByDocumentType = Object.keys(docTypeCounts).map((docType) => ({
      name: docType,
      count: docTypeCounts[docType]
    }));

    const requestsPerMonth = Object.keys(monthlyCounts).map((month) => ({
      month,
      count: monthlyCounts[month]
    }));

    // Recent 5 requests
    const recentRequests = await RequestModel.find()
      .populate(['citizen', 'documentType'])
      .sort({ submittedAt: -1 })
      .limit(6)
      .exec();

    const approvalRate = totalRequests > 0 ? Math.round(((approvedCount + readyForDownloadCount + completedCount) / totalRequests) * 100) : 0;

    res.json({
      success: true,
      data: {
        summary: {
          total: totalRequests,
          pending: pendingCount,
          underReview: underReviewCount,
          documentVerification: docVerificationCount,
          processing: processingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          readyForDownload: readyForDownloadCount,
          completed: completedCount,
          cancelled: cancelledCount,
          approvalRate
        },
        requestsByStatus,
        requestsByDocumentType,
        requestsPerMonth,
        recentRequests
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getUsers(req: AuthRequest, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.max(1, parseInt(String(req.query.limit || '15'), 10));
    const search = req.query.search as string | undefined;
    const role = req.query.role as string | undefined;

    const filter: Record<string, any> = {};
    if (role && role !== 'ALL') {
      filter.role = role;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }, { mobileNumber: regex }];
    }

    const total = await UserModel.countDocuments(filter);
    const users = await UserModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const safeUsers = users.map(({ password, ...u }) => u);

    res.json({
      success: true,
      data: safeUsers,
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

export async function toggleUserStatus(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const user = await UserModel.findById(id).exec();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Do not allow self deactivation
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own administrative account.' });
    }

    const updated = await UserModel.findByIdAndUpdate(
      id,
      { $set: { isActive: !user.isActive } },
      { new: true }
    );

    await AuditLogModel.create({
      user: req.user._id,
      action: 'USER_UPDATED',
      description: `Admin toggled status for user ${user.email} -> ${updated?.isActive ? 'Active' : 'Inactive'}`,
      ipAddress: req.ip || '127.0.0.1'
    });

    const { password: _, ...safeUser } = updated as any;

    res.json({
      success: true,
      message: `User account is now ${safeUser.isActive ? 'active' : 'inactive'}.`,
      data: safeUser
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getAuditLogs(req: AuthRequest, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.max(1, parseInt(String(req.query.limit || '20'), 10));
    const search = req.query.search as string | undefined;

    const filter: Record<string, any> = {};
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ action: regex }, { description: regex }];
    }

    const total = await AuditLogModel.countDocuments(filter);
    const logs = await AuditLogModel.find(filter)
      .populate(['user', 'request'])
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    res.json({
      success: true,
      data: logs,
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
