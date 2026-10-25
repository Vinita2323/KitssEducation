import { LocalStorageProvider } from './LocalStorageProvider.js';
import { AppError } from '../utils/AppError.js';

export function createStorageProvider(config) {
  if (config.provider === 'local') return new LocalStorageProvider(config);
  throw new AppError(500, 'UNSUPPORTED_STORAGE_PROVIDER', 'Storage provider is not supported');
}
