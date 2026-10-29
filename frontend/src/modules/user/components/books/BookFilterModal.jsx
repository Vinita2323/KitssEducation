import React, { useState, useEffect } from "react";
import { BottomSheet } from "../common/Modal";
import { PrimaryButton } from "../common/PrimaryButton";
import { bookService } from "../../services/bookService";

export const BookPreviewModal = ({ isOpen, onClose, book }) => {
  const [assets, setAssets] = useState([]), [error, setError] = useState(''), [loading, setLoading] = useState(false);
  useEffect(() => { const controller = new AbortController(); if (isOpen && book?.id) { setLoading(true); setAssets([]); setError(''); bookService.getPreview(book.id, controller.signal).then(setAssets).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); }); } return () => controller.abort(); }, [isOpen, book?.id]);
  if (!book) return null;
  return <BottomSheet isOpen={isOpen} onClose={onClose} title={`Sample: ${book.title}`}><div className="space-y-4">
    <p className="text-xs text-[#667085]">You can preview the available sample pages. Full reading requires access to the book.</p>
    {loading && <p role="status">Loading public samples?</p>}{error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
    {!loading && !error && !assets.length && <p>No public sample has been approved.</p>}
    {assets.map(asset => <div key={asset.id} className="border rounded-xl p-2"><object aria-label="Public book sample" data={asset.url} type="application/pdf" className="w-full h-[55vh] min-h-64"><p className="text-xs">This browser cannot embed PDF previews.</p></object><a className="text-sm text-[#0A1D3F] underline" href={asset.url} target="_blank" rel="noopener noreferrer">Open approved public sample ({asset.pageCount} pages)</a></div>)}
    <PrimaryButton variant="orange" fullWidth onClick={onClose}>Close Preview</PrimaryButton>
  </div></BottomSheet>;
};
