export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export interface ChecklistItem {
  id: number;
  title: string;
  isCompleted: boolean;
  ticketId: number;
  createdAt: string;
  updatedAt: string;
}

export type TicketStatus = 'TODO' | 'IN_PROGRESS' | 'AWAITING_USER' | 'RESOLVED' | 'CLOSED';
export type UserRole = 'ADMIN' | 'STAFF' | 'USER';

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  authorId: number;
  ticketId: number;
  author: {
    username: string;
    name: string;
  };
  authorName?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  ticketId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  requesterName: string;
  assignedToId?: number;
  assignedTo?: {
    username: string;
    name: string;
  };
  comments?: Comment[];
  tasks?: Task[];
  tags?: string[];
  checklists?: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  slaBreachAt?: string;
}
