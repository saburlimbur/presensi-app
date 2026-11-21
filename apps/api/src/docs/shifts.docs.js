const SHIFT_NAMES = [
  "MORNING",
  "AFTERNOON",
  "NIGHT",
  "FULL_DAY",
  "SPLIT_SHIFT",
  "FLEXIBLE",
];

const shiftsDocs = {
  "/shifts": {
    get: {
      tags: ["Shifts"],
      summary: "Daftar semua shift (admin)",
      responses: {
        200: {
          description: "Daftar shift berhasil diambil",
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
                        items: { $ref: "#/components/schemas/Shift" },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        403: {
          description: "Butuh hak admin"
        },
      },
    },
    post: {
      tags: ["Shifts"],
      summary: "Buat shift baru (admin)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "startTime", "endTime"],
              properties: {
                name: {
                  type: "string",
                  enum: SHIFT_NAMES
                },
                startTime: {
                  type: "string",
                  format: "date-time",
                  description: "Waktu mulai (ISO 8601)",
                },
                endTime: {
                  type: "string",
                  format: "date-time",
                  description: "Waktu selesai (ISO 8601)",
                },
                gracePeriod: {
                  type: "integer",
                  minimum: 0,
                  default: 0,
                  description: "Toleransi keterlambatan (menit)",
                },
                isActive: {
                  type: "boolean",
                  default: false
                },
                description: {
                  type: "string",
                  maxLength: 255
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Shift berhasil dibuat",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Shift" },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: "Validasi gagal"
        },
        403: {
          description: "Butuh hak admin"
        },
      },
    },
  },

  "/shifts/active": {
    get: {
      tags: ["Shifts"],
      summary: "Ambil shift yang sedang aktif",
      responses: {
        200: {
          description: "Shift aktif berhasil diambil",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Shift" },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Tidak terautentikasi"
        },
      },
    },
  },

  "/shifts/{id}": {
    get: {
      tags: ["Shifts"],
      summary: "Detail shift berdasarkan id (admin)",
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
          description: "Detail shift berhasil diambil",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Shift" },
                    },
                  },
                ],
              },
            },
          },
        },
        403: {
          description: "Butuh hak admin"
        },
        404: {
          description: "Shift tidak ditemukan"
        },
      },
    },
    put: {
      tags: ["Shifts"],
      summary: "Perbarui shift (admin)",
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
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              minProperties: 1,
              properties: {
                name: {
                  type: "string",
                  enum: SHIFT_NAMES
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
                  minimum: 0
                },
                isActive: {
                  type: "boolean"
                },
                description: {
                  type: "string",
                  maxLength: 255
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Shift berhasil diperbarui",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Shift" },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: "Validasi gagal"
        },
        403: {
          description: "Butuh hak admin"
        },
        404: {
          description: "Shift tidak ditemukan"
        },
      },
    },
    delete: {
      tags: ["Shifts"],
      summary: "Hapus shift (admin)",
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
          description: "Shift berhasil dihapus"
        },
        403: {
          description: "Butuh hak admin"
        },
        404: {
          description: "Shift tidak ditemukan"
        },
      },
    },
  },
};

export default shiftsDocs;
