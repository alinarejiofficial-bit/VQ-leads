import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, BellRing, CheckCheck, Eye, EyeOff } from 'lucide-react';
import { api, type NotificationItem, type NotificationListResponse } from '../../api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/forms/Button';

export const Notifications: React.FC = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'all' | 'unread' | 'archived'>('all');

  const queryParams = useMemo(() => {
    if (tab === 'unread') return { archived: false, unread: true };
    if (tab === 'archived') return { archived: true };
    return { archived: false };
  }, [tab]);

  const { data, isLoading } = useQuery<NotificationListResponse>({
    queryKey: ['notifications', queryParams],
    queryFn: () => api.getNotifications(queryParams),
  });

  const markReadMutation = useMutation({
    mutationFn: api.markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markUnreadMutation = useMutation({
    mutationFn: api.markNotificationUnread,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const archiveMutation = useMutation({
    mutationFn: api.archiveNotification,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAllReadMutation = useMutation({
    mutationFn: api.markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const items = data?.items ?? [];

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  const typeBadge = (type: NotificationItem['type']) => {
    const map: Record<NotificationItem['type'], string> = {
      NEW_LEAD_AVAILABLE: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      LEAD_ASSIGNED: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
      LEAD_CLAIMED: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
      TASK_ASSIGNED: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      FOLLOWUP_REMINDER: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
      CONVERSION_APPROVED: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      COMMISSION_APPROVED: 'bg-green-500/10 border-green-500/20 text-green-400',
    };
    return map[type];
  };

  const typeLabel = (type: NotificationItem['type']) =>
    type.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto text-left">
      <Card className="p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-lg font-bold text-foreground">Notification Center</h3>
            <p className="text-sm text-muted-foreground mt-1">
              New Lead Available, Lead Assigned/Claimed, Task Assigned, Follow-up Reminder, Conversion Approved, and Commission Approved.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <CheckCheck size={14} className="mr-1.5" /> Mark All Read
          </Button>
        </div>
      </Card>

      <div className="flex gap-2">
        {[
          { id: 'all' as const, label: 'All' },
          { id: 'unread' as const, label: 'Unread' },
          { id: 'archived' as const, label: 'Archived' },
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              tab === t.id
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-card border-border/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Card className="p-10 text-center text-sm text-muted-foreground animate-pulse">Loading notifications...</Card>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          No notifications in this view.
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <Card key={item.id} className={`p-4 ${item.is_read ? 'opacity-80' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <BellRing size={14} className={item.is_read ? 'text-muted-foreground' : 'text-primary'} />
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${typeBadge(item.type)}`}>
                      {typeLabel(item.type)}
                    </span>
                    {!item.is_read && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-primary/10 border-primary/20 text-primary">
                        Unread
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{item.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">{formatTime(item.created_at)}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.is_read ? (
                    <Button variant="outline" size="sm" onClick={() => markUnreadMutation.mutate(item.id)}>
                      <EyeOff size={13} className="mr-1" /> Unread
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => markReadMutation.mutate(item.id)}>
                      <Eye size={13} className="mr-1" /> Read
                    </Button>
                  )}
                  {!item.is_archived && (
                    <Button variant="outline" size="sm" onClick={() => archiveMutation.mutate(item.id)}>
                      <Archive size={13} className="mr-1" /> Archive
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
export default Notifications;
