import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1C1917]/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Dialog */}
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`relative w-full ${maxWidth} transform overflow-hidden rounded-2xl bg-white text-left shadow-[0_20px_60px_rgba(28,25,23,0.15)] border border-[#E8DFC8]`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#E8DFC8] px-6 py-4 bg-[#FDFBF7]">
                <h3 className="text-base font-serif font-bold text-[#1C1917] tracking-tight">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-[#6A645A] hover:bg-[#F6F3EE] hover:text-[#1C1917] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 bg-white text-[#1C1917]">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
