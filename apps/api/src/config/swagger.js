import swaggerJSDoc from "swagger-jsdoc";
import { env } from "./env.js";
import paths from "../docs/index.js";

const definition = {
  openapi: "3.0.3",
  info: {
    title: `${env.app.name} API`,
    version: "1.0.0",
    description:
      "Dokumentasi REST API sistem absensi. Semua endpoint di-prefix `/attendance_api`.",
  },
  servers: [
    {
      url: `${env.app.url}/attendance_api`,
      description: env.app.env,
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true
          },
          message: {
            type: "string",
            example: "Success"
          },
          data: {
            type: "object",
            nullable: true
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false
          },
          message: {
            type: "string",
            example: "terjadi kesalahan"
          },
          errors: {
            type: "object",
            nullable: true
          },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          total: {
            type: "integer",
            example: 42
          },
          page: {
            type: "integer",
            example: 1
          },
          limit: {
            type: "integer",
            example: 10
          },
          totalPages: {
            type: "integer",
            example: 5
          },
          hasNextPage: {
            type: "boolean",
            example: true
          },
          hasPreviousPage: {
            type: "boolean",
            example: false
          },
        },
      },

      User: {
        type: "object",
        description: "Data karyawan/admin (tanpa password).",
        properties: {
          id: {
            type: "string",
            format: "uuid"
          },
          email: {
            type: "string",
            format: "email"
          },
          fullName: {
            type: "string"
          },
          phone: {
            type: "string",
            nullable: true
          },
          employeeId: {
            type: "string",
            example: "EMP-0001"
          },
          profilePhoto: {
            type: "string",
            nullable: true,
            description:
              "Key objek di Supabase Storage, bukan URL. Jangan dipakai langsung sebagai src.",
            example: "profile/budi-1730000000000-a1b2c3d4.jpg"
          },
          profilePhoto_url: {
            type: "string",
            nullable: true,
            description:
              "Signed URL ber-TTL 1 jam untuk profilePhoto. null kalau signing gagal.",
            example: "https://xxx.supabase.co/storage/v1/object/sign/faces/profile/..."
          },
          departmentId: {
            type: "string",
            format: "uuid",
            nullable: true
          },
          position: {
            type: "string",
            enum: [
              "DIRECTOR", "MANAGER", "SUPERVISOR", "TEAM_LEAD", "SENIOR_STAFF",
              "STAFF", "JUNIOR_STAFF", "HR_SPECIALIST", "FINANCE_SPECIALIST",
              "IT_SPECIALIST", "MARKETING_SPECIALIST", "INTERN", "CONTRACT", "OTHER",
            ],
          },
          role: {
            type: "string",
            enum: ["ADMIN", "EMPLOYEE"]
          },
          joinDate: {
            type: "string",
            format: "date",
            nullable: true
          },
          isActive: {
            type: "boolean"
          },
          isFaceRegistered: {
            type: "boolean"
          },
          createdAt: {
            type: "string",
            format: "date-time"
          },
          updatedAt: {
            type: "string",
            format: "date-time"
          },
        },
      },

      Department: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid"
          },
          name: {
            type: "string"
          },
          code: {
            type: "string",
            example: "FIN"
          },
          headId: {
            type: "string",
            format: "uuid",
            nullable: true
          },
          createdAt: {
            type: "string",
            format: "date-time"
          },
          updatedAt: {
            type: "string",
            format: "date-time"
          },
        },
      },

      Shift: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid"
          },
          name: {
            type: "string",
            enum: ["MORNING", "AFTERNOON", "NIGHT", "FULL_DAY", "SPLIT_SHIFT", "FLEXIBLE"],
          },
          startTime: {
            type: "string",
            format: "date-time"
          },
          endTime: {
            type: "string",
            format: "date-time"
          },
          gracePeriod: {
            type: "integer",
            description: "Toleransi keterlambatan (menit)"
          },
          isActive: {
            type: "boolean"
          },
          description: {
            type: "string",
            nullable: true
          },
          createdAt: {
            type: "string",
            format: "date-time"
          },
          updatedAt: {
            type: "string",
            format: "date-time"
          },
        },
      },

      AttendanceLocation: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid"
          },
          name: {
            type: "string"
          },
          address: {
            type: "string",
            nullable: true
          },
          latitude: {
            type: "number",
            example: -6.2
          },
          longitude: {
            type: "number",
            example: 106.816666
          },
          radius: {
            type: "integer",
            description: "Radius geofence (meter)"
          },
          isActive: {
            type: "boolean"
          },
          createdAt: {
            type: "string",
            format: "date-time"
          },
          updatedAt: {
            type: "string",
            format: "date-time"
          },
        },
      },

      Attendance: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid"
          },
          userId: {
            type: "string",
            format: "uuid"
          },
          permissionId: {
            type: "string",
            format: "uuid",
            nullable: true
          },
          date: {
            type: "string",
            format: "date"
          },
          checkIn: {
            type: "string",
            format: "date-time",
            nullable: true
          },
          checkOut: {
            type: "string",
            format: "date-time",
            nullable: true
          },
          status: {
            type: "string",
            enum: [
              "PRESENT", "LATE", "ABSENT", "SICK", "PERMIT",
              "ON_LEAVE", "HOLIDAY", "WORK_FROM_HOME",
            ],
          },
          method: {
            type: "string",
            enum: ["QR_CODE", "FACE_RECOGNITION", "MANUAL", "MOBILE_APP"],
          },
          workMode: {
            type: "string",
            enum: ["WFO", "WFA"]
          },
          shiftName: {
            type: "string",
            nullable: true,
            enum: ["MORNING", "AFTERNOON", "NIGHT", "FULL_DAY", "SPLIT_SHIFT", "FLEXIBLE"],
          },
          note: {
            type: "string",
            nullable: true
          },
          latitudeIn: {
            type: "number",
            nullable: true
          },
          longitudeIn: {
            type: "number",
            nullable: true
          },
          latitudeOut: {
            type: "number",
            nullable: true
          },
          longitudeOut: {
            type: "number",
            nullable: true
          },
          gpsAccuracyIn: {
            type: "number",
            nullable: true
          },
          gpsAccuracyOut: {
            type: "number",
            nullable: true
          },
          isLocationValid: {
            type: "boolean",
            nullable: true
          },
          ipAddress: {
            type: "string",
            nullable: true
          },
          deviceInfo: {
            type: "string",
            nullable: true
          },
          metadata: {
            type: "object",
            nullable: true
          },
          createdAt: {
            type: "string",
            format: "date-time"
          },
          updatedAt: {
            type: "string",
            format: "date-time"
          },
        },
      },

      Permission: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid"
          },
          userId: {
            type: "string",
            format: "uuid"
          },
          startDate: {
            type: "string",
            format: "date-time"
          },
          endDate: {
            type: "string",
            format: "date-time"
          },
          duration: {
            type: "integer",
            description: "Jumlah hari"
          },
          type: {
            type: "string",
            enum: [
              "SICK", "PERMIT", "ANNUAL_LEAVE", "MATERNITY_LEAVE", "PATERNITY_LEAVE",
              "MARRIAGE_LEAVE", "BEREAVEMENT", "HALF_DAY", "WORK_FROM_HOME", "OTHER",
            ],
          },
          reason: {
            type: "string",
            nullable: true
          },
          attachmentUrl: {
            type: "string",
            nullable: true,
            description:
              "Key objek di Supabase Storage, bukan URL. Jangan dipakai langsung sebagai href.",
            example: "budi-1730000000000-a1b2c3d4.pdf"
          },
          attachmentUrl_url: {
            type: "string",
            nullable: true,
            description:
              "Signed URL ber-TTL 1 jam untuk attachmentUrl. null kalau signing gagal.",
            example: "https://xxx.supabase.co/storage/v1/object/sign/permissions/..."
          },
          status: {
            type: "string",
            enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
          },
          approvedBy: {
            type: "string",
            format: "uuid",
            nullable: true
          },
          approvedNote: {
            type: "string",
            nullable: true
          },
          approvedAt: {
            type: "string",
            format: "date-time",
            nullable: true
          },
          createdAt: {
            type: "string",
            format: "date-time"
          },
          updatedAt: {
            type: "string",
            format: "date-time"
          },
        },
      },

      LeaveBalance: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid"
          },
          userId: {
            type: "string",
            format: "uuid"
          },
          year: {
            type: "integer"
          },
          annualQuota: {
            type: "integer"
          },
          usedDays: {
            type: "integer"
          },
          remainingDays: {
            type: "integer"
          },
          carryOverDays: {
            type: "integer"
          },
          updatedAt: {
            type: "string",
            format: "date-time"
          },
        },
      },

      Notification: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid"
          },
          userId: {
            type: "string",
            format: "uuid"
          },
          type: {
            type: "string",
            enum: [
              "ATTENDANCE_REMINDER", "ATTENDANCE_CHECK_IN", "ATTENDANCE_CHECK_OUT",
              "PERMISSION_SUBMITTED", "PERMISSION_APPROVED", "PERMISSION_REJECTED",
              "ANNOUNCEMENT", "SYSTEM",
            ],
          },
          title: {
            type: "string"
          },
          body: {
            type: "string"
          },
          data: {
            type: "object",
            nullable: true
          },
          readAt: {
            type: "string",
            format: "date-time",
            nullable: true
          },
          createdAt: {
            type: "string",
            format: "date-time"
          },
        },
      },

      AuditLog: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid"
          },
          userId: {
            type: "string",
            format: "uuid",
            nullable: true
          },
          action: {
            type: "string",
            example: "attendance.manual_created"
          },
          details: {
            type: "string",
            nullable: true
          },
          createdAt: {
            type: "string",
            format: "date-time"
          },
        },
      },

      FaceEmbedding: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid"
          },
          userId: {
            type: "string",
            format: "uuid"
          },
          imageUrl: {
            type: "string",
            nullable: true,
            description:
              "Key objek di Supabase Storage, bukan URL. Jangan dipakai langsung sebagai src.",
            example: "users/budi-1730000000000-a1b2c3d4.jpg"
          },
          imageUrl_url: {
            type: "string",
            nullable: true,
            description:
              "Signed URL ber-TTL 1 jam untuk imageUrl. null kalau signing gagal.",
            example: "https://xxx.supabase.co/storage/v1/object/sign/faces/users/..."
          },
          createdAt: {
            type: "string",
            format: "date-time"
          },
        },
      },
    },
  },
  security: [{
    bearerAuth: []
  }],
  tags: [
    {
      name: "Users",
      description: "Autentikasi & manajemen karyawan"
    },
    {
      name: "Attendances",
      description: "Check-in/out & rekap absensi"
    },
    {
      name: "Faces",
      description: "Registrasi & verifikasi wajah"
    },
    {
      name: "Shifts",
      description: "Jadwal shift"
    },
    {
      name: "Departments",
      description: "Departemen"
    },
    {
      name: "Permissions",
      description: "Izin & cuti"
    },
    {
      name: "Locations",
      description: "Lokasi & geofence"
    },
    {
      name: "Notifications",
      description: "Notifikasi"
    },
    {
      name: "Leave Balances",
      description: "Saldo cuti"
    },
    {
      name: "Reports",
      description: "Laporan & ekspor"
    },
    {
      name: "Audit Logs",
      description: "Log audit"
    },
  ],
  paths,
};

const swaggerSpec = swaggerJSDoc({
  definition, apis: []
});

export default swaggerSpec;
