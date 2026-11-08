import { AuthUser, TeamMember } from '../types/ledger';

const STORAGE_KEY_AUTH_USER = 'calypso_current_user_v1';
const STORAGE_KEY_USERS_DB = 'calypso_registered_users_v1';

export const DEFAULT_AUTH_USERS: AuthUser[] = [
  {
    id: 'user-cpa-1',
    name: 'Maria Clarissa Santos, CPA',
    email: 'm.santos@apexcloud.ph',
    role: 'Lead CPA / Controller',
    accessLevel: 'admin',
    tinOrPrcNumber: 'PRC-0098412',
    avatarInitials: 'MS',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'user-bk-2',
    name: 'Eduardo Reyes',
    email: 'e.reyes@apexcloud.ph',
    role: 'Senior Bookkeeper',
    accessLevel: 'editor',
    tinOrPrcNumber: 'TIN-482-194-001',
    avatarInitials: 'ER',
    createdAt: '2026-01-15T09:30:00Z',
  },
  {
    id: 'user-auditor-3',
    name: 'Atty. Victorina Ramos',
    email: 'v.ramos@bir-audit.gov.ph',
    role: 'BIR Examiner / Auditor',
    accessLevel: 'viewer',
    tinOrPrcNumber: 'BIR-RO44-EXAM',
    avatarInitials: 'VR',
    createdAt: '2026-02-01T14:00:00Z',
  },
];

export function getStoredAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to read auth user from localStorage:', e);
  }
  // Default to Lead CPA for instant frictionless experience if not explicitly logged out
  return DEFAULT_AUTH_USERS[0];
}

export function saveStoredAuthUser(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
    }
  } catch (e) {
    console.warn('Failed to save auth user to localStorage:', e);
  }
}

export function getRegisteredUsers(): AuthUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS_DB);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to read registered users from localStorage:', e);
  }
  return DEFAULT_AUTH_USERS;
}

export function saveRegisteredUser(user: AuthUser): void {
  try {
    const users = getRegisteredUsers();
    const existingIndex = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));

    // Also sync to team members storage so Account Management shows this user
    syncAuthUserToTeamMembers(user);
  } catch (e) {
    console.warn('Failed to save registered user:', e);
  }
}

export function syncAuthUserToTeamMembers(authUser: AuthUser): void {
  try {
    const raw = localStorage.getItem('calypso_team_members_v1');
    let members: TeamMember[] = raw ? JSON.parse(raw) : [];
    if (!members.some(m => m.email.toLowerCase() === authUser.email.toLowerCase())) {
      members.push({
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role === 'Business Owner / Director' ? 'Lead CPA / Controller' : authUser.role,
        accessLevel: authUser.accessLevel,
        lastActive: 'Active now',
        status: 'active',
      });
      localStorage.setItem('calypso_team_members_v1', JSON.stringify(members));
    }
  } catch (e) {
    console.warn('Failed to sync user to team members:', e);
  }
}
