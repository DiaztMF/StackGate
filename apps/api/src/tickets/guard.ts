import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db/client.js";
import { gateCheckItems, researchLinks, states, tickets } from "../db/schema.js";
import type { AuthUser } from "../auth/middleware.js";

export type GuardOk = { ok: true; toStateId: string };
export type GuardFail = { ok: false; status: 403 | 422 | 404; code: string; message: string };

export async function checkTransition(
  ticketId: string,
  toKey: string,
  actor: AuthUser,
  note?: string,
): Promise<GuardOk | GuardFail> {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!ticket) return { ok: false, status: 404, code: "NOT_FOUND", message: "Tiket tidak ditemukan" };
  const projectStates = await db.select().from(states).where(eq(states.projectId, ticket.projectId));
  const toState = projectStates.find((s) => s.key === toKey);
  if (!toState) return { ok: false, status: 422, code: "VALIDATION_ERROR", message: "State tujuan tidak dikenal" };
  const fromState = projectStates.find((s) => s.id === ticket.stateId);
  const fromKey = fromState?.key;

  if (toKey === "ready") {
    if (actor.role !== "lead") {
      return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Hanya lead yang boleh menutup tiket" };
    }
    const unchecked = await db
      .select({ id: gateCheckItems.id })
      .from(gateCheckItems)
      .where(and(eq(gateCheckItems.ticketId, ticket.id), isNull(gateCheckItems.checkedAt)))
      .limit(1);
    if (unchecked.length > 0) {
      return { ok: false, status: 422, code: "GATE_INCOMPLETE", message: "Checklist gerbang belum lengkap" };
    }
    const links = await db.select({ id: researchLinks.id }).from(researchLinks).where(eq(researchLinks.ticketId, ticket.id)).limit(1);
    if (ticket.researchRequired && links.length === 0) {
      return { ok: false, status: 422, code: "RESEARCH_LINK_REQUIRED", message: "Tautan modul riset wajib diisi dulu" };
    }
    return { ok: true, toStateId: toState.id };
  }

  if (toKey === "backlog" && fromKey !== "backlog") {
    if (actor.role === "student") {
      return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Hanya lead atau PM yang boleh mengembalikan tiket" };
    }
    if (!note || note.trim().length === 0) {
      return { ok: false, status: 422, code: "VALIDATION_ERROR", message: "Alasan pengembalian wajib diisi" };
    }
    return { ok: true, toStateId: toState.id };
  }

  if (fromKey === "review" && toKey === "in-development") {
    if (actor.role !== "lead") {
      return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Hanya lead yang boleh me-reject tiket" };
    }
    if (!note || note.trim().length === 0) {
      return { ok: false, status: 422, code: "VALIDATION_ERROR", message: "Catatan revisi wajib diisi" };
    }
    return { ok: true, toStateId: toState.id };
  }

  if (fromKey === "backlog" && toKey === "in-development") {
    if (!ticket.assigneeId) {
      return { ok: false, status: 422, code: "VALIDATION_ERROR", message: "Tiket harus punya assignee dulu" };
    }
    if (actor.role === "student" && ticket.assigneeId !== actor.id) {
      return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Kamu bukan assignee tiket ini" };
    }
    return { ok: true, toStateId: toState.id };
  }

  if (fromKey === "in-development" && toKey === "review") {
    if (actor.role === "student" && ticket.assigneeId !== actor.id) {
      return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Kamu bukan assignee tiket ini" };
    }
    if (!ticket.description || ticket.description.trim().length === 0) {
      return { ok: false, status: 422, code: "VALIDATION_ERROR", message: "Deskripsi tiket wajib diisi dulu" };
    }
    if (ticket.researchRequired) {
      const links = await db.select({ id: researchLinks.id }).from(researchLinks).where(eq(researchLinks.ticketId, ticket.id)).limit(1);
      if (links.length === 0) {
        return { ok: false, status: 422, code: "RESEARCH_LINK_REQUIRED", message: "Tautan modul riset wajib diisi dulu" };
      }
    }
    return { ok: true, toStateId: toState.id };
  }

  return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Transisi ini tidak diizinkan" };
}
