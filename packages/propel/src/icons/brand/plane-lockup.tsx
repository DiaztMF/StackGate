/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

import type { ISvgIcons } from "../type";

export function PlaneLockup({ width = "120", height = "28", className }: ISvgIcons) {
  return (
    <div className={`flex items-center gap-2 font-bold tracking-tight text-primary select-none ${className || ""}`}>
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-primary text-xs text-on-color">
        S
      </span>
      <span className="text-base font-semibold tracking-tight">StackGate</span>
    </div>
  );
}
