import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../forms/Button';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
  subtitle?: string;
}

const dialogSizes = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children, size = 'md', subtitle }) => {
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
        className={`w-full ${dialogSizes[size]} max-h-[92vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border px-6 py-4 shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/10" 
            onClick={onClose}
          >
            <X size={16} />
          </Button>
        </div>
        <div className="overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
};
