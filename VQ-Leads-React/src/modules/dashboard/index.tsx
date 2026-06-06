import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type User, type DashboardStats, type DashboardCharts } from '../../api';
import { LineChart } from '../../components/charts/CustomCharts';
import { Card } from '../../components/common/Card';
import { 
  ChevronDown, 
  HelpCircle, 
  Video,
  MessageSquare,
  MoreVertical,
  ChevronRight
} from 'lucide-react';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'sources' | 'qualification'>('status');
  const [revenueTimeframe, setRevenueTimeframe] = useState<'1D' | '1W' | '1M' | '6M' | '1Y'>('1Y');

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: api.getDashboardStats,
  });

  const { data: charts, isLoading: chartsLoading } = useQuery<DashboardCharts>({
    queryKey: ['dashboard-charts'],
    queryFn: api.getDashboardCharts,
  });

  if (statsLoading || chartsLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-[calc(100vh-70px)]">
        <div className="text-muted-foreground text-sm font-semibold animate-pulse">Loading dashboard metrics...</div>
      </div>
    );
  }

  // Formatting helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const totalLeads = stats?.totalLeads || 0;
  const wonLeads = stats?.statusBreakdown?.WON || 0;
  const lostLeads = stats?.statusBreakdown?.LOST || 0;
  const inProgressLeads = (stats?.statusBreakdown?.IN_PROGRESS || 0) + (stats?.statusBreakdown?.QUALIFIED || 0);
  const openLeads = (stats?.statusBreakdown?.NEW || 0) + (stats?.statusBreakdown?.CONTACTED || 0);

  const activeTimeframes: ('1D' | '1W' | '1M' | '6M' | '1Y')[] = ['1D', '1W', '1M', '6M', '1Y'];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto text-left">
      {/* Title Bar */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      </div>

      {/* Row 1: KPI Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Leads */}
        <Card className="p-6 flex flex-col justify-between border border-border/60 hover:shadow-md transition-all relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Leads</span>
            <span className="bg-green-500/10 text-green-600 border border-green-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              ▲ 8%
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-foreground">{totalLeads}</span>
            <span className="text-xs text-muted-foreground block mt-1.5 font-medium">+24 vs last week</span>
          </div>
        </Card>

        {/* Conversion Rate */}
        <Card className="p-6 flex flex-col justify-between border border-border/60 hover:shadow-md transition-all relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Conversion Rate</span>
            <span className="bg-green-500/10 text-green-600 border border-green-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              ▲ 2%
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-foreground">{stats?.conversionRate || 0}%</span>
            <span className="text-xs text-muted-foreground block mt-1.5 font-medium">+8 vs last week</span>
          </div>
        </Card>

        {/* CLV */}
        <Card className="p-6 flex flex-col justify-between border border-border/60 hover:shadow-md transition-all relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              CLV <HelpCircle size={12} className="text-muted-foreground/60" />
            </span>
            <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              ▼ 4%
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-foreground">14d</span>
            <span className="text-xs text-muted-foreground block mt-1.5 font-medium">+1d vs last week</span>
          </div>
        </Card>
      </div>

      {/* Row 2: Central Grid (Revenue & Calendar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Line Chart */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between border border-border/60">
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 cursor-pointer">
                Revenue <ChevronDown size={12} />
              </span>
              <span className="text-2xl font-bold text-foreground mt-1">{formatCurrency(stats?.pipelineValue || 0)}</span>
              <span className="text-xs text-green-500 font-bold mt-1">+22% vs last month</span>
            </div>
            
            {/* Timeframe selector */}
            <div className="flex items-center gap-1 rounded-lg bg-secondary/80 p-1 border border-border/40 text-xs">
              {activeTimeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setRevenueTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    revenueTimeframe === tf 
                      ? 'bg-card text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 w-full mt-4">
            {charts && <LineChart data={charts.leadsTimeline} />}
          </div>
        </Card>

        {/* Calendar Card */}
        <Card className="p-6 flex flex-col justify-between border border-border/60">
          <div>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-bold text-foreground">Calendar</h3>
              <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card text-xs font-bold text-foreground hover:bg-secondary/40 transition-all cursor-pointer">
                June <ChevronDown size={12} />
              </button>
            </div>

            {/* Week row */}
            <div className="grid grid-cols-7 text-center border-b border-border/40 pb-4 mb-4 select-none">
              {[
                { d: 'Sun', n: 5 },
                { d: 'Mon', n: 6 },
                { d: 'Tue', n: 7 },
                { d: 'Wed', n: 8, active: true },
                { d: 'Thu', n: 9 },
                { d: 'Fri', n: 10 },
                { d: 'Sat', n: 11 }
              ].map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">{day.d}</span>
                  <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    day.active 
                      ? 'bg-primary text-white shadow-md shadow-primary/20' 
                      : 'text-foreground hover:bg-secondary'
                  }`}>
                    {day.n}
                  </span>
                </div>
              ))}
            </div>

            {/* Hours list / Meetings */}
            <div className="space-y-3.5 text-left">
              {/* Meeting 1 */}
              <div className="flex items-start gap-4">
                <span className="text-[10px] font-bold text-muted-foreground/60 w-10 mt-1">9 am</span>
                <div className="flex-1 p-3.5 rounded-xl border border-border bg-secondary/30 flex flex-col gap-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Mesh Weekly Meeting</h4>
                      <span className="text-[9px] text-muted-foreground font-medium mt-0.5 block">9:00 am - 10:00 am</span>
                    </div>
                    <MoreVertical size={14} className="text-muted-foreground/60" />
                  </div>
                  <div className="flex items-center justify-between border-t border-border/40 pt-2.5 mt-1">
                    {/* Avatars */}
                    <div className="flex -space-x-1.5">
                      <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-primary to-blue-500 border border-card flex items-center justify-center text-[8px] font-bold text-white">A</div>
                      <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 border border-card flex items-center justify-center text-[8px] font-bold text-white">B</div>
                      <div className="h-5 w-5 rounded-full bg-muted border border-card flex items-center justify-center text-[7px] font-bold text-muted-foreground">+7</div>
                    </div>
                    <button className="flex items-center gap-1 text-[9px] font-bold text-primary hover:underline">
                      <Video size={10} /> On Google Meet <ChevronRight size={10} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Available Time */}
              <div className="flex items-start gap-4">
                <span className="text-[10px] font-bold text-muted-foreground/60 w-10 mt-1.5">10 am</span>
                <div className="flex-1 p-2.5 rounded-xl border border-dashed border-border/80 bg-card/10 text-[10px] font-bold text-muted-foreground/80">
                  Available Time (10:00 am - 10:40 am)
                </div>
              </div>

              {/* Meeting 2 */}
              <div className="flex items-start gap-4">
                <span className="text-[10px] font-bold text-muted-foreground/60 w-10 mt-1">11 am</span>
                <div className="flex-1 p-3.5 rounded-xl border border-border bg-secondary/30 flex flex-col gap-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Patreon Gamification Demo</h4>
                      <span className="text-[9px] text-muted-foreground font-medium mt-0.5 block">10:45 am - 11:45 am</span>
                    </div>
                    <MoreVertical size={14} className="text-muted-foreground/60" />
                  </div>
                  <div className="flex items-center justify-between border-t border-border/40 pt-2.5 mt-1">
                    {/* Avatars */}
                    <div className="flex -space-x-1.5">
                      <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 border border-card flex items-center justify-center text-[8px] font-bold text-white">P</div>
                      <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 border border-card flex items-center justify-center text-[8px] font-bold text-white">S</div>
                    </div>
                    <button className="flex items-center gap-1 text-[9px] font-bold text-primary hover:underline">
                      <MessageSquare size={10} /> On Slack <ChevronRight size={10} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 3: Bottom Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Leads Management */}
        <Card className="p-6 border border-border/60 text-left flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-bold text-foreground">Leads Management</h3>
              <MoreVertical size={16} className="text-muted-foreground/60" />
            </div>

            {/* Tabs row */}
            <div className="flex items-center gap-1 rounded-lg bg-secondary/80 p-1 border border-border/40 text-xs w-fit mb-5">
              {(['status', 'sources', 'qualification'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-md font-bold transition-all capitalize cursor-pointer ${
                    activeTab === tab 
                      ? 'bg-card text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab contents */}
            {activeTab === 'status' && (
              <div className="space-y-4">
                {/* Horizontal progress visualization */}
                <div className="w-full h-2 rounded-full overflow-hidden flex bg-secondary">
                  <div className="bg-[#10b981] h-full" style={{ width: `${(wonLeads/totalLeads)*100 || 20}%` }} title="Won" />
                  <div className="bg-[#3b82f6] h-full" style={{ width: `${(inProgressLeads/totalLeads)*100 || 30}%` }} title="In Progress" />
                  <div className="bg-[#f59e0b] h-full" style={{ width: `${(openLeads/totalLeads)*100 || 35}%` }} title="Open" />
                  <div className="bg-[#ef4444] h-full" style={{ width: `${(lostLeads/totalLeads)*100 || 15}%` }} title="Lost" />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="p-3.5 rounded-xl border border-border/80 bg-secondary/10 hover:shadow-sm transition-all text-left">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Open</span>
                    <h5 className="text-lg font-bold text-foreground mt-1">{openLeads} <span className="text-xs text-muted-foreground font-semibold">leads</span></h5>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/80 bg-secondary/10 hover:shadow-sm transition-all text-left">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">In Progress</span>
                    <h5 className="text-lg font-bold text-foreground mt-1">{inProgressLeads} <span className="text-xs text-muted-foreground font-semibold">leads</span></h5>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/80 bg-secondary/10 hover:shadow-sm transition-all text-left">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Lost</span>
                    <h5 className="text-lg font-bold text-foreground mt-1">{lostLeads} <span className="text-xs text-muted-foreground font-semibold">leads</span></h5>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/80 bg-secondary/10 hover:shadow-sm transition-all text-left">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Won</span>
                    <h5 className="text-lg font-bold text-foreground mt-1">{wonLeads} <span className="text-xs text-muted-foreground font-semibold">leads</span></h5>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sources' && (
              <div className="space-y-3 mt-2">
                {stats?.sourceBreakdown && Object.entries(stats.sourceBreakdown).map(([source, count], idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-semibold">{source}</span>
                    <span className="font-bold text-foreground">{count} leads</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'qualification' && (
              <div className="text-center text-xs text-muted-foreground py-10 font-medium">
                Qualification data loaded dynamically.
              </div>
            )}
          </div>
        </Card>

        {/* Retention Rate */}
        <Card className="p-6 border border-border/60 text-left flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-bold text-foreground">Retention Rate</h3>
              <MoreVertical size={16} className="text-muted-foreground/60" />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">95%</span>
              <span className="text-xs text-green-500 font-bold">+12% vs last month</span>
            </div>

            {/* SMEs / Startups / Enterprises indicators */}
            <div className="flex gap-4 mt-3 select-none text-[10px] font-bold text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#1e40af]" /> SMEs
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#06b6d4]" /> Startups
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#1e3a8a]" /> Enterprises
              </span>
            </div>

            {/* Vertical Bar Chart */}
            <div className="flex items-end justify-between h-[120px] px-2 mt-5">
              {[40, 65, 50, 85, 70, 90, 60, 75, 95].map((val, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5 w-3.5">
                  <div 
                    className="w-full hover:shadow-sm rounded-t-sm transition-all" 
                    style={{ 
                      height: `${val}px`, 
                      backgroundColor: idx % 3 === 0 ? '#1e40af' : idx % 3 === 1 ? '#06b6d4' : '#1e3a8a' 
                    }} 
                  />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Top Customer Locations */}
        <Card className="p-6 border border-border/60 text-left flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-bold text-foreground">Top Customer Locations</h3>
              <MoreVertical size={16} className="text-muted-foreground/60" />
            </div>

            {/* Map Sketch Placeholder */}
            <div className="h-28 bg-secondary/50 rounded-xl border border-border flex items-center justify-center p-3 relative overflow-hidden">
              <svg viewBox="0 0 100 50" className="w-full h-full stroke-muted-foreground/20 fill-muted-foreground/5 overflow-visible">
                <path d="M15 15c2-2 5-2 7 0s5 4 8 2 6-3 8-1 2 4 4 1 5-4 7-2 4 3 6 1 2-2 4 0 3 4 5 2 2-3 4-1" strokeWidth="1" strokeLinecap="round" />
                <path d="M55 20c3-3 8-3 11 0s5 6 9 3 9-4 12-1" strokeWidth="1" strokeLinecap="round" />
                <circle cx="25" cy="18" r="3" className="fill-primary stroke-card" strokeWidth="1.5" />
                <circle cx="70" cy="22" r="3.5" className="fill-primary stroke-card" strokeWidth="1.5" />
              </svg>
              <div className="absolute bottom-2 left-2 flex flex-col gap-0.5">
                <button className="h-5 w-5 rounded bg-card border border-border text-xs font-bold flex items-center justify-center hover:bg-secondary cursor-pointer shadow-sm">+</button>
                <button className="h-5 w-5 rounded bg-card border border-border text-xs font-bold flex items-center justify-center hover:bg-secondary cursor-pointer shadow-sm">-</button>
              </div>
            </div>

            {/* Locations list */}
            <div className="space-y-2.5 mt-5">
              {[
                { rank: 1, flag: '🇦🇺', name: 'Australia', pct: 48, color: '#1e40af' },
                { rank: 2, flag: '🇮🇩', name: 'Indonesia', pct: 15, color: '#06b6d4' },
                { rank: 3, flag: '🇺🇸', name: 'United States', pct: 20, color: '#10b981' }
              ].map((loc) => (
                <div key={loc.rank} className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{loc.flag}</span>
                    <span className="text-foreground">{loc.name}</span>
                  </div>
                  <div className="flex items-center gap-4 w-44">
                    <div className="flex-1 bg-secondary h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${loc.pct}%`, backgroundColor: loc.color }} />
                    </div>
                    <span className="text-muted-foreground w-8 text-right">{loc.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Row 4: Team Performance Leaderboard */}
      {(user.profile.role === 'ADMIN' || user.profile.role === 'LEADER') && (
        <Card className="p-6 border border-border/60">
          <div className="mb-5 flex justify-between items-center">
            <div className="text-left">
              <h3 className="text-sm font-bold text-foreground">
                {user.profile.role === 'ADMIN' ? 'Agent Performance Leaderboard' : 'Team Performance Leaderboard'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Revenue and conversion performance ranking</p>
            </div>
            <MoreVertical size={16} className="text-muted-foreground/60" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {charts?.leaderboard && charts.leaderboard.length > 0 ? (
              charts.leaderboard.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:border-primary/20 transition-all shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' :
                      idx === 1 ? 'bg-slate-400 text-black' :
                      idx === 2 ? 'bg-amber-700 text-white' :
                      'bg-secondary border border-border text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-foreground">{item.agent}</span>
                      <span className="text-[10px] text-muted-foreground">@{item.username}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-500">${item.revenue.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">{item.wonLeads} deals won</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground py-4 col-span-3 text-center">No performance data available.</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
