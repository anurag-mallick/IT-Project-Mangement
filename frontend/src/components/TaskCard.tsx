"use client";
import React from 'react';
import { MessageSquare, CheckSquare, Clock } from 'lucide-react';
import { Ticket, Task } from '@/types';

interface TaskCardProps {
  ticket: Ticket;
  onDragStart: (e: React.DragEvent) => void;
}

const priorityConfig: Record<string, { bg: string; text: string; label: string }> = {
  P0: { bg: 'bg-red-500/20',    text: 'text-red-400',    label: 'P0 – Critical' },
  P1: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'P1 – High' },
  P2: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', label: 'P2 – Normal' },
  P3: { bg: 'bg-zinc-500/20',   text: 'text-zinc-400',   label: 'P3 – Low' },
};

const TaskCard = ({ ticket, onDragStart }: TaskCardProps) => {
  const priority = priorityConfig[ticket.priority] ?? priorityConfig.P2;
  const completedTasks = ticket.tasks?.filter((t: Task) => t.status === 'DONE').length ?? 0;
  const totalTasks = ticket.tasks?.length ?? 0;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="bg-zinc-900 border border-white/5 rounded-xl p-4 shadow-sm hover:shadow-xl hover:border-indigo-500/30 transition-all cursor-grab active:cursor-grabbing group"
    >
      {/* Priority & ID */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-black tracking-tighter uppercase px-1.5 py-0.5 rounded ${priority.bg} ${priority.text}`}>
            {ticket.priority}
          </span>
          <span className="text-[9px] text-white/20 font-mono">#{ticket.id}</span>
        </div>
        {ticket.assignedTo && (
          <div className="w-5 h-5 rounded-full bg-linear-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-[8px] font-bold border border-zinc-900" title={ticket.assignedTo.name}>
            {ticket.assignedTo.name[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* Title */}
      <h4 className="text-xs font-semibold text-white/90 leading-relaxed mb-3 group-hover:text-white transition-colors line-clamp-2">
        {ticket.title}
      </h4>

      {/* Footer */}
      <div className="pt-3 border-t border-white/5 flex items-center gap-4 text-white/20">
        {(ticket.comments?.length ?? 0) > 0 && (
          <div className="flex items-center gap-1">
            <MessageSquare size={11} />
            <span className="text-[10px]">{ticket.comments!.length}</span>
          </div>
        )}
        {totalTasks > 0 && (
          <div className="flex items-center gap-1">
            <CheckSquare size={11} />
            <span className="text-[10px]">{completedTasks}/{totalTasks}</span>
          </div>
        )}
        {ticket.slaBreachAt && new Date(ticket.slaBreachAt) < new Date() && (
          <div className="flex items-center gap-1 text-red-400/70">
            <Clock size={11} />
            <span className="text-[10px]">SLA</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
