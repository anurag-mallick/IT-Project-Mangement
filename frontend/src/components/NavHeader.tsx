"use client";
import React from 'react';
import { ChevronRight, Share2, Star, MoreHorizontal, LayoutGrid, List, BarChart, Calendar, Settings } from 'lucide-react';
import Link from 'next/link';

interface BreadcrumbsProps {
  activeView: string;
  setActiveView: (view: 'kanban' | 'list' | 'reports' | 'calendar') => void;
}

const NavHeader = ({ activeView, setActiveView }: BreadcrumbsProps) => {
  return (
    <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-zinc-950/20 backdrop-blur-sm sticky top-0 z-40">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-white/40 hover:text-white cursor-pointer transition-colors">Spaces</span>
        <ChevronRight size={14} className="text-white/20" />
        <span className="text-white/40 hover:text-white cursor-pointer transition-colors">IT Operations</span>
        <ChevronRight size={14} className="text-white/20" />
        <div className="flex items-center gap-2 font-bold px-2 py-1 rounded bg-white/5">
          <LayoutGrid size={14} className="text-indigo-400" />
          <span>Ticket Board</span>
        </div>
        <Star size={14} className="text-white/20 hover:text-yellow-500 cursor-pointer transition-colors ml-2" />
      </div>

      {/* View Switcher & Actions */}
      <div className="flex items-center gap-6">
        <div className="flex items-center bg-white/5 p-1 rounded-md border border-white/5">
          <button 
            onClick={() => setActiveView('kanban')}
            className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium transition-all ${activeView === 'kanban' ? 'bg-zinc-800 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            <LayoutGrid size={12} />
            Board
          </button>
          <button 
            onClick={() => setActiveView('list')}
            className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium transition-all ${activeView === 'list' ? 'bg-zinc-800 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            <List size={12} />
            List
          </button>
          <button 
            onClick={() => setActiveView('reports')}
            className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium transition-all ${activeView === 'reports' ? 'bg-zinc-800 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            <BarChart size={12} />
            Reports
          </button>
          <button 
            onClick={() => setActiveView('calendar')}
            className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium transition-all ${activeView === 'calendar' ? 'bg-zinc-800 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            <Calendar size={12} />
            Calendar
          </button>
        </div>

        <div className="flex items-center gap-3 border-l border-white/10 pl-6 text-white/40">
          <Share2 size={16} className="hover:text-white cursor-pointer" />
          <MoreHorizontal size={18} className="hover:text-white cursor-pointer" />
          <Link 
            href="/settings"
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-all active:scale-[0.98]"
          >
            <Settings size={14} />
            Settings
          </Link>
        </div>
      </div>
    </header>
  );
};

export default NavHeader;
