import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * ============================================================================
 * KWANZAPAY BACKEND SUPABASE CLIENT (SERVER / SERVICE ROLE)
 * ============================================================================
 * 
 * Utiliza a SUPABASE_SERVICE_ROLE_KEY para operações administrativas de custódia
 * e Escrow que contornam o RLS para garantir integridade atômica e liquidação.
 * 
 * Implementa Inicialização Tardia (Lazy Initialization) para nunca falhar na
 * inicialização do servidor quando as chaves ainda estiverem sendo configuradas.
 */

let serverSupabaseClient: SupabaseClient | null = null;
let hasLoggedConfigWarning = false;

export function normalizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  return rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

export function isSupabaseServerConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && 
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)
  );
}

export function getSupabaseServerClient(): SupabaseClient | null {
  const rawUrl = process.env.SUPABASE_URL;
  const url = normalizeSupabaseUrl(rawUrl);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (!hasLoggedConfigWarning) {
      console.info(
        '[KwanzaPay Supabase] Variáveis SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não detectadas. Operando com armazenamento em memória e motor de Escrow resiliente.'
      );
      hasLoggedConfigWarning = true;
    }
    return null;
  }

  if (!serverSupabaseClient) {
    try {
      serverSupabaseClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      console.log('[KwanzaPay Supabase] Cliente conectado com sucesso a:', url);
    } catch (err) {
      console.error('[KwanzaPay Supabase] Falha ao instanciar cliente Supabase:', err);
      return null;
    }
  }

  return serverSupabaseClient;
}
