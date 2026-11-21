import { APP_MODE } from "./loadEnv.js";

export { APP_MODE };

export const env = {
  app: {
    name: process.env.APP_NAME || "attendance-management-system",
    env: process.env.APP_ENV || APP_MODE,
    port: Number(process.env.APP_PORT) || 5000,
    url: process.env.APP_URL || "http://localhost:5000",
    trustProxy:
      process.env.TRUST_PROXY === "true"
        ? 1
        : Number(process.env.TRUST_PROXY) || false,
  },

  cors: {
    origin: (() => {
      const raw = (process.env.CORS_ORIGIN ?? "*").trim();
      if (raw === "*" || raw === "") return "*";
      const list = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      return list.length === 1 ? list[0] : list;
    })(),
  },

  attendance: {
    // Batas umur sesi check-in yang masih boleh di-check-out sendiri oleh user.
    // Lewat dari ini sesi dianggap expired dan harus dikoreksi admin.
    maxOpenSessionHours: Number(process.env.MAX_OPEN_SESSION_HOURS) || 18,
  },

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    bucketFaces: process.env.SUPABASE_BUCKET_FACES || "faces",
    bucketProfile: process.env.SUPABASE_BUCKET_PROFILE || "profiles",
    bucketDocs: process.env.SUPABASE_BUCKET_DOCS || "permissions",
  },

  mail: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || "Absensi <no-reply@attendance.local>",
    resetUrlBase:
      process.env.RESET_URL_BASE || "http://localhost:5174/auth/reset-password",
  },
};
