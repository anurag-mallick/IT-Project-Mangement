import { prisma } from '../prisma';

interface WorkingHours {
  start: string;
  end: string;
}

const DEFAULT_WORKING_HOURS: WorkingHours = {
  start: '09:00',
  end: '18:00'
};

export async function getSLAPolicy(priority: string) {
  return prisma.sLAPolicyConfig.findUnique({
    where: { priority: priority as any },
    include: { calendar: true }
  });
}

export async function calculateResponseByTime(priority: string): Promise<Date | null> {
  const policy = await getSLAPolicy(priority);
  if (!policy || !policy.firstResponseTimeMins) return null;
  
  const now = new Date();
  const responseTime = policy.firstResponseTimeMins;
  
  if (policy.calendar) {
    return calculateBusinessTime(now, responseTime, policy.calendar.id);
  }
  
  return addWorkingMinutes(now, responseTime);
}

export async function calculateResolutionByTime(priority: string): Promise<Date | null> {
  const policy = await getSLAPolicy(priority);
  if (!policy || !policy.resolutionTimeMins) return null;
  
  const now = new Date();
  const resolutionTime = policy.resolutionTimeMins;
  
  if (policy.calendar) {
    return calculateBusinessTime(now, resolutionTime, policy.calendar.id);
  }
  
  return addWorkingMinutes(now, resolutionTime);
}

async function calculateBusinessTime(start: Date, minutes: number, calendarId: number): Promise<Date> {
  const holidays = await prisma.holiday.findMany({
    where: { calendarId },
    select: { date: true }
  });
  
  const holidayDates = new Set(holidays.map(h => h.date.toDateString()));
  let remainingMinutes = minutes;
  let current = new Date(start);
  
  while (remainingMinutes > 0) {
    if (isWorkingDay(current, holidayDates)) {
      const workEnd = getWorkEndTime(current);
      const minutesUntilEnd = getMinutesUntil(current, workEnd);
      
      if (minutesUntilEnd >= remainingMinutes) {
        current = new Date(current.getTime() + remainingMinutes * 60000);
        remainingMinutes = 0;
      } else {
        remainingMinutes -= minutesUntilEnd;
        current = nextWorkingDayStart(current);
      }
    } else {
      current = nextWorkingDayStart(current);
    }
  }
  
  return current;
}

function isWorkingDay(date: Date, holidays: Set<string>): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return false;
  return !holidays.has(date.toDateString());
}

function getWorkEndTime(date: Date): Date {
  const [hours, minutes] = DEFAULT_WORKING_HOURS.end.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function getMinutesUntil(from: Date, until: Date): number {
  return Math.max(0, Math.floor((until.getTime() - from.getTime()) / 60000));
}

function nextWorkingDayStart(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + 1);
  const day = result.getDay();
  if (day === 0) result.setDate(result.getDate() + 1);
  if (day === 6) result.setDate(result.getDate() + 2);
  const [hours, minutes] = DEFAULT_WORKING_HOURS.start.split(':').map(Number);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function addWorkingMinutes(start: Date, minutes: number): Date {
  let remainingMinutes = minutes;
  let current = new Date(start);
  
  while (remainingMinutes > 0) {
    const workEnd = getWorkEndTime(current);
    const minutesUntilEnd = getMinutesUntil(current, workEnd);
    
    if (minutesUntilEnd >= remainingMinutes) {
      current = new Date(current.getTime() + remainingMinutes * 60000);
      remainingMinutes = 0;
    } else {
      remainingMinutes -= minutesUntilEnd;
      current = nextWorkingDayStart(current);
    }
  }
  
  return current;
}

export async function checkSLABreach(ticket: any) {
  if (!ticket.responseBy || ticket.firstResponseAt) return { responseBreached: false, resolutionBreached: false };
  
  const now = new Date();
  const responseBreached = now > new Date(ticket.responseBy) && !ticket.firstResponseAt;
  const resolutionBreached = ticket.resolutionBy && now > new Date(ticket.resolutionBy);
  
  return { responseBreached, resolutionBreached };
}

export async function processSLAEscalations() {
  const escalations = await prisma.sLAEscalation.findMany({
    where: { isActive: true }
  });
  
  for (const escalation of escalations) {
    const tickets = await prisma.ticket.findMany({
      where: {
        status: { in: ['TODO', 'IN_PROGRESS'] },
        priority: escalation.priority || undefined,
        slaResponseBreached: false,
        slaResolutionBreached: false
      }
    });
    
    for (const ticket of tickets) {
      const elapsedMins = Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / 60000);
      
      if (escalation.triggerType === 'TIME' && elapsedMins >= escalation.triggerValue) {
        if (escalation.actionType === 'CHANGE_PRIORITY') {
          await prisma.ticket.update({
            where: { id: ticket.id },
            data: { priority: escalation.actionValue as any }
          });
        } else if (escalation.actionType === 'ASSIGN_TO') {
          const agent = await prisma.user.findFirst({
            where: { id: parseInt(escalation.actionValue), isActive: true }
          });
          if (agent) {
            await prisma.ticket.update({
              where: { id: ticket.id },
              data: { assignedToId: agent.id }
            });
          }
        } else if (escalation.actionType === 'NOTIFY') {
          const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
          for (const admin of admins) {
            // Send escalation notification
          }
        }
      }
    }
  }
}
