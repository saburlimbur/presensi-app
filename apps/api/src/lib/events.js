import { EventEmitter } from "events";

const bus = new EventEmitter();
bus.setMaxListeners(200);

export const EVENTS = {
  PERMISSION_SUBMITTED: "permission:submitted",
  PERMISSION_DECIDED: "permission:decided",
  PERMISSION_CANCELLED: "permission:cancelled",
  ATTENDANCE_CHECKED_IN: "attendance:checked_in",
  ATTENDANCE_CHECKED_OUT: "attendance:checked_out",
};

export default bus;
