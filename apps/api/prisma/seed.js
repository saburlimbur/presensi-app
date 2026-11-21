import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcrypt";
import { APP_MODE, dbHost } from "../src/config/loadEnv.js";

console.log(`[seed] NODE_ENV=${APP_MODE} → ${dbHost()}`);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const departments = [
    {
      name: "Developer",
      code: "DEV",
    },
    {
      name: "Marketing",
      code: "MKT",
    },
    {
      name: "Designer",
      code: "DSG",
    },
    {
      name: "Finance",
      code: "FIN",
    },
    {
      name: "General",
      code: "GEN",
    },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
  }
  console.log(
    `departments seeded: ${departments.map((d) => d.code).join(", ")}`,
  );
  const attendanceLocations = [
    {
      name: "Kantor Cipinang Pusat",
      address:
        "RT.4/RW.6, Cipinang Besar Sel., Kecamatan Jatinegara, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta 13410",
      latitude: -6.226667653075278,
      longitude: 106.88277155766475,
      radius: 150,
      isActive: true,
    },
  ];

  for (const loc of attendanceLocations) {
    const existing = await prisma.attendanceLocation.findFirst({
      where: {
        name: loc.name,
      },
    });

    if (existing) {
      await prisma.attendanceLocation.update({
        where: {
          id: existing.id,
        },
        data: loc,
      });
    } else {
      await prisma.attendanceLocation.create({
        data: loc,
      });
    }
  }
  console.log(
    `attendance locations seeded: ${attendanceLocations.map((l) => l.name).join(", ")}`,
  );

  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (existingAdmin) {
    console.log("admin already exists, skipping seeding.");
    return;
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);

  const generalDept = await prisma.department.findUnique({
    where: { code: "GEN" },
  });

  const admin = await prisma.user.create({
    data: {
      email: "hr@example.com",
      password: hashedPassword,
      fullName: "Human Resource",
      phone: "081234567890",
      employeeId: "ADM-001",
      position: "MANAGER",
      role: "ADMIN",
      isActive: true,
      departmentId: generalDept?.id ?? null,
    },
  });

  console.log(`admin created successfully: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
