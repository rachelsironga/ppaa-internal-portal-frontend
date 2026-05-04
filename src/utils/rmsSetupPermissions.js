import { hasAccess } from "../hooks/AccessHandler";

/** Portal admin or RMS system admin — full RMS Setup UI (FY, stakeholders, types, categories). */
export function isRmsSetupSysAdminUser(user) {
  if (!user) return false;
  if (user.is_superuser) return true;
  const nr = (user.groups || []).map((g) => String(g).toLowerCase());
  return nr.includes("admin") || nr.includes("rms_sys_admin");
}

/** SpismFinancialYear (ppaa_performance) + legacy UI names + SPISM setup custom perms. */
const ADD_FY = [
  "add_spismfinancialyear",
  "add_financialyear",
  "can_edit_spism_setup",
];
const CHANGE_FY = [
  "change_spismfinancialyear",
  "change_financialyear",
  "can_edit_spism_setup",
];
const DELETE_FY = [
  "delete_spismfinancialyear",
  "delete_financialyear",
  "can_edit_spism_setup",
];

const ADD_STAKEHOLDER = ["add_rmsstakeholder", "add_stakeholder"];
const CHANGE_STAKEHOLDER = ["change_rmsstakeholder", "change_stakeholder"];
const DELETE_STAKEHOLDER = ["delete_rmsstakeholder", "delete_stakeholder"];

const ADD_CATEGORY = ["add_rmsreportcategory", "add_reportcategory"];
const CHANGE_CATEGORY = ["change_rmsreportcategory", "change_reportcategory"];
const DELETE_CATEGORY = ["delete_rmsreportcategory", "delete_reportcategory"];

const ADD_TYPE = ["add_rmsreporttype", "add_reporttype"];
const CHANGE_TYPE = ["change_rmsreporttype", "change_reporttype"];
const DELETE_TYPE = ["delete_rmsreporttype", "delete_reporttype"];

export function canAddFinancialYear(user) {
  return isRmsSetupSysAdminUser(user) || hasAccess(user, ADD_FY);
}
export function canChangeFinancialYear(user) {
  return isRmsSetupSysAdminUser(user) || hasAccess(user, CHANGE_FY);
}
export function canDeleteFinancialYear(user) {
  return isRmsSetupSysAdminUser(user) || hasAccess(user, DELETE_FY);
}

export function canAddStakeholder(user) {
  return isRmsSetupSysAdminUser(user) || hasAccess(user, ADD_STAKEHOLDER);
}
export function canChangeStakeholder(user) {
  return isRmsSetupSysAdminUser(user) || hasAccess(user, CHANGE_STAKEHOLDER);
}
export function canDeleteStakeholder(user) {
  return isRmsSetupSysAdminUser(user) || hasAccess(user, DELETE_STAKEHOLDER);
}

export function canAddReportCategory(user) {
  return isRmsSetupSysAdminUser(user) || hasAccess(user, ADD_CATEGORY);
}
export function canChangeReportCategory(user) {
  return isRmsSetupSysAdminUser(user) || hasAccess(user, CHANGE_CATEGORY);
}
export function canDeleteReportCategory(user) {
  return isRmsSetupSysAdminUser(user) || hasAccess(user, DELETE_CATEGORY);
}

export function canAddReportType(user) {
  return isRmsSetupSysAdminUser(user) || hasAccess(user, ADD_TYPE);
}
export function canChangeReportType(user) {
  return isRmsSetupSysAdminUser(user) || hasAccess(user, CHANGE_TYPE);
}
export function canDeleteReportType(user) {
  return isRmsSetupSysAdminUser(user) || hasAccess(user, DELETE_TYPE);
}
