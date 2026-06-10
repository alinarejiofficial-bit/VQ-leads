import React from 'react';
import { type Lead } from '../../../api';
import { LeadPipelineCard } from './LeadPipelineCard';
import { Briefcase } from 'lucide-react';

interface MyLeadsPipelineProps {
  leads: Lead[];
  onStatusChange: (leadId: number, status: string) => void;
  onEdit: (leadId: number) => void;
  isUpdating?: boolean;
}

export const MyLeadsPipeline: React.FC<MyLeadsPipelineProps> = ({
  leads,
  onStatusChange,
  onEdit,
  isUpdating = false,
}) => {
  if (leads.length === 0) return null;

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center gap-2">
        <Briefcase size={18} className="text-amber-600" />
        <h3 className="text-base font-bold text-foreground">
          My Leads Pipeline ({leads.length})
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {leads.map(lead => (
          <LeadPipelineCard
            key={lead.id}
            lead={lead}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
            isUpdating={isUpdating}
          />
        ))}
      </div>
    </div>
  );
};
