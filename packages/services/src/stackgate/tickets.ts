import { sgApi } from "./client.js";

export async function sgListTickets(projectId: string): Promise<unknown[]> {
  const res = await sgApi.get(`/api/projects/${projectId}/tickets`);
  return res.data.data.tickets as unknown[];
}

export async function sgTransition(ticketId: string, toState: string): Promise<unknown> {
  const res = await sgApi.post(`/api/tickets/${ticketId}/transition`, { to_state: toState });
  return res.data.data.ticket;
}
