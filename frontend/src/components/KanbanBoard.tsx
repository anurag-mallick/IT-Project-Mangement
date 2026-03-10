"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import TaskCard from './TaskCard';
import TicketDetailModal from '@/components/TicketDetailModal';
import { Ticket, TicketStatus } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';

const KanbanBoard = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const stages: { id: TicketStatus; name: string }[] = [
    { id: 'TODO', name: 'To Do' },
    { id: 'IN_PROGRESS', name: 'In Progress' },
    { id: 'AWAITING_USER', name: 'Awaiting User' },
    { id: 'RESOLVED', name: 'Resolved' },
    { id: 'CLOSED', name: 'Closed' }
  ];

  useEffect(() => {
    fetchTickets();
  }, [token]);

  const fetchTickets = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(${process.env.NEXT_PUBLIC_API_URL}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch tickets');
      const data = await res.json();
      setTickets(data);
    } catch (err: any) {
      setError(err.message || 'Connection error');
      console.error('Audit Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const moveTicket = async (ticketId: number, newStatus: TicketStatus) => {
    // Optimistic Update
    const originalTickets = [...tickets];
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}