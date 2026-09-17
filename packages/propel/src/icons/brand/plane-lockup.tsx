/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import type { ISvgIcons } from "../type";
import { PlaneLogo } from "./plane-logo";

export function PlaneLockup({ width = "180", height = "32", className }: ISvgIcons) {
  return (
    <div className={`flex items-center gap-3 font-bold tracking-tight select-none ${className || ""}`}>
      <PlaneLogo width="48" height="19" className="text-primary" />
      <div className="flex items-center text-22 leading-none text-primary">
        <span className="font-semibold">Stack</span>
        <span className="font-bold">Gate</span>
      </div>
    </div>
  );
}
