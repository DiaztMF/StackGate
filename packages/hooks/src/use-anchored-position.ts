/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useLayoutEffect, useState } from "react";
import type { CSSProperties } from "react";

/** Popper-style placement string, e.g. "bottom-start", "top-end", "right". */
export type TAnchorPlacement = string;

/**
 * Panels that portal into document.body cannot be positioned by Popper here:
 * its floating-element ref never settles, so `usePopper` keeps returning its
 * initial `left: 0; top: 0` and the panel lands in the page corner. Anchoring
 * off the trigger's own rect is enough — we never measure the panel, we only
 * pin the edge it grows from and cap its size with CSS.
 */

const GAP = 4;
const VIEWPORT_PADDING = 12;

type Side = "top" | "bottom" | "left" | "right";
type Alignment = "start" | "end";

export function anchoredStyle(
  trigger: DOMRect,
  viewport: { width: number; height: number },
  placement: TAnchorPlacement
): CSSProperties {
  const [rawSide, rawAlignment] = placement.split("-");
  const alignment: Alignment = rawAlignment === "end" ? "end" : "start";
  let side: Side = rawSide === "top" || rawSide === "left" || rawSide === "right" ? rawSide : "bottom";

  // Flip a vertical panel when the chosen side has less room than the other.
  if (side === "bottom" && viewport.height - trigger.bottom < trigger.top) side = "top";
  else if (side === "top" && trigger.top < viewport.height - trigger.bottom) side = "bottom";

  const style: CSSProperties = { position: "fixed", zIndex: 30 };

  if (side === "bottom" || side === "top") {
    if (side === "bottom") {
      style.top = trigger.bottom + GAP;
      style.maxHeight = viewport.height - trigger.bottom - GAP - VIEWPORT_PADDING;
    } else {
      style.bottom = viewport.height - trigger.top + GAP;
      style.maxHeight = trigger.top - GAP - VIEWPORT_PADDING;
    }
    if (alignment === "end") {
      style.right = Math.max(viewport.width - trigger.right, VIEWPORT_PADDING);
      style.maxWidth = trigger.right - VIEWPORT_PADDING;
    } else {
      style.left = Math.min(trigger.left, viewport.width - VIEWPORT_PADDING);
      style.maxWidth = viewport.width - trigger.left - VIEWPORT_PADDING;
    }
    return style;
  }

  if (side === "left") {
    style.right = viewport.width - trigger.left + GAP;
    style.maxWidth = trigger.left - GAP - VIEWPORT_PADDING;
  } else {
    style.left = trigger.right + GAP;
    style.maxWidth = viewport.width - trigger.right - GAP - VIEWPORT_PADDING;
  }
  style.top = Math.max(alignment === "end" ? trigger.bottom : trigger.top, VIEWPORT_PADDING);
  style.maxHeight = viewport.height - style.top - VIEWPORT_PADDING;
  return style;
}

/**
 * Pins a floating panel to its trigger while the panel is open, following
 * scroll and resize. Returns styles to spread onto the panel element.
 */
export function useAnchoredPosition(
  referenceElement: HTMLElement | null,
  isOpen: boolean,
  placement: TAnchorPlacement = "bottom-start"
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({ position: "fixed", top: 0, left: 0, zIndex: 30 });

  const reposition = useCallback(() => {
    if (!referenceElement) return;
    setStyle(
      anchoredStyle(
        referenceElement.getBoundingClientRect(),
        {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        placement
      )
    );
  }, [referenceElement, placement]);

  useLayoutEffect(() => {
    if (!isOpen || !referenceElement) return;
    reposition();
    // capture phase so the panel follows any scrollable ancestor, not just the window
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [isOpen, referenceElement, reposition]);

  return style;
}
