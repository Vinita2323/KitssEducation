import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite } from './authService';
export const resultService = {
  config: signal => httpClient.request('/results/config', {
    signal
  }).then(r => r.data),
  issuer: (id, signal) => httpClient.request('/results/issuers/' + id, {
    signal
  }).then(r => r.data),
  lookup: data => authenticatedWrite('/results/lookup', data),
  history: signal => httpClient.request('/me/results', {
    signal
  }).then(r => r.data)
};
