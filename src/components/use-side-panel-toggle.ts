import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { PageHeaderProps } from "./page-header";

/** How long an unpinned flyout (or a pinned panel's preview) stays after the pointer leaves the toggle or the panel,
 *  ms, so the pointer can cross the gap between them. */
export const SIDE_PANEL_HOVER_CLOSE_MS = 300;

export interface UseSidePanelToggleOptions {
  /** Which of PageHeader's toggles drives the panel: "left" (outer, `panelToggle="left"`) or "right" (inner). */
  side: "left" | "right";
  /** Controlled open state; omit for uncontrolled (`defaultOpen`). */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Controlled pinned state; omit for uncontrolled (`defaultPinned`). */
  pinned?: boolean;
  defaultPinned?: boolean;
  onPinnedChange?: (pinned: boolean) => void;
  /**
   * Render the panel unpinned whatever `pinned` says, and hide its pin (e.g. a container too narrow to push the
   * content). Crossing it closes the panel; crossing back restores it to the stored pinned state, never clearing it.
   */
  pinDisabled?: boolean;
  /** The panel element's `id` (the toggle's `aria-controls`); generated when omitted. */
  id?: string;
}

export interface UseSidePanelToggleReturn {
  /** Whether the panel is open (not counting a preview). */
  open: boolean;
  /** The pinned state the panel renders with (`false` while `pinDisabled`). */
  pinned: boolean;
  /** Pinned, closed and hovered: SidePanel's `preview`. */
  previewing: boolean;
  setOpen: (open: boolean) => void;
  /** Open or close from code (a keyboard-style toggle: no hover involved). */
  toggle: () => void;
  togglePin: () => void;
  panelId: string;
  /** Spread onto the PageHeader that shows this side's toggle (add `panelToggle` yourself: "left", "right" or "both"). */
  pageHeaderProps: Partial<PageHeaderProps>;
  /** Spread onto the SidePanel. */
  sidePanelProps: {
    id: string;
    tabIndex: -1;
    open: boolean;
    pinned: boolean;
    preview: boolean;
    onPinToggle?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
  };
}

function useControllable(value: boolean | undefined, initial: boolean, onChange?: (next: boolean) => void) {
  const [own, setOwn] = useState(initial);
  const current = value ?? own;
  // Read through a ref, so an inline `onChange` doesn't make a new setter (and re-subscribe everything) each render.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const controlled = value !== undefined;
  const set = useCallback(
    (next: boolean) => {
      if (!controlled) setOwn(next);
      onChangeRef.current?.(next);
    },
    [controlled],
  );
  return [current, set] as const;
}

/**
 * The wiring between a PageHeader panel toggle and a SidePanel, as AdminShell has it (admin-shell.tsx), for any
 * page that pairs the two:
 * - **Pinned:** the toggle opens and closes the panel, which pushes the content. Hovering the toggle while the
 *   panel is closed previews it (SidePanel's `preview`) without moving anything.
 * - **Unpinned:** hovering the toggle (or the panel) opens it as a flyout; it closes `SIDE_PANEL_HOVER_CLOSE_MS`
 *   after the pointer leaves both. A mouse click on the toggle doesn't shut a flyout the hover just opened. A
 *   keyboard / assistive-tech activation toggles it and moves focus into the panel, and a keyboard-opened flyout
 *   closes when focus leaves the panel and the toggle, or on Escape (focus returns to the toggle).
 * - **Pin:** pinning opens the panel, unpinning closes it.
 */
export function useSidePanelToggle({
  side,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  pinned: pinnedProp,
  defaultPinned = false,
  onPinnedChange,
  pinDisabled = false,
  id,
}: UseSidePanelToggleOptions): UseSidePanelToggleReturn {
  const generatedId = useId();
  const panelId = id ?? generatedId;
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const [storedPinned, setPinned] = useControllable(pinnedProp, defaultPinned, onPinnedChange);
  const pinned = pinDisabled ? false : storedPinned;
  const [previewing, setPreviewing] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // True while an unpinned flyout is open because of hover: a mouse click on the toggle then mustn't shut it.
  const hoverOpenRef = useRef(false);
  // True while an unpinned flyout was opened from the keyboard: it has no mouse-leave, so focus-out / Escape close it.
  const keyboardOpenRef = useRef(false);

  useEffect(() => () => clearTimeout(hoverTimeout.current), []);

  const hoverStart = useCallback(() => {
    clearTimeout(hoverTimeout.current);
    if (!pinned) {
      if (!open) {
        hoverOpenRef.current = true;
        setOpen(true);
      }
    } else if (!open) {
      setPreviewing(true);
    }
  }, [pinned, open, setOpen]);

  const hoverEnd = useCallback(() => {
    clearTimeout(hoverTimeout.current);
    if (!pinned) {
      if (!hoverOpenRef.current) return;
      hoverTimeout.current = setTimeout(() => {
        hoverOpenRef.current = false;
        setOpen(false);
      }, SIDE_PANEL_HOVER_CLOSE_MS);
    } else {
      hoverTimeout.current = setTimeout(() => setPreviewing(false), SIDE_PANEL_HOVER_CLOSE_MS);
    }
  }, [pinned, setOpen]);

  const toggle = useCallback(() => {
    clearTimeout(hoverTimeout.current);
    setPreviewing(false);
    if (pinned) {
      setOpen(!open);
      return;
    }
    // Unpinned: a click that lands while hover holds the flyout open would shut what the pointer is reaching for.
    if (hoverOpenRef.current && open) return;
    const next = !open;
    keyboardOpenRef.current = next;
    setOpen(next);
    if (next) requestAnimationFrame(() => document.getElementById(panelId)?.focus());
  }, [pinned, open, setOpen, panelId]);

  const togglePin = useCallback(() => {
    const next = !storedPinned;
    clearTimeout(hoverTimeout.current);
    hoverOpenRef.current = false;
    keyboardOpenRef.current = false;
    setPreviewing(false);
    setPinned(next);
    setOpen(next);
  }, [storedPinned, setPinned, setOpen]);

  // A pinned panel opened (from the toggle or by code) ends its preview; an unpinned one closed by code drops the
  // hover / keyboard bookkeeping.
  useEffect(() => {
    if (open) setPreviewing(false);
    else {
      hoverOpenRef.current = false;
      keyboardOpenRef.current = false;
    }
  }, [open]);

  // Crossing `pinDisabled` closes the panel; crossing back restores it to the stored pinned state. Only on a real
  // change: compared with the last value seen, not "skip the first run", which StrictMode's second mount pass
  // defeats (a pinned panel closed before a reload came back open).
  const lastPinDisabled = useRef(pinDisabled);
  useEffect(() => {
    if (lastPinDisabled.current === pinDisabled) return;
    lastPinDisabled.current = pinDisabled;
    // A hover close still pending from the other side of the crossing would undo what this sets.
    clearTimeout(hoverTimeout.current);
    hoverOpenRef.current = false;
    keyboardOpenRef.current = false;
    setPreviewing(false);
    setOpen(pinDisabled ? false : storedPinned);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinDisabled]);

  useEffect(() => {
    if (!open || pinned || !keyboardOpenRef.current) return;
    const panelEl = () => document.getElementById(panelId);
    const toggleEl = () => document.querySelector<HTMLElement>(`[aria-controls="${CSS.escape(panelId)}"]`);
    const close = () => {
      keyboardOpenRef.current = false;
      setOpen(false);
    };
    // A pointer press on the toggle focuses it before its click: the click toggles, so focus arriving that way mustn't
    // close the flyout first (the click would reopen it).
    let pressingToggle = false;
    const onPointerDown = (e: PointerEvent) => {
      pressingToggle = !!toggleEl()?.contains(e.target as Node | null);
    };
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as Node | null;
      if (t && panelEl()?.contains(t)) return;
      if (t && toggleEl()?.contains(t)) {
        // Back on the toggle from inside the panel by keyboard (Tab past its last control): the flyout covers the
        // toggle, so it closes and the toggle's focus is seen (WCAG 2.4.11). Focus already on the toggle when it
        // opened stays open.
        const from = e.relatedTarget as Node | null;
        if (!pressingToggle && from && panelEl()?.contains(from)) close();
        return;
      }
      close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      // A keyboard move (Tab's keydown comes before the focus it moves) is never a press on the toggle.
      pressingToggle = false;
      // `defaultPrevented`: a Radix popover / menu inside the panel already consumed this Escape.
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const focusWasInside = panelEl()?.contains(document.activeElement) ?? false;
      close();
      if (focusWasInside) toggleEl()?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, pinned, panelId, setOpen]);

  // Hover matters while there's something to reveal: an unpinned panel, or a pinned one that's closed.
  const hovers = !pinned || !open;
  const pageHeaderProps: Partial<PageHeaderProps> =
    side === "left"
      ? {
          panelPinned: pinned,
          panelOpen: open,
          panelControlsId: panelId,
          onPanelToggle: toggle,
          onPanelHoverStart: hovers ? hoverStart : undefined,
          onPanelHoverEnd: hovers ? hoverEnd : undefined,
        }
      : {
          innerPanelOpen: open,
          innerPanelControlsId: panelId,
          onInnerPanelToggle: toggle,
          onInnerPanelHoverStart: hovers ? hoverStart : undefined,
          onInnerPanelHoverEnd: hovers ? hoverEnd : undefined,
        };

  return {
    open,
    pinned,
    previewing: previewing && pinned && !open,
    setOpen,
    toggle,
    togglePin,
    panelId,
    pageHeaderProps,
    sidePanelProps: {
      id: panelId,
      tabIndex: -1,
      open,
      pinned,
      preview: previewing && pinned && !open,
      onPinToggle: pinDisabled ? undefined : togglePin,
      onMouseEnter: hovers ? hoverStart : undefined,
      onMouseLeave: hovers ? hoverEnd : undefined,
    },
  };
}
