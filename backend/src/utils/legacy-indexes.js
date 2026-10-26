import { AppError } from './AppError.js';

// Replacement constraints must already be installed by createIndexes(). Never drop by name alone.
export async function retireLegacyIndexes(Model, definitions) {
  const indexes = await Model.collection.indexes();
  for (const [name, key, allowedPartial = [undefined]] of definitions) {
    const old = indexes.find(i => i.name === name);
    if (!old?.unique) continue;
    const knownOptions=['v','ns','background','name','key','unique','sparse','partialFilterExpression'];
    if (Object.keys(old).some(option=>!knownOptions.includes(option)) || JSON.stringify(old.key) !== JSON.stringify(key) || !allowedPartial.some(filter => JSON.stringify(filter) === JSON.stringify(old.partialFilterExpression)) || old.sparse) throw new AppError(503, 'INDEX_COMPATIBILITY', 'Unexpected legacy index definition; preserve records and review a verified restored copy');
    await Model.collection.dropIndex(name);
  }
}
