"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from '@/lib/supabase';
import TaskCard from "./TaskCard";
import TicketDetailModal from "@/components/TicketDetailModal";
import { Ticket, TicketStatus } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2 } from "lucide-react";

const KanbanBoard = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const stages: { id: TicketStatus; name: string }[] = [
    { id: "TODO", name: "To Do" },
    { id: "IN_PROGRESS", name: "In Progress" },
    { id: "AWAITING_USER", name: "Awaiting User" },
    { id: "RESOLVED", name: "Resolved" },
    { id: "CLOSED", name: "Closed" },
  ];

  useEffect(() => {
    fetchTickets();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("ticket-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Ticket" },
        (payload: any) => {
          console.log("Realtime change received:", payload);
          if (payload.eventType === "INSERT") {
            setTickets((prev) => [payload.new as Ticket, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setTickets((prev) =>
              prev.map((t) =>
                t.id === (payload.new as Ticket).id
                  ? (payload.new as Ticket)
                  : t,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setTickets((prev) =>
              prev.filter((t) => t.id === (payload.old as Ticket).id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token]);

  const fetchTickets = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tickets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch tickets");
      const data = await res.json();
      setTickets(data);
    } catch (err: any) {
      setError(err.message || "Connection error");
      console.error("Audit Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const moveTicket = async (ticketId: number, newStatus: TicketStatus) => {
    // Optimistic Update
    const originalTickets = [...tickets];
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)),
    );

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to move ticket");
    } catch (err: any) {
      setTickets(originalTickets); // Revert
      setError(err.message);
    }
  };

  return (
    <div className="flex h-full w-full overflow-x-auto gap-4 p-4 pb-8">
      {stages.map((stage) => (
        <div
          key={stage.id}
          className="min-w-[320px] w-[320px] flex-shrink-0 flex flex-col glass-card custom-scrollbar"
        >
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-sm">{stage.name}</h3>
            <span className="bg-white/10 text-xs px-2 py-1 rounded-md">
              {tickets.filter((t) => t.status === stage.id).length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar min-h-[200px]">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin text-white/20" />
              </div>
            ) : (
              tickets
                .filter((t) => t.status === stage.id)
                .map((ticket) => (
                  <TaskCard
                    key={ticket.id}
                    ticket={ticket}
                    onClick={() => setSelectedTicket(ticket)}
                    onMove={(newStatus: TicketStatus) =>
                      moveTicket(ticket.id, newStatus)
                    }
                  />
                ))
            )}
          </div>
        </div>
      ))}

      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onUpdate={fetchTickets}
      />
    </div>
  );
};

export default KanbanBoard;
