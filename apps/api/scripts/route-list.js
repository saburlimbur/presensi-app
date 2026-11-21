import listEndpoints from "express-list-endpoints";
import app from "../src/app.js";

app._router = app._router ?? app.router;

const rows = listEndpoints(app)
  .flatMap((r) =>
    r.methods.map((method) => ({
      method,
      path: r.path === "/" ? "/" : `/attendance_api${r.path}`,
      middlewares: r.middlewares.filter((m) => m !== "anonymous").join(", "),
    })),
  )
  .sort(
    (a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method),
  );

console.table(rows);
console.log(`\nTotal: ${rows.length} routes\n`);
process.exit(0);
