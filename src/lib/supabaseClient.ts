import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase para o Frontend (React / Browser).
 * Utiliza as variáveis públicas VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
 * Se ainda não estiverem configuradas, opera em modo seguro com alerta gracioso.
 */

const env = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
const rawUrl = (env?.VITE_SUPABASE_URL as string) || '';
const supabaseUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = ((env?.VITE_SUPABASE_ANON_KEY as string) || '').trim();

export const isSupabaseClientConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseClientConfigured) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return clientInstance;
}
