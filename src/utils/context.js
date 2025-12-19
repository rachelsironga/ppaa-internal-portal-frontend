import { createContext } from "react";

const PageContext = createContext();


const ApprovalActionContext = createContext();

const PositionalLevelContext = createContext();

const ApprovalModuleContext = createContext();

const DepartmentsContext = createContext();

const DirectoryContext = createContext();

const ApprovalRequestsContext = createContext();

const UsersContext = createContext();

const AccountContext = createContext();

const DateRangeContext = createContext();

const RolesManagementContext = createContext();

// ICT ASSETS
const AssetContext = createContext();
const AssetListPageContext = createContext();
const AssetDashboardContext = createContext();
const ManufactureContext = createContext();
const SuppliersContext = createContext();
const DisposalRecordContext = createContext();


// OXYGEN MANAGEMENT
export const OxygenLocationContext = createContext();
export const OxygenVolumeContext = createContext();
export const OxygenSupplierContext = createContext();
export const PatientAgeGroupContext = createContext();
export const OxygenLocationUsageContext = createContext();
export const OxygenUsageContext = createContext();
export const OxygenRecievingContext = createContext();
export const OxygenAllocationContext = createContext();

// MAONI MANAGEMENT
export const MaoniCategoryContext = createContext();
export const MaoniStatusContext = createContext();
export const MaoniPriorityContext = createContext();
export const MaoniHandlerActionContext = createContext();
export const MaoniContext = createContext();

export {
    PageContext,
    ApprovalActionContext,
    PositionalLevelContext,
    DepartmentsContext,
    ApprovalRequestsContext,
    DirectoryContext,
    ApprovalModuleContext,
    DateRangeContext,
    AccountContext,
    UsersContext,
    RolesManagementContext,

    // ICT ASSETS MANAGEMENT
    AssetContext,
    AssetDashboardContext,
    AssetListPageContext,
    ManufactureContext,
    SuppliersContext,
    DisposalRecordContext,
};
