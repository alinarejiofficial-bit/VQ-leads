import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { api, type SalesTeam, type User } from '../../api';
import { Button } from '../../components/forms/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/forms/Input';
import { Dialog } from '../../components/common/Dialog';
import { Plus } from 'lucide-react';

export const Teams: React.FC = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get('tab') || 'members';

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex gap-4">
          {[
            { id: 'members', label: 'Members', path: '/teams' },
            { id: 'roles', label: 'Roles', path: '/teams?tab=roles' },
            { id: 'performance', label: 'Performance', path: '/teams?tab=performance' }
          ].map(t => (
            <a key={t.id} href={t.path} className={`pb-4 -mb-4 px-2 text-sm font-medium ${tab === t.id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {t.label}
            </a>
          ))}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsAgentModalOpen(true)}>
            <Plus size={16} className="mr-1.5" /> Register Sales Agent User
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} className="mr-1.5" /> Create Sales Team
          </Button>
        </div>
      </div>

      {tab === 'members' && (

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
                        className="text-[10px] font-semibold bg-muted/40 border border-border/55 px-2 py-0.5 rounded text-muted-foreground"
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
      )}

      {tab === 'roles' && (
        <div className="p-6 bg-card rounded-xl border border-border/40 text-muted-foreground text-left">
          <p>This is the Roles view. Here you can configure permissions and access levels for different team roles.</p>
        </div>
      )}

      {tab === 'performance' && (
        <div className="p-6 bg-card rounded-xl border border-border/40 text-muted-foreground text-left">
          <p>This is the Performance view. Shows team metrics, conversion rates, and leaderboard.</p>
        </div>
      )}

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
            <label className="text-xs font-semibold text-foreground">Username *</label>
            <Input 
              type="text" 
              value={agentUser} 
              onChange={e => setAgentUser(e.target.value)} 
              required 
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">Password *</label>
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
export default Teams;
