import React, { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type ImportPreviewResponse,
  type DuplicateCheckResponse,
  type ImportHistory,
  type ImportMappingTemplate,
} from '../../../api';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/forms/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/datatable/Table';
import { Input } from '../../../components/forms/Input';
import { AlertTriangle, CheckCircle2, FileUp, Loader2, RotateCcw, UploadCloud } from 'lucide-react';

const SYSTEM_FIELDS = ['name', 'phone', 'email', 'company', 'source', 'value', 'status'] as const;

type DuplicateStrategy = 'SKIP' | 'UPDATE' | 'IMPORT_ALL';

const strategyLabel: Record<DuplicateStrategy, string> = {
  SKIP: 'Skip Duplicates',
  UPDATE: 'Update Existing Leads',
  IMPORT_ALL: 'Import All Anyway',
};

export const ImportModule: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResponse | null>(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('SKIP');
  const [templateName, setTemplateName] = useState('');
  const [latestResult, setLatestResult] = useState<ImportHistory | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: templates = [] } = useQuery<ImportMappingTemplate[]>({
    queryKey: ['import-mapping-templates'],
    queryFn: api.getImportMappingTemplates,
  });

  const { data: history = [], refetch: refetchHistory } = useQuery<ImportHistory[]>({
    queryKey: ['import-history', search, statusFilter],
    queryFn: () => api.getImportHistory({ search, status: statusFilter || undefined }),
  });

  const previewMutation = useMutation({
    mutationFn: (f: File) => api.previewLeadImport(f, setUploadProgress),
    onSuccess: data => {
      setPreview(data);
      setMapping(data.detectedMapping || {});
      setStep(1);
      setUploadProgress(100);
    },
    onError: (err: Error) => alert(err.message || 'Preview failed'),
  });

  const duplicateMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('No file selected');
      return api.checkLeadImportDuplicates(file, mapping, setUploadProgress);
    },
    onSuccess: data => {
      setDuplicateResult(data);
      setStep(3);
      setUploadProgress(100);
    },
    onError: (err: Error) => alert(err.message || 'Duplicate check failed'),
  });

  const importMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('No file selected');
      return api.executeLeadImport(file, mapping, duplicateStrategy, setUploadProgress);
    },
    onSuccess: data => {
      setLatestResult(data);
      setStep(5);
      setUploadProgress(100);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['import-history'] });
      refetchHistory();
    },
    onError: (err: Error) => alert(err.message || 'Import failed'),
  });

  const saveTemplateMutation = useMutation({
    mutationFn: () => api.createImportMappingTemplate(templateName, mapping),
    onSuccess: () => {
      setTemplateName('');
      queryClient.invalidateQueries({ queryKey: ['import-mapping-templates'] });
    },
    onError: (err: Error) => alert(err.message || 'Failed to save template'),
  });

  const retryMutation = useMutation({
    mutationFn: (id: number) => api.retryImportFailed(id),
    onSuccess: data => {
      setLatestResult(data);
      setStep(5);
      queryClient.invalidateQueries({ queryKey: ['import-history'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      refetchHistory();
    },
    onError: (err: Error) => alert(err.message || 'Retry failed'),
  });

  const canCheckDuplicates = useMemo(
    () => !!file && ['name', 'phone', 'email'].some(k => mapping[k]),
    [file, mapping]
  );

  const resetFlow = () => {
    setStep(0);
    setFile(null);
    setPreview(null);
    setMapping({});
    setDuplicateResult(null);
    setLatestResult(null);
    setUploadProgress(0);
  };

  const onPickFile = (picked: File | null) => {
    if (!picked) return;
    const valid = picked.name.toLowerCase().endsWith('.csv') || picked.name.toLowerCase().endsWith('.xlsx');
    if (!valid) {
      alert('Only .csv and .xlsx files are supported.');
      return;
    }
    setFile(picked);
    setUploadProgress(0);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadErrorReport = async (importId: number) => {
    try {
      const blob = await api.downloadImportErrorReport(importId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `import_errors_${importId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Download failed');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto text-left">
      <Card className="p-6 space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" onClick={resetFlow}>
            <RotateCcw size={14} className="mr-1.5" /> Start New Import
          </Button>
        </div>
        {step === 0 && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-border/70 rounded-xl p-8 text-center bg-muted/10"
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                onPickFile(e.dataTransfer.files?.[0] || null);
              }}
            >
              <UploadCloud size={28} className="mx-auto text-primary mb-2" />
              <p className="text-sm font-semibold text-foreground">Drag & drop CSV/XLSX file</p>
              <p className="text-xs text-muted-foreground mt-1">or choose from your system</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                id="lead-import-file"
                onChange={e => onPickFile(e.target.files?.[0] || null)}
              />
              <Button type="button" variant="outline" className="mt-3" onClick={openFilePicker}>
                <FileUp size={14} className="mr-1.5" /> Select File
              </Button>
            </div>
            {file && (
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{file.name}</span> · {(file.size / 1024).toFixed(1)} KB
              </div>
            )}
            {(previewMutation.isPending || uploadProgress > 0) && (
              <div className="space-y-1">
                <div className="h-2 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="text-[11px] text-muted-foreground">{uploadProgress}%</p>
              </div>
            )}
            <div className="flex justify-end">
              <Button
                type="button"
                disabled={!file || previewMutation.isPending}
                onClick={() => file && previewMutation.mutate(file)}
              >
                {previewMutation.isPending ? <><Loader2 size={14} className="mr-1.5 animate-spin" />Uploading...</> : 'Upload & Preview'}
              </Button>
            </div>
          </div>
        )}

        {step === 1 && preview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-3"><p className="text-[11px] text-muted-foreground">Total Records</p><p className="text-lg font-bold">{preview.totalRecords}</p></Card>
              <Card className="p-3"><p className="text-[11px] text-muted-foreground">Preview Rows</p><p className="text-lg font-bold">{preview.previewRows.length}</p></Card>
              <Card className="p-3"><p className="text-[11px] text-muted-foreground">Invalid Rows</p><p className="text-lg font-bold text-amber-500">{preview.invalidRows}</p></Card>
              <Card className="p-3"><p className="text-[11px] text-muted-foreground">Empty Rows</p><p className="text-lg font-bold text-red-400">{preview.emptyRows}</p></Card>
            </div>

            <div className="border border-border/50 rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    {preview.headers.slice(0, 6).map(h => <TableHead key={h}>{h}</TableHead>)}
                    <TableHead>Validation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.previewRows.map(r => (
                    <TableRow key={r.rowNumber} className={r.errors.length ? 'bg-red-500/5' : ''}>
                      <TableCell>{r.rowNumber}</TableCell>
                      {preview.headers.slice(0, 6).map(h => <TableCell key={`${r.rowNumber}-${h}`}>{r.raw[h] || '-'}</TableCell>)}
                      <TableCell>
                        {r.isEmpty ? (
                          <span className="text-[10px] px-2 py-0.5 rounded border bg-red-500/10 border-red-500/20 text-red-400">Empty</span>
                        ) : r.errors.length ? (
                          <span className="text-[10px] px-2 py-0.5 rounded border bg-amber-500/10 border-amber-500/20 text-amber-400">{r.errors.join(', ')}</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded border bg-green-500/10 border-green-500/20 text-green-400">Valid</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={resetFlow}>Cancel Import</Button>
              <Button onClick={() => setStep(2)}>Continue to Mapping</Button>
            </div>
          </div>
        )}

        {step === 2 && preview && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SYSTEM_FIELDS.map(field => (
                <div key={field} className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">{field}</label>
                  <select
                    className="flex h-10 rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground"
                    value={mapping[field] || ''}
                    onChange={e => setMapping(prev => ({ ...prev, [field]: e.target.value }))}
                  >
                    <option value="">Not mapped</option>
                    {preview.headers.map(h => <option key={`${field}-${h}`} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Save Mapping Template</label>
                <Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Template name (e.g., Meta Ads CSV)" />
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={!templateName.trim() || saveTemplateMutation.isPending}
                onClick={() => saveTemplateMutation.mutate()}
              >
                Save Template
              </Button>
            </div>

            {templates.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {templates.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className="text-xs px-2 py-1 rounded border bg-muted/20 border-border/60 hover:bg-muted/40"
                    onClick={() => setMapping(t.mapping)}
                  >
                    Use: {t.name}
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button disabled={!canCheckDuplicates || duplicateMutation.isPending} onClick={() => duplicateMutation.mutate()}>
                {duplicateMutation.isPending ? <><Loader2 size={14} className="mr-1.5 animate-spin" />Checking...</> : 'Check Duplicates'}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card className="p-3"><p className="text-[11px] text-muted-foreground">Duplicates Found</p><p className="text-lg font-bold text-amber-500">{duplicateResult?.duplicateCount || 0}</p></Card>
              <Card className="p-3"><p className="text-[11px] text-muted-foreground">Records</p><p className="text-lg font-bold">{preview?.totalRecords || 0}</p></Card>
              <Card className="p-3"><p className="text-[11px] text-muted-foreground">Strategy</p><p className="text-sm font-bold">{strategyLabel[duplicateStrategy]}</p></Card>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Duplicate Handling</label>
              <div className="flex flex-wrap gap-2">
                {(['SKIP', 'UPDATE', 'IMPORT_ALL'] as DuplicateStrategy[]).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDuplicateStrategy(s)}
                    className={`text-xs px-3 py-1.5 rounded border ${duplicateStrategy === s ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/20 border-border/60 text-muted-foreground'}`}
                  >
                    {strategyLabel[s]}
                  </button>
                ))}
              </div>
            </div>

            {(duplicateResult?.duplicates?.length || 0) > 0 && (
              <div className="border border-border/50 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Match</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {duplicateResult?.duplicates.slice(0, 20).map(d => (
                      <TableRow key={`${d.rowNumber}-${d.matchedLeadId}`}>
                        <TableCell>{d.rowNumber}</TableCell>
                        <TableCell>{d.name || '-'}</TableCell>
                        <TableCell>{d.phone || '-'}</TableCell>
                        <TableCell>{d.email || '-'}</TableCell>
                        <TableCell>
                          <span className="text-[10px] px-2 py-0.5 rounded border bg-amber-500/10 border-amber-500/20 text-amber-400 uppercase">{d.matchReason}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => { setStep(4); importMutation.mutate(); }} disabled={importMutation.isPending}>
                Start Import
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-10 space-y-3">
            <Loader2 size={28} className="mx-auto animate-spin text-primary" />
            <p className="font-semibold text-foreground">Import processing in batches...</p>
            <div className="h-2 bg-muted rounded overflow-hidden max-w-md mx-auto">
              <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
          </div>
        )}

        {step === 5 && latestResult && (
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              {latestResult.status === 'COMPLETED' ? (
                <CheckCircle2 className="text-green-400 mt-0.5" size={18} />
              ) : (
                <AlertTriangle className="text-amber-400 mt-0.5" size={18} />
              )}
              <div>
                <h3 className="font-bold text-foreground">Import {latestResult.status.toLowerCase()}</h3>
                <p className="text-xs text-muted-foreground">File: {latestResult.file_name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-3"><p className="text-[11px] text-muted-foreground">Total</p><p className="text-lg font-bold">{latestResult.total_records}</p></Card>
              <Card className="p-3"><p className="text-[11px] text-muted-foreground">Success</p><p className="text-lg font-bold text-green-400">{latestResult.success_count}</p></Card>
              <Card className="p-3"><p className="text-[11px] text-muted-foreground">Failed</p><p className="text-lg font-bold text-red-400">{latestResult.failed_count}</p></Card>
              <Card className="p-3"><p className="text-[11px] text-muted-foreground">Duplicates</p><p className="text-lg font-bold text-amber-400">{latestResult.duplicate_count}</p></Card>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => handleDownloadErrorReport(latestResult.id)}>Download Error Report</Button>
              {latestResult.failed_count > 0 && (
                <Button variant="outline" onClick={() => retryMutation.mutate(latestResult.id)} disabled={retryMutation.isPending}>
                  {retryMutation.isPending ? 'Retrying...' : 'Retry Failed Imports'}
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-base font-semibold text-foreground">Import History</h3>
          <div className="flex gap-2">
            <Input placeholder="Search file..." value={search} onChange={e => setSearch(e.target.value)} className="w-[180px]" />
            <select
              className="flex h-10 rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="PARTIAL">Partial</option>
              <option value="FAILED">Failed</option>
              <option value="PROCESSING">Processing</option>
            </select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Imported By</TableHead>
              <TableHead>File Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Success</TableHead>
              <TableHead>Failed</TableHead>
              <TableHead>Duplicates</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">No import history.</TableCell>
              </TableRow>
            ) : history.map(h => (
              <TableRow key={h.id}>
                <TableCell>{new Date(h.created_at).toLocaleString()}</TableCell>
                <TableCell>{h.imported_by_name || '-'}</TableCell>
                <TableCell>{h.file_name}</TableCell>
                <TableCell className="uppercase">{h.file_type}</TableCell>
                <TableCell>{h.total_records}</TableCell>
                <TableCell>{h.success_count}</TableCell>
                <TableCell>{h.failed_count}</TableCell>
                <TableCell>{h.duplicate_count}</TableCell>
                <TableCell>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${
                    h.status === 'COMPLETED' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                    h.status === 'PARTIAL' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                    h.status === 'FAILED' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                    'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  }`}>
                    {h.status}
                  </span>
                </TableCell>
                <TableCell className="space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleDownloadErrorReport(h.id)}>Errors</Button>
                  {h.failed_count > 0 && (
                    <Button size="sm" variant="outline" onClick={() => retryMutation.mutate(h.id)}>Retry</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
