import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { publicService } from '../../services/publicService.js';
import { requestService } from '../../services/requestService.js';
import { DocumentType, RequiredDocumentSpec } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  FileText,
  CheckCircle2,
  Upload,
  Clock,
  IndianRupee,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Trash2,
  FileCheck,
  Building2,
  Search
} from 'lucide-react';

export const ApplyDocumentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedDocId = searchParams.get('docType');
  const { user } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);
  const [loadingDocTypes, setLoadingDocTypes] = useState(true);

  // Form Application Data
  const [appData, setAppData] = useState<Record<string, any>>({});

  // Uploaded File state
  const [filesMap, setFilesMap] = useState<Record<string, File>>({});

  // Review & Submit state
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdRequestNumber, setCreatedRequestNumber] = useState<string | null>(null);
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);

  // Load Document Types
  useEffect(() => {
    async function load() {
      setLoadingDocTypes(true);
      const res = await publicService.getPublicDocumentTypes();
      if (res.success && res.data) {
        setDocTypes(res.data);
        if (preselectedDocId) {
          const found = res.data.find((d) => d._id === preselectedDocId);
          if (found) {
            setSelectedDocType(found);
            setStep(2);
          }
        }
      }
      setLoadingDocTypes(false);
    }
    load();
  }, [preselectedDocId]);

  // Pre-fill citizen user data when available
  useEffect(() => {
    if (user && Object.keys(appData).length === 0) {
      setAppData({
        applicantName: `${user.firstName} ${user.lastName}`.trim(),
        mobileNumber: user.mobileNumber || '',
        emailAddress: user.email || '',
        address: user.address || '',
        city: user.city || '',
        district: user.district || '',
        state: user.state || '',
        pincode: user.pincode || ''
      });
    }
  }, [user]);

  const handleFieldChange = (key: string, value: any) => {
    setAppData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (docName: string, file: File | null) => {
    if (file) {
      setFilesMap((prev) => ({ ...prev, [docName]: file }));
    } else {
      setFilesMap((prev) => {
        const copy = { ...prev };
        delete copy[docName];
        return copy;
      });
    }
  };

  const handleSubmitApplication = async () => {
    if (!selectedDocType || !declarationAccepted) return;

    setSubmitting(true);
    setSubmitError(null);

    const formData = new FormData();
    formData.append('documentTypeId', selectedDocType._id);
    formData.append('applicationData', JSON.stringify(appData));

    // Append all selected files
    Object.keys(filesMap).forEach((docName) => {
      formData.append(docName, filesMap[docName]);
    });

    const res = await requestService.submitRequest(formData);
    setSubmitting(false);

    if (res.success && res.data) {
      setCreatedRequestNumber(res.data.requestNumber);
      setCreatedRequestId(res.data._id);
      setStep(5); // Success step
    } else {
      setSubmitError(res.message || 'Application submission failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Wizard Header Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Step {step} of 4:</span>
            <span className="font-bold text-slate-900">
              {step === 1 && 'Select Certificate'}
              {step === 2 && 'Fill Application Details'}
              {step === 3 && 'Upload Required Proofs'}
              {step === 4 && 'Review & Declarations'}
              {step === 5 && 'Application Submitted'}
            </span>
          </div>

          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-700 h-full transition-all duration-300"
              style={{ width: `${(Math.min(step, 4) / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Select Document Type */}
        {step === 1 && (
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">Select Government Document to Apply</h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose the statutory certificate you require. The portal will automatically configure the appropriate application form and document checklist.
              </p>
            </div>

            {loadingDocTypes ? (
              <div className="text-center py-12 text-slate-500 text-xs">Loading certificate catalog...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docTypes.map((doc) => (
                  <div
                    key={doc._id}
                    onClick={() => {
                      setSelectedDocType(doc);
                    }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedDocType?._id === doc._id
                        ? 'border-blue-700 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-semibold text-blue-900">{doc.department.split(' ')[0]}</span>
                      <span className="font-mono">{doc.processingTime} Days SLA</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{doc.name}</h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{doc.description}</p>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Statutory Fee:</span>
                      <span className="font-bold text-slate-900">
                        {doc.fee === 0 ? 'Free' : `₹${doc.fee}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                disabled={!selectedDocType}
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
              >
                Continue to Application Form
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Document Specific Application Data */}
        {step === 2 && selectedDocType && (
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
              <div>
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">
                  Application Form
                </span>
                <h2 className="text-xl font-bold text-slate-900">{selectedDocType.name}</h2>
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-400 block">Department</span>
                <span className="font-semibold text-slate-700">{selectedDocType.department}</span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Common Section: Applicant Details */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  1. Applicant Identity & Contact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Applicant Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={appData.applicantName || ''}
                      onChange={(e) => handleFieldChange('applicantName', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Father's / Mother's / Guardian's Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={appData.parentName || ''}
                      onChange={(e) => handleFieldChange('parentName', e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Contact Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={appData.mobileNumber || ''}
                      onChange={(e) => handleFieldChange('mobileNumber', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email Address (for notifications) *
                    </label>
                    <input
                      type="email"
                      required
                      value={appData.emailAddress || ''}
                      onChange={(e) => handleFieldChange('emailAddress', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Document-Specific Section */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  2. Document-Specific Declarations ({selectedDocType.name})
                </h3>

                {selectedDocType.name.toLowerCase().includes('income') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Gross Annual Family Income (INR) *
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 450000"
                        value={appData.annualIncome || ''}
                        onChange={(e) => handleFieldChange('annualIncome', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Primary Occupation / Source of Livelihood *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Private Service, Agriculture, Self Employed"
                        value={appData.occupation || ''}
                        onChange={(e) => handleFieldChange('occupation', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Purpose of Income Certificate *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Higher Education Scholarship, EWS Admission, Ration Subsidy"
                        value={appData.purposeOfCertificate || ''}
                        onChange={(e) => handleFieldChange('purposeOfCertificate', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {selectedDocType.name.toLowerCase().includes('caste') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Social Category *
                      </label>
                      <select
                        value={appData.casteCategory || 'OBC'}
                        onChange={(e) => handleFieldChange('casteCategory', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="SC">Scheduled Caste (SC)</option>
                        <option value="ST">Scheduled Tribe (ST)</option>
                        <option value="OBC">Other Backward Class (OBC)</option>
                        <option value="SBC">Special Backward Category (SBC)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Sub-Caste Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Kunbi / Vankar / Meena"
                        value={appData.subCaste || ''}
                        onChange={(e) => handleFieldChange('subCaste', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Ancestral Village / Native Place
                      </label>
                      <input
                        type="text"
                        placeholder="Village / Tehsil of father's birth"
                        value={appData.ancestralVillage || ''}
                        onChange={(e) => handleFieldChange('ancestralVillage', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {selectedDocType.name.toLowerCase().includes('domicile') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Residing in State Since (Year) *
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 2008"
                        value={appData.residingSinceYear || ''}
                        onChange={(e) => handleFieldChange('residingSinceYear', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Place of Birth *
                      </label>
                      <input
                        type="text"
                        placeholder="City, District, State"
                        value={appData.placeOfBirth || ''}
                        onChange={(e) => handleFieldChange('placeOfBirth', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {selectedDocType.name.toLowerCase().includes('birth') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Child's Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Child's full name"
                        value={appData.childName || ''}
                        onChange={(e) => handleFieldChange('childName', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        value={appData.dateOfBirth || ''}
                        onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Hospital / Place of Birth *
                      </label>
                      <input
                        type="text"
                        placeholder="Hospital Name, Ward, City"
                        value={appData.hospitalName || ''}
                        onChange={(e) => handleFieldChange('hospitalName', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {!selectedDocType.name.toLowerCase().includes('income') &&
                  !selectedDocType.name.toLowerCase().includes('caste') &&
                  !selectedDocType.name.toLowerCase().includes('domicile') &&
                  !selectedDocType.name.toLowerCase().includes('birth') && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Reason / Purpose of Certificate Application *
                        </label>
                        <textarea
                          rows={3}
                          value={appData.generalPurpose || ''}
                          onChange={(e) => handleFieldChange('generalPurpose', e.target.value)}
                          placeholder="Provide details explaining the statutory purpose of this certificate..."
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
              </div>

              {/* Residential District */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  3. Jurisdiction & Address
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Address *</label>
                    <input
                      type="text"
                      value={appData.address || ''}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">District *</label>
                    <input
                      type="text"
                      value={appData.district || ''}
                      onChange={(e) => handleFieldChange('district', e.target.value)}
                      placeholder="e.g. Mumbai Suburban"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Pincode *</label>
                    <input
                      type="text"
                      value={appData.pincode || ''}
                      onChange={(e) => handleFieldChange('pincode', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Selection
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
              >
                Continue to Document Uploads
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Required Document Uploads */}
        {step === 3 && selectedDocType && (
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">Upload Required Documents</h2>
              <p className="text-xs text-slate-500 mt-1">
                Please attach clear scanned copies in PDF, JPG, JPEG, or PNG format (Max 5MB per file). These files will be electronically verified by the departmental desk.
              </p>
            </div>

            <div className="space-y-4">
              {selectedDocType.requiredDocuments?.map((reqDoc, idx) => {
                const currentFile = filesMap[reqDoc.name];

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-blue-700 shrink-0" />
                        <span className="font-bold text-sm text-slate-900">{reqDoc.name}</span>
                        {reqDoc.isRequired ? (
                          <span className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded font-bold uppercase">
                            Mandatory *
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            Optional
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{reqDoc.description}</p>
                      <span className="text-[10px] text-slate-400 font-mono block mt-1">
                        Allowed: {reqDoc.allowedFileTypes?.join(', ').toUpperCase()} · Max {reqDoc.maxFileSize}MB
                      </span>
                    </div>

                    <div className="w-full sm:w-auto shrink-0">
                      {currentFile ? (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-xs text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-medium truncate max-w-44">{currentFile.name}</span>
                          <button
                            type="button"
                            onClick={() => handleFileChange(reqDoc.name, null)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors">
                          <Upload className="w-3.5 h-3.5 text-blue-700" />
                          Select File
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileChange(reqDoc.name, file);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Form Details
              </button>

              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
              >
                Review & Confirm
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review Summary & Declaration */}
        {step === 4 && selectedDocType && (
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">Review Application Summary</h2>
              <p className="text-xs text-slate-500 mt-1">
                Carefully verify your entries before submitting to the departmental registry.
              </p>
            </div>

            {submitError && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="space-y-6">
              {/* Summary Overview */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Certificate Type</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedDocType.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Issuing Department</span>
                    <span className="font-semibold text-slate-800">{selectedDocType.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Expected Processing SLA</span>
                    <span className="font-semibold text-blue-900">{selectedDocType.processingTime} Days</span>
                  </div>
                </div>
              </div>

              {/* Form Data Summary */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Declared Information
                </h4>
                <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {Object.keys(appData).map((key) => (
                    <div key={key}>
                      <span className="text-slate-400 capitalize block">
                        {key.replace(/([A-Z])/g, ' $1')}:
                      </span>
                      <span className="font-semibold text-slate-800">{String(appData[key])}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enclosures Summary */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Attached Supporting Documents ({Object.keys(filesMap).length})
                </h4>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
                  {Object.keys(filesMap).length === 0 ? (
                    <div className="p-3 text-slate-400 italic">No files attached.</div>
                  ) : (
                    Object.keys(filesMap).map((docName) => (
                      <div key={docName} className="p-3 flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{docName}</span>
                        <span className="font-mono text-slate-500">{filesMap[docName].name}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Statutory Processing Fee</span>
                  <span className="text-slate-500">Government service charge as per schedule</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-blue-900">
                    {selectedDocType.fee === 0 ? 'Free (₹0)' : `₹${selectedDocType.fee}`}
                  </span>
                </div>
              </div>

              {/* Statutory Declaration Checkbox */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declarationAccepted}
                    onChange={(e) => setDeclarationAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-700 leading-relaxed">
                    <strong>Statutory Citizen Declaration:</strong> I hereby declare that all particulars and documents submitted in this application are true, correct, and authentic to the best of my knowledge and belief. I acknowledge that furnishing any false statement or fabricated document constitutes an offense under the law and will lead to summary cancellation of the request.
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Uploads
              </button>

              <button
                type="button"
                disabled={!declarationAccepted || submitting}
                onClick={handleSubmitApplication}
                className="px-8 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 shadow-md transition-colors"
              >
                {submitting ? 'Registering Application...' : 'Submit Application Now'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Success & Receipt */}
        {step === 5 && createdRequestNumber && (
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Application Submitted Successfully
            </span>

            <h2 className="text-2xl font-bold text-slate-900 mt-3">
              Your Application is Now in Departmental Queue
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Please save your official application reference number below for all future tracking and status inquiries.
            </p>

            {/* Reference Number Box */}
            <div className="my-6 p-4 rounded-xl bg-slate-900 text-amber-400 font-mono text-xl sm:text-2xl font-black tracking-widest max-w-md mx-auto shadow-inner">
              {createdRequestNumber}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <Link
                to={`/track-request?ref=${createdRequestNumber}`}
                className="px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-colors shadow-xs"
              >
                Track Live Status →
              </Link>
              <Link
                to={`/citizen/requests/${createdRequestId}`}
                className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
              >
                View Request Details
              </Link>
              <Link
                to="/citizen/dashboard"
                className="px-6 py-2.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium transition-colors"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
