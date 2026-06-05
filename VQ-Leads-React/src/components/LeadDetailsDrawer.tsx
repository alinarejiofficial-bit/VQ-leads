import React, { useState, useEffect } from 'react';
import { api, type Lead, type LeadActivity, type Task, type FollowUp, type User } from '../api';
import { 
  X, 
  Calendar, 
  Plus, 
  CheckCircle2, 
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
  onLeadUpdated: () => void; // Trigger list refresh
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

  // Fetch lead data
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

      // Filter tasks for this lead
      const allTasks = await api.getTasks();
      setTasks(allTasks.filter(t => t.lead === leadId));

      // Filter followups for this lead
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
      // Reload activities
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
      // Reload tasks & activities
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
      // Reload followups & activities
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
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <div className="drawer-title-group">
            <h3 className="drawer-title">{lead?.name || 'Loading Lead...'}</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Source: {lead?.source}
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="drawer-tabs">
          <button 
            className={`drawer-tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button 
            className={`drawer-tab ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks ({tasks.length})
          </button>
          <button 
            className={`drawer-tab ${activeTab === 'followups' ? 'active' : ''}`}
            onClick={() => setActiveTab('followups')}
          >
            Follow-ups ({followups.length})
          </button>
          <button 
            className={`drawer-tab ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            Timeline
          </button>
        </div>

        <div className="drawer-body">
          {loading && !lead ? (
            <div className="empty-state">Loading details...</div>
          ) : (
            <>
              {/* DETAILS TAB */}
              {activeTab === 'details' && lead && (
                <form onSubmit={handleUpdateDetails} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Company</label>
                    <div style={{ position: 'relative' }}>
                      <Briefcase size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        className="form-control" 
                        style={{ paddingLeft: '38px' }}
                        value={editCompany} 
                        onChange={e => setEditCompany(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                        <input 
                          type="email" 
                          className="form-control" 
                          style={{ paddingLeft: '38px' }}
                          value={editEmail} 
                          onChange={e => setEditEmail(e.target.value)} 
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <div style={{ position: 'relative' }}>
                        <Phone size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                        <input 
                          type="text" 
                          className="form-control" 
                          style={{ paddingLeft: '38px' }}
                          value={editPhone} 
                          onChange={e => setEditPhone(e.target.value)} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Value ($)</label>
                      <div style={{ position: 'relative' }}>
                        <DollarSign size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                        <input 
                          type="number" 
                          className="form-control" 
                          style={{ paddingLeft: '38px' }}
                          value={editValue} 
                          onChange={e => setEditValue(e.target.value)} 
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select 
                        className="select-filter" 
                        style={{ width: '100%', height: '40px' }}
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

                  {isAdmin && (
                    <div className="form-group">
                      <label className="form-label">Owner Assignment (Admin Only)</label>
                      <div style={{ position: 'relative' }}>
                        <UserCheck size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                        <select 
                          className="select-filter" 
                          style={{ width: '100%', height: '40px', paddingLeft: '38px' }}
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
                  )}

                  {!isAdmin && (
                    <div className="form-group">
                      <label className="form-label">Owner</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        disabled 
                        value={lead.owner_name} 
                      />
                    </div>
                  )}

                  <div className="form-row" style={{ marginTop: '10px' }}>
                    <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                      Save Changes
                    </button>
                    <button type="button" className="btn" style={{ justifyContent: 'center' }} onClick={onClose}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* TASKS TAB */}
              {activeTab === 'tasks' && lead && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Task checklist */}
                  <div className="task-list-container">
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: 'var(--text-h)', textAlign: 'left' }}>
                      Checklist
                    </h4>
                    {tasks.length === 0 ? (
                      <div className="empty-state" style={{ padding: '20px 0' }}>No tasks scheduled</div>
                    ) : (
                      tasks.map(t => (
                        <div key={t.id} className="task-item">
                          <div className="task-checkbox" onClick={() => handleToggleTask(t)}>
                            {t.status === 'COMPLETED' ? (
                              <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                            ) : (
                              <Circle size={16} />
                            )}
                          </div>
                          <div className="task-details">
                            <span className={`task-title ${t.status === 'COMPLETED' ? 'completed' : ''}`}>
                              {t.title}
                            </span>
                            <div className="task-meta">
                              {t.due_date && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Calendar size={11} /> Due: {formatDate(t.due_date)}
                                </span>
                              )}
                              <span className="task-assigned">Assigned: {t.assigned_to_details?.first_name || 'System'}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add task form */}
                  <form onSubmit={handleAddTask} style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ margin: '0', fontSize: '15px', color: 'var(--text-h)', textAlign: 'left' }}>
                      Add Task
                    </h4>
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Task title..." 
                        className="form-control" 
                        value={taskTitle} 
                        onChange={e => setTaskTitle(e.target.value)} 
                        required
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Due Date</label>
                        <input 
                          type="datetime-local" 
                          className="form-control" 
                          value={taskDueDate} 
                          onChange={e => setTaskDueDate(e.target.value)} 
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Assign To</label>
                        <select 
                          className="select-filter" 
                          style={{ width: '100%', height: '40px' }}
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
                    <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', marginTop: '10px' }}>
                      <Plus size={16} /> Create Task
                    </button>
                  </form>
                </div>
              )}

              {/* FOLLOW-UPS TAB */}
              {activeTab === 'followups' && lead && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Followups list */}
                  <div className="task-list-container">
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: 'var(--text-h)', textAlign: 'left' }}>
                      Scheduled Reminders
                    </h4>
                    {followups.length === 0 ? (
                      <div className="empty-state" style={{ padding: '20px 0' }}>No followups scheduled</div>
                    ) : (
                      followups.map(f => (
                        <div key={f.id} className="task-item">
                          <div className="task-checkbox" onClick={() => handleToggleFollowup(f)}>
                            {f.completed ? (
                              <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                            ) : (
                              <Circle size={16} />
                            )}
                          </div>
                          <div className="task-details">
                            <span className={`task-title ${f.completed ? 'completed' : ''}`}>
                              {f.notes || 'No description'}
                            </span>
                            <div className="task-meta">
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={11} /> {formatDate(f.scheduled_time)}
                              </span>
                              <span className="task-assigned">By: {f.created_by_name}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add followup form */}
                  <form onSubmit={handleAddFollowup} style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ margin: '0', fontSize: '15px', color: 'var(--text-h)', textAlign: 'left' }}>
                      Schedule Follow-up
                    </h4>
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Scheduled Date & Time</label>
                      <input 
                        type="datetime-local" 
                        className="form-control" 
                        value={followupTime} 
                        onChange={e => setFollowupTime(e.target.value)} 
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <textarea 
                        placeholder="Follow-up notes/instructions..." 
                        className="form-control" 
                        rows={3}
                        value={followupNotes} 
                        onChange={e => setFollowupNotes(e.target.value)} 
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', marginTop: '10px' }}>
                      <Plus size={16} /> Schedule Reminder
                    </button>
                  </form>
                </div>
              )}

              {/* TIMELINE TAB */}
              {activeTab === 'timeline' && lead && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Note input */}
                  <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <textarea 
                      placeholder="Add a new audit note to this lead..." 
                      className="form-control" 
                      rows={3}
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>
                      <Plus size={16} /> Add Note
                    </button>
                  </form>

                  {/* Timeline list */}
                  <div>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: 'var(--text-h)', textAlign: 'left' }}>
                      Activity History
                    </h4>
                    {activities.length === 0 ? (
                      <div className="empty-state">No activities logged</div>
                    ) : (
                      <div className="timeline">
                        {activities.map(act => (
                          <div key={act.id} className="timeline-item">
                            <div className={`timeline-dot ${act.activity_type.toLowerCase()}`} />
                            <div className="timeline-time">{formatDate(act.created_at)}</div>
                            <div className="timeline-title">
                              {act.activity_type.replace(/_/g, ' ')}
                            </div>
                            <div className="timeline-desc">
                              {act.description}
                            </div>
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
