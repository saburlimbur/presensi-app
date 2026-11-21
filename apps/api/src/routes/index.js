import userRoutes from "../modules/users/user.routes.js";
import faceRoutes from "../modules/faces/face.routes.js";
import attendanceRoutes from "../modules/attendances/attendance.routes.js";
import shiftsRoutes from "../modules/shifts/shifts.routes.js";
import departmentsRoutes from "../modules/departments/departments.routes.js";
import permissionRoutes from "../modules/permissions/permission.routes.js";
import locationsRoutes from "../modules/locations/locations.routes.js";
import notificationRoutes from "../modules/notifications/notification.routes.js";
import leaveBalanceRoutes from "../modules/leave-balances/leave-balance.routes.js";
import reportsRoutes from "../modules/reports/reports.routes.js";
import auditLogsRoutes from "../modules/audit_logs/audit_logs.routes.js";

const routes = [
  userRoutes,
  faceRoutes,
  attendanceRoutes,
  shiftsRoutes,
  departmentsRoutes,
  permissionRoutes,
  locationsRoutes,
  notificationRoutes,
  leaveBalanceRoutes,
  reportsRoutes,
  auditLogsRoutes,
];

const router = (app) => {
  routes.forEach((r) => {
    app.use("/attendance_api", r);
  });
};

export default router;
