// src/services/quotaService.ts
// Serviço simples para consumir quota do usuário via RPC (Supabase).
// Comentários em pt-BR explicando cada passo.

import { supabase } from '../lib/supabaseClient';

export type ConsumeResult = {
  ok: boolean;
  error?: string;
};

/**
 * consumeQuota
 * - Chama a função PL/pgSQL `consume_user_quota(user_uuid, quota_key, amount)`
 * - Retorna { ok: true } se a quota foi decrementada, { ok: false, error } caso contrário.
 */
export async function consumeQuota(userId: string, quotaKey: 'llm' | 'image' | 'text', amount = 1): Promise<ConsumeResult> {
  try {
    // Chamada RPC ao Postgres; supabase.rpc retorna data e error
    const { data, error } = await supabase.rpc('consume_user_quota', {
      p_user_id: userId,
      p_quota_key: quotaKey,
      p_amount: amount,
    });

    if (error) {
      // erro em nível DB
      return { ok: false, error: error.message };
    }

    // A função retorna boolean (true/false) diretamente do SQL
    // data pode ser [true] ou algo semelhante, dependendo da função.
    // Verificamos se houve valor truthy
    if (data === true || (Array.isArray(data) && data[0] === true)) {
      return { ok: true };
    }

    return { ok: false, error: 'Sem saldo de quota' };
  } catch (err: any) {
    return { ok: false, error: err.message ?? 'Erro desconhecido' };
  }
}
