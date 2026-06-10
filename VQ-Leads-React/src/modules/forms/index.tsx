import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { api, type FormFieldConfig, type FormFieldType, type LeadForm } from '../../api';
import { Button } from '../../components/forms/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/forms/Input';
import { Dialog } from '../../components/common/Dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/datatable/Table';
import { Plus, ExternalLink, Check, Copy, Search, Pencil, Trash2, Power, CopyPlus, GripVertical, ChevronUp, ChevronDown, FileCode, Layers, Sparkles, Users, Tag } from 'lucide-react';

const selectClass =
  'flex h-10 w-full rounded-lg border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer';

const compactSelectClass =
  'flex h-9 w-full rounded-lg border border-input bg-muted/20 px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

function FormSection({
  icon,
  title,
  description,
  accent = 'violet',
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  accent?: 'violet' | 'blue' | 'emerald' | 'amber';
  children: React.ReactNode;
}) {
  const styles = {
    violet: {
      wrap: 'border-violet-500/20 bg-gradient-to-br from-violet-500/[0.07] to-transparent',
      icon: 'bg-violet-500/15 text-violet-500',
    },
    blue: {
      wrap: 'border-blue-500/20 bg-gradient-to-br from-blue-500/[0.07] to-transparent',
      icon: 'bg-blue-500/15 text-blue-500',
    },
    emerald: {
      wrap: 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.07] to-transparent',
      icon: 'bg-emerald-500/15 text-emerald-500',
    },
    amber: {
      wrap: 'border-amber-500/20 bg-gradient-to-br from-amber-500/[0.07] to-transparent',
      icon: 'bg-amber-500/15 text-amber-500',
    },
  }[accent];

  return (
    <section className={`overflow-hidden rounded-xl border ${styles.wrap}`}>
      <div className="flex items-start gap-3 border-b border-border/40 bg-card/40 px-4 py-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}>
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

function FieldLabel({ label, hint, required }: { label: string; hint?: string; required?: boolean }) {
  return (
    <div className="mb-1.5">
      <label className="text-xs font-semibold text-foreground">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function StyledTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      className="flex min-h-[80px] w-full resize-y rounded-lg border border-input bg-muted/20 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function ExperienceToggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/60 px-4 py-3 transition-colors hover:bg-muted/20">
      <div>
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'left-5' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

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

  const listInputCls = compactSelectClass;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-lg border border-border/50 bg-card/50 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-foreground">Form Fields</p>
          <p className="text-[11px] text-muted-foreground">Add, reorder, and map fields to lead properties.</p>
        </div>
        <div className="flex gap-2">
          <select className={`${compactSelectClass} w-[140px]`} value={addType} onChange={e => setAddType(e.target.value as FormFieldType)}>
            {FIELD_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <Button type="button" variant="outline" size="sm" className="h-9 border-primary/30 text-xs text-primary hover:bg-primary/10" onClick={addField}>
            <Plus size={12} className="mr-1" /> Add Field
          </Button>
        </div>
      </div>

      <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
        {fields.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 px-4 py-10 text-center">
            <Layers size={28} className="mx-auto mb-2 text-muted-foreground/60" />
            <p className="text-sm font-medium text-foreground">No fields yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Use the button above to add your first field.</p>
          </div>
        ) : fields.map((f, idx) => (
          <div key={f.id} className="overflow-hidden rounded-xl border border-border/50 bg-card/80 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 border-b border-border/40 bg-muted/10 px-3 py-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-[10px] font-bold text-primary">
                {idx + 1}
              </span>
              <GripVertical size={14} className="text-muted-foreground" />
              <Input className="h-9 flex-1 min-w-[120px] text-xs" value={f.label} onChange={e => updateField(f.id, { label: e.target.value })} placeholder="Field label" />
              <select className={`${compactSelectClass} w-[130px]`} value={f.type} onChange={e => updateField(f.id, { type: e.target.value as FormFieldType })}>
                {FIELD_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <div className="flex items-center gap-1">
                <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 text-muted-foreground transition hover:border-primary/30 hover:bg-primary/5 hover:text-foreground" onClick={() => moveField(idx, -1)}><ChevronUp size={13} /></button>
                <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 text-muted-foreground transition hover:border-primary/30 hover:bg-primary/5 hover:text-foreground" onClick={() => moveField(idx, 1)}><ChevronDown size={13} /></button>
                <button type="button" className="h-8 rounded-lg border border-red-500/20 px-2.5 text-[10px] font-bold text-red-400 transition hover:bg-red-500/10" onClick={() => removeField(f.id)}>Remove</button>
              </div>
            </div>
            <div className="space-y-2 p-3">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Key</p>
                  <Input className="h-9 text-xs" value={f.key} onChange={e => updateField(f.id, { key: e.target.value.replace(/[^a-zA-Z0-9_]/g, '_') })} placeholder="field_key" />
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Placeholder</p>
                  <Input className="h-9 text-xs" value={f.placeholder || ''} onChange={e => updateField(f.id, { placeholder: e.target.value })} placeholder="Placeholder text" />
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Map To</p>
                  <select className={listInputCls} value={f.map_to || 'NONE'} onChange={e => updateField(f.id, { map_to: e.target.value as FormFieldConfig['map_to'] })}>
                    <option value="NONE">Not mapped</option>
                    <option value="name">Lead Name</option>
                    <option value="email">Lead Email</option>
                    <option value="phone">Lead Phone</option>
                    <option value="company">Company</option>
                    <option value="value">Lead Value</option>
                    <option value="notes">Notes</option>
                  </select>
                </div>
                <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-input bg-muted/20 px-2.5 text-xs text-foreground">
                  <input type="checkbox" className="rounded border-border" checked={f.required} onChange={e => updateField(f.id, { required: e.target.checked })} />
                  Required field
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
      <Dialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Lead Submission Form"
        subtitle="Configure fields, assignment rules, and the public submission experience."
        size="xl"
      >
        <form onSubmit={handleCreateForm} className="space-y-5">
          <FormSection
            icon={<FileCode size={18} />}
            title="Basic Information"
            description="Name and describe where this form will be used."
            accent="violet"
          >
            <div>
              <FieldLabel label="Form Name" hint="Shown in your forms list and embed settings." required />
              <Input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Inbound Website Inquiries"
                required
              />
            </div>
            <div>
              <FieldLabel label="Description" hint="Optional notes for your team about this form." />
              <StyledTextarea
                value={desc}
                onChange={setDesc}
                placeholder="Describe where this form is integrated (website, landing page, etc.)"
              />
            </div>
          </FormSection>

          <FormSection
            icon={<Users size={18} />}
            title="Assignment & Source"
            description="How new submissions are routed and tagged in the CRM."
            accent="blue"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <FieldLabel label="Assignment Method" hint="Round Robin auto-assigns via Celery." />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {([
                    { value: 'ROUND_ROBIN' as const, label: 'Round Robin', desc: 'Auto-distribute to agents' },
                    { value: 'MANUAL' as const, label: 'Manual', desc: 'Leave leads unassigned' },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMode(opt.value)}
                      className={`rounded-xl border px-3 py-3 text-left transition-all ${
                        mode === opt.value
                          ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20'
                          : 'border-border/60 bg-card/60 hover:border-primary/30 hover:bg-muted/20'
                      }`}
                    >
                      <p className="text-xs font-bold text-foreground">{opt.label}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel label="Lead Source Tag" hint="Applied to every submission from this form." required />
                <div className="relative">
                  <Tag size={14} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    type="text"
                    className="pl-9"
                    value={sourceName}
                    onChange={e => setSourceName(e.target.value)}
                    placeholder="Website Inbound"
                    required
                  />
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection
            icon={<Layers size={18} />}
            title="Form Builder"
            description="Design the fields visitors will fill out."
            accent="amber"
          >
            <FormBuilder fields={formFields} setFields={setFormFields} />
          </FormSection>

          <FormSection
            icon={<Sparkles size={18} />}
            title="Form Experience"
            description="Post-submit behavior and optional multi-step flow."
            accent="emerald"
          >
            <ExperienceToggle
              checked={multiStepEnabled}
              onChange={setMultiStepEnabled}
              label="Multi-step form"
              description="Split fields across multiple steps for longer forms."
            />
            <div>
              <FieldLabel label="Thank You Page" hint="What happens after a successful submission." />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <select
                  className={selectClass}
                  value={thankYouMode}
                  onChange={e => setThankYouMode(e.target.value as 'DEFAULT' | 'MESSAGE' | 'REDIRECT')}
                >
                  <option value="DEFAULT">Default thank you</option>
                  <option value="MESSAGE">Custom message</option>
                  <option value="REDIRECT">Redirect URL</option>
                </select>
                {thankYouMode === 'MESSAGE' && (
                  <Input
                    className="md:col-span-2"
                    value={thankYouMessage}
                    onChange={e => setThankYouMessage(e.target.value)}
                    placeholder="Thank you! We'll be in touch soon."
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
          </FormSection>

          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-border/60 bg-card pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createFormMutation.isPending} className="min-w-[130px]">
              {createFormMutation.isPending ? 'Creating...' : 'Create Form'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Form Modal */}
      <Dialog
        isOpen={!!editingForm}
        onClose={() => setEditingForm(null)}
        title="Edit Lead Form"
        subtitle="Update fields, routing, and submission experience."
        size="xl"
      >
        {editingForm && (
          <form onSubmit={handleUpdateForm} className="space-y-5">
            <FormSection icon={<FileCode size={18} />} title="Basic Information" accent="violet">
              <div>
                <FieldLabel label="Form Name" required />
                <Input
                  type="text"
                  value={editingForm.name}
                  onChange={e => setEditingForm({ ...editingForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <FieldLabel label="Description" />
                <StyledTextarea
                  value={editingForm.description}
                  onChange={v => setEditingForm({ ...editingForm, description: v })}
                />
              </div>
            </FormSection>

            <FormSection icon={<Users size={18} />} title="Assignment & Source" accent="blue">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel label="Assignment Method" />
                  <select
                    className={selectClass}
                    value={editingForm.assignment_mode}
                    onChange={e => setEditingForm({ ...editingForm, assignment_mode: e.target.value as 'MANUAL' | 'ROUND_ROBIN' })}
                  >
                    <option value="ROUND_ROBIN">Round Robin (Celery)</option>
                    <option value="MANUAL">Manual Assignments</option>
                  </select>
                </div>
                <div>
                  <FieldLabel label="Lead Source Tag" required />
                  <Input
                    type="text"
                    value={editingForm.source_name}
                    onChange={e => setEditingForm({ ...editingForm, source_name: e.target.value })}
                    required
                  />
                </div>
              </div>
            </FormSection>

            <FormSection icon={<Layers size={18} />} title="Form Builder" accent="amber">
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
            </FormSection>

            <FormSection icon={<Sparkles size={18} />} title="Form Experience" accent="emerald">
              <ExperienceToggle
                checked={!!editingForm.multi_step_enabled}
                onChange={v => setEditingForm({ ...editingForm, multi_step_enabled: v })}
                label="Multi-step form"
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <select
                  className={selectClass}
                  value={editingForm.thank_you_mode || 'DEFAULT'}
                  onChange={e => setEditingForm({ ...editingForm, thank_you_mode: e.target.value as 'DEFAULT' | 'MESSAGE' | 'REDIRECT' })}
                >
                  <option value="DEFAULT">Default thank you</option>
                  <option value="MESSAGE">Custom message</option>
                  <option value="REDIRECT">Redirect URL</option>
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
            </FormSection>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-border/60 bg-card pt-4">
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
