import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type AuditLog,
  type AuditLogQuery,
} from '../../api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/forms/Button';
import { Input } from '../../components/forms/Input';
import {
  Activity, LogIn, ShieldAlert, Settings2, Search, Filter, X,
  Download, FileSpreadsheet, FileText, FileDown, ChevronLeft, ChevronRight,
  Clock, Monitor, Globe, ArrowRight,
} from 'lucide-react';

const PAGE_SIZE = 25;

const emptyFilters: AuditLogQuery = {
  q: '',
  user: '',
  role: '',
  module: '',
  action: '',
  dateFrom: '',
  dateTo: '',
};

function classifyAction(action: string): 'create' | 'update' | 'delete' | 'auth' | 'danger' | 'neutral' {
  if (action === 'LOGIN_FAILED') return 'danger';
  if (action.includes('DELETED')) return 'delete';
  if (action.includes('CREATED') || action.includes('SCHEDULED') || action.includes('ADDED') || action.includes('PERFORMED')) return 'create';
  if (action.includes('LOGIN') || action.includes('LOGOUT') || action.includes('PASSWORD')) return 'auth';
  if (action.includes('UPDATED') || action.includes('CHANGED') || action.includes('COMPLETED') || action.includes('CLAIMED') || action.includes('ASSIGNED')) return 'update';
  return 'neutral';
}

const badgeStyles: Record<string, string> = {
  create: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  update: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  delete: 'bg-red-500/15 text-red-500 border-red-500/30',
  auth: 'bg-violet-500/15 text-violet-500 border-violet-500/30',
  danger: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  neutral: 'bg-muted text-muted-foreground border-border',
};

const avatarPalette = [
  'bg-blue-500/20 text-blue-500',
  'bg-emerald-500/20 text-emerald-500',
  'bg-violet-500/20 text-violet-500',
  'bg-amber-500/20 text-amber-500',
  'bg-rose-500/20 text-rose-500',
  'bg-cyan-500/20 text-cyan-500',
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColor(name: string): string {
  let sum = 0;
  for (let i = 0; i < name.length; i += 1) sum += name.charCodeAt(i);
  return avatarPalette[sum % avatarPalette.length];
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

const Avatar: React.FC<{ name: string; size?: 'sm' | 'md' }> = ({ name, size = 'sm' }) => (
  <div
    className={`flex items-center justify-center rounded-full font-semibold ${avatarColor(name)} ${
      size === 'sm' ? 'h-8 w-8 text-xs' : 'h-11 w-11 text-sm'
    }`}
  >
    {initials(name)}
  </div>
);

const ActionBadge: React.FC<{ action: string; label: string }> = ({ action, label }) => {
  const kind = classifyAction(action);
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${badgeStyles[kind]}`}>
      {label}
    </span>
  );
};

const StatCard: React.FC<{
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent: string;
}> = ({ label, value, icon, accent }) => (
  <Card className="p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>{icon}</div>
    </div>
  </Card>
);

function ChangeList({ title, values, tone }: { title: string; values: Record<string, unknown>; tone: 'old' | 'new' }) {
  const entries = Object.entries(values || {});
  return (
    <div className="flex-1 rounded-lg border border-border bg-muted/20 p-3">
      <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${tone === 'old' ? 'text-red-500' : 'text-emerald-500'}`}>
        {title}
      </p>
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">No data</p>
      ) : (
        <ul className="space-y-1">
          {entries.map(([k, v]) => (
            <li key={k} className="text-xs">
              <span className="text-muted-foreground">{k}: </span>
              <span className="font-medium text-foreground break-all">{String(v ?? '—')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const DetailDrawer: React.FC<{ log: AuditLog | null; onClose: () => void }> = ({ log, onClose }) => {
  if (!log) return null;
  const hasChanges = Object.keys(log.old_values || {}).length > 0 || Object.keys(log.new_values || {}).length > 0;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative h-full w-full max-w-md overflow-y-auto border-l border-border bg-card shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Activity Details</h3>
            <p className="text-xs text-muted-foreground">Log #{log.id}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex items-center gap-2">
            <ActionBadge action={log.action} label={log.action_display} />
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {log.module_display}
            </span>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action Summary</p>
            <p className="text-sm text-foreground">{log.summary || log.action_display}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar name={log.user_name} size="md" />
              <div>
                <p className="text-sm font-medium text-foreground">{log.user_name}</p>
                <p className="text-xs text-muted-foreground">{log.role || 'System'}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-muted/20 p-3 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-foreground">{formatDateTime(log.created_at)}</span>
              </div>
              {(log.record_type || log.record_id) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="text-foreground">{log.record_type}{log.record_id ? ` #${log.record_id}` : ''}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />
                <span className="text-foreground">{log.ip_address || 'Unknown IP'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Monitor className="h-3.5 w-3.5" />
                <span className="text-foreground">{log.device}</span>
              </div>
            </div>
          </div>

          {hasChanges && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Before / After Changes</p>
              <div className="flex items-stretch gap-2">
                <ChangeList title="Before" values={log.old_values} tone="old" />
                <div className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <ChangeList title="After" values={log.new_values} tone="new" />
              </div>
            </div>
          )}

          {log.user_agent && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">User Agent</p>
              <p className="break-all rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">{log.user_agent}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const AuditLogs: React.FC = () => {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<AuditLogQuery>(emptyFilters);
  const [applied, setApplied] = useState<AuditLogQuery>(emptyFilters);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const widgetsQuery = useQuery({
    queryKey: ['audit-widgets'],
    queryFn: () => api.getAuditLogWidgets(),
  });

  const filterOptionsQuery = useQuery({
    queryKey: ['audit-filter-options'],
    queryFn: () => api.getAuditLogFilters(),
  });

  const logsQuery = useQuery({
    queryKey: ['audit-logs', applied, page],
    queryFn: () => api.getAuditLogs({ ...applied, page, pageSize: PAGE_SIZE }),
  });

  const widgets = widgetsQuery.data;
  const options = filterOptionsQuery.data;
  const data = logsQuery.data;

  const activeFilterCount = useMemo(
    () => Object.entries(applied).filter(([k, v]) => k !== 'q' && v).length,
    [applied]
  );

  const applyFilters = () => {
    setApplied(draft);
    setPage(1);
  };

  const resetFilters = () => {
    setDraft(emptyFilters);
    setApplied(emptyFilters);
    setPage(1);
  };

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') applyFilters();
  };

  const handleExport = async (fileType: 'csv' | 'xlsx' | 'pdf') => {
    setExporting(fileType);
    try {
      const blob = await api.exportAuditLogs(fileType, applied);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs.${fileType}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    queryClient.invalidateQueries({ queryKey: ['audit-widgets'] });
  };

  const numPages = data?.numPages || 1;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">
            Complete trail of every critical action performed across the system.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={!!exporting}>
            <FileText className="mr-1.5 h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('xlsx')} disabled={!!exporting}>
            <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} disabled={!!exporting}>
            <FileDown className="mr-1.5 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Activities"
          value={widgets?.totalActivities ?? '—'}
          icon={<Activity className="h-5 w-5 text-blue-500" />}
          accent="bg-blue-500/15"
        />
        <StatCard
          label="User Logins Today"
          value={widgets?.userLoginsToday ?? '—'}
          icon={<LogIn className="h-5 w-5 text-emerald-500" />}
          accent="bg-emerald-500/15"
        />
        <StatCard
          label="Failed Login Attempts"
          value={widgets?.failedLoginsToday ?? '—'}
          icon={<ShieldAlert className="h-5 w-5 text-amber-500" />}
          accent="bg-amber-500/15"
        />
        <StatCard
          label="System Changes Today"
          value={widgets?.systemChangesToday ?? '—'}
          icon={<Settings2 className="h-5 w-5 text-violet-500" />}
          accent="bg-violet-500/15"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Main table column */}
        <div className="space-y-4 xl:col-span-2">
          {/* Search + filter toggle */}
          <Card className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by user, summary, record, IP..."
                  value={draft.q || ''}
                  onChange={(e) => setDraft({ ...draft, q: e.target.value })}
                  onKeyDown={handleSearchKey}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="default" size="sm" onClick={applyFilters}>Search</Button>
                <Button
                  variant={showFilters ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setShowFilters((v) => !v)}
                >
                  <Filter className="mr-1.5 h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Date From</label>
                  <Input
                    type="date"
                    value={draft.dateFrom || ''}
                    onChange={(e) => setDraft({ ...draft, dateFrom: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Date To</label>
                  <Input
                    type="date"
                    value={draft.dateTo || ''}
                    onChange={(e) => setDraft({ ...draft, dateTo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">User</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={draft.user || ''}
                    onChange={(e) => setDraft({ ...draft, user: e.target.value })}
                  >
                    <option value="">All users</option>
                    {options?.users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Role</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={draft.role || ''}
                    onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                  >
                    <option value="">All roles</option>
                    {options?.roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Module</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={draft.module || ''}
                    onChange={(e) => setDraft({ ...draft, module: e.target.value })}
                  >
                    <option value="">All modules</option>
                    {options?.modules.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Action Type</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={draft.action || ''}
                    onChange={(e) => setDraft({ ...draft, action: e.target.value })}
                  >
                    <option value="">All actions</option>
                    {options?.actions.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
                  <Button variant="default" size="sm" onClick={applyFilters}>Apply Filters</Button>
                  <Button variant="ghost" size="sm" onClick={resetFilters}>Reset</Button>
                </div>
              </div>
            )}
          </Card>

          {/* Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Module</th>
                    <th className="px-4 py-3 font-medium">Record</th>
                    <th className="px-4 py-3 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {logsQuery.isLoading && (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Loading...</td></tr>
                  )}
                  {logsQuery.isError && (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-red-500">Failed to load audit logs.</td></tr>
                  )}
                  {!logsQuery.isLoading && data?.results.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No activity matches your filters.</td></tr>
                  )}
                  {data?.results.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelected(log)}
                      className="cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={log.user_name} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{log.user_name}</p>
                            <p className="text-xs text-muted-foreground">{log.role || 'System'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <ActionBadge action={log.action} label={log.action_display} />
                        <p className="mt-1 max-w-[260px] truncate text-xs text-muted-foreground">{log.summary}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{log.module_display}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {log.record_type ? `${log.record_type}${log.record_id ? ` #${log.record_id}` : ''}` : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground" title={formatDateTime(log.created_at)}>
                        {relativeTime(log.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
              <p className="text-muted-foreground">
                {data ? `${data.count} total activities` : ''}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-muted-foreground">Page {page} of {numPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(numPages, p + 1))}
                  disabled={page >= numPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent activity timeline */}
        <div>
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Recent Activities</h3>
              <Button variant="ghost" size="sm" onClick={refresh}>
                <Download className="h-4 w-4 rotate-180" />
              </Button>
            </div>
            <div className="relative space-y-5 before:absolute before:left-[15px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
              {widgets?.recentActivities.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              )}
              {widgets?.recentActivities.map((log) => (
                <button
                  key={log.id}
                  onClick={() => setSelected(log)}
                  className="relative flex w-full items-start gap-3 text-left"
                >
                  <div className="z-10 shrink-0">
                    <Avatar name={log.user_name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <ActionBadge action={log.action} label={log.action_display} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-foreground">{log.summary || log.action_display}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {log.user_name} &middot; {relativeTime(log.created_at)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <DetailDrawer log={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default AuditLogs;
