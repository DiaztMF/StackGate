/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import type { ISvgIcons } from "../type";

/**
 * StackGate Official Logo Mark (From Page 2 Design)
 * Combination of 3-layer stack ('S') on the left and geometric 'G' on the right.
 */
export function PlaneLogo({ width = "40", height = "28", className, color = "currentColor" }: ISvgIcons) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 144 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Group 1: 3-Layer Stack 'S' */}
      <g id="sg-stack">
        {/* Top layer slanted right */}
        <path
          d="M 8 0 L 72 0 L 64 16 L 0 16 L 8 0 Z"
          transform="translate(8, 0)"
          fill={color}
        />
        {/* Middle layer horizontal block */}
        <path
          d="M 64 0 L 0 0 L 0 16 L 64 16 L 64 0 Z"
          transform="translate(8, 20)"
          fill={color}
        />
        {/* Bottom layer slanted left */}
        <path
          d="M 72 0 L 8 0 L 0 16 L 64 16 L 72 0 Z"
          transform="translate(0, 40)"
          fill={color}
        />
      </g>

      {/* Gate Letter 'G' */}
      <text
        x="88"
        y="50"
        fill={color}
        fontFamily="Kreon, Inter, sans-serif"
        fontSize="68"
        fontWeight="600"
        letterSpacing="-1px"
      >
        G
      </text>
    </svg>
  );
}
