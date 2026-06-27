import { prisma } from './db';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export async function checkRateLimit(ip: string, username: string): Promise<boolean> {
  const key = `${ip}:${username}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + WINDOW_MS);

  const entry = await prisma.rateLimitEntry.findUnique({ where: { key } });

  if (!entry || now > entry.expiresAt) {
    await prisma.rateLimitEntry.upsert({
      where: { key },
      update: { count: 1, expiresAt },
      create: { key, count: 1, expiresAt },
    });
    return true;
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return false;
  }

  await prisma.rateLimitEntry.update({
    where: { key },
    data: { count: entry.count + 1 },
  });
  return true;
}

export async function recordFailure(ip: string, username: string): Promise<void> {
  const key = `${ip}:${username}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + WINDOW_MS);

  const entry = await prisma.rateLimitEntry.findUnique({ where: { key } });

  if (!entry || now > entry.expiresAt) {
    await prisma.rateLimitEntry.upsert({
      where: { key },
      update: { count: 1, expiresAt },
      create: { key, count: 1, expiresAt },
    });
  } else {
    await prisma.rateLimitEntry.update({
      where: { key },
      data: { count: entry.count + 1 },
    });
  }
}

export async function resetAttempts(ip: string, username: string): Promise<void> {
  const key = `${ip}:${username}`;
  await prisma.rateLimitEntry.deleteMany({ where: { key } });
}

export async function cleanupExpiredEntries(): Promise<number> {
  const result = await prisma.rateLimitEntry.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
