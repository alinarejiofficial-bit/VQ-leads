import React from 'react';
import { Shield, Crown, Users, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/common/Card';
import type { User } from '../../api';
import { TEAM_ROLES, getRoleBadgeClass, type RoleId } from './rolesConfig';

const ROLE_ICONS: Record<RoleId, React.ReactNode> = {
  ADMIN: <Crown size={20} />,
  LEADER: <Shield size={20} />,
  AGENT: <Users size={20} />,
};

const ROLE_ACCENT: Record<RoleId, string> = {
  ADMIN: 'from-violet-500/15 to-violet-500/5 border-violet-500/20',
  LEADER: 'from-amber-500/15 to-amber-500/5 border-amber-500/20',
  AGENT: 'from-sky-500/15 to-sky-500/5 border-sky-500/20',
};

interface RolesTabProps {
  members: User[];
}

export const RolesTab: React.FC<RolesTabProps> = ({ members }) => {
  const countByRole = (roleId: RoleId) =>
    members.filter(m => m.profile.role === roleId).length;

  return (
    <div className="space-y-6">
      <Card className="p-6 text-left">
        <h3 className="text-base font-semibold text-foreground">Roles & Permissions</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Controls what each user type can see and do in the CRM. Assign a role when adding or editing a team member on the Members tab.
        </p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {TEAM_ROLES.map(role => (
          <Card
            key={role.id}
            className={`p-6 flex flex-col text-left bg-gradient-to-b ${ROLE_ACCENT[role.id]}`}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg border ${getRoleBadgeClass(role.id)}`}>
                  {ROLE_ICONS[role.id]}
                </div>
                <div>
                  <h4 className="text-base font-semibold text-foreground">{role.name}</h4>
                  <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${getRoleBadgeClass(role.id)}`}>
                    {role.id}
                  </span>
                </div>
              </div>
              {role.id !== 'ADMIN' && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {countByRole(role.id)} member{countByRole(role.id) !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed mb-5">
              {role.description}
            </p>

            <div className="mt-auto pt-4 border-t border-border/40">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Can
              </p>
              <ul className="space-y-2">
                {role.permissions.map(permission => (
                  <li key={permission} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 size={15} className="text-primary mt-0.5 shrink-0" />
                    <span>{permission}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
