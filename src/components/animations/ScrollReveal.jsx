import React from "react";
import { motion } from "framer-motion";

const animations = {
    fadeInUp: {
        hidden: { opacity: 0, y: 60 },
        visible: { opacity: 1, y: 0 }
    },
    fadeInDown: {
        hidden: { opacity: 0, y: -60 },
        visible: { opacity: 1, y: 0 }
    },
    fadeInLeft: {
        hidden: { opacity: 0, x: -60 },
        visible: { opacity: 1, x: 0 }
    },
    fadeInRight: {
        hidden: { opacity: 0, x: 60 },
        visible: { opacity: 1, x: 0 }
    },
    fadeIn: {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    },
    scaleUp: {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1 }
    },
    slideInUp: {
        hidden: { opacity: 0, y: 100 },
        visible: { opacity: 1, y: 0 }
    }
};

const ScrollReveal = ({ 
    children, 
    animation = "fadeInUp", 
    delay = 0, 
    duration = 0.6,
    className = "",
    style = {},
    once = true,
    threshold = 0.1
}) => {
    const selectedAnimation = animations[animation] || animations.fadeInUp;

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once, amount: threshold }}
            variants={selectedAnimation}
            transition={{ 
                duration, 
                delay,
                ease: [0.25, 0.1, 0.25, 1]
            }}
            className={className}
            style={style}
        >
            {children}
        </motion.div>
    );
};

export const StaggerContainer = ({ 
    children, 
    className = "", 
    staggerDelay = 0.1,
    style = {} 
}) => {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: staggerDelay
                    }
                }
            }}
            className={className}
            style={style}
        >
            {children}
        </motion.div>
    );
};

export const StaggerItem = ({ 
    children, 
    animation = "fadeInUp",
    className = "",
    style = {}
}) => {
    const selectedAnimation = animations[animation] || animations.fadeInUp;

    return (
        <motion.div
            variants={selectedAnimation}
            transition={{ 
                duration: 0.5,
                ease: [0.25, 0.1, 0.25, 1]
            }}
            className={className}
            style={style}
        >
            {children}
        </motion.div>
    );
};

export default ScrollReveal;
