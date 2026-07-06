import { signAccessToken, verifyGoogleIdToken } from '../services/auth.service.js';

export async function loginWithGoogle(req, res) {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'idToken is required' });
    }

    const user = await verifyGoogleIdToken(idToken);
    const accessToken = signAccessToken(user);

    return res.json({
      accessToken,
      user,
    });
  } catch (err) {
    console.error('Google login failed:', err.message);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

export function getCurrentUser(req, res) {
  return res.json({ user: req.user });
}
