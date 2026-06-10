import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { api, type FormFieldConfig, type FormFieldType, type LeadForm } from '../../api';
import { Button } from '../../components/forms/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/forms/Input';
import { Dialog } from '../../components/common/Dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/datatable/Table';
import { Plus, ExternalLink, Check, Copy, Search, Pencil, Trash2, Power, CopyPlus, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';

const FIELD_TYPES: { id: FormFieldType; label: string }[] = [
  { id: 'TEXT', label: 'Text' },
  { id: 'EMAIL', label: 'Email' },
  { id: 'PHONE', label: 'Phone' },
  { id: 'NUMBER', label: 'Number' },
  { id: 'DROPDOWN', label: 'Dropdown' },
  { id: 'RADIO', label: 'Radio Button' },
  { id: 'CHECKBOX', label: 'Checkbox' },
  { id: 'DATE', label: 'Date Picker' },
  { id: 'TEXTAREA', label: 'Text Area' },
  { id: 'FILE', label: 'File Upload' },
];

const defaultBuilderFields = (): FormFieldConfig[] => ([
  { id: 'name', key: 'name', label: 'Full Name', type: 'TEXT', required: true, placeholder: 'e.g. John Doe', map_to: 'name' },
  { id: 'email', key: 'email', label: 'Email Address', type: 'EMAIL', required: false, placeholder: 'john@example.com', map_to: 'email' },
  { id: 'phone', key: 'phone', label: 'Phone Number', type: 'PHONE', required: false, placeholder: '+1 555 000 0000', map_to: 'phone' },
  { id: 'notes', key: 'notes', label: 'Inquiry Details', type: 'TEXTAREA', required: false, placeholder: 'How can we help?', map_to: 'notes' },
]);

function FormBuilder({
  fields,
  setFields,
}: {
  fields: FormFieldConfig[];
  setFields: React.Dispatch<React.SetStateAction<FormFieldConfig[]>>;
}) {
  const [addType, setAddType] = useState<FormFieldType>('TEXT');

  const updateField = (id: string, patch: Partial<FormFieldConfig>) => {
    setFields(prev => prev.map(f => (f.id === id ? { ...f, ...patch } : f)));
  };

  const removeField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  };

  const moveField = (index: number, dir: -1 | 1) => {
    setFields(prev => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addField = () => {
    const stamp = `${Date.now()}`;
    const keyBase = `${addType.toLowerCase()}_${fields.length + 1}`;
    setFields(prev => [
      ...prev,
      {
        id: `fld_${stamp}`,
        key: keyBase,
        label: FIELD_TYPES.find(t => t.id === addType)?.label || 'Field',
        type: addType,
        required: false,
        placeholder: '',
        options: addType === 'DROPDOWN' || addType === 'RADIO' || addType === 'CHECKBOX' ? ['Option 1', 'Option 2'] : [],
        validation: {},
        map_to: 'NONE',
      },
    ]);
  };

  const listInputCls = 'flex h-9 w-full rounded-md border border-input bg-muted/20 px-2.5 py-2 text-xs text-foreground focus:outline-none';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">Drag &amp; Drop Form Builder</p>
        <div className="flex gap-2">
          <select className="h-9 rounded-md border border-input bg-muted/20 px-2.5 text-xs" value={addType} onChange={e => setAddType(e.target.value as FormFieldType)}>
            {FIELD_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <Button type="button" variant="outline" size="sm" className="h-9 text-xs" onClick={addField}>
            <Plus size={12} className="mr-1" /> Add Field
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {fields.length === 0 ? (
          <div className="text-xs text-muted-foreground border border-dashed border-border/60 rounded-md p-4 text-center">
            No fields yet. Add your first field.
          </div>
        ) : fields.map((f, idx) => (
          <div key={f.id} className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2 text-left">
            <div className="flex items-center gap-2">
              <GripVertical size={14} className="text-muted-foreground" />
              <Input className="h-9 text-xs" value={f.label} onChange={e => updateField(f.id, { label: e.target.value })} placeholder="Field label" />
              <select className="h-9 rounded-md border border-input bg-muted/20 px-2.5 text-xs" value={f.type} onChange={e => updateField(f.id, { type: e.target.value as FormFieldType })}>
                {FIELD_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <button type="button" className="h-8 w-8 rounded border border-border/50 text-muted-foreground hover:text-foreground" onClick={() => moveField(idx, -1)}><ChevronUp size={13} /></button>
              <button type="button" className="h-8 w-8 rounded border border-border/50 text-muted-foreground hover:text-foreground" onClick={() => moveField(idx, 1)}><ChevronDown size={13} /></button>
              <button type="button" className="h-8 px-2 rounded border border-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/10" onClick={() => removeField(f.id)}>Remove</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Input className="h-9 text-xs" value={f.key} onChange={e => updateField(f.id, { key: e.target.value.replace(/[^a-zA-Z0-9_]/g, '_') })} placeholder="field_key" />
              <Input className="h-9 text-xs" value={f.placeholder || ''} onChange={e => updateField(f.id, { placeholder: e.target.value })} placeholder="Placeholder" />
              <select className={listInputCls} value={f.map_to || 'NONE'} onChange={e => updateField(f.id, { map_to: e.target.value as any })}>
                <option value="NONE">Not mapped</option>
                <option value="name">Map to Lead Name</option>
                <option value="email">Map to Lead Email</option>
                <option value="phone">Map to Lead Phone</option>
                <option value="company">Map to Company</option>
                <option value="value">Map to Lead Value</option>
                <option value="notes">Map to Notes</option>
              </select>
              <label className="h-9 inline-flex items-center gap-2 rounded-md border border-input bg-muted/20 px-2.5 text-xs text-foreground">
                <input type="checkbox" checked={f.required} onChange={e => updateField(f.id, { required: e.target.checked })} />
                Required
              </label>
            </div>
            {(f.type === 'DROPDOWN' || f.type === 'RADIO' || f.type === 'CHECKBOX') && (
              <Input
                className="h-9 text-xs"
                value={(f.options || []).join(', ')}
                onChange={e => updateField(f.id, { options: e.target.value.split(',').map(v => v.trim()).filter(Boolean) })}
                placeholder="Options (comma separated)"
              />
            )}
            {(f.type === 'TEXT' || f.type === 'TEXTAREA' || f.type === 'EMAIL' || f.type === 'PHONE') && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Input className="h-9 text-xs" type="number" placeholder="Min length" value={f.validation?.min_length ?? ''} onChange={e => updateField(f.id, { validation: { ...f.validation, min_length: e.target.value ? Number(e.target.value) : undefined } })} />
                <Input className="h-9 text-xs" type="number" placeholder="Max length" value={f.validation?.max_length ?? ''} onChange={e => updateField(f.id, { validation: { ...f.validation, max_length: e.target.value ? Number(e.target.value) : undefined } })} />
                <Input className="h-9 text-xs" placeholder="Regex pattern (optional)" value={f.validation?.pattern ?? ''} onChange={e => updateField(f.id, { validation: { ...f.validation, pattern: e.target.value || undefined } })} />
              </div>
            )}
            {f.type === 'NUMBER' && (
              <div className="grid grid-cols-2 gap-2">
                <Input className="h-9 text-xs" type="number" placeholder="Min" value={f.validation?.min ?? ''} onChange={e => updateField(f.id, { validation: { ...f.validation, min: e.target.value ? Number(e.target.value) : undefined } })} />
                <Input className="h-9 text-xs" type="number" placeholder="Max" value={f.validation?.max ?? ''} onChange={e => updateField(f.id, { validation: { ...f.validation, max: e.target.value ? Number(e.target.value) : undefined } })} />
              </div>
            )}
            {f.type === 'FILE' && (
              <div className="grid grid-cols-2 gap-2">
                <Input className="h-9 text-xs" placeholder=".pdf,.png,.jpg" value={(f.validation?.file_types || []).join(',')} onChange={e => updateField(f.id, { validation: { ...f.validation, file_types: e.target.value.split(',').map(v => v.trim()).filter(Boolean) } })} />
                <Input className="h-9 text-xs" type="number" placeholder="Max MB" value={f.validation?.max_file_mb ?? ''} onChange={e => updateField(f.id, { validation: { ...f.validation, max_file_mb: e.target.value ? Number(e.target.value) : undefined } })} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export const Forms: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<LeadForm | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get('tab') || 'forms';
  const action = searchParams.get('action');

  // Form states
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [mode, setMode] = useState<'MANUAL' | 'ROUND_ROBIN'>('ROUND_ROBIN');
  const [sourceName, setSourceName] = useState('Website Inbound');
  const [formFields, setFormFields] = useState<FormFieldConfig[]>(defaultBuilderFields());
  const [multiStepEnabled, setMultiStepEnabled] = useState(false);
  const [thankYouMode, setThankYouMode] = useState<'DEFAULT' | 'MESSAGE' | 'REDIRECT'>('DEFAULT');
  const [thankYouMessage, setThankYouMessage] = useState('Thank you! Your inquiry has been submitted.');
  const [thankYouRedirectUrl, setThankYouRedirectUrl] = useState('');

  const { data: forms = [] } = useQuery<LeadForm[]>({
    queryKey: ['forms', search],
    queryFn: () => api.getForms({ q: search.trim() || undefined }),
  });

  React.useEffect(() => {
    if (action === 'create') {
      openCreateModal();
    }
  }, [action]);

  const createFormMutation = useMutation({
    mutationFn: api.createForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      setIsCreateModalOpen(false);
      setName('');
      setDesc('');
      setMode('ROUND_ROBIN');
      setSourceName('Website Inbound');
      setFormFields(defaultBuilderFields());
      setMultiStepEnabled(false);
      setThankYouMode('DEFAULT');
      setThankYouMessage('Thank you! Your inquiry has been submitted.');
      setThankYouRedirectUrl('');
    }
  });

  const updateFormMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<LeadForm> }) => api.updateForm(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      setEditingForm(null);
    }
  });

  const deleteFormMutation = useMutation({
    mutationFn: api.deleteForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    }
  });

  const duplicateFormMutation = useMutation({
    mutationFn: api.duplicateForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: api.toggleFormActive,
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
      is_active: true,
      form_fields: formFields,
      multi_step_enabled: multiStepEnabled,
      thank_you_mode: thankYouMode,
      thank_you_message: thankYouMessage,
      thank_you_redirect_url: thankYouRedirectUrl,
    });
  };

  const handleUpdateForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingForm) return;
    updateFormMutation.mutate({
      id: editingForm.id,
      payload: {
        name: editingForm.name,
        description: editingForm.description,
        assignment_mode: editingForm.assignment_mode,
        source_name: editingForm.source_name,
        form_fields: editingForm.form_fields || defaultBuilderFields(),
        multi_step_enabled: !!editingForm.multi_step_enabled,
        thank_you_mode: editingForm.thank_you_mode || 'DEFAULT',
        thank_you_message: editingForm.thank_you_message || '',
        thank_you_redirect_url: editingForm.thank_you_redirect_url || '',
      }
    });
  };

  const copyEmbedCode = (id: number) => {
    const publicUrl = `${window.location.origin}/public-form/${id}`;
    const iframeCode = `<iframe src="${publicUrl}" width="100%" height="600" style="border:none;border-radius:12px;"></iframe>`;
    navigator.clipboard.writeText(iframeCode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  function openCreateModal() {
    setName('');
    setDesc('');
    setMode('ROUND_ROBIN');
    setSourceName('Website Inbound');
    setFormFields(defaultBuilderFields());
    setMultiStepEnabled(false);
    setThankYouMode('DEFAULT');
    setThankYouMessage('Thank you! Your inquiry has been submitted.');
    setThankYouRedirectUrl('');
    setIsCreateModalOpen(true);
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/40 pb-4 gap-4">
        <div className="flex gap-4">
          {[
            { id: 'forms', label: 'All Forms', path: '/forms' },
            { id: 'submissions', label: 'Submissions', path: '/forms?tab=submissions' },
            { id: 'embed', label: 'Embed Codes', path: '/forms?tab=embed' }
          ].map(t => (
            <a key={t.id} href={t.path} className={`pb-4 -mb-4 px-2 text-sm font-medium ${tab === t.id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {t.label}
            </a>
          ))}
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={16} className="mr-1.5" /> Create Lead Form
        </Button>
      </div>

      {tab === 'forms' && (
        <>
        <div className="flex items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search forms by name, source, description..."
              className="pl-9"
            />
          </div>
        </div>
        <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent cursor-default">
              <TableHead>Form Details</TableHead>
              <TableHead>Assignment Mode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source Logged</TableHead>
              <TableHead>Submission Count</TableHead>
              <TableHead>Public URL</TableHead>
              <TableHead>Embed Code</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {forms.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
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
                  <TableCell>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      f.is_active
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      {f.is_active ? 'Enabled' : 'Disabled'}
                    </span>
                  </TableCell>
                  <TableCell>{f.source_name}</TableCell>
                  <TableCell>
                    <span className="text-xs font-bold text-foreground">{f.submission_count ?? 0}</span>
                  </TableCell>
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
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setEditingForm({
                          ...f,
                          form_fields: f.form_fields?.length ? f.form_fields : defaultBuilderFields(),
                          multi_step_enabled: !!f.multi_step_enabled,
                          thank_you_mode: f.thank_you_mode || 'DEFAULT',
                          thank_you_message: f.thank_you_message || 'Thank you! Your inquiry has been submitted.',
                          thank_you_redirect_url: f.thank_you_redirect_url || '',
                        })}
                        title="Edit Form"
                      >
                        <Pencil size={12} className="mr-1" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => duplicateFormMutation.mutate(f.id)}
                        title="Duplicate Form"
                      >
                        <CopyPlus size={12} className="mr-1" /> Duplicate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => toggleActiveMutation.mutate(f.id)}
                        title={f.is_active ? 'Disable Form' : 'Enable Form'}
                      >
                        <Power size={12} className="mr-1" />
                        {f.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (window.confirm(`Delete form "${f.name}"?`)) {
                            deleteFormMutation.mutate(f.id);
                          }
                        }}
                        title="Delete Form"
                      >
                        <Trash2 size={12} className="mr-1" /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      </>
      )}

      {tab === 'submissions' && (
        <div className="p-6 bg-card rounded-xl border border-border/40 text-muted-foreground text-left">
          <p>This is the Submissions view. Shows all form submissions across all active forms.</p>
        </div>
      )}

      {tab === 'embed' && (
        <div className="p-6 bg-card rounded-xl border border-border/40 text-muted-foreground text-left">
          <p>This is the Embed Codes view. Provides centralized access to all iframe and script embed codes for your forms.</p>
        </div>
      )}

      {/* Create Form Modal */}
      <Dialog isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Lead Submission Form">
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

          <div className="space-y-3 border rounded-lg border-border/50 p-3 bg-muted/10">
            <FormBuilder fields={formFields} setFields={setFormFields} />
          </div>

          <div className="space-y-3 border rounded-lg border-border/50 p-3 bg-muted/10">
            <p className="text-xs font-semibold text-foreground">Form Experience</p>
            <label className="inline-flex items-center gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                checked={multiStepEnabled}
                onChange={e => setMultiStepEnabled(e.target.checked)}
              />
              Multi-Step Forms
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none"
                value={thankYouMode}
                onChange={e => setThankYouMode(e.target.value as 'DEFAULT' | 'MESSAGE' | 'REDIRECT')}
              >
                <option value="DEFAULT">Default Thank You</option>
                <option value="MESSAGE">Custom Thank You Message</option>
                <option value="REDIRECT">Custom Thank You Page URL</option>
              </select>
              {thankYouMode === 'MESSAGE' && (
                <Input
                  className="md:col-span-2"
                  value={thankYouMessage}
                  onChange={e => setThankYouMessage(e.target.value)}
                  placeholder="Custom thank you message"
                />
              )}
              {thankYouMode === 'REDIRECT' && (
                <Input
                  className="md:col-span-2"
                  value={thankYouRedirectUrl}
                  onChange={e => setThankYouRedirectUrl(e.target.value)}
                  placeholder="https://example.com/thank-you"
                />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createFormMutation.isPending}>
              {createFormMutation.isPending ? 'Creating...' : 'Create Form'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Form Modal */}
      <Dialog isOpen={!!editingForm} onClose={() => setEditingForm(null)} title="Edit Lead Form">
        {editingForm && (
          <form onSubmit={handleUpdateForm} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Form Name</label>
              <Input
                type="text"
                value={editingForm.name}
                onChange={e => setEditingForm({ ...editingForm, name: e.target.value })}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Description</label>
              <textarea
                className="flex w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring min-h-[70px]"
                value={editingForm.description}
                onChange={e => setEditingForm({ ...editingForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-foreground">Assignment Method</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer"
                  value={editingForm.assignment_mode}
                  onChange={e => setEditingForm({ ...editingForm, assignment_mode: e.target.value as 'MANUAL' | 'ROUND_ROBIN' })}
                >
                  <option value="ROUND_ROBIN">Round Robin (Celery)</option>
                  <option value="MANUAL">Manual Assignments</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-foreground">Lead Source Tag</label>
                <Input
                  type="text"
                  value={editingForm.source_name}
                  onChange={e => setEditingForm({ ...editingForm, source_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-3 border rounded-lg border-border/50 p-3 bg-muted/10">
              <FormBuilder
                fields={editingForm.form_fields || defaultBuilderFields()}
                setFields={(updater) => {
                  setEditingForm(prev => {
                    if (!prev) return prev;
                    const current = prev.form_fields || defaultBuilderFields();
                    const next = typeof updater === 'function' ? updater(current) : updater;
                    return { ...prev, form_fields: next };
                  });
                }}
              />
            </div>

            <div className="space-y-3 border rounded-lg border-border/50 p-3 bg-muted/10">
              <p className="text-xs font-semibold text-foreground">Form Experience</p>
              <label className="inline-flex items-center gap-2 text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={!!editingForm.multi_step_enabled}
                  onChange={e => setEditingForm({ ...editingForm, multi_step_enabled: e.target.checked })}
                />
                Multi-Step Forms
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none"
                  value={editingForm.thank_you_mode || 'DEFAULT'}
                  onChange={e => setEditingForm({ ...editingForm, thank_you_mode: e.target.value as 'DEFAULT' | 'MESSAGE' | 'REDIRECT' })}
                >
                  <option value="DEFAULT">Default Thank You</option>
                  <option value="MESSAGE">Custom Thank You Message</option>
                  <option value="REDIRECT">Custom Thank You Page URL</option>
                </select>
                {(editingForm.thank_you_mode || 'DEFAULT') === 'MESSAGE' && (
                  <Input
                    className="md:col-span-2"
                    value={editingForm.thank_you_message || ''}
                    onChange={e => setEditingForm({ ...editingForm, thank_you_message: e.target.value })}
                    placeholder="Custom thank you message"
                  />
                )}
                {(editingForm.thank_you_mode || 'DEFAULT') === 'REDIRECT' && (
                  <Input
                    className="md:col-span-2"
                    value={editingForm.thank_you_redirect_url || ''}
                    onChange={e => setEditingForm({ ...editingForm, thank_you_redirect_url: e.target.value })}
                    placeholder="https://example.com/thank-you"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
              <Button type="button" variant="outline" onClick={() => setEditingForm(null)}>Cancel</Button>
              <Button type="submit" disabled={updateFormMutation.isPending}>
                {updateFormMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
};
export default Forms;
