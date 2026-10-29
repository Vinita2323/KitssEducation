// Mirrors the server's publication gate (publishing.service.js validate); the server stays authoritative.
export const bookRequirements = book => [
  ['Author', Boolean(book.author?.trim())],
  ['Language', Boolean(book.languageId)],
  ['Description', Boolean(book.description?.trim())],
  ['Cover image attached', Boolean(book.coverAssetId)],
  ['Full PDF attached', Boolean(book.documentAssetId)],
  ['Price set (zero for a free book)', Number.isSafeInteger(book.priceMinor) && book.priceMinor >= 0],
  ['Licensing reference supplied', book.rightsConfirmed === true && Boolean(book.rightsNote?.trim())],
];

// Where a book stands for students. "Off sale" books were published before: owners keep reading them.
export function bookState(book) {
  if (book.status === 'archived') return { key: 'removed', label: 'Removed from store', tone: 'bg-slate-100 text-slate-700 ring-slate-200' };
  if (book.status === 'published') return book.publication?.changesPending
    ? { key: 'changes', label: 'Live · unpublished changes', tone: 'bg-amber-50 text-amber-800 ring-amber-200' }
    : { key: 'live', label: 'Live', tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200' };
  return book.publication?.everPublished
    ? { key: 'offSale', label: 'Off sale', tone: 'bg-rose-50 text-rose-800 ring-rose-200' }
    : { key: 'draft', label: 'Draft', tone: 'bg-sky-50 text-sky-800 ring-sky-200' };
}

export const rupees = minor => minor === undefined || minor === null ? 'Not set' : minor === 0 ? 'Free'
  : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: minor % 100 ? 2 : 0, maximumFractionDigits: 2 }).format(minor / 100);
