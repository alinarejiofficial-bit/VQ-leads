import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  api,
  type CommissionReportsData,
  type ConversionReportsData,
  type LeadReportsData,
  type ReportsFilters,
  type ReportsWidgets,
  type SourceReportsData,
  type TeamReportsData,
  type User,
} from '../../api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/forms/Button';
import { Input } from '../../components/forms/Input';
import { BarChart, DonutChart, LineChart } from '../../components/charts/CustomCharts';
import {
  Download, Filter, TrendingUp,
  Users, DollarSign, PieChart, Trophy,
} from 'lucide-react';

type ReportTab = 'leads' | 'conversions' | 'sources' | 'team' | 'commissions';

type QuickFilter = 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_QUARTER' | 'THIS_YEAR' | 'CUSTOM';

const quickOptions: { id: QuickFilter; label: string }[] = [
  { id: 'TODAY', label: 'Today' },
  { id: 'YESTERDAY', label: 'Yesterday' },
  { id: 'THIS_WEEK', label: 'This Week' },
  { id: 'THIS_MONTH', label: 'This Month' },
  { id: 'THIS_QUARTER', label: 'This Quarter' },
  { id: 'THIS_YEAR', label: 'This Year' },
  { id: 'CUSTOM', label: 'Custom Range' },
];

function toFilters(state: {
  quickFilter: QuickFilter;
  dateFrom: string;
  dateTo: string;
  leadStatus: string;
  leadSource: string;
  teamMember: string;
  agent: string;
  campaign: string;
  region: string;
}): ReportsFilters {
  return {
    quickFilter: state.quickFilter,
    dateFrom: state.dateFrom || undefined,
    dateTo: state.dateTo || undefined,
    leadStatus: state.leadStatus || undefined,
    leadSource: state.leadSource || undefined,
    teamMember: state.teamMember || undefined,
    agent: state.agent || undefined,
    campaign: state.campaign || undefined,
    region: state.region || undefined,
  };
}

const currency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);

function FunnelChart({ rows }: { rows: { stage: string; count: number }[] }) {
  if (!rows.length) return <div className="text-center text-xs text-muted-foreground py-10">No funnel data</div>;
  const max = Math.max(...rows.map(r => r.count), 1);
  return (
    <div className="space-y-2">
      {rows.map((r, idx) => (
        <div key={r.stage + idx} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">{r.stage}</span>
            <span className="text-muted-foreground">{r.count}</span>
          </div>
          <div className="h-6 rounded-lg bg-muted/30 border border-border/40 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-blue-500"
              style={{ width: `${Math.max(4, (r.count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export const Reports: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const tab = (searchParams.get('tab') || 'leads') as ReportTab;

  const [filters, setFilters] = useState({
    quickFilter: 'THIS_MONTH' as QuickFilter,
    dateFrom: '',
    dateTo: '',
    leadStatus: '',
    leadSource: '',
    teamMember: '',
    agent: '',
    campaign: '',
    region: '',
  });
  const [exportLoading, setExportLoading] = useState<'csv' | 'xlsx' | 'pdf' | ''>('');

  const activeFilters = useMemo(() => toFilters(filters), [filters]);

  const { data: agents = [] } = useQuery<User[]>({
    queryKey: ['agents'],
    queryFn: api.getAgents,
  });

  const { data: widgets } = useQuery<ReportsWidgets>({
    queryKey: ['reports-widgets', activeFilters],
    queryFn: () => api.getReportsWidgets(activeFilters),
  });

  const { data: leadData, isLoading: leadLoading } = useQuery<LeadReportsData>({
    queryKey: ['reports-lead', activeFilters],
    queryFn: () => api.getLeadReports(activeFilters),
    enabled: tab === 'leads',
  });

  const { data: conversionData, isLoading: convLoading } = useQuery<ConversionReportsData>({
    queryKey: ['reports-conversion', activeFilters],
    queryFn: () => api.getConversionReports(activeFilters),
    enabled: tab === 'conversions',
  });

  const { data: sourceData, isLoading: sourceLoading } = useQuery<SourceReportsData>({
    queryKey: ['reports-source', activeFilters],
    queryFn: () => api.getSourceReports(activeFilters),
    enabled: tab === 'sources',
  });

  const { data: teamData, isLoading: teamLoading } = useQuery<TeamReportsData>({
    queryKey: ['reports-team', activeFilters],
    queryFn: () => api.getTeamReports(activeFilters),
    enabled: tab === 'team',
  });

  const { data: commissionData, isLoading: commissionLoading } = useQuery<CommissionReportsData>({
    queryKey: ['reports-commission', activeFilters],
    queryFn: () => api.getCommissionReports(activeFilters),
    enabled: tab === 'commissions',
  });

  const busy = leadLoading || convLoading || sourceLoading || teamLoading || commissionLoading;

  const set = (key: keyof typeof filters, value: string) => setFilters(prev => ({ ...prev, [key]: value }));

  const exportReport = async (fmt: 'csv' | 'xlsx' | 'pdf') => {
    try {
      setExportLoading(fmt);
      const reportType = tab === 'leads' ? 'lead' : tab === 'conversions' ? 'conversion' : tab === 'sources' ? 'source' : tab === 'team' ? 'team' : 'commission';
      const blob = await api.exportReport(reportType, fmt, activeFilters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report.${fmt}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message || 'Failed to export report');
    } finally {
      setExportLoading('');
    }
  };

  const topCards = [
    { label: 'Total Leads', value: widgets?.totalLeads ?? 0, icon: Users, cls: 'text-primary bg-primary/10 border-primary/20' },
    { label: 'Pipeline Value', value: currency(widgets?.pipelineValue ?? 0), icon: DollarSign, cls: 'text-green-400 bg-green-500/10 border-green-500/20' },
    { label: 'Conversion Rate', value: `${widgets?.conversionRate ?? 0}%`, icon: TrendingUp, cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { label: 'Revenue Generated', value: currency(widgets?.revenueGenerated ?? 0), icon: Trophy, cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { label: 'Top Lead Source', value: widgets?.topLeadSource ?? 'N/A', icon: PieChart, cls: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  ];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex gap-4 overflow-x-auto">
          {[
            { id: 'leads', label: 'Lead Reports' },
            { id: 'conversions', label: 'Conversion Reports' },
            { id: 'sources', label: 'Source Reports' },
            { id: 'team', label: 'Team Reports' },
            { id: 'commissions', label: 'Commission Reports' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => navigate(`/reports?tab=${t.id}`)}
              className={`pb-4 -mb-4 px-2 text-sm font-medium whitespace-nowrap ${tab === t.id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => exportReport('csv')} disabled={!!exportLoading}>
            <Download size={13} className="mr-1" /> {exportLoading === 'csv' ? 'Exporting...' : 'CSV'}
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => exportReport('xlsx')} disabled={!!exportLoading}>
            <Download size={13} className="mr-1" /> {exportLoading === 'xlsx' ? 'Exporting...' : 'Excel'}
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => exportReport('pdf')} disabled={!!exportLoading}>
            <Download size={13} className="mr-1" /> {exportLoading === 'pdf' ? 'Exporting...' : 'PDF'}
          </Button>
        </div>
      </div>

      {/* filters */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-primary" />
          <p className="text-xs font-bold uppercase tracking-wider text-foreground">Filters</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <select className="h-10 rounded-md border border-input bg-muted/20 px-3 text-xs" value={filters.quickFilter} onChange={e => set('quickFilter', e.target.value)}>
            {quickOptions.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}
          </select>
          <Input type="date" value={filters.dateFrom} onChange={e => set('dateFrom', e.target.value)} className="h-10" />
          <Input type="date" value={filters.dateTo} onChange={e => set('dateTo', e.target.value)} className="h-10" />
          <Input placeholder="Lead Status" value={filters.leadStatus} onChange={e => set('leadStatus', e.target.value)} className="h-10" />
          <Input placeholder="Lead Source" value={filters.leadSource} onChange={e => set('leadSource', e.target.value)} className="h-10" />
          <select className="h-10 rounded-md border border-input bg-muted/20 px-3 text-xs" value={filters.agent} onChange={e => set('agent', e.target.value)}>
            <option value="">All Agents</option>
            {agents.map(a => <option key={a.id} value={String(a.id)}>{a.full_name}</option>)}
          </select>
          <Input placeholder="Campaign" value={filters.campaign} onChange={e => set('campaign', e.target.value)} className="h-10" />
          <Input placeholder="Region" value={filters.region} onChange={e => set('region', e.target.value)} className="h-10" />
        </div>
      </Card>

      {/* widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {topCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Card key={i} className="p-4 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{c.label}</p>
                <p className="text-lg font-bold text-foreground mt-1 truncate">{c.value}</p>
              </div>
              <div className={`h-9 w-9 rounded-lg border flex items-center justify-center ${c.cls}`}>
                <Icon size={16} />
              </div>
            </Card>
          );
        })}
      </div>

      {busy && <div className="text-center text-xs text-muted-foreground animate-pulse py-10">Loading reports...</div>}

      {/* leads */}
      {!busy && tab === 'leads' && leadData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Lead Status Pie Chart</h3>
              <DonutChart data={Object.entries(leadData.statusBreakdown).map(([k, v], i) => ({ label: k, value: v, color: ['#3b82f6','#22c55e','#a855f7','#f59e0b','#ef4444','#14b8a6','#eab308'][i % 7] }))} />
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Lead Growth Line Chart</h3>
              <LineChart data={leadData.growthTrend.map(d => ({ date: d.date, count: d.count }))} />
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Pipeline Funnel Chart</h3>
            <FunnelChart rows={leadData.pipelineFunnel} />
          </Card>

          <Card className="p-5 overflow-auto">
            <h3 className="text-sm font-semibold text-foreground mb-3">Lead Aging Report</h3>
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border/40"><th className="py-2 text-left">Lead</th><th className="py-2 text-left">Status</th><th className="py-2 text-left">Owner</th><th className="py-2 text-left">Source</th><th className="py-2 text-left">Age (days)</th></tr></thead>
              <tbody>
                {leadData.leadAging.slice(0, 20).map((r, i) => (
                  <tr key={i} className="border-b border-border/20"><td className="py-2">{r.leadName}</td><td>{r.status}</td><td>{r.owner}</td><td>{r.source}</td><td>{r.ageDays}</td></tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* conversions */}
      {!busy && tab === 'conversions' && conversionData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="p-4"><p className="text-[10px] uppercase text-muted-foreground">Total Leads</p><p className="text-xl font-bold">{conversionData.metrics.totalLeads}</p></Card>
            <Card className="p-4"><p className="text-[10px] uppercase text-muted-foreground">Converted</p><p className="text-xl font-bold text-green-400">{conversionData.metrics.convertedLeads}</p></Card>
            <Card className="p-4"><p className="text-[10px] uppercase text-muted-foreground">Conversion Rate</p><p className="text-xl font-bold text-primary">{conversionData.metrics.conversionRate}%</p></Card>
            <Card className="p-4"><p className="text-[10px] uppercase text-muted-foreground">Lost</p><p className="text-xl font-bold text-red-400">{conversionData.metrics.lostLeads}</p></Card>
            <Card className="p-4"><p className="text-[10px] uppercase text-muted-foreground">Avg Conversion Time</p><p className="text-xl font-bold">{conversionData.metrics.avgConversionTimeDays}d</p></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5"><h3 className="text-sm font-semibold mb-3">Conversion Funnel</h3><FunnelChart rows={conversionData.funnel} /></Card>
            <Card className="p-5"><h3 className="text-sm font-semibold mb-3">Monthly Conversion Trends</h3><BarChart data={conversionData.monthlyTrend.map(m => ({ label: m.month, value: m.converted, color: '#3b82f6' }))} /></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5"><h3 className="text-sm font-semibold mb-3">Conversion by Agent</h3><BarChart data={conversionData.conversionByAgent.map(r => ({ label: r.agent, value: r.converted, color: '#10b981' }))} /></Card>
            <Card className="p-5"><h3 className="text-sm font-semibold mb-3">Conversion by Lead Source</h3><DonutChart data={conversionData.conversionBySource.map((r, i) => ({ label: r.source, value: r.converted, color: ['#3b82f6','#10b981','#f59e0b','#a855f7','#ef4444','#06b6d4'][i % 6] }))} /></Card>
          </div>
        </div>
      )}

      {/* sources */}
      {!busy && tab === 'sources' && sourceData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-5 lg:col-span-2"><h3 className="text-sm font-semibold mb-3">Source Comparison Bar Chart</h3><BarChart data={sourceData.sourceComparison.map(r => ({ label: r.label, value: r.value, color: '#3b82f6' }))} /></Card>
            <Card className="p-5"><h3 className="text-sm font-semibold mb-3">Source Distribution Pie Chart</h3><DonutChart data={sourceData.sourceDistribution.map((r, i) => ({ label: r.label, value: r.value, color: ['#3b82f6','#10b981','#f59e0b','#a855f7','#ef4444','#06b6d4'][i % 6] }))} /></Card>
          </div>
          <Card className="p-5"><h3 className="text-sm font-semibold mb-3">Revenue by Source</h3><BarChart data={sourceData.revenueBySource.map(r => ({ label: r.label, value: r.value, color: '#10b981' }))} /></Card>
          <Card className="p-5 overflow-auto">
            <h3 className="text-sm font-semibold mb-3">Source Performance Table</h3>
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border/40"><th className="py-2 text-left">Source</th><th className="text-left">Leads Generated</th><th className="text-left">Converted</th><th className="text-left">Conversion Rate</th><th className="text-left">Revenue</th></tr></thead>
              <tbody>
                {sourceData.table.map((r, i) => (
                  <tr key={i} className="border-b border-border/20"><td className="py-2">{r.source}</td><td>{r.leadsGenerated}</td><td>{r.convertedLeads}</td><td>{r.conversionRate}%</td><td>{currency(r.revenueGenerated)}</td></tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* team */}
      {!busy && tab === 'team' && teamData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-5"><h3 className="text-sm font-semibold mb-3">Team Leaderboard</h3><BarChart data={teamData.leaderboard.map(r => ({ label: r.label, value: r.value, color: '#f59e0b' }))} /></Card>
            <Card className="p-5"><h3 className="text-sm font-semibold mb-3">Agent Comparison Chart</h3><BarChart data={teamData.agentComparison.map(r => ({ label: r.label, value: r.value, color: '#3b82f6' }))} /></Card>
            <Card className="p-5"><h3 className="text-sm font-semibold mb-3">Revenue by Agent</h3><BarChart data={teamData.revenueByAgent.map(r => ({ label: r.label, value: r.value, color: '#10b981' }))} /></Card>
          </div>
          <Card className="p-5 overflow-auto">
            <h3 className="text-sm font-semibold mb-3">Agent Performance Table</h3>
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border/40"><th className="py-2 text-left">Agent</th><th className="text-left">Assigned</th><th className="text-left">Conversion %</th><th className="text-left">Won</th><th className="text-left">Revenue</th><th className="text-left">Activities</th></tr></thead>
              <tbody>
                {teamData.table.map((r, i) => (
                  <tr key={i} className="border-b border-border/20"><td className="py-2">{r.agentName}</td><td>{r.assignedLeads}</td><td>{r.conversionRate}%</td><td>{r.wonDeals}</td><td>{currency(r.revenueGenerated)}</td><td>{r.activitiesCompleted}</td></tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* commission */}
      {!busy && tab === 'commissions' && commissionData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4"><p className="text-[10px] uppercase text-muted-foreground">Total Sales</p><p className="text-xl font-bold">{currency(commissionData.metrics.totalSales)}</p></Card>
            <Card className="p-4"><p className="text-[10px] uppercase text-muted-foreground">Commission Earned</p><p className="text-xl font-bold text-primary">{currency(commissionData.metrics.commissionEarned)}</p></Card>
            <Card className="p-4"><p className="text-[10px] uppercase text-muted-foreground">Paid Commission</p><p className="text-xl font-bold text-green-400">{currency(commissionData.metrics.paidCommission)}</p></Card>
            <Card className="p-4"><p className="text-[10px] uppercase text-muted-foreground">Pending Commission</p><p className="text-xl font-bold text-amber-400">{currency(commissionData.metrics.pendingCommission)}</p></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5"><h3 className="text-sm font-semibold mb-3">Monthly Commission Report</h3><LineChart data={commissionData.monthlyReport.map(m => ({ date: m.month, count: m.commissionEarned, convertedCount: m.commissionPaid }))} /></Card>
            <Card className="p-5"><h3 className="text-sm font-semibold mb-3">Agent-wise Commission</h3><BarChart data={commissionData.agentWise.map(a => ({ label: a.agent, value: a.commissionAmount, color: '#a855f7' }))} /></Card>
          </div>

          <Card className="p-5 overflow-auto">
            <h3 className="text-sm font-semibold mb-3">Agent-wise Commission Table</h3>
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border/40"><th className="py-2 text-left">Agent</th><th className="text-left">Sales</th><th className="text-left">Rate</th><th className="text-left">Commission</th><th className="text-left">Status</th></tr></thead>
              <tbody>
                {commissionData.agentWise.map((a, i) => (
                  <tr key={i} className="border-b border-border/20"><td className="py-2">{a.agent}</td><td>{currency(a.salesAmount)}</td><td>{a.commissionRate.toFixed(2)}%</td><td>{currency(a.commissionAmount)}</td><td>{a.paymentStatus}</td></tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      <Card className="p-4 bg-muted/10 border-dashed border-border/60">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Scheduled & Email Reports</p>
            <p className="text-xs text-muted-foreground">Set up periodic exports and email delivery workflows.</p>
          </div>
          <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => alert('Scheduled/email reports can be integrated with Celery beat + SMTP in next step.')}>Configure</Button>
        </div>
      </Card>
    </div>
  );
};

export default Reports;
