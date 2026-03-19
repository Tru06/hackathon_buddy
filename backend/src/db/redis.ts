import Redis from 'ioredis';

// Configured Redis client.
// Reads from REDIS_URL if set, otherwise defaults to localhost:6379.
//
// Key schema used by the Auth Service:
//   refresh:<token>         → userId          TTL: 604800s (7 days)
//   user_tokens:<userId>    → Set of token keys  TTL: 604800s (7 days)
//   rate_limit:login:<ip>   → attempt count   TTL: 900s (15 minutes)
const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  // Fail fast on connection errors rather than silently queuing commands
  enableOfflineQueue: false,
  lazyConnect: true,
});

export default redis;
