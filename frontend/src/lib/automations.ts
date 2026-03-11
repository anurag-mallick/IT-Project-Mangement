import { prisma } from './prisma';
import { Ticket } from '@prisma/client';

export type TriggerEvent = 'ON_TICKET_CREATED' | 'ON_TICKET_UPDATED';

export async function runAutomations(trigger: TriggerEvent, ticket: Ticket) {
  try {
    const automations = await prisma.automation.findMany({
      where: {
        isActive: true,
        trigger: trigger,
      }
    });

    if (automations.length === 0) return ticket;

    const dataToUpdate: any = {};

    for (const auto of automations) {
      // Evaluate condition
      // Condition simple format: "priority=P0" or "status=TODO"
      let conditionMet = true;
      if (auto.condition) {
        const [key, value] = auto.condition.split('=');
        if (key && value && (ticket as any)[key.trim()] !== value.trim()) {
          conditionMet = false;
        }
      }

      if (conditionMet) {
        // Execute Action
        // Action simple format: "ASSIGN_TO,1" or "SET_STATUS,IN_PROGRESS"
        const [actionType, actionVal] = auto.action.split(',');
        if (actionType === 'ASSIGN_TO' && actionVal) {
          dataToUpdate.assignedToId = parseInt(actionVal);
        } else if (actionType === 'SET_STATUS' && actionVal) {
          dataToUpdate.status = actionVal.trim();
        } else if (actionType === 'SET_PRIORITY' && actionVal) {
          dataToUpdate.priority = actionVal.trim();
        }
      }
    }

    if (Object.keys(dataToUpdate).length > 0) {
      const updatedTicket = await prisma.ticket.update({
        where: { id: ticket.id },
        data: dataToUpdate
      });
      return updatedTicket;
    }

    return ticket;
  } catch (error) {
    console.error('Error running automations:', error);
    return ticket;
  }
}
