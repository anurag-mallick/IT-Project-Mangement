"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { TicketStatus, Priority, User } from '../types';
import { uploadAttachment } from '@/lib/storage';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// P0 = Critical (highest), P1 = High, P2 = Normal (default), P3 = Low
const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'P0', label: 'P0 – Critical' },
  { value: 'P1', label: 'P1 – High' },
  { value: 'P2', label: 'P2 – Normal' },
  { value: 'P3', label: 'P3 – Low' },
];

const NewTicketModal = ({ isOpen, onClose, onSuccess }: NewTicketModalProps) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [staff, setStaff] = useState<User[]>([]);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    priority: Priority;
    status: TicketStatus;
    assignedToId: string;
    tags: string;
    dueDate?: string;
  }>({
    title: '',
    description: '',
    priority: 'P2',
    status: 'TODO',
    assignedToId: '',
    tags: '',
    dueDate: '',
  });

  useEffect(() => {
    if (isOpen) {
      setError('');
      setAttachment(null);
      setFormData({ title: '', description: '', priority: 'P2', status: 'TODO', assignedToId: '', tags: '', dueDate: '' });
      fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : [])
        .then(data => setStaff(Array.isArray(data) ? data.filter((u: User) => u.isActive) : []))
        .catch(() => setStaff([]));
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body: any = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: formData.status,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      if (formData.assignedToId) body.assignedToId = parseInt(formData.assignedToId);
      if (formData.dueDate) body.dueDate = new Date(formData.dueDate).toISOString();

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const newTicket = await res.json();
        
        // Upload attachment if present
        if (attachment) {
          try {
            await uploadAttachment(newTicket.id, attachment);
          } catch (uploadErr) {
            console.error("Failed to upload attachment during creation", uploadErr);
          }
        }
        
        onSuccess();
        onClose();
        return;
      }

      // Try to parse JSON error
      try {
        const data = await res.json();
        setError(data.error || `Server error (${res.status})`);
      } catch {
        setError(`Connection error (${res.status}): ${res.statusText}`);
      }
    } catch (err: any) {
      setError(`Network error: ${err.message || 'Check your connection'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-card w-full max-w-xl relative p-8 animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute right-6 top-6 text-white/40 hover:text-white transition-colors">
          <X size={20} />
        </button>
        
        <h2 className="text-2xl font-bold mb-1">Create New Ticket</h2>
        <p className="text-white/30 text-xs mb-6">Fill in the details below to create a new IT ticket.</p>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1 block">Title *</label>
            <input 
              required
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Brief summary of the issue"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1 block">Priority</label>
              <select 
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value as Priority})}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
              >
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1 block">Initial Status</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as TicketStatus})}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1 block">Assign To</label>
            <select 
              value={formData.assignedToId}
              onChange={(e) => setFormData({...formData, assignedToId: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
            >
              <option value="">Unassigned</option>
              {staff.map(u => (
                <option key={u.id} value={u.id}>{u.name || u.username} ({u.role})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1 block">Tags (comma-separated)</label>
            <input 
              type="text" 
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              placeholder="e.g. bug, network, hardware"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1 block">Due Date</label>
            <input 
              type="date" 
              value={formData.dueDate}
              onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors [color-scheme:dark]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1 block">Description (Markdown Supported) *</label>
            <textarea 
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the problem or task in detail..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1 block">Attachment (Optional)</label>
            <label className="flex items-center gap-2 cursor-pointer w-full bg-white/5 border border-white/10 border-dashed rounded-lg px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              <Upload size={16} />
              {attachment ? attachment.name : 'Click to select a file'}
              <input 
                type="file" 
                className="hidden" 
                onChange={e => setAttachment(e.target.files ? e.target.files[0] : null)}
              />
            </label>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Creating...' : 'Create Ticket'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewTicketModal;
