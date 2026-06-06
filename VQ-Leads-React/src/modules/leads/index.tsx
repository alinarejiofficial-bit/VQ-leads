import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { api, type User, type Lead } from '../../api';
import { Button } from '../../components/forms/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/forms/Input';
import { Dialog } from '../../components/common/Dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/datatable/Table';
import { LeadDetailsDrawer } from './components/LeadDetailsDrawer';
import { Plus, Search, Download } from 'lucide-react';

// Mapping of lead status to Tailwind color classes
const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  NEW: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
  AVAILABLE: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
  CLAIMED: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
  CONTACTED: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' },
  QUALIFIED: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400' },
  FOLLOW_UP: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400' },
  PROPOSAL_SENT: { bg: 'bg-teal-500/10', border: 'border-teal-500/20', text: 'text-teal-400' },
  NEGOTIATION: { bg: 'bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-400' },
  CONVERTED: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
  LOST: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' },
  DUPLICATE: { bg: 'bg-gray-500/10', border: 'border-gray-500/20', text: 'text-gray-400' },
  INVALID: { bg: 'bg-gray-800/10', border: 'border-gray-800/20', text: 'text-gray-300' },
};

interface LeadsProps {
  user: User;
}

export const Leads: React.FC<LeadsProps> = ({ user }) => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
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
  const isLeaderOrAdmin = isAdmin || user.profile.role === 'LEADER';

  // Apply URL filters
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filter = params.get('filter');
    // reset all filters first
    setStatusFilter('');
    setOwnerFilter('');

    if (filter) {
      if (filter === 'my') {
        setOwnerFilter(String(user.id));
      } else {
        const validStatuses = ['NEW', 'AVAILABLE', 'CLAIMED', 'CONTACTED', 'QUALIFIED', 'FOLLOW_UP', 'PROPOSAL_SENT', 'NEGOTIATION', 'CONVERTED', 'LOST', 'DUPLICATE', 'INVALID'];
        const formattedFilter = filter.toUpperCase();
        if (validStatuses.includes(formattedFilter)) {
          setStatusFilter(formattedFilter);
        }
      }
    }
  }, [location.search, user]);
  const { data: leads = [], refetch: refetchLeads } = useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: api.getLeads,
  });



  const { data: agents = [] } = useQuery<User[]>({
    queryKey: ['agents'],
    queryFn: api.getAgents,
    enabled: isLeaderOrAdmin
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

  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      alert("No leads to export.");
      return;
    }
    const headers = ["ID", "Name", "Company", "Email", "Phone", "Status", "Source", "Value ($)", "Owner", "Created Date"];
    const rows = filteredLeads.map(l => [
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${(l.company || '').replace(/"/g, '""')}"`,
      `"${l.email || ''}"`,
      `"${l.phone || ''}"`,
      l.status,
      `"${l.source.replace(/"/g, '""')}"`,
      l.value,
      `"${(l.owner_name || 'Unassigned').replace(/"/g, '""')}"`,
      new Date(l.created_at).toLocaleDateString()
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vq_leads_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sources = Array.from(new Set(leads.map(l => l.source)));

  const kanbanColumns = [
    { id: 'NEW', title: 'New', color: 'bg-blue-500' },
    { id: 'AVAILABLE', title: 'Available', color: 'bg-cyan-500' },
    { id: 'CLAIMED', title: 'Claimed', color: 'bg-purple-500' },
    { id: 'CONTACTED', title: 'Contacted', color: 'bg-orange-500' },
    { id: 'QUALIFIED', title: 'Qualified', color: 'bg-indigo-500' },
    { id: 'FOLLOW_UP', title: 'Follow‑up', color: 'bg-yellow-500' },
    { id: 'PROPOSAL_SENT', title: 'Proposal Sent', color: 'bg-teal-500' },
    { id: 'NEGOTIATION', title: 'Negotiation', color: 'bg-pink-500' },
    { id: 'CONVERTED', title: 'Converted', color: 'bg-green-500' },
    { id: 'LOST', title: 'Lost', color: 'bg-red-500' },
    { id: 'DUPLICATE', title: 'Duplicate', color: 'bg-gray-500' },
    { id: 'INVALID', title: 'Invalid', color: 'bg-gray-800' },
  ];

  return (
    <div className="p-8 space-y-6 animate-fade-in">
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
            <option value="AVAILABLE">Available</option>
            <option value="CLAIMED">Claimed</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="FOLLOW_UP">Follow-up</option>
            <option value="PROPOSAL_SENT">Proposal Sent</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="CONVERTED">Converted</option>
            <option value="LOST">Lost</option>
            <option value="DUPLICATE">Duplicate</option>
            <option value="INVALID">Invalid</option>
          </select>

          <select 
            className="flex h-10 rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer"
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
          >
            <option value="">All Sources</option>
            {sources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {isLeaderOrAdmin && (
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

          <Button variant="outline" onClick={handleExportCSV}>
            <Download size={16} className="mr-1.5" /> Export CSV
          </Button>

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
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
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
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                    No leads match your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                  filteredLeads.map((l, idx) => (
                  <TableRow
                    key={l.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
                    onClick={() => setSelectedLeadId(l.id)}
                  >
                    <TableCell className="font-semibold text-foreground">
                      <div>{l.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Click to view details →</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.email || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.phone || '-'}</TableCell>
                    <TableCell>{l.company || '-'}</TableCell>
                    <TableCell>{l.source}</TableCell>
                    <TableCell className="font-semibold">${l.value}</TableCell>
                    <TableCell>
                      {l.owner_name ? l.owner_name : (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs italic">Unassigned</span>
                          {!isLeaderOrAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateLeadMutation.mutate({ id: l.id, data: { owner: user.id, status: 'CLAIMED' } });
                              }}
                              className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded hover:bg-primary/30 transition-colors"
                            >
                              Claim
                            </button>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${(() => {
                        const colors = statusColors[l.status];
                        return colors ? `${colors.bg} ${colors.border} ${colors.text}` : 'bg-gray-500/10 border-gray-500/20 text-gray-400';
                      })()}`}>
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
              <div key={col.id} className="flex-1 min-w-[280px] max-w-[340px] bg-card/40 border border-border/80 rounded-xl p-4 flex flex-col max-h-[calc(100vh-190px)] shrink-0 animate-fade-in">
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
                  {colLeads.map((l, idx) => (
                    <div 
                      key={l.id} 
                      className="bg-card border border-border/80 rounded-lg p-4 cursor-pointer hover:border-border/100 hover:shadow-lg transition-all text-left animate-fade-in-up"
                      style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
                      onClick={() => setSelectedLeadId(l.id)}
                    >
                      <h5 className="text-sm font-semibold text-foreground leading-snug">{l.name}</h5>
                      <p className="text-xs text-muted-foreground mt-1 mb-3">{l.company || 'No Company'}</p>
                      
                      <div className="flex justify-between items-center text-xs mt-2 pt-2.5 border-t border-border/40">
                        <span className="font-semibold text-foreground">${l.value}</span>
                        {l.owner_name ? (
                          <span className="text-[10px] bg-muted/40 border border-border/40 px-1.5 py-0.5 rounded text-muted-foreground max-w-[100px] truncate">
                            {l.owner_name}
                          </span>
                        ) : !isLeaderOrAdmin ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateLeadMutation.mutate({ id: l.id, data: { owner: user.id, status: 'CLAIMED' } });
                            }}
                            className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded hover:bg-primary/30 transition-colors"
                          >
                            Claim
                          </button>
                        ) : (
                          <span className="text-[10px] bg-muted/40 border border-border/40 px-1.5 py-0.5 rounded text-muted-foreground italic">
                            Unassigned
                          </span>
                        )}
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
            <label className="text-xs font-semibold text-foreground">Contact Name *</label>
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

          {isLeaderOrAdmin && (
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
export default Leads;
