import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, TrendingUp, Phone, Target, Briefcase, IndianRupee } from 'lucide-react';
import { api, type TeamPerformanceData } from '../../api';
import { Card } from '../../components/common/Card';
import { BarChart } from '../../components/charts/CustomCharts';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/datatable/Table';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const formatRate = (val: number) => `${val}%`;

export const PerformanceTab: React.FC = () => {
  const { data, isLoading } = useQuery<TeamPerformanceData>({
    queryKey: ['team-performance'],
    queryFn: api.getTeamPerformance,
  });

  if (isLoading || !data) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground animate-pulse">
        Loading team performance...
      </div>
    );
  }

  const { members, totals, charts } = data;

  const summaryCards = [
    { label: 'Leads Claimed', value: totals.leadsClaimed, icon: Briefcase, color: 'text-blue-400' },
    { label: 'Calls Made', value: totals.calls, icon: Phone, color: 'text-violet-400' },
    { label: 'Conversions', value: totals.conversions, icon: Target, color: 'text-emerald-400' },
    { label: 'Revenue Generated', value: formatCurrency(totals.revenue), icon: IndianRupee, color: 'text-amber-400', isFormatted: true },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6 text-left">
        <h3 className="text-base font-semibold text-foreground">Team Performance</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Tracks how well each team member performs — leads claimed, calls logged, conversions, and revenue.
        </p>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(card => (
          <Card key={card.label} className="p-4 text-left">
            <div className="flex items-center gap-2 mb-2">
              <card.icon size={16} className={card.color} />
              <span className="text-xs text-muted-foreground font-medium">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {card.isFormatted ? card.value : card.value}
            </p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-border/40 text-left">
          <h3 className="text-base font-semibold text-foreground">Member Performance</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Individual agent metrics ranked by revenue</p>
        </div>
        {members.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No team members with performance data yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent cursor-default">
                <TableHead>Agent</TableHead>
                <TableHead className="text-right">Leads Claimed</TableHead>
                <TableHead className="text-right">Calls</TableHead>
                <TableHead className="text-right">Conversions</TableHead>
                <TableHead className="text-right">Conv. Rate</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member, idx) => (
                <TableRow key={member.agentId}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      {idx < 3 && member.conversions > 0 && (
                        <span
                          className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                            idx === 0 ? 'bg-amber-500 text-black' :
                              idx === 1 ? 'bg-slate-400 text-black' :
                                'bg-amber-700 text-white'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      )}
                      <div>
                        <p className="font-semibold text-foreground">{member.agent}</p>
                        <p className="text-[10px] text-muted-foreground">@{member.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{member.leadsClaimed}</TableCell>
                  <TableCell className="text-right tabular-nums">{member.calls}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-emerald-400">
                    {member.conversions}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatRate(member.conversionRate)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-amber-400">
                    {formatCurrency(member.revenue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1 text-left">
            <Trophy size={18} className="text-amber-400" />
            <h3 className="text-base font-semibold text-foreground">Top Performers</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-6 text-left">Ranked by conversions won</p>
          <BarChart data={charts.topPerformers} />
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1 text-left">
            <TrendingUp size={18} className="text-emerald-400" />
            <h3 className="text-base font-semibold text-foreground">Conversion Rate</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-6 text-left">Won leads as % of claimed leads</p>
          <BarChart data={charts.conversionRate.map(d => ({ ...d, value: Math.round(d.value * 10) / 10 }))} />
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1 text-left">
            <IndianRupee size={18} className="text-amber-400" />
            <h3 className="text-base font-semibold text-foreground">Revenue Generated</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-6 text-left">Total won deal value per agent</p>
          <BarChart data={charts.revenueGenerated} />
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1 text-left">
            <Phone size={18} className="text-violet-400" />
            <h3 className="text-base font-semibold text-foreground">Calls Made</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-6 text-left">Call logs recorded per agent</p>
          <BarChart data={charts.callsMade} />
        </Card>
      </div>
    </div>
  );
};
