import { createCoachingModels } from './coaching.models.js';
import { createCoachingService } from './coaching.service.js';
export async function createCoachingModule(options) {
  const service = createCoachingService({
    ...options,
    models: createCoachingModels(options.connection)
  });
  await service.initialize();
  await service.maintenance();
  options.commerce.learning = service;
  const prior = options.publishingModule.media.authorizeEntitlement;
  options.publishingModule.media.authorizeEntitlement = async (asset, auth) => (await prior?.(asset, auth)) || (await service.canReadAsset(asset, auth));
  options.publishingModule.media.learningReferences = service.references;
  return service;
}
