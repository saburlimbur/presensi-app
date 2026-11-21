const PERMISSION_TYPES = [
  "SICK",
  "PERMIT",
  "ANNUAL_LEAVE",
  "MATERNITY_LEAVE",
  "PATERNITY_LEAVE",
  "MARRIAGE_LEAVE",
  "BEREAVEMENT",
  "HALF_DAY",
  "WORK_FROM_HOME",
  "OTHER",
];

const PERMISSION_STATUSES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

const permissionsDocs = {
  "/permissions/request": {
    post: {
      tags: ["Permissions"],
      summary: "Ajukan izin/cuti (user)",
      description:
        "Membuat pengajuan izin. Menggunakan `multipart/form-data` dengan lampiran opsional `permission_attachment`.",
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["type", "startDate", "endDate"],
              properties: {
                type: {
                  type: "string",
                  enum: PERMISSION_TYPES
                },
                startDate: {
                  type: "string",
                  format: "date"
                },
                endDate: {
                  type: "string",
                  format: "date",
                  description: "Harus >= startDate",
                },
                reason: {
                  type: "string",
                  maxLength: 500
                },
                permission_attachment: {
                  type: "string",
                  format: "binary",
                  description: "Lampiran (opsional), mis. surat dokter",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Pengajuan izin berhasil dibuat",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Permission" },
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
        401: {
          description: "Tidak terautentikasi"
        },
      },
    },
  },

  "/permissions/my-permission": {
    get: {
      tags: ["Permissions"],
      summary: "Daftar izin milik user yang login",
      responses: {
        200: {
          description: "Daftar izin berhasil diambil",
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
                        items: { $ref: "#/components/schemas/Permission" },
                      },
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

  "/permissions": {
    get: {
      tags: ["Permissions"],
      summary: "Daftar semua izin dengan filter & paginasi (admin)",
      parameters: [
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
            default: 10,
            minimum: 1,
            maximum: 100
          },
        },
        {
          in: "query",
          name: "search",
          schema: {
            type: "string"
          },
        },
        {
          in: "query",
          name: "type",
          schema: {
            type: "string",
            enum: PERMISSION_TYPES
          },
        },
        {
          in: "query",
          name: "status",
          schema: {
            type: "string",
            enum: PERMISSION_STATUSES
          },
        },
      ],
      responses: {
        200: {
          description: "Daftar izin berhasil diambil",
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
                        items: { $ref: "#/components/schemas/Permission" },
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
          description: "Butuh hak admin"
        },
      },
    },
  },

  "/permissions/{id}": {
    get: {
      tags: ["Permissions"],
      summary: "Detail izin berdasarkan id (admin)",
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
          description: "Detail izin berhasil diambil",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Permission" },
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
          description: "Izin tidak ditemukan"
        },
      },
    },
  },

  "/permissions/{id}/approve": {
    patch: {
      tags: ["Permissions"],
      summary: "Setujui pengajuan izin (admin)",
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
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
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
        200: {
          description: "Izin berhasil disetujui",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Permission" },
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
          description: "Izin tidak ditemukan"
        },
      },
    },
  },

  "/permissions/{id}/reject": {
    patch: {
      tags: ["Permissions"],
      summary: "Tolak pengajuan izin (admin)",
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
              required: ["note"],
              properties: {
                note: {
                  type: "string",
                  maxLength: 500,
                  description: "Alasan penolakan (wajib)",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Izin berhasil ditolak",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Permission" },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: "Alasan penolakan wajib diisi"
        },
        403: {
          description: "Butuh hak admin"
        },
        404: {
          description: "Izin tidak ditemukan"
        },
      },
    },
  },

  "/permissions/{id}/cancel": {
    patch: {
      tags: ["Permissions"],
      summary: "Batalkan pengajuan izin (user pemilik)",
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
          description: "Izin berhasil dibatalkan",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Permission" },
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
        404: {
          description: "Izin tidak ditemukan"
        },
      },
    },
  },
};

export default permissionsDocs;
