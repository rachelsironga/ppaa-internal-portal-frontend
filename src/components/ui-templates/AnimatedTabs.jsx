import React, { useState } from "react";
import { motion } from "framer-motion";

const tabs = ["Overview", "Settings", "Analytics", "Profile"];

export default function AnimatedTabs() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="w-full flex flex-col items-center mt-10">
      {/* Tab Pills */}
      <div className="flex bg-gray-200 rounded-full p-1 relative">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`relative z-10 px-6 py-2 text-sm font-medium transition-colors duration-300
              ${activeTab === index ? "text-white" : "text-gray-600"}
            `}
          >
            {tab}
          </button>
        ))}

        {/* Animated Background */}
        <motion.div
          layout
          className="absolute top-1 bottom-1 w-1/4 rounded-full bg-blue-500"
          initial={{ x: 0 }}
          animate={{ x: `${activeTab * 100}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        />
      </div>

      {/* Tab Content with Fade Animation */}
      <div className="mt-6 w-3/4 text-center">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-gray-700 text-lg"
        >
          {tabs[activeTab]} Content Goes Here
        </motion.div>
      </div>
    </div>
  );
}
