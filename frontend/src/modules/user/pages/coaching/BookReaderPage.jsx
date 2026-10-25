import React from 'react';
import { useParams } from 'react-router-dom';
import { SecurePdfReader } from '../../components/coaching/SecurePdfReader';
export function BookReaderPage() {
  const {
    id,
    bookId
  } = useParams();
  return <SecurePdfReader bookId={bookId} courseId={id} />;
}
