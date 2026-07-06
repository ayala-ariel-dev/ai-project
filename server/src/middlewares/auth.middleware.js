import { verifyAccessToken } from '../services/auth.service.js';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
