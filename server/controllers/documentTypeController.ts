import { Request, Response } from 'express';
import { DocumentTypeModel, AuditLogModel } from '../models/index.js';
import { AuthRequest } from '../middleware/auth.js';

export async function getAllDocumentTypes(req: Request, res: Response) {
  try {
    const { includeInactive } = req.query;
    const filter = includeInactive === 'true' ? {} : { isActive: true };
    const docTypes = await DocumentTypeModel.find(filter).sort({ name: 1 }).exec();

    res.json({
      success: true,
      data: docTypes
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getDocumentTypeById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const docType = await DocumentTypeModel.findById(id).exec();
    if (!docType) {
      return res.status(404).json({ success: false, message: 'Document type not found.' });
    }

    res.json({
      success: true,
      data: docType
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createDocumentType(req: AuthRequest, res: Response) {
  try {
    const { name, description, department, processingTime, fee, requiredDocuments } = req.body;

    if (!name || !department || processingTime === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, department, and processingTime are required.'
      });
    }

    const created = await DocumentTypeModel.create({
      name: name.trim(),
      description: description?.trim() || '',
      department: department.trim(),
      processingTime: Number(processingTime),
      fee: Number(fee || 0),
      requiredDocuments: Array.isArray(requiredDocuments) ? requiredDocuments : [],
      isActive: true
    });

    if (req.user) {
      await AuditLogModel.create({
        user: req.user._id,
        action: 'DOCUMENT_TYPE_CREATED',
        description: `Created document type: ${created.name} (${created.department})`,
        ipAddress: req.ip || '127.0.0.1'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Document type created successfully.',
      data: created
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateDocumentType(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, department, processingTime, fee, requiredDocuments, isActive } = req.body;

    const updated = await DocumentTypeModel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(name && { name: name.trim() }),
          ...(description !== undefined && { description: description.trim() }),
          ...(department && { department: department.trim() }),
          ...(processingTime !== undefined && { processingTime: Number(processingTime) }),
          ...(fee !== undefined && { fee: Number(fee) }),
          ...(requiredDocuments && { requiredDocuments }),
          ...(isActive !== undefined && { isActive: Boolean(isActive) })
        }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Document type not found.' });
    }

    if (req.user) {
      await AuditLogModel.create({
        user: req.user._id,
        action: 'DOCUMENT_TYPE_UPDATED',
        description: `Updated document type: ${updated.name}`,
        ipAddress: req.ip || '127.0.0.1'
      });
    }

    res.json({
      success: true,
      message: 'Document type updated successfully.',
      data: updated
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function toggleDocumentTypeStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const docType = await DocumentTypeModel.findById(id).exec();
    if (!docType) {
      return res.status(404).json({ success: false, message: 'Document type not found.' });
    }

    const updated = await DocumentTypeModel.findByIdAndUpdate(
      id,
      { $set: { isActive: !docType.isActive } },
      { new: true }
    );

    if (req.user) {
      await AuditLogModel.create({
        user: req.user._id,
        action: 'DOCUMENT_TYPE_STATUS_TOGGLED',
        description: `Toggled document type status: ${docType.name} -> ${updated?.isActive ? 'Active' : 'Inactive'}`,
        ipAddress: req.ip || '127.0.0.1'
      });
    }

    res.json({
      success: true,
      message: `Document type is now ${updated?.isActive ? 'active' : 'inactive'}.`,
      data: updated
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
