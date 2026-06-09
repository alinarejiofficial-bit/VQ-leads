export const API_BASE = 'http://localhost:8000/api';

// Interfaces
export interface UserProfile {
  role: 'ADMIN' | 'LEADER' | 'AGENT';
  commission_rate: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile: UserProfile;
  full_name: string;
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
  user: number | null;
  user_name: string;
  activity_type: string;
  description: string;
  created_at: string;
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
    followups: number;
    tasksDue: number;
    commission: number;
  };
  pipeline: { label: string; count: number }[];
  monthlyPerformance: {
    callsMade: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
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
