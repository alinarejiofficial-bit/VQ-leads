import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Commission, type User } from '../../api';
import { Button } from '../../components/forms/Button';
import { Card } from '../../components/common/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/datatable/Table';
import { DollarSign, Sliders, TrendingUp, CheckCircle } from 'lucide-react';

interface CommissionsProps {
  user: User;
}

export const Commissions: React.FC<CommissionsProps> = ({ user }) => {
  const queryClient = useQueryClient();
  const isAdmin = user.profile.role === 'ADMIN';

  // React Queries
  const { data: commissions = [] } = useQuery<Commission[]>({
    queryKey: ['commissions'],
    queryFn: api.getCommissions,
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: api.approveCommission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  });

  const payMutation = useMutation({
    mutationFn: api.payCommission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: api.rejectCommission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    }
  });

  const handleApprove = (id: number) => {
    approveMutation.mutate(id);
  };

  const handlePay = (id: number) => {
    payMutation.mutate(id);
  };

  const handleReject = (id: number) => {
    if (!window.confirm('Reject this commission transaction?')) return;
    rejectMutation.mutate(id);
  };

  const totalEarned = commissions
    .filter(c => ['APPROVED', 'PAID'].includes(c.status))
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const totalPending = commissions
    .filter(c => c.status === 'PENDING')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Cards stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center justify-between p-6">
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Commissions Earned</span>
            <span className="text-3xl font-bold mt-2 text-foreground">${totalEarned.toFixed(2)}</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center">
            <DollarSign size={22} />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-6">
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Awaiting Admin Approval</span>
            <span className="text-3xl font-bold mt-2 text-foreground">${totalPending.toFixed(2)}</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Sliders size={22} />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-6">
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Personal Rate</span>
            <span className="text-3xl font-bold mt-2 text-foreground">{user.profile.commission_rate}%</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
            <TrendingUp size={22} />
          </div>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent cursor-default">
              <TableHead>Lead Account</TableHead>
              <TableHead>Lead Deal Size</TableHead>
              <TableHead>Recipient Agent</TableHead>
              <TableHead>Commission Rate</TableHead>
              <TableHead>Payout Amount</TableHead>
              <TableHead>Transaction Status</TableHead>
              <TableHead>Admin Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commissions.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  No commission records logged.
                </TableCell>
              </TableRow>
            ) : (
              commissions.map(c => (
                <TableRow key={c.id} className="hover:bg-transparent cursor-default">
                  <TableCell className="font-semibold text-foreground">{c.lead_name}</TableCell>
                  <TableCell>${c.lead_value}</TableCell>
                  <TableCell>{c.agent_details.full_name}</TableCell>
                  <TableCell>{c.rate}%</TableCell>
                  <TableCell className="font-bold text-green-400">${c.amount}</TableCell>
                  <TableCell>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      c.status === 'PENDING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                      c.status === 'APPROVED' ? 'bg-primary/10 border-primary/20 text-primary-foreground' :
                      c.status === 'PAID' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                      'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      {c.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {isAdmin && c.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-xs bg-green-500/10 hover:bg-green-500/20 border-green-500/20 text-green-400" onClick={() => handleApprove(c.id)}>
                          Approve
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400" onClick={() => handleReject(c.id)}>
                          Reject
                        </Button>
                      </div>
                    )}
                    {isAdmin && c.status === 'APPROVED' && (
                      <Button size="sm" className="h-8 text-xs" onClick={() => handlePay(c.id)}>
                        Mark Paid
                      </Button>
                    )}
                    {c.status === 'PAID' && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle size={12} className="text-green-400" /> Disbursed
                      </span>
                    )}
                    {c.status === 'REJECTED' && (
                      <span className="text-xs text-red-400">Rejected</span>
                    )}
                    {!isAdmin && c.status === 'PENDING' && (
                      <span className="text-xs text-muted-foreground">Pending Review</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
export default Commissions;
