"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogOut } from "lucide-react";

export default function LogoutPage() {
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    logout();
    router.replace("/auth/login");
  }, [logout, router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 animate-pulse">
        <LogOut className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-heading font-semibold text-white">Signing Out of Chanakya...</h2>
      <p className="text-sm font-mono text-gray-400">Clearing cryptographic security session and redirecting to login.</p>
    </div>
  );
}
