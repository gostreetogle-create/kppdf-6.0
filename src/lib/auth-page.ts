import { getCurrentUser } from './auth';
import { redirect } from 'next/navigation';

/**
 * Page-level auth guards — redirect on failure instead of throwing.
 *
 * DO NOT use in API routes — callers need a 401 JSON response, not a redirect.
 */

/** Redirects to /login if no user. Page-only — never use in API routes. */
export async function requireAuthPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

/** Redirects to /login?error=forbidden if no user OR role mismatch. Page-only. */
export async function requireRolePage(roles: string[]) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  if (!roles.includes(user.role) && user.role !== 'admin') {
    redirect('/login?error=forbidden');
  }
  return user;
}

/** Redirects to /login if no user, /login?error=viewer if viewer role. Page-only. */
export async function requireEditorPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  if (user.role === 'viewer') {
    redirect('/login?error=viewer');
  }
  return user;
}
