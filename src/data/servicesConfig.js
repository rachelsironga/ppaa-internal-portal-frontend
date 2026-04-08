import ppaaInternalPortalMenu from "./ppaaInternalPortal.json";
import maoniMenu from "./maoniMenu.json";
import performanceDashboardMenu from "./performanceDashboardMenu.json";
import reportManagementMenu from "./reportManagementMenu.json";

// Add new services here without touching Sidebar.js
const servicesConfig = [
    {
        id: "internal-portal",
        name: "Internal Portal",
        link: "/ppaa-internal-portal",
        menu: ppaaInternalPortalMenu
    },
    {
        id: "ppaa-maoni",
        name: "PPAA Maoni",
        link: "/ppaa-maoni",
        menu: maoniMenu
    },
    {
        id: "performance-dashboard",
        name: "Strategic Performance Management (SPISM)",
        link: "/performance-dashboard",
        menu: performanceDashboardMenu
    },
    {
        id: "report-management",
        name: "Reports Management(RMS)",
        link: "/report-management",
        menu: reportManagementMenu
    },
    {
        id: "help-desk",
        name: "Help Desk",
        link: "/help-desk",
        menu: []
    }
];

export default servicesConfig;
