import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
          // Variants
          variant === 'default' && "bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:shadow-primary/20 hover:shadow-md",
          variant === 'secondary' && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          variant === 'outline' && "border border-border bg-transparent hover:bg-muted/30 text-foreground",
          variant === 'destructive' && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          variant === 'ghost' && "bg-transparent hover:bg-muted/30 text-foreground",
          variant === 'link' && "underline-offset-4 hover:underline text-primary",
          // Sizes
          size === 'default' && "h-10 py-2 px-4",
          size === 'sm' && "h-9 px-3 rounded-md text-xs",
          size === 'lg' && "h-11 px-8 rounded-md",
          size === 'icon' && "h-10 w-10 p-0",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
