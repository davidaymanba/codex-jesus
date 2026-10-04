import { Role } from '../enums/role.js';

/** Actions guarded on admin routes. Routes check permissions, never role names directly. */
export const Permission = {
  CONTENT_MANAGE: 'content:manage',
  MEDIA_MANAGE: 'media:manage',
  LEADS_READ: 'leads:read',
  LEADS_UPDATE: 'leads:update',
  USERS_MANAGE: 'users:manage',
  SETTINGS_MANAGE: 'settings:manage',
  AUDIT_READ: 'audit:read',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

/**
 * Permission matrix: ADMIN can do everything; EDITOR manages content and media and can read
 * and update leads. Only ADMIN manages users, settings and reads the audit log.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [Role.ADMIN]: Object.values(Permission),
  [Role.EDITOR]: [
    Permission.CONTENT_MANAGE,
    Permission.MEDIA_MANAGE,
    Permission.LEADS_READ,
    Permission.LEADS_UPDATE,
  ],
};

/** True when `role` grants `permission`. Unknown roles get nothing (deny by default). */
export function hasPermission(role: Role, permission: Permission): boolean {
  return Object.hasOwn(ROLE_PERMISSIONS, role) && ROLE_PERMISSIONS[role].includes(permission);
}
