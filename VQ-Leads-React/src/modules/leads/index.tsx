import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type User, type Lead } from '../../api';
import { Button } from '../../components/forms/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/forms/Input';
import { Dialog } from '../../components/common/Dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/datatable/Table';
import { LeadDetailsDrawer } from './components/LeadDetailsDrawer';
import { MyLeadsPipeline } from './components/MyLeadsPipeline';
import { Plus, Search, UserCheck } from 'lucide-react';

interface LeadsProps {
  user: User;
}

export const Leads: React.FC<LeadsProps> = ({ user }) => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const urlFilter = searchParams.get('filter');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  const isAdmin = user.profile.role === 'ADMIN';
  const canClaimLeads = !isAdmin;

  useEffect(() => {
    if (!urlFilter) {
      setSearch('');
      setStatusFilter('');
      setSourceFilter('');
      setOwnerFilter('');
    }
    setViewMode(isAdmin ? 'list' : 'pipeline');
  }, [location.search, urlFilter, isAdmin]);

  // Form states for new lead
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadValue, setNewLeadValue] = useState('0.00');
  const [newLeadSource, setNewLeadSource] = useState('Manual Entry');
  const [newLeadOwner, setNewLeadOwner] = useState<number | null>(null);

  const canClaimLead = (lead: Lead) => canClaimLeads && !lead.owner;

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
      queryClient.invalidateQueries({ queryKey: ['agent-dashboard'] });
    }
  });

  const claimLeadMutation = useMutation({
    mutationFn: api.claimLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['agent-dashboard'] });
      setViewMode('pipeline');
    },
    onError: (err: Error) => {
      alert(err.message || 'Failed to claim lead');
    }
  });

  const handleClaimLead = (e: React.MouseEvent, leadId: number) => {
    e.stopPropagation();
    claimLeadMutation.mutate(leadId);
  };

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

    let matchesSidebarFilter = true;
    if (urlFilter === 'available') {
      matchesSidebarFilter = !l.owner;
    } else if (urlFilter === 'claimed') {
      matchesSidebarFilter = !!l.owner;
    } else if (urlFilter === 'my') {
      matchesSidebarFilter = l.owner === user.id;
    } else if (urlFilter === 'converted') {
      matchesSidebarFilter = l.status === 'WON';
    } else if (urlFilter === 'lost') {
      matchesSidebarFilter = l.status === 'LOST';
    }

    return matchesSearch && matchesStatus && matchesSource && matchesOwner && matchesSidebarFilter;
  });

  const myPipelineLeads = filteredLeads.filter(
    l => l.owner === user.id && l.status !== 'WON' && l.status !== 'LOST'
  );
  const pipelineLeads = isAdmin
    ? filteredLeads.filter(l => l.status !== 'WON' && l.status !== 'LOST')
    : myPipelineLeads;
  const availableLeads = filteredLeads.filter(l => canClaimLead(l));

  const sources = Array.from(new Set(leads.map(l => l.source)));

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
            {!isAdmin && (
              <button
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${viewMode === 'pipeline' ? 'bg-secondary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setViewMode('pipeline')}
              >
                Pipeline
              </button>
            )}
            <button
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${viewMode === 'list' ? 'bg-secondary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>

          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} className="mr-1.5" /> New Lead
          </Button>
        </div>
      </div>

      {/* Pipeline view — claimed leads with quick actions */}
      {viewMode === 'pipeline' && !isAdmin ? (
        <div className="space-y-8">
          <MyLeadsPipeline
            leads={pipelineLeads}
            onStatusChange={moveLeadStatus}
            onEdit={setSelectedLeadId}
            isUpdating={updateLeadMutation.isPending}
          />
          {pipelineLeads.length === 0 && (
            <div className="text-center text-muted-foreground py-12 border border-dashed border-border/60 rounded-xl">
              No leads in pipeline yet.
            </div>
          )}
          {availableLeads.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-foreground text-left">
                Available to Claim ({availableLeads.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {availableLeads.map(l => (
                  <div key={l.id} className="bg-card border border-border/80 rounded-xl p-4 text-left">
                    <h4 className="font-bold text-foreground">{l.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{l.source} • ${l.value}</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-4 border-primary/50 text-primary hover:bg-primary/10"
                      disabled={claimLeadMutation.isPending}
                      onClick={e => handleClaimLead(e, l.id)}
                    >
                      <UserCheck size={14} className="mr-1.5" /> Claim Lead
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
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
                {canClaimLeads && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={canClaimLeads ? 8 : 7} className="text-center text-muted-foreground py-10">
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
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${l.status === 'NEW' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
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
                    {canClaimLeads && (
                      <TableCell onClick={e => e.stopPropagation()}>
                        {canClaimLead(l) ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs border-primary/50 text-primary hover:bg-primary/10"
                            disabled={claimLeadMutation.isPending}
                            onClick={e => handleClaimLead(e, l.id)}
                          >
                            <UserCheck size={14} className="mr-1" /> Claim
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
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
export default Leads;
