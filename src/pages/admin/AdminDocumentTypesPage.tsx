import React, { useState, useEffect } from 'react';
import { documentTypeService } from '../../services/documentTypeService.js';
import { DocumentType, RequiredDocumentSpec } from '../../types/index.js';
import { Modal } from '../../components/Modal.js';
import {
  Layers,
  Plus,
  Edit2,
  Clock,
  IndianRupee,
  CheckCircle2,
  XCircle,
  FileCheck,
  Building2,
  Trash2
} from 'lucide-react';

export const AdminDocumentTypesPage: React.FC = () => {
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Create Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentType | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [processingTime, setProcessingTime] = useState(7);
  const [fee, setFee] = useState(50);
  const [requiredDocs, setRequiredDocs] = useState<RequiredDocumentSpec[]>([]);

  // Temp for adding a required document
  const [newReqName, setNewReqName] = useState('');
  const [newReqDesc, setNewReqDesc] = useState('');
  const [newReqMandatory, setNewReqMandatory] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const res = await documentTypeService.getAll(true);
    if (res.success && res.data) {
      setDocTypes(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingDoc(null);
    setName('');
    setDescription('');
    setDepartment('Revenue Department');
    setProcessingTime(7);
    setFee(50);
    setRequiredDocs([
      {
        name: 'Aadhaar Card',
        description: 'UIDAI citizen proof',
        isRequired: true,
        allowedFileTypes: ['pdf', 'jpg'],
        maxFileSize: 5
      }
    ]);
    setModalOpen(true);
  };

  const openEditModal = (doc: DocumentType) => {
    setEditingDoc(doc);
    setName(doc.name);
    setDescription(doc.description);
    setDepartment(doc.department);
    setProcessingTime(doc.processingTime);
    setFee(doc.fee);
    setRequiredDocs(doc.requiredDocuments || []);
    setModalOpen(true);
  };

  const handleAddReqDoc = () => {
    if (!newReqName.trim()) return;
    setRequiredDocs([
      ...requiredDocs,
      {
        name: newReqName.trim(),
        description: newReqDesc.trim(),
        isRequired: newReqMandatory,
        allowedFileTypes: ['pdf', 'jpg', 'png'],
        maxFileSize: 5
      }
    ]);
    setNewReqName('');
    setNewReqDesc('');
    setNewReqMandatory(true);
  };

  const handleRemoveReqDoc = (idx: number) => {
    setRequiredDocs(requiredDocs.filter((_, i) => i !== idx));
  };

  const handleSaveDocType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !department.trim()) return;

    const payload = {
      name: name.trim(),
      description: description.trim(),
      department: department.trim(),
      processingTime: Number(processingTime),
      fee: Number(fee),
      requiredDocuments: requiredDocs
    };

    if (editingDoc) {
      await documentTypeService.update(editingDoc._id, payload);
    } else {
      await documentTypeService.create(payload);
    }

    setModalOpen(false);
    loadData();
  };

  const handleToggleStatus = async (id: string) => {
    await documentTypeService.toggleStatus(id);
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              Statutory Master Catalog
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Document Types & Requirements</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure available citizen certificates, departmental jurisdictions, service turn-around times, and required proofs.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-lg bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add New Certificate Type
          </button>
        </div>

        {/* Catalog Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading catalog...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Certificate Name</th>
                    <th className="px-5 py-3.5">Department</th>
                    <th className="px-5 py-3.5">SLA Time</th>
                    <th className="px-5 py-3.5">Fee</th>
                    <th className="px-5 py-3.5">Required Proofs</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {docTypes.map((doc) => (
                    <tr key={doc._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {doc.name}
                        <p className="text-[11px] text-slate-500 font-normal line-clamp-1">{doc.description}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-700 font-medium">
                        {doc.department}
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-mono">
                        {doc.processingTime} Days
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800">
                        {doc.fee === 0 ? 'Free' : `₹${doc.fee}`}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <span className="font-semibold text-slate-800">{doc.requiredDocuments?.length || 0}</span> proof(s) defined
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleStatus(doc._id)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer border transition-colors ${
                            doc.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {doc.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => openEditModal(doc)}
                          className="px-2.5 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-xs inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit / Create Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDoc ? `Edit ${editingDoc.name}` : 'Add New Government Certificate'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveDocType} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Certificate Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Income Certificate"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Department *</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Revenue & Land Records Department"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Service Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State the statutory purpose and citizen eligibility guidelines..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Processing Time (Days) *</label>
              <input
                type="number"
                required
                value={processingTime}
                onChange={(e) => setProcessingTime(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Statutory Fee (INR) *</label>
              <input
                type="number"
                required
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Required Documents Section */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-slate-700 font-bold mb-2">
              Mandatory Proofs & Documents ({requiredDocs.length})
            </label>

            <div className="space-y-2 mb-3 max-h-36 overflow-y-auto">
              {requiredDocs.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                  <div>
                    <span className="font-semibold text-slate-800">{doc.name}</span>
                    {doc.isRequired && <span className="ml-1 text-[10px] text-red-600 font-bold">*</span>}
                    <p className="text-[10px] text-slate-500">{doc.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveReqDoc(idx)}
                    className="p-1 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick add proof bar */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Document Name (e.g. Aadhaar Card)"
                  value={newReqName}
                  onChange={(e) => setNewReqName(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                />
                <input
                  type="text"
                  placeholder="Short Description"
                  value={newReqDesc}
                  onChange={(e) => setNewReqDesc(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                />
                <label className="flex items-center gap-1 text-[11px] text-slate-700">
                  <input
                    type="checkbox"
                    checked={newReqMandatory}
                    onChange={(e) => setNewReqMandatory(e.target.checked)}
                  />
                  Mandatory
                </label>
                <button
                  type="button"
                  onClick={handleAddReqDoc}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded font-bold text-xs shrink-0"
                >
                  Add Proof
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-800 hover:bg-blue-900 text-white font-bold rounded-lg shadow-xs"
            >
              Save Certificate Configuration
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
