import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Typography } from '@mui/material';
import { AlertTriangle, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#F6F3EE] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center bg-white p-8 rounded-2xl border border-[#E8DFC8] shadow-[0_20px_50px_rgba(28,25,23,0.08)]"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 bg-[#B87B28]/10 text-[#B87B28] rounded-2xl mb-4 border border-[#B87B28]/30">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <Typography variant="h2" className="!font-serif !font-bold !text-[#1C1917]">
          404
        </Typography>
        <Typography variant="h6" className="text-[#1C1917] mt-2 font-semibold font-serif">
          Archival Record Not Found
        </Typography>
        <Typography variant="body2" className="text-[#6A645A] mt-1 mb-6 text-xs">
          The requested page or route does not exist in the Library Management System.
        </Typography>
        <Button
          component={Link}
          to="/"
          variant="contained"
          startIcon={<Home className="w-4 h-4" />}
          className="!font-semibold !rounded-xl !bg-[#1C1917] hover:!bg-[#292524] !text-[#FAF6F0]"
        >
          Return to Dashboard
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFound;
