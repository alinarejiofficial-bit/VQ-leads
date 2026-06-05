import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate,
  useParams
} from 'react-router-dom';
import { api, type User, type Lead, type SalesTeam, type LeadForm, type Task, type FollowUp, type Commission, type DashboardStats, type DashboardCharts } from './api';
import { Sidebar } from './components/Sidebar';
import { LineChart, DonutChart } from './components/CustomCharts';
import { Modal } from './components/Modal';
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
  user: User | null;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <div className="app-container">{children}</div>;
};

interface AdminRouteProps {
  user: User | null;
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ user, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  if (user.profile.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
};

// --- PAGES ---

// 1. LOGIN PAGE
const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.login(username, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (user: string, pass: string) => {
    setError('');
    setLoading(true);
    try {
      await api.login(user, pass);
      navigate('/');
    } catch (err) {
      setError('Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">VQ</div>
        <div className="login-header">
          <h2 className="login-title">Sign In</h2>
          <p className="login-subtitle">Access VQ Leads CRM Portal</p>
        </div>

        {error && (
          <div style={{ background: 'var(--danger-glow)', border: '1px solid var(--danger-border)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-control" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="demo-credentials">
          <div className="demo-title">Quick Demo Login</div>
          <div className="demo-buttons">
            <button className="demo-btn" onClick={() => handleQuickLogin('admin', 'admin123')}>
              <span>Sarah Conner (Admin)</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>admin</span>
            </button>
            <button className="demo-btn" onClick={() => handleQuickLogin('agent1', 'agent123')}>
              <span>Alice Smith (Agent - 8.5%)</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>agent1</span>
            </button>
            <button className="demo-btn" onClick={() => handleQuickLogin('agent2', 'agent123')}>
              <span>Bob Jones (Agent - 12.0%)</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>agent2</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. DASHBOARD PAGE
const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const s = await api.getDashboardStats();
      const c = await api.getDashboardCharts();
      setStats(s);
      setCharts(c);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="page-content"><div className="empty-state">Loading metrics...</div></div>;
  }

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  // Convert status map to Donut chart format
  const donutData = stats ? [
    { label: 'New', value: stats.statusBreakdown.NEW || 0, color: 'var(--info)' },
    { label: 'Contacted', value: stats.statusBreakdown.CONTACTED || 0, color: 'var(--accent)' },
    { label: 'In Progress', value: stats.statusBreakdown.IN_PROGRESS || 0, color: 'var(--warning)' },
    { label: 'Qualified', value: stats.statusBreakdown.QUALIFIED || 0, color: 'var(--success)' },
    { label: 'Won', value: stats.statusBreakdown.WON || 0, color: '#34d399' },
    { label: 'Lost', value: stats.statusBreakdown.LOST || 0, color: 'var(--danger)' }
  ] : [];

  return (
    <div className="page-content">
      <div className="dashboard-grid">
        <div className="stat-card accent">
          <div className="stat-info">
            <span className="stat-label">Total Leads</span>
            <span className="stat-value">{stats?.totalLeads || 0}</span>
          </div>
          <div className="stat-icon-wrapper">
            <Briefcase size={22} />
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-info">
            <span className="stat-label">Conversion Rate</span>
            <span className="stat-value">{stats?.conversionRate || 0}%</span>
          </div>
          <div className="stat-icon-wrapper">
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-info">
            <span className="stat-label">Pipeline Value</span>
            <span className="stat-value">{formatCurrency(stats?.pipelineValue || 0)}</span>
          </div>
          <div className="stat-icon-wrapper">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-info">
            <span className="stat-label">{user.profile.role === 'ADMIN' ? 'Total Commission' : 'My Commission'}</span>
            <span className="stat-value">{formatCurrency(stats?.earnedCommissions || 0)}</span>
          </div>
          <div className="stat-icon-wrapper">
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Lead Ingestion Timeline (Past 15 Days)</h3>
          </div>
          {charts && <LineChart data={charts.leadsTimeline} />}
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Status Distribution</h3>
          </div>
          <DonutChart data={donutData} />
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: user.profile.role === 'ADMIN' ? '1fr 1fr' : '1fr' }}>
        {user.profile.role === 'ADMIN' && (
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Agent Performance Leaderboard</h3>
            </div>
            <div className="leaderboard-list">
              {charts?.leaderboard && charts.leaderboard.length > 0 ? (
                charts.leaderboard.map((item, idx) => (
                  <div key={idx} className="leaderboard-item">
                    <span className={`leaderboard-rank rank-${idx + 1}`}>{idx + 1}</span>
                    <div className="leaderboard-info">
                      <span className="leaderboard-name">{item.agent}</span>
                      <span className="leaderboard-meta">Username: {item.username}</span>
                    </div>
                    <div className="leaderboard-stats">
                      <div className="leaderboard-revenue">{formatCurrency(item.revenue)}</div>
                      <div className="leaderboard-won">{item.wonLeads} won leads</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">No agent data available</div>
              )}
            </div>
          </div>
        )}

        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Lead Sources</h3>
          </div>
          <div className="leaderboard-list">
            {stats?.sourceBreakdown && Object.keys(stats.sourceBreakdown).length > 0 ? (
              Object.entries(stats.sourceBreakdown).map(([source, count], idx) => (
                <div key={idx} className="leaderboard-item">
                  <div className="leaderboard-info" style={{ marginLeft: 0 }}>
                    <span className="leaderboard-name">{source}</span>
                  </div>
                  <div className="leaderboard-stats">
                    <div className="leaderboard-revenue" style={{ color: 'var(--text-h)' }}>{count} Leads</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No source details available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. LEADS BOARD & KANBAN PAGE
const Leads: React.FC<{ user: User }> = ({ user }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
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

  const fetchLeads = async () => {
    try {
      const data = await api.getLeads();
      setLeads(data);
      if (user.profile.role === 'ADMIN') {
        const ags = await api.getAgents();
        setAgents(ags);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLead({
        name: newLeadName,
        email: newLeadEmail,
        phone: newLeadPhone,
        company: newLeadCompany,
        value: newLeadValue,
        source: newLeadSource,
        owner: newLeadOwner || null,
        status: 'NEW'
      });
      // Reset
      setNewLeadName('');
      setNewLeadEmail('');
      setNewLeadPhone('');
      setNewLeadCompany('');
      setNewLeadValue('0.00');
      setNewLeadSource('Manual Entry');
      setNewLeadOwner(null);
      setIsModalOpen(false);
      fetchLeads();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create lead');
    }
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

  // Kanban groupings
  const kanbanColumns = [
    { id: 'NEW', title: 'New', color: 'new' },
    { id: 'CONTACTED', title: 'Contacted', color: 'contacted' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'in_progress' },
    { id: 'QUALIFIED', title: 'Qualified', color: 'qualified' },
    { id: 'WON', title: 'Won', color: 'won' },
    { id: 'LOST', title: 'Lost', color: 'lost' }
  ];

  const moveLeadStatus = async (leadId: number, status: string) => {
    try {
      await api.updateLead(leadId, { status: status as any });
      fetchLeads();
    } catch (err) {
      alert('Error updating status');
    }
  };

  return (
    <div className="page-content">
      <div className="table-controls">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search leads, companies..." 
              className="search-input" 
              style={{ paddingLeft: '38px' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <select 
            className="select-filter"
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
            className="select-filter"
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
          >
            <option value="">All Sources</option>
            {sources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {user.profile.role === 'ADMIN' && (
            <select 
              className="select-filter"
              value={ownerFilter}
              onChange={e => setOwnerFilter(e.target.value)}
            >
              <option value="">All Owners</option>
              <option value="unassigned">Unassigned</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
            </select>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="view-switcher">
            <button 
              className={`switch-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button 
              className={`switch-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              Kanban
            </button>
          </div>

          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> New Lead
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="table-card">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Source</th>
                <th>Value</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No leads found
                  </td>
                </tr>
              ) : (
                filteredLeads.map(l => (
                  <tr key={l.id} onClick={() => setSelectedLeadId(l.id)}>
                    <td style={{ fontWeight: '600', color: 'var(--text-h)' }}>{l.name}</td>
                    <td>{l.company || '-'}</td>
                    <td>{l.source}</td>
                    <td style={{ fontWeight: '600' }}>${l.value}</td>
                    <td>{l.owner_name}</td>
                    <td>
                      <span className={`status-badge ${l.status.toLowerCase()}`}>
                        {l.status}
                      </span>
                    </td>
                    <td>{new Date(l.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="kanban-board">
          {kanbanColumns.map(col => {
            const colLeads = filteredLeads.filter(l => l.status === col.id);
            return (
              <div key={col.id} className="kanban-column">
                <div className="kanban-column-header">
                  <div className="column-title-group">
                    <span className={`column-indicator ${col.color}`} />
                    <h4 className="column-title">{col.title}</h4>
                  </div>
                  <span className="column-count">{colLeads.length}</span>
                </div>
                
                <div className="kanban-cards-container">
                  {colLeads.map(l => (
                    <div 
                      key={l.id} 
                      className="kanban-card"
                      onClick={() => setSelectedLeadId(l.id)}
                    >
                      <h5 className="kanban-card-title">{l.name}</h5>
                      <div className="kanban-card-company">{l.company || 'No Company'}</div>
                      <div className="kanban-card-footer">
                        <span className="kanban-card-value">${l.value}</span>
                        <span className="kanban-card-owner">{l.owner_name}</span>
                      </div>
                      
                      {/* Simple action to slide lead status manually from board */}
                      <div style={{ display: 'flex', gap: '4px', marginTop: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                        {kanbanColumns.map(targetCol => {
                          if (targetCol.id === col.id) return null;
                          return (
                            <button
                              key={targetCol.id}
                              className="btn btn-sm"
                              style={{ padding: '2px 4px', fontSize: '9px', textTransform: 'uppercase' }}
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
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add New Lead"
      >
        <form onSubmit={handleCreateLead} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Contact Name</label>
            <input 
              type="text" 
              className="form-control" 
              value={newLeadName} 
              onChange={e => setNewLeadName(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input 
              type="text" 
              className="form-control" 
              value={newLeadCompany} 
              onChange={e => setNewLeadCompany(e.target.value)} 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input 
                type="email" 
                className="form-control" 
                value={newLeadEmail} 
                onChange={e => setNewLeadEmail(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input 
                type="text" 
                className="form-control" 
                value={newLeadPhone} 
                onChange={e => setNewLeadPhone(e.target.value)} 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Deal Value ($)</label>
              <input 
                type="number" 
                step="0.01"
                className="form-control" 
                value={newLeadValue} 
                onChange={e => setNewLeadValue(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Lead Source</label>
              <input 
                type="text" 
                className="form-control" 
                value={newLeadSource} 
                onChange={e => setNewLeadSource(e.target.value)} 
              />
            </div>
          </div>

          {user.profile.role === 'ADMIN' && (
            <div className="form-group">
              <label className="form-label">Assign Agent (Optional)</label>
              <select 
                className="select-filter"
                style={{ width: '100%', height: '40px' }}
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

          <div className="modal-footer" style={{ border: 'none', padding: '10px 0 0 0' }}>
            <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Lead</button>
          </div>
        </form>
      </Modal>

      {/* Lead details drawer overlay */}
      <LeadDetailsDrawer
        leadId={selectedLeadId || 0}
        isOpen={selectedLeadId !== null}
        onClose={() => setSelectedLeadId(null)}
        currentUser={user}
        agents={agents}
        onLeadUpdated={fetchLeads}
      />
    </div>
  );
};

// 4. SALES TEAMS PAGE (Admin Only)
const Teams: React.FC = () => {
  const [teams, setTeams] = useState<SalesTeam[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
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

  const fetchData = async () => {
    try {
      const t = await api.getTeams();
      setTeams(t);
      const a = await api.getAgents();
      setAgents(a);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTeam({
        name: newTeamName,
        description: newTeamDesc,
        leader: newTeamLeader,
        members: newTeamMembers
      });
      setNewTeamName('');
      setNewTeamDesc('');
      setNewTeamLeader(null);
      setNewTeamMembers([]);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Error creating team');
    }
  };

  const handleRegisterAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAgent({
        username: agentUser,
        password: agentPass,
        email: agentEmail,
        first_name: agentFirst,
        last_name: agentLast,
        commission_rate: agentComm
      });
      setAgentUser('');
      setAgentPass('');
      setAgentEmail('');
      setAgentFirst('');
      setAgentLast('');
      setAgentComm('10.00');
      setIsAgentModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error creating agent');
    }
  };

  const handleMemberToggle = (id: number) => {
    if (newTeamMembers.includes(id)) {
      setNewTeamMembers(newTeamMembers.filter(m => m !== id));
    } else {
      setNewTeamMembers([...newTeamMembers, id]);
    }
  };

  const handleDeleteTeam = async (id: number) => {
    if (!window.confirm('Delete this team?')) return;
    try {
      await api.deleteTeam(id);
      fetchData();
    } catch (err) {
      alert('Failed to delete team');
    }
  };

  return (
    <div className="page-content">
      <div className="table-controls" style={{ justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn" onClick={() => setIsAgentModalOpen(true)}>
            <Plus size={16} /> Register Sales Agent User
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Create Sales Team
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        {teams.map(t => (
          <div key={t.id} className="chart-card" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minHeight: '280px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 className="chart-title" style={{ fontSize: '18px', color: 'var(--text-h)' }}>{t.name}</h3>
              <button 
                className="btn btn-sm" 
                style={{ color: 'var(--danger)', background: 'transparent', border: 'none' }}
                onClick={() => handleDeleteTeam(t.id)}
              >
                Delete
              </button>
            </div>
            <p style={{ fontSize: '13px', margin: '8px 0 16px 0', color: 'var(--text)', flex: 1 }}>
              {t.description || 'No description provided.'}
            </p>
            
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '13px' }}>
                <strong style={{ color: 'var(--text-h)' }}>Team Leader: </strong>
                <span>{t.leader_details?.full_name || 'Unassigned'}</span>
              </div>
              <div style={{ fontSize: '13px' }}>
                <strong style={{ color: 'var(--text-h)' }}>Members ({t.members_details.length}):</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {t.members_details.length === 0 ? (
                    <span style={{ color: 'var(--text-muted)' }}>No members in team</span>
                  ) : (
                    t.members_details.map(m => (
                      <span 
                        key={m.id} 
                        style={{ fontSize: '11px', background: 'rgba(255, 255, 255, 0.03)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}
                      >
                        {m.full_name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Team Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Sales Team">
        <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Team Name</label>
            <input 
              type="text" 
              className="form-control" 
              value={newTeamName} 
              onChange={e => setNewTeamName(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea 
              className="form-control" 
              rows={3} 
              value={newTeamDesc} 
              onChange={e => setNewTeamDesc(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Team Leader</label>
            <select 
              className="select-filter" 
              style={{ width: '100%', height: '40px' }}
              value={newTeamLeader || ''} 
              onChange={e => setNewTeamLeader(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Select Leader...</option>
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.full_name} ({a.username})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Select Members</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px' }}>
              {agents.map(a => (
                <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <input 
                    type="checkbox" 
                    checked={newTeamMembers.includes(a.id)} 
                    onChange={() => handleMemberToggle(a.id)}
                  />
                  <span>{a.full_name} ({a.username})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="modal-footer" style={{ border: 'none', padding: '10px 0 0 0' }}>
            <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Team</button>
          </div>
        </form>
      </Modal>

      {/* Register Agent Modal */}
      <Modal isOpen={isAgentModalOpen} onClose={() => setIsAgentModalOpen(false)} title="Register Sales Agent User">
        <form onSubmit={handleRegisterAgent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-control" 
              value={agentUser} 
              onChange={e => setAgentUser(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={agentPass} 
              onChange={e => setAgentPass(e.target.value)} 
              required 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={agentFirst} 
                onChange={e => setAgentFirst(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={agentLast} 
                onChange={e => setAgentLast(e.target.value)} 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input 
                type="email" 
                className="form-control" 
                value={agentEmail} 
                onChange={e => setAgentEmail(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Commission Rate (%)</label>
              <input 
                type="number" 
                step="0.01"
                className="form-control" 
                value={agentComm} 
                onChange={e => setAgentComm(e.target.value)} 
              />
            </div>
          </div>

          <div className="modal-footer" style={{ border: 'none', padding: '10px 0 0 0' }}>
            <button type="button" className="btn" onClick={() => setIsAgentModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Register Agent</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// 5. LEAD FORMS BUILDER (Admin Only)
const Forms: React.FC = () => {
  const [forms, setForms] = useState<LeadForm[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [mode, setMode] = useState<'MANUAL' | 'ROUND_ROBIN'>('ROUND_ROBIN');
  const [sourceName, setSourceName] = useState('Website Inbound');

  const fetchForms = async () => {
    try {
      const data = await api.getForms();
      setForms(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createForm({
        name,
        description: desc,
        assignment_mode: mode,
        source_name: sourceName,
        is_active: true
      });
      setName('');
      setDesc('');
      setMode('ROUND_ROBIN');
      setSourceName('Website Inbound');
      setIsModalOpen(false);
      fetchForms();
    } catch (err) {
      alert('Error creating lead form');
    }
  };

  const handleDeleteForm = async (id: number) => {
    if (!window.confirm('Delete this lead form?')) return;
    try {
      await api.deleteForm(id);
      fetchForms();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const copyEmbedCode = (id: number) => {
    const publicUrl = `${window.location.origin}/public-form/${id}`;
    const iframeCode = `<iframe src="${publicUrl}" width="100%" height="600" style="border:none;border-radius:12px;"></iframe>`;
    navigator.clipboard.writeText(iframeCode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="page-content">
      <div className="table-controls" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Create Lead Form
        </button>
      </div>

      <div className="table-card">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Assignment Mode</th>
              <th>Source Logged</th>
              <th>Public URL</th>
              <th>Code Snippet</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {forms.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  No lead forms created yet.
                </td>
              </tr>
            ) : (
              forms.map(f => (
                <tr key={f.id}>
                  <td style={{ fontWeight: '600', color: 'var(--text-h)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>{f.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '400' }}>{f.description}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${f.assignment_mode.toLowerCase()}`}>
                      {f.assignment_mode.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{f.source_name}</td>
                  <td>
                    <a 
                      href={`/public-form/${f.id}`} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ color: 'var(--info)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      Open Form <ExternalLink size={12} />
                    </a>
                  </td>
                  <td>
                    <button className="btn btn-sm" onClick={() => copyEmbedCode(f.id)}>
                      {copiedId === f.id ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
                      <span>{copiedId === f.id ? 'Copied Iframe!' : 'Copy Iframe Code'}</span>
                    </button>
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm" 
                      style={{ color: 'var(--danger)', background: 'transparent', border: 'none' }}
                      onClick={() => handleDeleteForm(f.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Form Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Lead Submission Form">
        <form onSubmit={handleCreateForm} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Form Name</label>
            <input 
              type="text" 
              className="form-control" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Website Signup Portal"
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea 
              className="form-control" 
              rows={2} 
              value={desc} 
              onChange={e => setDesc(e.target.value)} 
              placeholder="Describe where this form is displayed"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Assignment Method</label>
              <select 
                className="select-filter" 
                style={{ width: '100%', height: '40px' }}
                value={mode} 
                onChange={e => setMode(e.target.value as any)}
              >
                <option value="ROUND_ROBIN">Round Robin (Auto)</option>
                <option value="MANUAL">Manual Routing</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Logged Lead Source</label>
              <input 
                type="text" 
                className="form-control" 
                value={sourceName} 
                onChange={e => setSourceName(e.target.value)} 
                placeholder="e.g. Inbound Campaign"
                required 
              />
            </div>
          </div>

          <div className="modal-footer" style={{ border: 'none', padding: '10px 0 0 0' }}>
            <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Form</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// 6. COMMISSIONS PAGE
const Commissions: React.FC<{ user: User }> = ({ user }) => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const isAdmin = user.profile.role === 'ADMIN';

  const fetchCommissions = async () => {
    try {
      const data = await api.getCommissions();
      setCommissions(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await api.approveCommission(id);
      fetchCommissions();
    } catch (err) {
      alert('Approval failed');
    }
  };

  const handlePay = async (id: number) => {
    try {
      await api.payCommission(id);
      fetchCommissions();
    } catch (err) {
      alert('Marking as paid failed');
    }
  };

  const handleReject = async (id: number) => {
    if (!window.confirm('Reject this commission?')) return;
    try {
      await api.rejectCommission(id);
      fetchCommissions();
    } catch (err) {
      alert('Rejection failed');
    }
  };

  // Removed unused status filter arrays

  const totalEarned = commissions
    .filter(c => ['APPROVED', 'PAID'].includes(c.status))
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const totalPending = commissions
    .filter(c => c.status === 'PENDING')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="page-content">
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
        <div className="stat-card success">
          <div className="stat-info">
            <span className="stat-label">Commissions Earned</span>
            <span className="stat-value">${totalEarned.toFixed(2)}</span>
          </div>
          <div className="stat-icon-wrapper">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-info">
            <span className="stat-label">Pending Approval</span>
            <span className="stat-value">${totalPending.toFixed(2)}</span>
          </div>
          <div className="stat-icon-wrapper">
            <Sliders size={22} />
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-info">
            <span className="stat-label">Commission Rate</span>
            <span className="stat-value">{user.profile.commission_rate}%</span>
          </div>
          <div className="stat-icon-wrapper">
            <TrendingUp size={22} />
          </div>
        </div>
      </div>

      <div className="table-card">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Lead</th>
              <th>Lead Value</th>
              <th>Agent</th>
              <th>Commission Rate</th>
              <th>Payout Amount</th>
              <th>Status</th>
              <th>Admin Action</th>
            </tr>
          </thead>
          <tbody>
            {commissions.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  No commissions logged.
                </td>
              </tr>
            ) : (
              commissions.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: '600', color: 'var(--text-h)' }}>{c.lead_name}</td>
                  <td>${c.lead_value}</td>
                  <td>{c.agent_details.full_name}</td>
                  <td>{c.rate}%</td>
                  <td style={{ fontWeight: '600', color: 'var(--success)' }}>${c.amount}</td>
                  <td>
                    <span className={`status-badge ${c.status.toLowerCase()}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    {isAdmin && c.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-sm btn-success" onClick={() => handleApprove(c.id)}>
                          Approve
                        </button>
                        <button 
                          className="btn btn-sm" 
                          style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
                          onClick={() => handleReject(c.id)}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {isAdmin && c.status === 'APPROVED' && (
                      <button className="btn btn-sm btn-primary" onClick={() => handlePay(c.id)}>
                        Mark Paid
                      </button>
                    )}
                    {c.status === 'PAID' && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={12} style={{ color: 'var(--success)' }} /> Fully Disbursed
                      </span>
                    )}
                    {c.status === 'REJECTED' && (
                      <span style={{ fontSize: '12px', color: 'var(--danger)' }}>Rejected</span>
                    )}
                    {!isAdmin && c.status === 'PENDING' && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Awaiting review</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 7. TASKS & FOLLOWUPS AGENDA PAGE
const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgenda = async () => {
    try {
      setLoading(true);
      const t = await api.getTasks();
      setTasks(t);
      const f = await api.getFollowUps();
      setFollowups(f);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgenda();
  }, []);

  const handleToggleTask = async (task: Task) => {
    try {
      const newStatus = task.status === 'PENDING' ? 'COMPLETED' : 'PENDING';
      await api.updateTask(task.id, { status: newStatus });
      fetchAgenda();
    } catch (err) {
      alert('Error updating task');
    }
  };

  const handleToggleFollowup = async (f: FollowUp) => {
    try {
      await api.updateFollowUp(f.id, { completed: !f.completed });
      fetchAgenda();
    } catch (err) {
      alert('Error updating reminder');
    }
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

  if (loading) {
    return <div className="page-content"><div className="empty-state">Loading agenda...</div></div>;
  }

  const pendingTasks = tasks.filter(t => t.status === 'PENDING');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const pendingReminders = followups.filter(f => !f.completed);

  return (
    <div className="page-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
      {/* Column 1: Tasks */}
      <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardCheck size={20} style={{ color: 'var(--accent)' }} />
          <span>CRM Checklist Tasks</span>
        </h3>
        
        <div className="task-list-container" style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-h)', textAlign: 'left' }}>
            Pending Tasks ({pendingTasks.length})
          </h4>
          {pendingTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>All clear! No pending tasks.</div>
          ) : (
            pendingTasks.map(t => (
              <div key={t.id} className="task-item">
                <div className="task-checkbox" onClick={() => handleToggleTask(t)}>
                  <Circle size={16} />
                </div>
                <div className="task-details">
                  <span className="task-title">{t.title}</span>
                  <div className="task-meta">
                    {t.lead_name && <span className="task-assigned">Lead: {t.lead_name}</span>}
                    {t.due_date && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={11} /> Due: {formatDate(t.due_date)}</span>}
                  </div>
                </div>
              </div>
            ))
          )}

          <h4 style={{ margin: '20px 0 8px 0', fontSize: '14px', color: 'var(--text-muted)', textAlign: 'left' }}>
            Completed Tasks
          </h4>
          {completedTasks.map(t => (
            <div key={t.id} className="task-item" style={{ opacity: 0.6 }}>
              <div className="task-checkbox checked" onClick={() => handleToggleTask(t)}>
                <CheckCircle size={16} style={{ color: 'var(--success)' }} />
              </div>
              <div className="task-details">
                <span className="task-title completed">{t.title}</span>
                <div className="task-meta">
                  {t.lead_name && <span className="task-assigned">Lead: {t.lead_name}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Column 2: Followups / Reminders */}
      <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={20} style={{ color: 'var(--info)' }} />
          <span>Scheduled Lead Follow-ups</span>
        </h3>

        <div className="task-list-container" style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-h)', textAlign: 'left' }}>
            Upcoming Follow-ups ({pendingReminders.length})
          </h4>
          {pendingReminders.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>No follow-up reminders scheduled.</div>
          ) : (
            pendingReminders.map(f => (
              <div key={f.id} className="task-item">
                <div className="task-checkbox" onClick={() => handleToggleFollowup(f)}>
                  <Circle size={16} />
                </div>
                <div className="task-details">
                  <span className="task-title">{f.notes || 'Unnamed follow-up'}</span>
                  <div className="task-meta">
                    <span className="task-assigned" style={{ background: 'var(--info-glow)', color: 'var(--info)' }}>
                      Lead: {f.lead_name}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={11} /> {formatDate(f.scheduled_time)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// 8. PUBLIC FORM PORTAL
const PublicForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [formDetail, setFormDetail] = useState<LeadForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [value, setValue] = useState('0.00');

  // Success details
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [assignedAgent, setAssignedAgent] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name.trim()) return;
    try {
      setError('');
      setLoading(true);
      const res = await api.submitPublicForm(Number(id), {
        name,
        email,
        phone,
        company,
        notes,
        value
      });
      setAssignedAgent(res.assigned_to);
      setSubmitSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !submitSuccess) {
    return <div className="public-form-page"><div className="empty-state">Loading portal...</div></div>;
  }

  if (error && !submitSuccess) {
    return (
      <div className="public-form-page">
        <div className="public-form-card" style={{ textAlign: 'center' }}>
          <div className="success-icon-wrapper" style={{ background: 'var(--danger-glow)', color: 'var(--danger)', margin: '0 auto 20px auto' }}>
            <X size={32} />
          </div>
          <h3 className="success-title">Portal Inaccessible</h3>
          <p className="success-desc" style={{ marginTop: '10px' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-form-page">
      <div className="public-form-card">
        {submitSuccess ? (
          <div className="success-container">
            <div className="success-icon-wrapper">
              <Check size={32} />
            </div>
            <h3 className="success-title">Submission Received</h3>
            <p className="success-desc">
              Thank you! Your inquiry has been logged in our systems.
              <br />
              {assignedAgent !== 'Unassigned' && (
                <strong style={{ color: 'var(--text-h)', display: 'block', marginTop: '12px' }}>
                  Routed directly to Sales Agent: {assignedAgent}
                </strong>
              )}
            </p>
            <button 
              className="btn btn-primary" 
              style={{ marginTop: '20px' }} 
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
            </button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'left', marginBottom: '24px' }}>
              <h2 className="login-title" style={{ margin: 0 }}>{formDetail?.name}</h2>
              <p className="login-subtitle" style={{ marginTop: '6px' }}>{formDetail?.description || 'Please fill in your requirements below.'}</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. John Doe"
                  required 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="john@example.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={company} 
                    onChange={e => setCompany(e.target.value)} 
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Estimated Deal Size ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-control" 
                    value={value} 
                    onChange={e => setValue(e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Inquiry Message / Notes</label>
                <textarea 
                  className="form-control" 
                  rows={4}
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="How can our sales team help you?"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                Submit Inquiry
              </button>
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

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({ user, children }) => {
  // useNavigate is not needed in this layout wrapper

  // Simple page title selector
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
      <Sidebar user={user} />
      <main className="main-content">
        <header className="top-header">
          <h2 className="page-title">{getPageTitle()}</h2>
          <div className="header-actions">
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Server Time: {new Date().toLocaleDateString()}
            </span>
          </div>
        </header>
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </main>
    </>
  );
};

// --- CORE APP ---
function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vq_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const handleAuth = () => {
      const saved = localStorage.getItem('vq_user');
      setUser(saved ? JSON.parse(saved) : null);
    };
    window.addEventListener('auth_change', handleAuth);
    return () => window.removeEventListener('auth_change', handleAuth);
  }, []);

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
            <ProtectedRoute user={user}>
              {user && <WorkspaceLayout user={user}><Dashboard user={user} /></WorkspaceLayout>}
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/leads" 
          element={
            <ProtectedRoute user={user}>
              {user && <WorkspaceLayout user={user}><Leads user={user} /></WorkspaceLayout>}
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/teams" 
          element={
            <ProtectedRoute user={user}>
              <AdminRoute user={user}>
                {user && <WorkspaceLayout user={user}><Teams /></WorkspaceLayout>}
              </AdminRoute>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/forms" 
          element={
            <ProtectedRoute user={user}>
              <AdminRoute user={user}>
                {user && <WorkspaceLayout user={user}><Forms /></WorkspaceLayout>}
              </AdminRoute>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/commissions" 
          element={
            <ProtectedRoute user={user}>
              {user && <WorkspaceLayout user={user}><Commissions user={user} /></WorkspaceLayout>}
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/tasks" 
          element={
            <ProtectedRoute user={user}>
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
