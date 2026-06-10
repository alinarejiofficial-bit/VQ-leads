import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Percent, Calculator, Pencil, RotateCcw, CircleDollarSign } from 'lucide-react';
import { api, type CommissionSettings, type Commission, type User } from '../../api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/forms/Button';
import { Input } from '../../components/forms/Input';
import { Dialog } from '../../components/common/Dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/datatable/Table';

const STATUS_META: { id: Commission['status']; label: string; badge: string; description: string }[] = [
  { id: 'PENDING', label: 'Pending', badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400', description: 'Auto-calculated when a lead is won, awaiting review' },
  { id: 'APPROVED', label: 'Approved', badge: 'bg-primary/10 border-primary/20 text-primary', description: 'Reviewed and approved, awaiting payout' },
  { id: 'PAID', label: 'Paid', badge: 'bg-green-500/10 border-green-500/20 text-green-400', description: 'Payout disbursed to the agent' },
  { id: 'REJECTED', label: 'Rejected', badge: 'bg-red-500/10 border-red-500/20 text-red-400', description: 'Commission declined by an admin or leader' },
];

interface CommissionTabProps {
  members: User[];
}

export const CommissionTab: React.FC<CommissionTabProps> = ({ members }) => {
  const queryClient = useQueryClient();

  const [isEditingGlobal, setIsEditingGlobal] = useState(false);
  const [globalRateInput, setGlobalRateInput] = useState('');

  const [rateMember, setRateMember] = useState<User | null>(null);
  const [memberRateInput, setMemberRateInput] = useState('');

  const { data: settings } = useQuery<CommissionSettings>({
    queryKey: ['commission-settings'],
    queryFn: api.getCommissionSettings,
  });

  const { data: commissions = [] } = useQuery<Commission[]>({
    queryKey: ['commissions'],
    queryFn: api.getCommissions,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['commission-settings'] });
    queryClient.invalidateQueries({ queryKey: ['agents'] });
  };

  const updateGlobalMutation = useMutation({
    mutationFn: api.updateCommissionSettings,
    onSuccess: () => {
      invalidate();
      setIsEditingGlobal(false);
    },
    onError: (err: Error) => alert(err.message || 'Failed to update global rate'),
  });

  const updateMemberRateMutation = useMutation({
    mutationFn: ({ id, rate }: { id: number; rate: string }) =>
      api.updateAgent(id, { commission_rate: rate }),
    onSuccess: () => {
      invalidate();
      setRateMember(null);
    },
    onError: (err: Error) => alert(err.message || 'Failed to update member rate'),
  });

  const globalRate = settings ? Number(settings.globalRate) : 2;

  const handleSaveGlobal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalRateInput) return;
    updateGlobalMutation.mutate(globalRateInput);
  };

  const handleSaveMemberRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateMember) return;
    updateMemberRateMutation.mutate({ id: rateMember.id, rate: memberRateInput });
  };

  const handleResetToGlobal = (member: User) => {
    if (!window.confirm(`Reset ${member.full_name} to the global rate (${globalRate}%)?`)) return;
    updateMemberRateMutation.mutate({ id: member.id, rate: '' });
  };

  const statusTotals = STATUS_META.map(meta => {
    const matching = commissions.filter(c => c.status === meta.id);
    return {
      ...meta,
      count: matching.length,
      amount: matching.reduce((sum, c) => sum + Number(c.amount), 0),
    };
  });

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 text-left">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
                <Percent size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Global Commission</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Default rate applied to every agent</p>
              </div>
            </div>
            {!isEditingGlobal && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs"
                onClick={() => {
                  setGlobalRateInput(settings?.globalRate ?? '2.00');
                  setIsEditingGlobal(true);
                }}
              >
                <Pencil size={13} className="mr-1" /> Edit
              </Button>
            )}
          </div>

          {isEditingGlobal ? (
            <form onSubmit={handleSaveGlobal} className="mt-5 flex items-end gap-3">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-semibold text-foreground">Global Rate (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={globalRateInput}
                  onChange={e => setGlobalRateInput(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={updateGlobalMutation.isPending}>
                {updateGlobalMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditingGlobal(false)}>Cancel</Button>
            </form>
          ) : (
            <div className="mt-5">
              <span className="text-4xl font-bold text-foreground tabular-nums">{globalRate}%</span>
              <p className="text-xs text-muted-foreground mt-2">
                Used for every agent without a user-specific rate. Default: 2%.
              </p>
            </div>
          )}
        </Card>

        <Card className="p-6 text-left">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Calculator size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Formula</h3>
              <p className="text-xs text-muted-foreground mt-0.5">How payouts are calculated on won leads</p>
            </div>
          </div>
          <div className="mt-5 p-4 rounded-lg bg-muted/20 border border-border/40 font-mono text-sm text-foreground">
            Commission = Lead Value × Commission Percentage
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Example: a ₹1,00,000 lead at {globalRate}% earns the agent ₹{(100000 * globalRate / 100).toLocaleString('en-IN')}.
            The user-specific rate is used when set; otherwise the global rate applies.
          </p>
        </Card>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statusTotals.map(s => (
          <Card key={s.id} className="p-4 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${s.badge}`}>
                {s.label}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">{s.count}</span>
            </div>
            <p className="text-xl font-bold text-foreground tabular-nums">
              ${s.amount.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">{s.description}</p>
          </Card>
        ))}
      </div>

      {/* Member rates */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-border/40 text-left flex items-center gap-3">
          <CircleDollarSign size={18} className="text-green-400" />
          <div>
            <h3 className="text-base font-semibold text-foreground">Member Commission Rates</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Set a user-specific rate or let members follow the global rate
            </p>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent cursor-default">
              <TableHead>Member</TableHead>
              <TableHead>Rate Type</TableHead>
              <TableHead className="text-right">Effective Rate</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                  No team members yet.
                </TableCell>
              </TableRow>
            ) : (
              members.map(member => {
                const hasOverride = member.profile.commission_rate !== null && member.profile.commission_rate !== undefined;
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <p className="font-semibold text-foreground">{member.full_name}</p>
                      <p className="text-[10px] text-muted-foreground">@{member.username}</p>
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        hasOverride
                          ? 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                          : 'bg-muted/40 border-border/55 text-muted-foreground'
                      }`}>
                        {hasOverride ? 'User-specific' : 'Global'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-foreground tabular-nums">
                      {Number(member.profile.effective_commission_rate ?? globalRate)}%
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs"
                          onClick={() => {
                            setRateMember(member);
                            setMemberRateInput(member.profile.commission_rate ?? String(globalRate));
                          }}
                        >
                          <Pencil size={13} className="mr-1" /> Set Rate
                        </Button>
                        {hasOverride && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs"
                            onClick={() => handleResetToGlobal(member)}
                            title="Reset to global rate"
                          >
                            <RotateCcw size={13} className="mr-1" /> Use Global
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Set member rate modal */}
      <Dialog isOpen={!!rateMember} onClose={() => setRateMember(null)} title="Set User-specific Commission">
        <form onSubmit={handleSaveMemberRate} className="space-y-4">
          <p className="text-sm text-muted-foreground text-left">
            Set a commission rate for <span className="font-semibold text-foreground">{rateMember?.full_name}</span>.
            This overrides the global rate of {globalRate}%.
          </p>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">Commission Rate (%)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={memberRateInput}
              onChange={e => setMemberRateInput(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
            <Button type="button" variant="outline" onClick={() => setRateMember(null)}>Cancel</Button>
            <Button type="submit" disabled={updateMemberRateMutation.isPending}>
              {updateMemberRateMutation.isPending ? 'Saving...' : 'Save Rate'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
