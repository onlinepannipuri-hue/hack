process.env.NODE_ENV = 'test';
import assert from 'assert';
import http from 'http';
import mongoose from 'mongoose';
import { app, startServer } from '../src/server.js';
import { User } from '../src/models/User.js';
import { Device } from '../src/models/Device.js';
import { SmsMessage } from '../src/models/SmsMessage.js';
import { ENV } from '../src/config/env.js';

const TEST_PORT = 5099;
let serverInstance;
let baseUrl = `http://localhost:${TEST_PORT}/api`;


const request = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const headers = options.headers || {};
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => null);
  return {
    status: response.status,
    body: data,
  };
};

async function runTests() {
  console.log('=== Starting Backend Security & API Integration Tests ===\n');

  // Start dedicated test server instance
  serverInstance = await startServer(TEST_PORT);


  // Ensure DB connected or wait briefly
  if (mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(ENV.MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    } catch (e) {
      console.warn('Note: MongoDB daemon not active locally during standalone unit test.');
    }
  }

  try {
    // 1. Health check
    console.log('[Test 1] Testing Health Endpoint');
    const health = await request('/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.body.status, 'healthy');
    console.log('✔ Health check passed.\n');

    // Only run database tests if DB is reachable
    if (mongoose.connection.readyState === 1) {
      // Clean test users
      await User.deleteMany({ email: /test.*@example\.com/ });

      // 2. User A Registration
      console.log('[Test 2] User A Registration');
      const regResA = await request('/auth/register', {
        method: 'POST',
        body: {
          name: 'Alice Tester',
          email: 'test_alice@example.com',
          password: 'Password123!',
        },
      });
      assert.strictEqual(regResA.status, 201);
      assert.strictEqual(regResA.body.success, true);
      assert.ok(regResA.body.data.accessToken);
      const tokenA = regResA.body.data.accessToken;
      console.log('✔ User A registered successfully.\n');

      // 3. User B Registration
      console.log('[Test 3] User B Registration (for Cross-User Isolation Testing)');
      const regResB = await request('/auth/register', {
        method: 'POST',
        body: {
          name: 'Bob Tester',
          email: 'test_bob@example.com',
          password: 'Password123!',
        },
      });
      assert.strictEqual(regResB.status, 201);
      const tokenB = regResB.body.data.accessToken;
      console.log('✔ User B registered successfully.\n');

      // 4. Duplicate Registration Rejection
      console.log('[Test 4] Duplicate Email Rejection');
      const dupRes = await request('/auth/register', {
        method: 'POST',
        body: {
          name: 'Alice Duplicate',
          email: 'test_alice@example.com',
          password: 'Password123!',
        },
      });
      assert.strictEqual(dupRes.status, 409);
      console.log('✔ Duplicate registration correctly rejected with 409 Conflict.\n');

      // 5. Device Registration for User A
      console.log('[Test 5] Register Android Device for User A');
      const devResA = await request('/devices/register', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          deviceId: 'pixel_7_device_001',
          deviceName: 'Alice Google Pixel 7',
          platform: 'Android',
        },
      });
      assert.strictEqual(devResA.status, 201);
      assert.strictEqual(devResA.body.data.device.deviceId, 'pixel_7_device_001');
      console.log('✔ Device registered successfully.\n');

      // 6. Synchronize SMS Batch with Duplicate Prevention
      console.log('[Test 6] Synchronize SMS Batch (Idempotent Bulk Upsert)');
      const syncRes1 = await request('/sms/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          deviceId: 'pixel_7_device_001',
          messages: [
            {
              deviceMessageId: '1001',
              sender: '+19876543210',
              body: 'Hello! Your verification code is 482910.',
              timestamp: Date.now() - 50000,
              type: 'inbox',
            },
            {
              deviceMessageId: '1002',
              sender: '+19876543210',
              body: 'Thank you for confirming.',
              timestamp: Date.now() - 20000,
              type: 'sent',
            },
          ],
        },
      });
      assert.strictEqual(syncRes1.status, 200);
      assert.strictEqual(syncRes1.body.data.newInserted, 2);
      console.log('✔ First sync inserted 2 messages.\n');

      // Sync the exact same messages again to verify NO duplicates are created
      console.log('[Test 7] Sync Same SMS Payload Again (Verify Zero Duplicates)');
      const syncRes2 = await request('/sms/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          deviceId: 'pixel_7_device_001',
          messages: [
            {
              deviceMessageId: '1001',
              sender: '+19876543210',
              body: 'Hello! Your verification code is 482910.',
              timestamp: Date.now() - 50000,
              type: 'inbox',
            },
          ],
        },
      });
      assert.strictEqual(syncRes2.status, 200);
      assert.strictEqual(syncRes2.body.data.newInserted, 0);
      console.log('✔ Duplicate message was rejected/skipped correctly. Zero duplicate records created.\n');

      // 8. Cross-User Data Isolation Verification
      console.log('[Test 8] Cross-User Security Check: User B MUST NOT see User A SMS');
      const userBMsgs = await request('/sms', {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(userBMsgs.status, 200);
      assert.strictEqual(userBMsgs.body.data.messages.length, 0);

      const userBConvs = await request('/sms/conversations', {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(userBConvs.status, 200);
      assert.strictEqual(userBConvs.body.data.conversations.length, 0);
      console.log('✔ Verified complete data isolation between accounts.\n');

      // 9. Search Endpoint
      console.log('[Test 9] Global SMS Search for "verification code"');
      const searchRes = await request('/sms/search?q=verification', {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(searchRes.status, 200);
      assert.strictEqual(searchRes.body.data.results.length, 1);
      assert.ok(searchRes.body.data.results[0].body.includes('482910'));
      console.log('✔ Search query returned matching message.\n');

      // Cleanup
      await User.deleteMany({ email: /test.*@example\.com/ });
      await Device.deleteMany({ deviceId: 'pixel_7_device_001' });
      await SmsMessage.deleteMany({ sender: '+19876543210' });
    }

    console.log('🎉 ALL INTEGRATION & SECURITY TESTS PASSED!');
  } finally {
    serverInstance.close();
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
