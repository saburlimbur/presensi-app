const reportsDocs = {
  "/reports/attendance/monthly": {
    get: {
      tags: ["Reports"],
      summary: "Laporan absensi bulanan (admin)",
      parameters: [
        {
          in: "query",
          name: "month",
          required: true,
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 12
          },
        },
        {
          in: "query",
          name: "year",
          required: true,
          schema: {
            type: "integer",
            minimum: 2020,
            maximum: 2100
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
          name: "userId",
          schema: {
            type: "string",
            format: "uuid"
          },
        },
      ],
      responses: {
        200: {
          description: "Laporan bulanan berhasil diambil",
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
                        description: "Objek laporan agregat"
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        400: {
          description: "Validasi gagal (month/year wajib)"
        },
        403: {
          description: "Butuh hak admin"
        },
      },
    },
  },

  "/reports/attendance/weekly": {
    get: {
      tags: ["Reports"],
      summary: "Laporan absensi mingguan (admin)",
      parameters: [
        {
          in: "query",
          name: "weekStart",
          required: true,
          schema: {
            type: "string",
            format: "date"
          },
          description: "Tanggal awal minggu (YYYY-MM-DD)",
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
          name: "userId",
          schema: {
            type: "string",
            format: "uuid"
          },
        },
      ],
      responses: {
        200: {
          description: "Laporan mingguan berhasil diambil",
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
                        description: "Objek laporan agregat"
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        400: {
          description: "Validasi gagal (weekStart wajib)"
        },
        403: {
          description: "Butuh hak admin"
        },
      },
    },
  },

  "/reports/attendance/range": {
    get: {
      tags: ["Reports"],
      summary: "Laporan absensi rentang tanggal (admin)",
      parameters: [
        {
          in: "query",
          name: "from",
          required: true,
          schema: {
            type: "string",
            format: "date"
          },
          description: "Tanggal mulai (YYYY-MM-DD)",
        },
        {
          in: "query",
          name: "to",
          required: true,
          schema: {
            type: "string",
            format: "date"
          },
          description: "Tanggal akhir (>= from)",
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
          name: "userId",
          schema: {
            type: "string",
            format: "uuid"
          },
        },
      ],
      responses: {
        200: {
          description: "Laporan rentang tanggal berhasil diambil",
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
                        description: "Objek laporan agregat"
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        400: {
          description: "Validasi gagal (from/to wajib)"
        },
        403: {
          description: "Butuh hak admin"
        },
      },
    },
  },
};

export default reportsDocs;
