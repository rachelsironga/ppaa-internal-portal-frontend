import { hasAccess } from "../hooks/AccessHandler";

/** Django RMS model perms (JWT `user_permissions`) plus legacy aliases if ever used. */
const ADD_REPORT = ["add_rmsreport", "add_report"];
const CHANGE_REPORT = ["change_rmsreport", "change_report"];
const DELETE_REPORT = ["delete_rmsreport", "delete_report"];
/** Submit is implemented as report update on the API; allow same as change + legacy name. */
const SUBMIT_REPORT = ["change_rmsreport", "change_report", "submit_report"];

export function canCreateRmsReport(user) {
  return hasAccess(user, ADD_REPORT);
}

export function canChangeRmsReport(user) {
  return hasAccess(user, CHANGE_REPORT);
}

export function canDeleteRmsReport(user) {
  return hasAccess(user, DELETE_REPORT);
}

export function canSubmitRmsReport(user) {
  return hasAccess(user, SUBMIT_REPORT);
}
