import mongoose from 'mongoose';
import { writeFile } from 'node:fs/promises';
import { loadConfig } from '../src/config/env.js';
import { startServer } from '../src/server.js';
import { createLogger } from '../src/config/logger.js';
if (!process.argv.includes('--confirm-development')) throw new Error('Explicit development verification flag required');
const config = loadConfig();
if (config.nodeEnv !== 'development' || config.mongo.dbName !== 'kitss_education_dev') throw new Error('Exact KITSS development environment required');
const logger = createLogger({
  level: 'silent'
});
let runtime;
try {
  runtime = await startServer({
    config,
    logger,
    port: 0
  });
  const base = 'http://127.0.0.1:' + runtime.server.address().port + '/api/v1';
  const request = async path => {
    const response = await fetch(base + path);
    return {
      status: response.status,
      body: await response.json()
    };
  };
  const ready = await request('/health/ready'),
    results = await request('/results/config'),
    privateNotices = await request('/me/notifications'),
    profile = await request('/me/preferences'),
    commerce = await request('/public/payment-config');
  await runtime.close();
  runtime = await startServer({
    config,
    logger,
    port: 0
  });
  const restart = await fetch('http://127.0.0.1:' + runtime.server.address().port + '/api/v1/health/ready');
  const connection = await mongoose.createConnection(config.mongo.uri, {
    dbName: config.mongo.dbName,
    autoIndex: false,
    serverSelectionTimeoutMS: 30000
  }).asPromise();
  let collections;
  try {
    collections = await connection.db.listCollections({}, {
      nameOnly: true
    }).toArray();
  } finally {
    await connection.close();
  }
  const required = ['resultIssuers', 'exams', 'resultRecords', 'resultHistory', 'notifications', 'notificationReceipts'];
  const checks = {
    ready: ready.status === 200,
    restartReady: restart.status === 200,
    resultConfig: results.status === 200,
    officialPublicationDisabled: results.body.data.publicationEnabled === false,
    notificationsProtected: privateNotices.status === 401,
    preferencesProtected: profile.status === 401,
    razorpayDisabled: commerce.status === 200 && commerce.body.data.available === false,
    stage8CollectionsPresent: required.every(name => collections.some(c => c.name === name))
  };
  if (!Object.values(checks).every(Boolean)) throw new Error('Stage 8 acceptance failed: ' + Object.keys(checks).filter(k => !checks[k]).join(', '));
  const result = {
    database: config.mongo.dbName,
    checks,
    applicationCollectionCount: collections.length,
    realProviderCalls: false,
    applicationFixturesCreated: false,
    environmentOrTopologyChanged: false
  };
  await writeFile('backend/STAGE8-DEVELOPMENT-VERIFICATION.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
} finally {
  await runtime?.close();
}
