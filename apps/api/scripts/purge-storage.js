import { createClient } from "@supabase/supabase-js";
import { APP_MODE, env } from "../src/config/env.js";

const APPLY = process.argv.includes("--yes");

const supabase = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const listAllKeys = async (bucket, prefix = "") => {
  const keys = [];

  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 1000,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(`list ${bucket}/${prefix}: ${error.message}`);

    for (const entry of data) {
      const key = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) {
        keys.push(...(await listAllKeys(bucket, key)));
      } else {
        keys.push(key);
      }
    }

    if (data.length < 1000) return keys;
  }
};

const purge = async () => {
  const buckets = [
    env.supabase.bucketFaces,
    env.supabase.bucketProfile,
    env.supabase.bucketDocs,
  ];

  console.log(`[purge] NODE_ENV=${APP_MODE} → ${new URL(env.supabase.url).host}`);
  console.log(`[purge] mode: ${APPLY ? "HAPUS BENERAN (--yes)" : "DRY RUN"}\n`);

  let grandTotal = 0;

  for (const bucket of buckets) {
    const keys = await listAllKeys(bucket);
    console.log(`${bucket}: ${keys.length} objek`);
    for (const k of keys) console.log(`  - ${k}`);

    if (APPLY && keys.length > 0) {
      for (let i = 0; i < keys.length; i += 1000) {
        const batch = keys.slice(i, i + 1000);
        const { error } = await supabase.storage.from(bucket).remove(batch);
        if (error) throw new Error(`remove ${bucket}: ${error.message}`);
      }
      console.log(`  → ${keys.length} objek dihapus`);
    }

    grandTotal += keys.length;
    console.log("");
  }

  if (!APPLY && grandTotal > 0) {
    console.log(`Dry run: ${grandTotal} objek TIDAK dihapus.`);
    console.log("Jalankan ulang dengan --yes kalau daftar di atas sudah benar.");
  } else if (grandTotal === 0) {
    console.log("Storage sudah kosong, tidak ada yang dihapus.");
  } else {
    console.log(`Selesai: ${grandTotal} objek dihapus.`);
  }
};

purge().catch((err) => {
  console.error(`[purge] gagal: ${err.message}`);
  process.exit(1);
});
