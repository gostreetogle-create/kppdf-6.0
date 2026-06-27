import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma.userActivity.create перед импортом helper.
const createMock = vi.fn();
vi.mock('@/lib/db', () => ({
  prisma: {
    userActivity: {
      create: (...args: unknown[]) => createMock(...args),
    },
  },
}));

// Подавляем console.error чтобы test output был чистым.
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

import { recordActivity } from '../activity-log';

describe('recordActivity (Cycle 57 / B.7)', () => {
  beforeEach(() => {
    createMock.mockReset();
    consoleErrorSpy.mockReset();
  });

  it('вызывает prisma.userActivity.create с правильными полями', async () => {
    await recordActivity({
      userId: 'user-1',
      userName: 'Test User',
      action: 'create_proposal',
      entity: 'proposal',
      entityId: 'prop-1',
      details: { number: 'КП-0001' },
    });

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        userName: 'Test User',
        action: 'create_proposal',
        entity: 'proposal',
        entityId: 'prop-1',
        details: JSON.stringify({ number: 'КП-0001' }),
      },
    });
  });

  it('сериализует details в JSON-строку', async () => {
    await recordActivity({
      userId: 'u',
      action: 'update_status',
      entity: 'contract',
      entityId: 'c',
      details: { from: 'draft', to: 'active' },
    });

    const callArgs = createMock.mock.calls[0][0];
    expect(typeof callArgs.data.details).toBe('string');
    expect(JSON.parse(callArgs.data.details)).toEqual({ from: 'draft', to: 'active' });
  });

  it('details=null → details=null в БД (без строки "null")', async () => {
    await recordActivity({
      userId: 'u',
      action: 'login',
      entity: 'user',
    });

    const callArgs = createMock.mock.calls[0][0];
    expect(callArgs.data.details).toBeNull();
  });

  it('userName undefined → null в БД', async () => {
    await recordActivity({
      userId: 'u',
      action: 'login',
      entity: 'user',
    });

    const callArgs = createMock.mock.calls[0][0];
    expect(callArgs.data.userName).toBeNull();
  });

  it('entityId undefined → null в БД', async () => {
    await recordActivity({
      userId: 'u',
      action: 'login',
      entity: 'user',
      userName: null,
    });

    const callArgs = createMock.mock.calls[0][0];
    expect(callArgs.data.entityId).toBeNull();
  });

  it('лупит ошибки через console.error, не пробрасывает наружу (best-effort)', async () => {
    createMock.mockRejectedValueOnce(new Error('DB connection lost'));

    // Не должно throw — best-effort.
    await expect(
      recordActivity({
        userId: 'u',
        action: 'login',
        entity: 'user',
      })
    ).resolves.toBeUndefined();

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('[activity-log]');
  });

  it('не await-ит ошибок (резолвится undefined даже при падении)', async () => {
    createMock.mockRejectedValueOnce(new Error('Foreign key violation'));

    const result = await recordActivity({
      userId: 'u',
      action: 'create_proposal',
      entity: 'proposal',
    });

    expect(result).toBeUndefined();
  });

  it('поддерживает сложные details: вложенные объекты, массивы', async () => {
    await recordActivity({
      userId: 'u',
      action: 'convert_to_production',
      entity: 'contract',
      entityId: 'c',
      details: {
        productionOrderNumber: 'ЗК-0001',
        tasksCount: 12,
        workers: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }],
      },
    });

    const callArgs = createMock.mock.calls[0][0];
    expect(JSON.parse(callArgs.data.details)).toEqual({
      productionOrderNumber: 'ЗК-0001',
      tasksCount: 12,
      workers: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }],
    });
  });

  it('пустой details object {} → details="{}" в БД (не null)', async () => {
    await recordActivity({
      userId: 'u',
      action: 'logout',
      entity: 'user',
      details: {},
    });

    const callArgs = createMock.mock.calls[0][0];
    expect(callArgs.data.details).toBe('{}');
  });

  it('несколько вызовов — все достигают БД (нет internal batching)', async () => {
    await recordActivity({ userId: 'u', action: 'login', entity: 'user' });
    await recordActivity({ userId: 'u', action: 'create_X', entity: 'x', entityId: '1' });
    await recordActivity({ userId: 'u', action: 'update_Y', entity: 'y', entityId: '2' });

    expect(createMock).toHaveBeenCalledTimes(3);
  });
});
