export type UserRole = 'citizen' | 'admin';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  role: UserRole;
  profilePhoto?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RequiredDocumentSpec {
  name: string;
  description: string;
  isRequired: boolean;
  allowedFileTypes: string[];
  maxFileSize: number; // in MB
}

export interface DocumentType {
  _id: string;
  name: string;
  description: string;
  department: string;
  processingTime: number; // in days
  fee: number;
  requiredDocuments: RequiredDocumentSpec[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedDocument {
  _id: string;
  documentType: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedBy: string;
  uploadedAt: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verificationRemarks?: string;
}

export interface FinalDocument {
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedAt: string;
}

export type RequestStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'DOCUMENT_VERIFICATION'
  | 'ADDITIONAL_DOCUMENT_REQUIRED'
  | 'PROCESSING'
  | 'APPROVED'
  | 'REJECTED'
  | 'READY_FOR_DOWNLOAD'
  | 'COMPLETED'
  | 'CANCELLED';

export interface RequestItem {
  _id: string;
  requestNumber: string;
  citizen: User | string;
  documentType: DocumentType | string;
  applicationData: Record<string, any>;
  uploadedDocuments: UploadedDocument[];
  status: RequestStatus;
  currentDepartment: string;
  assignedOfficer?: string;
  remarks?: string;
  rejectionReason?: string;
  finalDocument?: FinalDocument | null;
  submittedAt: string;
  lastUpdatedAt: string;
  completedAt?: string | null;
  expectedCompletionDate: string;
  statusHistory?: RequestStatusHistory[];
}

export interface RequestStatusHistory {
  _id: string;
  request: string;
  oldStatus: string;
  newStatus: string;
  changedBy: User | string;
  changedByRole: 'citizen' | 'admin' | 'system';
  remarks?: string;
  timestamp: string;
}

export interface NotificationItem {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: string;
  request?: RequestItem | string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  _id: string;
  user: User | string;
  action: string;
  request?: RequestItem | string;
  description: string;
  ipAddress?: string;
  timestamp: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardSummary {
  total: number;
  pending: number;
  underReview: number;
  documentVerification: number;
  processing: number;
  approved: number;
  rejected: number;
  readyForDownload: number;
  completed: number;
  cancelled: number;
  approvalRate: number;
}

export interface AdminDashboardData {
  summary: DashboardSummary;
  requestsByStatus: { name: string; rawStatus: string; count: number }[];
  requestsByDocumentType: { name: string; count: number }[];
  requestsPerMonth: { month: string; count: number }[];
  recentRequests: RequestItem[];
}
