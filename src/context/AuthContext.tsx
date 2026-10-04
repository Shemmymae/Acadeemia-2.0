import React, { createContext, useContext, useState, useEffect } from 'react';
import { InstitutionRole, PlatformRole, User } from '../types';
import { tenantStore } from '../services/tenantStore';
import { hasPermission } from '../services/permissionEngine';

interface AuthContextType {
  currentUser: User;
  activeRole: InstitutionRole | PlatformRole;
  isPlatformAdmin: boolean;
  switchUser: (userId: string, role?: InstitutionRole | PlatformRole) => void;
  switchRole: (role: InstitutionRole | PlatformRole) => void;
  can: (permission: string) => boolean;
  availableUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const users = tenantStore.getUsers();
  const [currentUser, setCurrentUser] = useState<User>(users[0]);
  const [activeRole, setActiveRole] = useState<InstitutionRole | PlatformRole>('platform_admin');

  // Sync default role when user changes
  useEffect(() => {
    if (currentUser.is_platform_user) {
      setActiveRole(currentUser.platform_role || 'platform_admin');
    } else {
      setActiveRole('institution_owner');
    }
  }, [currentUser]);

  const switchUser = (userId: string, role?: InstitutionRole | PlatformRole) => {
    const user = tenantStore.getUser(userId);
    if (user) {
      setCurrentUser(user);
      if (role) {
        setActiveRole(role);
      } else if (user.is_platform_user) {
        setActiveRole(user.platform_role || 'platform_admin');
      } else {
        setActiveRole('institution_owner');
      }
    }
  };

  const switchRole = (role: InstitutionRole | PlatformRole) => {
    setActiveRole(role);
  };

  const isPlatformAdmin = currentUser.is_platform_user && activeRole === 'platform_admin';

  const can = (permission: string) => {
    return hasPermission(activeRole, [], permission, isPlatformAdmin);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeRole,
        isPlatformAdmin,
        switchUser,
        switchRole,
        can,
        availableUsers: users,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
