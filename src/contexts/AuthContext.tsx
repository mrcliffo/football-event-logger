import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: false
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simple demo login - in real app would validate against database
    if (email === 'coach@demo.com' && password === 'password') {
      const demoUser: User = {
        id: 1,
        email: 'coach@demo.com',
        firstName: 'John',
        lastName: 'Smith',
        role: 'coach',
        teamIds: [1],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setState({
        user: demoUser,
        isAuthenticated: true,
        loading: false
      });
      return true;
    }
    
    if (email === 'parent@demo.com' && password === 'password') {
      const demoUser: User = {
        id: 2,
        email: 'parent@demo.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'parent',
        teamIds: [1],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setState({
        user: demoUser,
        isAuthenticated: true,
        loading: false
      });
      return true;
    }
    
    return false;
  };

  const logout = (): void => {
    setState({
      user: null,
      isAuthenticated: false,
      loading: false
    });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};