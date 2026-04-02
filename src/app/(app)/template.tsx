'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        duration: 0.6, 
        ease: [0.16, 1, 0.3, 1], // Custom cubic-bezier for premium feel
        staggerChildren: 0.1
      }}
      className="flex-1 w-full"
    >
      {children}
    </motion.div>
  );
}
