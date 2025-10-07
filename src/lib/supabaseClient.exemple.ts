// src/lib/supabaseClient.ts
// Cliente Supabase - configure as variáveis abaixo.
// NÃO comite este arquivo com chaves reais em repositórios públicos.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = '<COLE_AQUI_SEU_SUPABASE_URL>';
const SUPABASE_ANON_KEY = '<COLE_AQUI_SUA_SUPABASE_ANON_KEY>';

/**
 * Supabase client - usado por services e viewmodels.
 * - A chave anon do Supabase é pensada para uso cliente (não é secreta),
 *   mas nunca comite em repositórios públicos.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
