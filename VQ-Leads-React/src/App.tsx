import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate,
  useParams
} from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type User, type Lead, type SalesTeam, type LeadForm, type Task, type FollowUp, type Commission, type DashboardStats, type DashboardCharts } from './api';
import { useAuthStore } from './store';
import { Sidebar } from './components/Sidebar';
import { LineChart, DonutChart } from './components/CustomCharts';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { Dialog } from './components/ui/Dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './components/ui/Table';
import { LeadDetailsDrawer } from './components/LeadDetailsDrawer';
import { 
  Plus, 
  Search, 
  Calendar, 
  Check, 
  Copy,
  Sliders,
  DollarSign,
  TrendingUp,
  Briefcase,
  CheckCircle,
  ExternalLink,
  ClipboardCheck,
  Circle,
  X
} from 'lucide-react';

// --- AUTH GATES ---
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <div className="flex w-screen min-h-screen bg-background">{children}</div>;
};

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const user = useAuthStore(state => state.user);
  if (!user || user.profile.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// --- PAGES ---

// 1. LOGIN PAGE
const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  const loginMutation = useMutation({
    mutationFn: () => api.login(username, password),
    onSuccess: (data) => {
      login(data.user, data.token);
      navigate('/');
    },
    onError: (err: any) => {
      setError(err.message || 'Invalid credentials');
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate();
  };

  const handleQuickLogin = async (userStr: string, passStr: string) => {
    setError('');
    try {
      const data = await api.login(userStr, passStr);
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError('Quick login failed');
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-[radial-gradient(circle_at_10%_20%,rgba(147,51,234,0.08)_0%,rgba(0,0,0,0)_50%)] bg-background">
      <div className="w-full max-w-[420px] bg-card border border-border/80 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-white font-bold text-xl mb-6 mx-auto">
          VQ
        </div>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground">Sign In</h2>
          <p className="text-sm text-muted-foreground mt-1">Access VQ Leads CRM Portal</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive p-3 rounded-lg mb-5 text-xs text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-semibold text-foreground">Username</label>
            <Input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-semibold text-foreground">Password</label>
            <Input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          <Button type="submit" className="w-full mt-2" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-8 border-t border-border/40 pt-6">
          <div className="text-left text-[11px] font-bold text-foreground uppercase tracking-wider mb-3">
            Quick Demo Login
          </div>
          <div className="flex flex-col gap-2">
            <button 
              type="button"
              className="flex justify-between items-center text-left text-xs bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground border border-border/40 hover:border-border p-2.5 rounded-lg transition-all"
              onClick={() => handleQuickLogin('admin', 'admin123')}
            >
              <span className="font-semibold text-foreground">Sarah Conner (Admin)</span>
              <span className="opacity-60 font-mono">admin</span>
            </button>
            <button 
              type="button"
              className="flex justify-between items-center text-left text-xs bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground border border-border/40 hover:border-border p-2.5 rounded-lg transition-all"
              onClick={() => handleQuickLogin('agent1', 'agent123')}
            >
              <span className="font-semibold text-foreground">Alice Smith (Agent - 8.5%)</span>
              <span className="opacity-60 font-mono">agent1</span>
            </button>
            <button 
              type="button"
              className="flex justify-between items-center text-left text-xs bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground border border-border/40 hover:border-border p-2.5 rounded-lg transition-all"
              onClick={() => handleQuickLogin('agent2', 'agent123')}
            >
              <span className="font-semibold text-foreground">Bob Jones (Agent - 12.0%)</span>
              <span className="opacity-60 font-mono">agent2</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. DASHBOARD PAGE
const Dashboard: React.FC<{ user: User }> = ({ user }) => {
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const donutData = stats ? [
    { label: 'New', value: stats.statusBreakdown.NEW || 0, color: 'var(--primary)' },
    { label: 'Contacted', value: stats.statusBreakdown.CONTACTED || 0, color: '#c084fc' },
    { label: 'In Progress', value: stats.statusBreakdown.IN_PROGRESS || 0, color: '#f59e0b' },
    { label: 'Qualified', value: stats.statusBreakdown.QUALIFIED || 0, color: 'var(--primary)' },
    { label: 'Won', value: stats.statusBreakdown.WON || 0, color: '#10b981' },
    { label: 'Lost', value: stats.statusBreakdown.LOST || 0, color: '#ef4444' }
  ] : [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex items-center justify-between p-6">
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Leads</span>
            <span className="text-3xl font-bold mt-2 text-foreground">{stats?.totalLeads || 0}</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
            <Briefcase size={22} />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-6">
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conversion Rate</span>
            <span className="text-3xl font-bold mt-2 text-foreground">{stats?.conversionRate || 0}%</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center">
            <TrendingUp size={22} />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-6">
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pipeline Value</span>
            <span className="text-3xl font-bold mt-2 text-foreground">{formatCurrency(stats?.pipelineValue || 0)}</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <DollarSign size={22} />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-6">
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {user.profile.role === 'ADMIN' ? 'Total Commissions' : 'My Commissions'}
            </span>
            <span className="text-3xl font-bold mt-2 text-foreground">{formatCurrency(stats?.earnedCommissions || 0)}</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <DollarSign size={22} />
          </div>
        </Card>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="mb-6 text-left">
            <h3 className="text-base font-semibold text-foreground">Lead Ingestion Timeline</h3>
            <p className="text-xs text-muted-foreground">Inquiries submitted over the past 15 days</p>
          </div>
          {charts && <LineChart data={charts.leadsTimeline} />}
        </Card>

        <Card className="p-6">
          <div className="mb-6 text-left">
            <h3 className="text-base font-semibold text-foreground">Status Funnel</h3>
            <p className="text-xs text-muted-foreground">Distribution of active pipeline leads</p>
          </div>
          <DonutChart data={donutData} />
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {user.profile.role === 'ADMIN' && (
          <Card className="p-6">
            <div className="mb-6 text-left">
              <h3 className="text-base font-semibold text-foreground">Agent Performance Leaderboard</h3>
              <p className="text-xs text-muted-foreground">Revenue and conversion performance ranking</p>
            </div>
            <div className="space-y-3">
              {charts?.leaderboard && charts.leaderboard.length > 0 ? (
                charts.leaderboard.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
                    <div className="flex items-center gap-3">
                      <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        idx === 0 ? 'bg-amber-500 text-black' :
                        idx === 1 ? 'bg-slate-400 text-black' :
                        idx === 2 ? 'bg-amber-700 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-semibold text-foreground">{item.agent}</span>
                        <span className="text-[10px] text-muted-foreground">@{item.username}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-400">{formatCurrency(item.revenue)}</div>
                      <div className="text-[10px] text-muted-foreground">{item.wonLeads} deals won</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground py-8">No agent performance data.</div>
              )}
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="mb-6 text-left">
            <h3 className="text-base font-semibold text-foreground">Top Lead Sources</h3>
            <p className="text-xs text-muted-foreground">Breakdown of ingestion source tags</p>
          </div>
          <div className="space-y-3">
            {stats?.sourceBreakdown && Object.keys(stats.sourceBreakdown).length > 0 ? (
              Object.entries(stats.sourceBreakdown).map(([source, count], idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
                  <span className="text-sm font-semibold text-foreground">{source}</span>
                  <span className="text-xs font-bold bg-muted/50 border border-border/60 px-2.5 py-0.5 rounded-full text-foreground/80">
                    {count} Inquiries
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground py-8">No lead sources logged yet.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

// 3. LEADS BOARD & KANBAN PAGE
const Leads: React.FC<{ user: User }> = ({ user }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  // Form states for new lead
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadValue, setNewLeadValue] = useState('0.00');
  const [newLeadSource, setNewLeadSource] = useState('Manual Entry');
  const [newLeadOwner, setNewLeadOwner] = useState<number | null>(null);

  const isAdmin = user.profile.role === 'ADMIN';

  // React Query fetch
  const { data: leads = [], refetch: refetchLeads } = useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: api.getLeads,
  });

  const { data: agents = [] } = useQuery<User[]>({
    queryKey: ['agents'],
    queryFn: api.getAgents,
    enabled: isAdmin
  });

  // Mutations
  const createLeadMutation = useMutation({
    mutationFn: api.createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setIsModalOpen(false);
      // Reset fields
      setNewLeadName('');
      setNewLeadEmail('');
      setNewLeadPhone('');
      setNewLeadCompany('');
      setNewLeadValue('0.00');
      setNewLeadSource('Manual Entry');
      setNewLeadOwner(null);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to create lead');
    }
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Lead> }) => api.updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  });

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    createLeadMutation.mutate({
      name: newLeadName,
      email: newLeadEmail,
      phone: newLeadPhone,
      company: newLeadCompany,
      value: newLeadValue,
      source: newLeadSource,
      owner: newLeadOwner || null,
      status: 'NEW'
    });
  };

  const moveLeadStatus = (leadId: number, status: string) => {
    updateLeadMutation.mutate({ id: leadId, data: { status: status as any } });
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || 
                          l.company.toLowerCase().includes(search.toLowerCase()) ||
                          l.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || l.status === statusFilter;
    const matchesSource = !sourceFilter || l.source === sourceFilter;
    const matchesOwner = !ownerFilter || 
                         (ownerFilter === 'unassigned' && !l.owner) || 
                         (l.owner && l.owner.toString() === ownerFilter);
    return matchesSearch && matchesStatus && matchesSource && matchesOwner;
  });

  const sources = Array.from(new Set(leads.map(l => l.source)));

  const kanbanColumns = [
    { id: 'NEW', title: 'New', color: 'bg-blue-500' },
    { id: 'CONTACTED', title: 'Contacted', color: 'bg-purple-500' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-amber-500' },
    { id: 'QUALIFIED', title: 'Qualified', color: 'bg-primary' },
    { id: 'WON', title: 'Won', color: 'bg-green-500' },
    { id: 'LOST', title: 'Lost', color: 'bg-red-500' }
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header Filters & View Switching */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-3 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Search leads..." 
              className="pl-9 w-[240px]"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select 
            className="flex h-10 rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
          </select>

          <select 
            className="flex h-10 rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer"
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
          >
            <option value="">All Sources</option>
            {sources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {isAdmin && (
            <select 
              className="flex h-10 rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer"
              value={ownerFilter}
              onChange={e => setOwnerFilter(e.target.value)}
            >
              <option value="">All Owners</option>
              <option value="unassigned">Unassigned</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
            </select>
          )}
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Switch view */}
          <div className="inline-flex items-center justify-center rounded-lg bg-muted/40 p-1 border border-border/40 text-xs">
            <button 
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${viewMode === 'list' ? 'bg-secondary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button 
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${viewMode === 'kanban' ? 'bg-secondary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setViewMode('kanban')}
            >
              Kanban
            </button>
          </div>

          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} className="mr-1.5" /> New Lead
          </Button>
        </div>
      </div>

      {/* Grid or List render */}
      {viewMode === 'list' ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent cursor-default">
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    No leads match your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map(l => (
                  <TableRow key={l.id} onClick={() => setSelectedLeadId(l.id)}>
                    <TableCell className="font-semibold text-foreground">{l.name}</TableCell>
                    <TableCell>{l.company || '-'}</TableCell>
                    <TableCell>{l.source}</TableCell>
                    <TableCell className="font-semibold">${l.value}</TableCell>
                    <TableCell>{l.owner_name}</TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        l.status === 'NEW' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                        l.status === 'CONTACTED' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                        l.status === 'IN_PROGRESS' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                        l.status === 'QUALIFIED' ? 'bg-primary/10 border-primary/20 text-primary-foreground' :
                        l.status === 'WON' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                        'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>
                        {l.status}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(l.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 items-start select-none">
          {kanbanColumns.map(col => {
            const colLeads = filteredLeads.filter(l => l.status === col.id);
            return (
              <div key={col.id} className="flex-1 min-w-[280px] max-w-[340px] bg-card/40 border border-border/80 rounded-xl p-4 flex flex-col max-h-[calc(100vh-190px)] shrink-0">
                <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                    <h4 className="text-sm font-semibold text-foreground">{col.title}</h4>
                  </div>
                  <span className="text-[11px] font-bold bg-muted/60 px-2 py-0.5 rounded-full text-muted-foreground">
                    {colLeads.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3 overflow-y-auto pr-1">
                  {colLeads.map(l => (
                    <div 
                      key={l.id} 
                      className="bg-card border border-border/80 rounded-lg p-4 cursor-pointer hover:border-border/100 hover:shadow-lg transition-all text-left"
                      onClick={() => setSelectedLeadId(l.id)}
                    >
                      <h5 className="text-sm font-semibold text-foreground leading-snug">{l.name}</h5>
                      <p className="text-xs text-muted-foreground mt-1 mb-3">{l.company || 'No Company'}</p>
                      
                      <div className="flex justify-between items-center text-xs mt-2 pt-2.5 border-t border-border/40">
                        <span className="font-semibold text-foreground">${l.value}</span>
                        <span className="text-[10px] bg-muted/40 border border-border/40 px-1.5 py-0.5 rounded text-muted-foreground max-w-[100px] truncate">
                          {l.owner_name}
                        </span>
                      </div>

                      {/* Manual board transition triggers */}
                      <div className="flex gap-1.5 mt-3 pt-2 border-t border-border/40 overflow-x-auto justify-end">
                        {kanbanColumns.map(targetCol => {
                          if (targetCol.id === col.id) return null;
                          return (
                            <button
                              key={targetCol.id}
                              className="text-[9px] uppercase font-bold px-1 py-0.5 rounded border border-border bg-muted/10 hover:bg-muted/40 hover:text-foreground text-muted-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveLeadStatus(l.id, targetCol.id);
                              }}
                            >
                              {targetCol.title[0]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Lead Modal */}
      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Lead">
        <form onSubmit={handleCreateLead} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">Contact Name</label>
            <Input 
              type="text" 
              value={newLeadName} 
              onChange={e => setNewLeadName(e.target.value)} 
              required 
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">Company Name</label>
            <Input 
              type="text" 
              value={newLeadCompany} 
              onChange={e => setNewLeadCompany(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Email</label>
              <Input 
                type="email" 
                value={newLeadEmail} 
                onChange={e => setNewLeadEmail(e.target.value)} 
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Phone</label>
              <Input 
                type="text" 
                value={newLeadPhone} 
                onChange={e => setNewLeadPhone(e.target.value)} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Deal Value ($)</label>
              <Input 
                type="number" 
                step="0.01"
                value={newLeadValue} 
                onChange={e => setNewLeadValue(e.target.value)} 
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Lead Source</label>
              <Input 
                type="text" 
                value={newLeadSource} 
                onChange={e => setNewLeadSource(e.target.value)} 
              />
            </div>
          </div>

          {isAdmin && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Assign Agent</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer"
                value={newLeadOwner || ''}
                onChange={e => setNewLeadOwner(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Unassigned</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.full_name} ({a.username})</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createLeadMutation.isPending}>
              {createLeadMutation.isPending ? 'Creating...' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Drawer detailed panel */}
      <LeadDetailsDrawer
        leadId={selectedLeadId || 0}
        isOpen={selectedLeadId !== null}
        onClose={() => setSelectedLeadId(null)}
        currentUser={user}
        agents={agents}
        onLeadUpdated={refetchLeads}
      />
    </div>
  );
};

// 4. SALES TEAMS PAGE (Admin Only)
const Teams: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New team states
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [newTeamLeader, setNewTeamLeader] = useState<number | null>(null);
  const [newTeamMembers, setNewTeamMembers] = useState<number[]>([]);

  // Agent Register states
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [agentUser, setAgentUser] = useState('');
  const [agentPass, setAgentPass] = useState('');
  const [agentEmail, setAgentEmail] = useState('');
  const [agentFirst, setAgentFirst] = useState('');
  const [agentLast, setAgentLast] = useState('');
  const [agentComm, setAgentComm] = useState('10.00');

  // React Queries
  const { data: teams = [] } = useQuery<SalesTeam[]>({
    queryKey: ['teams'],
    queryFn: api.getTeams,
  });

  const { data: agents = [] } = useQuery<User[]>({
    queryKey: ['agents'],
    queryFn: api.getAgents,
  });

  // Mutations
  const createTeamMutation = useMutation({
    mutationFn: api.createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setIsModalOpen(false);
      setNewTeamName('');
      setNewTeamDesc('');
      setNewTeamLeader(null);
      setNewTeamMembers([]);
    }
  });

  const registerAgentMutation = useMutation({
    mutationFn: api.createAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setIsAgentModalOpen(false);
      setAgentUser('');
      setAgentPass('');
      setAgentEmail('');
      setAgentFirst('');
      setAgentLast('');
      setAgentComm('10.00');
    },
    onError: (err: any) => {
      alert(err.message || 'Registration failed');
    }
  });

  const deleteTeamMutation = useMutation({
    mutationFn: api.deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    }
  });

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    createTeamMutation.mutate({
      name: newTeamName,
      description: newTeamDesc,
      leader: newTeamLeader,
      members: newTeamMembers
    });
  };

  const handleRegisterAgent = (e: React.FormEvent) => {
    e.preventDefault();
    registerAgentMutation.mutate({
      username: agentUser,
      password: agentPass,
      email: agentEmail,
      first_name: agentFirst,
      last_name: agentLast,
      commission_rate: agentComm
    });
  };

  const handleMemberToggle = (id: number) => {
    if (newTeamMembers.includes(id)) {
      setNewTeamMembers(newTeamMembers.filter(m => m !== id));
    } else {
      setNewTeamMembers([...newTeamMembers, id]);
    }
  };

  const handleDeleteTeam = (id: number) => {
    if (!window.confirm('Delete this team?')) return;
    deleteTeamMutation.mutate(id);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-end gap-3 border-b border-border/40 pb-4">
        <Button variant="outline" onClick={() => setIsAgentModalOpen(true)}>
          <Plus size={16} className="mr-1.5" /> Register Sales Agent User
        </Button>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={16} className="mr-1.5" /> Create Sales Team
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(t => (
          <Card key={t.id} className="p-6 flex flex-col justify-between min-h-[280px]">
            <div className="text-left">
              <div className="flex justify-between items-start">
                <h3 className="text-base font-semibold text-foreground leading-snug">{t.name}</h3>
                <button 
                  className="text-xs font-medium text-destructive hover:underline"
                  onClick={() => handleDeleteTeam(t.id)}
                >
                  Delete
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 mb-6">
                {t.description || 'No description provided.'}
              </p>
            </div>
            
            <div className="border-t border-border/40 pt-4 flex flex-col gap-3 text-left">
              <div className="text-xs">
                <span className="font-semibold text-foreground">Team Leader: </span>
                <span className="text-muted-foreground">{t.leader_details?.full_name || 'Unassigned'}</span>
              </div>
              <div className="text-xs">
                <span className="font-semibold text-foreground">Members ({t.members_details.length}):</span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {t.members_details.length === 0 ? (
                    <span className="text-muted-foreground text-[10px]">No members in team</span>
                  ) : (
                    t.members_details.map(m => (
                      <span 
                        key={m.id} 
                        className="text-[10px] font-semibold bg-muted/40 border border-border/50 px-2 py-0.5 rounded text-muted-foreground"
                      >
                        {m.full_name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Team Modal */}
      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Sales Team">
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">Team Name</label>
            <Input 
              type="text" 
              value={newTeamName} 
              onChange={e => setNewTeamName(e.target.value)} 
              required 
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">Description</label>
            <textarea 
              className="flex w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring min-h-[80px]" 
              value={newTeamDesc} 
              onChange={e => setNewTeamDesc(e.target.value)} 
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">Team Leader</label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer"
              value={newTeamLeader || ''} 
              onChange={e => setNewTeamLeader(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Select Leader...</option>
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.full_name} ({a.username})</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">Select Members</label>
            <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto border border-border/80 p-3 rounded-lg bg-muted/10">
              {agents.map(a => (
                <label key={a.id} className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                  <input 
                    type="checkbox" 
                    className="rounded border-input text-primary focus:ring-ring bg-muted/20 h-4 w-4"
                    checked={newTeamMembers.includes(a.id)} 
                    onChange={() => handleMemberToggle(a.id)}
                  />
                  <span>{a.full_name} ({a.username})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createTeamMutation.isPending}>
              {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Register Agent Modal */}
      <Dialog isOpen={isAgentModalOpen} onClose={() => setIsAgentModalOpen(false)} title="Register Sales Agent User">
        <form onSubmit={handleRegisterAgent} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">Username</label>
            <Input 
              type="text" 
              value={agentUser} 
              onChange={e => setAgentUser(e.target.value)} 
              required 
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">Password</label>
            <Input 
              type="password" 
              value={agentPass} 
              onChange={e => setAgentPass(e.target.value)} 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">First Name</label>
              <Input 
                type="text" 
                value={agentFirst} 
                onChange={e => setAgentFirst(e.target.value)} 
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Last Name</label>
              <Input 
                type="text" 
                value={agentLast} 
                onChange={e => setAgentLast(e.target.value)} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Email</label>
              <Input 
                type="email" 
                value={agentEmail} 
                onChange={e => setAgentEmail(e.target.value)} 
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Commission Rate (%)</label>
              <Input 
                type="number" 
                step="0.01"
                value={agentComm} 
                onChange={e => setAgentComm(e.target.value)} 
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
            <Button type="button" variant="outline" onClick={() => setIsAgentModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={registerAgentMutation.isPending}>
              {registerAgentMutation.isPending ? 'Registering...' : 'Register Agent'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

// 5. LEAD FORMS BUILDER (Admin Only)
const Forms: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [mode, setMode] = useState<'MANUAL' | 'ROUND_ROBIN'>('ROUND_ROBIN');
  const [sourceName, setSourceName] = useState('Website Inbound');

  // React Queries
  const { data: forms = [] } = useQuery<LeadForm[]>({
    queryKey: ['forms'],
    queryFn: api.getForms,
  });

  const createFormMutation = useMutation({
    mutationFn: api.createForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      setIsModalOpen(false);
      setName('');
      setDesc('');
      setMode('ROUND_ROBIN');
      setSourceName('Website Inbound');
    }
  });

  const deleteFormMutation = useMutation({
    mutationFn: api.deleteForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    }
  });

  const handleCreateForm = (e: React.FormEvent) => {
    e.preventDefault();
    createFormMutation.mutate({
      name,
      description: desc,
      assignment_mode: mode,
      source_name: sourceName,
      is_active: true
    });
  };

  const copyEmbedCode = (id: number) => {
    const publicUrl = `${window.location.origin}/public-form/${id}`;
    const iframeCode = `<iframe src="${publicUrl}" width="100%" height="600" style="border:none;border-radius:12px;"></iframe>`;
    navigator.clipboard.writeText(iframeCode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-end border-b border-border/40 pb-4">
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={16} className="mr-1.5" /> Create Lead Form
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent cursor-default">
              <TableHead>Form Details</TableHead>
              <TableHead>Assignment Mode</TableHead>
              <TableHead>Source Logged</TableHead>
              <TableHead>Public URL</TableHead>
              <TableHead>Embed Code</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {forms.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  No forms created yet.
                </TableCell>
              </TableRow>
            ) : (
              forms.map(f => (
                <TableRow key={f.id} className="hover:bg-transparent cursor-default">
                  <TableCell className="text-left font-semibold text-foreground">
                    <div className="flex flex-col">
                      <span>{f.name}</span>
                      <span className="text-[11px] font-normal text-muted-foreground mt-0.5">{f.description || 'No description'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      f.assignment_mode === 'ROUND_ROBIN' 
                        ? 'bg-primary/10 border-primary/20 text-primary-foreground' 
                        : 'bg-muted/40 border-border text-muted-foreground'
                    }`}>
                      {f.assignment_mode.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>{f.source_name}</TableCell>
                  <TableCell>
                    <a 
                      href={`/public-form/${f.id}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 text-xs font-semibold"
                    >
                      Open Form <ExternalLink size={12} />
                    </a>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => copyEmbedCode(f.id)} className="h-8 text-xs font-semibold">
                      {copiedId === f.id ? <Check size={13} className="mr-1 text-green-400" /> : <Copy size={13} className="mr-1" />}
                      <span>{copiedId === f.id ? 'Copied Code!' : 'Copy Code'}</span>
                    </Button>
                  </TableCell>
                  <TableCell>
                    <button 
                      className="text-xs font-semibold text-destructive hover:underline"
                      onClick={() => deleteFormMutation.mutate(f.id)}
                    >
                      Delete
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Form Modal */}
      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Lead Submission Form">
        <form onSubmit={handleCreateForm} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">Form Name</label>
            <Input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Inbound Website Inquiries"
              required 
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">Description</label>
            <textarea 
              className="flex w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring min-h-[70px]" 
              value={desc} 
              onChange={e => setDesc(e.target.value)} 
              placeholder="Describe where this form layout is integrated"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Assignment Method</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer"
                value={mode} 
                onChange={e => setMode(e.target.value as any)}
              >
                <option value="ROUND_ROBIN">Round Robin (Celery)</option>
                <option value="MANUAL">Manual Assignments</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Lead Source Tag</label>
              <Input 
                type="text" 
                value={sourceName} 
                onChange={e => setSourceName(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createFormMutation.isPending}>
              {createFormMutation.isPending ? 'Creating...' : 'Create Form'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

// 6. COMMISSIONS PAGE
const Commissions: React.FC<{ user: User }> = ({ user }) => {
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

// 7. TASKS & FOLLOWUPS AGENDA PAGE
const Tasks: React.FC = () => {
  const queryClient = useQueryClient();

  // React Queries
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: api.getTasks,
  });

  const { data: followups = [], isLoading: followupsLoading } = useQuery<FollowUp[]>({
    queryKey: ['followups'],
    queryFn: api.getFollowUps,
  });

  // Mutations
  const toggleTaskMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => api.updateTask(id, { status: status as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const toggleFollowupMutation = useMutation({
    mutationFn: ({ id, completed }: { id: number, completed: boolean }) => api.updateFollowUp(id, { completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups'] });
    }
  });

  const handleToggleTask = (task: Task) => {
    const newStatus = task.status === 'PENDING' ? 'COMPLETED' : 'PENDING';
    toggleTaskMutation.mutate({ id: task.id, status: newStatus });
  };

  const handleToggleFollowup = (f: FollowUp) => {
    toggleFollowupMutation.mutate({ id: f.id, completed: !f.completed });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (tasksLoading || followupsLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-[calc(100vh-70px)]">
        <div className="text-muted-foreground text-sm font-semibold animate-pulse">Loading agenda details...</div>
      </div>
    );
  }

  const pendingTasks = tasks.filter(t => t.status === 'PENDING');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const pendingReminders = followups.filter(f => !f.completed);

  return (
    <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
      {/* Tasks Agenda */}
      <Card className="p-6 flex flex-col h-[calc(100vh-140px)] overflow-hidden">
        <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-3 text-left">
          <ClipboardCheck className="text-primary" size={20} />
          <h3 className="text-base font-semibold text-foreground">CRM Checklist Tasks</h3>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Pending Tasks */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground text-left uppercase tracking-wider mb-2">
              Pending Checklist ({pendingTasks.length})
            </h4>
            {pendingTasks.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8 border border-dashed border-border/60 rounded-lg">
                All checklist items are completed!
              </div>
            ) : (
              pendingTasks.map(t => (
                <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/40 hover:border-border transition-all text-left bg-muted/10">
                  <button type="button" className="text-muted-foreground hover:text-foreground mt-0.5" onClick={() => handleToggleTask(t)}>
                    <Circle size={16} />
                  </button>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-foreground leading-snug">{t.title}</span>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                      {t.lead_name && <span className="bg-muted px-1.5 py-0.5 rounded text-foreground/80">Lead: {t.lead_name}</span>}
                      {t.due_date && <span className="flex items-center gap-1"><Calendar size={10} /> Due: {formatDate(t.due_date)}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border/30">
              <h4 className="text-xs font-semibold text-muted-foreground text-left uppercase tracking-wider mb-2">
                Completed Items
              </h4>
              {completedTasks.map(t => (
                <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/20 bg-muted/5 opacity-60 text-left">
                  <button type="button" className="text-green-400 mt-0.5" onClick={() => handleToggleTask(t)}>
                    <CheckCircle size={16} />
                  </button>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-muted-foreground line-through leading-snug">{t.title}</span>
                    {t.lead_name && <span className="text-[10px] text-muted-foreground">Lead: {t.lead_name}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Follow-ups Calendar list */}
      <Card className="p-6 flex flex-col h-[calc(100vh-140px)] overflow-hidden">
        <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-3 text-left">
          <Calendar className="text-blue-400" size={20} />
          <h3 className="text-base font-semibold text-foreground">Scheduled Client Follow-ups</h3>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <h4 className="text-xs font-semibold text-foreground text-left uppercase tracking-wider mb-2">
            Upcoming Reminders ({pendingReminders.length})
          </h4>
          {pendingReminders.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-8 border border-dashed border-border/60 rounded-lg">
              No follow-up reminders scheduled.
            </div>
          ) : (
            pendingReminders.map(f => (
              <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/40 hover:border-border transition-all text-left bg-muted/10">
                <button type="button" className="text-muted-foreground hover:text-foreground mt-0.5" onClick={() => handleToggleFollowup(f)}>
                  <Circle size={16} />
                </button>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-foreground leading-snug">{f.notes || 'No description'}</span>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                    <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-semibold border border-blue-500/15">
                      Lead: {f.lead_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={10} /> {formatDate(f.scheduled_time)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

// 8. PUBLIC FORM PORTAL
const PublicForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [value, setValue] = useState('0.00');

  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [assignedAgent, setAssignedAgent] = useState('');
  const [formDetail, setFormDetail] = useState<LeadForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setError('');
        setLoading(true);
        if (id) {
          const detail = await api.getPublicForm(Number(id));
          setFormDetail(detail);
        }
      } catch (err) {
        setError('Submission form not found or has been disabled.');
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [id]);

  const submitMutation = useMutation({
    mutationFn: (data: any) => api.submitPublicForm(Number(id), data),
    onSuccess: (res) => {
      setAssignedAgent(res.assigned_to);
      setSubmitSuccess(true);
    },
    onError: (err: any) => {
      setError(err.message || 'Submission failed. Please check inputs.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name.trim()) return;
    submitMutation.mutate({
      name,
      email,
      phone,
      company,
      notes,
      value
    });
  };

  if (loading && !submitSuccess) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm font-semibold animate-pulse">Loading submission portal...</div>
      </div>
    );
  }

  if (error && !submitSuccess) {
    return (
      <div className="w-screen min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-[500px] bg-card border border-border/80 rounded-2xl p-8 shadow-2xl text-center">
          <div className="h-14 w-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-6">
            <X size={30} />
          </div>
          <h3 className="text-xl font-bold text-foreground">Portal Inaccessible</h3>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(circle_at_90%_80%,rgba(59,130,246,0.06)_0%,rgba(0,0,0,0)_50%),radial-gradient(circle_at_10%_20%,rgba(168,85,247,0.06)_0%,rgba(0,0,0,0)_50%)] bg-background">
      <div className="w-full max-w-[550px] bg-card border border-border/80 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-blue-500" />
        
        {submitSuccess ? (
          <div className="py-8 text-center flex flex-col items-center justify-center gap-4">
            <div className="h-16 w-16 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center">
              <Check size={32} />
            </div>
            <h3 className="text-2xl font-bold text-foreground mt-2">Submission Received</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[400px]">
              Thank you! Your inquiry details have been registered. Our sales team will get back to you shortly.
              {assignedAgent !== 'Routing in progress (Celery)...' && assignedAgent !== 'Unassigned' && (
                <span className="block mt-4 text-xs font-semibold text-primary">
                  Assigned Account Representative: {assignedAgent}
                </span>
              )}
            </p>
            <Button 
              className="mt-6"
              onClick={() => {
                setName('');
                setEmail('');
                setPhone('');
                setCompany('');
                setNotes('');
                setValue('0.00');
                setSubmitSuccess(false);
              }}
            >
              Submit Another Inquiry
            </Button>
          </div>
        ) : (
          <>
            <div className="text-left mb-8">
              <h2 className="text-xl font-bold text-foreground">{formDetail?.name}</h2>
              <p className="text-xs text-muted-foreground mt-1">{formDetail?.description || 'Please complete the details below.'}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-semibold text-foreground">Full Name *</label>
                <Input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. John Doe"
                  required 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-semibold text-foreground">Email Address</label>
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="john@example.com"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-semibold text-foreground">Phone Number</label>
                  <Input 
                    type="text" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-semibold text-foreground">Company Name</label>
                  <Input 
                    type="text" 
                    value={company} 
                    onChange={e => setCompany(e.target.value)} 
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-semibold text-foreground">Estimated Deal Size ($)</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={value} 
                    onChange={e => setValue(e.target.value)} 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-semibold text-foreground">Inquiry Details</label>
                <textarea 
                  className="flex w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring min-h-[100px]" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="How can we assist you?"
                />
              </div>

              <Button type="submit" className="w-full mt-4" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? 'Submitting...' : 'Submit Inquiry'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};


// --- WORKSPACE LAYOUT WRAPPER ---
interface WorkspaceLayoutProps {
  user: User;
  children: React.ReactNode;
}

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({ children }) => {
  const getPageTitle = () => {
    const path = window.location.pathname;
    if (path === '/') return 'Dashboard Overview';
    if (path.startsWith('/leads')) return 'Leads Pipeline';
    if (path.startsWith('/teams')) return 'Sales Teams Organization';
    if (path.startsWith('/forms')) return 'Public Forms Manager';
    if (path.startsWith('/commissions')) return 'Commissions Hub';
    if (path.startsWith('/tasks')) return 'My Tasks & Reminders';
    return 'CRM Platform';
  };

  return (
    <>
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-background relative">
        <header className="h-[70px] border-b border-border/80 flex items-center justify-between px-8 bg-card/40 backdrop-blur-xl sticky top-0 z-40">
          <h2 className="text-lg font-bold text-foreground">{getPageTitle()}</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground bg-muted/40 px-3 py-1 rounded-full border border-border/40">
              Server: {new Date().toLocaleDateString()}
            </span>
          </div>
        </header>
        <div className="flex-1">
          {children}
        </div>
      </main>
    </>
  );
};

// --- CORE APP ---
function App() {
  const user = useAuthStore(state => state.user);

  return (
    <Router>
      <Routes>
        {/* Public portal submission */}
        <Route path="/public-form/:id" element={<PublicForm />} />
        
        {/* Authentication */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login />} 
        />

        {/* Protected Dashboard pages */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              {user && <WorkspaceLayout user={user}><Dashboard user={user} /></WorkspaceLayout>}
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/leads" 
          element={
            <ProtectedRoute>
              {user && <WorkspaceLayout user={user}><Leads user={user} /></WorkspaceLayout>}
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/teams" 
          element={
            <ProtectedRoute>
              <AdminRoute>
                {user && <WorkspaceLayout user={user}><Teams /></WorkspaceLayout>}
              </AdminRoute>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/forms" 
          element={
            <ProtectedRoute>
              <AdminRoute>
                {user && <WorkspaceLayout user={user}><Forms /></WorkspaceLayout>}
              </AdminRoute>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/commissions" 
          element={
            <ProtectedRoute>
              {user && <WorkspaceLayout user={user}><Commissions user={user} /></WorkspaceLayout>}
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/tasks" 
          element={
            <ProtectedRoute>
              {user && <WorkspaceLayout user={user}><Tasks /></WorkspaceLayout>}
            </ProtectedRoute>
          } 
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
