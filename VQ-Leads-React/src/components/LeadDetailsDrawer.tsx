import React, { useState, useEffect } from 'react';
import { api, type Lead, type LeadActivity, type Task, type FollowUp, type User } from '../api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { 
  X, 
  Calendar, 
  Plus, 
  CheckCircle, 
  Circle,
  Briefcase,
  Mail,
  Phone,
  DollarSign,
  UserCheck
} from 'lucide-react';

interface LeadDetailsDrawerProps {
  leadId: number;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  agents: User[];
  onLeadUpdated: () => void;
}

export const LeadDetailsDrawer: React.FC<LeadDetailsDrawerProps> = ({
  leadId,
  isOpen,
  onClose,
  currentUser,
  agents,
  onLeadUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'tasks' | 'followups' | 'timeline'>('details');
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit fields
  const [editStatus, setEditStatus] = useState('');
  const [editOwner, setEditOwner] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCompany, setEditCompany] = useState('');

  // Form states
  const [noteText, setNoteText] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState<number>(currentUser.id);
  const [followupTime, setFollowupTime] = useState('');
  const [followupNotes, setFollowupNotes] = useState('');

  const isAdmin = currentUser.profile.role === 'ADMIN';

  const fetchLeadData = async () => {
    try {
      setLoading(true);
      const leadData = await api.getLead(leadId);
      setLead(leadData);
      setEditStatus(leadData.status);
      setEditOwner(leadData.owner);
      setEditValue(leadData.value);
      setEditEmail(leadData.email);
      setEditPhone(leadData.phone);
      setEditCompany(leadData.company);

      const actData = await api.getLeadActivities(leadId);
      setActivities(actData);

      const allTasks = await api.getTasks();
      setTasks(allTasks.filter(t => t.lead === leadId));

      const allFollowups = await api.getFollowUps();
      setFollowups(allFollowups.filter(f => f.lead === leadId));
    } catch (err) {
      console.error('Error fetching lead details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && leadId) {
      fetchLeadData();
      setActiveTab('details');
    }
  }, [isOpen, leadId]);

  if (!isOpen) return null;

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    try {
      await api.updateLead(lead.id, {
        status: editStatus as any,
        owner: editOwner,
        value: editValue,
        email: editEmail,
        phone: editPhone,
        company: editCompany
      });
      onLeadUpdated();
      fetchLeadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update lead');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !lead) return;
    try {
      await api.addLeadNote(lead.id, noteText);
      setNoteText('');
      const actData = await api.getLeadActivities(lead.id);
      setActivities(actData);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add note');
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !lead) return;
    try {
      await api.createTask({
        lead: lead.id,
        title: taskTitle,
        due_date: taskDueDate || null,
        assigned_to: taskAssignedTo,
        status: 'PENDING'
      });
      setTaskTitle('');
      setTaskDueDate('');
      fetchLeadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const newStatus = task.status === 'PENDING' ? 'COMPLETED' : 'PENDING';
      await api.updateTask(task.id, { status: newStatus });
      fetchLeadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const handleAddFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupTime || !lead) return;
    try {
      await api.createFollowUp({
        lead: lead.id,
        scheduled_time: followupTime,
        notes: followupNotes,
        completed: false
      });
      setFollowupTime('');
      setFollowupNotes('');
      fetchLeadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to schedule follow-up');
    }
  };

  const handleToggleFollowup = async (followup: FollowUp) => {
    try {
      await api.updateFollowUp(followup.id, { completed: !followup.completed });
      fetchLeadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update follow-up');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Overlay backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      
      {/* Side-Drawer panel */}
      <div className="fixed right-0 top-0 bottom-0 w-[500px] max-w-full bg-[#0d0e15] border-l border-border shadow-2xl z-50 flex flex-col animate-slide-in text-left">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-bold text-foreground">{lead?.name || 'Loading Lead...'}</h3>
            <span className="text-xs text-muted-foreground">Source: {lead?.source}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        {/* Custom tabs row */}
        <div className="flex border-b border-border px-6 select-none bg-muted/10">
          {(['details', 'tasks', 'followups', 'timeline'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-xs font-semibold border-b-2 -mb-[2px] transition-all capitalize ${
                activeTab === tab 
                  ? 'text-primary-foreground border-primary' 
                  : 'text-muted-foreground hover:text-foreground border-transparent'
              }`}
            >
              {tab === 'followups' ? 'Follow-ups' : tab}
              {tab === 'tasks' && ` (${tasks.length})`}
              {tab === 'followups' && ` (${followups.length})`}
            </button>
          ))}
        </div>

        {/* Drawer Body content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && !lead ? (
            <div className="text-center text-sm text-muted-foreground py-10 animate-pulse">Fetching details...</div>
          ) : (
            <>
              {/* DETAILS TAB */}
              {activeTab === 'details' && lead && (
                <form onSubmit={handleUpdateDetails} className="space-y-4">
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-xs font-semibold text-foreground">Company</label>
                    <div className="relative">
                      <Briefcase size={15} className="absolute left-3 top-3 text-muted-foreground" />
                      <Input 
                        type="text" 
                        className="pl-9"
                        value={editCompany} 
                        onChange={e => setEditCompany(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-xs font-semibold text-foreground">Email</label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3 top-3 text-muted-foreground" />
                        <Input 
                          type="email" 
                          className="pl-9"
                          value={editEmail} 
                          onChange={e => setEditEmail(e.target.value)} 
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-xs font-semibold text-foreground">Phone</label>
                      <div className="relative">
                        <Phone size={15} className="absolute left-3 top-3 text-muted-foreground" />
                        <Input 
                          type="text" 
                          className="pl-9"
                          value={editPhone} 
                          onChange={e => setEditPhone(e.target.value)} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-xs font-semibold text-foreground">Value ($)</label>
                      <div className="relative">
                        <DollarSign size={15} className="absolute left-3 top-3 text-muted-foreground" />
                        <Input 
                          type="number" 
                          className="pl-9"
                          value={editValue} 
                          onChange={e => setEditValue(e.target.value)} 
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-xs font-semibold text-foreground">Status</label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer"
                        value={editStatus} 
                        onChange={e => setEditStatus(e.target.value)}
                      >
                        <option value="NEW">New</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="QUALIFIED">Qualified</option>
                        <option value="WON">Won</option>
                        <option value="LOST">Lost</option>
                      </select>
                    </div>
                  </div>

                  {isAdmin ? (
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-xs font-semibold text-foreground">Owner Assignment (Admin Only)</label>
                      <div className="relative">
                        <UserCheck size={15} className="absolute left-3 top-3 text-muted-foreground" />
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring pl-9 cursor-pointer"
                          value={editOwner || ''} 
                          onChange={e => setEditOwner(e.target.value ? Number(e.target.value) : null)}
                        >
                          <option value="">Unassigned</option>
                          {agents.map(a => (
                            <option key={a.id} value={a.id}>{a.full_name} ({a.username})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-xs font-semibold text-foreground">Owner</label>
                      <Input 
                        type="text" 
                        disabled 
                        value={lead.owner_name} 
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-border/40">
                    <Button type="submit" className="flex-1">Save Changes</Button>
                    <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                  </div>
                </form>
              )}

              {/* TASKS TAB */}
              {activeTab === 'tasks' && lead && (
                <div className="space-y-6">
                  {/* Task checklist */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Checklist</h4>
                    {tasks.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground py-6 border border-dashed border-border/60 rounded-lg">No tasks assigned.</div>
                    ) : (
                      tasks.map(t => (
                        <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/45 bg-muted/10">
                          <button type="button" className="text-muted-foreground hover:text-foreground mt-0.5" onClick={() => handleToggleTask(t)}>
                            {t.status === 'COMPLETED' ? (
                              <CheckCircle size={16} className="text-green-400" />
                            ) : (
                              <Circle size={16} />
                            )}
                          </button>
                          <div className="flex flex-col gap-1">
                            <span className={`text-sm font-medium ${t.status === 'COMPLETED' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {t.title}
                            </span>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                              {t.due_date && <span className="flex items-center gap-1"><Calendar size={10} /> Due: {formatDate(t.due_date)}</span>}
                              <span>Assigned: {t.assigned_to_details?.first_name || 'System'}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add task form */}
                  <form onSubmit={handleAddTask} className="border-t border-border/40 pt-4 space-y-4 text-left">
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Add Task</h4>
                    <div className="flex flex-col gap-1">
                      <Input 
                        type="text" 
                        placeholder="Task title..." 
                        value={taskTitle} 
                        onChange={e => setTaskTitle(e.target.value)} 
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">Due Date</label>
                        <Input 
                          type="datetime-local" 
                          value={taskDueDate} 
                          onChange={e => setTaskDueDate(e.target.value)} 
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">Assign To</label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer"
                          value={taskAssignedTo}
                          onChange={e => setTaskAssignedTo(Number(e.target.value))}
                        >
                          <option value={currentUser.id}>Assign to Me</option>
                          {isAdmin && agents.map(a => (
                            <option key={a.id} value={a.id}>{a.full_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <Button type="submit" className="w-full">
                      <Plus size={15} className="mr-1" /> Create Task
                    </Button>
                  </form>
                </div>
              )}

              {/* FOLLOW-UPS TAB */}
              {activeTab === 'followups' && lead && (
                <div className="space-y-6">
                  {/* Followups list */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Reminders</h4>
                    {followups.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground py-6 border border-dashed border-border/60 rounded-lg">No followups scheduled.</div>
                    ) : (
                      followups.map(f => (
                        <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/45 bg-muted/10">
                          <button type="button" className="text-muted-foreground hover:text-foreground mt-0.5" onClick={() => handleToggleFollowup(f)}>
                            {f.completed ? (
                              <CheckCircle size={16} className="text-green-400" />
                            ) : (
                              <Circle size={16} />
                            )}
                          </button>
                          <div className="flex flex-col gap-1">
                            <span className={`text-sm font-medium ${f.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {f.notes || 'Followup call'}
                            </span>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(f.scheduled_time)}</span>
                              <span>Scheduled by: {f.created_by_name}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add followup form */}
                  <form onSubmit={handleAddFollowup} className="border-t border-border/40 pt-4 space-y-4 text-left">
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Schedule Follow-up</h4>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-muted-foreground">Scheduled Date & Time</label>
                      <Input 
                        type="datetime-local" 
                        value={followupTime} 
                        onChange={e => setFollowupTime(e.target.value)} 
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-muted-foreground">Reminder Notes</label>
                      <textarea 
                        placeholder="Reminder notes/instructions..." 
                        className="flex w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring min-h-[60px]" 
                        value={followupNotes} 
                        onChange={e => setFollowupNotes(e.target.value)} 
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      <Plus size={15} className="mr-1" /> Schedule Reminder
                    </Button>
                  </form>
                </div>
              )}

              {/* TIMELINE TAB */}
              {activeTab === 'timeline' && lead && (
                <div className="space-y-6">
                  {/* Note input */}
                  <form onSubmit={handleAddNote} className="space-y-2 text-right">
                    <textarea 
                      placeholder="Add a new audit note to this lead..." 
                      className="flex w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring min-h-[70px]" 
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      required
                    />
                    <Button type="submit" size="sm">Add Note</Button>
                  </form>

                  {/* Timeline list */}
                  <div className="space-y-4 text-left">
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Activity History</h4>
                    {activities.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground py-6">No activity logged.</div>
                    ) : (
                      <div className="relative border-l border-border pl-6 ml-3 space-y-6">
                        {activities.map(act => (
                          <div key={act.id} className="relative">
                            {/* Dot Indicator */}
                            <span className={`absolute -left-[30px] top-1.5 h-2 w-2 rounded-full border border-background ${
                              act.activity_type === 'CREATED' ? 'bg-blue-500' :
                              act.activity_type === 'STATUS_CHANGE' ? 'bg-amber-500' :
                              act.activity_type === 'ASSIGNMENT' ? 'bg-purple-500' :
                              act.activity_type === 'NOTE_ADDED' ? 'bg-slate-400' :
                              act.activity_type === 'TASK_CREATED' ? 'bg-primary' :
                              'bg-green-500'
                            }`} />
                            <div className="text-[10px] text-muted-foreground">{formatDate(act.created_at)}</div>
                            <div className="text-xs font-bold text-foreground mt-0.5 uppercase tracking-wide">
                              {act.activity_type.replace(/_/g, ' ')}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{act.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};
