import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ExportHistoryItem, type ExportPreviewResponse, type ExportStats, type Lead, type User } from '../../../api';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/forms/Button';
import { Input } from '../../../components/forms/Input';
import { Dialog } from '../../../components/common/Dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/datatable/Table';
import { Download, FileDown, FileText, Loader2 } from 'lucide-react';

interface ExportModuleProps {
  leads: Lead[];
}

const STATUS_OPTIONS = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST'];
const SOURCE_OPTIONS = ['Website', 'Facebook Ads', 'Google Ads', 'Referral', 'Manual Entry'];

export const ExportModule: React.FC<ExportModuleProps> = ({ leads }) => {
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
  const [currentPageIds, setCurrentPageIds] = useState<number[]>([]);

  const { data: agents = [] } = useQuery<User[]>({
    queryKey: ['agents'],
    queryFn: api.getAgents,
  });

  const { data: exportStats } = useQuery<ExportStats>({
    queryKey: ['export-stats'],
    queryFn: api.getExportStats,
  });

  const { data: exportHistory = [] } = useQuery<ExportHistoryItem[]>({
    queryKey: ['export-history', search, statusFilter, fileTypeFilter],
    queryFn: () => api.getExportHistory({
      search: search || undefined,
      status: statusFilter || undefined,
      fileType: fileTypeFilter || undefined,
    }),
  });

  const filteredLeads = useMemo(() => leads, [leads]);

  const previewMutation = useMutation({
    mutationFn: () => api.previewLeadExport({
      filters: {
        statuses: leadStatuses,
        sources: leadSources,
        teamMember: teamMember ? Number(teamMember) : null,
        dateRange,
        customStartDate,
        customEndDate,
      },
      exportMode,
      selectedIds,
      currentPageIds,
    }),
    onSuccess: (data) => {
      setPreview(data);
      setShowFormatModal(true);
    },
    onError: (err: Error) => alert(err.message || 'Preview failed'),
  });

  const generateMutation = useMutation({
    mutationFn: () => api.generateLeadExport({
      fileType: selectedFormat,
      filters: {
        statuses: leadStatuses,
        sources: leadSources,
        teamMember: teamMember ? Number(teamMember) : null,
        dateRange,
        customStartDate,
        customEndDate,
      },
      exportMode,
      selectedIds,
      currentPageIds,
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
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['export-stats'] });
    },
    onError: (err: Error) => {
      setIsGenerating(false);
      alert(err.message || 'Export failed');
    },
  });

  const toggleStatus = (status: string) => {
    setLeadStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

  const toggleSource = (source: string) => {
    setLeadSources(prev => prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]);
  };

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

  const startGenerate = () => {
    setIsGenerating(true);
    generateMutation.mutate();
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto text-left">
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Export Leads</h2>
            <p className="text-xs text-muted-foreground mt-1">Filter leads, select format (CSV/XLSX/PDF), generate and download reports.</p>
          </div>
          <Button onClick={() => previewMutation.mutate()} disabled={previewMutation.isPending}>
            {previewMutation.isPending ? <><Loader2 size={14} className="mr-1.5 animate-spin" />Preparing...</> : <><FileDown size={14} className="mr-1.5" />Export Data</>}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Lead Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => toggleStatus(status)}
                  className={`text-[11px] px-2 py-1 rounded border ${leadStatuses.includes(status) ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/20 border-border/60 text-muted-foreground'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Lead Source</p>
            <div className="flex flex-wrap gap-2">
              {SOURCE_OPTIONS.map(source => (
                <button
                  key={source}
                  type="button"
                  onClick={() => toggleSource(source)}
                  className={`text-[11px] px-2 py-1 rounded border ${leadSources.includes(source) ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/20 border-border/60 text-muted-foreground'}`}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Team Member</p>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground"
              value={teamMember}
              onChange={e => setTeamMember(e.target.value)}
            >
              <option value="">All Members</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Date Range</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground"
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="THIS_WEEK">This Week</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="CUSTOM">Custom Date Range</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Custom Start</label>
            <Input type="datetime-local" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} disabled={dateRange !== 'CUSTOM'} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Custom End</label>
            <Input type="datetime-local" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} disabled={dateRange !== 'CUSTOM'} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Export Option</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground"
              value={exportMode}
              onChange={e => setExportMode(e.target.value as any)}
            >
              <option value="ALL">Export All Records</option>
              <option value="FILTERED">Export Filtered Records</option>
              <option value="SELECTED">Export Selected Records</option>
              <option value="CURRENT_PAGE">Export Current Page</option>
              <option value="COMPLETE_DATASET">Export Complete Dataset</option>
            </select>
          </div>
        </div>

        {(exportMode === 'SELECTED' || exportMode === 'CURRENT_PAGE') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Selected Lead IDs (comma separated)</label>
              <Input
                placeholder="e.g. 12,14,18"
                onChange={e => setSelectedIds(
                  e.target.value.split(',').map(v => Number(v.trim())).filter(v => !Number.isNaN(v) && v > 0)
                )}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Current Page Lead IDs (comma separated)</label>
              <Input
                placeholder="e.g. 21,22,23"
                onChange={e => setCurrentPageIds(
                  e.target.value.split(',').map(v => Number(v.trim())).filter(v => !Number.isNaN(v) && v > 0)
                )}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="p-3"><p className="text-[11px] text-muted-foreground">Total Exports</p><p className="text-lg font-bold">{exportStats?.totalExports || 0}</p></Card>
          <Card className="p-3"><p className="text-[11px] text-muted-foreground">Exports Today</p><p className="text-lg font-bold">{exportStats?.exportsToday || 0}</p></Card>
          <Card className="p-3"><p className="text-[11px] text-muted-foreground">Most Exported</p><p className="text-lg font-bold">{exportStats?.mostExportedReport || 'N/A'}</p></Card>
          <Card className="p-3"><p className="text-[11px] text-muted-foreground">Last Export</p><p className="text-sm font-semibold">{exportStats?.lastExportActivity ? new Date(exportStats.lastExportActivity).toLocaleString() : 'N/A'}</p></Card>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-base font-semibold text-foreground">Export History</h3>
          <div className="flex gap-2">
            <Input placeholder="Search file..." value={search} onChange={e => setSearch(e.target.value)} className="w-[180px]" />
            <select className="flex h-10 rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="PROCESSING">Processing</option>
            </select>
            <select className="flex h-10 rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground" value={fileTypeFilter} onChange={e => setFileTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              <option value="csv">CSV</option>
              <option value="xlsx">XLSX</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Export Date</TableHead>
              <TableHead>Exported By</TableHead>
              <TableHead>File Name</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Total Records</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exportHistory.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No export history.</TableCell></TableRow>
            ) : exportHistory.map(item => (
              <TableRow key={item.id}>
                <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                <TableCell>{item.exported_by_name || '-'}</TableCell>
                <TableCell>{item.file_name}</TableCell>
                <TableCell className="uppercase">{item.file_type}</TableCell>
                <TableCell>{item.total_records}</TableCell>
                <TableCell>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${
                    item.status === 'COMPLETED' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                    item.status === 'FAILED' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                    'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  }`}>{item.status}</span>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => handleDownloadFromHistory(item)}>
                    <Download size={13} className="mr-1" /> Re-download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog isOpen={showFormatModal} onClose={() => setShowFormatModal(false)} title="Export Summary & Format">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3"><p className="text-[11px] text-muted-foreground">Total Records</p><p className="text-lg font-bold">{preview?.totalRecords || 0}</p></Card>
            <Card className="p-3"><p className="text-[11px] text-muted-foreground">Won</p><p className="text-lg font-bold">{preview?.summary.won || 0}</p></Card>
            <Card className="p-3"><p className="text-[11px] text-muted-foreground">Open</p><p className="text-lg font-bold">{preview?.summary.open || 0}</p></Card>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Choose Format</p>
            <div className="flex gap-2">
              {(['csv', 'xlsx', 'pdf'] as const).map(format => (
                <button
                  key={format}
                  type="button"
                  onClick={() => setSelectedFormat(format)}
                  className={`px-3 py-2 rounded border text-xs font-semibold uppercase ${
                    selectedFormat === format ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/20 border-border/60 text-muted-foreground'
                  }`}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>
          {selectedFormat === 'pdf' && (
            <div className="p-3 rounded-lg border border-border/60 bg-muted/10 text-xs text-muted-foreground">
              PDF includes logo/title, filters, export date, total records, summary, and lead table.
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowFormatModal(false)}>Cancel</Button>
            <Button onClick={startGenerate} disabled={isGenerating}>
              {isGenerating ? <><Loader2 size={14} className="mr-1.5 animate-spin" />Generating...</> : <><FileText size={14} className="mr-1.5" />Generate & Download</>}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
