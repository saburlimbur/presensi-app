const facesDocs = {
  "/faces/enroll": {
    post: {
      tags: ["Faces"],
      summary: "Registrasi (enroll) wajah user yang login",
      description:
        "Upload 1–10 foto wajah untuk membuat embedding. Menggunakan `multipart/form-data` dengan field `user_faces`.",
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["user_faces"],
              properties: {
                user_faces: {
                  type: "array",
                  maxItems: 10,
                  items: {
                    type: "string",
                    format: "binary",
                  },
                  description: "1–10 file gambar wajah",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Wajah berhasil didaftarkan",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
            },
          },
        },
        400: {
          description: "Foto tidak valid / wajah tidak terdeteksi",
        },
        401: {
          description: "Tidak terautentikasi",
        },
      },
    },
  },

  "/faces/recognize": {
    post: {
      tags: ["Faces"],
      summary: "Verifikasi/pengenalan wajah",
      description:
        "Cocokkan foto absensi dengan embedding wajah terdaftar. Menggunakan `multipart/form-data` dengan field `attendance_photo` (jpeg/png). Respons `data`: `{ userId, distance, confidence, verificationToken? }`. `verificationToken` hanya ada kalau wajah cocok dengan user yang login, berlaku 5 menit untuk satu kali check-in atau check-out, dan dikirim sebagai `faceToken` ke check-in/check-out. Wajah tidak dikenali → 404.",
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["attendance_photo"],
              properties: {
                attendance_photo: {
                  type: "string",
                  format: "binary",
                  description: "Foto wajah untuk dicocokkan",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Hasil pencocokan wajah (match / tidak)",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
            },
          },
        },
        400: {
          description: "Foto tidak valid / wajah tidak terdeteksi",
        },
        401: {
          description: "Tidak terautentikasi",
        },
      },
    },
  },

  "/faces/my-embeddings": {
    get: {
      tags: ["Faces"],
      summary: "Ambil daftar embedding wajah milik user yang login",
      responses: {
        200: {
          description: "Daftar embedding berhasil diambil",
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
                        items: { $ref: "#/components/schemas/FaceEmbedding" },
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

  "/faces/reset": {
    delete: {
      tags: ["Faces"],
      summary: "Hapus semua data wajah user yang login",
      responses: {
        200: {
          description: "Data wajah berhasil direset",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
            },
          },
        },
        401: {
          description: "Tidak terautentikasi",
        },
      },
    },
  },
};

export default facesDocs;
