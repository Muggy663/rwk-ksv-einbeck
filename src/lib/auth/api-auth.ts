import { admin } from '@/lib/firebase/admin';
import { secureLogger } from '@/lib/utils/secure-logger';

export async function verifyApiAuth(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    secureLogger.error('Token verification failed', 'api-auth');
    return null;
  }
}

export async function requireAuth(request: Request) {
  const user = await verifyApiAuth(request);
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }), 
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  return user;
}

export async function requireRole(request: Request, allowedRoles: string[]) {
  const user = await verifyApiAuth(request);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const userDoc = await admin.firestore()
    .collection('users')
    .doc(user.uid)
    .get();
    
  const userRole = userDoc.data()?.role;
  
  if (!allowedRoles.includes(userRole)) {
    return new Response('Forbidden', { status: 403 });
  }
  
  return user;
}
