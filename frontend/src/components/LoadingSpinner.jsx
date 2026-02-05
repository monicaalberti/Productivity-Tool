import React from "react";
import { motion, useAnimation } from "framer-motion";

const LoadingSpinner = () => {
  const textVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "100vh",
        gap: "20px",
      }}
    >
      <motion.div
        style={{
          width: 60,
          height: 60,
          border: "8px solid #ccc",
          borderTop: "8px solid #0070f3",
          borderRadius: "50%",
        }}
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: 1,
          ease: "linear",
        }}
      />
      <motion.div
        style={{ fontSize: "24px", fontWeight: "bold" }}
        variants={textVariants}
        initial="hidden"
        animate="visible"
        transition={{
          repeat: Infinity,
          repeatType: "reverse",
          duration: 0.8,
          ease: "easeInOut",
        }}
      >
        Loading Summary...
      </motion.div>
    </div>
  );
};

export default LoadingSpinner;
