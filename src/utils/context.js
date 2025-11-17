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
    AssetListPageContext
};
