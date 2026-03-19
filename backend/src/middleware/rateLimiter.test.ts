import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Mock Redis before importing the middleware
vi.mock('../db/redis', () => ({
  default: { incr: vi.fn(), expire: vi.fn() },
}));

import redis from '../db/redis';
import { loginRateLimiter } from './rateLimiter';

function mockReq(ip: string) {
  return { ip } as any;
}

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// Feature: user-authentication, Property 9: Rate limiting enforced after 10 login attempts per IP
// Validates: Requirements 2.6
describe('Property 9: Rate limiting enforced after 10 login attempts per IP', () => {
  it('allows attempts 1–10 and blocks attempt 11 with 429 for any IP', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.ipV4(),
        async (ip) => {
          vi.clearAllMocks();

          const next = vi.fn();

          // Simulate attempts 1 through 10 — each should call next()
          for (let attempt = 1; attempt <= 10; attempt++) {
            vi.mocked(redis.incr).mockResolvedValueOnce(attempt as any);
            vi.mocked(redis.expire).mockResolvedValueOnce(1 as any);

            const req = mockReq(ip);
            const res = mockRes();
            const localNext = vi.fn();

            await loginRateLimiter(req, res, localNext);

            expect(localNext).toHaveBeenCalledOnce();
            expect(res.status).not.toHaveBeenCalled();
          }

          // Attempt 11 — should return 429
          vi.mocked(redis.incr).mockResolvedValueOnce(11 as any);
          vi.mocked(redis.expire).mockResolvedValueOnce(1 as any);

          const req = mockReq(ip);
          const res = mockRes();
          const blockedNext = vi.fn();

          await loginRateLimiter(req, res, blockedNext);

          expect(blockedNext).not.toHaveBeenCalled();
          expect(res.status).toHaveBeenCalledWith(429);
          expect(res.json).toHaveBeenCalledWith({
            error: 'Too many login attempts. Please try again later.',
          });
        },
      ),
      { numRuns: 50 },
    );
  }, 30000);
});

describe('loginRateLimiter — unit tests', () => {
  it('sets TTL only on the first increment (count === 1)', async () => {
    vi.mocked(redis.incr).mockResolvedValue(1 as any);
    vi.mocked(redis.expire).mockResolvedValue(1 as any);

    const next = vi.fn();
    await loginRateLimiter(mockReq('1.2.3.4'), mockRes(), next);

    expect(redis.expire).toHaveBeenCalledWith('rate_limit:login:1.2.3.4', 900);
    expect(next).toHaveBeenCalled();
  });

  it('does not set TTL on subsequent increments', async () => {
    vi.mocked(redis.incr).mockResolvedValue(5 as any);
    vi.mocked(redis.expire).mockResolvedValue(1 as any);

    const next = vi.fn();
    await loginRateLimiter(mockReq('1.2.3.4'), mockRes(), next);

    expect(redis.expire).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('fails open when Redis throws — allows request through', async () => {
    vi.mocked(redis.incr).mockRejectedValue(new Error('Redis down'));

    const next = vi.fn();
    await loginRateLimiter(mockReq('1.2.3.4'), mockRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('uses correct Redis key format', async () => {
    vi.mocked(redis.incr).mockResolvedValue(1 as any);
    vi.mocked(redis.expire).mockResolvedValue(1 as any);

    await loginRateLimiter(mockReq('192.168.0.1'), mockRes(), vi.fn() as any);

    expect(redis.incr).toHaveBeenCalledWith('rate_limit:login:192.168.0.1');
  });
});
