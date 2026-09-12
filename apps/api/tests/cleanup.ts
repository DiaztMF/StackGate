import { eq, inArray } from "drizzle-orm";
import { db } from "../src/db/client.js";
import {
  comments,
  gateCheckItems,
  projectMembers,
  projects,
  researchLinks,
  states,
  ticketTransitions,
  tickets,
} from "../src/db/schema.js";

const trackedTicketIds = new Set<string>();
const trackedProjectIds = new Set<string>();

export function trackTicket(id: string): void {
  trackedTicketIds.add(id);
}

export function trackProject(id: string): void {
  trackedProjectIds.add(id);
}

export async function cleanupTicket(ticketId: string): Promise<void> {
  await db.delete(comments).where(eq(comments.ticketId, ticketId));
  await db.delete(gateCheckItems).where(eq(gateCheckItems.ticketId, ticketId));
  await db.delete(researchLinks).where(eq(researchLinks.ticketId, ticketId));
  await db.delete(ticketTransitions).where(eq(ticketTransitions.ticketId, ticketId));
  await db.delete(tickets).where(eq(tickets.id, ticketId));
}

export async function cleanupProject(projectId: string): Promise<void> {
  const rows = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.projectId, projectId));
  await Promise.all(rows.map((r) => cleanupTicket(r.id)));
  const stateRows = await db.select({ id: states.id }).from(states).where(eq(states.projectId, projectId));
  if (stateRows.length > 0) {
    await db.delete(states).where(
      inArray(
        states.id,
        stateRows.map((s) => s.id),
      ),
    );
  }
  await db.delete(projectMembers).where(eq(projectMembers.projectId, projectId));
  await db.delete(projects).where(eq(projects.id, projectId));
}

export async function cleanupTracked(): Promise<void> {
  await Promise.all([...trackedTicketIds].map((id) => cleanupTicket(id)));
  trackedTicketIds.clear();
  await Promise.all([...trackedProjectIds].map((id) => cleanupProject(id)));
  trackedProjectIds.clear();
}
