import React, { useState, useEffect } from 'react';
import { api, type Lead, type LeadActivity, type Task, type FollowUp, type User } from '../../../api';
import { Button } from '../../../components/forms/Button';
import { Input } from '../../../components/forms/Input';
import { OwnerLabel } from '../../../components/common/OwnerLabel';
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
  UserCheck,
  Clock,
  FileText,
  MessageSquare,
  FileBox,
  Pencil
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
  const [activeTab, setActiveTab] = useState<'overview' | 'calls' | 'notes' | 'tasks' | 'followups' | 'emails' | 'documents' | 'timeline'>('overview');
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
  const [editingFollowupId, setEditingFollowupId] = useState<number | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  // Custom log states
  const [callSubject, setCallSubject] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('PDF');

  const isAdmin = currentUser.profile.role === 'ADMIN';
  const isLeaderOrAdmin = isAdmin || currentUser.profile.role === 'LEADER';
  const canClaimLead = !isAdmin && lead && !lead.owner;

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
      setActiveTab('overview');
      setEditingFollowupId(null);
      setEditingTaskId(null);
      setFollowupTime('');
      setFollowupNotes('');
      setTaskTitle('');
      setTaskDueDate('');
      setTaskAssignedTo(currentUser.id);
    }
  }, [isOpen, leadId]);

  if (!isOpen) return null;

  if (loading && !lead) {
    return (
      <>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
        <div className="fixed right-0 top-0 bottom-0 w-[680px] max-w-full bg-[#0d0e15] border-l border-border shadow-2xl z-50 flex flex-col p-6 items-center justify-center text-muted-foreground text-sm font-semibold animate-pulse">
          Loading lead details...
        </div>
      </>
    );
  }

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
      await api.addLeadNote(lead.id, `[NOTE] ${noteText.trim()}`);
      setNoteText('');
      fetchLeadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add note');
    }
  };

  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callSubject.trim() || !lead) return;
    try {
      await api.addLeadNote(lead.id, `[CALL] Subject: ${callSubject.trim()} - Notes: ${callNotes.trim()}`);
      setCallSubject('');
      setCallNotes('');
      fetchLeadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to log call');
    }
  };

  const handleLogEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubject.trim() || !lead) return;
    try {
      await api.addLeadNote(lead.id, `[EMAIL] Subject: ${emailSubject.trim()} - Body: ${emailBody.trim()}`);
      setEmailSubject('');
      setEmailBody('');
      fetchLeadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to log email');
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !lead) return;
    try {
      await api.addLeadNote(lead.id, `[DOC] File: ${docName.trim()} (${docType})`);
      setDocName('');
      fetchLeadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload document');
    }
  };

  const toDatetimeLocalValue = (dateString: string) => {
    const d = new Date(dateString);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskDueDate('');
    setTaskAssignedTo(currentUser.id);
  };

  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setTaskTitle(task.title);
    setTaskDueDate(task.due_date ? toDatetimeLocalValue(task.due_date) : '');
    setTaskAssignedTo(task.assigned_to);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !lead) return;
    try {
      if (editingTaskId) {
        await api.updateTask(editingTaskId, {
          title: taskTitle,
          due_date: taskDueDate || null,
          assigned_to: taskAssignedTo,
        });
        cancelEditTask();
      } else {
        await api.createTask({
          lead: lead.id,
          title: taskTitle,
          due_date: taskDueDate || null,
          assigned_to: taskAssignedTo,
          status: 'PENDING'
        });
        setTaskTitle('');
        setTaskDueDate('');
      }
      fetchLeadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save task');
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

  const cancelEditFollowup = () => {
    setEditingFollowupId(null);
    setFollowupTime('');
    setFollowupNotes('');
  };

  const startEditFollowup = (followup: FollowUp) => {
    setEditingFollowupId(followup.id);
    setFollowupTime(toDatetimeLocalValue(followup.scheduled_time));
    setFollowupNotes(followup.notes || '');
  };

  const handleSaveFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupTime || !lead) return;
    try {
      if (editingFollowupId) {
        await api.updateFollowUp(editingFollowupId, {
          scheduled_time: followupTime,
          notes: followupNotes,
        });
        cancelEditFollowup();
      } else {
        await api.createFollowUp({
          lead: lead.id,
          scheduled_time: followupTime,
          notes: followupNotes,
          completed: false
        });
        setFollowupTime('');
        setFollowupNotes('');
      }
      fetchLeadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save follow-up');
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

  const handleClaimLead = async () => {
    if (!lead) return;
    try {
      await api.claimLead(lead.id);
      onLeadUpdated();
      fetchLeadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to claim lead');
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

  // Timeline Statistics Calculations
  const calls = activities.filter(a => a.description.startsWith('[CALL]'));
  const notes = activities.filter(a => a.description.startsWith('[NOTE]') || a.activity_type === 'NOTE_ADDED');
  const emails = activities.filter(a => a.description.startsWith('[EMAIL]'));
  const docs = activities.filter(a => a.description.startsWith('[DOC]'));
  const statusChanges = activities.filter(a => a.activity_type === 'STATUS_CHANGE');

  const createdDate = lead ? formatDate(lead.created_at) : 'N/A';
  const claimedActivity = activities.find(a => a.description.toLowerCase().includes('claimed') || a.activity_type === 'CLAIM');
  const claimedDate = claimedActivity ? formatDate(claimedActivity.created_at) : (lead?.owner ? 'Assigned' : 'Unclaimed');

  return (
    <>
      {/* Overlay backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      
      {/* Side-Drawer panel (Wider to support tabs and statistics elegantly) */}
      <div className="fixed right-0 top-0 bottom-0 w-[680px] max-w-full bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-slide-in text-left">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/10">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-foreground">{lead?.name || 'Loading Lead...'}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-bold text-muted-foreground uppercase">Source: {lead?.source}</span>
              <span className="text-[10px] bg-primary/10 px-2 py-0.5 rounded font-bold text-primary uppercase">Value: ${lead?.value}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canClaimLead && (
              <Button
                type="button"
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/10"
                onClick={handleClaimLead}
              >
                <UserCheck size={15} className="mr-1.5" /> Claim Lead
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* 8-Tab Navigation Bar */}
        <div className="flex flex-wrap border-b border-border px-6 select-none bg-muted/10 overflow-x-auto gap-0.5">
          {([
            { id: 'overview', label: 'Overview' },
            { id: 'calls', label: 'Calls', count: calls.length },
            { id: 'notes', label: 'Notes', count: notes.length },
            { id: 'tasks', label: 'Tasks', count: tasks.length },
            { id: 'followups', label: 'Follow-ups', count: followups.length },
            { id: 'emails', label: 'Emails', count: emails.length },
            { id: 'documents', label: 'Documents', count: docs.length },
            { id: 'timeline', label: 'Timeline' }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-3 text-xs font-semibold border-b-2 -mb-[2px] transition-all capitalize whitespace-nowrap cursor-pointer ${
                activeTab === tab.id 
                  ? 'text-primary border-primary font-bold' 
                  : 'text-muted-foreground hover:text-foreground border-transparent'
              }`}
            >
              <span>{tab.label}</span>
              {'count' in tab && tab.count! > 0 && (
                <span className="ml-1 text-[9px] bg-secondary px-1.5 py-0.2 rounded font-black text-muted-foreground">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Drawer Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* ==================== 1. OVERVIEW TAB ==================== */}
          {activeTab === 'overview' && lead && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Lead Information Card */}
                <div className="bg-card/40 border border-border/80 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-border pb-2 flex items-center gap-1.5">
                    <FileText size={13} /> Lead Information
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-semibold text-foreground">{lead.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-semibold text-foreground">{lead.phone || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-semibold text-foreground truncate max-w-[180px]">{lead.email || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-bold text-xs uppercase bg-primary/10 text-primary px-2.5 py-0.5 rounded border border-primary/25">{lead.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Value</span>
                      <span className="font-semibold text-foreground">${lead.value}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Owner</span>
                      <span className="font-semibold"><OwnerLabel name={lead.owner_name} ownerId={lead.owner} /></span>
                    </div>
                  </div>
                </div>

                {/* Timeline Metrics Card */}
                <div className="bg-card/40 border border-border/80 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-border pb-2 flex items-center gap-1.5">
                    <Clock size={13} /> Timeline Summary
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Created Date</span>
                      <span className="font-semibold text-foreground">{createdDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Claimed Date</span>
                      <span className="font-semibold text-foreground">{claimedDate}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/40">
                      <div className="flex justify-between text-xs bg-secondary/30 p-2 rounded">
                        <span className="text-muted-foreground">Calls</span>
                        <span className="font-bold text-foreground">{calls.length}</span>
                      </div>
                      <div className="flex justify-between text-xs bg-secondary/30 p-2 rounded">
                        <span className="text-muted-foreground">Notes</span>
                        <span className="font-bold text-foreground">{notes.length}</span>
                      </div>
                      <div className="flex justify-between text-xs bg-secondary/30 p-2 rounded">
                        <span className="text-muted-foreground">Tasks</span>
                        <span className="font-bold text-foreground">{tasks.length}</span>
                      </div>
                      <div className="flex justify-between text-xs bg-secondary/30 p-2 rounded">
                        <span className="text-muted-foreground">Emails</span>
                        <span className="font-bold text-foreground">{emails.length}</span>
                      </div>
                      <div className="flex justify-between text-xs bg-secondary/30 p-2 rounded col-span-2">
                        <span className="text-muted-foreground">Status Changes</span>
                        <span className="font-bold text-foreground">{statusChanges.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Editable Fields Form */}
              <form onSubmit={handleUpdateDetails} className="bg-card/25 border border-border/50 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Update Settings</h4>
                
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-semibold text-foreground">Company</label>
                  <div className="relative">
                    <Briefcase size={15} className="absolute left-3 top-3 text-muted-foreground" />
                    <Input 
                      type="text" 
                      className="pl-9 bg-card/60"
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
                        className="pl-9 bg-card/60"
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
                        className="pl-9 bg-card/60"
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
                        className="pl-9 bg-card/60"
                        value={editValue} 
                        onChange={e => setEditValue(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-xs font-semibold text-foreground">Status</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-card/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer"
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

                {isLeaderOrAdmin ? (
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-xs font-semibold text-foreground">Owner Assignment</label>
                    <div className="relative">
                      <UserCheck size={15} className="absolute left-3 top-3 text-muted-foreground" />
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-card/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring pl-9 cursor-pointer"
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
                    {lead.owner ? (
                      <Input 
                        type="text" 
                        disabled 
                        value={lead.owner_name} 
                      />
                    ) : (
                      <div className="flex gap-2">
                        <Input 
                          type="text" 
                          disabled 
                          value="Unassigned"
                          className="flex-1"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="border-primary/50 text-primary hover:bg-primary/10 whitespace-nowrap"
                          onClick={handleClaimLead}
                        >
                          Claim
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-border/40">
                  <Button type="submit" className="flex-1">Save Changes</Button>
                </div>
              </form>
            </div>
          )}

          {/* ==================== 2. CALL LOGS TAB ==================== */}
          {activeTab === 'calls' && lead && (
            <div className="space-y-6">
              <form onSubmit={handleLogCall} className="bg-card/40 border border-border/80 rounded-2xl p-5 space-y-4 text-left">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5"><Phone size={13} /> Log New Call</h4>
                <div className="flex flex-col gap-1.5">
                  <Input 
                    type="text" 
                    placeholder="Call topic/subject..." 
                    value={callSubject}
                    onChange={e => setCallSubject(e.target.value)}
                    required
                    className="bg-card/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <textarea 
                    placeholder="Provide details about the conversation..." 
                    className="flex w-full rounded-md border border-input bg-card/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring min-h-[80px]"
                    value={callNotes}
                    onChange={e => setCallNotes(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full">Save Call Log</Button>
              </form>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Call History</h4>
                {calls.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-10 border border-dashed border-border/60 rounded-xl">No calls logged yet.</div>
                ) : (
                  calls.map(c => (
                    <div key={c.id} className="p-4 rounded-xl border border-border/60 bg-card/20 text-left">
                      <div className="text-[10px] text-muted-foreground">{formatDate(c.created_at)}</div>
                      <p className="text-xs font-semibold text-foreground mt-1">{c.description.replace('[CALL] ', '')}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ==================== 3. NOTES TAB ==================== */}
          {activeTab === 'notes' && lead && (
            <div className="space-y-6">
              <form onSubmit={handleAddNote} className="bg-card/40 border border-border/80 rounded-2xl p-5 space-y-4 text-left">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5"><MessageSquare size={13} /> Add Note</h4>
                <div className="flex flex-col gap-1.5">
                  <textarea 
                    placeholder="Enter notes description..." 
                    className="flex w-full rounded-md border border-input bg-card/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring min-h-[100px]"
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Create Note</Button>
              </form>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notes list</h4>
                {notes.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-10 border border-dashed border-border/60 rounded-xl">No notes added.</div>
                ) : (
                  notes.map(n => (
                    <div key={n.id} className="p-4 rounded-xl border border-border/60 bg-card/20 text-left">
                      <div className="text-[10px] text-muted-foreground">{formatDate(n.created_at)}</div>
                      <p className="text-xs text-foreground mt-1 whitespace-pre-wrap">{n.description.replace('[NOTE] ', '')}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ==================== 4. TASKS TAB ==================== */}
          {activeTab === 'tasks' && lead && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Checklist</h4>
                {tasks.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-10 border border-dashed border-border/60 rounded-xl">No tasks assigned.</div>
                ) : (
                  tasks.map(t => (
                    <div key={t.id} className={`flex items-start gap-3 p-3.5 rounded-xl border bg-card/20 ${editingTaskId === t.id ? 'border-primary/50' : 'border-border/60'}`}>
                      <button type="button" className="text-muted-foreground hover:text-foreground mt-0.5 cursor-pointer" onClick={() => handleToggleTask(t)}>
                        {t.status === 'COMPLETED' ? (
                          <CheckCircle size={16} className="text-green-400 animate-pulse" />
                        ) : (
                          <Circle size={16} />
                        )}
                      </button>
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <span className={`text-sm font-semibold ${t.status === 'COMPLETED' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {t.title}
                        </span>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
                          {t.due_date && <span className="flex items-center gap-1"><Calendar size={10} /> Due: {formatDate(t.due_date)}</span>}
                          <span>Assigned: {t.assigned_to_details?.first_name || 'System'}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-primary p-1 rounded-md hover:bg-primary/10 transition-colors shrink-0"
                        onClick={() => startEditTask(t)}
                        title="Edit task"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSaveTask} className="border-t border-border/40 pt-5 space-y-4 text-left">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {editingTaskId ? 'Edit Task' : 'Add Task'}
                </h4>
                <div className="flex flex-col gap-1.5">
                  <Input 
                    type="text" 
                    placeholder="Task title..." 
                    value={taskTitle} 
                    onChange={e => setTaskTitle(e.target.value)} 
                    required
                    className="bg-card/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Due Date</label>
                    <Input 
                      type="datetime-local" 
                      value={taskDueDate} 
                      onChange={e => setTaskDueDate(e.target.value)} 
                      className="bg-card/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Assign To</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-card/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer"
                      value={taskAssignedTo}
                      onChange={e => setTaskAssignedTo(Number(e.target.value))}
                    >
                      <option value={currentUser.id}>Assign to Me</option>
                      {isLeaderOrAdmin && agents.map(a => (
                        <option key={a.id} value={a.id}>{a.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  {editingTaskId && (
                    <Button type="button" variant="outline" className="flex-1" onClick={cancelEditTask}>
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" className={editingTaskId ? 'flex-1' : 'w-full'}>
                    {editingTaskId ? 'Update Task' : <><Plus size={15} className="mr-1" /> Create Task</>}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ==================== 5. FOLLOW-UPS TAB ==================== */}
          {activeTab === 'followups' && lead && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Reminders</h4>
                {followups.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-10 border border-dashed border-border/60 rounded-xl">No followups scheduled.</div>
                ) : (
                  followups.map(f => (
                    <div key={f.id} className={`flex items-start gap-3 p-3.5 rounded-xl border bg-card/20 ${editingFollowupId === f.id ? 'border-primary/50' : 'border-border/60'}`}>
                      <button type="button" className="text-muted-foreground hover:text-foreground mt-0.5 cursor-pointer" onClick={() => handleToggleFollowup(f)}>
                        {f.completed ? (
                          <CheckCircle size={16} className="text-green-400" />
                        ) : (
                          <Circle size={16} />
                        )}
                      </button>
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <span className={`text-sm font-semibold ${f.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {f.notes || 'Followup call'}
                        </span>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
                          <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(f.scheduled_time)}</span>
                          <span>Scheduled by: {f.created_by_name}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-primary p-1 rounded-md hover:bg-primary/10 transition-colors shrink-0"
                        onClick={() => startEditFollowup(f)}
                        title="Edit reminder"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSaveFollowup} className="border-t border-border/40 pt-5 space-y-4 text-left">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {editingFollowupId ? 'Edit Follow-up' : 'Schedule Follow-up'}
                </h4>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Scheduled Date & Time</label>
                  <Input 
                    type="datetime-local" 
                    value={followupTime} 
                    onChange={e => setFollowupTime(e.target.value)} 
                    required
                    className="bg-card/50"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Reminder Notes</label>
                  <textarea 
                    placeholder="Reminder notes/instructions..." 
                    className="flex w-full rounded-md border border-input bg-card/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring min-h-[60px]" 
                    value={followupNotes} 
                    onChange={e => setFollowupNotes(e.target.value)} 
                  />
                </div>
                <div className="flex gap-2">
                  {editingFollowupId && (
                    <Button type="button" variant="outline" className="flex-1" onClick={cancelEditFollowup}>
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" className={editingFollowupId ? 'flex-1' : 'w-full'}>
                    {editingFollowupId ? 'Update Reminder' : <><Plus size={15} className="mr-1" /> Schedule Reminder</>}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ==================== 6. EMAILS TAB ==================== */}
          {activeTab === 'emails' && lead && (
            <div className="space-y-6">
              <form onSubmit={handleLogEmail} className="bg-card/40 border border-border/80 rounded-2xl p-5 space-y-4 text-left">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5"><Mail size={13} /> Log New Email</h4>
                <div className="flex flex-col gap-1.5">
                  <Input 
                    type="text" 
                    placeholder="Email subject..." 
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    required
                    className="bg-card/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <textarea 
                    placeholder="Log email content here..." 
                    className="flex w-full rounded-md border border-input bg-card/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring min-h-[100px]"
                    value={emailBody}
                    onChange={e => setEmailBody(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full">Save Email Log</Button>
              </form>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Correspondence</h4>
                {emails.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-10 border border-dashed border-border/60 rounded-xl">No emails logged.</div>
                ) : (
                  emails.map(e => (
                    <div key={e.id} className="p-4 rounded-xl border border-border/60 bg-card/20 text-left">
                      <div className="text-[10px] text-muted-foreground">{formatDate(e.created_at)}</div>
                      <p className="text-xs font-semibold text-foreground mt-1">{e.description.replace('[EMAIL] ', '')}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ==================== 7. DOCUMENTS TAB ==================== */}
          {activeTab === 'documents' && lead && (
            <div className="space-y-6">
              <form onSubmit={handleAddDocument} className="bg-card/40 border border-border/80 rounded-2xl p-5 space-y-4 text-left">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5"><FileBox size={13} /> Attach Document</h4>
                <div className="flex flex-col gap-1.5">
                  <Input 
                    type="text" 
                    placeholder="Document title/filename (e.g. Agreement.pdf)..." 
                    value={docName}
                    onChange={e => setDocName(e.target.value)}
                    required
                    className="bg-card/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Document Type</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-card/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer"
                    value={docType}
                    onChange={e => setDocType(e.target.value)}
                  >
                    <option value="PDF">PDF Contract</option>
                    <option value="Spreadsheet">Excel Spreadsheet</option>
                    <option value="Invoice">Receipt/Invoice</option>
                    <option value="Image">ID/Business Card Scan</option>
                  </select>
                </div>
                <Button type="submit" className="w-full">Link Document</Button>
              </form>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Documents folder</h4>
                {docs.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-10 border border-dashed border-border/60 rounded-xl">No documents linked yet.</div>
                ) : (
                  docs.map(d => (
                    <div key={d.id} className="p-4 rounded-xl border border-border/60 bg-card/20 text-left flex justify-between items-center">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-foreground">{d.description.replace('[DOC] ', '')}</span>
                        <span className="text-[9px] text-muted-foreground">{formatDate(d.created_at)}</span>
                      </div>
                      <a href="#" onClick={(e) => { e.preventDefault(); alert('Downloading mock document'); }} className="text-xs text-primary font-bold hover:underline">Download</a>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ==================== 8. TIMELINE TAB ==================== */}
          {activeTab === 'timeline' && lead && (
            <div className="space-y-6">
              <div className="space-y-4 text-left">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Raw Activity History</h4>
                {activities.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-6">No activity logged.</div>
                ) : (
                  <div className="relative border-l border-border pl-6 ml-3 space-y-6">
                    {activities.map(act => (
                      <div key={act.id} className="relative">
                        {/* Dot Indicator */}
                        <span className={`absolute -left-[30px] top-1.5 h-2.2 w-2.2 rounded-full border border-background ${
                          act.description.startsWith('[CALL]') ? 'bg-emerald-500' :
                          act.description.startsWith('[EMAIL]') ? 'bg-blue-400' :
                          act.description.startsWith('[DOC]') ? 'bg-cyan-500' :
                          act.activity_type === 'CREATED' ? 'bg-blue-600' :
                          act.activity_type === 'STATUS_CHANGE' ? 'bg-amber-500' :
                          act.activity_type === 'ASSIGNMENT' ? 'bg-purple-500' :
                          act.activity_type === 'NOTE_ADDED' ? 'bg-slate-400' :
                          act.activity_type === 'TASK_CREATED' ? 'bg-indigo-500' :
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

        </div>
      </div>
    </>
  );
};

export default LeadDetailsDrawer;
