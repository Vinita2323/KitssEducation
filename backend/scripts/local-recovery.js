import { backupDatabase, restoreDatabase, connectLocal, inventory, compatibilityReport, storageIntegrity, relationshipIntegrity } from '../src/modules/operations/local-recovery.js';
import { LocalStorageProvider } from '../src/storage/LocalStorageProvider.js';
import { pathToFileURL } from 'node:url';

export async function main(args = process.argv.slice(2)) {
  const option = name => { const i=args.indexOf(name); return i < 0 ? undefined : args[i+1]; };
  const uri = option('--uri'), confirmedLocal = args.includes('--confirmed-local-development');
  if (args[0] === 'backup') {
    const result = await backupDatabase({ uri, confirmedLocal, writesQuiesced: args.includes('--writes-quiesced'), dumpBinary: option('--dump-binary') ?? 'mongodump' });
    console.log(JSON.stringify({ completed:true, directory:result.directory, sha256:result.manifest.sha256, exclusions:result.manifest.exclusions }));
  } else if(args[0] === 'restore') console.log(JSON.stringify(await restoreDatabase({ uri, confirmedLocal, directory:option('--backup'), restoreBinary:option('--restore-binary') ?? 'mongorestore' })));
  else if(args[0] === 'inventory') {
    const connection = await connectLocal(uri,confirmedLocal);
    try { console.log(JSON.stringify({ inventory:await inventory(connection), compatibility:await compatibilityReport(connection), relationships:await relationshipIntegrity(connection), ...(option('--storage-root')?{storage:await storageIntegrity(connection,new LocalStorageProvider({root:option('--storage-root')}))}:{}) },null,2)); }
    finally { await connection.close(); }
  } else throw new Error('Use inventory, backup or restore with explicit local-development confirmation');
}
if(process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { console.error(JSON.stringify({ completed:false,code:/^[A-Z_]+$/.test(error.code ?? '') ? error.code:'RECOVERY_FAILED',recovery:'Preserve the backup and partial destination; investigate privately, then use a NEW guarded destination. No automatic deletion or overwrite.' }));process.exitCode=1; });
