"use client";
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutGrid, List, BarChart, Users, LogOut,
  ChevronDown, ChevronRight, Shield, Database, 
  Plus, ExternalLink, Calendar, Github, Linkedin, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: 'kanban' | 'list' | 'reports' | 'calendar') => void;
  onNewTicket: () => void;
}

const Sidebar = ({ activeView, setActiveView, onNewTicket }: SidebarProps) => {
  const { user, logout } = useAuth();
  const [spacesOpen, setSpacesOpen] = useState(true);

  const navItems = [
    { id: 'kanban', label: 'Board', icon: LayoutGrid },
    { id: 'list',   label: 'List',  icon: List },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'reports',label: 'Reports', icon: BarChart },
  ];

  return (
    <aside className="w-[260px] bg-zinc-950/60 border-r border-white/5 flex flex-col h-screen backdrop-blur-3xl shrink-0">
      {/* Workspace Header - Rebranded to Horizon IT */}
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Cpu size={16} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black leading-none tracking-tighter">HORIZON<span className="text-blue-500">IT</span></span>
            <span className="text-[10px] text-white/30 mt-1 uppercase tracking-tighter font-bold">Workspace</span>
          </div>
        </div>
        <ChevronDown size={12} className="text-white/20" />
      </div>

      {/* New Ticket CTA */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={onNewTicket}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
        >
          <Plus size={15} />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Views Navigation */}
      <div className="px-2 pt-2 space-y-0.5">
        <p className="px-3 text-[9px] uppercase tracking-widest font-bold text-white/20 mb-1">Perspective</p>
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveView(id as 'kanban' | 'list' | 'reports' | 'calendar')}
            className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeView === id
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-inner shadow-blue-500/5'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Quick Links */}
      <div className="px-2 mt-4 space-y-0.5">
        <p className="px-3 text-[9px] uppercase tracking-widest font-bold text-white/20 mb-1">Inventory</p>
        <a
          href="/assets"
          className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all`}
        >
          <Database size={14} className="text-blue-400" />
          <span>Asset Inventory</span>
        </a>
        <a
          href="/submit"
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all"
        >
          <ExternalLink size={14} className="text-emerald-500" />
          <span>Public Portal</span>
        </a>
        {user?.role === 'ADMIN' && (
          <a
            href="/admin/users"
            className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all"
          >
            <Users size={14} className="text-purple-400" />
            <span>User Management</span>
          </a>
        )}
      </div>

      {/* Spaces Hierarchy */}
      <div className="px-2 mt-4 flex-1 overflow-y-auto">
        <button
          onClick={() => setSpacesOpen(!spacesOpen)}
          className="w-full flex items-center gap-2 px-3 py-1 text-[9px] uppercase tracking-widest font-bold text-white/20 hover:text-white/60 transition-colors"
        >
          {spacesOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          <span>Departments</span>
        </button>

        <AnimatePresence initial={false}>
          {spacesOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-1 space-y-0.5"
            >
              {[
                { id: 'it',     name: 'IT Support',    color: 'bg-blue-500', icon: Shield,   view: 'kanban' },
                { id: 'infra',  name: 'Infrastructure', color: 'bg-emerald-500',icon: Database, view: 'list' },
                { id: 'sec',    name: 'Cyber Security', color: 'bg-indigo-500', icon: Shield,   view: 'kanban' },
              ].map(space => (
                <button
                  key={space.id}
                  onClick={() => setActiveView(space.view as 'kanban' | 'list' | 'reports' | 'calendar')}
                  className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
                    activeView === space.view ? 'text-white bg-white/5' : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ChevronRight size={10} className="text-white/20" />
                  <div className={`w-2 h-2 rounded-sm ${space.color}`} />
                  <span>{space.name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Development Branding & User Links */}
      <div className="px-4 py-4 flex flex-col items-center gap-4 bg-white/[0.02]">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 text-center">Developed by <br/> Anurag Mallick</span>
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/anurag-mallick" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white transition-all transform hover:scale-110"
              title="GitHub"
            >
              <Github size={14} />
            </a>
            <a 
              href="https://linkedin.com/in/anurag-mallick" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/40 hover:text-blue-400 transition-all transform hover:scale-110"
              title="LinkedIn"
            >
              <Linkedin size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Footer Profile */}
      <div className="p-3 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-[10px] text-blue-400">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold leading-tight">{user?.name || user?.username}</span>
            <span className="text-[9px] text-white/30 uppercase tracking-tighter">{user?.role}</span>
          </div>
        </div>
        <button onClick={logout} className="text-white/20 hover:text-red-400 transition-colors p-1.5 rounded hover:bg-white/5">
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
