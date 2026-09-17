/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { PlaneLogo } from "@plane/propel/icons";

interface LogoSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LogoSpinner({ size = "md", className = "" }: LogoSpinnerProps) {
  const width = size === "sm" ? 48 : size === "lg" ? 80 : 64;
  const height = size === "sm" ? 24 : size === "lg" ? 40 : 32;

  return (
    <div className={`flex items-center justify-center select-none ${className}`}>
      <PlaneLogo width={String(width)} height={String(height)} className="text-primary" />
    </div>
  );
}
