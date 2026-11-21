const locationsDocs = {
  "/locations": {
    get: {
      tags: ["Locations"],
      summary: "Daftar lokasi/geofence dengan filter & paginasi (admin)",
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
          name: "isActive",
          schema: {
            type: "boolean"
          },
        },
      ],
      responses: {
        200: {
          description: "Daftar lokasi berhasil diambil",
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
                        items: { $ref: "#/components/schemas/AttendanceLocation" }
                      },
                      pagination: { $ref: "#/components/schemas/Pagination" }
                    }
                  }
                ]
              }
            }
          }
        },
        403: {
          description: "Butuh hak admin"
        },
      },
    },
    post: {
      tags: ["Locations"],
      summary: "Buat lokasi/geofence baru (admin)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "latitude", "longitude", "radius"],
              properties: {
                name: {
                  type: "string",
                  minLength: 3,
                  maxLength: 100
                },
                address: {
                  type: "string",
                  maxLength: 255,
                  nullable: true
                },
                latitude: {
                  type: "number",
                  minimum: -90,
                  maximum: 90,
                  example: -6.2,
                },
                longitude: {
                  type: "number",
                  minimum: -180,
                  maximum: 180,
                  example: 106.816666,
                },
                radius: {
                  type: "integer",
                  minimum: 1,
                  maximum: 10000,
                  description: "Radius geofence dalam meter"
                },
                isActive: {
                  type: "boolean",
                  default: true
                }
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Lokasi berhasil dibuat",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/AttendanceLocation" }
                    }
                  }
                ]
              }
            }
          }
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

  "/locations/{id}": {
    get: {
      tags: ["Locations"],
      summary: "Detail lokasi berdasarkan id (admin)",
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
          description: "Detail lokasi berhasil diambil",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/AttendanceLocation" }
                    }
                  }
                ]
              }
            }
          }
        },
        403: {
          description: "Butuh hak admin"
        },
        404: {
          description: "Lokasi tidak ditemukan"
        },
      },
    },
    put: {
      tags: ["Locations"],
      summary: "Perbarui lokasi (admin)",
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
                  minLength: 3,
                  maxLength: 100
                },
                address: {
                  type: "string",
                  maxLength: 255,
                  nullable: true
                },
                latitude: {
                  type: "number",
                  minimum: -90,
                  maximum: 90
                },
                longitude: {
                  type: "number",
                  minimum: -180,
                  maximum: 180
                },
                radius: {
                  type: "integer",
                  minimum: 1,
                  maximum: 10000
                },
                isActive: {
                  type: "boolean"
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Lokasi berhasil diperbarui",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/AttendanceLocation" }
                    }
                  }
                ]
              }
            }
          }
        },
        400: {
          description: "Validasi gagal"
        },
        403: {
          description: "Butuh hak admin"
        },
        404: {
          description: "Lokasi tidak ditemukan"
        },
      },
    },
    delete: {
      tags: ["Locations"],
      summary: "Hapus lokasi (admin)",
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
          description: "Lokasi berhasil dihapus"
        },
        403: {
          description: "Butuh hak admin"
        },
        404: {
          description: "Lokasi tidak ditemukan"
        },
      },
    },
  },
};

export default locationsDocs;
