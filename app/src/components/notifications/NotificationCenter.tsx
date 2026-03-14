"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Info, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'new_ticket';
  timestamp: Date;
  read: boolean;
}

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const supabase = createClient();

  const addNotification = React.useCallback((notif: Notification) => {
    setNotifications(prev => [notif, ...prev]);
    // Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notif.title, { body: notif.message });
    }
  }, []);

  useEffect(() => {
    // Generate a few mock notifications on mount for demo
    setNotifications([
      {
        id: '1',
        title: 'SLA Breach Risk',
        message: 'Ticket #1024 is approaching SLA deadline (15 mins remaining)',
        type: 'warning',
        timestamp: new Date(),
        read: false
      },
      {
        id: '2',
        title: 'New Assignment',
        message: 'You have been assigned to "Server Connectivity Issues"',
        type: 'new_ticket',
        timestamp: subMinutes(new Date(), 30),
        read: false
      }
    ]);

    // Real-time subscription for important events
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Ticket' }, (payload) => {
        const newTicket = payload.new as any;
        addNotification({
          id: Math.random().toString(),
          title: 'New Ticket Created',
          message: `Ticket #${newTicket.id}: ${newTicket.title}`,
          type: 'new_ticket',
          timestamp: new Date(),
          read: false
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, addNotification]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-white/5 rounded-full transition-colors relative"
      >
        <Bell size={18} className={unreadCount > 0 ? "text-indigo-400" : "text-white/60"} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full border border-black" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-full w-[400px] bg-zinc-950 border-l border-white/5 shadow-2xl z-[101] flex flex-col"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Notifications</h2>
                  <p className="text-xs text-white/40">Keep track of important events</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                {notifications.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                    < Bell size={48} className="mb-4" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`p-4 rounded-xl border transition-all ${n.read ? 'bg-transparent border-white/5 opacity-60' : 'bg-white/5 border-indigo-400/20'}`}>
                      <div className="flex gap-4">
                        <div className="mt-1">
                          {n.type === 'warning' && <AlertTriangle size={16} className="text-orange-400" />}
                          {n.type === 'success' && <CheckCircle size={16} className="text-green-400" />}
                          {n.type === 'new_ticket' && <Package size={16} className="text-indigo-400" />}
                          {n.type === 'info' && <Info size={16} className="text-blue-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{n.title}</p>
                          <p className="text-xs text-white/50 mt-1 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-white/20 mt-2 font-mono">{format(n.timestamp, 'HH:mm:ss')}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-6 border-t border-white/5">
                  <button 
                    onClick={markAllRead}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-all"
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Simple helper local copy to avoid extra import lines
function subMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() - minutes * 60000);
}

export default NotificationCenter;
