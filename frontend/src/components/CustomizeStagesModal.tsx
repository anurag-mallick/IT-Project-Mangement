"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Plus, Trash, GripVertical, AlertCircle, CheckCircle } from 'lucide-react';

interface KanbanColumn {
  id: number;
  title: string;
  order: number;
}

interface CustomizeStagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const CustomizeStagesModal = ({ isOpen, onClose, onUpdate }: CustomizeStagesModalProps) => {
  const { token } = useAuth();
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [newStageName, setNewStageName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchColumns();
    }
  }, [isOpen, token]);

  const fetchColumns = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/kanban-columns", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setColumns(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addStage = async () => {
    if (!newStageName.trim()) return;
    setLoading(true);
    setError('');
    const newOrder = columns.length > 0 ? Math.max(...columns.map(c => c.order)) + 10 : 10;
    try {
      const res = await fetch("/api/kanban-columns", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title: newStageName.trim().toUpperCase().replace(/ /g, '_'), order: newOrder })
      });
      if (res.ok) {
        setNewStageName('');
        await fetchColumns();
        onUpdate();
      } else {
        const body = await res.json();
        setError(body.error || "Failed to add stage");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteStage = async (id: number) => {
    if (!confirm("Are you sure? Tickets in this stage might lose their stage reference.")) return;
    try {
      const res = await fetch(`/api/kanban-columns/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchColumns();
        onUpdate();
      } else {
        const body = await res.json();
        setError(body.error || "Failed to delete stage");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const newCols = [...columns];
    // Swap order values
    const temp = newCols[index].order;
    newCols[index].order = newCols[index - 1].order;
    newCols[index - 1].order = temp;
    
    // re-sort based on order
    newCols.sort((a,b) => a.order - b.order);
    setColumns(newCols);
    saveOrder(newCols);
  };

  const moveDown = async (index: number) => {
    if (index === columns.length - 1) return;
    const newCols = [...columns];
    // Swap order values
    const temp = newCols[index].order;
    newCols[index].order = newCols[index + 1].order;
    newCols[index + 1].order = temp;
    
    // re-sort based on order
    newCols.sort((a,b) => a.order - b.order);
    setColumns(newCols);
    saveOrder(newCols);
  };

  const saveOrder = async (cols: KanbanColumn[]) => {
    try {
      await fetch("/api/kanban-columns", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ columns: cols })
      });
      onUpdate();
    } catch (err) {
      console.error("Order save failed:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-card w-full max-w-md relative p-8 animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute right-6 top-6 text-white/40 hover:text-white transition-colors">
          <X size={20} />
        </button>
        
        <h2 className="text-2xl font-bold mb-1">Customize Stages</h2>
        <p className="text-white/30 text-xs mb-6">Add, remove, or reorder your Kanban board stages.</p>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar mb-6">
          {columns.length === 0 && <p className="text-sm text-white/40 italic text-center py-4">No custom stages found.</p>}
          {columns.map((col, idx) => (
            <div key={col.id} className="flex items-center justify-between bg-white/5 border border-white/5 p-3 rounded-lg group">
              <span className="font-bold text-sm tracking-wide">{col.title}</span>
              <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => moveUp(idx)} 
                  disabled={idx === 0} 
                  className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
                >
                  ↑
                </button>
                <button 
                  onClick={() => moveDown(idx)} 
                  disabled={idx === columns.length - 1} 
                  className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
                >
                  ↓
                </button>
                <button 
                  onClick={() => deleteStage(col.id)} 
                  className="p-1 hover:bg-red-500/20 text-red-400 rounded"
                >
                  <Trash size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input 
            type="text"
            value={newStageName}
            onChange={e => setNewStageName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addStage()}
            placeholder="New Stage Name"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500/50"
          />
          <button 
            onClick={addStage}
            disabled={loading || !newStageName.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizeStagesModal;
