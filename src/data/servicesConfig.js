import eApprovalMenu from "./eApprovalMenu.json";
import ictAssetsMenu from "./ictAssetsMenu.json";
import oxygenMenu from "./oxygeServiceMenu.json";
import defaultMenu from "./defaultMenu.json";
import analyticsMenu from "./analyticsMenu.json";
import maoniMenu from "./maoniMenu.json";

import trainingMenu from "./trainingMenu.json";

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
        id: "hospital-analytics",
        name: "Hospital Analytics",
        link: "/analytics",
        menu: analyticsMenu
    },
    {
        id: "mnh-maoni",
        name: "MNH Maoni",
        link: "/mnh-maoni",
        menu: maoniMenu
    },
    {
        id: "training",
        name: "Training Management",
        link: "/training",
        menu: trainingMenu
    },
    {
        id: "default-menu",
        name: "MNH Connect",
        link: "/default",
        menu: defaultMenu
    }
];

export default servicesConfig;
