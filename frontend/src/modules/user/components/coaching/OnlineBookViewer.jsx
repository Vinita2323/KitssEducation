import React from 'react';
import { SecurePdfReader } from './SecurePdfReader';
export const OnlineBookViewer = ({
  book,
  courseId
}) => <SecurePdfReader bookId={book.id} courseId={courseId} />;
