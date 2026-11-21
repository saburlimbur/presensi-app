import { env } from "../../../config/env.js";
import { createSignedUrls } from "../../../lib/storage.js";
import logger from "../../../utils/logger.js";

export const signAttachments = async (permissions) => {
  const keyed = permissions.filter((p) => p?.attachmentUrl);
  if (keyed.length === 0) return permissions;

  let urlMap = new Map();

  try {
    urlMap = await createSignedUrls(
      env.supabase.bucketDocs,
      keyed.map((p) => p.attachmentUrl),
      3600,
    );
  } catch (err) {
    logger.warn(`sign attachment gagal: ${err.message}`);
  }

  for (const p of keyed) {
    p.attachmentUrl_url = urlMap.get(p.attachmentUrl) ?? null;
  }

  return permissions;
};

export const signAttachment = async (permission) =>
  (await signAttachments([permission]))[0];
