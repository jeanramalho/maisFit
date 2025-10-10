// src/services/imageService.ts
// Upload de imagem + registro na tabela images + consumo de quota e trigger de classificação.
// Comentários em pt-BR.

import { supabase } from '../lib/supabaseClient';
import { consumeQuota } from './quotaService';
import { v4 as uuidv4 } from 'uuid'; // yarn add uuid @types/uuid

type UploadResult = {
  ok: boolean;
  error?: string;
  imageId?: string;
  storagePath?: string;
};

export async function uploadMealImage(
  userId: string,
  localUri: string, // uri retornada pelo ImagePicker, ex: file://...
): Promise<UploadResult> {
  try {
    // 1) Gerar nome único para o arquivo
    const fileExt = localUri.split('.').pop() ?? 'jpg';
    const fileName = `${userId}/${Date.now()}-${uuidv4()}.${fileExt}`;
    const bucket = 'images'; // crie bucket 'images' no Supabase Storage

    // 2) Converte URI em Blob (fetch + blob) — funciona no Expo Managed
    const response = await fetch(localUri);
    const blob = await response.blob();

    // 3) Faz upload para o Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, {
        contentType: blob.type || `image/${fileExt}`,
        upsert: false,
      });

    if (uploadError) {
      return { ok: false, error: uploadError.message };
    }

    const storagePath = uploadData?.path ?? fileName;

    // 4) Insere registro inicial na tabela images
    const { data: insertData, error: insertError } = await supabase
      .from('images')
      .insert([
        {
          user_id: userId,
          storage_path: storagePath,
          status: 'uploaded',
        },
      ])
      .select('id')
      .single();

    if (insertError || !insertData) {
      return { ok: false, error: insertError?.message ?? 'Erro ao registrar imagem' };
    }

    const imageId: string = insertData.id;

    // 5) Consumir quota 'image' antes de chamar classificação
    const quota = await consumeQuota(userId, 'image', 1);
    if (!quota.ok) {
      // Caso sem quota, atualizamos status e retornamos
      await supabase.from('images').update({ status: 'failed' }).eq('id', imageId);
      return { ok: false, error: quota.error ?? 'Sem quota para classificação' };
    }

    // 6) Aqui chamamos sua função de classificação (Edge Function ou endpoint)
    // Exemplo: supabase function, ou sua API REST - substitua a URL/fluxo conforme sua infra
    // Supondo que você tenha uma Edge Function 'classify-image' que aceita imageId
    // e retorna detected_foods json:
    try {
      // Exemplo: chamar RPC ou sua Edge Function:
      // const classifyResp = await fetch(`${YOUR_EDGE_FUNCTION_URL}/classify-image`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ imageId, storagePath }),
      // });
      // const classifyJson = await classifyResp.json();
      // Aqui vou simular um retorno simples:
      const classifyJson = { detected_foods: [{ name: 'Arroz', confidence: 0.85 }] };

      // 7) Atualiza registro da imagem com resultado da classificação
      await supabase
        .from('images')
        .update({ status: 'done', detected_foods: classifyJson.detected_foods })
        .eq('id', imageId);

      return { ok: true, imageId, storagePath };
    } catch (err: any) {
      // Se falhar a classificação, marca como processing | failed
      await supabase.from('images').update({ status: 'failed' }).eq('id', imageId);
      return { ok: false, error: err.message ?? 'Erro ao classificar imagem' };
    }
  } catch (err: any) {
    return { ok: false, error: err.message ?? 'Erro desconhecido' };
  }
}
