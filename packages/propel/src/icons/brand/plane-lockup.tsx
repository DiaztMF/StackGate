/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import type { ISvgIcons } from "../type";
import { PlaneLogo } from "./plane-logo";

export function PlaneLockup({ width = "130", height = "32", className }: ISvgIcons) {
  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${className || ""}`}>
      <PlaneLogo width="26" height="26" />
      <div className="flex items-center text-18 leading-none">
        <span className="font-semibold text-primary">Stack</span>
        <span className="font-bold text-accent-primary">Gate</span>
      </div>
    </div>
  );
}
