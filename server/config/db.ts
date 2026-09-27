import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'govtrack_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface DatabaseState {
  users: any[];
  documentTypes: any[];
  requests: any[];
  statusHistories: any[];
  notifications: any[];
  auditLogs: any[];
}

const defaultState: DatabaseState = {
  users: [],
  documentTypes: [],
  requests: [],
  statusHistories: [],
  notifications: [],
  auditLogs: []
};

class JsonDocumentStore {
  private state: DatabaseState = { ...defaultState };
  private initialized = false;

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.state = {
          users: parsed.users || [],
          documentTypes: parsed.documentTypes || [],
          requests: parsed.requests || [],
          statusHistories: parsed.statusHistories || [],
          notifications: parsed.notifications || [],
          auditLogs: parsed.auditLogs || []
        };
      } else {
        this.save();
      }
      this.initialized = true;
    } catch (err) {
      console.error('Error reading JSON DB file, initializing fresh store:', err);
      this.state = { ...defaultState };
      this.save();
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write JSON DB:', err);
    }
  }

  public getCollection(name: keyof DatabaseState): any[] {
    return this.state[name] || [];
  }

  public setCollection(name: keyof DatabaseState, data: any[]) {
    this.state[name] = data;
    this.save();
  }

  public getState(): DatabaseState {
    return this.state;
  }
}

export const jsonStore = new JsonDocumentStore();

export let isUsingMongo = false;

export async function connectDB(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;
  if (mongoUri && mongoUri.startsWith('mongodb')) {
    try {
      console.log('Connecting to MongoDB at:', mongoUri);
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
      isUsingMongo = true;
      console.log('✅ Connected to MongoDB successfully.');
      return;
    } catch (err: any) {
      console.warn('⚠️ Could not connect to external MongoDB (' + err.message + '). Falling back to embedded persistent document store.');
    }
  }
  console.log('📁 Using GovTrack embedded persistent document store (data/govtrack_db.json)');
  isUsingMongo = false;
}
