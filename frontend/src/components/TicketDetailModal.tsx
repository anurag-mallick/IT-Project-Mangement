"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Ticket, Comment as TicketComment, User, Priority } from '../types';
import { X, Send, User as UserIcon, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { uploadAttachment } from '@/lib/storage';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const STATUS_OPTIONS = ['TODO','IN_PROGRESS','AWAITING_USER','RESOLVED','CLOSED'];
const PRIORITY_OPTIONS: Priority[] = ['P0','P1','P2','P3'];

const PRIORITY_LABELS: Record<string, string> = {
  P0: 'P0 – Critical',
  P1: 'P1 – High',
  P2: 'P2 – Normal',
  P3: 'P3 – Low',
};

const PRIORITY_COLORS: Record<string, string> = {
  P0: 'text-red-400',
  P1: 'text-orange-400',
  P2: 'text-indigo-400',
  P3: 'text-zinc-400',
};

const TicketDetailModal = ({ ticket, isOpen, onClose, onUpdate }: TicketDetailModalProps) => {
  const { token } = useAuth();
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  // Local editable state
  const [localStatus, setLocalStatus] = useState('');
  const [localPriority, setLocalPriority] = useState<Priority>('P2');
  const [localAssignee, setLocalAssignee] = useState<string>('');

  useEffect(() => {
    if (isOpen && ticket) {
      setLocalStatus(ticket.status);
      setLocalPriority(ticket.priority);
      setLocalAssignee(ticket.assignedToId ? String(ticket.assignedToId) : '');
      fetchComments();
      fetchStaff();
    }
  }, [isOpen, ticket]);

  const fetchComments = async () => {
    if (!ticket) return;
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setComments(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setStaff(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const saveTicket = async () => {
    if (!ticket) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          status: localStatus,
          priority: localPriority,
          assignedToId: localAssignee ? parseInt(localAssignee) : null
        })
      });
      if (res.ok) {
        onUpdate();
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const postComment = async () => {
    if (!newComment.trim() || !ticket) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ content: newComment })
      });
      if (res.ok) {
        setNewComment('');
        fetchComments();
        setCommentSuccess(true);
        setTimeout(() => setCommentSuccess(false), 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !ticket) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-zinc-900 border-l border-white/10 h-full flex flex-col shadow-2xl">
        <div className="p-6 border-b border-white/10 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">{ticket.title}</h2>
            <div className="text-xs text-white/40 mt-1">Ticket #{ticket.id}</div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-white/40 font-bold">Description</h3>
            <p className="text-sm text-white/80 whitespace-pre-wrap">{ticket.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-6 p-4 bg-white/5 rounded-xl border border-white/5">
            <div className="space-y-2">
              <label className="text-xs text-white/40 font-bold">Status</label>
              <select value={localStatus} onChange={e => setLocalStatus(e.target.value)} className="w-full bg-zinc-800 border-none rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500">
                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/40 font-bold">Priority</label>
              <select value={localPriority} onChange={e => setLocalPriority(e.target.value as Priority)} className="w-full bg-zinc-800 border-none rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500">
                {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{PRIORITY_LABELS[opt]}</option>)}
              </select>
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-xs text-white/40 font-bold">Assignee</label>
              <select value={localAssignee} onChange={e => setLocalAssignee(e.target.value)} className="w-full bg-zinc-800 border-none rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500">
                <option value="">Unassigned</option>
                {staff.map(user => <option key={user.id} value={user.id}>{user.name || user.username}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <label className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition-colors flex items-center gap-2">
              <input type="file" className="hidden" onChange={async (e) => {
                if (e.target.files && e.target.files[0] && ticket) {
                   const file = e.target.files[0];
                   try {
                     setSaving(true);
                     await uploadAttachment(ticket.id, file);
                     console.log("Uploaded file:", file.name);
                     // You could trigger a fetch of attachments here
                   } catch (err) {
                     console.error("Upload failed", err);
                   } finally {
                     setSaving(false);
                   }
                }
              }} />
              Attach File
            </label>
            <button onClick={saveTicket} disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          <hr className="border-white/10" />
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-white/40 font-bold">Activity & Comments</h3>
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-indigo-400">{comment.authorName || comment.author?.name || 'System'}</span>
                    <span className="text-xs text-white/40">{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-white/80">{comment.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 bg-zinc-950 border-t border-white/10">
          <div className="flex gap-2">
            <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Type a comment..." className="flex-1 bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500/50 resize-none h-12" />
            <button onClick={postComment} disabled={loading || !newComment.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl disabled:opacity-50 flex items-center justify-center transition-colors">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;