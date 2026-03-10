"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Ticket, Comment as TicketComment, User, Priority } from '../types';
import { X, Send, User as UserIcon, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

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

const PRIORITY_COLORS: Record<string, string> = {
  P0: 'text-red-400',
  P1: 'text-orange-400',
  P2: 'text-indigo-400',
  P3: 'text-zinc-400',
};

const TicketDetailModal = ({ ticket, isOpen, onClose, onUpdate }: TicketDetailModalProps) => {
  const { token } = useAuth();
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  // Local editable state
  const [localStatus, setLocalStatus] = useState('');
  const [localPriority, setLocalPriority] = useState<Priority>('P2');
  const [localAssignee, setLocalAssignee] = useState<string>('');

  useEffect(() => {
    if (isOpen && ticket) {
      setLocalStatus(ticket.status);
      setLocalPriority(ticket.priority);
      setLocalAssignee(ticket.assignedToId ? String(ticket.assignedToId) : '');
      fetchComments();
      fetchStaff();
    }
  }, [isOpen, ticket]);

  const fetchComments = async () => {
    if (!ticket) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}