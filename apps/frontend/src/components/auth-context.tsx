"use client";

import { generateIdentity } from "@/lib/identity";
import { provider, SERVER_DOMAIN } from "@/lib/ydoc";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type XUser = {
  id: string;
  handle: string;
  avatar: string;
};

type AuthContextType = {
  xUser: XUser | null;
  user: { name: string; color: string };
  logout: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

const localUser = generateIdentity();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [xUser, setXUser] = useState<XUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://${SERVER_DOMAIN}/api/auth/me`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setXUser(data))
      .catch(() => setXUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (xUser) {
      provider.awareness?.setLocalStateField("user", {
        name: `@${xUser.handle}`,
        color: localUser.color,
        avatar: xUser.avatar,
      });
    }
  }, [xUser]);

  const logout = async () => {
    await fetch(`http://${SERVER_DOMAIN}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setXUser(null);
    provider.awareness?.setLocalStateField("user", localUser);
  };

  return (
    <AuthContext.Provider value={{ xUser, user: localUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
