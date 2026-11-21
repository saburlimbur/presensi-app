const leaveBalancesDocs = {
  "/leave-balances/my-balance": {
    get: {
      tags: ["Leave Balances"],
      summary: "Saldo cuti user yang login",
      parameters: [
        {
          in: "query",
          name: "year",
          schema: { type: "integer" },
          description: "Tahun saldo cuti. Default: tahun berjalan",
        },
      ],
      responses: {
        200: {
          description: "Saldo cuti berhasil diambil",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/LeaveBalance" },
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

  "/leave-balances": {
    get: {
      tags: ["Leave Balances"],
      summary: "Daftar saldo cuti dengan filter & paginasi (admin)",
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
          name: "userId",
          schema: {
            type: "string",
            format: "uuid"
          },
        },
        {
          in: "query",
          name: "year",
          schema: {
            type: "integer"
          },
        },
      ],
      responses: {
        200: {
          description: "Daftar saldo cuti berhasil diambil",
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
                        items: { $ref: "#/components/schemas/LeaveBalance" },
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
    post: {
      tags: ["Leave Balances"],
      summary: "Buat saldo cuti untuk karyawan (admin)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["userId"],
              properties: {
                userId: {
                  type: "string",
                  format: "uuid"
                },
                year: {
                  type: "integer",
                  description: "Default: tahun berjalan",
                },
                annualQuota: {
                  type: "integer",
                  minimum: 0,
                  default: 12,
                  description: "Kuota cuti tahunan (hari)",
                },
                carryOverDays: {
                  type: "integer",
                  minimum: 0,
                  default: 0,
                  description: "Sisa cuti tahun sebelumnya (hari)",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Saldo cuti berhasil dibuat",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/LeaveBalance" },
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

  "/leave-balances/by-user/{userId}": {
    get: {
      tags: ["Leave Balances"],
      summary: "Saldo cuti berdasarkan userId (admin)",
      parameters: [
        {
          in: "path",
          name: "userId",
          required: true,
          schema: {
            type: "string",
            format: "uuid"
          },
        },
      ],
      responses: {
        200: {
          description: "Saldo cuti berhasil diambil",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/LeaveBalance" },
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
          description: "Data tidak ditemukan"
        },
      },
    },
  },

  "/leave-balances/{id}": {
    patch: {
      tags: ["Leave Balances"],
      summary: "Perbarui saldo cuti (admin)",
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
                annualQuota: {
                  type: "integer",
                  minimum: 0
                },
                carryOverDays: {
                  type: "integer",
                  minimum: 0
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Saldo cuti berhasil diperbarui",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/LeaveBalance" },
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
          description: "Data tidak ditemukan"
        },
      },
    },
  },
};

export default leaveBalancesDocs;
