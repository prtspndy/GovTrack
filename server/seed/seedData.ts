import {
  UserModel,
  DocumentTypeModel,
  RequestModel,
  RequestStatusHistoryModel,
  NotificationModel,
  AuditLogModel
} from '../models/index.js';
import { hashPassword } from '../utils/password.js';

export async function seedDatabase() {
  const existingUsersCount = await UserModel.countDocuments();
  if (existingUsersCount > 0) {
    console.log('Database already initialized. Skipping seeding.');
    return;
  }

  console.log('🌱 Seeding initial GovTrack database with demo data...');

  const adminPass = await hashPassword('Admin@123456');
  const citizenPass = await hashPassword('Citizen@123456');

  // 1. Create Admin
  const admin = await UserModel.create({
    _id: 'usr_admin_001',
    firstName: 'Vikram',
    lastName: 'Sharma',
    email: 'admin@govtrack.demo',
    mobileNumber: '+91 98765 43210',
    password: adminPass,
    role: 'admin',
    address: 'Secretariat Complex, Block B',
    city: 'New Delhi',
    district: 'Central Delhi',
    state: 'Delhi',
    pincode: '110001',
    isActive: true,
    isVerified: true
  });

  // 2. Create Citizens
  const rahul = await UserModel.create({
    _id: 'usr_citizen_001',
    firstName: 'Rahul',
    lastName: 'Patel',
    email: 'citizen@govtrack.demo',
    mobileNumber: '+91 98111 22334',
    password: citizenPass,
    role: 'citizen',
    address: '42 Shanti Nagar, MG Road',
    city: 'Mumbai',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    pincode: '400001',
    isActive: true,
    isVerified: true
  });

  const priya = await UserModel.create({
    _id: 'usr_citizen_002',
    firstName: 'Priya',
    lastName: 'Deshmukh',
    email: 'priya.deshmukh@govtrack.demo',
    mobileNumber: '+91 98222 33445',
    password: citizenPass,
    role: 'citizen',
    address: '15 Green Park',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    isActive: true,
    isVerified: true
  });

  // 3. Create Document Types
  const docTypesData = [
    {
      _id: 'dt_income_001',
      name: 'Income Certificate',
      description: 'Official certification of annual family income issued for scholarships, subsidies, and government schemes.',
      department: 'Revenue & Land Records Department',
      processingTime: 7,
      fee: 50,
      isActive: true,
      requiredDocuments: [
        { name: 'Aadhaar Card', description: 'Applicant UIDAI Aadhaar Card (Front and Back)', isRequired: true, allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png'], maxFileSize: 5 },
        { name: 'Salary Slip / ITR / Form 16', description: 'Proof of income from employer or Income Tax Return', isRequired: true, allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png'], maxFileSize: 5 },
        { name: 'Address Proof', description: 'Electricity bill, Ration Card or Registered Rent Agreement', isRequired: true, allowedFileTypes: ['pdf', 'jpg', 'png'], maxFileSize: 5 },
        { name: 'Passport Size Photograph', description: 'Recent colored photograph with white background', isRequired: true, allowedFileTypes: ['jpg', 'jpeg', 'png'], maxFileSize: 2 }
      ]
    },
    {
      _id: 'dt_caste_002',
      name: 'Caste Certificate',
      description: 'Statutory certificate validating social category (SC / ST / OBC) for constitutional reservations and educational admissions.',
      department: 'Social Justice & Empowerment Department',
      processingTime: 15,
      fee: 30,
      isActive: true,
      requiredDocuments: [
        { name: 'Aadhaar Card', description: 'Applicant identity proof', isRequired: true, allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png'], maxFileSize: 5 },
        { name: 'Father / Blood Relative Caste Certificate', description: 'Proof of caste heritage from paternal side', isRequired: true, allowedFileTypes: ['pdf', 'jpg', 'png'], maxFileSize: 5 },
        { name: 'School Leaving Certificate', description: 'TC/Leaving Certificate mentioning caste & religion', isRequired: true, allowedFileTypes: ['pdf', 'jpg', 'png'], maxFileSize: 5 }
      ]
    },
    {
      _id: 'dt_domicile_003',
      name: 'Domicile Certificate',
      description: 'Proof of continuous residence in the state for minimum 15 years, required for state civil service and education.',
      department: 'Department of Revenue & Civil Administration',
      processingTime: 10,
      fee: 40,
      isActive: true,
      requiredDocuments: [
        { name: 'Aadhaar Card', description: 'National identity card', isRequired: true, allowedFileTypes: ['pdf', 'jpg', 'png'], maxFileSize: 5 },
        { name: 'Proof of Residence (15 Years)', description: 'Electricity bills / Property tax receipts / School records spanning 15 years', isRequired: true, allowedFileTypes: ['pdf'], maxFileSize: 5 },
        { name: 'Birth Certificate', description: 'State municipal birth certificate', isRequired: true, allowedFileTypes: ['pdf', 'jpg', 'png'], maxFileSize: 5 }
      ]
    },
    {
      _id: 'dt_residence_004',
      name: 'Residence Certificate',
      description: 'Standard address verification certificate issued by the Tehsildar / Sub-Divisional Magistrate office.',
      department: 'Tehsildar & Sub-Divisional Office',
      processingTime: 5,
      fee: 30,
      isActive: true,
      requiredDocuments: [
        { name: 'Aadhaar Card', description: 'Applicant Aadhaar Card', isRequired: true, allowedFileTypes: ['pdf', 'jpg', 'png'], maxFileSize: 5 },
        { name: 'Utility Bill (Electricity/Water)', description: 'Recent utility bill not older than 3 months', isRequired: true, allowedFileTypes: ['pdf', 'jpg', 'png'], maxFileSize: 5 }
      ]
    },
    {
      _id: 'dt_birth_005',
      name: 'Birth Certificate',
      description: 'Civil registration document certifying the date, time, and parentage of birth within municipal jurisdiction.',
      department: 'Municipal Corporation Health Department',
      processingTime: 7,
      fee: 50,
      isActive: true,
      requiredDocuments: [
        { name: 'Hospital Discharge Certificate', description: 'Official discharge card from maternity hospital', isRequired: true, allowedFileTypes: ['pdf', 'jpg', 'png'], maxFileSize: 5 },
        { name: "Parents' Aadhaar Cards", description: 'Combined identification of mother and father', isRequired: true, allowedFileTypes: ['pdf', 'jpg'], maxFileSize: 5 },
        { name: 'Marriage Certificate', description: "Copy of parents' marriage registration", isRequired: false, allowedFileTypes: ['pdf', 'jpg'], maxFileSize: 5 }
      ]
    },
    {
      _id: 'dt_death_006',
      name: 'Death Certificate',
      description: 'Official record certifying the passing of an individual for inheritance, insurance, and municipal death registers.',
      department: 'Municipal Corporation Health Department',
      processingTime: 7,
      fee: 50,
      isActive: true,
      requiredDocuments: [
        { name: 'Hospital Death Summary', description: 'Death declaration note from hospital/doctor', isRequired: true, allowedFileTypes: ['pdf', 'jpg'], maxFileSize: 5 },
        { name: 'Cremation / Burial Slip', description: 'Receipt from registered cremation or burial ground', isRequired: true, allowedFileTypes: ['pdf', 'jpg'], maxFileSize: 5 },
        { name: "Informant's Aadhaar Card", description: 'Identity of primary relative submitting request', isRequired: true, allowedFileTypes: ['pdf', 'jpg'], maxFileSize: 5 }
      ]
    },
    {
      _id: 'dt_ncl_007',
      name: 'Non-Creamy Layer Certificate',
      description: 'Income verification for Other Backward Classes (OBC) certifying family income is below creamy layer ceiling.',
      department: 'Backward Classes Welfare Department',
      processingTime: 14,
      fee: 60,
      isActive: true,
      requiredDocuments: [
        { name: 'Caste Certificate', description: 'Original OBC caste certificate', isRequired: true, allowedFileTypes: ['pdf', 'jpg'], maxFileSize: 5 },
        { name: '3 Years Income Proof / ITR', description: 'Income documents for preceding three financial years', isRequired: true, allowedFileTypes: ['pdf'], maxFileSize: 5 },
        { name: 'Self Declaration Affidavit', description: 'Notarized affidavit affirming non-creamy layer status', isRequired: true, allowedFileTypes: ['pdf', 'jpg'], maxFileSize: 5 }
      ]
    },
    {
      _id: 'dt_ews_008',
      name: 'Economically Weaker Section (EWS) Certificate',
      description: 'Reservation entitlement document for general category candidates with gross annual family income below ₹8 Lakhs.',
      department: 'Revenue & Civil Administration',
      processingTime: 12,
      fee: 50,
      isActive: true,
      requiredDocuments: [
        { name: 'Aadhaar Card', description: 'UIDAI card of applicant and parents', isRequired: true, allowedFileTypes: ['pdf', 'jpg'], maxFileSize: 5 },
        { name: 'Income Proof', description: 'Official salary certificates or Patwari income verification', isRequired: true, allowedFileTypes: ['pdf'], maxFileSize: 5 },
        { name: 'Property / Land Holding Document', description: '7/12 extract or municipal property tax receipt', isRequired: true, allowedFileTypes: ['pdf'], maxFileSize: 5 }
      ]
    },
    {
      _id: 'dt_senior_009',
      name: 'Senior Citizen Card & Certificate',
      description: 'State welfare card granting senior citizens (aged 60+) priority public transit concessions and healthcare benefits.',
      department: 'Social Welfare & Senior Citizen Empowerment',
      processingTime: 5,
      fee: 0,
      isActive: true,
      requiredDocuments: [
        { name: 'Age Proof (Aadhaar / Voter ID / PAN)', description: 'Clear document demonstrating age $\\ge 60$', isRequired: true, allowedFileTypes: ['pdf', 'jpg', 'png'], maxFileSize: 5 },
        { name: 'Address Proof', description: 'Current residence document', isRequired: true, allowedFileTypes: ['pdf', 'jpg', 'png'], maxFileSize: 5 },
        { name: 'Passport Size Photo', description: 'Recent photograph for smart card printing', isRequired: true, allowedFileTypes: ['jpg', 'png'], maxFileSize: 2 }
      ]
    },
    {
      _id: 'dt_character_010',
      name: 'Character & Antecedents Certificate',
      description: 'Police clearance and character verification certificate required for public sector employment and licensing.',
      department: 'District Magistrate & Police Commissionerate',
      processingTime: 10,
      fee: 100,
      isActive: true,
      requiredDocuments: [
        { name: 'Aadhaar Card', description: 'Applicant identity proof', isRequired: true, allowedFileTypes: ['pdf', 'jpg'], maxFileSize: 5 },
        { name: 'Address Proof', description: 'Permanent and present address proof', isRequired: true, allowedFileTypes: ['pdf', 'jpg'], maxFileSize: 5 },
        { name: 'Character References from 2 Gazetted Officers', description: 'Signed character recommendations', isRequired: true, allowedFileTypes: ['pdf'], maxFileSize: 5 }
      ]
    }
  ];

  await DocumentTypeModel.insertMany(docTypesData);

  // 4. Create Pre-seeded Requests across various workflow stages
  const now = new Date();

  // Helper date generators
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();
  const daysAhead = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString();

  // Request 1: Ready for Download (Income Certificate for Rahul)
  const req1 = await RequestModel.create({
    _id: 'req_000001',
    requestNumber: 'GOV-2026-000001',
    citizen: rahul._id,
    documentType: 'dt_income_001',
    applicationData: {
      applicantName: 'Rahul Patel',
      fatherName: 'Girish Patel',
      annualIncome: '420000',
      occupation: 'Software Engineer (Private Sector)',
      purposeOfCertificate: 'Higher Education Scholarship Scheme',
      district: 'Mumbai Suburban',
      state: 'Maharashtra'
    },
    uploadedDocuments: [
      {
        _id: 'doc_req1_1',
        documentType: 'Aadhaar Card',
        originalName: 'Aadhaar_Rahul_Patel.pdf',
        storedName: 'aadhaar_demo_01.pdf',
        mimeType: 'application/pdf',
        size: 842000,
        path: '',
        uploadedBy: rahul._id,
        uploadedAt: daysAgo(5),
        verificationStatus: 'VERIFIED',
        verificationRemarks: 'UIDAI digital signature valid.'
      },
      {
        _id: 'doc_req1_2',
        documentType: 'Salary Slip / ITR / Form 16',
        originalName: 'ITR_V_AY2025_26.pdf',
        storedName: 'itr_demo_01.pdf',
        mimeType: 'application/pdf',
        size: 1240000,
        path: '',
        uploadedBy: rahul._id,
        uploadedAt: daysAgo(5),
        verificationStatus: 'VERIFIED',
        verificationRemarks: 'Income threshold confirmed under ₹8,00,000.'
      }
    ],
    status: 'READY_FOR_DOWNLOAD',
    currentDepartment: 'Revenue & Land Records Department',
    assignedOfficer: 'Officer Vikram Sharma (SDM Cell)',
    remarks: 'Application verified and digitally signed. Certificate ready for instant download.',
    finalDocument: {
      originalName: 'GOV-2026-000001-Income-Certificate.pdf',
      storedName: 'cert_gov_2026_000001.pdf',
      mimeType: 'application/pdf',
      size: 152000,
      path: '',
      uploadedAt: daysAgo(1)
    },
    submittedAt: daysAgo(6),
    lastUpdatedAt: daysAgo(1),
    expectedCompletionDate: daysAhead(1)
  });

  // History for Req 1
  await RequestStatusHistoryModel.insertMany([
    {
      request: req1._id,
      oldStatus: 'NONE',
      newStatus: 'SUBMITTED',
      changedBy: rahul._id,
      changedByRole: 'citizen',
      remarks: 'Application submitted online with Aadhaar and Form 16.',
      timestamp: daysAgo(6)
    },
    {
      request: req1._id,
      oldStatus: 'SUBMITTED',
      newStatus: 'UNDER_REVIEW',
      changedBy: admin._id,
      changedByRole: 'admin',
      remarks: 'Application assigned to Tehsildar Desk for initial scrutiny.',
      timestamp: daysAgo(5)
    },
    {
      request: req1._id,
      oldStatus: 'UNDER_REVIEW',
      newStatus: 'DOCUMENT_VERIFICATION',
      changedBy: admin._id,
      changedByRole: 'admin',
      remarks: 'Documents forwarded for electronic UIDAI & Income tax ledger cross-verification.',
      timestamp: daysAgo(4)
    },
    {
      request: req1._id,
      oldStatus: 'DOCUMENT_VERIFICATION',
      newStatus: 'PROCESSING',
      changedBy: admin._id,
      changedByRole: 'admin',
      remarks: 'All documents verified successfully. Draft certificate generated.',
      timestamp: daysAgo(2)
    },
    {
      request: req1._id,
      oldStatus: 'PROCESSING',
      newStatus: 'APPROVED',
      changedBy: admin._id,
      changedByRole: 'admin',
      remarks: 'Approved by Sub-Divisional Magistrate. Cryptographic seal affixed.',
      timestamp: daysAgo(1)
    },
    {
      request: req1._id,
      oldStatus: 'APPROVED',
      newStatus: 'READY_FOR_DOWNLOAD',
      changedBy: admin._id,
      changedByRole: 'admin',
      remarks: 'Certificate published to citizen repository. Available for download.',
      timestamp: daysAgo(1)
    }
  ]);

  // Request 2: Document Verification Stage (Domicile Certificate for Rahul)
  const req2 = await RequestModel.create({
    _id: 'req_000002',
    requestNumber: 'GOV-2026-000002',
    citizen: rahul._id,
    documentType: 'dt_domicile_003',
    applicationData: {
      applicantName: 'Rahul Patel',
      residingSinceYear: '2005',
      currentAddress: '42 Shanti Nagar, Mumbai',
      district: 'Mumbai Suburban'
    },
    uploadedDocuments: [
      {
        _id: 'doc_req2_1',
        documentType: 'Aadhaar Card',
        originalName: 'Aadhaar_Rahul.pdf',
        storedName: 'aadhaar_demo_02.pdf',
        mimeType: 'application/pdf',
        size: 512000,
        path: '',
        uploadedBy: rahul._id,
        uploadedAt: daysAgo(3),
        verificationStatus: 'VERIFIED',
        verificationRemarks: 'Matched citizen database.'
      },
      {
        _id: 'doc_req2_2',
        documentType: 'Proof of Residence (15 Years)',
        originalName: 'Electricity_Bills_2010_2025.pdf',
        storedName: 'bills_demo_02.pdf',
        mimeType: 'application/pdf',
        size: 2150000,
        path: '',
        uploadedBy: rahul._id,
        uploadedAt: daysAgo(3),
        verificationStatus: 'PENDING',
        verificationRemarks: 'Under scrutiny by circle revenue inspector.'
      }
    ],
    status: 'DOCUMENT_VERIFICATION',
    currentDepartment: 'Department of Revenue & Civil Administration',
    assignedOfficer: 'Officer Sunita Rao',
    remarks: 'Aadhaar verified. Residence tenure records undergoing circle verification.',
    submittedAt: daysAgo(4),
    lastUpdatedAt: daysAgo(2),
    expectedCompletionDate: daysAhead(6)
  });

  await RequestStatusHistoryModel.insertMany([
    {
      request: req2._id,
      oldStatus: 'NONE',
      newStatus: 'SUBMITTED',
      changedBy: rahul._id,
      changedByRole: 'citizen',
      remarks: 'Application submitted for state Domicile Certificate.',
      timestamp: daysAgo(4)
    },
    {
      request: req2._id,
      oldStatus: 'SUBMITTED',
      newStatus: 'UNDER_REVIEW',
      changedBy: admin._id,
      changedByRole: 'admin',
      remarks: 'Application received and registered in registry.',
      timestamp: daysAgo(3)
    },
    {
      request: req2._id,
      oldStatus: 'UNDER_REVIEW',
      newStatus: 'DOCUMENT_VERIFICATION',
      changedBy: admin._id,
      changedByRole: 'admin',
      remarks: 'Identity verified; reviewing historical utility receipts.',
      timestamp: daysAgo(2)
    }
  ]);

  // Request 3: Additional Document Required (Caste Certificate for Priya)
  const req3 = await RequestModel.create({
    _id: 'req_000003',
    requestNumber: 'GOV-2026-000003',
    citizen: priya._id,
    documentType: 'dt_caste_002',
    applicationData: {
      applicantName: 'Priya Deshmukh',
      subCaste: 'Maratha Kunbi',
      fatherName: 'Suresh Deshmukh',
      district: 'Pune'
    },
    uploadedDocuments: [
      {
        _id: 'doc_req3_1',
        documentType: 'Aadhaar Card',
        originalName: 'Priya_Aadhaar.pdf',
        storedName: 'priya_aadhaar.pdf',
        mimeType: 'application/pdf',
        size: 620000,
        path: '',
        uploadedBy: priya._id,
        uploadedAt: daysAgo(4),
        verificationStatus: 'VERIFIED',
        verificationRemarks: 'Verified.'
      }
    ],
    status: 'ADDITIONAL_DOCUMENT_REQUIRED',
    currentDepartment: 'Social Justice & Empowerment Department',
    assignedOfficer: 'Officer Ramesh Kulkarni',
    remarks: 'Additional document requested: "Father / Blood Relative Caste Certificate". Instructions: Please upload father\'s 1967 school leaving certificate or grandfather\'s land record mentioning lineage.',
    submittedAt: daysAgo(5),
    lastUpdatedAt: daysAgo(1),
    expectedCompletionDate: daysAhead(10)
  });

  await RequestStatusHistoryModel.insertMany([
    {
      request: req3._id,
      oldStatus: 'NONE',
      newStatus: 'SUBMITTED',
      changedBy: priya._id,
      changedByRole: 'citizen',
      remarks: 'Application submitted.',
      timestamp: daysAgo(5)
    },
    {
      request: req3._id,
      oldStatus: 'SUBMITTED',
      newStatus: 'UNDER_REVIEW',
      changedBy: admin._id,
      changedByRole: 'admin',
      remarks: 'Application reviewed by scrutiny committee.',
      timestamp: daysAgo(3)
    },
    {
      request: req3._id,
      oldStatus: 'UNDER_REVIEW',
      newStatus: 'DOCUMENT_VERIFICATION',
      changedBy: admin._id,
      changedByRole: 'admin',
      remarks: 'Initial documents checked.',
      timestamp: daysAgo(2)
    },
    {
      request: req3._id,
      oldStatus: 'DOCUMENT_VERIFICATION',
      newStatus: 'ADDITIONAL_DOCUMENT_REQUIRED',
      changedBy: admin._id,
      changedByRole: 'admin',
      remarks: "Paternal ancestry record required to substantiate claim under 1967 gazette norms.",
      timestamp: daysAgo(1)
    }
  ]);

  // Request 4: Senior Citizen Certificate (Completed for Priya's relative)
  const req4 = await RequestModel.create({
    _id: 'req_000004',
    requestNumber: 'GOV-2026-000004',
    citizen: priya._id,
    documentType: 'dt_senior_009',
    applicationData: {
      applicantName: 'Suresh Deshmukh',
      dateOfBirth: '1958-04-12',
      bloodGroup: 'O+',
      emergencyContact: '+91 98222 33445'
    },
    uploadedDocuments: [
      {
        _id: 'doc_req4_1',
        documentType: 'Age Proof (Aadhaar / Voter ID / PAN)',
        originalName: 'PAN_Suresh.pdf',
        storedName: 'pan_suresh.pdf',
        mimeType: 'application/pdf',
        size: 380000,
        path: '',
        uploadedBy: priya._id,
        uploadedAt: daysAgo(10),
        verificationStatus: 'VERIFIED',
        verificationRemarks: 'Age 67 confirmed.'
      }
    ],
    status: 'COMPLETED',
    currentDepartment: 'Social Welfare & Senior Citizen Empowerment',
    assignedOfficer: 'Officer Vikram Sharma',
    remarks: 'Smart Senior Citizen card dispatched to registered residential address. Digital copy downloaded.',
    finalDocument: {
      originalName: 'GOV-2026-000004-Senior-Citizen-Card.pdf',
      storedName: 'senior_card_000004.pdf',
      mimeType: 'application/pdf',
      size: 94000,
      path: '',
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
      oldStatus: 'NONE',
      newStatus: 'SUBMITTED',
      changedBy: priya._id,
      changedByRole: 'citizen',
      remarks: 'Application submitted for Senior Citizen Card.',
      timestamp: daysAgo(11)
    },
    {
      request: req4._id,
      oldStatus: 'SUBMITTED',
      newStatus: 'UNDER_REVIEW',
      changedBy: admin._id,
      changedByRole: 'admin',
      remarks: 'Application verified.',
      timestamp: daysAgo(9)
    },
    {
      request: req4._id,
      oldStatus: 'UNDER_REVIEW',
      newStatus: 'PROCESSING',
      changedBy: admin._id,
      changedByRole: 'admin',
      remarks: 'Card personalization initiated.',
      timestamp: daysAgo(7)
    },
    {
      request: req4._id,
      oldStatus: 'PROCESSING',
      newStatus: 'APPROVED',
      changedBy: admin._id,
      changedByRole: 'admin',
      remarks: 'Approved by Welfare Officer.',
      timestamp: daysAgo(5)
    },
    {
      request: req4._id,
      oldStatus: 'APPROVED',
      newStatus: 'READY_FOR_DOWNLOAD',
      changedBy: admin._id,
      changedByRole: 'admin',
      remarks: 'Electronic Senior Citizen Card generated.',
      timestamp: daysAgo(4)
    },
    {
      request: req4._id,
      oldStatus: 'READY_FOR_DOWNLOAD',
      newStatus: 'COMPLETED',
      changedBy: priya._id,
      changedByRole: 'citizen',
      remarks: 'Certificate downloaded and acknowledged by applicant.',
      timestamp: daysAgo(3)
    }
  ]);

  // Request 5: Fresh Submitted (Birth Certificate for Rahul)
  const req5 = await RequestModel.create({
    _id: 'req_000005',
    requestNumber: 'GOV-2026-000005',
    citizen: rahul._id,
    documentType: 'dt_birth_005',
    applicationData: {
      childName: 'Aarav Patel',
      dateOfBirth: '2026-08-15',
      placeOfBirth: 'Lilavati Hospital, Bandra, Mumbai',
      fatherName: 'Rahul Patel',
      motherName: 'Ananya Patel'
    },
    uploadedDocuments: [
      {
        _id: 'doc_req5_1',
        documentType: 'Hospital Discharge Certificate',
        originalName: 'Lilavati_Discharge_Card.pdf',
        storedName: 'discharge_demo.pdf',
        mimeType: 'application/pdf',
        size: 720000,
        path: '',
        uploadedBy: rahul._id,
        uploadedAt: daysAgo(1),
        verificationStatus: 'PENDING'
      }
    ],
    status: 'SUBMITTED',
    currentDepartment: 'Municipal Corporation Health Department',
    assignedOfficer: 'Pending Assignment',
    remarks: 'Application submitted online. Awaiting departmental assignment.',
    submittedAt: daysAgo(1),
    lastUpdatedAt: daysAgo(1),
    expectedCompletionDate: daysAhead(6)
  });

  await RequestStatusHistoryModel.create({
    request: req5._id,
    oldStatus: 'NONE',
    newStatus: 'SUBMITTED',
    changedBy: rahul._id,
    changedByRole: 'citizen',
    remarks: 'Application submitted successfully via online citizen portal.',
    timestamp: daysAgo(1)
  });

  // Request 6: Rejected EWS Certificate
  const req6 = await RequestModel.create({
    _id: 'req_000006',
    requestNumber: 'GOV-2026-000006',
    citizen: rahul._id,
    documentType: 'dt_ews_008',
    applicationData: {
      applicantName: 'Rahul Patel',
      declaredAnnualIncome: '950000',
      agriculturalLand: 'None',
      residentialFlatArea: '1100 sq ft'
    },
    uploadedDocuments: [],
    status: 'REJECTED',
    currentDepartment: 'Revenue & Civil Administration',
    assignedOfficer: 'Officer Vikram Sharma',
    remarks: 'Application rejected: Declared family income (₹9.5 Lakhs) and residential flat area (1100 sq ft) exceed statutory EWS limits under central guidelines.',
    rejectionReason: 'Declared family income (₹9.5 Lakhs) and residential flat area exceed statutory EWS limits.',
    submittedAt: daysAgo(8),
    lastUpdatedAt: daysAgo(4),
    expectedCompletionDate: daysAgo(2)
  });

  await RequestStatusHistoryModel.insertMany([
    {
      request: req6._id,
      oldStatus: 'NONE',
      newStatus: 'SUBMITTED',
      changedBy: rahul._id,
      changedByRole: 'citizen',
      remarks: 'Submitted.',
      timestamp: daysAgo(8)
    },
    {
      request: req6._id,
      oldStatus: 'SUBMITTED',
      newStatus: 'UNDER_REVIEW',
      changedBy: admin._id,
      changedByRole: 'admin',
      remarks: 'Scrutinized financial declarations.',
      timestamp: daysAgo(6)
    },
    {
      request: req6._id,
      oldStatus: 'UNDER_REVIEW',
      newStatus: 'REJECTED',
      changedBy: admin._id,
      changedByRole: 'admin',
      remarks: 'Exceeds income eligibility ceiling of ₹8,00,000.',
      timestamp: daysAgo(4)
    }
  ]);

  // 5. Notifications
  await NotificationModel.insertMany([
    {
      user: rahul._id,
      title: 'Certificate Ready for Download!',
      message: 'Your Income Certificate (GOV-2026-000001) has been approved and is ready for download.',
      type: 'DOCUMENT_READY',
      request: req1._id,
      isRead: false,
      createdAt: daysAgo(1)
    },
    {
      user: rahul._id,
      title: 'Status Updated: DOCUMENT VERIFICATION',
      message: 'Your Domicile Certificate request GOV-2026-000002 has moved to Document Verification.',
      type: 'STATUS_UPDATE',
      request: req2._id,
      isRead: true,
      createdAt: daysAgo(2)
    },
    {
      user: priya._id,
      title: 'Action Required: Additional Document Needed',
      message: 'For request GOV-2026-000003: Please upload Father / Blood Relative Caste Certificate.',
      type: 'DOCUMENT_REQUIRED',
      request: req3._id,
      isRead: false,
      createdAt: daysAgo(1)
    },
    {
      user: priya._id,
      title: 'Senior Citizen Card Issued',
      message: 'Senior Citizen Card (GOV-2026-000004) has been successfully issued.',
      type: 'APPROVAL',
      request: req4._id,
      isRead: true,
      createdAt: daysAgo(3)
    }
  ]);

  // 6. Audit Logs
  await AuditLogModel.insertMany([
    {
      user: admin._id,
      action: 'ADMIN_LOGIN',
      description: 'Officer Vikram Sharma logged in from administrative console.',
      ipAddress: '127.0.0.1',
      timestamp: daysAgo(1)
    },
    {
      user: admin._id,
      action: 'FINAL_DOCUMENT_UPLOADED',
      request: req1._id,
      description: 'Officer issued and uploaded final certificate for request GOV-2026-000001',
      ipAddress: '127.0.0.1',
      timestamp: daysAgo(1)
    },
    {
      user: admin._id,
      action: 'ADDITIONAL_DOC_REQUESTED',
      request: req3._id,
      description: 'Officer requested additional document "Father / Blood Relative Caste Certificate" for request GOV-2026-000003',
      ipAddress: '127.0.0.1',
      timestamp: daysAgo(1)
    },
    {
      user: admin._id,
      action: 'DOCUMENT_VERIFIED',
      request: req2._id,
      description: "Officer verified Aadhaar Card for request GOV-2026-000002",
      ipAddress: '127.0.0.1',
      timestamp: daysAgo(2)
    }
  ]);

  console.log('✅ Demo database seeded successfully with Admin, Citizens, Document Types, and Requests.');
}
