import React from 'react';
import { type Lead } from '../../../api';
import { Button } from '../../../components/forms/Button';
import { Phone, ThumbsUp, ThumbsDown, Trophy, X, Pencil } from 'lucide-react';

interface LeadPipelineCardProps {
  lead: Lead;
  onStatusChange: (leadId: number, status: string) => void;
  onEdit: (leadId: number) => void;
  isUpdating?: boolean;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  NEW: { label: 'Pipeline', className: 'bg-orange-500/10 text-orange-400 border-orange-500/25' },
  CONTACTED: { label: 'Contacted', className: 'bg-purple-500/10 text-purple-400 border-purple-500/25' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-amber-500/10 text-amber-400 border-amber-500/25' },
  QUALIFIED: { label: 'Interested', className: 'bg-blue-500/10 text-blue-400 border-blue-500/25' },
};

export const LeadPipelineCard: React.FC<LeadPipelineCardProps> = ({
  lead,
  onStatusChange,
  onEdit,
  isUpdating = false,
}) => {
  const badge = STATUS_BADGE[lead.status] || STATUS_BADGE.NEW;
  const subtitle = `${lead.company || lead.source || 'N/A'} • $${lead.value}`;

  const actionBtn = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold border transition-all ${
      active
        ? 'bg-primary/15 border-primary/40 text-primary'
        : 'bg-muted/30 border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
    }`;

  return (
    <div className="bg-card border border-border/80 rounded-xl p-4 text-left shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h4 className="text-base font-bold text-foreground truncate">{lead.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase shrink-0 ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      <div className="flex gap-2 mb-2">
        <button
          type="button"
          disabled={isUpdating}
          className={actionBtn(lead.status === 'CONTACTED')}
          onClick={() => onStatusChange(lead.id, 'CONTACTED')}
        >
          <Phone size={13} className="text-pink-400" /> Contacted
        </button>
        <button
          type="button"
          disabled={isUpdating}
          className={actionBtn(lead.status === 'QUALIFIED')}
          onClick={() => onStatusChange(lead.id, 'QUALIFIED')}
        >
          <ThumbsUp size={13} className="text-amber-400" /> Interested
        </button>
        <button
          type="button"
          disabled={isUpdating}
          className={actionBtn(lead.status === 'LOST')}
          onClick={() => onStatusChange(lead.id, 'LOST')}
        >
          <ThumbsDown size={13} className="text-amber-500" /> Not Interested
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          disabled={isUpdating}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all"
          onClick={() => onStatusChange(lead.id, 'WON')}
        >
          <Trophy size={14} /> Convert
        </button>
        <button
          type="button"
          disabled={isUpdating}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
          onClick={() => onStatusChange(lead.id, 'LOST')}
        >
          <X size={14} /> Drop
        </button>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full h-10 text-sm font-semibold border-border/80 hover:bg-muted/30"
        onClick={() => onEdit(lead.id)}
      >
        <Pencil size={14} className="mr-2 text-orange-400" /> Edit Notes &amp; Logs
      </Button>
    </div>
  );
};
