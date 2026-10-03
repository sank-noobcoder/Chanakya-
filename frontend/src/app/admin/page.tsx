"use client";

import React, { useState } from "react";
import { ShieldCheck, UserCheck, Key, ListFilter, X, Check, Sliders, AlertCircle } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";

interface UserItem {
  id: string;
  email: string;
  role: "admin" | "engineer" | "user";
  status: "Active" | "Suspended";
  activeSolves: number;
  quota: number;
}

function AdminContent() {
  const [users, setUsers] = useState<UserItem[]>([
    { id: "u-101", email: "admin@chanakya.gov.in", role: "admin", status: "Active", activeSolves: 0, quota: 20 },
    { id: "u-102", email: "engineer@iit.ac.in", role: "engineer", status: "Active", activeSolves: 1, quota: 10 },
    { id: "u-103", email: "analyst@iocl.in", role: "user", status: "Active", activeSolves: 0, quota: 5 },
  ]);

  const [auditEvents] = useState([
    { id: "evt-901", actor: "admin@chanakya.gov.in", action: "user_role_update", ip: "10.0.4.12", time: "10 mins ago" },
    { id: "evt-900", actor: "analyst@iocl.in", action: "job_submitted", ip: "10.0.8.44", time: "14 mins ago" },
    { id: "evt-899", actor: "analyst@iocl.in", action: "user_login_success", ip: "10.0.8.44", time: "22 mins ago" },
  ]);

  // Modal editing state
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [modalQuota, setModalQuota] = useState<number>(5);
  const [modalRole, setModalRole] = useState<"admin" | "engineer" | "user">("user");
  const [modalStatus, setModalStatus] = useState<"Active" | "Suspended">("Active");
  const [toastMessage, setToastMessage] = useState<string>("");

  const handleOpenEditModal = (u: UserItem) => {
    setEditingUser(u);
    setModalQuota(u.quota);
    setModalRole(u.role);
    setModalStatus(u.status);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUsers((prev) =>
      prev.map((item) =>
        item.id === editingUser.id
          ? { ...item, quota: modalQuota, role: modalRole, status: modalStatus }
          : item
      )
    );

    setToastMessage(`Updated quota for ${editingUser.email} to ${modalQuota} slots successfully.`);
    setEditingUser(null);
    setTimeout(() => setToastMessage(""), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-heading font-bold text-3xl text-white">Administrator Mission Control</h1>
        <p className="text-sm text-gray-400 mt-1">Manage users, adjust quotas, and review immutable audit logs.</p>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center space-x-2 text-sm">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* User Management */}
      <div className="glass-panel overflow-hidden border-white/10">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-heading font-semibold text-lg text-white">Registered Users & Quotas</h2>
          <span className="text-xs font-mono text-cyan-live">RBAC Enforced</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-mono uppercase text-gray-400">
                <th className="py-3.5 px-6">User ID</th>
                <th className="py-3.5 px-6">Email</th>
                <th className="py-3.5 px-6">Role</th>
                <th className="py-3.5 px-6">Concurrent Quota</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02]">
                  <td className="py-3.5 px-6 text-gray-500">{u.id}</td>
                  <td className="py-3.5 px-6 text-white font-sans">{u.email}</td>
                  <td className="py-3.5 px-6">
                    <span
                      className={`px-2 py-0.5 rounded border text-[11px] uppercase font-mono ${
                        u.role === "admin"
                          ? "bg-saffron/10 border-saffron/30 text-saffron"
                          : u.role === "engineer"
                          ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-live"
                          : "bg-white/5 border-white/10 text-gray-300"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-gray-300">{u.quota} concurrent jobs</td>
                  <td className="py-3.5 px-6">
                    <span className={u.status === "Active" ? "text-emerald-400" : "text-red-400"}>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={() => handleOpenEditModal(u)}
                      className="px-2.5 py-1 rounded-lg bg-surface border border-white/10 text-xs font-mono text-saffron hover:border-saffron/40 hover:bg-saffron/5 transition-all"
                    >
                      Edit Quota
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Quota Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl glass-panel border border-white/15 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-saffron" />
                <h3 className="font-heading font-bold text-lg text-white">Edit User Quota & Permissions</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-400 mb-1">Target Account</label>
                <input
                  type="text"
                  disabled
                  value={editingUser.email}
                  className="w-full bg-[#07090F] border border-white/10 rounded-input px-3.5 py-2 text-sm text-gray-300 font-mono opacity-80"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-400 mb-1">
                  Concurrent Job Quota (Active Slots)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={modalQuota}
                    onChange={(e) => setModalQuota(Number(e.target.value))}
                    className="w-full bg-[#07090F] border border-white/10 rounded-input px-3.5 py-2 text-sm font-mono text-white focus:outline-none focus:border-saffron"
                  />
                  <span className="text-xs text-gray-400 font-mono whitespace-nowrap">slots</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Maximum active solvers allowed simultaneously.</p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-400 mb-1">Security Role</label>
                <select
                  value={modalRole}
                  onChange={(e) => setModalRole(e.target.value as any)}
                  className="w-full bg-[#07090F] border border-white/10 rounded-input px-3.5 py-2 text-sm font-mono text-white focus:outline-none focus:border-saffron"
                >
                  <option value="user">USER (Standard Solve Access)</option>
                  <option value="engineer">ENGINEER (Parameter Overrides & Benchmarks)</option>
                  <option value="admin">ADMIN (Full Console Governance)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-400 mb-1">Account State</label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as any)}
                  className="w-full bg-[#07090F] border border-white/10 rounded-input px-3.5 py-2 text-sm font-mono text-white focus:outline-none focus:border-saffron"
                >
                  <option value="Active">Active (Permitted)</option>
                  <option value="Suspended">Suspended (Access Revoked)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-saffron px-5 py-2 rounded-xl text-xs font-mono flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Quota</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Log */}
      <div className="glass-panel overflow-hidden border-white/10">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-heading font-semibold text-lg text-white">Immutable Security Audit Trail</h2>
          <span className="text-xs font-mono text-gray-400">Layer 7 Audit Storage</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-mono uppercase text-gray-400">
                <th className="py-3.5 px-6">Event ID</th>
                <th className="py-3.5 px-6">Actor</th>
                <th className="py-3.5 px-6">Action</th>
                <th className="py-3.5 px-6">Origin IP</th>
                <th className="py-3.5 px-6 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {auditEvents.map((e) => (
                <tr key={e.id} className="hover:bg-white/[0.02]">
                  <td className="py-3.5 px-6 text-cyan-live">{e.id}</td>
                  <td className="py-3.5 px-6 font-sans text-gray-300">{e.actor}</td>
                  <td className="py-3.5 px-6 text-saffron">{e.action}</td>
                  <td className="py-3.5 px-6 text-gray-400">{e.ip}</td>
                  <td className="py-3.5 px-6 text-right text-gray-500">{e.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminContent />
    </AuthGuard>
  );
}
