const NOTIFICATION_TYPES = [
  "ATTENDANCE_REMINDER",
  "ATTENDANCE_CHECK_IN",
  "ATTENDANCE_CHECK_OUT",
  "PERMISSION_SUBMITTED",
  "PERMISSION_APPROVED",
  "PERMISSION_REJECTED",
  "ANNOUNCEMENT",
  "SYSTEM",
];

const notificationsDocs = {
  "/events/stream": {
    get: {
      tags: ["Notifications"],
      summary: "Stream notifikasi real-time (SSE)",
      description:
        "Server-Sent Events (`text/event-stream`). Autentikasi lewat header `Authorization: Bearer <accessToken>`; query `token` masih diterima untuk `EventSource` native yang tidak bisa mengirim header. Koneksi tetap terbuka dan mengirim event notifikasi secara real-time.",
      parameters: [
        {
          in: "query",
          name: "token",
          required: false,
          schema: {
            type: "string"
          },
          description: "Access token JWT",
        },
      ],
      responses: {
        200: {
          description: "Stream SSE terbuka",
          content: {
            "text/event-stream": {
              schema: {
                type: "string"
              },
            },
          },
        },
        401: {
          description: "Token tidak valid"
        },
      },
    },
  },

  "/notifications": {
    get: {
      tags: ["Notifications"],
      summary: "Daftar notifikasi user yang login (dengan filter & paginasi)",
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
            default: 20,
            minimum: 1,
            maximum: 100
          },
        },
        {
          in: "query",
          name: "unreadOnly",
          schema: {
            type: "boolean",
            default: false
          },
        },
        {
          in: "query",
          name: "type",
          schema: {
            type: "string",
            enum: NOTIFICATION_TYPES
          },
        },
      ],
      responses: {
        200: {
          description: "Daftar notifikasi berhasil diambil",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  {
                    $ref: "#/components/schemas/ApiResponse"
                  },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/Notification"
                        },
                      },
                      pagination: {
                        $ref: "#/components/schemas/Pagination"
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

  "/notifications/unread-count": {
    get: {
      tags: ["Notifications"],
      summary: "Jumlah notifikasi belum dibaca",
      responses: {
        200: {
          description: "Jumlah notifikasi belum dibaca",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  {
                    $ref: "#/components/schemas/ApiResponse"
                  },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          unread: {
                            type: "integer"
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
          description: "Tidak terautentikasi"
        },
      },
    },
  },

  "/notifications/read-all": {
    patch: {
      tags: ["Notifications"],
      summary: "Tandai semua notifikasi sebagai dibaca",
      responses: {
        200: {
          description: "Semua notifikasi ditandai dibaca",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  {
                    $ref: "#/components/schemas/ApiResponse"
                  },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          updated: {
                            type: "integer"
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
          description: "Tidak terautentikasi"
        },
      },
    },
  },

  "/notifications/{id}/read": {
    patch: {
      tags: ["Notifications"],
      summary: "Tandai satu notifikasi sebagai dibaca",
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
          description: "Notifikasi ditandai dibaca",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  {
                    $ref: "#/components/schemas/ApiResponse"
                  },
                  {
                    type: "object",
                    properties: {
                      data: {
                        $ref: "#/components/schemas/Notification"
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
        404: {
          description: "Notifikasi tidak ditemukan"
        },
      },
    },
  },
};

export default notificationsDocs;
