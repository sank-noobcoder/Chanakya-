"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Cpu, Play, BarChart3, BookOpen, User, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();

  // Role-aware navigation items
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Cpu },
    { name: "New Solve", href: "/jobs/new", icon: Play },
    { name: "Benchmarks", href: "/benchmarks", icon: BarChart3 },
    { name: "Algorithms & Docs", href: "/docs", icon: BookOpen },
    // Only show Admin nav link to users with admin clearance
    ...(user?.role === "admin" ? [{ name: "Admin", href: "/admin", icon: ShieldCheck }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#07090F]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-3 group flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-saffron to-saffron-light flex items-center justify-center font-heading font-bold text-background shadow-saffron-glow transition-transform group-hover:scale-105">
            च
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-heading font-bold text-xl tracking-tight text-white">CHANAKYA</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-saffron/10 text-saffron border border-saffron/20">
                Sovereign v1.0
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono tracking-wider -mt-0.5">Mathematical Engine</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-surface text-saffron border border-white/10 shadow-sm"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-saffron" : "text-gray-500"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action: Profile & Controls */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="hidden xl:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-live text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-live animate-pulse"></span>
            <span>OSI Layer 7 Active</span>
          </div>

          {isAuthenticated && user ? (
            <div className="flex items-center space-x-3">
              {/* Profile Card */}
              <div className="hidden sm:flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-surface border border-white/10 shadow-sm">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                    user.role === "admin"
                      ? "bg-saffron/20 text-saffron border border-saffron/30"
                      : user.role === "engineer"
                      ? "bg-cyan-500/20 text-cyan-live border border-cyan-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {user.role[0].toUpperCase()}
                </div>
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-xs font-mono text-gray-200">{user.email}</span>
                  <span
                    className={`text-[10px] uppercase font-mono font-semibold tracking-wider ${
                      user.role === "admin"
                        ? "text-saffron"
                        : user.role === "engineer"
                        ? "text-cyan-live"
                        : "text-emerald-400"
                    }`}
                  >
                    {user.role} Clearance
                  </span>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={logout}
                title="Sign Out of Mission Control"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-surface/80 text-xs font-mono text-gray-300 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border border-white/10 bg-surface text-sm font-medium text-gray-300 hover:text-white hover:border-saffron/40 transition-all"
            >
              <User className="w-4 h-4 text-gray-400" />
              <span>Console Access</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
