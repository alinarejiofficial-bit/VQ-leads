import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type User, type Lead, type DashboardStats } from '../../api';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/forms/Input';

import { LeadDetailsDrawer } from '../leads/components/LeadDetailsDrawer';
import {
  Search,
  Briefcase,
  Trophy,
  XCircle,
  TrendingUp,
  Phone,
  ThumbsUp,
  ThumbsDown,
  Award,
  Trash2,
  FileEdit,
  Sparkles
} from 'lucide-react';

interface AgentDashboardProps {
  user: User;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({ user }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  // Fetch data
  const { data: leads = [], isLoading, refetch: refetchLeads } = useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: api.getLeads,
  });

  useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: api.getDashboardStats,
  });

  // Mutations
  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Lead> }) => api.updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  // Agent-specific metrics
  const myLeads = leads.filter(l => l.owner === user.id);
  const myPipeline = myLeads.filter(l => !['CONVERTED', 'LOST'].includes(l.status));
  const myConverted = myLeads.filter(l => l.status === 'CONVERTED').length;
  const myLost = myLeads.filter(l => l.status === 'LOST').length;
  const conversionRate = myConverted + myLost > 0
    ? Math.round((myConverted / (myConverted + myLost)) * 100)
    : 0;

  // Available leads (unassigned)
  const availableLeads = leads.filter(l => !l.owner);
  const sources = Array.from(new Set(leads.map(l => l.source)));
  const filteredAvailable = availableLeads.filter(lead => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.company || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = sourceFilter === 'All' || lead.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  // Handlers
  const handleClaimLead = (leadId: number, leadName: string) => {
    updateLeadMutation.mutate(
      { id: leadId, data: { owner: user.id, status: 'CLAIMED' as any } },
      {
        onSuccess: () => {
          showSuccess(`Successfully claimed lead "${leadName}"! It's now in your pipeline.`);
        },
      }
    );
  };

  const handleStatusChange = (leadId: number, newStatus: string, leadName: string) => {
    updateLeadMutation.mutate(
      { id: leadId, data: { status: newStatus as any } },
      {
        onSuccess: () => {
          if (newStatus === 'CONVERTED') {
            showSuccess(`🎉 Spectacular! Lead "${leadName}" has been successfully converted!`);
          } else if (newStatus === 'LOST') {
            showSuccess(`Lead "${leadName}" status updated to Lost.`);
          } else {
            showSuccess(`Lead "${leadName}" status updated to ${newStatus}.`);
          }
        },
      }
    );
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  const formatCurrency = (amount: string | number) => {
    const val = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(val)) return '$0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      NEW: 'New',
      AVAILABLE: 'Available',
      CLAIMED: 'Pipeline',
      CONTACTED: 'Contacted',
      QUALIFIED: 'Qualified',
      FOLLOW_UP: 'Follow-up',
      PROPOSAL_SENT: 'Proposal',
      NEGOTIATION: 'Negotiation',
      CONVERTED: 'Converted',
      LOST: 'Lost',
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      NEW: 'bg-blue-500/15 text-blue-600 border-blue-500/25',
      AVAILABLE: 'bg-cyan-500/15 text-cyan-600 border-cyan-500/25',
      CLAIMED: 'bg-violet-500/15 text-violet-600 border-violet-500/25',
      CONTACTED: 'bg-orange-500/15 text-orange-600 border-orange-500/25',
      QUALIFIED: 'bg-indigo-500/15 text-indigo-600 border-indigo-500/25',
      FOLLOW_UP: 'bg-amber-500/15 text-amber-600 border-amber-500/25',
      PROPOSAL_SENT: 'bg-teal-500/15 text-teal-600 border-teal-500/25',
      NEGOTIATION: 'bg-pink-500/15 text-pink-600 border-pink-500/25',
      CONVERTED: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25',
      LOST: 'bg-red-500/15 text-red-600 border-red-500/25',
    };
    return map[status] || 'bg-gray-500/15 text-gray-600 border-gray-500/25';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } },
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-[calc(100vh-70px)]">
        <div className="text-muted-foreground text-sm font-semibold animate-pulse">
          Loading your dashboard...
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto text-left"
    >
      {/* Success Banner */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 px-5 py-3 rounded-xl text-sm font-semibold flex items-center gap-2"
        >
          <Sparkles size={16} className="text-emerald-500" />
          {successMsg}
        </motion.div>
      )}

      {/* KPI Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Active Pipeline */}
        <motion.div variants={itemVariants}>
          <Card className="p-5 border border-border/50 bg-gradient-to-br from-violet-500/5 to-transparent flex items-center justify-between group hover:border-violet-500/30 transition-colors h-full">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider mb-1">
                Active Pipeline
              </span>
              <h3 className="text-3xl font-black text-foreground">{myPipeline.length}</h3>
              <span className="text-[11px] text-muted-foreground mt-0.5">Claimed leads in progress</span>
            </div>
            <div className="p-3 rounded-xl bg-violet-500/10 text-violet-500 group-hover:bg-violet-500/20 transition-colors">
              <Briefcase size={24} />
            </div>
          </Card>
        </motion.div>

        {/* Closed Converted */}
        <motion.div variants={itemVariants}>
          <Card className="p-5 border border-border/50 bg-gradient-to-br from-emerald-500/5 to-transparent flex items-center justify-between group hover:border-emerald-500/30 transition-colors h-full">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider mb-1">
                Closed Converted
              </span>
              <h3 className="text-3xl font-black text-foreground">{myConverted}</h3>
              <span className="text-[11px] text-muted-foreground mt-0.5">Successful conversions</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
              <Trophy size={24} />
            </div>
          </Card>
        </motion.div>

        {/* Closed Rejected */}
        <motion.div variants={itemVariants}>
          <Card className="p-5 border border-border/50 bg-gradient-to-br from-red-500/5 to-transparent flex items-center justify-between group hover:border-red-500/30 transition-colors h-full">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-wider mb-1">
                Closed Rejected
              </span>
              <h3 className="text-3xl font-black text-foreground">{myLost}</h3>
              <span className="text-[11px] text-muted-foreground mt-0.5">Leads dropped</span>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10 text-red-500 group-hover:bg-red-500/20 transition-colors">
              <XCircle size={24} />
            </div>
          </Card>
        </motion.div>

        {/* Conversion Rate */}
        <motion.div variants={itemVariants}>
          <Card className="p-5 border border-border/50 bg-gradient-to-br from-blue-500/5 to-transparent flex items-center justify-between group hover:border-blue-500/30 transition-colors h-full">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider mb-1">
                Conversion Rate
              </span>
              <h3 className="text-3xl font-black text-foreground">{conversionRate}%</h3>
              <span className="text-[11px] text-muted-foreground mt-0.5">Based on closed sales</span>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20 transition-colors">
              <TrendingUp size={24} />
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Main Work Grid: Available Pool + My Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Available Lead Pool (3 cols) */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="lg:col-span-3"
        >
          <Card className="border border-border/60 overflow-hidden h-full flex flex-col">
            {/* Panel Header */}
            <div className="p-5 border-b border-border/40 flex items-center gap-3 bg-secondary/10">
              <span className="text-xl">🌎</span>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                Available Lead Pool
              </h3>
              <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-600 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
                {availableLeads.length} Open
              </span>
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground mb-4">
                These leads are unassigned. Accept a lead to lock it to your account.
              </p>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search available leads by name, email, company..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="h-10 rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer min-w-[140px]"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                >
                  <option value="All">All Sources</option>
                  {sources.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lead Table */}
              {filteredAvailable.length > 0 ? (
                <div className="overflow-x-auto flex-1 -mx-5 px-5">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/40 text-xs text-muted-foreground uppercase tracking-wider">
                        <th className="pb-3 font-bold">Customer Info</th>
                        <th className="pb-3 font-bold">Company</th>
                        <th className="pb-3 font-bold">Source</th>
                        <th className="pb-3 font-bold">Budget</th>
                        <th className="pb-3 font-bold text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredAvailable.map((lead) => (
                        <tr
                          key={lead.id}
                          className="hover:bg-secondary/20 transition-colors group"
                        >
                          <td className="py-3.5">
                            <div
                              className="flex items-center gap-3 cursor-pointer"
                              onClick={() => setSelectedLeadId(lead.id)}
                            >
                              <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[11px] font-black shrink-0">
                                {lead.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                  {lead.name}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {lead.email || 'No email'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 text-sm text-muted-foreground">
                            {lead.company || 'N/A'}
                          </td>
                          <td className="py-3.5">
                            <span className="text-[10px] font-bold bg-secondary px-2 py-0.5 rounded-full text-muted-foreground border border-border/40">
                              {lead.source}
                            </span>
                          </td>
                          <td className="py-3.5 text-sm font-bold text-foreground">
                            {formatCurrency(lead.value)}
                          </td>
                          <td className="py-3.5 text-center">
                            <button
                              onClick={() => handleClaimLead(lead.id, lead.name)}
                              disabled={updateLeadMutation.isPending}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/15 text-emerald-600 text-[11px] font-bold rounded-lg border border-emerald-500/25 hover:bg-emerald-500/25 hover:border-emerald-500/40 transition-all cursor-pointer disabled:opacity-50"
                            >
                              🤝 Claim Lead
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-4xl mb-3">🏖️</span>
                  <h4 className="text-sm font-bold text-foreground mb-1">All caught up!</h4>
                  <p className="text-xs text-muted-foreground max-w-[280px]">
                    {searchTerm || sourceFilter !== 'All'
                      ? 'No available leads match your current search filters.'
                      : 'No unassigned leads exist in the pool right now.'}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Right: My Leads Pipeline (2 cols) */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="lg:col-span-2"
        >
          <Card className="border border-border/60 overflow-hidden h-full flex flex-col">
            {/* Panel Header */}
            <div className="p-5 border-b border-border/40 flex items-center gap-3 bg-secondary/10">
              <span className="text-xl">💼</span>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                My Leads Pipeline ({myLeads.length})
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'thin' }}>
              {myLeads.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {myLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="border border-border/60 rounded-xl p-4 bg-card hover:border-border transition-all flex flex-col gap-3"
                    >
                      {/* Lead Header */}
                      <div className="flex justify-between items-start">
                        <div
                          className="cursor-pointer"
                          onClick={() => setSelectedLeadId(lead.id)}
                        >
                          <h4 className="text-sm font-bold text-foreground hover:text-primary transition-colors">
                            {lead.name}
                          </h4>
                          <span className="text-[11px] text-muted-foreground">
                            {lead.company || 'N/A'} • {formatCurrency(lead.value)}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md border ${getStatusColor(
                            lead.status
                          )}`}
                        >
                          {getStatusLabel(lead.status)}
                        </span>
                      </div>

                      {/* Status Action Buttons */}
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => handleStatusChange(lead.id, 'CONTACTED', lead.name)}
                          className="flex-1 min-w-[70px] inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-orange-500/10 text-orange-600 text-[10px] font-bold rounded-lg border border-orange-500/20 hover:bg-orange-500/20 transition-colors cursor-pointer"
                        >
                          <Phone size={11} /> Contacted
                        </button>
                        <button
                          onClick={() => handleStatusChange(lead.id, 'QUALIFIED', lead.name)}
                          className="flex-1 min-w-[70px] inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-amber-500/10 text-amber-600 text-[10px] font-bold rounded-lg border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
                        >
                          <ThumbsUp size={11} /> Interested
                        </button>
                        <button
                          onClick={() => handleStatusChange(lead.id, 'NEGOTIATION', lead.name)}
                          className="flex-1 min-w-[70px] inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-pink-500/10 text-pink-600 text-[10px] font-bold rounded-lg border border-pink-500/20 hover:bg-pink-500/20 transition-colors cursor-pointer"
                        >
                          <ThumbsDown size={11} /> Not Interested
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleStatusChange(lead.id, 'CONVERTED', lead.name)}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-500/10 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-500/20 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                        >
                          <Award size={11} /> Convert
                        </button>
                        <button
                          onClick={() => handleStatusChange(lead.id, 'LOST', lead.name)}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-red-500/10 text-red-600 text-[10px] font-bold rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-colors cursor-pointer"
                        >
                          <Trash2 size={11} /> Drop
                        </button>
                      </div>

                      {/* Edit Notes Button */}
                      <button
                        onClick={() => setSelectedLeadId(lead.id)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold text-muted-foreground bg-secondary/40 border border-border/40 rounded-lg hover:bg-secondary/70 hover:text-foreground transition-colors cursor-pointer"
                      >
                        <FileEdit size={12} /> Edit Notes & Logs
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-4xl mb-3">🎒</span>
                  <h4 className="text-sm font-bold text-foreground mb-1">Pipeline Empty</h4>
                  <p className="text-xs text-muted-foreground max-w-[240px]">
                    Claim leads from the available pool on the left to start working!
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Lead Details Drawer */}
      <LeadDetailsDrawer
        leadId={selectedLeadId || 0}
        isOpen={selectedLeadId !== null}
        onClose={() => setSelectedLeadId(null)}
        currentUser={user}
        agents={[]}
        onLeadUpdated={refetchLeads}
      />
    </motion.div>
  );
};

export default AgentDashboard;
