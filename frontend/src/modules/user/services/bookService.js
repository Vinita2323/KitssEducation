import { commerceService } from './commerceService';
import { httpClient } from '../../../shared/api/httpClient';
import { queryString } from './collegeService';
import { contentService } from './contentService';
const palette = { navy: 'from-[#0A1D3F] to-[#133C8B]', orange: 'from-amber-600 to-orange-700', teal: 'from-teal-700 to-teal-800' };
export const bookDTO = row => ({ ...row, price: row.priceMinor === undefined ? undefined : row.priceMinor / 100, originalPrice: row.originalPriceMinor === undefined ? undefined : row.originalPriceMinor / 100, isFree: row.priceMinor === 0, coverIcon: row.iconKey || 'BookOpen', coverColor: palette[row.coverVariant] || palette.navy, chapters: (row.toc ?? []).map(c => c.title), pages: row.pageCount, format: 'PDF', canReadFull: false, fileSize: 'Private PDF', discount: row.originalPriceMinor > row.priceMinor ? Math.round((1 - row.priceMinor / row.originalPriceMinor) * 100) + '% OFF' : '' });
const filters = input => {
  const { query, board, className, subject, language, sort, minPrice, maxPrice, status, ...rest } = input ?? {};
  const select = (value, name) => value && value !== 'All' ? /^[a-f0-9]{24}$/i.test(value) ? { [name + 'Id']: value } : { [name]: value } : {};
  return { ...rest, ...select(board, 'board'), ...select(className, 'class'), ...select(subject, 'subject'), ...select(language, 'language'), q: query, sort: { 'price-low': 'price_asc', 'price-high': 'price_desc' }[sort] || sort, ...(minPrice !== undefined && minPrice !== '' ? { minPriceMinor: Math.round(Number(minPrice) * 100) } : {}), ...(maxPrice !== undefined && maxPrice !== '' ? { maxPriceMinor: Math.round(Number(maxPrice) * 100) } : {}), ...(status && status !== 'all' ? { status } : {}) };
};
export const bookService = {
  async getBooksPage(input = {}, signal) { const result = await httpClient.request('/books' + queryString(filters(input)), { signal }); return { ...result, data: result.data.map(bookDTO) }; },
  async getBooks(input) { return (await this.getBooksPage(input)).data; },
  async getBookById(id, signal) { return bookDTO((await httpClient.request('/books/' + encodeURIComponent(id), { signal })).data); },
  async getFacets(input = {}, signal) { return (await httpClient.request('/books/facets' + queryString(input), { signal })).data; },
  async getBoards() { return (await this.getFacets()).boards; },
  async getAvailableClasses(board) { const query = board && board !== 'All' ? /^[a-f0-9]{24}$/i.test(board) ? { boardId: board } : { board } : {}; return (await this.getFacets(query)).classes.map(c => c.name); },
  async getAvailableSubjects(board, className) { const query = {}; for (const [k, v] of [['board', board], ['class', className]]) if (v && v !== 'All') query[/^[a-f0-9]{24}$/i.test(v) ? k + 'Id' : k] = v; return (await this.getFacets(query)).subjects; },
  async getClasses() { return (await this.getFacets()).classes; },
  async getPreview(id, signal) { return (await httpClient.request('/books/' + id + '/preview', { signal })).data.assets; },
  async getMyLibraryBooks() { return Promise.all((await commerceService.books()).map(async row => ({ ...await this.getBookById(row.id), ...row }))); },
  async purchaseBook() { throw new Error('Please use the book checkout page to purchase access.'); },
  async adminPage(input) { const result = await contentService.adminList('/admin/books', filters(input)); return { ...result, data: result.data.map(bookDTO) }; },
  async getAllBooksForAdmin(input) { return (await this.adminPage(input)).data; },
  addBook: input => contentService.create('/admin/books', input),
  updateBook: (row, input) => contentService.edit('/admin/books', row, input),
  deleteBook: row => contentService.archive('/admin/books', row),
  togglePublishStatus: row => contentService.publish('/admin/books', row, row.status !== 'published'),
};
