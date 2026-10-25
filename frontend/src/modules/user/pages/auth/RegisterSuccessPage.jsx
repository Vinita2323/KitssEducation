import React from 'react';
import { Navigate } from 'react-router-dom';
// No generated passwords or credential-copy fallback.
export const RegisterSuccessPage = () => <Navigate to="/account/verify" replace />;
