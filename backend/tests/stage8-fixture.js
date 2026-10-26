import { coachingFixture } from './coaching-fixture.js';
import { createResultModels } from '../src/modules/results/results.models.js';
import { createResultService } from '../src/modules/results/results.service.js';
import { createNotificationService } from '../src/modules/notifications/notifications.js';
import { createAccountService } from '../src/modules/auth/account.service.js';
import { createApp } from '../src/app.js';
export async function stage8Fixture(name, options = {}) {
  if (!/^kitss_stage(?:[89]|10)_(?:test|browser)_[a-f0-9]{16}$/.test(name)) throw new Error('New isolated results-family database required');
  const f = await coachingFixture(name, options);
  try {
    const messages = [],
      mail = {
        send: async message => {
          messages.push(message);
        }
      };
    const resultModels = createResultModels(f.connection);
    const args = {
      models: resultModels,
      publishingModule: f,
      authService: f.auth,
      commerceService: f.service,
      config: f.config
    };
    const results = await createResultService(args);
    // Explicit injection exists ONLY here; app composition never enables it.
    const trusted = await createResultService({
      ...args,
      trustedSource: issuer => issuer.source?.authorizationReference === 'SYNTHETIC_ISOLATED_ONLY'
    });
    const notifications = await createNotificationService({
      connection: f.connection,
      authService: f.auth,
      publishingModule: f,
      coachingService: f.learning
    });
    const account = createAccountService({
      authService: f.auth,
      config: f.config,
      mail,
      institutions: f.institutions
    });
    Object.assign(f.models, resultModels, notifications.models);
    const app = (useTrusted = false) => createApp({
      config: f.config,
      logger: f.logger,
      database: {
        isReady: async () => true
      },
      storage: f.storage,
      authService: f.auth,
      institutionService: f.institutions,
      publishingModule: f,
      commerceService: f.service,
      coachingService: f.learning,
      resultService: useTrusted ? trusted : results,
      notificationService: notifications,
      accountService: account
    });
    const originalClose = f.close;
    return {
      ...f,
      results,
      trusted,
      notifications,
      account,
      messages,
      app,
      async close() {
        await originalClose();
      }
    };
  } catch (e) {
    await f.close();
    throw e;
  }
}
