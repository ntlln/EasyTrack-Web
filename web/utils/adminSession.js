import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long'
);

export async function createAdminSession(adminId) {
  const token = await new SignJWT({ adminId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);

  return token;
}

export async function getAdminSession() {
  const cookieStore = cookies();
  const token = cookieStore.get('admin_session');

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function setAdminSessionCookie(token) {
  const cookieStore = cookies();
  cookieStore.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours in seconds
    path: '/',
  });
}

export async function clearAdminSession() {
  const cookieStore = cookies();
  cookieStore.delete('admin_session');
} 