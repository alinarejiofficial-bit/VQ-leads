import type { UserProfile } from '../../api';

export type RoleId = UserProfile['role'];

export interface RoleDefinition {
  id: RoleId;
  name: string;
  description: string;
  permissions: string[];
}

export const TEAM_ROLES: RoleDefinition[] = [
  {
    id: 'ADMIN',
    name: 'Super Admin',
    description: 'Full access to the CRM — manages users, teams, leads, and system settings.',
    permissions: [
      'Manage everything',
      'View reports',
      'Assign leads',
      'Manage teams',
    ],
  },
  {
    id: 'LEADER',
    name: 'Team Leader',
    description: 'Oversees a sales team — monitors pipeline and guides agents on their leads.',
    permissions: [
      'View team leads',
      'Reassign leads',
      'Approve conversions',
    ],
  },
  {
    id: 'AGENT',
    name: 'Sales Agent',
    description: 'Front-line sales rep — works claimed leads through the pipeline.',
    permissions: [
      'Claim leads',
      'Add notes',
      'Add call logs',
      'Create follow-ups',
    ],
  },
];

export const ASSIGNABLE_MEMBER_ROLES = TEAM_ROLES.filter(r => r.id !== 'ADMIN');

export function getRoleLabel(role: RoleId): string {
  return TEAM_ROLES.find(r => r.id === role)?.name ?? role;
}

export function getRoleBadgeClass(role: RoleId): string {
  switch (role) {
    case 'ADMIN':
      return 'bg-violet-500/10 border-violet-500/25 text-violet-400';
    case 'LEADER':
      return 'bg-amber-500/10 border-amber-500/25 text-amber-400';
    case 'AGENT':
      return 'bg-sky-500/10 border-sky-500/25 text-sky-400';
    default:
      return 'bg-muted/40 border-border/55 text-muted-foreground';
  }
}
