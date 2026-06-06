import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../forms/Button';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="w-full max-w-lg rounded-xl border border-border bg-[#0d0e15] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/10" 
            onClick={onClose}
          >
            <X size={16} />
          </Button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};
