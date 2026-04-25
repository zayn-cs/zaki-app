import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { apiUrl } from "./api";

interface User {
  id: number;
  nom: string;
  prenom: string;
  messager: string;
  role: string;
  grade: string;
  adresse: string;
  is_chef_project: boolean;
  id_departement: number | null;
  nom_departement: string | null;
  telephone_professional?: string | null;
  telephone_personnel?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (messager: string, mot_pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await fetch(apiUrl("/auth/me"), { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMe();
  }, []);

  const login = async (messager: string, mot_pass: string) => {
    const res = await fetch(apiUrl("/auth/login"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messager, mot_pass }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(data.error || "Erreur de connexion");
    }

    const data = await res.json();
    setUser(data);
  };

  const logout = async () => {
    await fetch(apiUrl("/auth/logout"), {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refetchUser: () => void fetchMe() }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export type { User };
