"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users, Loader2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { User } from '@/types';

export default function UserManagementPage() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    if (!token) return;
    setUpdating(userId);
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      
      if (res.ok) {
        setSuccess('User role updated successfully.');
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update role');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          <Users className="text-indigo-400" /> User Management
        </h1>
        <p className="text-white/50 text-sm">Manage access and permissions for all users across the workspace.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <ShieldAlert size={20} />
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 size={20} />
          <p className="font-medium text-sm">{success}</p>
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">Current Role</th>
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest w-48">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                        {u.email.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-white/90">{u.email}</span>
                      {u.id === currentUser?.id && (
                        <span className="bg-white/10 text-white/50 text-[10px] uppercase font-bold px-2 py-0.5 rounded ml-2">You</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={\`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider \${
                      u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 
                      u.role === 'STAFF' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 
                      'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
                    }\`}>
                      {u.role || 'USER'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role || 'USER'}
                      disabled={updating === u.id || u.id === currentUser?.id}
                      onChange={(e) => updateUserRole(u.id, e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
                    >
                      <option value="USER">User (Standard)</option>
                      <option value="STAFF">Staff (Agent)</option>
                      <option value="ADMIN">Admin (God Mode)</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="p-8 text-center text-white/50 italic">No users found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
