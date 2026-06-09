import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, type User, type AgentDashboardData } from '../../api';
import { Card } from '../../components/common/Card';
import {
  Briefcase,
  Calendar,
  CheckSquare,
  DollarSign,
  Flame,
  Phone,
  AlertTriangle,
  Activity,
} from 'lucide-react';

interface AgentDashboardProps {
  user: User;
}

const priorityClass = (priority: string) => {
  if (priority === 'High') return 'bg-red-500/10 text-red-400 border-red-500/20';
  if (priority === 'Medium') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  return 'bg-muted/40 text-muted-foreground border-border/40';
};

export const AgentDashboard: React.FC<AgentDashboardProps> = ({ user }) => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<AgentDashboardData>({
    queryKey: ['agent-dashboard'],
    queryFn: api.getAgentDashboard,
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  if (isLoading || !data) {
    return (
      <div className="p-8 flex items-center justify-center h-[calc(100vh-70px)]">
        <div className="text-muted-foreground text-sm font-semibold animate-pulse">Loading your dashboard...</div>
      </div>
    );
  }

  const { summary, pipeline, monthlyPerformance, hotLeads, todaysFollowups, todaysTasks, recentActivities, overdueFollowups } = data;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="text-left">
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Welcome back, {user.first_name || user.full_name}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'My Leads', value: summary.myLeads, icon: Briefcase, color: 'text-primary bg-primary/10 border-primary/20' },
          { label: 'Follow-ups', value: summary.followups, icon: Calendar, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
          { label: 'Tasks Due', value: summary.tasksDue, icon: CheckSquare, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
          { label: 'Commission', value: formatCurrency(summary.commission), icon: DollarSign, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="p-5 flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{item.value}</p>
              </div>
              <div className={`h-11 w-11 rounded-xl border flex items-center justify-center ${item.color}`}>
                <Icon size={20} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Pipeline + Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 text-left">
          <h3 className="text-sm font-bold text-foreground mb-4">Lead Pipeline</h3>
          <div className="space-y-2.5">
            {pipeline.map(stage => (
              <div key={stage.label} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                <span className="text-sm text-muted-foreground">{stage.label}</span>
                <span className="text-sm font-bold text-foreground tabular-nums">{stage.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 text-left">
          <h3 className="text-sm font-bold text-foreground mb-4">Monthly Performance</h3>
          <div className="space-y-2.5">
            {[
              { label: 'Calls Made', value: monthlyPerformance.callsMade },
              { label: 'Conversions', value: monthlyPerformance.conversions },
              { label: 'Revenue', value: formatCurrency(monthlyPerformance.revenue) },
              { label: 'Conversion %', value: `${monthlyPerformance.conversionRate}%` },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className="text-sm font-bold text-foreground">{row.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Hot Leads */}
      <Card className="overflow-hidden text-left">
        <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
          <Flame size={16} className="text-orange-400" />
          <h3 className="text-sm font-bold text-foreground">Hot Leads</h3>
        </div>
        {hotLeads.length === 0 ? (
          <p className="text-sm text-muted-foreground p-5">No active hot leads right now.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="text-left font-semibold px-5 py-3">Name</th>
                  <th className="text-left font-semibold px-5 py-3">Source</th>
                  <th className="text-left font-semibold px-5 py-3">Priority</th>
                  <th className="text-left font-semibold px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {hotLeads.map(lead => (
                  <tr
                    key={lead.id}
                    className="border-b border-border/20 hover:bg-muted/20 cursor-pointer transition-colors"
                    onClick={() => navigate('/leads')}
                  >
                    <td className="px-5 py-3 font-semibold text-foreground">{lead.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{lead.source}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${priorityClass(lead.priority)}`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-foreground">{lead.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Follow-ups */}
        <Card className="text-left">
          <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
            <Calendar size={16} className="text-blue-400" />
            <h3 className="text-sm font-bold text-foreground">Today&apos;s Follow-ups</h3>
          </div>
          <div className="p-4 space-y-2">
            {todaysFollowups.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No follow-ups scheduled for today.</p>
            ) : (
              todaysFollowups.map(f => (
                <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-muted/10">
                  <span className="text-xs font-bold text-primary whitespace-nowrap mt-0.5">{f.time}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{f.leadName}</p>
                    <p className="text-xs text-muted-foreground truncate">{f.notes}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Today's Tasks */}
        <Card className="text-left">
          <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
            <CheckSquare size={16} className="text-green-400" />
            <h3 className="text-sm font-bold text-foreground">Today&apos;s Tasks</h3>
          </div>
          <div className="p-4 space-y-2">
            {todaysTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No pending tasks.</p>
            ) : (
              todaysTasks.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
                  <span className="text-sm font-medium text-foreground">{t.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ml-2 ${priorityClass(t.priority)}`}>
                    {t.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activities */}
        <Card className="text-left">
          <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
            <Activity size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">Recent Activities</h3>
          </div>
          <div className="p-4 space-y-2">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent activity.</p>
            ) : (
              recentActivities.map(a => (
                <div key={a.id} className="flex items-start gap-3 py-2 border-b border-border/20 last:border-0">
                  <Phone size={13} className="text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-muted-foreground">{a.time}</span>
                    <p className="text-sm text-foreground">{a.label}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Overdue Follow-ups */}
        <Card className="text-left">
          <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400" />
            <h3 className="text-sm font-bold text-foreground">
              Overdue Follow-ups {overdueFollowups.length > 0 && `(${overdueFollowups.length})`}
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {overdueFollowups.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">You&apos;re all caught up!</p>
            ) : (
              overdueFollowups.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                  <span className="text-sm font-semibold text-foreground">{f.leadName}</span>
                  <span className="text-xs font-bold text-red-400">{f.overdueLabel}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
