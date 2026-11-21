const departmentsDocs = {
  "/departments": {
    get: {
      tags: ["Departments"],
      summary: "Daftar departemen dengan filter & paginasi (admin)",
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
          name: "code",
          schema: {
            type: "string"
          },
        },
        {
          in: "query",
          name: "name",
          schema: {
            type: "string"
          },
        },
      ],
      responses: {
        200: {
          description: "Daftar departemen berhasil diambil",
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
                        items: { $ref: "#/components/schemas/Department" },
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
      tags: ["Departments"],
      summary: "Buat departemen baru (admin)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "code"],
              properties: {
                name: {
                  type: "string",
                  minLength: 3,
                  description: "Nama departemen (min 3 karakter)",
                },
                code: {
                  type: "string",
                  minLength: 2,
                  description: "Kode departemen (min 2 karakter, uppercase)",
                },
                headId: {
                  type: "string",
                  format: "uuid",
                  nullable: true,
                  description: "User id kepala departemen",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Departemen berhasil dibuat",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Department" },
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

  "/departments/code/{code}": {
    get: {
      tags: ["Departments"],
      summary: "Detail departemen berdasarkan kode (admin)",
      parameters: [
        {
          in: "path",
          name: "code",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: {
          description: "Detail departemen berhasil diambil",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Department" },
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
          description: "Departemen tidak ditemukan"
        },
      },
    },
  },

  "/departments/{id}": {
    get: {
      tags: ["Departments"],
      summary: "Detail departemen berdasarkan id (admin)",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        200: {
          description: "Detail departemen berhasil diambil",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Department" },
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
          description: "Departemen tidak ditemukan"
        },
      },
    },
    put: {
      tags: ["Departments"],
      summary: "Perbarui departemen (admin)",
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
                  minLength: 3
                },
                code: {
                  type: "string",
                  minLength: 2
                },
                headId: {
                  type: "string",
                  format: "uuid",
                  nullable: true
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Departemen berhasil diperbarui",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Department" },
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
          description: "Departemen tidak ditemukan"
        },
      },
    },
    delete: {
      tags: ["Departments"],
      summary: "Hapus departemen (admin)",
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
          description: "Departemen berhasil dihapus"
        },
        403: {
          description: "Butuh hak admin"
        },
        404: {
          description: "Departemen tidak ditemukan"
        },
      },
    },
  },
};

export default departmentsDocs;
