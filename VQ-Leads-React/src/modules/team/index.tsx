import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { api, type SalesTeam, type User } from '../../api';
import { Button } from '../../components/forms/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/forms/Input';
import { Dialog } from '../../components/common/Dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/datatable/Table';
import { Plus, Pencil, KeyRound, UserCheck, UserX } from 'lucide-react';

export const Teams: React.FC = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get('tab') || 'members';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [newTeamLeader, setNewTeamLeader] = useState<number | null>(null);
  const [newTeamMembers, setNewTeamMembers] = useState<number[]>([]);

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [agentUser, setAgentUser] = useState('');
  const [agentPass, setAgentPass] = useState('');
  const [agentEmail, setAgentEmail] = useState('');
  const [agentFirst, setAgentFirst] = useState('');
  const [agentLast, setAgentLast] = useState('');
  const [agentComm, setAgentComm] = useState('10.00');

  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editComm, setEditComm] = useState('10.00');

  const [resetMember, setResetMember] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const { data: teams = [] } = useQuery<SalesTeam[]>({
    queryKey: ['teams'],
    queryFn: api.getTeams,
  });

  const { data: agents = [], isLoading: agentsLoading } = useQuery<User[]>({
    queryKey: ['agents'],
    queryFn: api.getAgents,
  });

  const activeAgents = agents.filter(a => a.is_active !== false);

  const invalidateAgents = () => {
    queryClient.invalidateQueries({ queryKey: ['agents'] });
    queryClient.invalidateQueries({ queryKey: ['agent-tracking'] });
  };

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

  const addMemberMutation = useMutation({
    mutationFn: api.createAgent,
    onSuccess: () => {
      invalidateAgents();
      setIsAddMemberOpen(false);
      setAgentUser('');
      setAgentPass('');
      setAgentEmail('');
      setAgentFirst('');
      setAgentLast('');
      setAgentComm('10.00');
    },
    onError: (err: Error) => {
      alert(err.message || 'Failed to add member');
    }
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof api.updateAgent>[1] }) =>
      api.updateAgent(id, data),
    onSuccess: () => {
      invalidateAgents();
      setEditingMember(null);
    },
    onError: (err: Error) => alert(err.message || 'Failed to update member'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: api.toggleAgentStatus,
    onSuccess: () => invalidateAgents(),
    onError: (err: Error) => alert(err.message || 'Failed to update status'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      api.resetAgentPassword(id, password),
    onSuccess: () => {
      setResetMember(null);
      setNewPassword('');
      alert('Password reset successfully');
    },
    onError: (err: Error) => alert(err.message || 'Failed to reset password'),
  });

  const deleteTeamMutation = useMutation({
    mutationFn: api.deleteTeam,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
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

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    addMemberMutation.mutate({
      username: agentUser,
      password: agentPass,
      email: agentEmail,
      first_name: agentFirst,
      last_name: agentLast,
      commission_rate: agentComm
    });
  };

  const openEditMember = (member: User) => {
    setEditingMember(member);
    setEditFirst(member.first_name);
    setEditLast(member.last_name);
    setEditEmail(member.email);
    setEditComm(member.profile.commission_rate);
  };

  const handleEditMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    updateMemberMutation.mutate({
      id: editingMember.id,
      data: {
        first_name: editFirst,
        last_name: editLast,
        email: editEmail,
        commission_rate: editComm,
      },
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetMember || !newPassword) return;
    resetPasswordMutation.mutate({ id: resetMember.id, password: newPassword });
  };

  const handleToggleStatus = (member: User) => {
    const action = member.is_active !== false ? 'deactivate' : 'activate';
    if (!window.confirm(`${action === 'deactivate' ? 'Deactivate' : 'Activate'} ${member.full_name}?`)) return;
    toggleStatusMutation.mutate(member.id);
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
        {tab === 'members' && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsAddMemberOpen(true)}>
              <Plus size={16} className="mr-1.5" /> Add Member
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus size={16} className="mr-1.5" /> Create Sales Team
            </Button>
          </div>
        )}
      </div>

      {tab === 'members' && (
        <div className="space-y-8">
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-border/40 text-left">
              <h3 className="text-base font-semibold text-foreground">Team Members</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Manage sales agents and their account access</p>
            </div>
            {agentsLoading ? (
              <div className="p-10 text-center text-sm text-muted-foreground animate-pulse">Loading members...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent cursor-default">
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                        No team members yet. Click &quot;Add Member&quot; to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    agents.map(member => (
                      <TableRow key={member.id}>
                        <TableCell className="font-semibold text-foreground">{member.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">@{member.username}</TableCell>
                        <TableCell>{member.email || '—'}</TableCell>
                        <TableCell>{member.profile.commission_rate}%</TableCell>
                        <TableCell>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                            member.is_active !== false
                              ? 'bg-green-500/10 border-green-500/20 text-green-400'
                              : 'bg-red-500/10 border-red-500/20 text-red-400'
                          }`}>
                            {member.is_active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs"
                              onClick={() => openEditMember(member)}
                              title="Edit Member"
                            >
                              <Pencil size={13} className="mr-1" /> Edit
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs"
                              onClick={() => handleToggleStatus(member)}
                              title={member.is_active !== false ? 'Deactivate' : 'Activate'}
                            >
                              {member.is_active !== false ? (
                                <><UserX size={13} className="mr-1" /> Deactivate</>
                              ) : (
                                <><UserCheck size={13} className="mr-1" /> Activate</>
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs"
                              onClick={() => { setResetMember(member); setNewPassword(''); }}
                              title="Reset Password"
                            >
                              <KeyRound size={13} className="mr-1" /> Reset
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </Card>

          <div>
            <h3 className="text-base font-semibold text-foreground text-left mb-4">Sales Teams</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map(t => (
                <Card key={t.id} className="p-6 flex flex-col justify-between min-h-[240px]">
                  <div className="text-left">
                    <div className="flex justify-between items-start">
                      <h4 className="text-base font-semibold text-foreground leading-snug">{t.name}</h4>
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
          </div>
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
            <Input type="text" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} required />
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
              {activeAgents.map(a => (
                <option key={a.id} value={a.id}>{a.full_name} ({a.username})</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">Select Members</label>
            <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto border border-border/80 p-3 rounded-lg bg-muted/10">
              {activeAgents.map(a => (
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

      {/* Add Member Modal */}
      <Dialog isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} title="Add Member">
        <form onSubmit={handleAddMember} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">Username *</label>
            <Input type="text" value={agentUser} onChange={e => setAgentUser(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">Password *</label>
            <Input type="password" value={agentPass} onChange={e => setAgentPass(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">First Name</label>
              <Input type="text" value={agentFirst} onChange={e => setAgentFirst(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Last Name</label>
              <Input type="text" value={agentLast} onChange={e => setAgentLast(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Email</label>
              <Input type="email" value={agentEmail} onChange={e => setAgentEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Commission Rate (%)</label>
              <Input type="number" step="0.01" value={agentComm} onChange={e => setAgentComm(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
            <Button type="button" variant="outline" onClick={() => setIsAddMemberOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={addMemberMutation.isPending}>
              {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Member Modal */}
      <Dialog isOpen={!!editingMember} onClose={() => setEditingMember(null)} title="Edit Member">
        <form onSubmit={handleEditMember} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">Username</label>
            <Input type="text" value={editingMember?.username || ''} disabled />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">First Name</label>
              <Input type="text" value={editFirst} onChange={e => setEditFirst(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Last Name</label>
              <Input type="text" value={editLast} onChange={e => setEditLast(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Email</label>
              <Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Commission Rate (%)</label>
              <Input type="number" step="0.01" value={editComm} onChange={e => setEditComm(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
            <Button type="button" variant="outline" onClick={() => setEditingMember(null)}>Cancel</Button>
            <Button type="submit" disabled={updateMemberMutation.isPending}>
              {updateMemberMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog isOpen={!!resetMember} onClose={() => setResetMember(null)} title="Reset Password">
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-sm text-muted-foreground text-left">
            Set a new password for <span className="font-semibold text-foreground">{resetMember?.full_name}</span>
          </p>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">New Password *</label>
            <Input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
            <Button type="button" variant="outline" onClick={() => setResetMember(null)}>Cancel</Button>
            <Button type="submit" disabled={resetPasswordMutation.isPending}>
              {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default Teams;
