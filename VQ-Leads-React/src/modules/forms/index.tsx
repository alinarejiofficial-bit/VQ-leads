import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type LeadForm } from '../../api';
import { Button } from '../../components/forms/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/forms/Input';
import { Dialog } from '../../components/common/Dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/datatable/Table';
import { Plus, ExternalLink, Check, Copy } from 'lucide-react';

export const Forms: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [mode, setMode] = useState<'MANUAL' | 'ROUND_ROBIN'>('ROUND_ROBIN');
  const [sourceName, setSourceName] = useState('Website Inbound');

  // React Queries
  const { data: forms = [] } = useQuery<LeadForm[]>({
    queryKey: ['forms'],
    queryFn: api.getForms,
  });

  const createFormMutation = useMutation({
    mutationFn: api.createForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      setIsModalOpen(false);
      setName('');
      setDesc('');
      setMode('ROUND_ROBIN');
      setSourceName('Website Inbound');
    }
  });

  const deleteFormMutation = useMutation({
    mutationFn: api.deleteForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    }
  });

  const handleCreateForm = (e: React.FormEvent) => {
    e.preventDefault();
    createFormMutation.mutate({
      name,
      description: desc,
      assignment_mode: mode,
      source_name: sourceName,
      is_active: true
    });
  };

  const copyEmbedCode = (id: number) => {
    const publicUrl = `${window.location.origin}/public-form/${id}`;
    const iframeCode = `<iframe src="${publicUrl}" width="100%" height="600" style="border:none;border-radius:12px;"></iframe>`;
    navigator.clipboard.writeText(iframeCode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-end border-b border-border/40 pb-4">
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={16} className="mr-1.5" /> Create Lead Form
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent cursor-default">
              <TableHead>Form Details</TableHead>
              <TableHead>Assignment Mode</TableHead>
              <TableHead>Source Logged</TableHead>
              <TableHead>Public URL</TableHead>
              <TableHead>Embed Code</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {forms.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  No forms created yet.
                </TableCell>
              </TableRow>
            ) : (
              forms.map(f => (
                <TableRow key={f.id} className="hover:bg-transparent cursor-default">
                  <TableCell className="text-left font-semibold text-foreground">
                    <div className="flex flex-col">
                      <span>{f.name}</span>
                      <span className="text-[11px] font-normal text-muted-foreground mt-0.5">{f.description || 'No description'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      f.assignment_mode === 'ROUND_ROBIN' 
                        ? 'bg-primary/10 border-primary/20 text-primary-foreground' 
                        : 'bg-muted/40 border-border text-muted-foreground'
                    }`}>
                      {f.assignment_mode.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>{f.source_name}</TableCell>
                  <TableCell>
                    <a 
                      href={`/public-form/${f.id}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 text-xs font-semibold"
                    >
                      Open Form <ExternalLink size={12} />
                    </a>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => copyEmbedCode(f.id)} className="h-8 text-xs font-semibold">
                      {copiedId === f.id ? <Check size={13} className="mr-1 text-green-400" /> : <Copy size={13} className="mr-1" />}
                      <span>{copiedId === f.id ? 'Copied Code!' : 'Copy Code'}</span>
                    </Button>
                  </TableCell>
                  <TableCell>
                    <button 
                      className="text-xs font-semibold text-destructive hover:underline"
                      onClick={() => deleteFormMutation.mutate(f.id)}
                    >
                      Delete
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Form Modal */}
      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Lead Submission Form">
        <form onSubmit={handleCreateForm} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">Form Name</label>
            <Input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Inbound Website Inquiries"
              required 
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">Description</label>
            <textarea 
              className="flex w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring min-h-[70px]" 
              value={desc} 
              onChange={e => setDesc(e.target.value)} 
              placeholder="Describe where this form layout is integrated"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Assignment Method</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer"
                value={mode} 
                onChange={e => setMode(e.target.value as any)}
              >
                <option value="ROUND_ROBIN">Round Robin (Celery)</option>
                <option value="MANUAL">Manual Assignments</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Lead Source Tag</label>
              <Input 
                type="text" 
                value={sourceName} 
                onChange={e => setSourceName(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createFormMutation.isPending}>
              {createFormMutation.isPending ? 'Creating...' : 'Create Form'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
export default Forms;
