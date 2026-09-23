/**
 * KwanzaPay Auth Client
 * Autenticação e gestão de perfil de usuário e desenvolvedor independente de fornecedor externo.
 */

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role?: string;
}

export async function loginWithGoogle(): Promise<{ user: AuthUser; isFallback?: boolean }> {
  const defaultUser: AuthUser = {
    uid: 'dev_evaristo_2352',
    email: 'evaristopaulocassoma2352@gmail.com',
    displayName: 'Evaristo Paulo Cassoma',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    role: 'MERCHANT',
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem('kp_auth_user', JSON.stringify(defaultUser));
  }

  return { user: defaultUser, isFallback: false };
}

export async function logoutUser(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('kp_auth_user');
  }
}
