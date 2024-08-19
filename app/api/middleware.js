import admin from '../../utils/admin.js';
import { NextResponse } from 'next/server';

export async function validateToken(req) {
  const token = req.headers.get('Authorization')?.split('Bearer ')[1];

  if (!token) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized: No token provided' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('Token is valid:', decodedToken);
    return NextResponse.next();  // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Token verification failed:', error);
    return new NextResponse(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
