const AUDIT_ACTIONS = [
  "user.created",
  "user.updated",
  "user.toggled_active",
  "user.password_reset",
  "permission.approved",
  "permission.rejected",
  "permission.cancelled",
  "attendance.manual_created",
  "leave_balance.created",
  "leave_balance.updated",
];

const auditLogsDocs = {
  "/audit-logs": {
    get: {
      tags: ["Audit Logs"],
      summary: "Daftar audit log dengan filter & paginasi (admin)",
      parameters: [
        {
          in: "query",
          name: "page",
          schema: { type: "integer", default: 1, minimum: 1 },
        },
        {
          in: "query",
          name: "limit",
          schema: { type: "integer", default: 20, minimum: 1, maximum: 100 },
        },
        {
          in: "query",
          name: "userId",
          schema: { type: "string", format: "uuid" },
        },
        {
          in: "query",
          name: "action",
          schema: { type: "string", enum: AUDIT_ACTIONS },
        },
        {
          in: "query",
          name: "dateFrom",
          schema: { type: "string", format: "date" },
        },
        {
          in: "query",
          name: "dateTo",
          schema: { type: "string", format: "date" },
          description: "Harus >= dateFrom",
        },
      ],
      responses: {
        200: {
          description: "Daftar audit log berhasil diambil",
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
                        items: { $ref: "#/components/schemas/AuditLog" },
                      },
                      pagination: { $ref: "#/components/schemas/Pagination" },
                    },
                  },
                ],
              },
            },
          },
        },
        403: { description: "Butuh hak admin" },
      },
    },
  },
};

export default auditLogsDocs;
