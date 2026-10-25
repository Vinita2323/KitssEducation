import { createPublishingModels } from './publishing.models.js';
import { createPublishingCoordination } from './coordination.js';
import { createPublishingService } from './publishing.service.js';
import { createMediaService } from '../media/media.service.js';

export async function createPublishingModule({ connection, institutionService, authService, storage, config, logger, scanner }) {
  const models = createPublishingModels(connection);
  for (const Model of Object.values(models)) await Model.createIndexes();
  const coordination = createPublishingCoordination({ lockModel: institutionService.models.DomainLock, auditModel: authService.models.AuditLog, logger, models });
  const media = createMediaService({ models, storage, coordination, config, authService, scanner });
  const publishing = createPublishingService({ models, taxonomy: institutionService.models.Taxonomy, coordination, media });
  const maintenance = async () => { await coordination.maintenance(); await media.maintenance(); };
  await maintenance();
  return { models, media, publishing, coordination, maintenance };
}
