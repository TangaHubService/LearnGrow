/** One place for who can do what in the web app. The API enforces permissions; this decides what to show. */
export type RoleHolder = { role?: string; roles?: string[] };

export const ROLE_GROUPS = {
  student: ["STUDENT"],
  parent: ["PARENT"],
  staff: ["TEACHER", "HEAD_TEACHER", "DIRECTOR_OF_STUDIES", "ADMIN"],
  headteacher: ["HEAD_TEACHER"],
  schoolAdmin: ["ADMIN"],
  schoolOffice: ["ADMIN", "HEAD_TEACHER"],
  superAdmin: ["SUPER_ADMIN"],
} as const;

export function hasAnyRole(user: RoleHolder | null | undefined, allowed: readonly string[]) {
  if (!user) return false;
  const held = [user.role, ...(user.roles ?? [])];
  return held.some((role) => role !== undefined && allowed.includes(role));
}

/** Where a user lands after signing in. Students' dashboard lives at the root path. */
export function homePathFor(user: RoleHolder | null | undefined) {
  if (hasAnyRole(user, ROLE_GROUPS.superAdmin)) return "/super-admin";
  if (hasAnyRole(user, ROLE_GROUPS.headteacher)) return "/headteacher";
  if (hasAnyRole(user, ROLE_GROUPS.schoolAdmin)) return "/school-admin";
  if (hasAnyRole(user, ROLE_GROUPS.staff)) return "/teacher";
  if (hasAnyRole(user, ROLE_GROUPS.parent)) return "/parent";
  return "/";
}
