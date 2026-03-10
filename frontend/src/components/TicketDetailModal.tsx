"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Ticket, Comment as TicketComment } from '../types';
import { X, Send, User, Clock, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const TicketDetailModal = ({ ticket, isOpen, onClose, onUpdate }: TicketDetailModalProps) => {
  const { token, user } = useAuth();
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && ticket) {
      fetchComments();
    }
  }, [isOpen, ticket]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/tickets/${ticket?.id}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error('Failed to fetch comments');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/tickets/${ticket?.id}/comments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        setNewComment('');
        fetchComments();
        setCommentSuccess(true);
        setTimeout(() => setCommentSuccess(false), 2000);
      }
    } catch (err) {
      alert('Error adding comment');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setStatusUpdating(true);
    try {
      await fetch(`http://localhost:4000/api/tickets/${ticket?.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus }),
      });
      onUpdate();
    } catch (err) {
      console.error('Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (!isOpen || !ticket) return null;

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="w-full max-w-2xl h-full bg-zinc-950 border-l border-white/10 relative flex flex-col animate-in slide-in-from-right duration-300">
        <header className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-4">
            <span className="text-white/20 font-mono text-xs">#{ticket.id}</span>
            <select
              value={ticket.status}
              disabled={statusUpdating}
              onChange={(e) => updateStatus(e.target.value)}
              className="bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md text-white focus:outline-none focus:border-indigo-500/50 disabled:opacity-60 cursor-pointer"
            >
              {['TODO','IN_PROGRESS','AWAITING_USER','RESOLVED','CLOSED'].map(s => (
                <option key={s} value={s}>{s.replace('_',' ')}</option>
              ))}
            </select>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-all">
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 leading-tight">{ticket.title}</h2>
            <div className="flex flex-wrap gap-6 text-[11px] text-white/40 uppercase tracking-widest font-bold">
              <div className="flex items-center gap-2">
                <User size={14} className="text-white/20" />
                <span>Assigned: <span className="text-white/60 ml-1">{ticket.assignedTo?.name || 'Unassigned'}</span></span>
              </div>
              {ticket.requesterName && (
                <div className="flex items-center gap-2">
                  <User size={14} className="text-white/20" />
                  <span>Requester: <span className="text-white/60 ml-1">{ticket.requesterName}</span></span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-white/20" />
                <span>Priority: <span className={`ml-1 ${
                  ticket.priority === 'URGENT' ? 'text-red-400' :
                  ticket.priority === 'HIGH' ? 'text-orange-400' :
                  'text-indigo-400'
                }`}>{ticket.priority}</span></span>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-12">
            <div className="text-[10px] uppercase font-bold tracking-widest text-white/20">Description</div>
            <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-sm leading-relaxed text-white/70">
              {ticket.description}
            </div>
          </div>

          <div className="space-y-6">
            <div className="text-[10px] uppercase font-bold tracking-widest text-white/20 flex items-center gap-2">
              <MessageSquare size={12} />
              <span>Comments ({comments.length})</span>
            </div>
            
            <div className="space-y-6">
              {comments?.map((comment: TicketComment) => (
                <div key={comment.id} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-indigo-400 shrink-0 border border-white/5">
                    {comment.author?.name?.[0] || 'A'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold text-white/80">{comment.author?.name || 'User'}</span>
                      <span className="text-[10px] text-white/20">{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-white/60 leading-relaxed">
                      {comment.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-zinc-900/50">
          <form onSubmit={handleAddComment} className="relative">
            <textarea 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 pb-12 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors resize-none custom-scrollbar"
              rows={3}
            ></textarea>
            <div className="absolute right-3 bottom-3 flex items-center gap-3">
              {commentSuccess && (
                <span className="text-[10px] text-green-400 flex items-center gap-1 font-bold">
                  <CheckCircle size={12} /> Added
                </span>
              )}
              <button 
                type="submit"
                disabled={loading || !newComment.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white p-2 rounded-lg transition-all"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;
