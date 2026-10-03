"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "engineer" | "user";
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-saffron animate-spin" />
        <p className="text-sm font-mono text-gray-400">Verifying sovereign security credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-saffron opacity-80" />
        <h2 className="text-lg font-heading font-semibold text-white">Authentication Required</h2>
        <p className="text-xs text-gray-400 font-mono">Redirecting to console authentication...</p>
      </div>
    );
  }

  if (requiredRole && user && user.role !== requiredRole && user.role !== "admin") {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 glass-panel border-red-500/20 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
        <h1 className="text-xl font-heading font-bold text-white">Security Clearance Insufficient</h1>
        <p className="text-sm text-gray-400">
          This mission control domain requires <span className="text-saffron uppercase font-mono">{requiredRole}</span> role clearance.
          Your current account role is <span className="text-cyan-live uppercase font-mono">{user.role}</span>.
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="btn-saffron inline-flex items-center space-x-2 text-xs py-2 px-4 shadow-saffron-glow"
          >
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
