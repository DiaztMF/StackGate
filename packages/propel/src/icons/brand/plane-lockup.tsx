/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import type { ISvgIcons } from "../type";
import { PlaneLogo } from "./plane-logo";

export function PlaneLockup({ width = "135", height = "28", className }: ISvgIcons) {
  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${className || ""}`}>
      <PlaneLogo width="32" height="18" className="text-primary" />
      <div className="flex items-center text-18 leading-none text-primary">
        <span className="font-semibold">Stack</span>
        <span className="font-bold">Gate</span>
      </div>
    </div>
  );
}
