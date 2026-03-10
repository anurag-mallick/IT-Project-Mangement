"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Ticket } from '@/types';
import TicketDetailModal from '@/components/TicketDetailModal';

const priorityColor: Record<string, string> = {
  URGENT: 'text-red-400',
  HIGH:   'text-orange-400',
  MEDIUM: 'text-indigo-400',
  LOW:    'text-zinc-400',
};

const statusColors: Record<string, string> = {
  TODO:          'bg-zinc-700/50 text-zinc-300',
  IN_PROGRESS:   'bg-blue-500/15 text-blue-300',
  AWAITING_USER: 'bg-yellow-500/15 text-yellow-300',
  RESOLVED:      'bg-green-500/15 text-green-300',
  CLOSED:        'bg-zinc-600/30 text-zinc-400',
};

const ListBoard = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:4000/api/tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch tickets');
      const data = await res.json();
      setTickets(data);
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, [token]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center py-24">
      <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
    </div>
  );

  if (error) return (
    <div className="glass-card p-6 flex items-center gap-3 text-red-400">
      <AlertCircle size={18} />
      <span className="text-sm">{error}</span>
      <button onClick={fetchTickets} className="ml-auto text-indigo-400 hover:underline text-xs font-bold">Retry</button>
    </div>
  );

  return (
    <>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/5 text-[10px] uppercase tracking-widest text-white/40 font-bold">
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Requester</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-white/20 text-sm">No tickets found</td>
              </tr>
            ) : (
              tickets.map(ticket => (
                <tr
                  key={ticket.id}
                  className="hover:bg-white/5 transition-colors group cursor-pointer"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <td className="px-6 py-4 font-mono text-xs text-white/30">#{ticket.id}</td>
                  <td className="px-6 py-4 text-sm font-medium max-w-xs truncate">{ticket.title}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight ${statusColors[ticket.status] ?? 'bg-white/5 text-white/50'}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase ${priorityColor[ticket.priority] ?? 'text-white/40'}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-white/40">{ticket.requesterName || '—'}</td>
                  <td className="px-6 py-4 text-xs text-white/30">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <ChevronRight size={16} className="text-white/20 group-hover:text-white/60 transition-colors inline-block" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TicketDetailModal
        isOpen={!!selectedTicket}
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onUpdate={fetchTickets}
      />
    </>
  );
};

export default ListBoard;
