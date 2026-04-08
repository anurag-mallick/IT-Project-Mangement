import { prisma } from '../prisma';

interface AssignmentCondition {
  field: string;
  operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'in';
  value: any;
}

interface AssignmentRule {
  conditions: AssignmentCondition[];
  conditionType: 'AND' | 'OR';
}

interface AssignmentAction {
  type: 'ASSIGN_TO_AGENT' | 'ASSIGN_TO_TEAM' | 'SET_PRIORITY' | 'ADD_TAG' | 'SET_STATUS';
  value: any;
}

export async function evaluateAssignmentRules(ticket: any): Promise<{
  assignedToId?: number;
  teamId?: number;
  priority?: string;
  tags?: string[];
  status?: string;
}> {
  const rules = await prisma.assignmentRule.findMany({
    where: { isActive: true },
    orderBy: { priority: 'asc' },
    include: { team: true }
  });
  
  for (const rule of rules) {
    const conditions = rule.conditions as any as AssignmentRule;
    const conditionMet = evaluateConditions(conditions, ticket);
    
    if (conditionMet) {
      const action = rule.assignment as any as AssignmentAction;
      return applyAssignment(action, rule);
    }
  }
  
  return {};
}

function evaluateConditions(rule: AssignmentRule, ticket: any): boolean {
  const results = rule.conditions.map((cond: AssignmentCondition) => {
    const fieldValue = getNestedValue(ticket, cond.field);
    return evaluateCondition(fieldValue, cond.operator, cond.value);
  });
  
  return rule.conditionType === 'AND' 
    ? results.every(Boolean)
    : results.some(Boolean);
}

function evaluateCondition(fieldValue: any, operator: string, value: any): boolean {
  switch (operator) {
    case 'eq': return fieldValue === value;
    case 'neq': return fieldValue !== value;
    case 'contains': return String(fieldValue || '').includes(String(value));
    case 'gt': return Number(fieldValue) > Number(value);
    case 'lt': return Number(fieldValue) < Number(value);
    case 'in': return Array.isArray(value) && value.includes(fieldValue);
    default: return false;
  }
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

async function applyAssignment(action: AssignmentAction, rule: any): Promise<{
  assignedToId?: number;
  teamId?: number;
  priority?: string;
  tags?: string[];
  status?: string;
}> {
  switch (action.type) {
    case 'ASSIGN_TO_AGENT':
      return { assignedToId: parseInt(action.value) };
      
    case 'ASSIGN_TO_TEAM':
      if (rule.team?.roundRobin) {
        const nextAgent = await getNextRoundRobinAgent(rule.teamId!);
        return { teamId: rule.teamId, assignedToId: nextAgent };
      }
      return { teamId: rule.teamId };
      
    case 'SET_PRIORITY':
      return { priority: action.value };
      
    case 'ADD_TAG':
      return { tags: [action.value] };
      
    case 'SET_STATUS':
      return { status: action.value };
      
    default:
      return {};
  }
}

async function getNextRoundRobinAgent(teamId: number): Promise<number | undefined> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      agents: {
        where: { isActive: true },
        orderBy: { id: 'asc' }
      }
    }
  });
  
  if (!team || team.agents.length === 0) return undefined;
  
  const tickets = await prisma.ticket.findMany({
    where: {
      teamId,
      assignedToId: { in: team.agents.map(a => a.id) }
    },
    orderBy: { createdAt: 'desc' },
    take: team.agents.length
  });
  
  const assignedAgents = new Set(tickets.map(t => t.assignedToId));
  
  for (const agent of team.agents) {
    if (!assignedAgents.has(agent.id)) {
      return agent.id;
    }
  }
  
  return team.agents[0].id;
}

export async function applyRoundRobinAssignment(teamId: number): Promise<number | undefined> {
  return getNextRoundRobinAgent(teamId);
}
