const windowMs = 60 * 1000;
const maxRequestsPerWindow = 60;
const buckets = new Map();

function pruneOldEntries(now) {
  for (const [key, value] of buckets.entries()) {
    if (value.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function rateLimitByIp(req, res, next) {
  const now = Date.now();
  pruneOldEntries(now);

  const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (bucket.count >= maxRequestsPerWindow) {
    return res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
  }

  bucket.count += 1;
  return next();
}
