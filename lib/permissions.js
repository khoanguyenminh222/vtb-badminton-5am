export const PERMISSION_KEYS = {
  records: "records",
  logs: "logs",
  settings: "settings",
  adminUsers: "adminUsers",
};

export const DEFAULT_ADMIN_PERMISSIONS = {
  [PERMISSION_KEYS.records]: true,
  [PERMISSION_KEYS.logs]: true,
  [PERMISSION_KEYS.settings]: false,
  [PERMISSION_KEYS.adminUsers]: false,
};

export const SUPER_ADMIN_PERMISSIONS = {
  [PERMISSION_KEYS.records]: true,
  [PERMISSION_KEYS.logs]: true,
  [PERMISSION_KEYS.settings]: true,
  [PERMISSION_KEYS.adminUsers]: true,
};

export function normalizePermissions(input, role = "admin") {
  if (role === "super_admin") return { ...SUPER_ADMIN_PERMISSIONS };

  return {
    ...DEFAULT_ADMIN_PERMISSIONS,
    ...(input || {}),
    [PERMISSION_KEYS.records]: (input?.[PERMISSION_KEYS.records] ?? DEFAULT_ADMIN_PERMISSIONS.records) !== false,
    [PERMISSION_KEYS.logs]: (input?.[PERMISSION_KEYS.logs] ?? DEFAULT_ADMIN_PERMISSIONS.logs) !== false,
    [PERMISSION_KEYS.settings]: !!(input?.[PERMISSION_KEYS.settings]),
    [PERMISSION_KEYS.adminUsers]: !!(input?.[PERMISSION_KEYS.adminUsers]),
  };
}

export function hasPermission(session, permissionKey) {
  if (!session) return false;
  if (session.role === "super_admin") return true;
  return !!session.permissions?.[permissionKey];
}
