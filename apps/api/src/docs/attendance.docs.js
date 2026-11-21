const ATTENDANCE_STATUSES = [
  "PRESENT",
  "LATE",
  "ABSENT",
  "SICK",
  "PERMIT",
  "ON_LEAVE",
  "HOLIDAY",
  "WORK_FROM_HOME",
];

const SHIFT_NAMES = [
  "MORNING",
  "AFTERNOON",
  "NIGHT",
  "FULL_DAY",
  "SPLIT_SHIFT",
  "FLEXIBLE",
];

const attendanceDocs = {
  "/attendance/today": {
    get: {
      tags: ["Attendances"],
      summary: "Status absensi hari ini untuk user yang login",
      description:
        "Mengembalikan state absensi hari ini (`NOT_CHECKED_IN`, `WORKING`, `DONE`, `PENDING_CHECKOUT_PREV_DAY`, `ON_LEAVE`, `WFH_PENDING_CHECKIN`), shift aktif, dan izin aktif jika ada.",
      responses: {
        200: {
          description: "Data absensi hari ini berhasil diambil",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          state: { type: "string" },
                          today: { type: "string", format: "date" },
                          attendance: {
                            allOf: [
                              { $ref: "#/components/schemas/Attendance" },
                            ],
                            nullable: true,
                          },
                          shift: {
                            allOf: [{ $ref: "#/components/schemas/Shift" }],
                            nullable: true,
                          },
                          activePermission: {
                            allOf: [
                              { $ref: "#/components/schemas/Permission" },
                            ],
                            nullable: true,
                          },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Tidak terautentikasi",
        },
      },
    },
  },

  "/attendance/my/history": {
    get: {
      tags: ["Attendances"],
      summary: "Riwayat absensi user yang login (dengan filter & paginasi)",
      parameters: [
        {
          in: "query",
          name: "dateFrom",
          schema: {
            type: "string",
            format: "date"
          },
          description: "Filter tanggal mulai (ISO 8601)",
        },
        {
          in: "query",
          name: "dateTo",
          schema: {
            type: "string",
            format: "date"
          },
          description: "Filter tanggal akhir (>= dateFrom)",
        },
        {
          in: "query",
          name: "status",
          schema: {
            type: "string",
            enum: ATTENDANCE_STATUSES
          },
        },
        {
          in: "query",
          name: "workMode",
          schema: {
            type: "string",
            enum: ["WFO", "WFA"]
          },
        },
        {
          in: "query",
          name: "page",
          schema: {
            type: "integer",
            default: 1,
            minimum: 1
          },
        },
        {
          in: "query",
          name: "limit",
          schema: {
            type: "integer",
            default: 20,
            minimum: 1,
            maximum: 100
          },
        },
      ],
      responses: {
        200: {
          description: "Riwayat absensi (dengan pagination)",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Attendance" },
                      },
                      pagination: { $ref: "#/components/schemas/Pagination" },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Tidak terautentikasi",
        },
      },
    },
  },

  "/attendance/locations": {
    get: {
      tags: ["Attendances"],
      summary: "Daftar lokasi kantor aktif (untuk validasi check-in WFO)",
      responses: {
        200: {
          description: "Daftar lokasi kantor aktif berhasil diambil",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/AttendanceLocation",
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Tidak terautentikasi",
        },
      },
    },
  },

  "/attendance/check-in": {
    post: {
      tags: ["Attendances"],
      summary: "Check-in absensi",
      description:
        "Membuat sesi absensi baru untuk hari ini. Wajib menyertakan `faceToken`, yaitu `verificationToken` dari `POST /faces/recognize` (berlaku 5 menit). Untuk `WFO`, koordinat divalidasi terhadap radius lokasi kantor terdaftar. Tanpa token yang sah → 403 `FACE_VERIFICATION_REQUIRED`.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["workMode", "latitude", "longitude", "faceToken"],
              properties: {
                faceToken: {
                  type: "string",
                  description: "verificationToken dari /faces/recognize",
                },
                workMode: {
                  type: "string",
                  enum: ["WFO", "WFA"],
                },
                latitude: {
                  type: "number",
                  example: -6.2
                },
                longitude: {
                  type: "number",
                  example: 106.816666
                },
                gpsAccuracy: {
                  type: "number",
                  minimum: 0,
                  description: "Akurasi GPS dalam meter",
                },
                deviceInfo: {
                  type: "string"
                },
                note: {
                  type: "string"
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Check-in berhasil",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Attendance" },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: "Validasi gagal / di luar radius lokasi",
        },
        409: {
          description: "Sudah check-in / sedang dalam izin yang disetujui",
        },
      },
    },
  },

  "/attendance/check-out": {
    post: {
      tags: ["Attendances"],
      summary: "Check-out absensi",
      description:
        "Menutup sesi absensi terbuka terakhir. Wajib menyertakan `faceToken` dari `POST /faces/recognize`. Tanpa token yang sah → 403 `FACE_VERIFICATION_REQUIRED`.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["latitude", "longitude", "faceToken"],
              properties: {
                faceToken: {
                  type: "string",
                  description: "verificationToken dari /faces/recognize",
                },
                latitude: {
                  type: "number",
                  example: -6.2
                },
                longitude: {
                  type: "number",
                  example: 106.816666
                },
                gpsAccuracy: {
                  type: "number",
                  minimum: 0,
                  description: "Akurasi GPS dalam meter",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Check-out berhasil",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Attendance" },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: "Validasi gagal / di luar radius lokasi / sudah check-out",
        },
        404: {
          description: "Belum ada sesi check-in aktif",
        },
      },
    },
  },

  "/attendance/user-summary-attendances": {
    get: {
      tags: ["Attendances"],
      summary: "Ringkasan absensi per tanggal (admin)",
      description:
        "Rekap jumlah absensi per status dan per work mode untuk tanggal tertentu (default: hari ini).",
      parameters: [
        {
          in: "query",
          name: "date",
          schema: {
            type: "string",
            format: "date"
          },
          description: "Tanggal ringkasan (ISO 8601). Default: hari ini",
        },
      ],
      responses: {
        200: {
          description: "Ringkasan absensi berhasil diambil",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          date: { type: "string" },
                          total: { type: "integer" },
                          byStatus: { type: "object" },
                          byWorkMode: { type: "object" },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        403: {
          description: "Butuh hak admin",
        },
      },
    },
  },

  "/attendance/list-user-attendances": {
    get: {
      tags: ["Attendances"],
      summary: "Daftar absensi semua karyawan dengan filter & paginasi (admin)",
      description:
        "Parameter `date` dan `dateFrom` bersifat mutually exclusive (tidak boleh dipakai bersamaan).",
      parameters: [
        {
          in: "query",
          name: "date",
          schema: {
            type: "string",
            format: "date"
          },
          description: "Filter tanggal tunggal (tidak boleh bersama dateFrom)",
        },
        {
          in: "query",
          name: "dateFrom",
          schema: {
            type: "string",
            format: "date"
          },
        },
        {
          in: "query",
          name: "dateTo",
          schema: {
            type: "string",
            format: "date"
          },
          description: "Harus >= dateFrom",
        },
        {
          in: "query",
          name: "userId",
          schema: {
            type: "string",
            format: "uuid"
          },
        },
        {
          in: "query",
          name: "departmentId",
          schema: {
            type: "string",
            format: "uuid"
          },
        },
        {
          in: "query",
          name: "status",
          schema: {
            type: "string",
            enum: ATTENDANCE_STATUSES
          },
        },
        {
          in: "query",
          name: "workMode",
          schema: {
            type: "string",
            enum: ["WFO", "WFA"]
          },
        },
        {
          in: "query",
          name: "shiftName",
          schema: {
            type: "string",
            enum: SHIFT_NAMES
          },
        },
        {
          in: "query",
          name: "page",
          schema: {
            type: "integer",
            default: 1,
            minimum: 1
          },
        },
        {
          in: "query",
          name: "limit",
          schema: {
            type: "integer",
            default: 20,
            minimum: 1,
            maximum: 100
          },
        },
      ],
      responses: {
        200: {
          description: "Daftar absensi berhasil diambil (dengan pagination)",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Attendance" },
                      },
                      pagination: { $ref: "#/components/schemas/Pagination" },
                    },
                  },
                ],
              },
            },
          },
        },
        403: {
          description: "Butuh hak admin",
        },
      },
    },
  },

  "/attendance/list-user-attendances/export": {
    get: {
      tags: ["Attendances"],
      summary: "Ekspor daftar absensi ke Excel (admin)",
      description:
        "Mengembalikan file `.xlsx`. Wajib `date`, atau `dateFrom` bersama `dateTo` (tanpa itu → 400). Rentang `dateFrom`–`dateTo` maksimal 92 hari. `date` dan `dateFrom` mutually exclusive.",
      parameters: [
        {
          in: "query",
          name: "date",
          schema: {
            type: "string",
            format: "date"
          },
        },
        {
          in: "query",
          name: "dateFrom",
          schema: {
            type: "string",
            format: "date"
          },
        },
        {
          in: "query",
          name: "dateTo",
          schema: {
            type: "string",
            format: "date"
          },
        },
        {
          in: "query",
          name: "userId",
          schema: {
            type: "string",
            format: "uuid"
          },
        },
        {
          in: "query",
          name: "departmentId",
          schema: {
            type: "string",
            format: "uuid"
          },
        },
        {
          in: "query",
          name: "status",
          schema: {
            type: "string",
            enum: ATTENDANCE_STATUSES
          },
        },
        {
          in: "query",
          name: "workMode",
          schema: {
            type: "string",
            enum: ["WFO", "WFA"]
          },
        },
        {
          in: "query",
          name: "shiftName",
          schema: {
            type: "string",
            enum: SHIFT_NAMES
          },
        },
      ],
      responses: {
        200: {
          description: "File Excel absensi",
          content: {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
              {
              schema: {
                  type: "string",
                  format: "binary"
              },
              },
          },
        },
        400: {
          description: "Validasi gagal / rentang tanggal terlalu besar",
        },
        403: {
          description: "Butuh hak admin",
        },
      },
    },
  },

  "/attendance/user-attendance/{id}": {
    get: {
      tags: ["Attendances"],
      summary: "Detail absensi berdasarkan id (admin)",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: {
            type: "string",
            format: "uuid"
          },
        },
      ],
      responses: {
        200: {
          description: "Detail absensi berhasil diambil",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Attendance" },
                    },
                  },
                ],
              },
            },
          },
        },
        403: {
          description: "Butuh hak admin",
        },
        404: {
          description: "Absensi tidak ditemukan",
        },
      },
    },
  },

  "/attendance/create-manual": {
    post: {
      tags: ["Attendances"],
      summary: "Buat absensi manual untuk karyawan (admin)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["userId", "date", "checkIn", "status", "workMode"],
              properties: {
                userId: {
                  type: "string",
                  format: "uuid"
                },
                date: {
                  type: "string",
                  format: "date"
                },
                checkIn: {
                  type: "string",
                  format: "date-time",
                },
                checkOut: {
                  type: "string",
                  format: "date-time",
                  description: "Harus >= checkIn",
                },
                status: {
                  type: "string",
                  enum: ATTENDANCE_STATUSES,
                },
                workMode: {
                  type: "string",
                  enum: ["WFO", "WFA"],
                },
                shiftName: {
                  type: "string",
                  enum: SHIFT_NAMES,
                },
                latitudeIn: {
                  type: "number"
                },
                longitudeIn: {
                  type: "number"
                },
                latitudeOut: {
                  type: "number"
                },
                longitudeOut: {
                  type: "number"
                },
                note: {
                  type: "string",
                  maxLength: 500
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Absensi manual berhasil dibuat",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Attendance" },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: "Validasi gagal / user target tidak aktif",
        },
        403: {
          description: "Butuh hak admin",
        },
        404: {
          description: "User target tidak ditemukan",
        },
      },
    },
  },
};

export default attendanceDocs;
