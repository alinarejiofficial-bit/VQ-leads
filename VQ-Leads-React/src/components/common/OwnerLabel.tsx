import React from 'react';

interface OwnerLabelProps {
  name?: string | null;
  ownerId?: number | null;
  className?: string;
}

export const OwnerLabel: React.FC<OwnerLabelProps> = ({ name, ownerId, className = '' }) => {
  const isUnassigned = !ownerId || !name || name === 'Unassigned';

  if (isUnassigned) {
    return (
      <span
        className={`inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 ${className}`}
      >
        Unassigned
      </span>
    );
  }

  return <span className={`text-foreground ${className}`}>{name}</span>;
};
