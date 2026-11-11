import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('nairaflow_auth_V1');
      return saved !== null ? saved === 'true' : true; // Default logged in for smooth dev/demo
    } catch {
      return true;
    }
  });

  const login = (email: string, password: string): boolean => {
    // Simulated authentication — accept any valid input
    if (email && password) {
      setIsAuthenticated(true);
      try {
        localStorage.setItem('nairaflow_auth_V1', 'true');
      } catch (err) {
        console.warn('Unable to persist auth to localStorage', err);
      }
      return true;
    }
    return false;
  };

  const logout = (): void => {
    setIsAuthenticated(false);
    try {
      localStorage.setItem('nairaflow_auth_V1', 'false');
    } catch (err) {
      console.warn('Unable to persist auth to localStorage', err);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
}
