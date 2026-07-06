import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

function assertAuthConfig() {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Missing GOOGLE_CLIENT_ID in server/.env');
  }

  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET in server/.env');
  }
}

export async function verifyGoogleIdToken(idToken) {
  assertAuthConfig();

  const ticket = await oauthClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload?.email) {
    throw new Error('Invalid Google token payload');
  }

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name || '',
    givenName: payload.given_name || '',
    familyName: payload.family_name || '',
    locale: payload.locale || '',
    picture: payload.picture || '',
  };
}

export function signAccessToken(user) {
  assertAuthConfig();

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      givenName: user.givenName,
      familyName: user.familyName,
      locale: user.locale,
      picture: user.picture,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyAccessToken(token) {
  assertAuthConfig();
  return jwt.verify(token, JWT_SECRET);
}
