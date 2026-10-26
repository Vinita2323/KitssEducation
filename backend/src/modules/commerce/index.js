import { createBusinessPolicyService } from './business-policy.js';
import { createCommerceModels } from './commerce.models.js';
import { configuredProvider } from './payment-provider.js';
import { PaymentService } from './payment.service.js';

export async function createCommerceModule({ connection, publishingModule, authService, config, logger, provider, hooks }) {
  const service = new PaymentService({ models: createCommerceModels(connection), publishingModule, authService, logger, provider: provider ?? await configuredProvider(config.payment), hooks });
  service.business = createBusinessPolicyService(service);
  await service.initialize();
  publishingModule.media.registrationUploadAllowed = service.business.uploadAllowed;
  publishingModule.media.authorizeRegistration = service.business.documentAllowed;
  publishingModule.media.businessReferences = service.business.documentRefs;
  // Optional authorization hook; default Stage 5 behavior remains fail closed.
  publishingModule.media.authorizeEntitlement = (asset, auth) => service.canReadAsset(asset, auth);
  return service;
}
