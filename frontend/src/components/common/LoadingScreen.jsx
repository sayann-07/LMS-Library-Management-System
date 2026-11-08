import React from 'react';
import { BookOpen } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-[#1C1917]">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C88E3E] to-[#A3691A] flex items-center justify-center text-white shadow-md animate-pulse mb-3">
        <BookOpen className="w-6 h-6 stroke-[2.2]" />
      </div>
      <p className="font-serif font-bold text-sm text-[#1C1917] tracking-tight">
        Library Management System
      </p>
      <p className="text-xs text-[#524C42] mt-1 font-mono">
        Loading view...
      </p>
    </div>
  );
};

export default LoadingScreen;

