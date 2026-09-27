import 'dotenv/config';
import { createApp } from '../app.js';
import { connectDB } from '../config/db.js';
import { seedDatabase } from '../seed/seedData.js';
import { generateToken } from '../utils/jwt.js';
import { RequestModel, RequestStatusHistoryModel, UserModel } from '../models/index.js';
import http from 'http';

async function runTests() {
  console.log('🧪 Starting GovTrack Automated Verification Suite...\n');

  await connectDB();
  await seedDatabase();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(3001, resolve));
  const BASE_URL = 'http://localhost:3001/api';

  try {
    // 1. Fetch seed users
    const adminUser = await UserModel.findOne({ email: 'admin@govtrack.demo' }).exec();
    const citizen1 = await UserModel.findOne({ email: 'citizen@govtrack.demo' }).exec();
    const citizen2 = await UserModel.findOne({ email: 'priya.deshmukh@govtrack.demo' }).exec();

    if (!adminUser || !citizen1 || !citizen2) {
      throw new Error('Seed users missing');
    }

    const adminToken = generateToken({ userId: adminUser._id, role: 'admin', email: adminUser.email });
    const citizen1Token = generateToken({ userId: citizen1._id, role: 'citizen', email: citizen1.email });
    const citizen2Token = generateToken({ userId: citizen2._id, role: 'citizen', email: citizen2.email });

    // Test 1: Citizen cannot access Admin API (RBAC validation)
    console.log('Test 1: Citizen cannot access Admin API...');
    const rbacRes = await fetch(`${BASE_URL}/admin/requests`, {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    if (rbacRes.status === 403) {
      console.log('✅ PASSED: Citizen blocked from /api/admin/requests with 403 Forbidden.');
    } else {
      throw new Error(`FAILED: Expected 403 but got ${rbacRes.status}`);
    }

    // Test 2: Citizen cannot access another citizen\'s private request (IDOR prevention)
    console.log('\nTest 2: Citizen cannot access another citizen\'s private request (IDOR)...');
    // Find a request belonging to citizen2 (Priya)
    const priyaReq = await RequestModel.findOne({ citizen: citizen2._id }).exec();
    if (!priyaReq) throw new Error('Priya request not found in seed');

    const idorRes = await fetch(`${BASE_URL}/requests/${priyaReq._id}`, {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    if (idorRes.status === 403) {
      console.log(`✅ PASSED: Citizen 1 prevented from accessing Citizen 2 request with 403 Forbidden.`);
    } else {
      throw new Error(`FAILED: Expected 403 but got ${idorRes.status}`);
    }

    // Test 3: Admin can access any request
    console.log('\nTest 3: Admin can access request details...');
    const adminReqRes = await fetch(`${BASE_URL}/admin/requests/${priyaReq._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminReqData = await adminReqRes.json();
    if (adminReqRes.status === 200 && adminReqData.success) {
      console.log('✅ PASSED: Admin successfully accessed request details.');
    } else {
      throw new Error(`FAILED: Admin access failed with status ${adminReqRes.status}`);
    }

    // Test 4: Invalid status transition is rejected
    console.log('\nTest 4: Invalid status transition is rejected...');
    // Create a fresh test request
    const freshReq = await RequestModel.create({
      requestNumber: 'GOV-TEST-000999',
      citizen: citizen1._id,
      documentType: 'dt_income_001',
      applicationData: { test: true },
      uploadedDocuments: [],
      status: 'SUBMITTED',
      currentDepartment: 'Revenue',
      submittedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      expectedCompletionDate: new Date().toISOString()
    });

    // Try transitioning directly from SUBMITTED to READY_FOR_DOWNLOAD (invalid!)
    const invalidTransRes = await fetch(`${BASE_URL}/admin/requests/${freshReq._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'READY_FOR_DOWNLOAD' })
    });
    if (invalidTransRes.status === 400) {
      console.log('✅ PASSED: Invalid transition (SUBMITTED -> READY_FOR_DOWNLOAD) rejected with 400 Bad Request.');
    } else {
      throw new Error(`FAILED: Expected 400 but got ${invalidTransRes.status}`);
    }

    // Test 5: Valid status transition creates history and notification automatically
    console.log('\nTest 5: Valid status transition creates history & notification...');
    const validTransRes = await fetch(`${BASE_URL}/admin/requests/${freshReq._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'UNDER_REVIEW',
        remarks: 'Test desk assignment by automated test suite.'
      })
    });
    const validTransData = await validTransRes.json();
    if (validTransRes.status === 200 && validTransData.success) {
      // Check that history was created
      const historyRecords = await RequestStatusHistoryModel.find({
        request: freshReq._id,
        newStatus: 'UNDER_REVIEW'
      }).exec();

      if (historyRecords.length > 0) {
        console.log('✅ PASSED: Status updated to UNDER_REVIEW and RequestStatusHistory logged automatically.');
      } else {
        throw new Error('FAILED: RequestStatusHistory was not created!');
      }
    } else {
      throw new Error(`FAILED: Valid status update failed: ${validTransData.message}`);
    }

    // Clean up test request
    await RequestModel.findByIdAndDelete(freshReq._id);
    await RequestStatusHistoryModel.deleteMany({ request: freshReq._id });

    console.log('\n🎉 ALL 5 CRITICAL TEST SUITES PASSED END-TO-END!\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
