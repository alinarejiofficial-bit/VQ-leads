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
  created_at: string;
  created_by: number | null;
  created_by_name: string;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'NEW' | 'AVAILABLE' | 'CLAIMED' | 'CONTACTED' | 'QUALIFIED' | 'FOLLOW_UP' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'CONVERTED' | 'LOST' | 'DUPLICATE' | 'INVALID';
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
  calls: number;
  conversions: number;
  revenue: number;
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

export interface FollowUp {
  id: number;
  lead: number;
  lead_name: string;
  scheduled_time: string;
  notes: string;
  completed: boolean;
  created_by: number;
  created_by_name: string;
  created_at: string;
}

export interface Task {
  id: number;
  lead: number | null;
  lead_name: string;
  title: string;
  description: string;
  due_date: string | null;
  assigned_to: number;
  assigned_to_details: User | null;
  status: 'PENDING' | 'COMPLETED';
  created_by: number | null;
  created_by_name: string;
  created_at: string;
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
  availableLeads: number;
  assignedLeads: number;
  claimedLeads: number;
  convertedLeads: number;
  lostLeads: number;
  todayLeads: number;
  followupsDue: number;
  earnedCommissions: number;
  conversionRate: number;
  pipelineValue: number;
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
  async getForms(): Promise<LeadForm[]> {
    return request<LeadForm[]>('/forms/');
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

  // Public Form (No authentication token needed)
  async getPublicForm(id: number): Promise<LeadForm> {
    const response = await fetch(`${API_BASE}/public/forms/${id}/`);
    if (!response.ok) {
      throw new Error('Form not found or inactive');
    }
    return response.json();
  },

  async submitPublicForm(id: number, data: any): Promise<{ success: boolean; lead: Lead; assigned_to: string }> {
    const response = await fetch(`${API_BASE}/public/forms/${id}/submit/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Submission failed');
    }
    return response.json();
  },

  // Tasks
  async getTasks(): Promise<Task[]> {
    return request<Task[]>('/tasks/');
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
    return request<void>(`/tasks/${id}/`, {
      method: 'DELETE',
    });
  },

  // Follow-ups
  async getFollowUps(): Promise<FollowUp[]> {
    return request<FollowUp[]>('/followups/');
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
