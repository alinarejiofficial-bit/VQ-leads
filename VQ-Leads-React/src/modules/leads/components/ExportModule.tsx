import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ExportHistoryItem, type ExportPreviewResponse, type ExportStats, type Lead, type User } from '../../../api';
import { Button } from '../../../components/forms/Button';
import { Input } from '../../../components/forms/Input';
import { Dialog } from '../../../components/common/Dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/datatable/Table';
import {
  Download, FileDown, FileSpreadsheet, FileText, Loader2, Filter,
  CalendarRange, Users, BarChart3, History, Search, CheckCircle2,
} from 'lucide-react';

interface ExportModuleProps {
  leads: Lead[];
  filteredLeadIds?: number[];
}

const STATUS_ORDER = ['NEW', 'CONTACTED', 'IN_PROGRESS', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST'];
const selectCls =
  'flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-border dark:bg-muted/20 dark:text-foreground';

function Section({
  icon, title, description, accent, children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  accent: 'blue' | 'violet' | 'emerald' | 'amber';
  children: React.ReactNode;
}) {
  const styles = {
    blue: { wrap: 'border-blue-500/20 bg-gradient-to-br from-blue-500/[0.06] to-transparent', icon: 'bg-blue-500/15 text-blue-600' },
    violet: { wrap: 'border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-transparent', icon: 'bg-violet-500/15 text-violet-600' },
    emerald: { wrap: 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] to-transparent', icon: 'bg-emerald-500/15 text-emerald-600' },
    amber: { wrap: 'border-amber-500/20 bg-gradient-to-br from-amber-500/[0.06] to-transparent', icon: 'bg-amber-500/15 text-amber-600' },
  }[accent];

  return (
    <section className={`overflow-hidden rounded-2xl border shadow-sm ${styles.wrap}`}>
      <div className="flex items-start gap-3 border-b border-border/40 bg-white/50 px-5 py-4 dark:bg-card/40">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}>{icon}</div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="space-y-4 bg-white/80 p-5 dark:bg-card/60">{children}</div>
    </section>
  );
}

const EXPORT_MODES = [
  { value: 'ALL', label: 'All Records', desc: 'Every lead in the system' },
  { value: 'FILTERED', label: 'Filtered', desc: 'Match filters below' },
  { value: 'SELECTED', label: 'Selected IDs', desc: 'Specific lead IDs' },
  { value: 'CURRENT_PAGE', label: 'Current Page', desc: 'Page lead IDs' },
  { value: 'COMPLETE_DATASET', label: 'Full Dataset', desc: 'Complete export' },
] as const;

const FORMAT_OPTIONS = [
  { id: 'csv' as const, label: 'CSV', desc: 'Spreadsheet compatible', icon: FileText, cls: 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10' },
  { id: 'xlsx' as const, label: 'Excel', desc: 'XLSX workbook', icon: FileSpreadsheet, cls: 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10' },
  { id: 'pdf' as const, label: 'PDF', desc: 'Print-ready report', icon: FileText, cls: 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10' },
];

export const ExportModule: React.FC<ExportModuleProps> = ({ leads, filteredLeadIds = [] }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('');
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');
  const [preview, setPreview] = useState<ExportPreviewResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [leadStatuses, setLeadStatuses] = useState<string[]>([]);
  const [leadSources, setLeadSources] = useState<string[]>([]);
  const [teamMember, setTeamMember] = useState('');
  const [dateRange, setDateRange] = useState('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [exportMode, setExportMode] = useState<'ALL' | 'FILTERED' | 'SELECTED' | 'CURRENT_PAGE' | 'COMPLETE_DATASET'>('FILTERED');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedIdsText, setSelectedIdsText] = useState('');
  const [currentPageIds, setCurrentPageIds] = useState<number[]>([]);

  const { data: agents = [] } = useQuery<User[]>({ queryKey: ['agents'], queryFn: api.getAgents });
  const { data: leadSettings } = useQuery({ queryKey: ['lead-settings'], queryFn: api.getLeadSettings });
  const { data: exportStats } = useQuery<ExportStats>({ queryKey: ['export-stats'], queryFn: api.getExportStats });
  const { data: exportHistory = [] } = useQuery<ExportHistoryItem[]>({
    queryKey: ['export-history', search, statusFilter, fileTypeFilter],
    queryFn: () => api.getExportHistory({
      search: search || undefined,
      status: statusFilter || undefined,
      fileType: fileTypeFilter || undefined,
    }),
  });

  const filtersPayload = {
    statuses: leadStatuses,
    sources: leadSources,
    teamMember: teamMember ? Number(teamMember) : null,
    dateRange,
    customStartDate,
    customEndDate,
  };

  const exportPayload = {
    filters: filtersPayload,
    exportMode,
    selectedIds,
    currentPageIds,
  };

  const statusOptions = useMemo(() => {
    const inData = Array.from(new Set(leads.map(l => l.status)));
    return STATUS_ORDER.filter(s => inData.includes(s as Lead['status']))
      .concat(inData.filter(s => !STATUS_ORDER.includes(s)).sort());
  }, [leads]);

  const sourceOptions = useMemo(() => {
    const fromLeads = Array.from(new Set(leads.map(l => l.source).filter(Boolean)));
    const fromSettings = leadSettings?.sources.map(s => s.label) ?? [];
    return Array.from(new Set([...fromLeads, ...fromSettings])).sort((a, b) => a.localeCompare(b));
  }, [leadSettings, leads]);

  useEffect(() => {
    if (exportMode === 'CURRENT_PAGE' && filteredLeadIds.length > 0) {
      setCurrentPageIds(filteredLeadIds);
    }
  }, [exportMode, filteredLeadIds]);

  const { data: livePreview, isFetching: livePreviewLoading } = useQuery<ExportPreviewResponse>({
    queryKey: [
      'export-live-preview',
      leadStatuses,
      leadSources,
      teamMember,
      dateRange,
      customStartDate,
      customEndDate,
      exportMode,
      selectedIds,
      currentPageIds,
    ],
    queryFn: () => api.previewLeadExport(exportPayload),
    staleTime: 400,
  });

  const matchedCount = livePreview?.totalRecords ?? 0;
  const filtersIgnored = exportMode === 'ALL' || exportMode === 'COMPLETE_DATASET';

  const previewMutation = useMutation({
    mutationFn: () => api.previewLeadExport(exportPayload),
    onSuccess: (data) => {
      if (data.totalRecords === 0) {
        alert('No leads match the selected export criteria. Adjust your filters or export scope.');
        return;
      }
      setPreview(data);
      setShowFormatModal(true);
    },
    onError: (err: Error) => alert(err.message || 'Preview failed'),
  });

  const generateMutation = useMutation({
    mutationFn: () => api.generateLeadExport({
      fileType: selectedFormat,
      ...exportPayload,
    }),
    onSuccess: async (data) => {
      try {
        const blob = await api.downloadExportFile(data.history.id);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = data.history.file_name;
        link.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Download failed');
      } finally {
        setIsGenerating(false);
        setShowFormatModal(false);
      }
      queryClient.invalidateQueries({ queryKey: ['export-history'] });
      queryClient.invalidateQueries({ queryKey: ['export-live-preview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['export-stats'] });
    },
    onError: (err: Error) => { setIsGenerating(false); alert(err.message || 'Export failed'); },
  });

  const toggleStatus = (status: string) =>
    setLeadStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  const toggleSource = (source: string) =>
    setLeadSources(prev => prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]);

  const clearFilters = () => {
    setLeadStatuses([]);
    setLeadSources([]);
    setTeamMember('');
    setDateRange('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const parseIds = (value: string) =>
    value.split(',').map(v => Number(v.trim())).filter(v => !Number.isNaN(v) && v > 0);

  const handleExportClick = () => {
    if (exportMode === 'SELECTED' && selectedIds.length === 0) {
      alert('Enter at least one lead ID for Selected IDs export.');
      return;
    }
    if (exportMode === 'CURRENT_PAGE' && currentPageIds.length === 0) {
      alert('No leads available for Current Page export. Go back to All Leads with filters applied, or choose another scope.');
      return;
    }
    previewMutation.mutate();
  };

  const statusLabel = (code: string) =>
    leadSettings?.statuses.find(s => s.code === code)?.label ?? code.replace(/_/g, ' ');
  const handleDownloadFromHistory = async (item: ExportHistoryItem) => {
    try {
      const blob = await api.downloadExportFile(item.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.file_name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const statCards = [
    { label: 'Total Exports', value: exportStats?.totalExports || 0, icon: BarChart3, cls: 'from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-600' },
    { label: 'Exports Today', value: exportStats?.exportsToday || 0, icon: FileDown, cls: 'from-violet-500/10 to-violet-600/5 border-violet-500/20 text-violet-600' },
    { label: 'Most Exported', value: exportStats?.mostExportedReport || 'N/A', icon: FileSpreadsheet, cls: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-600' },
    { label: 'Last Export', value: exportStats?.lastExportActivity ? new Date(exportStats.lastExportActivity).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A', icon: History, cls: 'from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-600', small: true },
  ];

  return (
    <div className="min-h-full space-y-6 bg-slate-50 p-4 md:p-8 dark:bg-background">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-foreground">Export Leads</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-muted-foreground">
            Filter leads, choose a format, and download CSV, Excel, or PDF reports.
          </p>
        </div>
        <Button
          onClick={handleExportClick}
          disabled={previewMutation.isPending || livePreviewLoading || matchedCount === 0}
          className="rounded-xl shadow-sm shadow-blue-500/20"
        >
          {previewMutation.isPending ? (
            <><Loader2 size={16} className="mr-1.5 animate-spin" /> Preparing…</>
          ) : (
            <><FileDown size={16} className="mr-1.5" /> Export Data</>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm ${s.cls}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{s.label}</p>
                  <p className={`mt-2 font-bold ${s.small ? 'text-sm leading-snug' : 'text-3xl'}`}>{s.value}</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/60 dark:bg-card/60">
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <Section icon={<Filter size={18} />} title="Export Filters" description="Narrow down which leads to include." accent="blue">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            {livePreviewLoading ? (
              <><Loader2 size={14} className="animate-spin text-blue-600" /> Calculating matches…</>
            ) : (
              <>
                <span className="font-semibold text-foreground">
                  {matchedCount.toLocaleString()} lead{matchedCount === 1 ? '' : 's'} match
                </span>
                <span className="text-muted-foreground">
                  {filtersIgnored ? '(filters ignored — exporting all records)' : 'your current criteria'}
                </span>
              </>
            )}
          </div>
          {!filtersIgnored && (leadStatuses.length > 0 || leadSources.length > 0 || teamMember || dateRange !== 'ALL') && (
            <button type="button" onClick={clearFilters} className="text-xs font-semibold text-blue-600 hover:underline">
              Clear filters
            </button>
          )}
        </div>

        {filtersIgnored && (
          <p className="text-xs text-muted-foreground">
            Export scope is set to <strong>{exportMode === 'ALL' ? 'All Records' : 'Full Dataset'}</strong>, so filter chips below are ignored.
          </p>
        )}

        <div className={`grid grid-cols-1 gap-6 lg:grid-cols-2 ${filtersIgnored ? 'pointer-events-none opacity-50' : ''}`}>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lead Status</p>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => toggleStatus(status)}
                  disabled={filtersIgnored}
                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                    leadStatuses.includes(status)
                      ? 'border-blue-500/40 bg-blue-500/15 text-blue-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300 dark:border-border dark:bg-muted/20'
                  }`}
                >
                  {statusLabel(status)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lead Source</p>
            <div className="flex flex-wrap gap-2">
              {sourceOptions.map(source => (
                <button
                  key={source}
                  type="button"
                  onClick={() => toggleSource(source)}
                  disabled={filtersIgnored}
                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                    leadSources.includes(source)
                      ? 'border-violet-500/40 bg-violet-500/15 text-violet-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-violet-300 dark:border-border dark:bg-muted/20'
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 gap-4 md:grid-cols-3 ${filtersIgnored ? 'pointer-events-none opacity-50' : ''}`}>          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Users size={13} className="text-muted-foreground" /> Team Member
            </label>
            <select className={selectCls} value={teamMember} onChange={e => setTeamMember(e.target.value)}>
              <option value="">All Members</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <CalendarRange size={13} className="text-muted-foreground" /> Date Range
            </label>
            <select className={selectCls} value={dateRange} onChange={e => setDateRange(e.target.value)}>
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="THIS_WEEK">This Week</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">Start</label>
              <Input type="datetime-local" className="rounded-xl" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} disabled={dateRange !== 'CUSTOM'} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">End</label>
              <Input type="datetime-local" className="rounded-xl" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} disabled={dateRange !== 'CUSTOM'} />
            </div>
          </div>
        </div>
      </Section>

      {/* Export scope */}
      <Section icon={<FileDown size={18} />} title="Export Scope" description="Choose which records to include in the export." accent="violet">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {EXPORT_MODES.map(mode => (
            <button
              key={mode.value}
              type="button"
              onClick={() => setExportMode(mode.value)}
              className={`rounded-xl border px-3 py-3 text-left transition-all ${
                exportMode === mode.value
                  ? 'border-violet-500 bg-violet-500/10 shadow-sm ring-1 ring-violet-500/20'
                  : 'border-slate-200 bg-white hover:border-violet-300 dark:border-border dark:bg-muted/10'
              }`}
            >
              <p className="text-xs font-bold text-foreground">{mode.label}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{mode.desc}</p>
            </button>
          ))}
        </div>

        {(exportMode === 'SELECTED' || exportMode === 'CURRENT_PAGE') && (
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 p-4">
            {exportMode === 'SELECTED' && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Selected Lead IDs</label>
                <Input
                  placeholder="e.g. 12, 14, 18"
                  className="rounded-xl"
                  value={selectedIdsText}
                  onChange={e => {
                    setSelectedIdsText(e.target.value);
                    setSelectedIds(parseIds(e.target.value));
                  }}
                />
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Comma-separated lead IDs to include in the export.
                </p>
              </div>
            )}
            {exportMode === 'CURRENT_PAGE' && (
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {currentPageIds.length} lead{currentPageIds.length === 1 ? '' : 's'} from your leads view
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Uses leads currently visible on the All Leads page (respecting search and filters there).
                  {currentPageIds.length > 0 && (
                    <> IDs: {currentPageIds.slice(0, 12).join(', ')}{currentPageIds.length > 12 ? '…' : ''}</>
                  )}
                </p>
                {currentPageIds.length === 0 && (
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                    No leads in the current view. Open All Leads first, apply filters, then return here.
                  </p>
                )}
              </div>
            )}
          </div>
        )}      </Section>

      {/* History */}
      <Section icon={<History size={18} />} title="Export History" description="Download previous exports or review status." accent="emerald">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
            <Input placeholder="Search file name…" value={search} onChange={e => setSearch(e.target.value)} className="h-10 rounded-xl pl-9" />
          </div>
          <select className={`${selectCls} w-auto min-w-[130px]`} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="PROCESSING">Processing</option>
          </select>
          <select className={`${selectCls} w-auto min-w-[120px]`} value={fileTypeFilter} onChange={e => setFileTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="csv">CSV</option>
            <option value="xlsx">XLSX</option>
            <option value="pdf">PDF</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 dark:bg-muted/20">
                <TableHead>Export Date</TableHead>
                <TableHead>Exported By</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exportHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <History size={32} className="opacity-40" />
                      <p className="text-sm">No export history yet.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : exportHistory.map(item => (
                <TableRow key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-muted/10">
                  <TableCell className="whitespace-nowrap text-sm">{new Date(item.created_at).toLocaleString()}</TableCell>
                  <TableCell>{item.exported_by_name || '—'}</TableCell>
                  <TableCell className="max-w-[180px] truncate font-medium">{item.file_name}</TableCell>
                  <TableCell>
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase dark:border-border dark:bg-muted/30">
                      {item.file_type}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums">{item.total_records}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase ${
                      item.status === 'COMPLETED' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600' :
                      item.status === 'FAILED' ? 'border-red-500/30 bg-red-500/10 text-red-600' :
                      'border-blue-500/30 bg-blue-500/10 text-blue-600'
                    }`}>
                      {item.status === 'COMPLETED' && <CheckCircle2 size={10} />}
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => handleDownloadFromHistory(item)}>
                      <Download size={13} className="mr-1" /> Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>

      {/* Format modal */}
      <Dialog
        isOpen={showFormatModal}
        onClose={() => setShowFormatModal(false)}
        title="Export Summary & Format"
        subtitle="Review the record count and choose your download format."
        size="lg"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Records', value: preview?.totalRecords || 0, cls: 'text-blue-600' },
              { label: 'Won', value: preview?.summary.won || 0, cls: 'text-emerald-600' },
              { label: 'Open', value: preview?.summary.open || 0, cls: 'text-amber-600' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-border dark:bg-muted/20">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className={`mt-1 text-2xl font-bold ${s.cls}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Choose Format</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {FORMAT_OPTIONS.map(fmt => {
                const Icon = fmt.icon;
                const active = selectedFormat === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setSelectedFormat(fmt.id)}
                    className={`flex flex-col items-center rounded-xl border p-4 transition-all ${fmt.cls} ${
                      active ? 'ring-2 ring-blue-500/40 shadow-md' : ''
                    }`}
                  >
                    <Icon size={28} className="mb-2 opacity-80" />
                    <span className="text-sm font-bold uppercase">{fmt.label}</span>
                    <span className="mt-1 text-[10px] text-muted-foreground">{fmt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedFormat === 'pdf' && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-300">
              PDF includes logo, title, applied filters, export date, summary stats, and a full lead table.
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowFormatModal(false)}>Cancel</Button>
            <Button className="rounded-xl" onClick={() => { setIsGenerating(true); generateMutation.mutate(); }} disabled={isGenerating}>
              {isGenerating ? (
                <><Loader2 size={14} className="mr-1.5 animate-spin" /> Generating…</>
              ) : (
                <><FileText size={14} className="mr-1.5" /> Generate & Download</>
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
