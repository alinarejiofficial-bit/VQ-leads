import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ActivityWidgetStats, type CallLog, type Lead, type LeadEmail, type LeadNote, type User } from '../../api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/forms/Button';
import { Input } from '../../components/forms/Input';
import { Calendar, Clock3, Mail, MessageSquare, Phone, Plus, Pin, PinOff, CheckCircle2 } from 'lucide-react';

const ACTIVITY_ICON: Record<string, React.ReactNode> = {
  CREATED: <Plus size={14} className="text-blue-400" />,
  UPDATED: <Clock3 size={14} className="text-violet-400" />,
  STATUS_CHANGE: <Clock3 size={14} className="text-amber-400" />,
  CALL_LOGGED: <Phone size={14} className="text-cyan-400" />,
  NOTE_ADDED: <MessageSquare size={14} className="text-primary" />,
  EMAIL_SENT: <Mail size={14} className="text-green-400" />,
  EMAIL_RECEIVED: <Mail size={14} className="text-blue-400" />,
  FOLLOW_UP_SCHEDULED: <Calendar size={14} className="text-amber-400" />,
  FOLLOW_UP_COMPLETED: <CheckCircle2 size={14} className="text-green-400" />,
  ASSIGNMENT: <Plus size={14} className="text-purple-400" />,
  CLAIM: <Pin size={14} className="text-cyan-400" />,
  COMMISSION_APPROVED: <CheckCircle2 size={14} className="text-green-400" />,
};

export const Activities: React.FC = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get('tab') || 'timeline';

  const [page, setPage] = useState(1);
  const [activityTypeFilter, setActivityTypeFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [leadFilter, setLeadFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedTimelineId, setSelectedTimelineId] = useState<number | null>(null);
  const [callSearch, setCallSearch] = useState('');

  const [newCall, setNewCall] = useState<Partial<CallLog>>({
    call_type: 'OUTGOING',
    call_status: 'ANSWERED',
    outcome: 'INTERESTED',
    duration: 0,
  });
  const [editingCallId, setEditingCallId] = useState<number | null>(null);

  const [newNote, setNewNote] = useState<Partial<LeadNote>>({ title: '', content: '', is_pinned: false });
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  const [newEmail, setNewEmail] = useState<Partial<LeadEmail>>({
    direction: 'SENT',
    status: 'SENT',
    subject: '',
    sender: '',
    recipient: '',
    content: '',
    attachments: '',
  });
  const [editingEmailId, setEditingEmailId] = useState<number | null>(null);

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: api.getLeads,
  });
  const { data: agents = [] } = useQuery<User[]>({
    queryKey: ['agents'],
    queryFn: api.getAgents,
  });
  const { data: widgetStats } = useQuery<ActivityWidgetStats>({
    queryKey: ['activity-widgets'],
    queryFn: api.getActivityWidgetStats,
  });

  const { data: timelineData, isLoading: timelineLoading } = useQuery({
    queryKey: ['activities-timeline', page, activityTypeFilter, agentFilter, leadFilter, statusFilter, fromDate, toDate],
    queryFn: () =>
      api.getActivitiesTimeline({
        page,
        page_size: 20,
        activity_type: activityTypeFilter || undefined,
        agent: agentFilter ? Number(agentFilter) : undefined,
        lead: leadFilter ? Number(leadFilter) : undefined,
        status: statusFilter || undefined,
        date_from: fromDate || undefined,
        date_to: toDate || undefined,
      }),
  });

  const { data: callLogs = [] } = useQuery({
    queryKey: ['call-logs', leadFilter, agentFilter, statusFilter, fromDate, toDate, callSearch],
    queryFn: () => api.getCallLogs({
      lead: leadFilter ? Number(leadFilter) : undefined,
      agent: agentFilter ? Number(agentFilter) : undefined,
      call_status: statusFilter || undefined,
      date_from: fromDate || undefined,
      date_to: toDate || undefined,
      q: callSearch || undefined,
    }),
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['activity-notes', leadFilter, agentFilter],
    queryFn: () => api.getNotes({
      lead: leadFilter ? Number(leadFilter) : undefined,
      created_by: agentFilter ? Number(agentFilter) : undefined,
    }),
  });

  const { data: emails = [] } = useQuery({
    queryKey: ['activity-emails', leadFilter, statusFilter],
    queryFn: () => api.getEmails({
      lead: leadFilter ? Number(leadFilter) : undefined,
      status: statusFilter || undefined,
    }),
  });

  const addCallMutation = useMutation({
    mutationFn: (payload: Partial<CallLog>) => api.createCallLog(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-logs'] });
      queryClient.invalidateQueries({ queryKey: ['activities-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['activity-widgets'] });
      setNewCall({ call_type: 'OUTGOING', call_status: 'ANSWERED', outcome: 'INTERESTED', duration: 0 });
      setEditingCallId(null);
    },
  });
  const updateCallMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CallLog> }) => api.updateCallLog(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-logs'] });
      queryClient.invalidateQueries({ queryKey: ['activities-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['activity-widgets'] });
      setNewCall({ call_type: 'OUTGOING', call_status: 'ANSWERED', outcome: 'INTERESTED', duration: 0 });
      setEditingCallId(null);
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: (payload: Partial<LeadNote>) => api.createNote(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-notes'] });
      queryClient.invalidateQueries({ queryKey: ['activities-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['activity-widgets'] });
      setNewNote({ title: '', content: '', is_pinned: false });
      setEditingNoteId(null);
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<LeadNote> }) => api.updateNote(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-notes'] });
      queryClient.invalidateQueries({ queryKey: ['activities-timeline'] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: api.deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-notes'] });
      queryClient.invalidateQueries({ queryKey: ['activities-timeline'] });
    },
  });

  const addEmailMutation = useMutation({
    mutationFn: (payload: Partial<LeadEmail>) => api.createEmail(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-emails'] });
      queryClient.invalidateQueries({ queryKey: ['activities-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['activity-widgets'] });
      setNewEmail({ direction: 'SENT', status: 'SENT', subject: '', sender: '', recipient: '', content: '', attachments: '' });
      setEditingEmailId(null);
    },
  });
  const updateEmailMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<LeadEmail> }) => api.updateEmail(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-emails'] });
      queryClient.invalidateQueries({ queryKey: ['activities-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['activity-widgets'] });
      setNewEmail({ direction: 'SENT', status: 'SENT', subject: '', sender: '', recipient: '', content: '', attachments: '' });
      setEditingEmailId(null);
    },
  });

  const updateCall = (id: number) => {
    updateCallMutation.mutate({ id, payload: newCall });
  };

  const updateEmail = (id: number) => {
    updateEmailMutation.mutate({ id, payload: newEmail });
  };

  const timelineItems = timelineData?.results ?? [];
  const selectedTimeline = timelineItems.find(t => t.id === selectedTimelineId) || null;

  const sortedNotes = useMemo(() => [...notes].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned)), [notes]);

  const toggleNotePin = (note: LeadNote) => {
    updateNoteMutation.mutate({ id: note.id, payload: { is_pinned: !note.is_pinned } });
  };

  return (
    <div className="p-8 space-y-6 text-left">
      <h2 className="text-2xl font-bold text-foreground">Activities</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3"><p className="text-[11px] text-muted-foreground">Total Activities</p><p className="text-xl font-bold">{widgetStats?.totalActivities || 0}</p></Card>
        <Card className="p-3"><p className="text-[11px] text-muted-foreground">Calls Today</p><p className="text-xl font-bold">{widgetStats?.callsMadeToday || 0}</p></Card>
        <Card className="p-3"><p className="text-[11px] text-muted-foreground">Notes Today</p><p className="text-xl font-bold">{widgetStats?.notesAddedToday || 0}</p></Card>
        <Card className="p-3"><p className="text-[11px] text-muted-foreground">Emails Sent Today</p><p className="text-xl font-bold">{widgetStats?.emailsSentToday || 0}</p></Card>
        <Card className="p-3"><p className="text-[11px] text-muted-foreground">Pending Follow-Ups</p><p className="text-xl font-bold">{widgetStats?.pendingFollowUps || 0}</p></Card>
        <Card className="p-3"><p className="text-[11px] text-muted-foreground">Overdue Follow-Ups</p><p className="text-xl font-bold text-amber-400">{widgetStats?.overdueFollowUps || 0}</p></Card>
      </div>

      <div className="flex gap-4 mb-1 border-b border-border/40 pb-2">
        {['timeline', 'calls', 'notes', 'emails'].map(t => (
          <a key={t} href={`/activities?tab=${t}`} className={`pb-2 px-2 text-sm font-medium ${tab === t ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </a>
        ))}
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {tab === 'timeline' && (
            <select className="h-10 rounded-md border border-input bg-muted/20 px-3 text-sm" value={activityTypeFilter} onChange={e => setActivityTypeFilter(e.target.value)}>
              <option value="">All Activity Types</option>
              <option value="CREATED">Lead Created</option>
              <option value="UPDATED">Lead Updated</option>
              <option value="STATUS_CHANGE">Status Changed</option>
              <option value="CALL_LOGGED">Call Logged</option>
              <option value="NOTE_ADDED">Note Added</option>
              <option value="EMAIL_SENT">Email Sent</option>
              <option value="EMAIL_RECEIVED">Email Received</option>
              <option value="FOLLOW_UP_SCHEDULED">Follow-Up Scheduled</option>
              <option value="FOLLOW_UP_COMPLETED">Follow-Up Completed</option>
              <option value="ASSIGNMENT">Lead Assigned</option>
              <option value="TRANSFERRED">Lead Transferred</option>
              <option value="DEAL_WON">Deal Won</option>
              <option value="DEAL_LOST">Deal Lost</option>
            </select>
          )}
          <select className="h-10 rounded-md border border-input bg-muted/20 px-3 text-sm" value={agentFilter} onChange={e => setAgentFilter(e.target.value)}>
            <option value="">All Agents</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
          </select>
          <select className="h-10 rounded-md border border-input bg-muted/20 px-3 text-sm" value={leadFilter} onChange={e => setLeadFilter(e.target.value)}>
            <option value="">All Leads</option>
            {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          <select className="h-10 rounded-md border border-input bg-muted/20 px-3 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="ANSWERED">Answered</option>
            <option value="MISSED">Missed</option>
            <option value="BUSY">Busy</option>
            <option value="NO_RESPONSE">No Response</option>
            <option value="SENT">Sent</option>
            <option value="DELIVERED">Delivered</option>
            <option value="OPENED">Opened</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </Card>

      {tab === 'timeline' && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.8fr] gap-6">
          <Card className="p-4">
            {timelineLoading ? (
              <div className="text-sm text-muted-foreground py-8 text-center">Loading timeline...</div>
            ) : timelineItems.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">No activities found.</div>
            ) : (
              <div className="space-y-3">
                {timelineItems.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedTimelineId(item.id)}
                    className={`w-full p-3 rounded-lg border text-left ${selectedTimelineId === item.id ? 'border-primary/40 bg-primary/5' : 'border-border/40 bg-muted/10'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {ACTIVITY_ICON[item.activity_type] || <Clock3 size={14} className="text-muted-foreground" />}
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">{item.activity_type.replaceAll('_', ' ')}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{item.description}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {item.user_name} · {new Date(item.created_at).toLocaleString()}
                    </p>
                  </button>
                ))}
                {timelineData?.has_next && (
                  <div className="flex justify-center pt-2">
                    <Button variant="outline" onClick={() => setPage(p => p + 1)}>Load More</Button>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Activity Details</h3>
            {selectedTimeline ? (
              <div className="space-y-2 text-sm">
                <div className="text-xs text-muted-foreground uppercase">{selectedTimeline.activity_type.replaceAll('_', ' ')}</div>
                <div className="font-semibold text-foreground">{selectedTimeline.description}</div>
                <div className="text-muted-foreground">Lead: {selectedTimeline.lead_name}</div>
                <div className="text-muted-foreground">Performed by: {selectedTimeline.user_name}</div>
                <div className="text-muted-foreground">Timestamp: {new Date(selectedTimeline.created_at).toLocaleString()}</div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Select an activity from timeline.</div>
            )}
          </Card>
        </div>
      )}

      {tab === 'calls' && (
        <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Add / Edit Call Log</h3>
            <Input placeholder="Search calls by lead/note..." value={callSearch} onChange={e => setCallSearch(e.target.value)} />
            <select className="h-10 rounded-md border border-input bg-muted/20 px-3 text-sm w-full" value={newCall.lead || ''} onChange={e => setNewCall(v => ({ ...v, lead: Number(e.target.value) }))}>
              <option value="">Select Lead</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <Input type="datetime-local" value={(newCall.call_date || '').toString().slice(0, 16)} onChange={e => setNewCall(v => ({ ...v, call_date: e.target.value }))} />
              <Input type="number" placeholder="Duration sec" value={newCall.duration || ''} onChange={e => setNewCall(v => ({ ...v, duration: Number(e.target.value) }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select className="h-10 rounded-md border border-input bg-muted/20 px-3 text-sm" value={newCall.call_type || 'OUTGOING'} onChange={e => setNewCall(v => ({ ...v, call_type: e.target.value as any }))}>
                <option value="INCOMING">Incoming</option>
                <option value="OUTGOING">Outgoing</option>
              </select>
              <select className="h-10 rounded-md border border-input bg-muted/20 px-3 text-sm" value={newCall.call_status || 'ANSWERED'} onChange={e => setNewCall(v => ({ ...v, call_status: e.target.value as any }))}>
                <option value="ANSWERED">Answered</option>
                <option value="MISSED">Missed</option>
                <option value="BUSY">Busy</option>
                <option value="NO_RESPONSE">No Response</option>
              </select>
            </div>
            <select className="h-10 rounded-md border border-input bg-muted/20 px-3 text-sm w-full" value={newCall.outcome || ''} onChange={e => setNewCall(v => ({ ...v, outcome: e.target.value as any }))}>
              <option value="INTERESTED">Interested</option>
              <option value="NOT_INTERESTED">Not Interested</option>
              <option value="CALLBACK_REQUESTED">Callback Requested</option>
              <option value="CONVERTED">Converted</option>
            </select>
            <textarea className="w-full min-h-[90px] rounded-md border border-input bg-muted/20 px-3 py-2 text-sm" placeholder="Call notes..." value={newCall.notes || ''} onChange={e => setNewCall(v => ({ ...v, notes: e.target.value }))} />
            <Button onClick={() => editingCallId ? updateCall(editingCallId) : addCallMutation.mutate(newCall)} disabled={addCallMutation.isPending || updateCallMutation.isPending || !newCall.lead || !newCall.call_date}>
              {editingCallId ? 'Update Call Log' : 'Add Call Log'}
            </Button>
          </Card>
          <Card className="p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Call History</h3>
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {callLogs.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">No call logs found.</p> : callLogs.map(call => (
                <div key={call.id} className="p-3 rounded-lg border border-border/50 bg-muted/10">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-foreground">{call.lead_name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded border bg-muted/30 border-border/50">{call.call_status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(call.call_date).toLocaleString()} · {call.duration}s · {call.call_type}</p>
                  <p className="text-xs text-muted-foreground mt-1">Outcome: {call.outcome || '-'}</p>
                  <p className="text-xs mt-1">{call.notes || 'No notes'}</p>
                  <div className="mt-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditingCallId(call.id); setNewCall(call); }}>Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'notes' && (
        <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Add / Edit Note</h3>
            <select className="h-10 rounded-md border border-input bg-muted/20 px-3 text-sm w-full" value={newNote.lead || ''} onChange={e => setNewNote(v => ({ ...v, lead: Number(e.target.value) }))}>
              <option value="">Select Lead</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <Input placeholder="Note title" value={newNote.title || ''} onChange={e => setNewNote(v => ({ ...v, title: e.target.value }))} />
            <textarea className="w-full min-h-[140px] rounded-md border border-input bg-muted/20 px-3 py-2 text-sm" placeholder="Rich note content..." value={newNote.content || ''} onChange={e => setNewNote(v => ({ ...v, content: e.target.value }))} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!newNote.is_pinned} onChange={e => setNewNote(v => ({ ...v, is_pinned: e.target.checked }))} />
              Pin important note
            </label>
            <Input
              placeholder="Mention team members by id (e.g. 2,5)"
              onChange={e => setNewNote(v => ({
                ...v,
                mention_user_ids: e.target.value.split(',').map(x => Number(x.trim())).filter(x => !Number.isNaN(x) && x > 0),
              }))}
            />
            <Button onClick={() => editingNoteId ? updateNoteMutation.mutate({ id: editingNoteId, payload: newNote }) : addNoteMutation.mutate(newNote)} disabled={!newNote.lead || !newNote.title || !newNote.content}>
              {editingNoteId ? 'Update Note' : 'Add Note'}
            </Button>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Notes</h3>
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {sortedNotes.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">No notes yet.</p> : sortedNotes.map(note => (
                <div key={note.id} className={`p-3 rounded-lg border ${note.is_pinned ? 'border-amber-500/30 bg-amber-500/5' : 'border-border/50 bg-muted/10'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-foreground">{note.title}</p>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => toggleNotePin(note)} className="text-muted-foreground hover:text-foreground">
                        {note.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{note.lead_name} · {note.created_by_name} · {new Date(note.created_at).toLocaleString()}</p>
                  <p className="text-sm mt-2 whitespace-pre-wrap">{note.content}</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditingNoteId(note.id); setNewNote(note); }}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => deleteNoteMutation.mutate(note.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'emails' && (
        <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Add / Edit Email</h3>
            <select className="h-10 rounded-md border border-input bg-muted/20 px-3 text-sm w-full" value={newEmail.lead || ''} onChange={e => setNewEmail(v => ({ ...v, lead: Number(e.target.value) }))}>
              <option value="">Select Lead</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <Input placeholder="Subject" value={newEmail.subject || ''} onChange={e => setNewEmail(v => ({ ...v, subject: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Sender" value={newEmail.sender || ''} onChange={e => setNewEmail(v => ({ ...v, sender: e.target.value }))} />
              <Input placeholder="Recipient" value={newEmail.recipient || ''} onChange={e => setNewEmail(v => ({ ...v, recipient: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <select className="h-10 rounded-md border border-input bg-muted/20 px-3 text-sm" value={newEmail.direction || 'SENT'} onChange={e => setNewEmail(v => ({ ...v, direction: e.target.value as any }))}>
                <option value="SENT">Sent</option>
                <option value="RECEIVED">Received</option>
              </select>
              <select className="h-10 rounded-md border border-input bg-muted/20 px-3 text-sm" value={newEmail.status || 'SENT'} onChange={e => setNewEmail(v => ({ ...v, status: e.target.value as any }))}>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="DELIVERED">Delivered</option>
                <option value="OPENED">Opened</option>
                <option value="FAILED">Failed</option>
              </select>
              <Input type="datetime-local" value={(newEmail.sent_at || '').toString().slice(0, 16)} onChange={e => setNewEmail(v => ({ ...v, sent_at: e.target.value }))} />
            </div>
            <Input placeholder="Attachments (comma separated)" value={newEmail.attachments || ''} onChange={e => setNewEmail(v => ({ ...v, attachments: e.target.value }))} />
            <textarea className="w-full min-h-[140px] rounded-md border border-input bg-muted/20 px-3 py-2 text-sm" placeholder="Email content..." value={newEmail.content || ''} onChange={e => setNewEmail(v => ({ ...v, content: e.target.value }))} />
            <Button onClick={() => editingEmailId ? updateEmail(editingEmailId) : addEmailMutation.mutate(newEmail)} disabled={addEmailMutation.isPending || updateEmailMutation.isPending || !newEmail.lead || !newEmail.subject || !newEmail.sender || !newEmail.recipient}>
              {editingEmailId ? 'Update Email' : 'Add Email'}
            </Button>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Email History</h3>
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {emails.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">No emails tracked.</p> : emails.map(email => (
                <div key={email.id} className="p-3 rounded-lg border border-border/50 bg-muted/10">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-foreground">{email.subject}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${
                      email.status === 'OPENED' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                      email.status === 'FAILED' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                      'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    }`}>{email.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{email.direction} · {email.sender} → {email.recipient}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(email.sent_at).toLocaleString()}</p>
                  <p className="text-sm mt-2 whitespace-pre-wrap">{email.content}</p>
                  {email.attachments && <p className="text-xs mt-2 text-muted-foreground">Attachments: {email.attachments}</p>}
                  <div className="mt-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditingEmailId(email.id); setNewEmail(email); }}>Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Activities;
