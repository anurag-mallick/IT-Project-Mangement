"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Ticket, Comment as TicketComment, User, Priority, ChecklistItem } from '../types';
import { X, Send, User as UserIcon, AlertCircle, CheckCircle, Loader2, Server, Cpu } from 'lucide-react';
import { uploadAttachment } from '@/lib/storage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

const TicketDetailModal = ({ ticket, isOpen, onClose, onUpdate }: TicketDetailModalProps) => {
  const { user, signOut } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [comments, setComments] = useState<TicketComment[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Local editable state
  const [localStatus, setLocalStatus] = useState('');
  const [localPriority, setLocalPriority] = useState<Priority>('P2');
  const [localAssignee, setLocalAssignee] = useState<string>('');
  const [localTags, setLocalTags] = useState<string>('');
  const [localDueDate, setLocalDueDate] = useState<string>('');
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [localAsset, setLocalAsset] = useState<string>('');

  const fetchComments = useCallback(async () => {
    if (!ticket) return;
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/comments`);
      if (res.ok) setComments(await res.json());
    } catch (e) {
      console.error(e);
    }
  }, [ticket]);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) setStaff(await res.json());
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchAssets = useCallback(async () => {
    try {
      const res = await fetch('/api/assets');
      if (res.ok) setAssets(await res.json());
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (isOpen && ticket) {
      setLocalStatus(ticket.status);
      setLocalPriority(ticket.priority);
      setLocalAssignee(ticket.assignedToId ? String(ticket.assignedToId) : '');
      setLocalTags(ticket.tags ? ticket.tags.join(', ') : '');
      setLocalDueDate(ticket.dueDate ? new Date(ticket.dueDate).toISOString().split('T')[0] : '');
      setLocalAsset(ticket.assetId ? String(ticket.assetId) : '');
      setChecklists(ticket.checklists || []);
      fetchComments();
      fetchStaff();
      fetchAssets();
    }
  }, [isOpen, ticket, fetchComments, fetchStaff, fetchAssets]);

  const saveTicket = async () => {
    if (!ticket) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: localStatus,
          priority: localPriority,
          assignedToId: localAssignee ? parseInt(localAssignee) : null,
          assetId: localAsset ? parseInt(localAsset) : null,
          tags: localTags.split(',').map(t => t.trim()).filter(Boolean),
          dueDate: localDueDate || null
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

  const triageTicket = async () => {
    if (!ticket) return;
    setSaving(true);
    try {
      const res = await fetch('/api/tickets/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: ticket.title, description: ticket.description })
      });
      if (res.ok) {
        const result = await res.json();
        setLocalPriority(result.priority);
        setLocalAssignee(result.assignedToId ? String(result.assignedToId) : '');
        alert(`Triage Suggestion: ${result.reason}\nRecommended Assignee: ${result.assignedToName}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const addChecklistItem = async () => {
    if (!newChecklistTitle.trim() || !ticket) return;
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/checklists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newChecklistTitle })
      });
      if (res.ok) {
        const item = await res.json();
        setChecklists([...checklists, item]);
        setNewChecklistTitle('');
        onUpdate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleChecklist = async (id: number, isCompleted: boolean) => {
    try {
      setChecklists(checklists.map(c => c.id === id ? { ...c, isCompleted } : c));
      const res = await fetch(`/api/checklists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted })
      });
      if (res.ok) onUpdate();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteChecklist = async (id: number) => {
    try {
      setChecklists(checklists.filter(c => c.id !== id));
      const res = await fetch(`/api/checklists/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) onUpdate();
    } catch (e) {
      console.error(e);
    }
  };

  const postComment = async () => {
    if (!newComment.trim() || !ticket) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      });
      if (res.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const deleteTicket = async () => {
    if (!ticket || !window.confirm("Are you sure you want to delete this ticket?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, { method: 'DELETE' });
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

  if (!isOpen || !ticket) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-zinc-900 border-l border-white/10 h-full flex flex-col shadow-2xl">
        <div className="p-6 border-b border-white/10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <h2 className="text-xl font-bold">{ticket.title}</h2>
               <button 
                  onClick={triageTicket}
                  disabled={saving}
                  className="px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 transition-all"
               >
                  <Cpu size={10} /> Magic Triage
               </button>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
              <span>Ticket #{ticket.id}</span>
              {ticket.slaBreachAt && (
                <span className={`px-2 py-0.5 rounded font-medium ${new Date(ticket.slaBreachAt) < new Date() ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                  SLA: {new Date(ticket.slaBreachAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-white/40 font-bold">Description</h3>
            <div className="text-sm text-white/80 prose prose-invert prose-indigo max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{ticket.description}</ReactMarkdown>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 p-4 bg-white/5 rounded-xl border border-white/5">
            <div className="space-y-2">
              <label className="text-xs text-white/40 font-bold">Status</label>
              <select value={localStatus} onChange={e => setLocalStatus(e.target.value)} className="w-full bg-zinc-800 border-none rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 text-white">
                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/40 font-bold">Priority</label>
              <select value={localPriority} onChange={e => setLocalPriority(e.target.value as Priority)} className="w-full bg-zinc-800 border-none rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 text-white">
                {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{PRIORITY_LABELS[opt]}</option>)}
              </select>
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-xs text-white/40 font-bold">Assignee</label>
              <select value={localAssignee} onChange={e => setLocalAssignee(e.target.value)} className="w-full bg-zinc-800 border-none rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 text-white">
                <option value="">Unassigned</option>
                {staff.map(u => <option key={u.id} value={u.id}>{u.name || u.username}</option>)}
              </select>
            </div>
            
            <div className="space-y-2 col-span-2">
              <label className="text-xs text-white/40 font-bold">Tags (comma-separated)</label>
              <input type="text" value={localTags} onChange={e => setLocalTags(e.target.value)} placeholder="e.g. frontend, bug, urgent" className="w-full bg-zinc-800 border-none rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 text-white" />
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-xs text-white/40 font-bold">Due Date</label>
              <input type="date" value={localDueDate} onChange={e => setLocalDueDate(e.target.value)} className="w-full bg-zinc-800 border-none rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 text-white [color-scheme:dark]" />
            </div>

            <div className="space-y-3 col-span-2 pt-4 border-t border-white/5 mt-2 bg-indigo-950/20 p-4 -mx-4 border-y border-indigo-500/10">
              <h4 className="text-xs text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-2">
                <Server className="w-4 h-4" /> Linked IT Asset
              </h4>
              <select value={localAsset} onChange={e => setLocalAsset(e.target.value)} className="w-full bg-indigo-950/50 border border-indigo-500/20 text-indigo-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500">
                <option value="">No Asset Linked</option>
                {assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name} ({asset.type})</option>)}
              </select>
            </div>

            <div className="space-y-3 col-span-2 pt-4 border-t border-white/5 mt-2">
              <h4 className="text-xs text-white/40 font-bold uppercase tracking-widest">Checklist</h4>
              <div className="space-y-2">
                {checklists.map(item => (
                  <div key={item.id} className="flex items-center gap-3 bg-zinc-800/50 p-2 rounded-lg group">
                    <input type="checkbox" checked={item.isCompleted} onChange={(e) => toggleChecklist(item.id, e.target.checked)} className="rounded border-none/10 bg-zinc-700 text-indigo-500 w-4 h-4 cursor-pointer focus:ring-0" />
                    <span className={`flex-1 text-sm ${item.isCompleted ? 'text-white/40 line-through' : 'text-white/80'}`}>{item.title}</span>
                    <button onClick={() => deleteChecklist(item.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-red-400 rounded transition-all"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={newChecklistTitle} onChange={e => setNewChecklistTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addChecklistItem()} placeholder="Add item..." className="flex-1 bg-zinc-800 border-none rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 text-white" />
                <button onClick={addChecklistItem} disabled={!newChecklistTitle.trim()} className="bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-2 rounded-md text-sm font-bold disabled:opacity-50 transition-colors">Add</button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <label className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition-colors flex items-center gap-2">
              <input type="file" className="hidden" onChange={async (e) => {
                if (e.target.files && e.target.files[0] && ticket) {
                   setSaving(true);
                   await uploadAttachment(ticket.id, e.target.files[0]);
                   setSaving(false);
                }
              }} />
              Attach File
            </label>
            {isAdmin && (
              <button 
                onClick={deleteTicket} 
                className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-4 py-2 rounded-lg text-sm font-bold transition-all mr-auto"
              >
                Delete Ticket
              </button>
            )}
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
                  <div className="text-sm text-white/80 prose prose-invert prose-p:leading-snug prose-a:text-indigo-400 prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 bg-zinc-950 border-t border-white/10">
          <div className="flex gap-2">
            <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Type a comment..." className="flex-1 bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500/50 resize-none h-12 text-white" />
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