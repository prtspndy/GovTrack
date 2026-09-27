// server.ts
import "dotenv/config";

// server/app.ts
import express from "express";
import cors from "cors";

// server/routes/authRoutes.ts
import { Router } from "express";

// server/config/db.ts
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
var DATA_DIR = path.resolve(process.cwd(), "data");
var DB_FILE = path.join(DATA_DIR, "govtrack_db.json");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
var defaultState = {
  users: [],
  documentTypes: [],
  requests: [],
  statusHistories: [],
  notifications: [],
  auditLogs: []
};
var JsonDocumentStore = class {
  constructor() {
    this.state = { ...defaultState };
    this.initialized = false;
    this.load();
  }
  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
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
      console.error("Error reading JSON DB file, initializing fresh store:", err);
      this.state = { ...defaultState };
      this.save();
    }
  }
  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to write JSON DB:", err);
    }
  }
  getCollection(name) {
    return this.state[name] || [];
  }
  setCollection(name, data) {
    this.state[name] = data;
    this.save();
  }
  getState() {
    return this.state;
  }
};
var jsonStore = new JsonDocumentStore();
var isUsingMongo = false;
async function connectDB() {
  const mongoUri = process.env.MONGO_URI;
  if (mongoUri && mongoUri.startsWith("mongodb")) {
    try {
      console.log("Connecting to MongoDB at:", mongoUri);
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2e3 });
      isUsingMongo = true;
      console.log("\u2705 Connected to MongoDB successfully.");
      return;
    } catch (err) {
      console.warn("\u26A0\uFE0F Could not connect to external MongoDB (" + err.message + "). Falling back to embedded persistent document store.");
    }
  }
  console.log("\u{1F4C1} Using GovTrack embedded persistent document store (data/govtrack_db.json)");
  isUsingMongo = false;
}

// server/models/index.ts
function generateId() {
  return Math.random().toString(16).substring(2, 10) + Date.now().toString(16);
}
function matchFilter(doc, filter) {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const key of Object.keys(filter)) {
    const val = filter[key];
    if (key === "$or" && Array.isArray(val)) {
      const orMatched = val.some((subFilter) => matchFilter(doc, subFilter));
      if (!orMatched) return false;
      continue;
    }
    if (val && typeof val === "object" && !Array.isArray(val) && !(val instanceof RegExp)) {
      if (val.$in && Array.isArray(val.$in)) {
        const docVal2 = doc[key];
        const stringDocVal = String(docVal2?._id || docVal2);
        const match = val.$in.some((item) => String(item) === stringDocVal);
        if (!match) return false;
        continue;
      }
      if (val.$gte !== void 0 && doc[key] < val.$gte) return false;
      if (val.$lte !== void 0 && doc[key] > val.$lte) return false;
      if (val.$ne !== void 0 && doc[key] === val.$ne) return false;
      continue;
    }
    if (val instanceof RegExp) {
      if (!val.test(String(doc[key] || ""))) return false;
      continue;
    }
    const docVal = doc[key];
    const targetVal = val;
    if (docVal && typeof docVal === "object" && docVal._id) {
      if (String(docVal._id) !== String(targetVal)) return false;
    } else if (String(docVal) !== String(targetVal)) {
      return false;
    }
  }
  return true;
}
var QueryBuilder = class {
  constructor(collectionName, filter = {}) {
    this.sortField = "";
    this.sortDir = -1;
    this.skipCount = 0;
    this.limitCount = 0;
    this.populateFields = [];
    this.collectionName = collectionName;
    this.filter = filter;
  }
  sort(sortObj) {
    if (typeof sortObj === "string") {
      const isDesc = sortObj.startsWith("-");
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
  skip(count) {
    this.skipCount = count;
    return this;
  }
  limit(count) {
    this.limitCount = count;
    return this;
  }
  populate(field) {
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
  execute() {
    const rawList = jsonStore.getCollection(this.collectionName);
    let results = rawList.filter((item) => matchFilter(item, this.filter));
    if (this.sortField) {
      results.sort((a, b) => {
        const valA = a[this.sortField];
        const valB = b[this.sortField];
        if (valA < valB) return -1 * this.sortDir;
        if (valA > valB) return 1 * this.sortDir;
        return 0;
      });
    }
    if (this.skipCount > 0) {
      results = results.slice(this.skipCount);
    }
    if (this.limitCount > 0) {
      results = results.slice(0, this.limitCount);
    }
    let mapped = JSON.parse(JSON.stringify(results));
    if (this.populateFields.length > 0) {
      const users = jsonStore.getCollection("users");
      const docTypes = jsonStore.getCollection("documentTypes");
      const requests = jsonStore.getCollection("requests");
      for (const item of mapped) {
        for (const field of this.populateFields) {
          if (field === "citizen" || field === "user" || field === "changedBy") {
            const targetId = item[field]?._id || item[field];
            const foundUser = users.find((u) => u._id === String(targetId));
            if (foundUser) {
              const { password, ...safeUser } = foundUser;
              item[field] = safeUser;
            }
          } else if (field === "documentType") {
            const targetId = item[field]?._id || item[field];
            const foundDt = docTypes.find((d) => d._id === String(targetId));
            if (foundDt) {
              item[field] = foundDt;
            }
          } else if (field === "request") {
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
  then(onfulfilled, onrejected) {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
  async exec() {
    return this.execute();
  }
};
var SingleQueryBuilder = class {
  constructor(collectionName, filter) {
    this.queryBuilder = new QueryBuilder(collectionName, filter);
  }
  populate(field) {
    this.queryBuilder.populate(field);
    return this;
  }
  lean() {
    return this;
  }
  then(onfulfilled, onrejected) {
    return this.queryBuilder.exec().then((results) => {
      const doc = results.length > 0 ? results[0] : null;
      return onfulfilled ? onfulfilled(doc) : doc;
    }, onrejected);
  }
  async exec() {
    const list = await this.queryBuilder.exec();
    return list.length > 0 ? list[0] : null;
  }
};
function createModelAdapter(collectionName) {
  return {
    find(filter = {}) {
      return new QueryBuilder(collectionName, filter);
    },
    findOne(filter) {
      return new SingleQueryBuilder(collectionName, filter);
    },
    findById(id) {
      return new SingleQueryBuilder(collectionName, { _id: id });
    },
    async create(doc) {
      const collection = jsonStore.getCollection(collectionName);
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const newDoc = {
        _id: doc._id || generateId(),
        ...doc,
        createdAt: doc.createdAt || now,
        updatedAt: now
      };
      collection.push(newDoc);
      jsonStore.setCollection(collectionName, collection);
      return JSON.parse(JSON.stringify(newDoc));
    },
    async insertMany(docs) {
      const collection = jsonStore.getCollection(collectionName);
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const created = docs.map((d) => ({
        _id: d._id || generateId(),
        ...d,
        createdAt: d.createdAt || now,
        updatedAt: now
      }));
      collection.push(...created);
      jsonStore.setCollection(collectionName, collection);
      return JSON.parse(JSON.stringify(created));
    },
    async findByIdAndUpdate(id, update, options = { new: true }) {
      const collection = jsonStore.getCollection(collectionName);
      const index = collection.findIndex((item) => String(item._id) === String(id));
      if (index === -1) return null;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const existing = collection[index];
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
    async findOneAndUpdate(filter, update, options = { new: true }) {
      const doc = await this.findOne(filter).exec();
      if (!doc) return null;
      return this.findByIdAndUpdate(doc._id, update, options);
    },
    async findByIdAndDelete(id) {
      const collection = jsonStore.getCollection(collectionName);
      const index = collection.findIndex((item) => String(item._id) === String(id));
      if (index === -1) return null;
      const [removed] = collection.splice(index, 1);
      jsonStore.setCollection(collectionName, collection);
      return JSON.parse(JSON.stringify(removed));
    },
    async countDocuments(filter = {}) {
      const collection = jsonStore.getCollection(collectionName);
      return collection.filter((item) => matchFilter(item, filter)).length;
    },
    async deleteMany(filter = {}) {
      const collection = jsonStore.getCollection(collectionName);
      const remaining = collection.filter((item) => !matchFilter(item, filter));
      const deletedCount = collection.length - remaining.length;
      jsonStore.setCollection(collectionName, remaining);
      return { deletedCount };
    }
  };
}
var UserModel = createModelAdapter("users");
var DocumentTypeModel = createModelAdapter("documentTypes");
var RequestModel = createModelAdapter("requests");
var RequestStatusHistoryModel = createModelAdapter("statusHistories");
var NotificationModel = createModelAdapter("notifications");
var AuditLogModel = createModelAdapter("auditLogs");

// server/utils/password.ts
import bcrypt from "bcryptjs";
async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}
async function comparePassword(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

// server/utils/jwt.ts
import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";
var configuredSecret = process.env.JWT_SECRET?.trim();
if (process.env.NODE_ENV === "production" && (!configuredSecret || configuredSecret.length < 32 || configuredSecret === "super_secret_jwt_key_govtrack_2026")) {
  console.warn("\u26A0\uFE0F Notice: JWT_SECRET not configured with >= 32 characters in production. Using generated runtime secret.");
}
var JWT_SECRET = configuredSecret && configuredSecret.length >= 16 ? configuredSecret : randomBytes(32).toString("hex");
var JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
function generateToken(payload) {
  const options = { expiresIn: JWT_EXPIRES_IN };
  return jwt.sign(payload, JWT_SECRET, options);
}
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// server/controllers/authController.ts
async function register(req, res) {
  try {
    const { firstName, lastName, email, mobileNumber, password, address, city, district, state, pincode } = req.body;
    if (!firstName || !lastName || !email || !mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields: firstName, lastName, email, mobileNumber, and password."
      });
    }
    const emailNorm = String(email).trim().toLowerCase();
    const existing = await UserModel.findOne({ email: emailNorm }).exec();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists."
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long."
      });
    }
    const hashedPassword = await hashPassword(password);
    const user = await UserModel.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: emailNorm,
      mobileNumber: mobileNumber.trim(),
      password: hashedPassword,
      role: "citizen",
      address: address?.trim() || "",
      city: city?.trim() || "",
      district: district?.trim() || "",
      state: state?.trim() || "",
      pincode: pincode?.trim() || "",
      isActive: true,
      isVerified: true
    });
    const token = generateToken({
      userId: user._id,
      role: user.role,
      email: user.email
    });
    await AuditLogModel.create({
      user: user._id,
      action: "CITIZEN_REGISTERED",
      description: `New citizen registration for ${user.firstName} ${user.lastName} (${user.email})`,
      ipAddress: req.ip || "127.0.0.1"
    });
    const { password: _, ...safeUser } = user;
    res.status(201).json({
      success: true,
      message: "Account registered successfully.",
      data: {
        user: safeUser,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Registration failed."
    });
  }
}
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }
    const emailNorm = String(email).trim().toLowerCase();
    const user = await UserModel.findOne({ email: emailNorm }).exec();
    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is deactivated. Please contact an administrator."
      });
    }
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }
    const token = generateToken({
      userId: user._id,
      role: user.role,
      email: user.email
    });
    await AuditLogModel.create({
      user: user._id,
      action: user.role === "admin" ? "ADMIN_LOGIN" : "CITIZEN_LOGIN",
      description: `${user.role.toUpperCase()} logged in: ${user.email}`,
      ipAddress: req.ip || "127.0.0.1"
    });
    const { password: _, ...safeUser } = user;
    res.json({
      success: true,
      message: "Logged in successfully.",
      data: {
        user: safeUser,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Login failed."
    });
  }
}
async function getMe(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { password: _, ...safeUser } = req.user;
    res.json({
      success: true,
      data: safeUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function updateProfile(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { firstName, lastName, mobileNumber, address, city, district, state, pincode, profilePhoto } = req.body;
    const updated = await UserModel.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          ...firstName && { firstName: firstName.trim() },
          ...lastName && { lastName: lastName.trim() },
          ...mobileNumber && { mobileNumber: mobileNumber.trim() },
          ...address !== void 0 && { address: address.trim() },
          ...city !== void 0 && { city: city.trim() },
          ...district !== void 0 && { district: district.trim() },
          ...state !== void 0 && { state: state.trim() },
          ...pincode !== void 0 && { pincode: pincode.trim() },
          ...profilePhoto !== void 0 && { profilePhoto }
        }
      },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    const { password: _, ...safeUser } = updated;
    res.json({
      success: true,
      message: "Profile updated successfully.",
      data: safeUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function logout(_req, res) {
  res.json({
    success: true,
    message: "Logged out successfully."
  });
}

// server/middleware/auth.ts
async function authenticateToken(req, res, next) {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required. Please login."
      });
    }
    const decoded = verifyToken(token);
    req.tokenPayload = decoded;
    const user = await UserModel.findById(decoded.userId).exec();
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "The user belonging to this token no longer exists."
      });
    }
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support."
      });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token."
    });
  }
}

// server/routes/authRoutes.ts
var router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authenticateToken, getMe);
router.patch("/profile", authenticateToken, updateProfile);
var authRoutes_default = router;

// server/routes/documentTypeRoutes.ts
import { Router as Router2 } from "express";

// server/controllers/documentTypeController.ts
async function getAllDocumentTypes(req, res) {
  try {
    const { includeInactive } = req.query;
    const filter = includeInactive === "true" ? {} : { isActive: true };
    const docTypes = await DocumentTypeModel.find(filter).sort({ name: 1 }).exec();
    res.json({
      success: true,
      data: docTypes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function getDocumentTypeById(req, res) {
  try {
    const { id } = req.params;
    const docType = await DocumentTypeModel.findById(id).exec();
    if (!docType) {
      return res.status(404).json({ success: false, message: "Document type not found." });
    }
    res.json({
      success: true,
      data: docType
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function createDocumentType(req, res) {
  try {
    const { name, description, department, processingTime, fee, requiredDocuments } = req.body;
    if (!name || !department || processingTime === void 0) {
      return res.status(400).json({
        success: false,
        message: "Name, department, and processingTime are required."
      });
    }
    const created = await DocumentTypeModel.create({
      name: name.trim(),
      description: description?.trim() || "",
      department: department.trim(),
      processingTime: Number(processingTime),
      fee: Number(fee || 0),
      requiredDocuments: Array.isArray(requiredDocuments) ? requiredDocuments : [],
      isActive: true
    });
    if (req.user) {
      await AuditLogModel.create({
        user: req.user._id,
        action: "DOCUMENT_TYPE_CREATED",
        description: `Created document type: ${created.name} (${created.department})`,
        ipAddress: req.ip || "127.0.0.1"
      });
    }
    res.status(201).json({
      success: true,
      message: "Document type created successfully.",
      data: created
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function updateDocumentType(req, res) {
  try {
    const { id } = req.params;
    const { name, description, department, processingTime, fee, requiredDocuments, isActive } = req.body;
    const updated = await DocumentTypeModel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...name && { name: name.trim() },
          ...description !== void 0 && { description: description.trim() },
          ...department && { department: department.trim() },
          ...processingTime !== void 0 && { processingTime: Number(processingTime) },
          ...fee !== void 0 && { fee: Number(fee) },
          ...requiredDocuments && { requiredDocuments },
          ...isActive !== void 0 && { isActive: Boolean(isActive) }
        }
      },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: "Document type not found." });
    }
    if (req.user) {
      await AuditLogModel.create({
        user: req.user._id,
        action: "DOCUMENT_TYPE_UPDATED",
        description: `Updated document type: ${updated.name}`,
        ipAddress: req.ip || "127.0.0.1"
      });
    }
    res.json({
      success: true,
      message: "Document type updated successfully.",
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function toggleDocumentTypeStatus(req, res) {
  try {
    const { id } = req.params;
    const docType = await DocumentTypeModel.findById(id).exec();
    if (!docType) {
      return res.status(404).json({ success: false, message: "Document type not found." });
    }
    const updated = await DocumentTypeModel.findByIdAndUpdate(
      id,
      { $set: { isActive: !docType.isActive } },
      { new: true }
    );
    if (req.user) {
      await AuditLogModel.create({
        user: req.user._id,
        action: "DOCUMENT_TYPE_STATUS_TOGGLED",
        description: `Toggled document type status: ${docType.name} -> ${updated?.isActive ? "Active" : "Inactive"}`,
        ipAddress: req.ip || "127.0.0.1"
      });
    }
    res.json({
      success: true,
      message: `Document type is now ${updated?.isActive ? "active" : "inactive"}.`,
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// server/middleware/role.ts
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access is restricted to [${allowedRoles.join(", ")}].`
      });
    }
    next();
  };
}

// server/routes/documentTypeRoutes.ts
var router2 = Router2();
router2.get("/", getAllDocumentTypes);
router2.get("/:id", getDocumentTypeById);
router2.post("/", authenticateToken, authorizeRoles("admin"), createDocumentType);
router2.put("/:id", authenticateToken, authorizeRoles("admin"), updateDocumentType);
router2.patch("/:id/status", authenticateToken, authorizeRoles("admin"), toggleDocumentTypeStatus);
var documentTypeRoutes_default = router2;

// server/routes/requestRoutes.ts
import { Router as Router3 } from "express";

// server/controllers/requestController.ts
import path2 from "path";
import fs2 from "fs";

// server/utils/requestNumber.ts
async function generateRequestNumber() {
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const total = await RequestModel.countDocuments();
  const nextNum = total + 1;
  const padded = String(nextNum).padStart(6, "0");
  return `GOV-${currentYear}-${padded}`;
}

// server/services/statusWorkflow.ts
var VALID_STATUS_TRANSITIONS = {
  SUBMITTED: ["UNDER_REVIEW", "CANCELLED"],
  UNDER_REVIEW: ["DOCUMENT_VERIFICATION", "REJECTED"],
  DOCUMENT_VERIFICATION: ["ADDITIONAL_DOCUMENT_REQUIRED", "PROCESSING", "REJECTED"],
  ADDITIONAL_DOCUMENT_REQUIRED: ["DOCUMENT_VERIFICATION", "REJECTED", "CANCELLED"],
  PROCESSING: ["APPROVED", "REJECTED"],
  APPROVED: ["READY_FOR_DOWNLOAD", "REJECTED"],
  READY_FOR_DOWNLOAD: ["COMPLETED"],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: []
};
function isValidTransition(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) return true;
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}
function canCitizenCancel(status) {
  return status === "SUBMITTED";
}

// server/controllers/requestController.ts
async function createRequest(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { documentTypeId, applicationData: rawAppData } = req.body;
    if (!documentTypeId) {
      return res.status(400).json({ success: false, message: "Document type is required." });
    }
    const documentType = await DocumentTypeModel.findById(documentTypeId).exec();
    if (!documentType || !documentType.isActive) {
      return res.status(404).json({ success: false, message: "Selected document type is unavailable." });
    }
    let applicationData = {};
    if (typeof rawAppData === "string") {
      try {
        applicationData = JSON.parse(rawAppData);
      } catch {
        applicationData = {};
      }
    } else if (rawAppData && typeof rawAppData === "object") {
      applicationData = rawAppData;
    }
    const files = req.files;
    const uploadedDocuments = [];
    if (files && files.length > 0) {
      files.forEach((file, index) => {
        uploadedDocuments.push({
          _id: `doc_${Date.now()}_${index}`,
          documentType: file.fieldname || "Supporting Document",
          originalName: file.originalname,
          storedName: file.filename,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
          uploadedBy: req.user._id,
          uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
          verificationStatus: "PENDING"
        });
      });
    }
    const requestNumber = await generateRequestNumber();
    const now = /* @__PURE__ */ new Date();
    const expectedDate = new Date(now);
    expectedDate.setDate(expectedDate.getDate() + (documentType.processingTime || 7));
    const newRequest = await RequestModel.create({
      requestNumber,
      citizen: req.user._id,
      documentType: documentType._id,
      applicationData,
      uploadedDocuments,
      status: "SUBMITTED",
      currentDepartment: documentType.department,
      assignedOfficer: "Pending Assignment",
      remarks: "Application submitted online by citizen.",
      submittedAt: now.toISOString(),
      lastUpdatedAt: now.toISOString(),
      expectedCompletionDate: expectedDate.toISOString()
    });
    await RequestStatusHistoryModel.create({
      request: newRequest._id,
      oldStatus: "NONE",
      newStatus: "SUBMITTED",
      changedBy: req.user._id,
      changedByRole: "citizen",
      remarks: "Application submitted successfully via online citizen portal.",
      timestamp: now.toISOString()
    });
    await NotificationModel.create({
      user: req.user._id,
      title: "Application Submitted",
      message: `Your application for ${documentType.name} (${requestNumber}) has been submitted successfully.`,
      type: "STATUS_UPDATE",
      request: newRequest._id,
      isRead: false,
      createdAt: now.toISOString()
    });
    await AuditLogModel.create({
      user: req.user._id,
      action: "REQUEST_SUBMITTED",
      request: newRequest._id,
      description: `Citizen submitted request ${requestNumber} for ${documentType.name}`,
      ipAddress: req.ip || "127.0.0.1"
    });
    res.status(201).json({
      success: true,
      message: "Application submitted successfully.",
      data: newRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function getMyRequests(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.max(1, parseInt(String(req.query.limit || "10"), 10));
    const status = req.query.status;
    const search = req.query.search;
    const filter = {
      citizen: req.user._id
    };
    if (status && status !== "ALL") {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { requestNumber: new RegExp(search, "i") },
        { currentDepartment: new RegExp(search, "i") }
      ];
    }
    const total = await RequestModel.countDocuments(filter);
    const requests = await RequestModel.find(filter).populate(["documentType"]).sort({ submittedAt: -1 }).skip((page - 1) * limit).limit(limit).exec();
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function getRequestById(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { id } = req.params;
    const request = await RequestModel.findById(id).populate(["citizen", "documentType"]).exec();
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }
    const citizenId = request.citizen?._id || request.citizen;
    if (req.user.role === "citizen" && String(citizenId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You do not have permission to view this request."
      });
    }
    const statusHistory = await RequestStatusHistoryModel.find({ request: request._id }).populate(["changedBy"]).sort({ timestamp: 1 }).exec();
    res.json({
      success: true,
      data: {
        ...request,
        statusHistory
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function cancelRequest(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { id } = req.params;
    const request = await RequestModel.findById(id).exec();
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }
    const citizenId = request.citizen?._id || request.citizen;
    if (String(citizenId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    if (!canCitizenCancel(request.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel request at '${request.status}' stage. Cancellation is only permitted at SUBMITTED stage.`
      });
    }
    const oldStatus = request.status;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const updated = await RequestModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "CANCELLED",
          lastUpdatedAt: now,
          remarks: "Request cancelled by citizen."
        }
      },
      { new: true }
    );
    await RequestStatusHistoryModel.create({
      request: id,
      oldStatus,
      newStatus: "CANCELLED",
      changedBy: req.user._id,
      changedByRole: "citizen",
      remarks: "Application cancelled by applicant.",
      timestamp: now
    });
    await NotificationModel.create({
      user: req.user._id,
      title: "Request Cancelled",
      message: `Your application (${request.requestNumber}) was cancelled as requested.`,
      type: "STATUS_UPDATE",
      request: id,
      isRead: false,
      createdAt: now
    });
    await AuditLogModel.create({
      user: req.user._id,
      action: "REQUEST_CANCELLED",
      request: id,
      description: `Citizen cancelled request ${request.requestNumber}`,
      ipAddress: req.ip || "127.0.0.1"
    });
    res.json({
      success: true,
      message: "Request cancelled successfully.",
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function uploadAdditionalDocument(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { id } = req.params;
    const request = await RequestModel.findById(id).exec();
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }
    const citizenId = request.citizen?._id || request.citizen;
    if (String(citizenId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "Please select a document to upload." });
    }
    const docTypeLabel = req.body.documentType || "Additional Document";
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newDoc = {
      _id: `doc_${Date.now()}`,
      documentType: docTypeLabel,
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      uploadedBy: req.user._id,
      uploadedAt: now,
      verificationStatus: "PENDING",
      verificationRemarks: "Uploaded in response to officer request."
    };
    const oldStatus = request.status;
    const updated = await RequestModel.findByIdAndUpdate(
      id,
      {
        $push: { uploadedDocuments: newDoc },
        $set: {
          status: "DOCUMENT_VERIFICATION",
          lastUpdatedAt: now,
          remarks: `Additional document '${docTypeLabel}' submitted by citizen.`
        }
      },
      { new: true }
    );
    await RequestStatusHistoryModel.create({
      request: id,
      oldStatus,
      newStatus: "DOCUMENT_VERIFICATION",
      changedBy: req.user._id,
      changedByRole: "citizen",
      remarks: `Citizen submitted required additional document: ${docTypeLabel}`,
      timestamp: now
    });
    await NotificationModel.create({
      user: req.user._id,
      title: "Additional Document Received",
      message: `Your document '${docTypeLabel}' has been uploaded. Request has returned to Document Verification.`,
      type: "DOCUMENT_REQUIRED",
      request: id,
      isRead: false,
      createdAt: now
    });
    await AuditLogModel.create({
      user: req.user._id,
      action: "ADDITIONAL_DOC_UPLOADED",
      request: id,
      description: `Citizen uploaded additional document: ${docTypeLabel} (${request.requestNumber})`,
      ipAddress: req.ip || "127.0.0.1"
    });
    res.json({
      success: true,
      message: "Additional document uploaded successfully. Application returned to verification queue.",
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function downloadUploadedDocument(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { id, documentId } = req.params;
    const request = await RequestModel.findById(id).exec();
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }
    const citizenId = request.citizen?._id || request.citizen;
    if (req.user.role === "citizen" && String(citizenId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    const doc = request.uploadedDocuments?.find((d) => String(d._id) === String(documentId));
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document record not found." });
    }
    const filePath = path2.resolve(process.cwd(), "uploads", doc.storedName);
    if (!fs2.existsSync(filePath)) {
      res.setHeader("Content-Type", doc.mimeType || "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${doc.originalName}"`);
      return res.send(Buffer.from(`[GovTrack Official Document Archive]
Document: ${doc.originalName}
Request: ${request.requestNumber}
Type: ${doc.documentType}
Timestamp: ${doc.uploadedAt}
Verification Status: ${doc.verificationStatus}`));
    }
    res.download(filePath, doc.originalName);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function downloadFinalDocument(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { id } = req.params;
    const request = await RequestModel.findById(id).populate(["documentType", "citizen"]).exec();
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }
    const citizenId = request.citizen?._id || request.citizen;
    if (req.user.role === "citizen" && String(citizenId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    if (!request.finalDocument && request.status !== "READY_FOR_DOWNLOAD" && request.status !== "COMPLETED" && request.status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Final government document is not yet issued or approved for this application."
      });
    }
    const docName = request.finalDocument?.originalName || `${request.requestNumber}-Certificate.pdf`;
    const storedPath = request.finalDocument?.path;
    if (storedPath && fs2.existsSync(storedPath)) {
      return res.download(storedPath, docName);
    }
    const docType = request.documentType?.name || "Government Certificate";
    const citizenName = `${request.citizen?.firstName || "Citizen"} ${request.citizen?.lastName || ""}`.trim();
    const certificateText = `
================================================================================
                    GOVERNMENT OF CITIZEN SERVICES (DEMO)
                 DIRECTORATE OF CITIZEN IDENTITY & CERTIFICATION
================================================================================

CERTIFICATE ID: ${request.requestNumber}
DATE OF ISSUE : ${new Date(request.lastUpdatedAt || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
DEPARTMENT    : ${request.currentDepartment || "General Administration"}

--------------------------------------------------------------------------------
                         OFFICIAL DIGITAL CERTIFICATE
--------------------------------------------------------------------------------

This is to certify that:

Applicant Name   : ${citizenName.toUpperCase()}
Document Type    : ${docType.toUpperCase()}
Application No   : ${request.requestNumber}
Issuing Officer  : ${request.assignedOfficer || "Authorized Officer"}
Verification Ref : VER-${request._id.substring(0, 8).toUpperCase()}

Application Summary Data:
${JSON.stringify(request.applicationData, null, 2)}

STATUS: OFFICIALLY APPROVED & DIGITALLY VERIFIED
Remarks: ${request.remarks || "Document satisfies statutory criteria."}

--------------------------------------------------------------------------------
Notice: This is a verified electronic certificate issued under the GovTrack
Digital Portal prototype. Digitally verifiable via portal tracking number.
================================================================================
`;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${request.requestNumber}_${docType.replace(/\s+/g, "_")}.txt"`);
    res.send(certificateText);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// server/middleware/upload.ts
import multer from "multer";
import path3 from "path";
import fs3 from "fs";
var UPLOAD_DIR = path3.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads");
if (!fs3.existsSync(UPLOAD_DIR)) {
  fs3.mkdirSync(UPLOAD_DIR, { recursive: true });
}
var storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path3.extname(file.originalname).toLowerCase();
    const sanitizedBase = path3.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 30);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${sanitizedBase}-${uniqueSuffix}${ext}`);
  }
});
var fileFilter = (_req, file, cb) => {
  const allowedMimes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed."));
  }
};
var uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5 MB max per document
  }
});

// server/routes/requestRoutes.ts
var router3 = Router3();
router3.use(authenticateToken);
router3.post("/", uploadMiddleware.any(), createRequest);
router3.get("/my", getMyRequests);
router3.get("/:id", getRequestById);
router3.patch("/:id/cancel", cancelRequest);
router3.post("/:id/documents", uploadMiddleware.single("file"), uploadAdditionalDocument);
router3.get("/:id/documents/:documentId/download", downloadUploadedDocument);
router3.get("/:id/final-document/download", downloadFinalDocument);
var requestRoutes_default = router3;

// server/routes/adminRoutes.ts
import { Router as Router4 } from "express";

// server/controllers/adminController.ts
async function getAllRequests(req, res) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.max(1, parseInt(String(req.query.limit || "15"), 10));
    const status = req.query.status;
    const documentType = req.query.documentType;
    const search = req.query.search;
    const sortBy = req.query.sortBy || "submittedAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const filter = {};
    if (status && status !== "ALL") {
      filter.status = status;
    }
    if (documentType && documentType !== "ALL") {
      filter.documentType = documentType;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
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
    const requests = await RequestModel.find(filter).populate(["citizen", "documentType"]).sort({ [sortBy]: sortOrder }).skip((page - 1) * limit).limit(limit).exec();
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function getRequestById2(req, res) {
  try {
    const { id } = req.params;
    const request = await RequestModel.findById(id).populate(["citizen", "documentType"]).exec();
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }
    const statusHistory = await RequestStatusHistoryModel.find({ request: id }).populate(["changedBy"]).sort({ timestamp: 1 }).exec();
    res.json({
      success: true,
      data: {
        ...request,
        statusHistory
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function updateRequestStatus(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { id } = req.params;
    const { status: targetStatus, remarks, assignedOfficer } = req.body;
    if (!targetStatus) {
      return res.status(400).json({ success: false, message: "New status is required." });
    }
    const request = await RequestModel.findById(id).populate(["citizen", "documentType"]).exec();
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }
    const currentStatus = request.status;
    const newStatus = targetStatus;
    if (!isValidTransition(currentStatus, newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition: Cannot transition from '${currentStatus}' to '${newStatus}'.`
      });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const officerName = assignedOfficer || `${req.user.firstName} ${req.user.lastName} (${req.user.email})`;
    const updateFields = {
      status: newStatus,
      lastUpdatedAt: now,
      assignedOfficer: officerName
    };
    if (remarks) {
      updateFields.remarks = remarks.trim();
    }
    if (newStatus === "COMPLETED") {
      updateFields.completedAt = now;
    }
    if (newStatus === "REJECTED" && remarks) {
      updateFields.rejectionReason = remarks.trim();
    }
    const updated = await RequestModel.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
    await RequestStatusHistoryModel.create({
      request: id,
      oldStatus: currentStatus,
      newStatus,
      changedBy: req.user._id,
      changedByRole: "admin",
      remarks: remarks || `Status updated to ${newStatus} by officer ${officerName}.`,
      timestamp: now
    });
    const citizenId = request.citizen?._id || request.citizen;
    const docTypeName = request.documentType?.name || "Document";
    await NotificationModel.create({
      user: citizenId,
      title: `Status Updated: ${newStatus.replace(/_/g, " ")}`,
      message: `Your ${docTypeName} request (${request.requestNumber}) has moved to ${newStatus.replace(/_/g, " ")}. ${remarks ? `Remarks: ${remarks}` : ""}`,
      type: "STATUS_UPDATE",
      request: id,
      isRead: false,
      createdAt: now
    });
    await AuditLogModel.create({
      user: req.user._id,
      action: "STATUS_UPDATED",
      request: id,
      description: `Officer updated request ${request.requestNumber} status from ${currentStatus} to ${newStatus}`,
      ipAddress: req.ip || "127.0.0.1"
    });
    res.json({
      success: true,
      message: `Request status successfully updated to ${newStatus}.`,
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function verifyDocument(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { id, documentId } = req.params;
    const { status, remarks } = req.body;
    if (!["VERIFIED", "REJECTED"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'VERIFIED' or 'REJECTED'." });
    }
    if (status === "REJECTED" && !remarks) {
      return res.status(400).json({ success: false, message: "Remarks are mandatory when rejecting a document." });
    }
    const request = await RequestModel.findById(id).populate(["citizen", "documentType"]).exec();
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }
    const docs = request.uploadedDocuments || [];
    const docIndex = docs.findIndex((d) => String(d._id) === String(documentId));
    if (docIndex === -1) {
      return res.status(404).json({ success: false, message: "Document not found in request." });
    }
    docs[docIndex].verificationStatus = status;
    docs[docIndex].verificationRemarks = remarks || (status === "VERIFIED" ? "Verified by officer" : "Rejected");
    const updated = await RequestModel.findByIdAndUpdate(
      id,
      {
        $set: {
          uploadedDocuments: docs,
          lastUpdatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      },
      { new: true }
    );
    const docName = docs[docIndex].documentType || docs[docIndex].originalName;
    const citizenId = request.citizen?._id || request.citizen;
    await NotificationModel.create({
      user: citizenId,
      title: `Document ${status === "VERIFIED" ? "Verified" : "Verification Rejected"}`,
      message: `Your document '${docName}' for request ${request.requestNumber} was ${status.toLowerCase()}. ${remarks ? `Note: ${remarks}` : ""}`,
      type: "DOCUMENT_REQUIRED",
      request: id,
      isRead: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    await AuditLogModel.create({
      user: req.user._id,
      action: status === "VERIFIED" ? "DOCUMENT_VERIFIED" : "DOCUMENT_REJECTED",
      request: id,
      description: `Officer marked document '${docName}' as ${status}. Note: ${remarks || "None"}`,
      ipAddress: req.ip || "127.0.0.1"
    });
    res.json({
      success: true,
      message: `Document marked as ${status}.`,
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function requestAdditionalDocument(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { id } = req.params;
    const { documentName, instructions } = req.body;
    if (!documentName || !instructions) {
      return res.status(400).json({ success: false, message: "Document name and instructions are required." });
    }
    const request = await RequestModel.findById(id).populate(["citizen", "documentType"]).exec();
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }
    const oldStatus = request.status;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const updatedRemarks = `Additional document requested: "${documentName}". Instructions: ${instructions}`;
    const updated = await RequestModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "ADDITIONAL_DOCUMENT_REQUIRED",
          remarks: updatedRemarks,
          lastUpdatedAt: now
        }
      },
      { new: true }
    );
    await RequestStatusHistoryModel.create({
      request: id,
      oldStatus,
      newStatus: "ADDITIONAL_DOCUMENT_REQUIRED",
      changedBy: req.user._id,
      changedByRole: "admin",
      remarks: updatedRemarks,
      timestamp: now
    });
    const citizenId = request.citizen?._id || request.citizen;
    await NotificationModel.create({
      user: citizenId,
      title: "Action Required: Additional Document Needed",
      message: `For request ${request.requestNumber}: Please upload "${documentName}". Instructions: ${instructions}`,
      type: "DOCUMENT_REQUIRED",
      request: id,
      isRead: false,
      createdAt: now
    });
    await AuditLogModel.create({
      user: req.user._id,
      action: "ADDITIONAL_DOC_REQUESTED",
      request: id,
      description: `Officer requested additional document "${documentName}" for request ${request.requestNumber}`,
      ipAddress: req.ip || "127.0.0.1"
    });
    res.json({
      success: true,
      message: "Additional document request dispatched to applicant.",
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function uploadFinalDocument(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { id } = req.params;
    const request = await RequestModel.findById(id).populate(["citizen", "documentType"]).exec();
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }
    const file = req.file;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const docTypeName = request.documentType?.name || "Government Certificate";
    const finalDoc = file ? {
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      uploadedAt: now
    } : {
      originalName: `${request.requestNumber}_${docTypeName.replace(/\s+/g, "_")}.pdf`,
      storedName: `cert_${request.requestNumber}.pdf`,
      mimeType: "application/pdf",
      size: 10240,
      path: "",
      uploadedAt: now
    };
    const oldStatus = request.status;
    const updated = await RequestModel.findByIdAndUpdate(
      id,
      {
        $set: {
          finalDocument: finalDoc,
          status: "READY_FOR_DOWNLOAD",
          remarks: "Official digital document signed and issued. Ready for citizen download.",
          lastUpdatedAt: now
        }
      },
      { new: true }
    );
    await RequestStatusHistoryModel.create({
      request: id,
      oldStatus,
      newStatus: "READY_FOR_DOWNLOAD",
      changedBy: req.user._id,
      changedByRole: "admin",
      remarks: "Official certificate/document uploaded and issued for citizen download.",
      timestamp: now
    });
    const citizenId = request.citizen?._id || request.citizen;
    await NotificationModel.create({
      user: citizenId,
      title: "Certificate Ready for Download!",
      message: `Your ${docTypeName} (${request.requestNumber}) has been signed and is now ready for digital download.`,
      type: "DOCUMENT_READY",
      request: id,
      isRead: false,
      createdAt: now
    });
    await AuditLogModel.create({
      user: req.user._id,
      action: "FINAL_DOCUMENT_UPLOADED",
      request: id,
      description: `Officer issued and uploaded final certificate for request ${request.requestNumber}`,
      ipAddress: req.ip || "127.0.0.1"
    });
    res.json({
      success: true,
      message: "Official digital document issued successfully. Application is ready for download.",
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function getDashboardStats(_req, res) {
  try {
    const allRequests = await RequestModel.find().populate(["documentType"]).exec();
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
    const statusCounts = {};
    const docTypeCounts = {};
    const monthlyCounts = {};
    allRequests.forEach((req) => {
      statusCounts[req.status] = (statusCounts[req.status] || 0) + 1;
      if (["SUBMITTED", "UNDER_REVIEW", "DOCUMENT_VERIFICATION", "ADDITIONAL_DOCUMENT_REQUIRED", "PROCESSING"].includes(req.status)) {
        pendingCount++;
      }
      if (req.status === "UNDER_REVIEW") underReviewCount++;
      if (req.status === "DOCUMENT_VERIFICATION") docVerificationCount++;
      if (req.status === "PROCESSING") processingCount++;
      if (req.status === "APPROVED") approvedCount++;
      if (req.status === "REJECTED") rejectedCount++;
      if (req.status === "READY_FOR_DOWNLOAD") readyForDownloadCount++;
      if (req.status === "COMPLETED") completedCount++;
      if (req.status === "CANCELLED") cancelledCount++;
      const dtName = req.documentType?.name || "General";
      docTypeCounts[dtName] = (docTypeCounts[dtName] || 0) + 1;
      const date = new Date(req.submittedAt || Date.now());
      const monthYear = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      monthlyCounts[monthYear] = (monthlyCounts[monthYear] || 0) + 1;
    });
    const requestsByStatus = Object.keys(statusCounts).map((status) => ({
      name: status.replace(/_/g, " "),
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
    const recentRequests = await RequestModel.find().populate(["citizen", "documentType"]).sort({ submittedAt: -1 }).limit(6).exec();
    const approvalRate = totalRequests > 0 ? Math.round((approvedCount + readyForDownloadCount + completedCount) / totalRequests * 100) : 0;
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function getUsers(req, res) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.max(1, parseInt(String(req.query.limit || "15"), 10));
    const search = req.query.search;
    const role = req.query.role;
    const filter = {};
    if (role && role !== "ALL") {
      filter.role = role;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }, { mobileNumber: regex }];
    }
    const total = await UserModel.countDocuments(filter);
    const users = await UserModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).exec();
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function toggleUserStatus(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { id } = req.params;
    const user = await UserModel.findById(id).exec();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "You cannot deactivate your own administrative account." });
    }
    const updated = await UserModel.findByIdAndUpdate(
      id,
      { $set: { isActive: !user.isActive } },
      { new: true }
    );
    await AuditLogModel.create({
      user: req.user._id,
      action: "USER_UPDATED",
      description: `Admin toggled status for user ${user.email} -> ${updated?.isActive ? "Active" : "Inactive"}`,
      ipAddress: req.ip || "127.0.0.1"
    });
    const { password: _, ...safeUser } = updated;
    res.json({
      success: true,
      message: `User account is now ${safeUser.isActive ? "active" : "inactive"}.`,
      data: safeUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function getAuditLogs(req, res) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.max(1, parseInt(String(req.query.limit || "20"), 10));
    const search = req.query.search;
    const filter = {};
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [{ action: regex }, { description: regex }];
    }
    const total = await AuditLogModel.countDocuments(filter);
    const logs = await AuditLogModel.find(filter).populate(["user", "request"]).sort({ timestamp: -1 }).skip((page - 1) * limit).limit(limit).exec();
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// server/routes/adminRoutes.ts
var router4 = Router4();
router4.use(authenticateToken);
router4.use(authorizeRoles("admin"));
router4.get("/requests", getAllRequests);
router4.get("/requests/:id", getRequestById2);
router4.patch("/requests/:id/status", updateRequestStatus);
router4.patch("/requests/:id/documents/:documentId/verify", verifyDocument);
router4.post("/requests/:id/additional-document", requestAdditionalDocument);
router4.post("/requests/:id/final-document", uploadMiddleware.single("file"), uploadFinalDocument);
router4.get("/dashboard", getDashboardStats);
router4.get("/users", getUsers);
router4.patch("/users/:id/status", toggleUserStatus);
router4.get("/audit-logs", getAuditLogs);
var adminRoutes_default = router4;

// server/routes/notificationRoutes.ts
import { Router as Router5 } from "express";

// server/controllers/notificationController.ts
async function getNotifications(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const notifications = await NotificationModel.find({ user: req.user._id }).populate(["request"]).sort({ createdAt: -1 }).limit(50).exec();
    const unreadCount = await NotificationModel.countDocuments({
      user: req.user._id,
      isRead: false
    });
    res.json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function markAsRead(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { id } = req.params;
    const notification = await NotificationModel.findById(id).exec();
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }
    const notifUserId = notification.user?._id || notification.user;
    if (String(notifUserId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    const updated = await NotificationModel.findByIdAndUpdate(
      id,
      { $set: { isRead: true } },
      { new: true }
    );
    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function markAllAsRead(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const allNotifs = await NotificationModel.find({ user: req.user._id, isRead: false }).exec();
    for (const notif of allNotifs) {
      await NotificationModel.findByIdAndUpdate(notif._id, { $set: { isRead: true } });
    }
    res.json({
      success: true,
      message: "All notifications marked as read."
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// server/routes/notificationRoutes.ts
var router5 = Router5();
router5.use(authenticateToken);
router5.get("/", getNotifications);
router5.patch("/:id/read", markAsRead);
router5.patch("/read-all", markAllAsRead);
var notificationRoutes_default = router5;

// server/routes/publicRoutes.ts
import { Router as Router6 } from "express";

// server/controllers/publicController.ts
async function trackRequestPublic(req, res) {
  try {
    const { requestNumber } = req.params;
    if (!requestNumber || !requestNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: "Request number is required to track status."
      });
    }
    const cleanNum = requestNumber.trim().toUpperCase();
    const request = await RequestModel.findOne({ requestNumber: cleanNum }).populate(["documentType", "citizen"]).exec();
    if (!request) {
      return res.status(404).json({
        success: false,
        message: `No application found with request number '${cleanNum}'. Please check the reference number on your submission receipt.`
      });
    }
    const history = await RequestStatusHistoryModel.find({ request: request._id }).sort({ timestamp: 1 }).exec();
    const docType = request.documentType;
    const citizen = request.citizen;
    const maskName = (name) => {
      if (!name) return "Applicant";
      if (name.length <= 2) return name;
      return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
    };
    const publicResponse = {
      _id: request._id,
      requestNumber: request.requestNumber,
      applicantInitials: `${maskName(citizen?.firstName)} ${maskName(citizen?.lastName)}`,
      documentType: {
        name: docType?.name || "Document",
        department: docType?.department || request.currentDepartment,
        processingTime: docType?.processingTime || 7
      },
      currentStatus: request.status,
      currentDepartment: request.currentDepartment,
      assignedOfficer: request.assignedOfficer || "Verification Cell",
      submittedAt: request.submittedAt,
      lastUpdatedAt: request.lastUpdatedAt,
      expectedCompletionDate: request.expectedCompletionDate,
      remarks: request.remarks,
      finalDocumentAvailable: Boolean(request.finalDocument || ["READY_FOR_DOWNLOAD", "COMPLETED", "APPROVED"].includes(request.status)),
      timeline: history.map((h) => ({
        stage: h.newStatus,
        label: h.newStatus.replace(/_/g, " "),
        timestamp: h.timestamp,
        remarks: h.remarks,
        role: h.changedByRole
      }))
    };
    res.json({
      success: true,
      data: publicResponse
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function getPublicDocumentTypes(_req, res) {
  try {
    const docTypes = await DocumentTypeModel.find({ isActive: true }).sort({ name: 1 }).exec();
    res.json({
      success: true,
      data: docTypes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// server/routes/publicRoutes.ts
var router6 = Router6();
router6.get("/track/:requestNumber", trackRequestPublic);
router6.get("/document-types", getPublicDocumentTypes);
var publicRoutes_default = router6;

// server/middleware/errorHandler.ts
function errorHandler(err, _req, res, _next) {
  console.error("Unhandled Error:", err);
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || []
  });
}

// server/app.ts
function createApp() {
  const app = express();
  app.use(
    cors({
      origin: true,
      credentials: true
    })
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      app: "GovTrack \u2014 Government Document Request & Status Tracking System",
      time: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.use("/api/auth", authRoutes_default);
  app.use("/api/document-types", documentTypeRoutes_default);
  app.use("/api/requests", requestRoutes_default);
  app.use("/api/admin", adminRoutes_default);
  app.use("/api/notifications", notificationRoutes_default);
  app.use("/api/public", publicRoutes_default);
  app.use(errorHandler);
  return app;
}

// server/seed/seedData.ts
async function seedDatabase() {
  const existingUsersCount = await UserModel.countDocuments();
  if (existingUsersCount > 0) {
    console.log("Database already initialized. Skipping seeding.");
    return;
  }
  console.log("\u{1F331} Seeding initial GovTrack database with demo data...");
  const adminPass = await hashPassword("Admin@123456");
  const citizenPass = await hashPassword("Citizen@123456");
  const admin = await UserModel.create({
    _id: "usr_admin_001",
    firstName: "Vikram",
    lastName: "Sharma",
    email: "admin@govtrack.demo",
    mobileNumber: "+91 98765 43210",
    password: adminPass,
    role: "admin",
    address: "Secretariat Complex, Block B",
    city: "New Delhi",
    district: "Central Delhi",
    state: "Delhi",
    pincode: "110001",
    isActive: true,
    isVerified: true
  });
  const rahul = await UserModel.create({
    _id: "usr_citizen_001",
    firstName: "Rahul",
    lastName: "Patel",
    email: "citizen@govtrack.demo",
    mobileNumber: "+91 98111 22334",
    password: citizenPass,
    role: "citizen",
    address: "42 Shanti Nagar, MG Road",
    city: "Mumbai",
    district: "Mumbai Suburban",
    state: "Maharashtra",
    pincode: "400001",
    isActive: true,
    isVerified: true
  });
  const priya = await UserModel.create({
    _id: "usr_citizen_002",
    firstName: "Priya",
    lastName: "Deshmukh",
    email: "priya.deshmukh@govtrack.demo",
    mobileNumber: "+91 98222 33445",
    password: citizenPass,
    role: "citizen",
    address: "15 Green Park",
    city: "Pune",
    district: "Pune",
    state: "Maharashtra",
    pincode: "411001",
    isActive: true,
    isVerified: true
  });
  const docTypesData = [
    {
      _id: "dt_income_001",
      name: "Income Certificate",
      description: "Official certification of annual family income issued for scholarships, subsidies, and government schemes.",
      department: "Revenue & Land Records Department",
      processingTime: 7,
      fee: 50,
      isActive: true,
      requiredDocuments: [
        { name: "Aadhaar Card", description: "Applicant UIDAI Aadhaar Card (Front and Back)", isRequired: true, allowedFileTypes: ["pdf", "jpg", "jpeg", "png"], maxFileSize: 5 },
        { name: "Salary Slip / ITR / Form 16", description: "Proof of income from employer or Income Tax Return", isRequired: true, allowedFileTypes: ["pdf", "jpg", "jpeg", "png"], maxFileSize: 5 },
        { name: "Address Proof", description: "Electricity bill, Ration Card or Registered Rent Agreement", isRequired: true, allowedFileTypes: ["pdf", "jpg", "png"], maxFileSize: 5 },
        { name: "Passport Size Photograph", description: "Recent colored photograph with white background", isRequired: true, allowedFileTypes: ["jpg", "jpeg", "png"], maxFileSize: 2 }
      ]
    },
    {
      _id: "dt_caste_002",
      name: "Caste Certificate",
      description: "Statutory certificate validating social category (SC / ST / OBC) for constitutional reservations and educational admissions.",
      department: "Social Justice & Empowerment Department",
      processingTime: 15,
      fee: 30,
      isActive: true,
      requiredDocuments: [
        { name: "Aadhaar Card", description: "Applicant identity proof", isRequired: true, allowedFileTypes: ["pdf", "jpg", "jpeg", "png"], maxFileSize: 5 },
        { name: "Father / Blood Relative Caste Certificate", description: "Proof of caste heritage from paternal side", isRequired: true, allowedFileTypes: ["pdf", "jpg", "png"], maxFileSize: 5 },
        { name: "School Leaving Certificate", description: "TC/Leaving Certificate mentioning caste & religion", isRequired: true, allowedFileTypes: ["pdf", "jpg", "png"], maxFileSize: 5 }
      ]
    },
    {
      _id: "dt_domicile_003",
      name: "Domicile Certificate",
      description: "Proof of continuous residence in the state for minimum 15 years, required for state civil service and education.",
      department: "Department of Revenue & Civil Administration",
      processingTime: 10,
      fee: 40,
      isActive: true,
      requiredDocuments: [
        { name: "Aadhaar Card", description: "National identity card", isRequired: true, allowedFileTypes: ["pdf", "jpg", "png"], maxFileSize: 5 },
        { name: "Proof of Residence (15 Years)", description: "Electricity bills / Property tax receipts / School records spanning 15 years", isRequired: true, allowedFileTypes: ["pdf"], maxFileSize: 5 },
        { name: "Birth Certificate", description: "State municipal birth certificate", isRequired: true, allowedFileTypes: ["pdf", "jpg", "png"], maxFileSize: 5 }
      ]
    },
    {
      _id: "dt_residence_004",
      name: "Residence Certificate",
      description: "Standard address verification certificate issued by the Tehsildar / Sub-Divisional Magistrate office.",
      department: "Tehsildar & Sub-Divisional Office",
      processingTime: 5,
      fee: 30,
      isActive: true,
      requiredDocuments: [
        { name: "Aadhaar Card", description: "Applicant Aadhaar Card", isRequired: true, allowedFileTypes: ["pdf", "jpg", "png"], maxFileSize: 5 },
        { name: "Utility Bill (Electricity/Water)", description: "Recent utility bill not older than 3 months", isRequired: true, allowedFileTypes: ["pdf", "jpg", "png"], maxFileSize: 5 }
      ]
    },
    {
      _id: "dt_birth_005",
      name: "Birth Certificate",
      description: "Civil registration document certifying the date, time, and parentage of birth within municipal jurisdiction.",
      department: "Municipal Corporation Health Department",
      processingTime: 7,
      fee: 50,
      isActive: true,
      requiredDocuments: [
        { name: "Hospital Discharge Certificate", description: "Official discharge card from maternity hospital", isRequired: true, allowedFileTypes: ["pdf", "jpg", "png"], maxFileSize: 5 },
        { name: "Parents' Aadhaar Cards", description: "Combined identification of mother and father", isRequired: true, allowedFileTypes: ["pdf", "jpg"], maxFileSize: 5 },
        { name: "Marriage Certificate", description: "Copy of parents' marriage registration", isRequired: false, allowedFileTypes: ["pdf", "jpg"], maxFileSize: 5 }
      ]
    },
    {
      _id: "dt_death_006",
      name: "Death Certificate",
      description: "Official record certifying the passing of an individual for inheritance, insurance, and municipal death registers.",
      department: "Municipal Corporation Health Department",
      processingTime: 7,
      fee: 50,
      isActive: true,
      requiredDocuments: [
        { name: "Hospital Death Summary", description: "Death declaration note from hospital/doctor", isRequired: true, allowedFileTypes: ["pdf", "jpg"], maxFileSize: 5 },
        { name: "Cremation / Burial Slip", description: "Receipt from registered cremation or burial ground", isRequired: true, allowedFileTypes: ["pdf", "jpg"], maxFileSize: 5 },
        { name: "Informant's Aadhaar Card", description: "Identity of primary relative submitting request", isRequired: true, allowedFileTypes: ["pdf", "jpg"], maxFileSize: 5 }
      ]
    },
    {
      _id: "dt_ncl_007",
      name: "Non-Creamy Layer Certificate",
      description: "Income verification for Other Backward Classes (OBC) certifying family income is below creamy layer ceiling.",
      department: "Backward Classes Welfare Department",
      processingTime: 14,
      fee: 60,
      isActive: true,
      requiredDocuments: [
        { name: "Caste Certificate", description: "Original OBC caste certificate", isRequired: true, allowedFileTypes: ["pdf", "jpg"], maxFileSize: 5 },
        { name: "3 Years Income Proof / ITR", description: "Income documents for preceding three financial years", isRequired: true, allowedFileTypes: ["pdf"], maxFileSize: 5 },
        { name: "Self Declaration Affidavit", description: "Notarized affidavit affirming non-creamy layer status", isRequired: true, allowedFileTypes: ["pdf", "jpg"], maxFileSize: 5 }
      ]
    },
    {
      _id: "dt_ews_008",
      name: "Economically Weaker Section (EWS) Certificate",
      description: "Reservation entitlement document for general category candidates with gross annual family income below \u20B98 Lakhs.",
      department: "Revenue & Civil Administration",
      processingTime: 12,
      fee: 50,
      isActive: true,
      requiredDocuments: [
        { name: "Aadhaar Card", description: "UIDAI card of applicant and parents", isRequired: true, allowedFileTypes: ["pdf", "jpg"], maxFileSize: 5 },
        { name: "Income Proof", description: "Official salary certificates or Patwari income verification", isRequired: true, allowedFileTypes: ["pdf"], maxFileSize: 5 },
        { name: "Property / Land Holding Document", description: "7/12 extract or municipal property tax receipt", isRequired: true, allowedFileTypes: ["pdf"], maxFileSize: 5 }
      ]
    },
    {
      _id: "dt_senior_009",
      name: "Senior Citizen Card & Certificate",
      description: "State welfare card granting senior citizens (aged 60+) priority public transit concessions and healthcare benefits.",
      department: "Social Welfare & Senior Citizen Empowerment",
      processingTime: 5,
      fee: 0,
      isActive: true,
      requiredDocuments: [
        { name: "Age Proof (Aadhaar / Voter ID / PAN)", description: "Clear document demonstrating age $\\ge 60$", isRequired: true, allowedFileTypes: ["pdf", "jpg", "png"], maxFileSize: 5 },
        { name: "Address Proof", description: "Current residence document", isRequired: true, allowedFileTypes: ["pdf", "jpg", "png"], maxFileSize: 5 },
        { name: "Passport Size Photo", description: "Recent photograph for smart card printing", isRequired: true, allowedFileTypes: ["jpg", "png"], maxFileSize: 2 }
      ]
    },
    {
      _id: "dt_character_010",
      name: "Character & Antecedents Certificate",
      description: "Police clearance and character verification certificate required for public sector employment and licensing.",
      department: "District Magistrate & Police Commissionerate",
      processingTime: 10,
      fee: 100,
      isActive: true,
      requiredDocuments: [
        { name: "Aadhaar Card", description: "Applicant identity proof", isRequired: true, allowedFileTypes: ["pdf", "jpg"], maxFileSize: 5 },
        { name: "Address Proof", description: "Permanent and present address proof", isRequired: true, allowedFileTypes: ["pdf", "jpg"], maxFileSize: 5 },
        { name: "Character References from 2 Gazetted Officers", description: "Signed character recommendations", isRequired: true, allowedFileTypes: ["pdf"], maxFileSize: 5 }
      ]
    }
  ];
  await DocumentTypeModel.insertMany(docTypesData);
  const now = /* @__PURE__ */ new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1e3).toISOString();
  const daysAhead = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1e3).toISOString();
  const req1 = await RequestModel.create({
    _id: "req_000001",
    requestNumber: "GOV-2026-000001",
    citizen: rahul._id,
    documentType: "dt_income_001",
    applicationData: {
      applicantName: "Rahul Patel",
      fatherName: "Girish Patel",
      annualIncome: "420000",
      occupation: "Software Engineer (Private Sector)",
      purposeOfCertificate: "Higher Education Scholarship Scheme",
      district: "Mumbai Suburban",
      state: "Maharashtra"
    },
    uploadedDocuments: [
      {
        _id: "doc_req1_1",
        documentType: "Aadhaar Card",
        originalName: "Aadhaar_Rahul_Patel.pdf",
        storedName: "aadhaar_demo_01.pdf",
        mimeType: "application/pdf",
        size: 842e3,
        path: "",
        uploadedBy: rahul._id,
        uploadedAt: daysAgo(5),
        verificationStatus: "VERIFIED",
        verificationRemarks: "UIDAI digital signature valid."
      },
      {
        _id: "doc_req1_2",
        documentType: "Salary Slip / ITR / Form 16",
        originalName: "ITR_V_AY2025_26.pdf",
        storedName: "itr_demo_01.pdf",
        mimeType: "application/pdf",
        size: 124e4,
        path: "",
        uploadedBy: rahul._id,
        uploadedAt: daysAgo(5),
        verificationStatus: "VERIFIED",
        verificationRemarks: "Income threshold confirmed under \u20B98,00,000."
      }
    ],
    status: "READY_FOR_DOWNLOAD",
    currentDepartment: "Revenue & Land Records Department",
    assignedOfficer: "Officer Vikram Sharma (SDM Cell)",
    remarks: "Application verified and digitally signed. Certificate ready for instant download.",
    finalDocument: {
      originalName: "GOV-2026-000001-Income-Certificate.pdf",
      storedName: "cert_gov_2026_000001.pdf",
      mimeType: "application/pdf",
      size: 152e3,
      path: "",
      uploadedAt: daysAgo(1)
    },
    submittedAt: daysAgo(6),
    lastUpdatedAt: daysAgo(1),
    expectedCompletionDate: daysAhead(1)
  });
  await RequestStatusHistoryModel.insertMany([
    {
      request: req1._id,
      oldStatus: "NONE",
      newStatus: "SUBMITTED",
      changedBy: rahul._id,
      changedByRole: "citizen",
      remarks: "Application submitted online with Aadhaar and Form 16.",
      timestamp: daysAgo(6)
    },
    {
      request: req1._id,
      oldStatus: "SUBMITTED",
      newStatus: "UNDER_REVIEW",
      changedBy: admin._id,
      changedByRole: "admin",
      remarks: "Application assigned to Tehsildar Desk for initial scrutiny.",
      timestamp: daysAgo(5)
    },
    {
      request: req1._id,
      oldStatus: "UNDER_REVIEW",
      newStatus: "DOCUMENT_VERIFICATION",
      changedBy: admin._id,
      changedByRole: "admin",
      remarks: "Documents forwarded for electronic UIDAI & Income tax ledger cross-verification.",
      timestamp: daysAgo(4)
    },
    {
      request: req1._id,
      oldStatus: "DOCUMENT_VERIFICATION",
      newStatus: "PROCESSING",
      changedBy: admin._id,
      changedByRole: "admin",
      remarks: "All documents verified successfully. Draft certificate generated.",
      timestamp: daysAgo(2)
    },
    {
      request: req1._id,
      oldStatus: "PROCESSING",
      newStatus: "APPROVED",
      changedBy: admin._id,
      changedByRole: "admin",
      remarks: "Approved by Sub-Divisional Magistrate. Cryptographic seal affixed.",
      timestamp: daysAgo(1)
    },
    {
      request: req1._id,
      oldStatus: "APPROVED",
      newStatus: "READY_FOR_DOWNLOAD",
      changedBy: admin._id,
      changedByRole: "admin",
      remarks: "Certificate published to citizen repository. Available for download.",
      timestamp: daysAgo(1)
    }
  ]);
  const req2 = await RequestModel.create({
    _id: "req_000002",
    requestNumber: "GOV-2026-000002",
    citizen: rahul._id,
    documentType: "dt_domicile_003",
    applicationData: {
      applicantName: "Rahul Patel",
      residingSinceYear: "2005",
      currentAddress: "42 Shanti Nagar, Mumbai",
      district: "Mumbai Suburban"
    },
    uploadedDocuments: [
      {
        _id: "doc_req2_1",
        documentType: "Aadhaar Card",
        originalName: "Aadhaar_Rahul.pdf",
        storedName: "aadhaar_demo_02.pdf",
        mimeType: "application/pdf",
        size: 512e3,
        path: "",
        uploadedBy: rahul._id,
        uploadedAt: daysAgo(3),
        verificationStatus: "VERIFIED",
        verificationRemarks: "Matched citizen database."
      },
      {
        _id: "doc_req2_2",
        documentType: "Proof of Residence (15 Years)",
        originalName: "Electricity_Bills_2010_2025.pdf",
        storedName: "bills_demo_02.pdf",
        mimeType: "application/pdf",
        size: 215e4,
        path: "",
        uploadedBy: rahul._id,
        uploadedAt: daysAgo(3),
        verificationStatus: "PENDING",
        verificationRemarks: "Under scrutiny by circle revenue inspector."
      }
    ],
    status: "DOCUMENT_VERIFICATION",
    currentDepartment: "Department of Revenue & Civil Administration",
    assignedOfficer: "Officer Sunita Rao",
    remarks: "Aadhaar verified. Residence tenure records undergoing circle verification.",
    submittedAt: daysAgo(4),
    lastUpdatedAt: daysAgo(2),
    expectedCompletionDate: daysAhead(6)
  });
  await RequestStatusHistoryModel.insertMany([
    {
      request: req2._id,
      oldStatus: "NONE",
      newStatus: "SUBMITTED",
      changedBy: rahul._id,
      changedByRole: "citizen",
      remarks: "Application submitted for state Domicile Certificate.",
      timestamp: daysAgo(4)
    },
    {
      request: req2._id,
      oldStatus: "SUBMITTED",
      newStatus: "UNDER_REVIEW",
      changedBy: admin._id,
      changedByRole: "admin",
      remarks: "Application received and registered in registry.",
      timestamp: daysAgo(3)
    },
    {
      request: req2._id,
      oldStatus: "UNDER_REVIEW",
      newStatus: "DOCUMENT_VERIFICATION",
      changedBy: admin._id,
      changedByRole: "admin",
      remarks: "Identity verified; reviewing historical utility receipts.",
      timestamp: daysAgo(2)
    }
  ]);
  const req3 = await RequestModel.create({
    _id: "req_000003",
    requestNumber: "GOV-2026-000003",
    citizen: priya._id,
    documentType: "dt_caste_002",
    applicationData: {
      applicantName: "Priya Deshmukh",
      subCaste: "Maratha Kunbi",
      fatherName: "Suresh Deshmukh",
      district: "Pune"
    },
    uploadedDocuments: [
      {
        _id: "doc_req3_1",
        documentType: "Aadhaar Card",
        originalName: "Priya_Aadhaar.pdf",
        storedName: "priya_aadhaar.pdf",
        mimeType: "application/pdf",
        size: 62e4,
        path: "",
        uploadedBy: priya._id,
        uploadedAt: daysAgo(4),
        verificationStatus: "VERIFIED",
        verificationRemarks: "Verified."
      }
    ],
    status: "ADDITIONAL_DOCUMENT_REQUIRED",
    currentDepartment: "Social Justice & Empowerment Department",
    assignedOfficer: "Officer Ramesh Kulkarni",
    remarks: `Additional document requested: "Father / Blood Relative Caste Certificate". Instructions: Please upload father's 1967 school leaving certificate or grandfather's land record mentioning lineage.`,
    submittedAt: daysAgo(5),
    lastUpdatedAt: daysAgo(1),
    expectedCompletionDate: daysAhead(10)
  });
  await RequestStatusHistoryModel.insertMany([
    {
      request: req3._id,
      oldStatus: "NONE",
      newStatus: "SUBMITTED",
      changedBy: priya._id,
      changedByRole: "citizen",
      remarks: "Application submitted.",
      timestamp: daysAgo(5)
    },
    {
      request: req3._id,
      oldStatus: "SUBMITTED",
      newStatus: "UNDER_REVIEW",
      changedBy: admin._id,
      changedByRole: "admin",
      remarks: "Application reviewed by scrutiny committee.",
      timestamp: daysAgo(3)
    },
    {
      request: req3._id,
      oldStatus: "UNDER_REVIEW",
      newStatus: "DOCUMENT_VERIFICATION",
      changedBy: admin._id,
      changedByRole: "admin",
      remarks: "Initial documents checked.",
      timestamp: daysAgo(2)
    },
    {
      request: req3._id,
      oldStatus: "DOCUMENT_VERIFICATION",
      newStatus: "ADDITIONAL_DOCUMENT_REQUIRED",
      changedBy: admin._id,
      changedByRole: "admin",
      remarks: "Paternal ancestry record required to substantiate claim under 1967 gazette norms.",
      timestamp: daysAgo(1)
    }
  ]);
  const req4 = await RequestModel.create({
    _id: "req_000004",
    requestNumber: "GOV-2026-000004",
    citizen: priya._id,
    documentType: "dt_senior_009",
    applicationData: {
      applicantName: "Suresh Deshmukh",
      dateOfBirth: "1958-04-12",
      bloodGroup: "O+",
      emergencyContact: "+91 98222 33445"
    },
    uploadedDocuments: [
      {
        _id: "doc_req4_1",
        documentType: "Age Proof (Aadhaar / Voter ID / PAN)",
        originalName: "PAN_Suresh.pdf",
        storedName: "pan_suresh.pdf",
        mimeType: "application/pdf",
        size: 38e4,
        path: "",
        uploadedBy: priya._id,
        uploadedAt: daysAgo(10),
        verificationStatus: "VERIFIED",
        verificationRemarks: "Age 67 confirmed."
      }
    ],
    status: "COMPLETED",
    currentDepartment: "Social Welfare & Senior Citizen Empowerment",
    assignedOfficer: "Officer Vikram Sharma",
    remarks: "Smart Senior Citizen card dispatched to registered residential address. Digital copy downloaded.",
    finalDocument: {
      originalName: "GOV-2026-000004-Senior-Citizen-Card.pdf",
      storedName: "senior_card_000004.pdf",
      mimeType: "application/pdf",
      size: 94e3,
      path: "",
      uploadedAt: daysAgo(4)
    },
    submittedAt: daysAgo(11),
    lastUpdatedAt: daysAgo(3),
    completedAt: daysAgo(3),
    expectedCompletionDate: daysAgo(6)
  });
  await RequestStatusHistoryModel.insertMany([
    {
      request: req4._id,
      oldStatus: "NONE",
      newStatus: "SUBMITTED",
      changedBy: priya._id,
      changedByRole: "citizen",
      remarks: "Application submitted for Senior Citizen Card.",
      timestamp: daysAgo(11)
    },
    {
      request: req4._id,
      oldStatus: "SUBMITTED",
      newStatus: "UNDER_REVIEW",
      changedBy: admin._id,
      changedByRole: "admin",
      remarks: "Application verified.",
      timestamp: daysAgo(9)
    },
    {
      request: req4._id,
      oldStatus: "UNDER_REVIEW",
      newStatus: "PROCESSING",
      changedBy: admin._id,
      changedByRole: "admin",
      remarks: "Card personalization initiated.",
      timestamp: daysAgo(7)
    },
    {
      request: req4._id,
      oldStatus: "PROCESSING",
      newStatus: "APPROVED",
      changedBy: admin._id,
      changedByRole: "admin",
      remarks: "Approved by Welfare Officer.",
      timestamp: daysAgo(5)
    },
    {
      request: req4._id,
      oldStatus: "APPROVED",
      newStatus: "READY_FOR_DOWNLOAD",
      changedBy: admin._id,
      changedByRole: "admin",
      remarks: "Electronic Senior Citizen Card generated.",
      timestamp: daysAgo(4)
    },
    {
      request: req4._id,
      oldStatus: "READY_FOR_DOWNLOAD",
      newStatus: "COMPLETED",
      changedBy: priya._id,
      changedByRole: "citizen",
      remarks: "Certificate downloaded and acknowledged by applicant.",
      timestamp: daysAgo(3)
    }
  ]);
  const req5 = await RequestModel.create({
    _id: "req_000005",
    requestNumber: "GOV-2026-000005",
    citizen: rahul._id,
    documentType: "dt_birth_005",
    applicationData: {
      childName: "Aarav Patel",
      dateOfBirth: "2026-08-15",
      placeOfBirth: "Lilavati Hospital, Bandra, Mumbai",
      fatherName: "Rahul Patel",
      motherName: "Ananya Patel"
    },
    uploadedDocuments: [
      {
        _id: "doc_req5_1",
        documentType: "Hospital Discharge Certificate",
        originalName: "Lilavati_Discharge_Card.pdf",
        storedName: "discharge_demo.pdf",
        mimeType: "application/pdf",
        size: 72e4,
        path: "",
        uploadedBy: rahul._id,
        uploadedAt: daysAgo(1),
        verificationStatus: "PENDING"
      }
    ],
    status: "SUBMITTED",
    currentDepartment: "Municipal Corporation Health Department",
    assignedOfficer: "Pending Assignment",
    remarks: "Application submitted online. Awaiting departmental assignment.",
    submittedAt: daysAgo(1),
    lastUpdatedAt: daysAgo(1),
    expectedCompletionDate: daysAhead(6)
  });
  await RequestStatusHistoryModel.create({
    request: req5._id,
    oldStatus: "NONE",
    newStatus: "SUBMITTED",
    changedBy: rahul._id,
    changedByRole: "citizen",
    remarks: "Application submitted successfully via online citizen portal.",
    timestamp: daysAgo(1)
  });
  const req6 = await RequestModel.create({
    _id: "req_000006",
    requestNumber: "GOV-2026-000006",
    citizen: rahul._id,
    documentType: "dt_ews_008",
    applicationData: {
      applicantName: "Rahul Patel",
      declaredAnnualIncome: "950000",
      agriculturalLand: "None",
      residentialFlatArea: "1100 sq ft"
    },
    uploadedDocuments: [],
    status: "REJECTED",
    currentDepartment: "Revenue & Civil Administration",
    assignedOfficer: "Officer Vikram Sharma",
    remarks: "Application rejected: Declared family income (\u20B99.5 Lakhs) and residential flat area (1100 sq ft) exceed statutory EWS limits under central guidelines.",
    rejectionReason: "Declared family income (\u20B99.5 Lakhs) and residential flat area exceed statutory EWS limits.",
    submittedAt: daysAgo(8),
    lastUpdatedAt: daysAgo(4),
    expectedCompletionDate: daysAgo(2)
  });
  await RequestStatusHistoryModel.insertMany([
    {
      request: req6._id,
      oldStatus: "NONE",
      newStatus: "SUBMITTED",
      changedBy: rahul._id,
      changedByRole: "citizen",
      remarks: "Submitted.",
      timestamp: daysAgo(8)
    },
    {
      request: req6._id,
      oldStatus: "SUBMITTED",
      newStatus: "UNDER_REVIEW",
      changedBy: admin._id,
      changedByRole: "admin",
      remarks: "Scrutinized financial declarations.",
      timestamp: daysAgo(6)
    },
    {
      request: req6._id,
      oldStatus: "UNDER_REVIEW",
      newStatus: "REJECTED",
      changedBy: admin._id,
      changedByRole: "admin",
      remarks: "Exceeds income eligibility ceiling of \u20B98,00,000.",
      timestamp: daysAgo(4)
    }
  ]);
  await NotificationModel.insertMany([
    {
      user: rahul._id,
      title: "Certificate Ready for Download!",
      message: "Your Income Certificate (GOV-2026-000001) has been approved and is ready for download.",
      type: "DOCUMENT_READY",
      request: req1._id,
      isRead: false,
      createdAt: daysAgo(1)
    },
    {
      user: rahul._id,
      title: "Status Updated: DOCUMENT VERIFICATION",
      message: "Your Domicile Certificate request GOV-2026-000002 has moved to Document Verification.",
      type: "STATUS_UPDATE",
      request: req2._id,
      isRead: true,
      createdAt: daysAgo(2)
    },
    {
      user: priya._id,
      title: "Action Required: Additional Document Needed",
      message: "For request GOV-2026-000003: Please upload Father / Blood Relative Caste Certificate.",
      type: "DOCUMENT_REQUIRED",
      request: req3._id,
      isRead: false,
      createdAt: daysAgo(1)
    },
    {
      user: priya._id,
      title: "Senior Citizen Card Issued",
      message: "Senior Citizen Card (GOV-2026-000004) has been successfully issued.",
      type: "APPROVAL",
      request: req4._id,
      isRead: true,
      createdAt: daysAgo(3)
    }
  ]);
  await AuditLogModel.insertMany([
    {
      user: admin._id,
      action: "ADMIN_LOGIN",
      description: "Officer Vikram Sharma logged in from administrative console.",
      ipAddress: "127.0.0.1",
      timestamp: daysAgo(1)
    },
    {
      user: admin._id,
      action: "FINAL_DOCUMENT_UPLOADED",
      request: req1._id,
      description: "Officer issued and uploaded final certificate for request GOV-2026-000001",
      ipAddress: "127.0.0.1",
      timestamp: daysAgo(1)
    },
    {
      user: admin._id,
      action: "ADDITIONAL_DOC_REQUESTED",
      request: req3._id,
      description: 'Officer requested additional document "Father / Blood Relative Caste Certificate" for request GOV-2026-000003',
      ipAddress: "127.0.0.1",
      timestamp: daysAgo(1)
    },
    {
      user: admin._id,
      action: "DOCUMENT_VERIFIED",
      request: req2._id,
      description: "Officer verified Aadhaar Card for request GOV-2026-000002",
      ipAddress: "127.0.0.1",
      timestamp: daysAgo(2)
    }
  ]);
  console.log("\u2705 Demo database seeded successfully with Admin, Citizens, Document Types, and Requests.");
}

// server.ts
import { createServer as createViteServer } from "vite";
import path4 from "path";
import express2 from "express";
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
var isProd = process.env.NODE_ENV === "production";
async function startServer() {
  await connectDB();
  await seedDatabase();
  const app = createApp();
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path4.resolve(process.cwd(), "dist");
    app.use(express2.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path4.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F3DB}\uFE0F GovTrack server running on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
