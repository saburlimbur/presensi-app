import usersDocs from "./users.docs.js";
import attendanceDocs from "./attendance.docs.js";
import facesDocs from "./faces.docs.js";
import shiftsDocs from "./shifts.docs.js";
import departmentsDocs from "./departments.docs.js";
import permissionsDocs from "./permissions.docs.js";
import locationsDocs from "./locations.docs.js";
import notificationsDocs from "./notifications.docs.js";
import leaveBalancesDocs from "./leave-balances.docs.js";
import reportsDocs from "./reports.docs.js";
import auditLogsDocs from "./audit-logs.docs.js";

const paths = {
  ...usersDocs,
  ...attendanceDocs,
  ...facesDocs,
  ...shiftsDocs,
  ...departmentsDocs,
  ...permissionsDocs,
  ...locationsDocs,
  ...notificationsDocs,
  ...leaveBalancesDocs,
  ...reportsDocs,
  ...auditLogsDocs,
};

export default paths;
