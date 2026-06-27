/**
 * src/lib/activity-log.ts (Cycle 57 / B.7)
 *
 * Helper `recordActivity` writes an event to the `UserActivity` table.
 * Drop-in: используется в API routes для аудита CREATE/UPDATE/DELETE и auth-flow событий.
 *
 * Не кидает ошибки — все ошибки логируются и сваляются (best-effort).
 * Activity logging критичен для UI timeline, но никогда не должен ломать
 * основной user request (POST/PUT/DELETE).
 */

import { prisma } from './db';

export interface ActivityOptions {
  userId: string;
  userName?: string | null;
  action: string;          // 'login' | 'create_proposal' | 'update_status' | etc.
  entity: string;          // 'user' | 'proposal' | 'contract' | 'production_order' | etc.
  entityId?: string | null;
  details?: Record<string, unknown> | null;
}

export async function recordActivity(opts: ActivityOptions): Promise<void> {
  try {
    await prisma.userActivity.create({
      data: {
        userId: opts.userId,
        userName: opts.userName ?? null,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId ?? null,
        details: opts.details ? JSON.stringify(opts.details) : null,
      },
    });
  } catch (error) {
    // Best-effort: activity log не должен ломать основной user request.
    console.error('[activity-log] failed to record activity:', error);
  }
}
