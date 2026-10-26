import { granularNames } from './granular-permissions.js';
import { randomBytes, createHash, createHmac, timingSafeEqual } from 'node:crypto';
import argon2 from 'argon2';
import { AppError } from '../../utils/AppError.js';

export const opaque = () => randomBytes(32).toString('base64url');
export const digest = value => createHash('sha256').update(value).digest('hex');
export const mac = (secret, value) => createHmac('sha256', secret).update(value).digest('hex');
export function equal(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function passwordPolicy(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128 || !/\S/.test(password)) {
    throw new AppError(422, 'WEAK_PASSWORD', 'Use a password of 12 to 128 characters');
  }
}
export async function hashPassword(password) {
  passwordPolicy(password);
  return argon2.hash(password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 });
}
export const checkPassword = async (hash, password) => {
  if (typeof password !== 'string' || password.length > 128) return false;
  try { return await argon2.verify(hash, password); } catch { return false; }
};
export function email(value) {
  if (typeof value !== 'string' || value.length > 254 || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value.trim())) throw new AppError(422, 'INVALID_INPUT', 'Enter a valid email address');
  return value.trim().toLowerCase();
}
export const invalidProof = () => new AppError(400, 'INVALID_CHALLENGE', 'The code or link is invalid, expired or already used');
export const invalidLogin = () => new AppError(401, 'INVALID_CREDENTIALS', 'Unable to sign in with these credentials');

export const permissions = Object.freeze([...granularNames,
  'dashboard.read', 'institutions.read', 'institutions.write', 'admissions.read', 'admissions.write',
  'franchises.read', 'franchises.write', 'admissions.review', 'franchises.review', 'registrations.read', 'registrations.write',
  'learning.read', 'learning.write', 'learning.publish', 'learning.grants.manage',
  'commerce.read', 'commerce.plans.write', 'commerce.reconcile', 'content.read', 'content.write', 'content.publish', 'media.read', 'media.write',
  'settings.read', 'settings.write', 'notifications.read', 'notifications.write', 'notifications.publish',
  'results.read', 'results.manage', 'results.publish', 'accounts.read', 'accounts.manage', 'accounts.roles.manage', 'audit.read', 'operations.read',
]);
export const grantsFor = user => user.roles.includes('super_admin') ? [...permissions] : user.roles.includes('admin') ? user.permissions.filter(p => permissions.includes(p) && p !== 'accounts.roles.manage') : [];
export function userDTO(user) {
  return { id: user.publicId, name: user.name, email: user.emailNormalized, roles: user.roles,
    createdAt: user.createdAt, phone: user.phone ?? '', profile: user.profile?.toObject?.() ?? user.profile ?? {}, board: user.profile?.board ?? '', class: user.profile?.class ?? '',
    status: user.status, emailVerified: Boolean(user.emailVerifiedAt), permissions: grantsFor(user) };
}
