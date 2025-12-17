"use client";

import { generateIdentity, hashStringToColor } from "@/lib/identity";
import { provider, SERVER_URL } from "@/lib/ydoc";
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

const SESSION_KEY = "agora_session";

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
  const session = localStorage.getItem(SESSION_KEY);
  return session ? { Authorization: `Bearer ${session}` } : {};
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [xUser, setXUser] = useState<XUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for session in URL fragment (from OAuth callback)
    const hash = window.location.hash;
    if (hash.startsWith("#session=")) {
      const sessionId = hash.slice("#session=".length);
      localStorage.setItem(SESSION_KEY, sessionId);
      // Clear the hash from URL without triggering navigation
      window.history.replaceState(null, "", window.location.pathname);
    }

    // Fetch user with session from localStorage
    fetch(`${SERVER_URL}/api/auth/me`, {
      headers: getAuthHeaders(),
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
        color: xUser ? hashStringToColor(xUser.handle) : localUser.color,
        avatar: xUser.avatar,
      });
    }
  }, [xUser]);

  const logout = async () => {
    await fetch(`${SERVER_URL}/api/auth/logout`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    localStorage.removeItem(SESSION_KEY);
    setXUser(null);
    provider.awareness?.setLocalStateField("user", localUser);
  };

  return (
    <AuthContext.Provider
      value={{
        xUser,
        user: {
          ...localUser,
          color: xUser ? hashStringToColor(xUser.handle) : localUser.color,
        },
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
