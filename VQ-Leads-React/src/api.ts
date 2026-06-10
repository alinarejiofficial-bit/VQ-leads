export const API_BASE = 'http://localhost:8000/api';

// Interfaces
export interface UserProfile {
  role: 'ADMIN' | 'LEADER' | 'AGENT';
  // Null means the user follows the global commission rate.
  commission_rate: string | null;
  effective_commission_rate: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile: UserProfile;
  full_name: string;
  is_active?: boolean;
}

export interface SalesTeam {
  id: number;
  name: string;
  description: string;
  leader: number | null;
  leader_details: User | null;
  members: number[];
  members_details: User[];
  created_at: string;
}

export interface LeadForm {
  id: number;
  name: string;
  description: string;
  assignment_mode: 'MANUAL' | 'ROUND_ROBIN';
  is_active: boolean;
  source_name: string;
  submission_count: number;
  form_fields: FormFieldConfig[];
  multi_step_enabled: boolean;
  thank_you_mode: 'DEFAULT' | 'MESSAGE' | 'REDIRECT';
  thank_you_message: string;
  thank_you_redirect_url: string;
  created_at: string;
  created_by: number | null;
  created_by_name: string;
}

export type FormFieldType =
  | 'TEXT' | 'EMAIL' | 'PHONE' | 'NUMBER' | 'DROPDOWN'
  | 'RADIO' | 'CHECKBOX' | 'DATE' | 'TEXTAREA' | 'FILE';

export interface FormFieldConfig {
  id: string;
  key: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  help_text?: string;
  options?: string[];
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    min_length?: number;
    max_length?: number;
    file_types?: string[];
    max_file_mb?: number;
  };
  map_to?: 'NONE' | 'name' | 'email' | 'phone' | 'company' | 'value' | 'notes';
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'NEW' | 'AVAILABLE' | 'CLAIMED' | 'CONTACTED' | 'IN_PROGRESS' | 'QUALIFIED' | 'FOLLOW_UP' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'CONVERTED' | 'WON' | 'LOST' | 'DUPLICATE' | 'INVALID';
  source: string;
  value: string;
  owner: number | null;
  owner_details: User | null;
  owner_name: string;
  form: number | null;
  form_details: LeadForm | null;
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: number;
  lead: number;
  lead_name?: string;
  user: number | null;
  user_name: string;
  activity_type: string;
  description: string;
  created_at: string;
}

export interface ActivityTimelineResponse {
  results: LeadActivity[];
  page: number;
  page_size: number;
  total: number;
  has_next: boolean;
}

export interface CallLog {
  id: number;
  lead: number;
  lead_name: string;
  agent: number;
  agent_name: string;
  call_date: string;
  duration: number;
  call_type: 'INCOMING' | 'OUTGOING';
  call_status: 'ANSWERED' | 'MISSED' | 'BUSY' | 'NO_RESPONSE';
  outcome: 'INTERESTED' | 'NOT_INTERESTED' | 'CALLBACK_REQUESTED' | 'CONVERTED' | '';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface LeadNote {
  id: number;
  lead: number;
  lead_name: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_by: number;
  created_by_name: string;
  mention_user_ids?: number[];
  created_at: string;
  updated_at: string;
}

export interface LeadEmail {
  id: number;
  lead: number;
  lead_name: string;
  subject: string;
  sender: string;
  recipient: string;
  status: 'DRAFT' | 'SENT' | 'DELIVERED' | 'OPENED' | 'FAILED';
  direction: 'SENT' | 'RECEIVED';
  content: string;
  attachments: string;
  sent_at: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityWidgetStats {
  totalActivities: number;
  callsMadeToday: number;
  notesAddedToday: number;
  emailsSentToday: number;
  pendingFollowUps: number;
  overdueFollowUps: number;
}

export interface AgentTrackingStats {
  totalLeads: number;
  wonLeads: number;
  revenue: number;
  callsLogged: number;
}

export interface AgentTrackingItem {
  agent: User;
  stats: AgentTrackingStats;
  lastActivityAt: string | null;
}

export interface AgentTrackingDetail {
  agent: User;
  stats: AgentTrackingStats & {
    activeLeads: number;
    lostLeads: number;
    pendingTasks: number;
    pendingFollowups: number;
    commissionEarned: number;
  };
  activities: LeadActivity[];
}

export interface CommissionSettings {
  globalRate: string;
  updatedAt: string;
}

export interface TeamPerformanceMember {
  agentId: number;
  agent: string;
  username: string;
  leadsClaimed: number;
  qualifiedLeads?: number;
  calls: number;
  conversions: number;
  revenue: number;
  commissionEarned?: number;
  conversionRate: number;
}

export interface TeamPerformanceChartBar {
  label: string;
  value: number;
  color: string;
}

export interface TeamPerformanceData {
  members: TeamPerformanceMember[];
  totals: {
    leadsClaimed: number;
    calls: number;
    conversions: number;
    revenue: number;
  };
  charts: {
    topPerformers: TeamPerformanceChartBar[];
    conversionRate: TeamPerformanceChartBar[];
    revenueGenerated: TeamPerformanceChartBar[];
    callsMade: TeamPerformanceChartBar[];
  };
}

export type FollowUpType =
  | 'CALL' | 'EMAIL' | 'WHATSAPP' | 'MEETING'
  | 'SITE_VISIT' | 'DEMO' | 'QUOTATION' | 'PAYMENT_REMINDER';

export type FollowUpPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type FollowUpStatus = 'UPCOMING' | 'TODAY' | 'OVERDUE' | 'COMPLETED' | 'CANCELLED';

export interface FollowUp {
  id: number;
  lead: number;
  lead_name: string;
  lead_phone?: string;
  lead_email?: string;
  lead_source?: string;
  scheduled_time: string;
  followup_type: FollowUpType;
  priority: FollowUpPriority;
  reminder_time?: string | null;
  notes: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  effective_status: FollowUpStatus;
  days_overdue: number;
  completed: boolean;
  completed_at?: string | null;
  completed_by?: number | null;
  completed_by_name?: string;
  created_by: number;
  created_by_name: string;
  assigned_agent?: number | null;
  assigned_agent_details?: User | null;
  created_at: string;
  updated_at?: string;
}

export interface FollowUpHistoryItem {
  id: number;
  followup: number;
  action: string;
  old_value: string;
  new_value: string;
  performed_by: number | null;
  performed_by_name: string;
  created_at: string;
}

export interface FollowUpWidgetStats {
  totalFollowups: number;
  upcomingFollowups: number;
  todayFollowups: number;
  overdueFollowups: number;
  completedFollowups: number;
  successRate: number;
  completedToday: number;
  pendingToday: number;
}

export interface FollowUpAnalytics {
  byAgent: { agent: string; username: string; total: number; completed: number; overdue: number; completionRate: number }[];
  byStatus: Record<FollowUpStatus, number>;
  bySource: { source: string; count: number }[];
  conversionAfterFollowup: number;
  avgCompletionHours: number;
  dailyTrend: { date: string; scheduled: number; completed: number }[];
  monthlyPerformance: { month: string; total: number; completed: number }[];
}

export type TaskType =
  | 'CALL_LEAD' | 'FOLLOW_UP' | 'MEETING' | 'SITE_VISIT' | 'SEND_EMAIL'
  | 'SEND_QUOTATION' | 'DOCUMENT_COLLECTION' | 'PAYMENT_FOLLOW_UP' | 'CUSTOM';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';

export interface Task {
  id: number;
  lead: number | null;
  lead_name: string;
  title: string;
  description: string;
  task_type: TaskType;
  priority: TaskPriority;
  due_date: string | null;
  reminder_time: string | null;
  notes: string;
  assigned_to: number;
  assigned_to_details: User | null;
  status: TaskStatus;
  is_overdue: boolean;
  completed_at: string | null;
  completed_by: number | null;
  completed_by_name: string;
  created_by: number | null;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: number;
  task: number;
  comment: string;
  user: number;
  user_name: string;
  created_at: string;
}

export interface TaskHistoryItem {
  id: number;
  task: number;
  action: string;
  old_value: string;
  new_value: string;
  performed_by: number | null;
  performed_by_name: string;
  created_at: string;
}

export interface TaskWidgetStats {
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksDueToday: number;
  highPriorityTasks: number;
  completedToday: number;
  completedThisWeek: number;
  completedThisMonth: number;
}

export interface Commission {
  id: number;
  lead: number;
  lead_name: string;
  lead_value: string;
  agent: number;
  agent_details: User;
  amount: string;
  rate: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  calculated_at: string;
  approved_at: string | null;
  approved_by: number | null;
  approved_by_name: string;
}

export type NotificationType =
  | 'NEW_LEAD_AVAILABLE'
  | 'LEAD_ASSIGNED'
  | 'LEAD_CLAIMED'
  | 'TASK_ASSIGNED'
  | 'FOLLOWUP_REMINDER'
  | 'CONVERSION_APPROVED'
  | 'COMMISSION_APPROVED';

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
  lead: number | null;
  lead_name: string;
  task: number | null;
  task_title: string;
  commission: number | null;
  commission_amount: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  unreadCount: number;
}

export interface DashboardStats {
  totalLeads: number;
  activeLeads?: number;
  availableLeads: number;
  assignedLeads: number;
  claimedLeads: number;
  convertedLeads: number;
  lostLeads: number;
  todayLeads: number;
  followupsDue: number;
  pendingFollowups?: number;
  earnedCommissions: number;
  revenueThisMonth?: number;
  conversionRate: number;
  pipelineValue: number;
  wonDeals?: number;
  statusBreakdown: Record<string, number>;
  sourceBreakdown: Record<string, number>;
  totalImports: number;
  recordsImportedToday: number;
  failedImports: number;
  duplicateLeadsDetected: number;
  totalExports: number;
  exportsToday: number;
  mostExportedReport: string;
  lastExportActivity: string | null;
}

export interface ExportStats {
  totalExports: number;
  exportsToday: number;
  mostExportedReport: string;
  lastExportActivity: string | null;
}

export interface ExportPreviewResponse {
  totalRecords: number;
  sampleRows: string[][];
  summary: {
    won: number;
    lost: number;
    open: number;
  };
}

export interface ExportHistoryItem {
  id: number;
  file_name: string;
  file_type: 'csv' | 'xlsx' | 'pdf';
  exported_by: number | null;
  exported_by_name: string;
  total_records: number;
  filters_applied: Record<string, any>;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  created_at: string;
}

export interface ImportPreviewRow {
  rowNumber: number;
  raw: Record<string, string>;
  mapped: Record<string, string>;
  isEmpty: boolean;
  errors: string[];
}

export interface ImportPreviewResponse {
  fileName: string;
  fileSize: number;
  fileType: string;
  headers: string[];
  detectedMapping: Record<string, string>;
  totalRecords: number;
  previewRows: ImportPreviewRow[];
  invalidRows: number;
  emptyRows: number;
}

export interface DuplicateRecord {
  rowNumber: number;
  name: string;
  phone: string;
  email: string;
  matchedLeadId: number;
  matchReason: 'phone' | 'email';
}

export interface DuplicateCheckResponse {
  duplicateCount: number;
  duplicates: DuplicateRecord[];
}

export interface ImportLog {
  id: number;
  row_number: number;
  status: 'SUCCESS' | 'FAILED' | 'DUPLICATE' | 'UPDATED';
  error_message: string;
  row_data: Record<string, string>;
  created_at: string;
}

export interface ImportHistory {
  id: number;
  file_name: string;
  file_type: string;
  total_records: number;
  success_count: number;
  failed_count: number;
  duplicate_count: number;
  imported_by: number | null;
  imported_by_name: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
  duplicate_strategy: 'SKIP' | 'UPDATE' | 'IMPORT_ALL';
  column_mapping: Record<string, string>;
  created_at: string;
  logs?: ImportLog[];
}

export interface ImportMappingTemplate {
  id: number;
  name: string;
  mapping: Record<string, string>;
  created_at: string;
}

export interface ChartTimelineItem {
  date: string;
  count: number;
  convertedCount?: number;
  revenue?: number;
}

export interface LeaderboardItem {
  agent: string;
  username: string;
  wonLeads: number;
  revenue: number;
}

export interface MonthlyRevenueItem {
  month: string;
  revenue: number;
}

export interface DashboardCharts {
  leadsTimeline: ChartTimelineItem[];
  leaderboard: LeaderboardItem[];
  monthlyRevenue: MonthlyRevenueItem[];
}

export interface ReportsFilters {
  quickFilter?: 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_QUARTER' | 'THIS_YEAR' | 'CUSTOM';
  dateFrom?: string;
  dateTo?: string;
  leadStatus?: string;
  leadSource?: string;
  teamMember?: string;
  agent?: string;
  campaign?: string;
  region?: string;
}

export interface ReportsWidgets {
  totalLeads: number;
  pipelineValue: number;
  conversionRate: number;
  revenueGenerated: number;
  topLeadSource: string;
  topPerformingAgent: string;
  pendingFollowups: number;
  wonDeals: number;
  lostDeals: number;
  commissionPaid: number;
}

export interface LeadReportsData {
  metrics: {
    totalLeads: number;
    newLeads: number;
    contactedLeads: number;
    qualifiedLeads: number;
    proposalSentLeads: number;
    negotiationLeads: number;
    wonLeads: number;
    lostLeads: number;
  };
  statusBreakdown: Record<string, number>;
  growthTrend: { date: string; count: number }[];
  pipelineFunnel: { stage: string; count: number }[];
  leadAging: { leadName: string; status: string; owner: string; source: string; ageDays: number; createdAt: string }[];
  pipelineValue: number;
}

export interface ConversionReportsData {
  metrics: {
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    lostLeads: number;
    avgConversionTimeDays: number;
  };
  funnel: { stage: string; count: number }[];
  monthlyTrend: { month: string; converted: number }[];
  conversionByAgent: { agent: string; username: string; converted: number }[];
  conversionBySource: { source: string; converted: number }[];
}

export interface SourceReportsData {
  table: {
    source: string;
    leadsGenerated: number;
    convertedLeads: number;
    conversionRate: number;
    revenueGenerated: number;
  }[];
  sourceComparison: { label: string; value: number }[];
  sourceDistribution: { label: string; value: number }[];
  revenueBySource: { label: string; value: number }[];
}

export interface TeamReportsData {
  table: {
    agentName: string;
    username: string;
    assignedLeads: number;
    leadsContacted: number;
    followupsCompleted: number;
    callsMade: number;
    meetingsConducted: number;
    wonDeals: number;
    revenueGenerated: number;
    activitiesCompleted: number;
    conversionRate: number;
  }[];
  leaderboard: { label: string; value: number }[];
  agentComparison: { label: string; value: number }[];
  revenueByAgent: { label: string; value: number }[];
}

export interface CommissionReportsData {
  metrics: {
    totalSales: number;
    commissionEarned: number;
    paidCommission: number;
    pendingCommission: number;
  };
  monthlyReport: { month: string; commissionEarned: number; commissionPaid: number }[];
  agentWise: {
    agent: string;
    username: string;
    salesAmount: number;
    commissionRate: number;
    commissionAmount: number;
    paymentStatus: string;
  }[];
}

export interface AgentDashboardData {
  summary: {
    myLeads: number;
    todaysCalls: number;
    pendingFollowups: number;
    tasksDue: number;
    convertedLeads: number;
    revenueGenerated: number;
    commissionEarned: number;
  };
  pipeline: { label: string; count: number }[];
  monthlyPerformance: {
    callsMade: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
  };
  charts: {
    activityTimeline: ChartTimelineItem[];
    pipelineChart: { label: string; value: number; color: string }[];
    monthlyRevenue: { label: string; value: number }[];
  };
  hotLeads: {
    id: number;
    name: string;
    source: string;
    priority: string;
    status: string;
  }[];
  todaysFollowups: {
    id: number;
    time: string;
    leadName: string;
    notes: string;
  }[];
  todaysTasks: {
    id: number;
    title: string;
    priority: string;
  }[];
  recentActivities: {
    id: number;
    time: string;
    label: string;
  }[];
  overdueFollowups: {
    id: number;
    leadName: string;
    overdueLabel: string;
  }[];
}

// Request helpers
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('vq_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem('vq_token');
    localStorage.removeItem('vq_user');
    window.dispatchEvent(new Event('auth_change'));
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.detail || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

function uploadFormData<T>(
  path: string,
  body: FormData,
  onProgress?: (percent: number) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}${path}`);

    const token = localStorage.getItem('vq_token');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = evt => {
      if (!onProgress || !evt.lengthComputable) return;
      const percent = Math.round((evt.loaded / evt.total) * 100);
      onProgress(percent);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as T);
        } catch {
          resolve({} as T);
        }
      } else {
        try {
          const parsed = JSON.parse(xhr.responseText || '{}');
          reject(new Error(parsed.error || parsed.detail || `Request failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Request failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(body);
  });
}

// Audit logs
export interface AuditLog {
  id: number;
  user: number | null;
  user_name: string;
  role: string;
  module: string;
  module_display: string;
  action: string;
  action_display: string;
  record_type: string;
  record_id: string;
  summary: string;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string;
  device: string;
  created_at: string;
}

export interface AuditLogPage {
  count: number;
  page: number;
  pageSize: number;
  numPages: number;
  results: AuditLog[];
}

export interface AuditLogWidgets {
  totalActivities: number;
  userLoginsToday: number;
  failedLoginsToday: number;
  systemChangesToday: number;
  recentActivities: AuditLog[];
}

export interface AuditLogFilterOptions {
  users: { id: number; name: string }[];
  roles: string[];
  modules: { value: string; label: string }[];
  actions: { value: string; label: string }[];
}

export interface AuditLogQuery {
  q?: string;
  user?: string;
  role?: string;
  module?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// Settings module
export interface SettingsWidgets {
  activeIntegrations: number;
  pendingIntegrations: number;
  emailStatus: 'connected' | 'disconnected';
  notificationStatus: 'active' | 'inactive';
  notificationsEnabled: number;
  notificationsTotal: number;
  apiUsage: number;
  connectedServices: number;
  lastConfigurationUpdate: string;
}

export interface GeneralSettings {
  companyName: string;
  companyLogo: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  websiteUrl: string;
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  themeMode: 'light' | 'dark' | 'system';
  sessionTimeoutMinutes: number;
  twoFactorEnabled: boolean;
  sessionManagementEnabled: boolean;
}

export interface LeadStatusConfig {
  code: string;
  label: string;
  color: string;
  isDefault?: boolean;
}

export interface LeadSourceConfig {
  code: string;
  label: string;
}

export interface LeadSettings {
  statuses: LeadStatusConfig[];
  sources: LeadSourceConfig[];
  assignmentMode: 'MANUAL' | 'AUTO' | 'ROUND_ROBIN';
  autoAssignment: boolean;
  roundRobinEnabled: boolean;
  duplicateDetection: boolean;
  autoLeadNumber: boolean;
  leadExpiryEnabled: boolean;
  leadExpiryDays: number;
}

export interface CommissionModuleSettings {
  globalRate: string;
  commissionType: 'PERCENTAGE' | 'FIXED' | 'CUSTOM';
  fixedAmount: string;
  approvalRequired: boolean;
  autoCalculation: boolean;
  teamCommissionEnabled: boolean;
  monthlyBonusRules: string;
  updatedAt: string;
}

export interface EmailTemplateConfig {
  subject: string;
  body: string;
  enabled: boolean;
}

export interface EmailSettingsData {
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
  hasPassword: boolean;
  encryption: 'NONE' | 'SSL' | 'TLS';
  senderName: string;
  senderEmail: string;
  templates: Record<string, EmailTemplateConfig>;
  automatedEmailsEnabled: boolean;
  isConnected: boolean;
  updatedAt: string;
}

export interface NotificationSettingItem {
  notificationType: string;
  label: string;
  channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
  enabled: boolean;
  reminderMinutes: number | null;
}

export interface NotificationSettingsData {
  items: NotificationSettingItem[];
  enabledCount: number;
  totalCount: number;
}

export interface ApiIntegrationItem {
  serviceName: string;
  displayName: string;
  apiKey: string;
  secretKey: string;
  accessToken: string;
  webhookUrl: string;
  status: 'CONNECTED' | 'PENDING' | 'DISCONNECTED';
  connectedAt: string | null;
  hasCredentials: boolean;
}

export interface ApiIntegrationsData {
  integrations: ApiIntegrationItem[];
}

// API methods
export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const data = await request<{ token: string; user: User }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('vq_token', data.token);
    localStorage.setItem('vq_user', JSON.stringify(data.user));
    window.dispatchEvent(new Event('auth_change'));
    return data;
  },

  logout(): void {
    request('/auth/logout/', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('vq_token');
    localStorage.removeItem('vq_user');
    window.dispatchEvent(new Event('auth_change'));
  },

  async getMe(): Promise<User> {
    return request<User>('/auth/me/');
  },

  // Agents
  async getAgents(): Promise<User[]> {
    return request<User[]>('/agents/');
  },

  async createAgent(agentData: any): Promise<User> {
    return request<User>('/agents/', {
      method: 'POST',
      body: JSON.stringify(agentData),
    });
  },

  async updateAgent(id: number, data: Partial<User> & { commission_rate?: string; role?: UserProfile['role'] }): Promise<User> {
    return request<User>(`/agents/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async toggleAgentStatus(id: number): Promise<User> {
    return request<User>(`/agents/${id}/`, {
      method: 'POST',
      body: JSON.stringify({ action: 'toggle_status' }),
    });
  },

  async resetAgentPassword(id: number, password: string): Promise<void> {
    return request<void>(`/agents/${id}/`, {
      method: 'POST',
      body: JSON.stringify({ action: 'reset_password', password }),
    });
  },

  async getAgentTracking(): Promise<AgentTrackingItem[]> {
    return request<AgentTrackingItem[]>('/agents/tracking/');
  },

  async getAgentTrackingDetail(agentId: number): Promise<AgentTrackingDetail> {
    return request<AgentTrackingDetail>(`/agents/tracking/?agent_id=${agentId}`);
  },

  async getTeamPerformance(): Promise<TeamPerformanceData> {
    return request<TeamPerformanceData>('/team/performance/');
  },

  async getCommissionSettings(): Promise<CommissionSettings> {
    return request<CommissionSettings>('/commissions/settings/');
  },

  async updateCommissionSettings(globalRate: string): Promise<CommissionSettings> {
    return request<CommissionSettings>('/commissions/settings/', {
      method: 'PATCH',
      body: JSON.stringify({ globalRate }),
    });
  },

  // Leads
  async getLeads(): Promise<Lead[]> {
    return request<Lead[]>('/leads/');
  },

  async searchLeads(query: string): Promise<Lead[]> {
    const q = query.trim();
    if (!q) return [];
    return request<Lead[]>(`/leads/?q=${encodeURIComponent(q)}`);
  },

  async getLead(id: number): Promise<Lead> {
    return request<Lead>(`/leads/${id}/`);
  },

  async createLead(lead: Partial<Lead>): Promise<Lead> {
    return request<Lead>('/leads/', {
      method: 'POST',
      body: JSON.stringify(lead),
    });
  },

  async updateLead(id: number, lead: Partial<Lead>): Promise<Lead> {
    return request<Lead>(`/leads/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(lead),
    });
  },

  async claimLead(id: number): Promise<Lead> {
    return request<Lead>(`/leads/${id}/claim/`, {
      method: 'POST',
    });
  },

  async deleteLead(id: number): Promise<void> {
    return request<void>(`/leads/${id}/`, {
      method: 'DELETE',
    });
  },

  async addLeadNote(id: number, note: string): Promise<LeadActivity> {
    return request<LeadActivity>(`/leads/${id}/notes/`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },

  async getLeadActivities(id: number): Promise<LeadActivity[]> {
    return request<LeadActivity[]>(`/leads/${id}/activities/`);
  },

  async getActivitiesTimeline(params?: {
    activity_type?: string;
    agent?: number;
    lead?: number;
    date_from?: string;
    date_to?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<ActivityTimelineResponse> {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
    });
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<ActivityTimelineResponse>(`/activities/timeline/${suffix}`);
  },

  // Teams
  async getTeams(): Promise<SalesTeam[]> {
    return request<SalesTeam[]>('/teams/');
  },

  async createTeam(team: Partial<SalesTeam>): Promise<SalesTeam> {
    return request<SalesTeam>('/teams/', {
      method: 'POST',
      body: JSON.stringify(team),
    });
  },

  async updateTeam(id: number, team: Partial<SalesTeam>): Promise<SalesTeam> {
    return request<SalesTeam>(`/teams/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(team),
    });
  },

  async deleteTeam(id: number): Promise<void> {
    return request<void>(`/teams/${id}/`, {
      method: 'DELETE',
    });
  },

  // Forms
  async getForms(params?: { q?: string }): Promise<LeadForm[]> {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<LeadForm[]>(`/forms/${suffix}`);
  },

  async createForm(form: Partial<LeadForm>): Promise<LeadForm> {
    return request<LeadForm>('/forms/', {
      method: 'POST',
      body: JSON.stringify(form),
    });
  },

  async updateForm(id: number, form: Partial<LeadForm>): Promise<LeadForm> {
    return request<LeadForm>(`/forms/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(form),
    });
  },

  async deleteForm(id: number): Promise<void> {
    return request<void>(`/forms/${id}/`, {
      method: 'DELETE',
    });
  },

  async duplicateForm(id: number): Promise<LeadForm> {
    return request<LeadForm>(`/forms/${id}/duplicate/`, { method: 'POST' });
  },

  async toggleFormActive(id: number): Promise<LeadForm> {
    return request<LeadForm>(`/forms/${id}/toggle_active/`, { method: 'POST' });
  },

  // Public Form (No authentication token needed)
  async getPublicForm(id: number): Promise<LeadForm> {
    const response = await fetch(`${API_BASE}/public/forms/${id}/`);
    if (!response.ok) {
      throw new Error('Form not found or inactive');
    }
    return response.json();
  },

  async submitPublicForm(id: number, data: any): Promise<{ success: boolean; lead: Lead; assigned_to: string }> {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const response = await fetch(`${API_BASE}/public/forms/${id}/submit/`, {
      method: 'POST',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? data : JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Submission failed');
    }
    return response.json();
  },

  // Tasks
  async getTasks(params?: {
    q?: string; status?: string; priority?: string; task_type?: string;
    assigned_to?: number; lead?: number; due?: string;
  }): Promise<Task[]> {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
    });
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<Task[]>(`/tasks/${suffix}`);
  },

  async createTask(task: Partial<Task>): Promise<Task> {
    return request<Task>('/tasks/', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  },

  async updateTask(id: number, task: Partial<Task>): Promise<Task> {
    return request<Task>(`/tasks/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(task),
    });
  },

  async deleteTask(id: number): Promise<void> {
    return request<void>(`/tasks/${id}/`, { method: 'DELETE' });
  },

  async getTaskWidgetStats(): Promise<TaskWidgetStats> {
    return request<TaskWidgetStats>('/tasks/widgets/');
  },

  async getTaskComments(taskId: number): Promise<TaskComment[]> {
    return request<TaskComment[]>(`/task-comments/?task=${taskId}`);
  },

  async createTaskComment(payload: { task: number; comment: string }): Promise<TaskComment> {
    return request<TaskComment>('/task-comments/', { method: 'POST', body: JSON.stringify(payload) });
  },

  async getTaskHistory(taskId: number): Promise<TaskHistoryItem[]> {
    return request<TaskHistoryItem[]>(`/task-history/?task=${taskId}`);
  },

  // Follow-ups
  async getFollowUps(params?: {
    bucket?: 'upcoming' | 'today' | 'overdue' | 'completed' | 'cancelled';
    agent?: number; lead?: number; followup_type?: string; priority?: string;
    q?: string; date_from?: string; date_to?: string;
  }): Promise<FollowUp[]> {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
    });
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<FollowUp[]>(`/followups/${suffix}`);
  },

  async createFollowUp(followup: Partial<FollowUp>): Promise<FollowUp> {
    return request<FollowUp>('/followups/', {
      method: 'POST',
      body: JSON.stringify(followup),
    });
  },

  async updateFollowUp(id: number, followup: Partial<FollowUp>): Promise<FollowUp> {
    return request<FollowUp>(`/followups/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(followup),
    });
  },

  async deleteFollowUp(id: number): Promise<void> {
    return request<void>(`/followups/${id}/`, { method: 'DELETE' });
  },

  async completeFollowUp(id: number, notes?: string): Promise<FollowUp> {
    return request<FollowUp>(`/followups/${id}/complete/`, {
      method: 'POST',
      body: JSON.stringify({ notes: notes || '' }),
    });
  },

  async bulkReassignFollowUps(ids: number[], agent: number): Promise<{ updated: number }> {
    return request<{ updated: number }>('/followups/bulk_reassign/', {
      method: 'POST',
      body: JSON.stringify({ ids, agent }),
    });
  },

  async bulkRescheduleFollowUps(ids: number[], opts: { scheduled_time?: string; shift_days?: number }): Promise<{ updated: number }> {
    return request<{ updated: number }>('/followups/bulk_reschedule/', {
      method: 'POST',
      body: JSON.stringify({ ids, ...opts }),
    });
  },

  async getFollowUpWidgetStats(): Promise<FollowUpWidgetStats> {
    return request<FollowUpWidgetStats>('/followups/widgets/');
  },

  async getFollowUpAnalytics(): Promise<FollowUpAnalytics> {
    return request<FollowUpAnalytics>('/followups/analytics/');
  },

  async getFollowUpHistory(followupId: number): Promise<FollowUpHistoryItem[]> {
    return request<FollowUpHistoryItem[]>(`/followup-history/?followup=${followupId}`);
  },

  // Activities module entities
  async getCallLogs(params?: { q?: string; lead?: number; agent?: number; call_status?: string; date_from?: string; date_to?: string }): Promise<CallLog[]> {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
    });
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<CallLog[]>(`/call-logs/${suffix}`);
  },

  async createCallLog(payload: Partial<CallLog>): Promise<CallLog> {
    return request<CallLog>('/call-logs/', { method: 'POST', body: JSON.stringify(payload) });
  },

  async updateCallLog(id: number, payload: Partial<CallLog>): Promise<CallLog> {
    return request<CallLog>(`/call-logs/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
  },

  async getNotes(params?: { lead?: number; created_by?: number; pinned?: boolean }): Promise<LeadNote[]> {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null) query.set(k, String(v));
    });
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<LeadNote[]>(`/notes/${suffix}`);
  },

  async createNote(payload: Partial<LeadNote>): Promise<LeadNote> {
    return request<LeadNote>('/notes/', { method: 'POST', body: JSON.stringify(payload) });
  },

  async updateNote(id: number, payload: Partial<LeadNote>): Promise<LeadNote> {
    return request<LeadNote>(`/notes/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
  },

  async deleteNote(id: number): Promise<void> {
    return request<void>(`/notes/${id}/`, { method: 'DELETE' });
  },

  async getEmails(params?: { lead?: number; direction?: string; status?: string }): Promise<LeadEmail[]> {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
    });
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<LeadEmail[]>(`/emails/${suffix}`);
  },

  async createEmail(payload: Partial<LeadEmail>): Promise<LeadEmail> {
    return request<LeadEmail>('/emails/', { method: 'POST', body: JSON.stringify(payload) });
  },

  async updateEmail(id: number, payload: Partial<LeadEmail>): Promise<LeadEmail> {
    return request<LeadEmail>(`/emails/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
  },

  async getActivityWidgetStats(): Promise<ActivityWidgetStats> {
    return request<ActivityWidgetStats>('/activities/widgets/');
  },

  // Commissions
  async getCommissions(): Promise<Commission[]> {
    return request<Commission[]>('/commissions/');
  },

  async approveCommission(id: number): Promise<Commission> {
    return request<Commission>(`/commissions/${id}/approve/`, {
      method: 'POST',
    });
  },

  async payCommission(id: number): Promise<Commission> {
    return request<Commission>(`/commissions/${id}/pay/`, {
      method: 'POST',
    });
  },

  async rejectCommission(id: number): Promise<Commission> {
    return request<Commission>(`/commissions/${id}/reject/`, {
      method: 'POST',
    });
  },

  // Notifications
  async getNotifications(params?: { archived?: boolean; unread?: boolean }): Promise<NotificationListResponse> {
    const query = new URLSearchParams();
    if (params?.archived !== undefined) query.set('archived', String(params.archived));
    if (params?.unread !== undefined) query.set('unread', String(params.unread));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<NotificationListResponse>(`/notifications/${suffix}`);
  },

  async markNotificationRead(id: number): Promise<NotificationItem> {
    return request<NotificationItem>(`/notifications/${id}/read/`, { method: 'POST' });
  },

  async markNotificationUnread(id: number): Promise<NotificationItem> {
    return request<NotificationItem>(`/notifications/${id}/unread/`, { method: 'POST' });
  },

  async archiveNotification(id: number): Promise<NotificationItem> {
    return request<NotificationItem>(`/notifications/${id}/archive/`, { method: 'POST' });
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/notifications/mark_all_read/', { method: 'POST' });
  },

  // Lead Import
  async previewLeadImport(file: File, onProgress?: (percent: number) => void): Promise<ImportPreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return uploadFormData<ImportPreviewResponse>('/imports/preview/', formData, onProgress);
  },

  async checkLeadImportDuplicates(
    file: File,
    mapping: Record<string, string>,
    onProgress?: (percent: number) => void
  ): Promise<DuplicateCheckResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));
    return uploadFormData<DuplicateCheckResponse>('/imports/duplicate-check/', formData, onProgress);
  },

  async executeLeadImport(
    file: File,
    mapping: Record<string, string>,
    duplicateStrategy: 'SKIP' | 'UPDATE' | 'IMPORT_ALL',
    onProgress?: (percent: number) => void
  ): Promise<ImportHistory> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));
    formData.append('duplicateStrategy', duplicateStrategy);
    return uploadFormData<ImportHistory>('/imports/execute/', formData, onProgress);
  },

  async getImportHistory(params?: { search?: string; status?: string }): Promise<ImportHistory[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<ImportHistory[]>(`/import-history/${suffix}`);
  },

  async getImportHistoryDetail(id: number): Promise<ImportHistory> {
    return request<ImportHistory>(`/import-history/${id}/`);
  },

  async retryImportFailed(id: number): Promise<ImportHistory> {
    return request<ImportHistory>(`/import-history/${id}/retry-failed/`, { method: 'POST' });
  },

  async downloadImportErrorReport(id: number): Promise<Blob> {
    const response = await fetch(`${API_BASE}/import-history/${id}/error-report/`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to download report');
    }
    return response.blob();
  },

  async getImportMappingTemplates(): Promise<ImportMappingTemplate[]> {
    return request<ImportMappingTemplate[]>('/import-mapping-templates/');
  },

  async createImportMappingTemplate(name: string, mapping: Record<string, string>): Promise<ImportMappingTemplate> {
    return request<ImportMappingTemplate>('/import-mapping-templates/', {
      method: 'POST',
      body: JSON.stringify({ name, mapping }),
    });
  },

  // Lead Export
  async previewLeadExport(payload: {
    filters: Record<string, any>;
    exportMode: 'ALL' | 'FILTERED' | 'SELECTED' | 'CURRENT_PAGE' | 'COMPLETE_DATASET';
    selectedIds?: number[];
    currentPageIds?: number[];
  }): Promise<ExportPreviewResponse> {
    return request<ExportPreviewResponse>('/exports/preview/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async generateLeadExport(payload: {
    fileType: 'csv' | 'xlsx' | 'pdf';
    filters: Record<string, any>;
    exportMode: 'ALL' | 'FILTERED' | 'SELECTED' | 'CURRENT_PAGE' | 'COMPLETE_DATASET';
    selectedIds?: number[];
    currentPageIds?: number[];
  }): Promise<{ history: ExportHistoryItem; downloadUrl: string }> {
    return request<{ history: ExportHistoryItem; downloadUrl: string }>('/exports/generate/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getExportHistory(params?: { search?: string; fileType?: string; status?: string }): Promise<ExportHistoryItem[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.fileType) query.set('fileType', params.fileType);
    if (params?.status) query.set('status', params.status);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<ExportHistoryItem[]>(`/export-history/${suffix}`);
  },

  async downloadExportFile(id: number): Promise<Blob> {
    const response = await fetch(`${API_BASE}/export-history/${id}/download/`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to download export');
    }
    return response.blob();
  },

  async getExportStats(): Promise<ExportStats> {
    return request<ExportStats>('/exports/stats/');
  },

  // Reports & analytics
  async getReportsWidgets(filters?: ReportsFilters): Promise<ReportsWidgets> {
    const query = new URLSearchParams();
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
    });
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<ReportsWidgets>(`/reports/widgets/${suffix}`);
  },

  async getLeadReports(filters?: ReportsFilters): Promise<LeadReportsData> {
    const query = new URLSearchParams({ reportType: 'lead' });
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
    });
    return request<LeadReportsData>(`/reports/analytics/?${query.toString()}`);
  },

  async getConversionReports(filters?: ReportsFilters): Promise<ConversionReportsData> {
    const query = new URLSearchParams({ reportType: 'conversion' });
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
    });
    return request<ConversionReportsData>(`/reports/analytics/?${query.toString()}`);
  },

  async getSourceReports(filters?: ReportsFilters): Promise<SourceReportsData> {
    const query = new URLSearchParams({ reportType: 'source' });
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
    });
    return request<SourceReportsData>(`/reports/analytics/?${query.toString()}`);
  },

  async getTeamReports(filters?: ReportsFilters): Promise<TeamReportsData> {
    const query = new URLSearchParams({ reportType: 'team' });
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
    });
    return request<TeamReportsData>(`/reports/analytics/?${query.toString()}`);
  },

  async getCommissionReports(filters?: ReportsFilters): Promise<CommissionReportsData> {
    const query = new URLSearchParams({ reportType: 'commission' });
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
    });
    return request<CommissionReportsData>(`/reports/analytics/?${query.toString()}`);
  },

  async exportReport(
    reportType: 'lead' | 'conversion' | 'source' | 'team' | 'commission',
    fileType: 'csv' | 'xlsx' | 'pdf',
    filters?: ReportsFilters
  ): Promise<Blob> {
    const token = localStorage.getItem('vq_token');
    const response = await fetch(`${API_BASE}/reports/export/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ reportType, fileType, ...(filters || {}) }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to export report');
    }
    return response.blob();
  },

  async getReportsExportHistory(search?: string): Promise<ExportHistoryItem[]> {
    const q = search ? `?reportOnly=true&search=${encodeURIComponent(search)}` : '?reportOnly=true';
    return request<ExportHistoryItem[]>(`/reports/export-history/${q}`);
  },

  // Audit logs
  async getAuditLogs(query?: AuditLogQuery): Promise<AuditLogPage> {
    const params = new URLSearchParams();
    Object.entries(query || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    });
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return request<AuditLogPage>(`/audit-logs/${suffix}`);
  },

  async getAuditLogWidgets(): Promise<AuditLogWidgets> {
    return request<AuditLogWidgets>('/audit-logs/widgets/');
  },

  async getAuditLogFilters(): Promise<AuditLogFilterOptions> {
    return request<AuditLogFilterOptions>('/audit-logs/filters/');
  },

  async exportAuditLogs(fileType: 'csv' | 'xlsx' | 'pdf', filters?: AuditLogQuery): Promise<Blob> {
    const token = localStorage.getItem('vq_token');
    const response = await fetch(`${API_BASE}/audit-logs/export/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ fileType, filters: filters || {} }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to export audit logs');
    }
    return response.blob();
  },

  // Settings module
  async getSettingsWidgets(): Promise<SettingsWidgets> {
    return request<SettingsWidgets>('/settings/widgets/');
  },

  async getGeneralSettings(): Promise<GeneralSettings> {
    return request<GeneralSettings>('/settings/general/');
  },

  async updateGeneralSettings(data: Partial<GeneralSettings>): Promise<GeneralSettings> {
    return request<GeneralSettings>('/settings/general/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async resetGeneralSettings(): Promise<GeneralSettings> {
    return request<GeneralSettings>('/settings/general/reset/', { method: 'POST' });
  },

  async uploadCompanyLogo(file: File): Promise<{ companyLogo: string }> {
    const form = new FormData();
    form.append('logo', file);
    const token = localStorage.getItem('vq_token');
    const response = await fetch(`${API_BASE}/settings/general/logo/`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload logo');
    }
    return response.json();
  },

  async getLeadSettings(): Promise<LeadSettings> {
    return request<LeadSettings>('/settings/leads/');
  },

  async updateLeadSettings(data: Partial<LeadSettings>): Promise<LeadSettings> {
    return request<LeadSettings>('/settings/leads/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async resetLeadSettings(): Promise<LeadSettings> {
    return request<LeadSettings>('/settings/leads/reset/', { method: 'POST' });
  },

  async getCommissionModuleSettings(): Promise<CommissionModuleSettings> {
    return request<CommissionModuleSettings>('/settings/commission/');
  },

  async updateCommissionModuleSettings(data: Partial<CommissionModuleSettings>): Promise<CommissionModuleSettings> {
    return request<CommissionModuleSettings>('/settings/commission/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async getEmailSettings(): Promise<EmailSettingsData> {
    return request<EmailSettingsData>('/settings/email/');
  },

  async updateEmailSettings(data: Partial<EmailSettingsData>): Promise<EmailSettingsData> {
    return request<EmailSettingsData>('/settings/email/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async testEmailConnection(data?: Partial<EmailSettingsData>): Promise<{ success: boolean; message: string; isConnected?: boolean }> {
    return request('/settings/email/test/', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  async getNotificationSettings(): Promise<NotificationSettingsData> {
    return request<NotificationSettingsData>('/settings/notifications/');
  },

  async updateNotificationSettings(items: NotificationSettingItem[]): Promise<NotificationSettingsData> {
    return request<NotificationSettingsData>('/settings/notifications/', {
      method: 'PATCH',
      body: JSON.stringify({ items }),
    });
  },

  async getApiIntegrations(): Promise<ApiIntegrationsData> {
    return request<ApiIntegrationsData>('/settings/api/');
  },

  async updateApiIntegration(serviceName: string, data: Partial<ApiIntegrationItem>): Promise<ApiIntegrationsData> {
    return request<ApiIntegrationsData>('/settings/api/', {
      method: 'PATCH',
      body: JSON.stringify({ serviceName, ...data }),
    });
  },

  async apiIntegrationAction(
    serviceName: string,
    action: 'connect' | 'disconnect' | 'test'
  ): Promise<Record<string, unknown>> {
    return request(`/settings/api/${serviceName}/`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },

  async getSettingsAudit(): Promise<AuditLog[]> {
    return request<AuditLog[]>('/settings/audit/');
  },

  // Dashboards
  async getDashboardStats(): Promise<DashboardStats> {
    return request<DashboardStats>('/dashboard/stats/');
  },

  async getDashboardCharts(): Promise<DashboardCharts> {
    return request<DashboardCharts>('/dashboard/charts/');
  },

  async getAgentDashboard(): Promise<AgentDashboardData> {
    return request<AgentDashboardData>('/dashboard/agent/');
  },
};
