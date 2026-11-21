import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

let supabase = null;
const getClient = () => {
  if (supabase) return supabase;
  if (!env.supabase.url || !env.supabase.serviceRoleKey) {
    throw new Error(
      "Supabase belum di-set (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)",
    );
  }
  supabase = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
  });
  return supabase;
};

const uploadObject = async (bucket, key, body, contentType) => {
  const { error } = await getClient()
    .storage.from(bucket)
    .upload(key, body, { contentType, upsert: false });
  if (error) throw error;
  return key;
};

const createSignedUrl = async (bucket, key, expiresIn = 3600) => {
  const { data, error } = await getClient()
    .storage.from(bucket)
    .createSignedUrl(key, expiresIn);
  if (error) throw error;
  return data.signedUrl;
};

const createSignedUrls = async (bucket, keys, expiresIn = 3600) => {
  if (!keys || keys.length === 0) return new Map();
  const { data, error } = await getClient()
    .storage.from(bucket)
    .createSignedUrls(keys, expiresIn);
  if (error) throw error;
  return new Map(data.map((d) => [d.path, d.signedUrl]));
};

const removeObject = async (bucket, key) => {
  const { error } = await getClient().storage.from(bucket).remove([key]);
  if (error) throw error;
};

export { uploadObject, createSignedUrl, createSignedUrls, removeObject };
