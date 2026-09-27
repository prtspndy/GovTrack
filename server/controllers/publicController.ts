import { Request, Response } from 'express';
import { RequestModel, RequestStatusHistoryModel, DocumentTypeModel } from '../models/index.js';

export async function trackRequestPublic(req: Request, res: Response) {
  try {
    const { requestNumber } = req.params;

    if (!requestNumber || !requestNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Request number is required to track status.'
      });
    }

    const cleanNum = requestNumber.trim().toUpperCase();
    const request = await RequestModel.findOne({ requestNumber: cleanNum })
      .populate(['documentType', 'citizen'])
      .exec();

    if (!request) {
      return res.status(404).json({
        success: false,
        message: `No application found with request number '${cleanNum}'. Please check the reference number on your submission receipt.`
      });
    }

    const history = await RequestStatusHistoryModel.find({ request: request._id })
      .sort({ timestamp: 1 })
      .exec();

    const docType = request.documentType as any;
    const citizen = request.citizen as any;

    // Masked citizen name for public privacy: e.g. "R**** P****"
    const maskName = (name?: string) => {
      if (!name) return 'Applicant';
      if (name.length <= 2) return name;
      return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
    };

    const publicResponse = {
      _id: request._id,
      requestNumber: request.requestNumber,
      applicantInitials: `${maskName(citizen?.firstName)} ${maskName(citizen?.lastName)}`,
      documentType: {
        name: docType?.name || 'Document',
        department: docType?.department || request.currentDepartment,
        processingTime: docType?.processingTime || 7
      },
      currentStatus: request.status,
      currentDepartment: request.currentDepartment,
      assignedOfficer: request.assignedOfficer || 'Verification Cell',
      submittedAt: request.submittedAt,
      lastUpdatedAt: request.lastUpdatedAt,
      expectedCompletionDate: request.expectedCompletionDate,
      remarks: request.remarks,
      finalDocumentAvailable: Boolean(request.finalDocument || ['READY_FOR_DOWNLOAD', 'COMPLETED', 'APPROVED'].includes(request.status)),
      timeline: history.map((h) => ({
        stage: h.newStatus,
        label: h.newStatus.replace(/_/g, ' '),
        timestamp: h.timestamp,
        remarks: h.remarks,
        role: h.changedByRole
      }))
    };

    res.json({
      success: true,
      data: publicResponse
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getPublicDocumentTypes(_req: Request, res: Response) {
  try {
    const docTypes = await DocumentTypeModel.find({ isActive: true }).sort({ name: 1 }).exec();
    res.json({
      success: true,
      data: docTypes
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
