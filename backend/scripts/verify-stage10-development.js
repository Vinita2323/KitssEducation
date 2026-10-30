import assert from 'node:assert/strict';
import http from 'node:http';
import mongoose from 'mongoose';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js';
import { chromium } from '../../frontend/node_modules/playwright-core/index.mjs';
import { loadConfig } from '../src/config/env.js';
import { startServer } from '../src/server.js';
import { createLogger } from '../src/config/logger.js';
if (!process.argv.includes('--confirm-development')) throw new Error('Explicit development flag required');
const config = loadConfig();
if (config.nodeEnv !== 'development' || config.mongo.dbName !== 'kitss_education_dev') throw new Error('Exact KITSS development environment required');
let runtime, vite, browser, connection;
const report = {
  database: config.mongo.dbName,
  applicationFixturesCreated: false,
  realProviderCalls: false,
  topologyOrCredentialsChanged: false,
  routes: [],
  checks: {}
};
try {
  const reservation = http.createServer();
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const frontendPort = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  config.corsOrigins = ['http://127.0.0.1:' + frontendPort];
  runtime = await startServer({
    config,
    logger: createLogger({
      level: 'silent'
    }),
    port: 0
  });
  const backendBase = 'http://127.0.0.1:' + runtime.server.address().port;
  connection = await mongoose.createConnection(config.mongo.uri, {
    dbName: config.mongo.dbName,
    autoIndex: false,
    serverSelectionTimeoutMS: 30000
  }).asPromise();
  const collections = await connection.db.listCollections({}, {
    nameOnly: true
  }).toArray();
  report.applicationCollectionCount = collections.length;
  report.indexes = [];
  for (const item of collections) report.indexes.push({
    collection: item.name,
    count: (await connection.db.collection(item.name).indexes()).length
  });
  const oldDrafts = await connection.db.collection('coachingCourses').find({
    title: /STAGE7/
  }, {
    projection: {
      _id: 1
    }
  }).toArray();
  report.retainedDraftCount = oldDrafts.length;
  await connection.close();
  connection = null;
  vite = await createServer({
    root: fileURLToPath(new URL('../../frontend/', import.meta.url)),
    cacheDir: fileURLToPath(new URL('../../frontend/test-artifacts/vite-stage10-actual/', import.meta.url)),
    server: {
      host: '127.0.0.1',
      port: frontendPort,
      strictPort: true,
      hmr: false,
      watch: null,
      proxy: {
        '/api': {
          target: backendBase,
          changeOrigin: true
        }
      }
    },
    logLevel: 'error'
  });
  await vite.listen();
  const base = 'http://127.0.0.1:' + vite.httpServer.address().port;
  config.corsOrigins = [base];
  const read = async path => {
    const response = await fetch(base + '/api/v1' + path);
    return {
      response,
      data: await response.json()
    };
  };
  report.checks.ready = (await read('/health/ready')).response.status === 200;
  report.checks.frontendProxy = (await read('/results/config')).response.status === 200;
  report.checks.officialPublicationDisabled = (await read('/results/config')).data.data.publicationEnabled === false;
  report.checks.paymentDisabled = (await read('/public/payment-config')).data.data.available === false;
  report.checks.sessionRequired = (await read('/me/preferences')).response.status === 401;
  report.checks.adminProtected = (await read('/admin/results/records')).response.status === 401;
  report.checks.accountsProtected = (await read('/admin/users')).response.status === 401;
  report.checks.auditProtected = (await read('/admin/audit-logs')).response.status === 401;
  report.checks.jobsProtected = (await read('/admin/jobs')).response.status === 401;
  report.checks.badOriginDenied = (await fetch(backendBase + '/api/v1/results/config', {
    headers: {
      Origin: 'https://untrusted.invalid'
    }
  })).status === 403;
  const csrfResponse = await fetch(base + '/api/v1/auth/accounts', {
    method: 'POST',
    headers: {
      Origin: base,
      'Content-Type': 'application/json'
    },
    body: '{}'
  });
  report.checks.missingCsrfDenied = csrfResponse.status === 403 && (await csrfResponse.json()).error.code === 'CSRF_INVALID';
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true
  });
  const context = await browser.newContext({
    viewport: {
      width: 375,
      height: 950
    }
  });
  const page = await context.newPage(),
    errors = [],
    unexpectedWrites = [];
  page.on('pageerror', e => errors.push(e.message));
  await context.route('**/*', route => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.origin !== base) return route.abort();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
      unexpectedWrites.push(url.pathname);
      return route.abort();
    }
    return route.continue();
  });
  for (const path of ['/home', '/about', '/categories', '/colleges', '/books', '/coaching', '/coaching/select', '/results', '/register', '/account/create', '/account/verify', '/staff/accept', '/forgot-password', '/reset-password', '/login', '/profile', '/orders', '/admin']) {
    await page.goto(base + path, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForFunction(() => document.body.innerText.trim().length > 0, null, {
      timeout: 30000
    });
    assert.ok((await page.locator('body').innerText()).trim().length > 0, path + ' is blank');
    report.routes.push({
      path,
      loaded: true,
      finalPath: new URL(page.url()).pathname
    });
  }
  await mkdir('frontend/test-artifacts', {
    recursive: true
  });
  await page.screenshot({
    path: 'frontend/test-artifacts/stage10-actual-login.png',
    fullPage: true
  });
  report.checks.noRouteCrashes = errors.length === 0;
  report.checks.noPageLoadWrites = unexpectedWrites.length === 0;
  report.checks.schemasInitialized = collections.length === 32;
  await browser.close();
  browser = null;
  await vite.close();
  vite = null;
  await runtime.close();
  runtime = await startServer({
    config,
    logger: createLogger({
      level: 'silent'
    }),
    port: 0
  });
  report.checks.restartReady = (await fetch('http://127.0.0.1:' + runtime.server.address().port + '/api/v1/health/ready')).status === 200;
  connection = await mongoose.createConnection(config.mongo.uri, {
    dbName: config.mongo.dbName,
    autoIndex: false
  }).asPromise();
  report.checks.retainedPersistence = (await connection.db.collection('coachingCourses').countDocuments({
    _id: {
      $in: oldDrafts.map(r => r._id)
    }
  })) === oldDrafts.length;
  report.allPassed = Object.values(report.checks).every(Boolean);
  await writeFile('backend/STAGE10-DEVELOPMENT-VERIFICATION.json', JSON.stringify(report, null, 2) + '\n');
  assert.ok(report.allPassed, 'Actual development acceptance failed: ' + Object.keys(report.checks).filter(k => !report.checks[k]).join(', '));
  console.log(JSON.stringify({
    checks: report.checks,
    applicationCollections: collections.length,
    routes: report.routes.length
  }));
} finally {
  await browser?.close();
  await vite?.close();
  await connection?.close();
  await runtime?.close();
}
