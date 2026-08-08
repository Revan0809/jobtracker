import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import { tokenStorage } from "../lib/tokenStorage";
import type { TokenPair, User } from "../types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    const { data } = await api.get<User>("/auth/me");
    setUser(data);
  }, []);

  useEffect(() => {
    const hasTokens = Boolean(tokenStorage.getAccessToken());
    if (!hasTokens) {
      setIsLoading(false);
      return;
    }
    fetchCurrentUser()
      .catch(() => {
        tokenStorage.clear();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, [fetchCurrentUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<TokenPair>("/auth/login", { email, password });
      tokenStorage.setTokens(data.access_token, data.refresh_token);
      await fetchCurrentUser();
    },
    [fetchCurrentUser],
  );

  const signup = useCallback(
    async (email: string, password: string, fullName?: string) => {
      const { data } = await api.post<TokenPair>("/auth/signup", {
        email,
        password,
        full_name: fullName || undefined,
      });
      tokenStorage.setTokens(data.access_token, data.refresh_token);
      await fetchCurrentUser();
    },
    [fetchCurrentUser],
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, isAuthenticated: Boolean(user), login, signup, logout }),
    [user, isLoading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
