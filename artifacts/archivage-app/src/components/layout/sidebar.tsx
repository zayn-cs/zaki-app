import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Layers,
  Files,
  Users,
  Building2,
  Search,
  History,
  LogOut,
  Archive,
  ChevronLeft,
  GitBranch,
  Briefcase,
  Boxes,
  MapPin,
  Globe,
  Network,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Tableau de bord" },
  { href: "/projets", icon: FolderKanban, label: "Projets" },
  { href: "/lots", icon: Layers, label: "Lots" },
  { href: "/documents", icon: Files, label: "Documents" },
  { href: "/recherche", icon: Search, label: "Recherche" },
  { href: "/historique", icon: History, label: "Historique" },
];

const adminItems = [
  { href: "/utilisateurs", icon: Users, label: "Utilisateurs" },
  { href: "/departements", icon: Building2, label: "Départements" },
  { href: "/bet", icon: Briefcase, label: "BET" },
  { href: "/unites", icon: Network, label: "Unités" },
  { href: "/tags", icon: Tag, label: "Tags" },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "coordinateur";

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 transition-all duration-300 z-30",
        "bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))]",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex items-center justify-between px-4 py-4 border-b border-[hsl(var(--sidebar-border))]">
        {!collapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-[#1a1d24] p-2 shadow-[4px_4px_10px_#0b0d10,-4px_-4px_10px_#252b36] border border-white/10 flex items-center justify-center">
              <img src="/dcim.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-lg tracking-wide text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 truncate">
              Archivage
            </span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto w-16 h-16 rounded-xl bg-[#1a1d24] p-2 shadow-[4px_4px_10px_#0b0d10,-4px_-4px_10px_#252b36] border border-white/10 flex items-center justify-center">
            <img src="/dcim.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] h-7 w-7 flex-shrink-0"
          data-testid="button-toggle-sidebar"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]"
                    : "hover:bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))]"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>
            </Link>
          );
        })}

        {isAdmin && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-1 px-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--sidebar-foreground))] opacity-50">
                  Administration
                </span>
              </div>
            )}
            {collapsed && <div className="pt-2 border-t border-[hsl(var(--sidebar-border))]" />}
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                      isActive
                        ? "bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]"
                        : "hover:bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))]"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="px-2 py-3 border-t border-[hsl(var(--sidebar-border))]">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-semibold truncate">{user.prenom} {user.nom}</p>
            <p className="text-xs opacity-60 truncate capitalize">{user.role?.replace("_", " ")}</p>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={() => void logout()}
          data-testid="button-logout"
          className={cn(
            "w-full text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-red-400",
            collapsed ? "justify-center px-0" : "justify-start"
          )}
          size={collapsed ? "icon" : "default"}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2 text-sm">Déconnexion</span>}
        </Button>
      </div>
    </aside>
  );
}
