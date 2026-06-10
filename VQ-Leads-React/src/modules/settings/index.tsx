import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  api,
  type ApiIntegrationItem,
  type CommissionModuleSettings,
  type EmailSettingsData,
  type GeneralSettings,
  type LeadSettings,
  type NotificationSettingItem,
} from '../../api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/forms/Button';
import { Input } from '../../components/forms/Input';
import {
  LayoutGrid, Sliders, CheckSquare, Mail, Bell, Plug, Shield,
  Save, RotateCcw, Upload, Eye, Wifi, WifiOff, Plus, Trash2,
  Link2, Unlink, FlaskConical, Clock, Globe, DollarSign,
} from 'lucide-react';

type SettingsTab = 'general' | 'leads' | 'commission' | 'email' | 'notifications' | 'api' | 'security';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <LayoutGrid size={16} /> },
  { id: 'leads', label: 'Lead Settings', icon: <Sliders size={16} /> },
  { id: 'commission', label: 'Commission', icon: <CheckSquare size={16} /> },
  { id: 'email', label: 'Email', icon: <Mail size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { id: 'api', label: 'API Integrations', icon: <Plug size={16} /> },
  { id: 'security', label: 'Audit & Security', icon: <Shield size={16} /> },
];

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

function StatusDot({ status }: { status: 'connected' | 'disconnected' | 'pending' | 'active' | 'inactive' }) {
  const colors = {
    connected: 'bg-emerald-500',
    active: 'bg-emerald-500',
    pending: 'bg-amber-500',
    disconnected: 'bg-red-500',
    inactive: 'bg-red-500',
  };
  const labels = {
    connected: 'Connected',
    active: 'Active',
    pending: 'Pending',
    disconnected: 'Disconnected',
    inactive: 'Inactive',
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span className={`h-2 w-2 rounded-full ${colors[status]}`} />
      {labels[status]}
    </span>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/10 px-4 py-3">
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'left-5' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
      type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {message}
    </div>
  );
}

export const Settings: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeTab = (searchParams.get('tab') as SettingsTab) || 'general';
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const widgetsQuery = useQuery({ queryKey: ['settings-widgets'], queryFn: () => api.getSettingsWidgets() });

  const generalQuery = useQuery({
    queryKey: ['settings-general'],
    queryFn: () => api.getGeneralSettings(),
    enabled: activeTab === 'general' || activeTab === 'security',
  });
  const leadQuery = useQuery({
    queryKey: ['settings-leads'],
    queryFn: () => api.getLeadSettings(),
    enabled: activeTab === 'leads',
  });
  const commissionQuery = useQuery({
    queryKey: ['settings-commission'],
    queryFn: () => api.getCommissionModuleSettings(),
    enabled: activeTab === 'commission',
  });
  const emailQuery = useQuery({
    queryKey: ['settings-email'],
    queryFn: () => api.getEmailSettings(),
    enabled: activeTab === 'email',
  });
  const notifQuery = useQuery({
    queryKey: ['settings-notifications'],
    queryFn: () => api.getNotificationSettings(),
    enabled: activeTab === 'notifications',
  });
  const apiQuery = useQuery({
    queryKey: ['settings-api'],
    queryFn: () => api.getApiIntegrations(),
    enabled: activeTab === 'api',
  });
  const auditQuery = useQuery({
    queryKey: ['settings-audit'],
    queryFn: () => api.getSettingsAudit(),
    enabled: activeTab === 'security',
  });

  const [general, setGeneral] = useState<GeneralSettings | null>(null);
  const [leads, setLeads] = useState<LeadSettings | null>(null);
  const [commission, setCommission] = useState<CommissionModuleSettings | null>(null);
  const [email, setEmail] = useState<EmailSettingsData | null>(null);
  const [notifItems, setNotifItems] = useState<NotificationSettingItem[]>([]);
  const [integrations, setIntegrations] = useState<ApiIntegrationItem[]>([]);
  const [editingIntegration, setEditingIntegration] = useState<string | null>(null);
  const [integrationDraft, setIntegrationDraft] = useState<Partial<ApiIntegrationItem>>({});

  useEffect(() => { if (generalQuery.data) setGeneral(generalQuery.data); }, [generalQuery.data]);
  useEffect(() => { if (leadQuery.data) setLeads(leadQuery.data); }, [leadQuery.data]);
  useEffect(() => { if (commissionQuery.data) setCommission(commissionQuery.data); }, [commissionQuery.data]);
  useEffect(() => { if (emailQuery.data) setEmail(emailQuery.data); }, [emailQuery.data]);
  useEffect(() => { if (notifQuery.data) setNotifItems(notifQuery.data.items); }, [notifQuery.data]);
  useEffect(() => { if (apiQuery.data) setIntegrations(apiQuery.data.integrations); }, [apiQuery.data]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['settings-widgets'] });
    queryClient.invalidateQueries({ queryKey: ['settings-audit'] });
  };

  const saveGeneral = useMutation({
    mutationFn: () => api.updateGeneralSettings(general!),
    onSuccess: (data) => { setGeneral(data); invalidateAll(); showToast('General settings saved.'); },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  const saveLeads = useMutation({
    mutationFn: () => api.updateLeadSettings(leads!),
    onSuccess: (data) => { setLeads(data); invalidateAll(); showToast('Lead settings saved.'); },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  const saveCommission = useMutation({
    mutationFn: () => api.updateCommissionModuleSettings(commission!),
    onSuccess: (data) => { setCommission(data); invalidateAll(); showToast('Commission settings saved.'); },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  const saveEmail = useMutation({
    mutationFn: () => api.updateEmailSettings(email!),
    onSuccess: (data) => { setEmail(data); invalidateAll(); showToast('Email settings saved.'); },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  const saveNotif = useMutation({
    mutationFn: () => api.updateNotificationSettings(notifItems),
    onSuccess: (data) => { setNotifItems(data.items); invalidateAll(); showToast('Notification settings saved.'); },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  const testEmail = useMutation({
    mutationFn: () => api.testEmailConnection(email || undefined),
    onSuccess: (res) => {
      if (email) setEmail({ ...email, isConnected: !!res.isConnected });
      showToast(res.message, res.success ? 'success' : 'error');
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  const commissionPreview = useMemo(() => {
    if (!commission) return 0;
    const sale = 1000000;
    if (commission.commissionType === 'FIXED') return Number(commission.fixedAmount) || 0;
    return sale * (Number(commission.globalRate) / 100);
  }, [commission]);

  const groupedNotifs = useMemo(() => {
    const map = new Map<string, NotificationSettingItem[]>();
    notifItems.forEach((item) => {
      const list = map.get(item.notificationType) || [];
      list.push(item);
      map.set(item.notificationType, list);
    });
    return Array.from(map.entries());
  }, [notifItems]);

  const setTab = (tab: SettingsTab) => navigate(`/settings?tab=${tab}`);

  const updateNotif = (type: string, channel: string, patch: Partial<NotificationSettingItem>) => {
    setNotifItems((prev) =>
      prev.map((item) =>
        item.notificationType === type && item.channel === channel ? { ...item, ...patch } : item
      )
    );
  };

  const addLeadStatus = () => {
    if (!leads) return;
    const code = `CUSTOM_${Date.now()}`;
    setLeads({
      ...leads,
      statuses: [...leads.statuses, { code, label: 'New Status', color: '#64748b' }],
    });
  };

  const addLeadSource = () => {
    if (!leads) return;
    const code = `SOURCE_${Date.now()}`;
    setLeads({
      ...leads,
      sources: [...leads.sources, { code, label: 'New Source' }],
    });
  };

  const widgets = widgetsQuery.data;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Centralized control panel for CRM behavior, workflows, and integrations.
        </p>
      </div>

      {/* Dashboard widgets */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: 'Active Integrations', value: widgets?.activeIntegrations ?? '—', icon: <Plug className="h-4 w-4 text-violet-500" /> },
          { label: 'Email Status', value: widgets?.emailStatus === 'connected' ? 'Connected' : 'Disconnected', icon: widgets?.emailStatus === 'connected' ? <Wifi className="h-4 w-4 text-emerald-500" /> : <WifiOff className="h-4 w-4 text-red-500" /> },
          { label: 'Notifications', value: widgets?.notificationStatus === 'active' ? 'Active' : 'Inactive', icon: <Bell className="h-4 w-4 text-blue-500" /> },
          { label: 'API Usage', value: widgets?.apiUsage ?? '—', icon: <Globe className="h-4 w-4 text-amber-500" /> },
          { label: 'Connected Services', value: widgets?.connectedServices ?? '—', icon: <Link2 className="h-4 w-4 text-emerald-500" /> },
          { label: 'Last Updated', value: widgets?.lastConfigurationUpdate ? new Date(widgets.lastConfigurationUpdate).toLocaleDateString() : '—', icon: <Clock className="h-4 w-4 text-muted-foreground" /> },
        ].map((w) => (
          <Card key={w.label} className="p-4">
            <div className="mb-2">{w.icon}</div>
            <p className="text-xs text-muted-foreground">{w.label}</p>
            <p className="mt-1 text-lg font-semibold capitalize text-foreground">{w.value}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar navigation */}
        <Card className="h-fit shrink-0 p-2 lg:w-56">
          <nav className="space-y-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </Card>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <Card className="p-6 lg:p-8">
            {/* ── General ── */}
            {activeTab === 'general' && general && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">General Settings</h2>
                  <p className="text-sm text-muted-foreground">Company profile and system-wide preferences.</p>
                </div>

                <div className="flex flex-col gap-6 sm:flex-row">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/20">
                      {general.companyLogo ? (
                        <img src={general.companyLogo} alt="Logo" className="h-full w-full object-cover" />
                      ) : (
                        <LayoutGrid className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const res = await api.uploadCompanyLogo(file);
                            setGeneral({ ...general, companyLogo: res.companyLogo });
                            showToast('Logo uploaded.');
                          } catch (err) {
                            showToast(err instanceof Error ? err.message : 'Upload failed', 'error');
                          }
                        }}
                      />
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary cursor-pointer">
                        <Upload size={14} /> Upload Logo
                      </span>
                    </label>
                  </div>

                  <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold">Company Name</label>
                      <Input value={general.companyName} onChange={(e) => setGeneral({ ...general, companyName: e.target.value })} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold">Company Email</label>
                      <Input type="email" value={general.companyEmail} onChange={(e) => setGeneral({ ...general, companyEmail: e.target.value })} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold">Company Phone</label>
                      <Input value={general.companyPhone} onChange={(e) => setGeneral({ ...general, companyPhone: e.target.value })} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold">Website URL</label>
                      <Input value={general.websiteUrl} onChange={(e) => setGeneral({ ...general, websiteUrl: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-semibold">Company Address</label>
                      <Input value={general.companyAddress} onChange={(e) => setGeneral({ ...general, companyAddress: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Timezone</label>
                    <select className={selectClass} value={general.timezone} onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Currency</label>
                    <select className={selectClass} value={general.currency} onChange={(e) => setGeneral({ ...general, currency: e.target.value })}>
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Language</label>
                    <select className={selectClass} value={general.language} onChange={(e) => setGeneral({ ...general, language: e.target.value })}>
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Date Format</label>
                    <select className={selectClass} value={general.dateFormat} onChange={(e) => setGeneral({ ...general, dateFormat: e.target.value })}>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Theme Mode</label>
                    <select className={selectClass} value={general.themeMode} onChange={(e) => setGeneral({ ...general, themeMode: e.target.value as GeneralSettings['themeMode'] })}>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Session Timeout (minutes)</label>
                    <Input type="number" value={general.sessionTimeoutMinutes} onChange={(e) => setGeneral({ ...general, sessionTimeoutMinutes: Number(e.target.value) })} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  <Button onClick={() => saveGeneral.mutate()} disabled={saveGeneral.isPending}>
                    <Save size={16} className="mr-1.5" /> Save Configuration
                  </Button>
                  <Button variant="outline" onClick={async () => {
                    const data = await api.resetGeneralSettings();
                    setGeneral(data);
                    showToast('Reset to defaults.');
                  }}>
                    <RotateCcw size={16} className="mr-1.5" /> Reset to Default
                  </Button>
                </div>
              </div>
            )}

            {/* ── Lead Settings ── */}
            {activeTab === 'leads' && leads && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Lead Settings</h2>
                  <p className="text-sm text-muted-foreground">Configure lead workflow, statuses, sources, and assignment.</p>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Lead Statuses</h3>
                    <Button variant="outline" size="sm" onClick={addLeadStatus}><Plus size={14} className="mr-1" /> Add Status</Button>
                  </div>
                  <div className="space-y-2">
                    {leads.statuses.map((s, idx) => (
                      <div key={s.code} className="flex items-center gap-2 rounded-lg border border-border/60 p-2">
                        <input type="color" value={s.color} onChange={(e) => {
                          const statuses = [...leads.statuses];
                          statuses[idx] = { ...s, color: e.target.value };
                          setLeads({ ...leads, statuses });
                        }} className="h-8 w-8 cursor-pointer rounded border-0" />
                        <Input className="flex-1" value={s.label} onChange={(e) => {
                          const statuses = [...leads.statuses];
                          statuses[idx] = { ...s, label: e.target.value };
                          setLeads({ ...leads, statuses });
                        }} />
                        <Button variant="ghost" size="icon" onClick={() => setLeads({ ...leads, statuses: leads.statuses.filter((_, i) => i !== idx) })}>
                          <Trash2 size={14} className="text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Lead Sources</h3>
                    <Button variant="outline" size="sm" onClick={addLeadSource}><Plus size={14} className="mr-1" /> Add Source</Button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {leads.sources.map((s, idx) => (
                      <div key={s.code} className="flex items-center gap-2 rounded-lg border border-border/60 p-2">
                        <Input className="flex-1" value={s.label} onChange={(e) => {
                          const sources = [...leads.sources];
                          sources[idx] = { ...s, label: e.target.value };
                          setLeads({ ...leads, sources });
                        }} />
                        <Button variant="ghost" size="icon" onClick={() => setLeads({ ...leads, sources: leads.sources.filter((_, i) => i !== idx) })}>
                          <Trash2 size={14} className="text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold">Assignment Options</h3>
                  <div className="space-y-2">
                    {(['MANUAL', 'AUTO', 'ROUND_ROBIN'] as const).map((mode) => (
                      <label key={mode} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 px-4 py-3">
                        <input type="radio" name="assignment" checked={leads.assignmentMode === mode} onChange={() => setLeads({ ...leads, assignmentMode: mode })} />
                        <span className="text-sm">{mode === 'MANUAL' ? 'Manual Assignment' : mode === 'AUTO' ? 'Auto Assignment' : 'Round Robin Assignment'}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Toggle checked={leads.duplicateDetection} onChange={(v) => setLeads({ ...leads, duplicateDetection: v })} label="Duplicate Lead Detection" />
                  <Toggle checked={leads.autoLeadNumber} onChange={(v) => setLeads({ ...leads, autoLeadNumber: v })} label="Auto Lead Number Generation" />
                  <Toggle checked={leads.leadExpiryEnabled} onChange={(v) => setLeads({ ...leads, leadExpiryEnabled: v })} label="Lead Expiry Rules" />
                  {leads.leadExpiryEnabled && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold">Expiry Days</label>
                      <Input type="number" value={leads.leadExpiryDays} onChange={(e) => setLeads({ ...leads, leadExpiryDays: Number(e.target.value) })} />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  <Button onClick={() => saveLeads.mutate()} disabled={saveLeads.isPending}><Save size={16} className="mr-1.5" /> Save</Button>
                  <Button variant="outline" onClick={async () => { setLeads(await api.resetLeadSettings()); showToast('Lead settings reset.'); }}>
                    <RotateCcw size={16} className="mr-1.5" /> Reset
                  </Button>
                </div>
              </div>
            )}

            {/* ── Commission ── */}
            {activeTab === 'commission' && commission && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Commission Settings</h2>
                  <p className="text-sm text-muted-foreground">Configure commission calculation rules and approval workflow.</p>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">Commission Type</label>
                  <select className={selectClass} value={commission.commissionType} onChange={(e) => setCommission({ ...commission, commissionType: e.target.value as CommissionModuleSettings['commissionType'] })}>
                    <option value="PERCENTAGE">Percentage Based</option>
                    <option value="FIXED">Fixed Amount</option>
                    <option value="CUSTOM">Custom Rules</option>
                  </select>
                </div>

                {commission.commissionType === 'PERCENTAGE' && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Default Commission Rate (%)</label>
                    <Input value={commission.globalRate} onChange={(e) => setCommission({ ...commission, globalRate: e.target.value })} />
                  </div>
                )}
                {commission.commissionType === 'FIXED' && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Fixed Commission Amount</label>
                    <Input value={commission.fixedAmount} onChange={(e) => setCommission({ ...commission, fixedAmount: e.target.value })} />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-semibold">Monthly Bonus Rules</label>
                  <textarea
                    className={`${selectClass} min-h-[80px]`}
                    value={commission.monthlyBonusRules}
                    onChange={(e) => setCommission({ ...commission, monthlyBonusRules: e.target.value })}
                    placeholder="Describe bonus rules..."
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Toggle checked={commission.approvalRequired} onChange={(v) => setCommission({ ...commission, approvalRequired: v })} label="Commission Approval Required" />
                  <Toggle checked={commission.autoCalculation} onChange={(v) => setCommission({ ...commission, autoCalculation: v })} label="Automatic Commission Calculation" />
                  <Toggle checked={commission.teamCommissionEnabled} onChange={(v) => setCommission({ ...commission, teamCommissionEnabled: v })} label="Team Commission Enabled" />
                </div>

                <Card className="border-emerald-500/30 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                    <DollarSign size={16} /> Commission Preview
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Sale Amount = ₹10,00,000 &nbsp;|&nbsp; Rate = {commission.commissionType === 'FIXED' ? `₹${commission.fixedAmount}` : `${commission.globalRate}%`}
                  </p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    Commission Earned = ₹{commissionPreview.toLocaleString('en-IN')}
                  </p>
                </Card>

                <div className="border-t border-border pt-4">
                  <Button onClick={() => saveCommission.mutate()} disabled={saveCommission.isPending}><Save size={16} className="mr-1.5" /> Save</Button>
                </div>
              </div>
            )}

            {/* ── Email ── */}
            {activeTab === 'email' && email && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Email Settings</h2>
                    <p className="text-sm text-muted-foreground">Configure SMTP and automated email templates.</p>
                  </div>
                  <StatusDot status={email.isConnected ? 'connected' : 'disconnected'} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div><label className="mb-1 block text-xs font-semibold">SMTP Host</label><Input value={email.smtpHost} onChange={(e) => setEmail({ ...email, smtpHost: e.target.value })} /></div>
                  <div><label className="mb-1 block text-xs font-semibold">SMTP Port</label><Input type="number" value={email.smtpPort} onChange={(e) => setEmail({ ...email, smtpPort: Number(e.target.value) })} /></div>
                  <div><label className="mb-1 block text-xs font-semibold">Username</label><Input value={email.username} onChange={(e) => setEmail({ ...email, username: e.target.value })} /></div>
                  <div><label className="mb-1 block text-xs font-semibold">Password</label><Input type="password" value={email.password} onChange={(e) => setEmail({ ...email, password: e.target.value })} placeholder={email.hasPassword ? '••••••••' : ''} /></div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Encryption</label>
                    <select className={selectClass} value={email.encryption} onChange={(e) => setEmail({ ...email, encryption: e.target.value as EmailSettingsData['encryption'] })}>
                      <option value="TLS">TLS</option><option value="SSL">SSL</option><option value="NONE">None</option>
                    </select>
                  </div>
                  <div><label className="mb-1 block text-xs font-semibold">Sender Name</label><Input value={email.senderName} onChange={(e) => setEmail({ ...email, senderName: e.target.value })} /></div>
                  <div className="sm:col-span-2"><label className="mb-1 block text-xs font-semibold">Sender Email</label><Input type="email" value={email.senderEmail} onChange={(e) => setEmail({ ...email, senderEmail: e.target.value })} /></div>
                </div>

                <Toggle checked={email.automatedEmailsEnabled} onChange={(v) => setEmail({ ...email, automatedEmailsEnabled: v })} label="Enable Automated Emails" />

                <div>
                  <h3 className="mb-3 text-sm font-semibold">Email Templates</h3>
                  <div className="space-y-3">
                    {Object.entries(email.templates).map(([key, tpl]) => (
                      <div key={key} className="rounded-lg border border-border/60 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <Toggle checked={tpl.enabled} onChange={(v) => setEmail({
                            ...email,
                            templates: { ...email.templates, [key]: { ...tpl, enabled: v } },
                          })} label="" />
                        </div>
                        <Input className="mb-2" value={tpl.subject} onChange={(e) => setEmail({
                          ...email,
                          templates: { ...email.templates, [key]: { ...tpl, subject: e.target.value } },
                        })} placeholder="Subject" />
                        <textarea className={`${selectClass} min-h-[60px]`} value={tpl.body} onChange={(e) => setEmail({
                          ...email,
                          templates: { ...email.templates, [key]: { ...tpl, body: e.target.value } },
                        })} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  <Button onClick={() => saveEmail.mutate()} disabled={saveEmail.isPending}><Save size={16} className="mr-1.5" /> Save</Button>
                  <Button variant="outline" onClick={() => testEmail.mutate()} disabled={testEmail.isPending}>
                    <FlaskConical size={16} className="mr-1.5" /> Test Connection
                  </Button>
                </div>
              </div>
            )}

            {/* ── Notifications ── */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Notification Settings</h2>
                  <p className="text-sm text-muted-foreground">Manage notification channels and reminder timing.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                        <th className="px-3 py-2">Event</th>
                        <th className="px-3 py-2">In-App</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">SMS</th>
                        <th className="px-3 py-2">Push</th>
                        <th className="px-3 py-2">Reminder (min)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedNotifs.map(([type, items]) => {
                        const label = items[0]?.label || type;
                        const inApp = items.find((i) => i.channel === 'IN_APP');
                        return (
                          <tr key={type} className="border-b border-border/50">
                            <td className="px-3 py-3 font-medium">{label}</td>
                            {(['IN_APP', 'EMAIL', 'SMS', 'PUSH'] as const).map((ch) => {
                              const item = items.find((i) => i.channel === ch);
                              return (
                                <td key={ch} className="px-3 py-3">
                                  <input
                                    type="checkbox"
                                    checked={item?.enabled ?? false}
                                    onChange={(e) => updateNotif(type, ch, { enabled: e.target.checked })}
                                    className="h-4 w-4 rounded border-input"
                                  />
                                </td>
                              );
                            })}
                            <td className="px-3 py-3">
                              <Input
                                type="number"
                                className="h-8 w-20"
                                value={inApp?.reminderMinutes ?? ''}
                                onChange={(e) => updateNotif(type, 'IN_APP', { reminderMinutes: e.target.value ? Number(e.target.value) : null })}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-muted-foreground">
                  Reminder options: 15 min, 60 min (1 hour), 1440 min (1 day), or custom value above.
                </p>

                <div className="border-t border-border pt-4">
                  <Button onClick={() => saveNotif.mutate()} disabled={saveNotif.isPending}><Save size={16} className="mr-1.5" /> Save</Button>
                </div>
              </div>
            )}

            {/* ── API Integrations ── */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">API Integrations</h2>
                  <p className="text-sm text-muted-foreground">Connect third-party services and manage credentials.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {integrations.map((intg) => (
                    <Card key={intg.serviceName} className="p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{intg.displayName}</h3>
                          <StatusDot status={intg.status === 'CONNECTED' ? 'connected' : intg.status === 'PENDING' ? 'pending' : 'disconnected'} />
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" title="Edit" onClick={() => {
                            setEditingIntegration(intg.serviceName);
                            setIntegrationDraft(intg);
                          }}><Eye size={14} /></Button>
                        </div>
                      </div>

                      {editingIntegration === intg.serviceName ? (
                        <div className="space-y-2">
                          <Input placeholder="API Key" value={integrationDraft.apiKey || ''} onChange={(e) => setIntegrationDraft({ ...integrationDraft, apiKey: e.target.value })} />
                          <Input placeholder="Secret Key" value={integrationDraft.secretKey || ''} onChange={(e) => setIntegrationDraft({ ...integrationDraft, secretKey: e.target.value })} />
                          <Input placeholder="Access Token" value={integrationDraft.accessToken || ''} onChange={(e) => setIntegrationDraft({ ...integrationDraft, accessToken: e.target.value })} />
                          <Input placeholder="Webhook URL" value={integrationDraft.webhookUrl || ''} onChange={(e) => setIntegrationDraft({ ...integrationDraft, webhookUrl: e.target.value })} />
                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button size="sm" onClick={async () => {
                              await api.updateApiIntegration(intg.serviceName, integrationDraft);
                              setEditingIntegration(null);
                              apiQuery.refetch();
                              showToast('Credentials saved.');
                            }}>Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingIntegration(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {intg.hasCredentials ? 'Credentials configured' : 'No credentials configured'}
                          {intg.connectedAt && ` · Connected ${new Date(intg.connectedAt).toLocaleDateString()}`}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={async () => {
                          await api.apiIntegrationAction(intg.serviceName, 'connect');
                          apiQuery.refetch();
                          invalidateAll();
                          showToast('Connect request processed.');
                        }}><Link2 size={14} className="mr-1" /> Connect</Button>
                        <Button size="sm" variant="outline" onClick={async () => {
                          await api.apiIntegrationAction(intg.serviceName, 'test');
                          apiQuery.refetch();
                          showToast('Connection tested.');
                        }}><FlaskConical size={14} className="mr-1" /> Test</Button>
                        <Button size="sm" variant="ghost" onClick={async () => {
                          await api.apiIntegrationAction(intg.serviceName, 'disconnect');
                          apiQuery.refetch();
                          invalidateAll();
                          showToast('Disconnected.');
                        }}><Unlink size={14} className="mr-1" /> Disconnect</Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ── Audit & Security ── */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Audit & Security</h2>
                  <p className="text-sm text-muted-foreground">Track settings changes and manage security controls.</p>
                </div>

                {general && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Toggle
                      checked={general.twoFactorEnabled}
                      onChange={(v) => {
                        setGeneral({ ...general, twoFactorEnabled: v });
                        api.updateGeneralSettings({ twoFactorEnabled: v });
                        showToast('Two-factor authentication setting updated.');
                      }}
                      label="Two-Factor Authentication (Admin)"
                    />
                    <Toggle
                      checked={general.sessionManagementEnabled}
                      onChange={(v) => {
                        setGeneral({ ...general, sessionManagementEnabled: v });
                        api.updateGeneralSettings({ sessionManagementEnabled: v });
                        showToast('Session management setting updated.');
                      }}
                      label="Session Management"
                    />
                  </div>
                )}

                <div>
                  <h3 className="mb-3 text-sm font-semibold">Recent Settings Changes</h3>
                  <div className="space-y-2">
                    {auditQuery.isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
                    {auditQuery.data?.length === 0 && <p className="text-sm text-muted-foreground">No settings changes recorded yet.</p>}
                    {auditQuery.data?.map((log) => (
                      <div key={log.id} className="rounded-lg border border-border/60 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">{log.summary}</p>
                          <span className="whitespace-nowrap text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">By {log.user_name} ({log.role || 'System'})</p>
                      </div>
                    ))}
                  </div>
                  <Button variant="link" className="mt-3 px-0" onClick={() => navigate('/audit-logs')}>
                    View full audit logs →
                  </Button>
                </div>

                <Card className="border-blue-500/30 bg-blue-500/5 p-4">
                  <p className="text-sm font-semibold text-foreground">Role-Based Access</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Settings are restricted to Admin users only. Team Leaders and Agents cannot modify system configuration.
                  </p>
                </Card>
              </div>
            )}

            {(activeTab === 'general' && generalQuery.isLoading) ||
             (activeTab === 'leads' && leadQuery.isLoading) ||
             (activeTab === 'commission' && commissionQuery.isLoading) ||
             (activeTab === 'email' && emailQuery.isLoading) ? (
              <p className="py-12 text-center text-muted-foreground">Loading settings...</p>
            ) : null}
          </Card>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
};

export default Settings;
