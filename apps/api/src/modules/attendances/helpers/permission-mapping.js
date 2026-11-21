const LEAVE_LIKE_TYPES = new Set([
  "SICK",
  "PERMIT",
  "ANNUAL_LEAVE",
  "MATERNITY_LEAVE",
  "PATERNITY_LEAVE",
  "MARRIAGE_LEAVE",
  "BEREAVEMENT",
  "OTHER",
]);

export const isLeaveLikePermission = (type) => LEAVE_LIKE_TYPES.has(type);
export const isWfhPermission = (type) => type === "WORK_FROM_HOME";
export const isHalfDayPermission = (type) => type === "HALF_DAY";

export const mapPermissionTypeToAttendanceStatus = (type) => {
  switch (type) {
    case "SICK":
      return "SICK";
    case "PERMIT":
    case "OTHER":
      return "PERMIT";
    case "ANNUAL_LEAVE":
    case "MATERNITY_LEAVE":
    case "PATERNITY_LEAVE":
    case "MARRIAGE_LEAVE":
    case "BEREAVEMENT":
      return "ON_LEAVE";
    case "WORK_FROM_HOME":
      return "WORK_FROM_HOME";
    case "HALF_DAY":
      return "PRESENT";
    default:
      return "PRESENT";
  }
};
