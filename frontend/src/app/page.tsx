"use client";
import React, { useState, useRef } from 'react';
import KanbanBoard from '@/components/KanbanBoard';
import ListBoard from '@/components/ListBoard';
import ReportsView from '@/components/ReportsView';
import Sidebar from '@/components/DashboardSidebar';
import AuthGuard from '@/components/AuthGuard';
import NavHeader from '@/components/NavHeader';
import NewTicketModal from '@/components/NewTicketModal';

const Dashboard = () => {
  const [activeView, setActiveView] = useState<'kanban' | 'list' | 'reports'>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const handleTicketCreated = () => setRefreshKey(k => k + 1);

  return (
    <AuthGuard>
      <div className="flex bg-zinc-950 min-h-screen text-white overflow-hidden">
        <Sidebar 
          activeView={activeView} 
          setActiveView={setActiveView} 
          onNewTicket={() => setIsModalOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto flex flex-col">
          <NavHeader activeView={activeView} setActiveView={setActiveView} />
          
          <div className="p-8 max-w-7xl mx-auto w-full">
            {activeView === 'kanban' && <KanbanBoard key={refreshKey} />}
            {activeView === 'list' && <ListBoard key={refreshKey} />}
            {activeView === 'reports' && <ReportsView />}
          </div>
        </main>
      </div>

      <NewTicketModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleTicketCreated} 
      />
    </AuthGuard>
  );
};

export default Dashboard;
