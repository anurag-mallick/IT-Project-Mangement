"use client";
import React, { useState, useEffect } from "react";
import { createClient } from '@/lib/supabase/client';
import TaskCard from "./TaskCard";
import TicketDetailModal from "@/components/TicketDetailModal";
import { Ticket, TicketStatus, User } from "@/types";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Loader2 } from "lucide-react";

interface KanbanProps {
  searchQuery?: string;
  users?: User[];
  assets?: any[];
}

const KanbanBoard = ({ searchQuery = "", users, assets }: KanbanProps) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<{ id: number; title: string; order: number }[]>([]);
  const supabase = createClient();

  const fetchColumns = async () => {
    try {
      const res = await fetch("/api/kanban-columns");
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setColumns(data);
        } else {
          setColumns([
            { id: 1, title: 'TODO', order: 10 },
            { id: 2, title: 'IN_PROGRESS', order: 20 },
            { id: 3, title: 'AWAITING_USER', order: 30 },
            { id: 4, title: 'RESOLVED', order: 40 },
            { id: 5, title: 'CLOSED', order: 50 },
          ]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch columns", err);
    }
  };

  const fetchTickets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tickets/kanban");
      if (!res.ok) throw new Error("Failed to fetch tickets");
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err: any) {
      setError(err.message || "Connection error");
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchColumns();

    const channel = supabase
      .channel("ticket-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Ticket" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTickets((prev) => [payload.new as Ticket, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setTickets((prev) =>
              prev.map((t) =>
                t.id === (payload.new as Ticket).id
                  ? { ...t, ...(payload.new as Ticket) }
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
  }, [supabase]);

  const moveTicket = async (ticketId: number, newStatus: TicketStatus) => {
    const originalTickets = [...tickets];
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)),
    );

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to move ticket");
    } catch (err: any) {
      setTickets(originalTickets);
      setError(err.message);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const ticketId = parseInt(draggableId);
    if (isNaN(ticketId)) return;
    
    const newStatus = destination.droppableId;
    moveTicket(ticketId, newStatus as TicketStatus);
  };

  const filteredTickets = tickets.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.requesterName?.toLowerCase().includes(q) ||
      t.id.toString().includes(q)
    );
  });

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-full w-full overflow-x-auto gap-4 p-4 pb-8">
        {columns.map((col) => (
          <div
            key={col.id}
            className="min-w-[320px] w-[320px] flex-shrink-0 flex flex-col glass-card custom-scrollbar"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-sm">{col.title}</h3>
              <span className="bg-white/10 text-xs px-2 py-1 rounded-md">
                {filteredTickets.filter((t) => t.status === col.title).length}
              </span>
            </div>

            <Droppable droppableId={col.title}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar min-h-[200px]"
                >
                  {isLoading ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="w-5 h-5 animate-spin text-white/20" />
                    </div>
                  ) : (
                    filteredTickets
                      .filter((t) => t.status === col.title)
                      .map((ticket, index) => (
                        <Draggable key={ticket.id} draggableId={ticket.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.8 : 1,
                              }}
                            >
                              <TaskCard
                                ticket={ticket}
                                onClick={() => setSelectedTicket(ticket)}
                                onMove={(newStatus: TicketStatus) =>
                                  moveTicket(ticket.id, newStatus)
                                }
                              />
                            </div>
                          )}
                        </Draggable>
                      ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}

        <TicketDetailModal
          ticket={selectedTicket}
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={fetchTickets}
          users={users}
          assets={assets}
        />
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
