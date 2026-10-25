import React from 'react';
import { useParams } from 'react-router-dom';
import { SecurePdfReader } from '../../components/coaching/SecurePdfReader';
export function PdfReaderPage() {
  const {
    id
  } = useParams();
  return <SecurePdfReader bookId={id} />;
}
