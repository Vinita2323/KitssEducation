// Isolated bounded parser. No file paths or untrusted script execution.
import sharp from 'sharp';
import { PDFDocument, PDFDict, PDFArray, PDFName } from 'pdf-lib';
sharp.cache(false); sharp.concurrency(1);
try {
  const chunks = []; let size = 0;
  for await (const chunk of process.stdin) { size += chunk.length; if (size > 50 * 1024 * 1024) throw new Error('Limit'); chunks.push(chunk); }
  const bytes = Buffer.concat(chunks), mime = process.argv[2];
  let result;
  if (mime === 'application/json') {
    if (bytes.length > 2 * 1024 * 1024 || bytes.includes(0)) throw new Error('Invalid JSON');
    const parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!Array.isArray(parsed) || !parsed.length || parsed.length > 200) throw new Error('Invalid result import rows');
    result = { mime };
  } else if (mime === 'application/pdf') {
    if (bytes.subarray(0, 5).toString() !== '%PDF-' || !bytes.subarray(-2048).includes(Buffer.from('%%EOF'))) throw new Error('Invalid PDF');
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: false, updateMetadata: false, throwOnInvalidObject: true });
    if (pdf.isEncrypted || pdf.getPageCount() < 1 || pdf.getPageCount() > 10000) throw new Error('Invalid PDF');
    const forbidden = new Set(['JavaScript','JS','OpenAction','AA','Launch','EmbeddedFile','EmbeddedFiles','RichMedia','XFA','AcroForm','SubmitForm','ImportData']);
    const seen = new WeakSet(); let count = 0;
    const inspect = (obj, depth = 0) => {
      if (!obj || typeof obj !== 'object' || seen.has(obj)) return;
      if (++count > 100000 || depth > 80) throw new Error('PDF complexity'); seen.add(obj);
      if (obj instanceof PDFName && forbidden.has(obj.decodeText().replace(/#([0-9a-f]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex,16))))) throw new Error('Active PDF');
      if (obj instanceof PDFDict) for (const [name,value] of obj.entries()) { inspect(name,depth+1); inspect(value,depth+1); }
      else if (obj instanceof PDFArray) for (const item of obj.asArray()) inspect(item,depth+1);
      else if (obj.dict) inspect(obj.dict,depth+1);
    };
    for (const [, obj] of pdf.context.enumerateIndirectObjects()) inspect(obj);
    result = { mime, pageCount: pdf.getPageCount() };
  } else {
    const actual = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'image/png' : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'image/jpeg' : bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP' ? 'image/webp' : '';
    if (actual !== mime) throw new Error('Signature mismatch');
    const image = sharp(bytes, { limitInputPixels: 16000000, failOn: 'warning', animated: false });
    const meta = await image.metadata();
    if (!['png', 'jpeg', 'webp'].includes(meta.format) || meta.pages > 1 || !meta.width || !meta.height || meta.width > 8000 || meta.height > 8000) throw new Error('Image bounds');
    const safe = await image.rotate().png().toBuffer({ resolveWithObject: true });
    if (safe.data.length > 10 * 1024 * 1024) throw new Error('Output limit');
    result = { mime: 'image/png', width: safe.info.width, height: safe.info.height, data: safe.data.toString('base64') };
  }
  process.stdout.write(JSON.stringify(result));
} catch { process.exitCode = 1; }
