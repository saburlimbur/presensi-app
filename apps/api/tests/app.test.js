import app from "../src/app.js";

describe("health endpoint", () => {
  let server;

  afterAll(
    () =>
      new Promise((resolve, reject) => {
        if (!server) return resolve();
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  );

  test("GET / returns health payload", async () => {
    server = app.listen(0);
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.status).toBe("success");
    expect(payload.message).toBe("API is running successfully.");
    expect(typeof payload.environment).toBe("string");
  });

  test("origin tidak dikenal → 403, bukan 500", async () => {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/`, {
      headers: { Origin: "https://evil.example.com" },
    });
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.code).toBe("CORS_FORBIDDEN");
  });

  test("export attendance tanpa rentang tanggal ditolak schema", async () => {
    const { adminExportQuerySchema } = await import(
      "../src/modules/attendances/attendance.model.js"
    );
    expect(adminExportQuerySchema.validate({}).error).toBeDefined();
    expect(
      adminExportQuerySchema.validate({ dateFrom: "2026-06-01" }).error,
    ).toBeDefined();
    expect(
      adminExportQuerySchema.validate({
        dateFrom: "2026-06-01",
        dateTo: "2026-06-30",
      }).error,
    ).toBeUndefined();
    expect(
      adminExportQuerySchema.validate({ date: "2026-06-01" }).error,
    ).toBeUndefined();
  });
});
