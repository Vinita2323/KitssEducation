// IO only. This contract does not implement authorization, scanning or entitlements.
export class StorageProvider {
  createKey() { throw new Error('StorageProvider.createKey must be implemented'); }
  async initialize() { throw new Error('StorageProvider.initialize must be implemented'); }
  async isReady() { throw new Error('StorageProvider.isReady must be implemented'); }
  async upload() { throw new Error('StorageProvider.upload must be implemented'); }
  async delete() { throw new Error('StorageProvider.delete must be implemented'); }
  async getFile() { throw new Error('StorageProvider.getFile must be implemented'); }
  getPublicUrl() { throw new Error('StorageProvider.getPublicUrl must be implemented'); }
  async getMetadata() { throw new Error('StorageProvider.getMetadata must be implemented'); }
}
