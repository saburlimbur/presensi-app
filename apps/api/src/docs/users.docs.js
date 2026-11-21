
const usersDocs = {
  "/users/register-admin": {
    post: {
      tags: ["Users"],
      summary: "Registrasi akun admin awal (sekali saja)",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password"],
              properties: {
                email: {
                  type: "string",
                  format: "email"
                },
                password: {
                  type: "string",
                  format: "password"
                },
                name: {
                  type: "string"
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Akun admin berhasil dibuat",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/User" }
                    }
                  }
                ]
              }
            }
          }
        },
        400: {
          description: "Validasi gagal / admin sudah ada"
        },
      },
    },
  },

  "/users/login": {
    post: {
      tags: ["Users"],
      summary: "Login karyawan/admin",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password"],
              properties: {
                email: {
                  type: "string",
                  format: "email"
                },
                password: {
                  type: "string",
                  format: "password"
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Login berhasil, mengembalikan access & refresh token",
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
                          accessToken: { type: "string" },
                          refreshToken: { type: "string" },
                          user: { $ref: "#/components/schemas/User" }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        401: {
          description: "Kredensial salah"
        },
      },
    },
  },

  "/users/refresh-token": {
    post: {
      tags: ["Users"],
      summary: "Perbarui access token dari refresh token",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["refreshToken"],
              properties: {
                refreshToken: {
                  type: "string"
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Access token baru diterbitkan",
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
                          accessToken: { type: "string" }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        401: {
          description: "Refresh token tidak valid"
        },
      },
    },
  },

  "/users/profile": {
    get: {
      tags: ["Users"],
      summary: "Ambil profil user yang sedang login",
      responses: {
        200: {
          description: "Profil berhasil diambil",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/User" }
                    }
                  }
                ]
              }
            }
          }
        },
        401: {
          description: "Tidak terautentikasi"
        },
      },
    },
  },

  "/users": {
    post: {
      tags: ["Users"],
      summary: "Buat akun karyawan baru (admin)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "name"],
              properties: {
                email: {
                  type: "string",
                  format: "email"
                },
                name: {
                  type: "string"
                },
                departmentId: {
                  type: "string"
                },
                role: {
                  type: "string",
                  enum: ["ADMIN", "EMPLOYEE"]
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Akun karyawan berhasil dibuat",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/User" }
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
    get: {
      tags: ["Users"],
      summary: "Daftar karyawan dengan filter & paginasi (admin)",
      parameters: [
        {
          in: "query",
          name: "page",
          schema: {
            type: "integer",
            default: 1
          }
        },
        {
          in: "query",
          name: "limit",
          schema: {
            type: "integer",
            default: 10
          }
        },
        {
          in: "query",
          name: "search",
          schema: {
            type: "string"
          }
        },
        {
          in: "query",
          name: "departmentId",
          schema: {
            type: "string"
          }
        },
        {
          in: "query",
          name: "role",
          schema: {
            type: "string",
            enum: ["ADMIN", "EMPLOYEE"]
          }
        },
        {
          in: "query",
          name: "isActive",
          schema: {
            type: "boolean"
          }
        },
      ],
      responses: {
        200: {
          description: "Daftar karyawan (dengan pagination)",
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
                        items: { $ref: "#/components/schemas/User" }
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
  },

  "/users/{id}": {
    get: {
      tags: ["Users"],
      summary: "Detail karyawan berdasarkan id (admin)",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: {
            type: "string"
          }
        },
      ],
      responses: {
        200: {
          description: "Detail karyawan",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/User" }
                    }
                  }
                ]
              }
            }
          }
        },
        404: {
          description: "Karyawan tidak ditemukan"
        },
      },
    },
  },
};

export default usersDocs;
