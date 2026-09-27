import mongoose, { Schema } from 'mongoose';
import { isUsingMongo, jsonStore, DatabaseState } from '../config/db.js';

// Types
export interface IUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  password?: string;
  role: 'citizen' | 'admin';
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

export interface IRequiredDocumentSpec {
  name: string;
  description: string;
  isRequired: boolean;
  allowedFileTypes: string[];
  maxFileSize: number; // in MB
}

export interface IDocumentType {
  _id: string;
  name: string;
  description: string;
  department: string;
  processingTime: number; // in days
  fee: number;
  requiredDocuments: IRequiredDocumentSpec[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IUploadedDocument {
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

export interface IFinalDocument {
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

export interface IRequest {
  _id: string;
  requestNumber: string;
  citizen: string | IUser;
  documentType: string | IDocumentType;
  applicationData: Record<string, any>;
  uploadedDocuments: IUploadedDocument[];
  status: RequestStatus;
  currentDepartment: string;
  assignedOfficer?: string;
  remarks?: string;
  rejectionReason?: string;
  finalDocument?: IFinalDocument | null;
  submittedAt: string;
  lastUpdatedAt: string;
  completedAt?: string | null;
  expectedCompletionDate: string;
}

export interface IRequestStatusHistory {
  _id: string;
  request: string | IRequest;
  oldStatus: string;
  newStatus: string;
  changedBy: string | IUser;
  changedByRole: 'citizen' | 'admin' | 'system';
  remarks?: string;
  timestamp: string;
}

export interface INotification {
  _id: string;
  user: string | IUser;
  title: string;
  message: string;
  type: string;
  request?: string | IRequest;
  isRead: boolean;
  createdAt: string;
}

export interface IAuditLog {
  _id: string;
  user: string | IUser;
  action: string;
  request?: string | IRequest;
  description: string;
  ipAddress?: string;
  timestamp: string;
}

// Helpers for JSON-based mock DB engine that replicates Mongoose Model methods
function generateId(): string {
  return Math.random().toString(16).substring(2, 10) + Date.now().toString(16);
}

function matchFilter(doc: any, filter: Record<string, any>): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const key of Object.keys(filter)) {
    const val = filter[key];

    if (key === '$or' && Array.isArray(val)) {
      const orMatched = val.some((subFilter) => matchFilter(doc, subFilter));
      if (!orMatched) return false;
      continue;
    }

    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof RegExp)) {
      if (val.$in && Array.isArray(val.$in)) {
        const docVal = doc[key];
        const stringDocVal = String(docVal?._id || docVal);
        const match = val.$in.some((item: any) => String(item) === stringDocVal);
        if (!match) return false;
        continue;
      }
      if (val.$gte !== undefined && doc[key] < val.$gte) return false;
      if (val.$lte !== undefined && doc[key] > val.$lte) return false;
      if (val.$ne !== undefined && doc[key] === val.$ne) return false;
      continue;
    }

    if (val instanceof RegExp) {
      if (!val.test(String(doc[key] || ''))) return false;
      continue;
    }

    // Direct comparison (handling object id strings or objects)
    const docVal = doc[key];
    const targetVal = val;
    if (docVal && typeof docVal === 'object' && docVal._id) {
      if (String(docVal._id) !== String(targetVal)) return false;
    } else if (String(docVal) !== String(targetVal)) {
      return false;
    }
  }

  return true;
}

class QueryBuilder<T> {
  private collectionName: keyof DatabaseState;
  private filter: Record<string, any>;
  private sortField: string = '';
  private sortDir: number = -1;
  private skipCount: number = 0;
  private limitCount: number = 0;
  private populateFields: string[] = [];

  constructor(collectionName: keyof DatabaseState, filter: Record<string, any> = {}) {
    this.collectionName = collectionName;
    this.filter = filter;
  }

  sort(sortObj: Record<string, number> | string) {
    if (typeof sortObj === 'string') {
      const isDesc = sortObj.startsWith('-');
      this.sortField = isDesc ? sortObj.substring(1) : sortObj;
      this.sortDir = isDesc ? -1 : 1;
    } else {
      const firstKey = Object.keys(sortObj)[0];
      if (firstKey) {
        this.sortField = firstKey;
        this.sortDir = sortObj[firstKey];
      }
    }
    return this;
  }

  skip(count: number) {
    this.skipCount = count;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  populate(field: string | string[]) {
    if (Array.isArray(field)) {
      this.populateFields.push(...field);
    } else {
      this.populateFields.push(field);
    }
    return this;
  }

  lean() {
    return this;
  }

  private execute(): T[] {
    const rawList = jsonStore.getCollection(this.collectionName);
    let results = rawList.filter((item) => matchFilter(item, this.filter));

    // Sort
    if (this.sortField) {
      results.sort((a, b) => {
        const valA = a[this.sortField];
        const valB = b[this.sortField];
        if (valA < valB) return -1 * this.sortDir;
        if (valA > valB) return 1 * this.sortDir;
        return 0;
      });
    }

    // Skip
    if (this.skipCount > 0) {
      results = results.slice(this.skipCount);
    }

    // Limit
    if (this.limitCount > 0) {
      results = results.slice(0, this.limitCount);
    }

    // Deep clone to avoid mutating store inadvertently
    let mapped = JSON.parse(JSON.stringify(results));

    // Populate
    if (this.populateFields.length > 0) {
      const users = jsonStore.getCollection('users');
      const docTypes = jsonStore.getCollection('documentTypes');
      const requests = jsonStore.getCollection('requests');

      for (const item of mapped) {
        for (const field of this.populateFields) {
          if (field === 'citizen' || field === 'user' || field === 'changedBy') {
            const targetId = item[field]?._id || item[field];
            const foundUser = users.find((u) => u._id === String(targetId));
            if (foundUser) {
              const { password, ...safeUser } = foundUser;
              item[field] = safeUser;
            }
          } else if (field === 'documentType') {
            const targetId = item[field]?._id || item[field];
            const foundDt = docTypes.find((d) => d._id === String(targetId));
            if (foundDt) {
              item[field] = foundDt;
            }
          } else if (field === 'request') {
            const targetId = item[field]?._id || item[field];
            const foundReq = requests.find((r) => r._id === String(targetId));
            if (foundReq) {
              item[field] = foundReq;
            }
          }
        }
      }
    }

    return mapped;
  }

  then<TResult1 = T[], TResult2 = never>(
    onfulfilled?: ((value: T[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }

  async exec(): Promise<T[]> {
    return this.execute();
  }
}

class SingleQueryBuilder<T> {
  private queryBuilder: QueryBuilder<T>;

  constructor(collectionName: keyof DatabaseState, filter: Record<string, any>) {
    this.queryBuilder = new QueryBuilder<T>(collectionName, filter);
  }

  populate(field: string | string[]) {
    this.queryBuilder.populate(field);
    return this;
  }

  lean() {
    return this;
  }

  then<TResult1 = T | null, TResult2 = never>(
    onfulfilled?: ((value: T | null) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.queryBuilder.exec().then((results) => {
      const doc = results.length > 0 ? results[0] : null;
      return onfulfilled ? onfulfilled(doc) : (doc as any);
    }, onrejected);
  }

  async exec(): Promise<T | null> {
    const list = await this.queryBuilder.exec();
    return list.length > 0 ? list[0] : null;
  }
}

export function createModelAdapter<T extends { _id: string }>(collectionName: keyof DatabaseState) {
  return {
    find(filter: Record<string, any> = {}) {
      return new QueryBuilder<T>(collectionName, filter);
    },

    findOne(filter: Record<string, any>) {
      return new SingleQueryBuilder<T>(collectionName, filter);
    },

    findById(id: string) {
      return new SingleQueryBuilder<T>(collectionName, { _id: id });
    },

    async create(doc: Partial<T>): Promise<T> {
      const collection = jsonStore.getCollection(collectionName);
      const now = new Date().toISOString();
      const newDoc: any = {
        _id: doc._id || generateId(),
        ...doc,
        createdAt: (doc as any).createdAt || now,
        updatedAt: now
      };
      collection.push(newDoc);
      jsonStore.setCollection(collectionName, collection);
      return JSON.parse(JSON.stringify(newDoc));
    },

    async insertMany(docs: Partial<T>[]): Promise<T[]> {
      const collection = jsonStore.getCollection(collectionName);
      const now = new Date().toISOString();
      const created: any[] = docs.map((d) => ({
        _id: d._id || generateId(),
        ...d,
        createdAt: (d as any).createdAt || now,
        updatedAt: now
      }));
      collection.push(...created);
      jsonStore.setCollection(collectionName, collection);
      return JSON.parse(JSON.stringify(created));
    },

    async findByIdAndUpdate(id: string, update: any, options: { new?: boolean } = { new: true }): Promise<T | null> {
      const collection = jsonStore.getCollection(collectionName);
      const index = collection.findIndex((item) => String(item._id) === String(id));
      if (index === -1) return null;

      const now = new Date().toISOString();
      const existing = collection[index];

      // Handle MongoDB update operators like $set, $push
      let updated = { ...existing };
      if (update.$set) {
        updated = { ...updated, ...update.$set, updatedAt: now };
      } else {
        updated = { ...updated, ...update, updatedAt: now };
      }

      if (update.$push) {
        for (const pushKey of Object.keys(update.$push)) {
          updated[pushKey] = updated[pushKey] || [];
          updated[pushKey].push(update.$push[pushKey]);
        }
      }

      collection[index] = updated;
      jsonStore.setCollection(collectionName, collection);
      return JSON.parse(JSON.stringify(options.new ? updated : existing));
    },

    async findOneAndUpdate(filter: Record<string, any>, update: any, options: { new?: boolean } = { new: true }): Promise<T | null> {
      const doc = await this.findOne(filter).exec();
      if (!doc) return null;
      return this.findByIdAndUpdate(doc._id, update, options);
    },

    async findByIdAndDelete(id: string): Promise<T | null> {
      const collection = jsonStore.getCollection(collectionName);
      const index = collection.findIndex((item) => String(item._id) === String(id));
      if (index === -1) return null;
      const [removed] = collection.splice(index, 1);
      jsonStore.setCollection(collectionName, collection);
      return JSON.parse(JSON.stringify(removed));
    },

    async countDocuments(filter: Record<string, any> = {}): Promise<number> {
      const collection = jsonStore.getCollection(collectionName);
      return collection.filter((item) => matchFilter(item, filter)).length;
    },

    async deleteMany(filter: Record<string, any> = {}): Promise<{ deletedCount: number }> {
      const collection = jsonStore.getCollection(collectionName);
      const remaining = collection.filter((item) => !matchFilter(item, filter));
      const deletedCount = collection.length - remaining.length;
      jsonStore.setCollection(collectionName, remaining);
      return { deletedCount };
    }
  };
}

// Export Models
export const UserModel = createModelAdapter<IUser>('users');
export const DocumentTypeModel = createModelAdapter<IDocumentType>('documentTypes');
export const RequestModel = createModelAdapter<IRequest>('requests');
export const RequestStatusHistoryModel = createModelAdapter<IRequestStatusHistory>('statusHistories');
export const NotificationModel = createModelAdapter<INotification>('notifications');
export const AuditLogModel = createModelAdapter<IAuditLog>('auditLogs');
