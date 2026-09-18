/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IState } from "@plane/types";

/**
 * Mirrors the transition matrix in `apps/api/src/tickets/guard.ts` so the board
 * can grey out moves the server will reject instead of letting a student click
 * into a 403. The API stays the source of truth — this only decides what the UI
 * presents as available, and rules that need ticket data the board does not
 * carry (assignee, description, research links) are still enforced server-side.
 */

export type TStackGateRole = "student" | "lead" | "pm";

/** StackGate ships four fixed states; the API exposes their keys on IState. */
export function getStateKey(state: IState | undefined): string | undefined {
  return (state as (IState & { key?: string }) | undefined)?.key;
}

export function stateTransitionBlockedReason(
  role: TStackGateRole | string | undefined,
  fromKey: string | undefined,
  toKey: string | undefined
): string | null {
  // Unknown role or unknown states: say nothing and let the server decide.
  if (!role || !fromKey || !toKey || fromKey === toKey) return null;

  if (toKey === "ready") {
    return role === "lead" ? null : "Hanya lead yang boleh menutup tiket";
  }
  if (toKey === "backlog" && fromKey !== "backlog") {
    return role === "student" ? "Hanya lead atau PM yang boleh mengembalikan tiket" : null;
  }
  if (fromKey === "review" && toKey === "in-development") {
    return role === "lead" ? null : "Hanya lead yang boleh me-reject tiket";
  }
  if (fromKey === "backlog" && toKey === "in-development") return null;
  if (fromKey === "in-development" && toKey === "review") return null;

  return "Tiket harus melewati tahap sebelumnya dulu";
}
