import eApprovalMenu from "./eApprovalMenu.json";
import ictAssetsMenu from "./ictAssetsMenu.json";
import oxygenMenu from "./oxygeServiceMenu.json";
import defaultMenu from "./defaultMenu.json";


// Add new services here without touching Sidebar.js
const servicesConfig = [
    {
        id: "e-approval",
        name: "E-Approval",
        link: "/mnh-connect",
        menu: eApprovalMenu
    },
    {
        id: "ict-assets",
        name: "ICT Assets",
        link: "/ict-assets",
        menu: ictAssetsMenu
    },
    {
        id: "oxygen-management",
        name: "Oxygen Management",
        link: "/oxygen-management",
        menu: oxygenMenu
    },
    {
        id: "default-menu",
        name: "MNH Connect",
        link: "/default",
        menu: defaultMenu
    }
];

export default servicesConfig;
