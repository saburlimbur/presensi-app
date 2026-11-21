import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const baseClient = new PrismaClient({ adapter });

const toAttendancePhotoUrl = (stored) => {
  if (!stored) return null;
  if (/^https?:\/\//i.test(stored)) return stored;
  const base =
    process.env.URL_ASSETS_ATTENDANCE ||
    "http://localhost:3000/images/attendance";
  return `${base.replace(/\/$/, "")}/${stored.split("/").pop()}`;
};

const prisma = baseClient.$extends({
  result: {
    attendance: {
      photoIn_url: {
        needs: { photoIn: true },
        compute: (a) => toAttendancePhotoUrl(a.photoIn),
      },
      photoOut_url: {
        needs: { photoOut: true },
        compute: (a) => toAttendancePhotoUrl(a.photoOut),
      },
    },
  },
});

export default prisma;
