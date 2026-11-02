import * as React from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { ContainerHeader } from "./container-header";
import { PanelContent } from "./panel-content";
import { ContainerFooterSlot, type ContainerFooterAlign } from "./container-footer";
import { Tooltip } from "./tooltip";
import { usePanelDragResize } from "./use-panel-drag-resize";
import { cn } from "../lib/utils";

/* ── Cookie helpers (remembered resize width only) — same small local
   getCookie/setCookie pattern already duplicated per-component elsewhere
   in this codebase (e.g. admin-shell.tsx's own pinned-state cookies)
   rather than a shared util. ── */
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
}
function readNumberCookie(name: string): number | null {
  const val = getCookie(name);
  const num = val ? Number(val) : NaN;
  return Number.isFinite(num) ? num : null;
}

/* ── InteriorPanel ──
   The inline detail/properties panel that lives BELOW the page header,
   inside the main container (e.g. the record-details panel in
   admin-shell.tsx's "interior panels row"). Always inline and resizable;
   opened via a click/trigger elsewhere in the main container (a button, a
   row select, etc. — there's no hover-to-open concept here, unlike
   `SidePanel`). Below 1440px of its parent container's width (see
   `absoluteBreakpoint` below) it switches to an absolute overlay instead of
   squeezing the content column further — raised from 1024px (which used to
   match `SidePanel`'s own consumers' pin-guard threshold — `AdminShell`,
   the "Agent Next Gen" template — before 1050px before that) after testing
   wider values in agent-next-gen-v2; the two thresholds are no longer tied
   to one shared value.

   "Below the page header" is a statement about typical DOM placement, not
   a rule this component enforces: the absolute-overlay layout above always
   positions against the panel's nearest positioned ancestor, covering
   whatever ELSE is inside that same ancestor — normally just the main
   content column, but a page-level header mounted inside that same
   ancestor (rather than outside it, as every other consumer does) gets
   covered too. `overlayHeader` (below) is the documented opt-in for
   exactly that: it doesn't move the panel in the DOM, it just guarantees
   the panel is always in its overlay layout (never the width-squeezing
   docked one) so it reliably covers such a header once mounted that way —
   see that prop's own doc comment. Added to formalize what
   agent-next-gen-v3's `InContactInteriorPanel` wrapper
   (agent-next-gen-in-contact-panel.tsx) already did by hand with
   `absoluteBreakpoint={Infinity}` + `maxWidth={Infinity}`, per an explicit
   request to make it "a control in the interior panel... instead of its
   own component."

   This is one of exactly two panel types in the design system — the other
   being `SidePanel` (over the page header, hover/pin, left or right).
   They're deliberately separate components with different behavior, not
   one component switching on a `variant` prop — a prior unified `Panel`
   (`variant="side" | "interior"`) caused enough confusion between the two
   that it was split back into these two.

   Also distinct from `Draggable` (float/dockable overlay
   shells for things like the AI panel or notifications dropdown) — those
   aren't part of the app shell's side/interior panel system at all, see
   draggable.tsx. */

export interface InteriorPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Which edge of the main container the panel is docked to (default: "right") */
  side?: "left" | "right";
  /** Whether the panel is open (default: true) */
  open?: boolean;
  /** Called when the header's close (×) button is clicked */
  onClose?: () => void;
  /** Icon rendered inside the header's close button — see `ContainerHeaderProps.closeIcon`'s
   *  own doc comment. Default: lucide `X`, unchanged for every existing consumer. */
  closeIcon?: React.ReactNode;

  /** Allow drag-to-resize on the panel's leading border (default: true) */
  resizable?: boolean;
  /** Min width when resizing, px (default: 350) */
  minWidth?: number;
  /** Max width when resizing, px. Default: 425 — unless `overlayHeader` is
   *  true and this is left unset, in which case it defaults to unconstrained
   *  (no resize cap), matching `InContactInteriorPanel`'s own
   *  `maxWidth={Infinity}`. Passing this explicitly always wins either way. */
  maxWidth?: number;
  /** Fired when a resize drag starts (true) or ends (false) */
  onResizeStateChange?: (isResizing: boolean) => void;
  /** Fired whenever the width changes during a drag */
  onWidthChange?: (width: number) => void;
  /**
   * Width in px. Defaults to `minWidth` (opens at its narrowest, per
   * explicit request) — unless `storageKey` is set and a previously
   * drag-resized width was found under that key, in which case that
   * remembered width is used instead. Passing this prop explicitly always
   * wins over both. A later change to it moves the panel to the new width (the width is the caller's, e.g. a panel
   * that fills a column the agent resizes); pair it with `instantWidthChange` while that width is being dragged.
   */
  width?: number;
  /**
   * Suppress the width transition for this render, as `SidePanel`'s prop of the same name: the width jumps to its new
   * value instead of sliding. For a width the caller changes on every pointer move (a drag it didn't start itself).
   * Default `false`: the normal 250ms slide.
   */
  instantWidthChange?: boolean;
  /**
   * Cookie key to remember this panel's drag-resized width under, across
   * opens/closes and even full remounts (e.g. navigating away from the page
   * and back, which unmounts the component and would otherwise lose the
   * resize). Omit to keep the current per-mount-only behavior (resizes
   * persist while the component stays mounted, same as before this prop
   * existed, but reset to `maxWidth` on a fresh mount). Give each distinct
   * interior panel in an app its own key — sharing one between two
   * different panels (e.g. two different pages' own interior panels) would
   * incorrectly apply one's remembered size to the other.
   */
  storageKey?: string;

  headerTitle?: string;
  /** Extra className on the header row (e.g. a grab cursor for a draggable host). */
  headerClassName?: string;
  /**
   * Also render the header when there is no `headerTitle` but other header content is set (icon, subhead,
   * badge, actions, tabs, buttons), for an icon-only or actions-only header. Off by default: without a
   * title the header is omitted, as before.
   */
  headerWithoutTitle?: boolean;
  /** Optional line below `headerTitle`, e.g. a record's name + id */
  headerSubhead?: string;
  headerIcon?: React.ReactNode;
  /** Forwarded to `ContainerHeader`'s own `onBack` — a real
   *  back-arrow button to the left of `headerIcon`/the title, for content
   *  that drills into a sub-view within this SAME panel rather than
   *  opening a second, nested one (this component doesn't support
   *  nesting). Omit for a panel with no drill-down navigation. */
  onBack?: () => void;
  /** Forwarded to `ContainerHeader`'s own `backIcon`.
   *  Default: lucide `ArrowLeft`. */
  backIcon?: React.ReactNode;
  /**
   * Rendered inline immediately after `headerTitle`, same row (forwarded to
   * `ContainerHeader`'s own `titleBadge` slot) — e.g. an
   * action button that needs to float next to the title itself rather than
   * join the far-right `headerActions` cluster (useful once this panel is
   * wide enough — full-screen, say — to have real room beside the title).
   * Mirrors `SidePanel`'s identically-named prop for consistency between
   * the two panel types.
   */
  headerTitleBadge?: React.ReactNode;
  headerActions?: React.ReactNode;
  /**
   * A `TabList` rendered inside the header itself, below the title/subhead
   * row — forwarded straight to `ContainerHeader`'s own `tabs` prop (see
   * container-header.tsx). This keeps the tabs genuinely fixed: they sit
   * outside `PanelContent` (the `flex-1 overflow-y-auto` scroll region
   * `children` renders into), not inside it with a hand-rolled `sticky`
   * wrapper — see CONTRIBUTING.md's "Composing panel body content" for why
   * that used to be the only option and what was wrong with it (the
   * surrounding scroll container's own scrollbar still ran alongside a
   * merely-`sticky` tab row, and selecting from a collapsed "N More"
   * overflow menu had its own separate bug on top of that). Pass the same
   * `TabList` you'd otherwise have put at the top of `children` — nothing
   * else about how you build it changes.
   */
  headerTabs?: React.ReactNode;

  /**
   * Adds a full-screen toggle button to the header (a `Maximize2`/
   * `Minimize2` icon, matching `ContainerHeader.stories.tsx`'s own
   * fullscreen-toggle reference) that expands the panel to the full width
   * of its container — same overlay mechanism the panel already uses below
   * its `absoluteBreakpoint` (default 1440px) of its parent's width
   * (`isNarrow`, see the class doc comment above and `absoluteBreakpoint`'s
   * own doc comment), just user-triggered instead of width-triggered, so it needs no
   * extra cooperation from whatever main-content column sits next to this
   * panel: the panel simply covers it, rather than requiring that sibling
   * to shrink out of the way itself. Default `false` — every existing
   * panel is unaffected; opt in per usage for whichever ones actually
   * benefit from more room on demand (e.g. a wide table or transcript
   * inside the panel). Self-contained open/closed state (not controlled
   * from outside) — same "the component owns this interaction, not the
   * consumer" status as the resize drag state already has. Resizing
   * (`resizable`) is disabled while full-screen, since dragging a width
   * that's currently clamped to the full measured container width doesn't
   * mean anything; it resumes at whatever width was active before entering
   * full-screen once toggled back off.
   */
  allowFullScreen?: boolean;
  /**
   * Bump this (e.g. an ever-incrementing counter) to force the panel OUT
   * of full-screen mode from outside — for a case like "a new assignment
   * just opened behind this panel while it happened to be full-screen,
   * and the newly-opened content needs to actually be visible again."
   * `isFullScreen` is otherwise deliberately self-contained/uncontrolled
   * (see that state's own doc comment below) — this is a narrow one-way
   * escape hatch, not a switch to a fully controlled `fullScreen`/
   * `onFullScreenChange` pair: the consumer can force it closed, but can't
   * read or fully drive the value. Compared via reference equality against
   * the previous render inside a `useEffect`, so any distinct value works
   * (a counter, a timestamp, the id of whatever triggered the exit) as
   * long as it changes each time an exit should happen; passing the exact
   * same value twice in a row (including leaving this `undefined`, the
   * default) is a no-op both times. No effect if the panel isn't currently
   * full-screen. */
  exitFullScreenSignal?: number | string;
  /**
   * Whether the panel mounts full-screen (read once, on mount; default
   * `false`). With `onFullScreenChange`, lets a consumer that remounts the
   * panel per context (e.g. one slide-over per assignment) bring each one
   * back in the full-screen state it was left in. Still uncontrolled after
   * mount, like `width`/`storageKey`: the toggle owns the value from then on.
   */
  defaultFullScreen?: boolean;
  /** Fired whenever full screen turns on or off (the toggle, `autoFullScreen`, `exitFullScreenSignal`). */
  onFullScreenChange?: (fullScreen: boolean) => void;

  /**
   * Width (px) of the panel's PARENT container below which it switches to
   * an absolute overlay instead of squeezing the main content column
   * further — see this component's own top doc comment for the "why" and
   * this value's own history. Default: 1440, unchanged for every existing
   * consumer (`AdminShell` and every other app built on this design system)
   * — per explicit request, scoped per-consumer rather than changed
   * globally: a lower value here flips to overlay mode sooner (at a wider
   * parent width), which suits a narrower/busier main content column (e.g.
   * one already sharing space with a docked Customer Information panel)
   * without affecting any other app's own interior panels, which have no
   * reason to change behavior just because one consumer wanted a different
   * threshold.
   */
  absoluteBreakpoint?: number;

  /**
   * The container's width, given instead of measured. By default the panel
   * measures its parent element (`absoluteBreakpoint`'s switch,
   * `autoFullScreen`'s 90% threshold, the width restored on leaving an auto
   * full screen, and the width the panel is clamped to — its full-screen
   * width — all read it). A panel portaled into a `display: contents` host
   * — so it lays out as a flex item of the row around that host — has a
   * parent that measures 0, which would read as "narrow" and make any drag
   * jump to full screen; pass the row's width here (agent-next-gen-demo's
   * right panels beside the page column). Pass it from the first render
   * (and never 0), or don't mount the panel until it's known: a panel that
   * starts by measuring its 0-wide host can latch into auto full screen.
   * Absent, the parent is measured as before.
   */
  containerWidth?: number;

  /**
   * Forces the panel permanently into its absolute-overlay layout (the
   * same one `isNarrow`/`absoluteBreakpoint` switches to below the
   * threshold above), regardless of how wide its parent container is —
   * equivalent to `absoluteBreakpoint={Infinity}`, just named for what a
   * consumer is actually opting into rather than the width-threshold
   * mechanism underneath. Default: false (every existing consumer is
   * unaffected).
   *
   * This is what lets the panel render OVER a page-level header instead of
   * being squeezed beside the main content below one — but only because
   * of where it's mounted, not anything this prop repositions on its own:
   * the overlay always positions `absolute; top: 0` against the panel's
   * nearest positioned (`relative`/etc.) ancestor, covering whatever else
   * lives inside that SAME ancestor. Mount the panel inside a `relative`
   * box that also contains the header (as a normal-flow sibling before the
   * panel, the way agent-next-gen-v3's "Customer Information" overlay
   * sits alongside its own record header — see `InContactConfiguration` in
   * this component's own stories) and it renders on top of that header;
   * mount it below/outside that header's own container (every other
   * consumer's existing pattern — see the `Right`/`Left`/`WithFullScreen`/
   * `WithTabs` stories) and this prop makes no visible difference to the
   * header at all, only to whether the main content column ever gets
   * squeezed instead of overlaid.
   *
   * Also defaults `maxWidth` to unconstrained when left unset (see that
   * prop's own doc comment) — an overlay covering a header is meant to
   * read as a full detail view, not a narrow drawer capped at 425px.
   *
   * Added to formalize agent-next-gen-v3's `InContactInteriorPanel`
   * wrapper (agent-next-gen-in-contact-panel.tsx), which hardcoded this
   * exact combination (`absoluteBreakpoint={Infinity}` +
   * `maxWidth={Infinity}`) for its two "in-contact" overlay call sites —
   * per an explicit request, that wrapper now sets this prop directly
   * instead of the two it stood in for.
   */
  overlayHeader?: boolean;

  footer?: React.ReactNode;
  /**
   * Round the corners (12px). Without `margin`: only the inner edge — the side
   * facing the main content (left corners for `side="right"`, right corners for
   * `side="left"`) — and only while the panel floats over the content (absolute
   * overlay, i.e. `isNarrow` / `overlayHeader`); a docked panel beside the
   * content stays square, and so does a full-screen one. With `margin`: all
   * four corners, in both layouts. Default: false (square, as before).
   */
  rounded?: boolean;
  /**
   * Jump to full screen automatically once the panel is dragged past 90% of
   * its container's width, by dragging wider or the container shrinking (default:
   * false — opt-in, nothing changes for existing consumers). Works with or
   * without a maximum width. Once
   * full-screen, the header shows an exit (minimize) button even when
   * `allowFullScreen` is off; exiting restores a width just under 90% so the
   * panel doesn't immediately jump again.
   */
  autoFullScreen?: boolean;
  /**
   * Inset the panel 12px from every edge of its container (a floating-card
   * look) instead of sitting flush against them. Default: false (flush, as
   * before) and draws the border on all four sides instead of just the inner
   * edge. Applies to both the docked and overlay layouts; none while
   * closed or full-screen, where the panel has no width or covers its whole
   * container.
   */
  margin?: boolean;
  /**
   * Drop shadow under the floating card. Only applies together with `margin`
   * (default: false). With `margin` on and this off, the overlay layout's usual
   * shadow is removed too, so the card is flat; without `margin` the panel
   * looks exactly as before.
   */
  shadow?: boolean;
  /** Where the footer's buttons sit: `"left"`, `"right"` (default) or `"full"` (every button stretches equally). Forwarded to `ContainerFooter`'s `align`. */
  footerAlign?: ContainerFooterAlign;
  /** Show a border along the top edge of the footer (default: false). Forwarded to `ContainerFooter`'s `bordered`. */
  footerBordered?: boolean;
  /** Shadow above the footer while content scrolls behind it (default: true, as before). Forwarded to `ContainerFooter`'s `scrollShadow`. */
  footerScrollShadow?: boolean;
  /** Fade the content out into the footer while it scrolls behind it, instead of a hard edge. Forwarded to `ContainerFooter`'s `scrollFade`; when on, `footerScrollShadow` and `footerBordered` are ignored (default: false). */
  footerScrollFade?: boolean;
}

const InteriorPanel = React.forwardRef<HTMLDivElement, InteriorPanelProps>(
  (
    {
      className,
      side = "right",
      open = true,
      onClose,
      closeIcon,
      resizable = true,
      minWidth = 350,
      maxWidth: maxWidthProp,
      onResizeStateChange,
      onWidthChange,
      width,
      instantWidthChange = false,
      storageKey,
      headerTitle,
      headerClassName,
      headerWithoutTitle = false,
      headerSubhead,
      headerIcon,
      onBack,
      backIcon,
      headerTitleBadge,
      headerActions,
      headerTabs,
      allowFullScreen = false,
      exitFullScreenSignal,
      defaultFullScreen = false,
      onFullScreenChange,
      absoluteBreakpoint = 1440,
      containerWidth,
      overlayHeader = false,
      footer,
      rounded = false,
      autoFullScreen = false,
      margin = false,
      shadow = false,
      footerAlign,
      footerBordered = false,
      footerScrollShadow = true,
      footerScrollFade,
      children,
      ...props
    },
    ref
  ) => {
    // See `maxWidth`'s own doc comment: unconstrained by default once
    // `overlayHeader` opts the panel into always being a full overlay,
    // unless the consumer set an explicit cap anyway.
    const maxWidth = maxWidthProp ?? (overlayHeader ? Infinity : 425);
    // Resolution order: an explicit `width` prop always wins; otherwise a
    // previously drag-resized width remembered under `storageKey` (so it
    // survives even a full remount, e.g. navigating away and back);
    // otherwise `minWidth` — panels open at their narrowest by default (per
    // explicit request; previously `maxWidth`/fully expanded). Read once
    // via `useState(() => ...)` rather than on every render, since this
    // only matters for the very first render's initial width; after that,
    // drag state (`usePanelDragResize`'s own `dragWidth`) takes over.
    const [firstWidth] = useState(() => {
      if (width !== undefined) return width;
      const stored = storageKey ? readNumberCookie(storageKey) : null;
      return stored ?? minWidth;
    });
    // An explicit `width` stays live: the drag hook resets its own drag state when this changes (use-panel-drag-resize).
    const initialWidth = width ?? firstWidth;

    // Full-screen state lives up here (not next to the toggle further down) so
    // the drag callback below can flip it for `autoFullScreen`.
    const [isFullScreen, setIsFullScreen] = useState(defaultFullScreen);
    const isFullScreenRef = useRef(defaultFullScreen);
    isFullScreenRef.current = isFullScreen;
    // `onFullScreenChange`: reports each flip (not the mount value).
    const onFullScreenChangeRef = useRef(onFullScreenChange);
    onFullScreenChangeRef.current = onFullScreenChange;
    const reportedFullScreenRef = useRef(defaultFullScreen);
    useEffect(() => {
      if (reportedFullScreenRef.current === isFullScreen) return;
      reportedFullScreenRef.current = isFullScreen;
      onFullScreenChangeRef.current?.(isFullScreen);
    }, [isFullScreen]);
    const parentWidthRef = useRef(9999);
    const autoEnteredRef = useRef(false);

    const [isResizing, setIsResizing] = useState(false);
    const handleResizeStateChange = useCallback((r: boolean) => {
      setIsResizing(r);
      onResizeStateChange?.(r);
    }, [onResizeStateChange]);
    const handleWidthChange = useCallback((w: number) => {
      if (storageKey) setCookie(storageKey, String(w));
      onWidthChange?.(w);
      // `autoFullScreen`: past 90% of the container with no max width → full screen.
      if (
        autoFullScreen &&
        !isFullScreenRef.current &&
        w >= parentWidthRef.current * 0.9
      ) {
        autoEnteredRef.current = true;
        setIsFullScreen(true);
      }
    }, [storageKey, onWidthChange, autoFullScreen, maxWidth]);
    const { width: currentWidth, onMouseDown, onKeyDown: onResizeKeyDown, setWidth } = usePanelDragResize(
      side, initialWidth, minWidth, maxWidth, handleResizeStateChange, handleWidthChange
    );

    // Keep border visible during the close animation so it doesn't snap away
    const [isClosing, setIsClosing] = useState(false);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => {
      if (!open) {
        setIsClosing(true);
        closeTimerRef.current = setTimeout(() => setIsClosing(false), 260);
      } else {
        clearTimeout(closeTimerRef.current);
        setIsClosing(false);
      }
      return () => clearTimeout(closeTimerRef.current);
    }, [open]);

    /* ── Go absolute/overlay when the parent container is < absoluteBreakpoint
       (default 1440px), instead of squeezing the main content column
       further — was 1024px (matching SidePanel's own pin-guard threshold,
       admin-shell.tsx / AgentNextGenTemplate; 1050px before that); raised
       after testing wider values in agent-next-gen-v2, so this is no longer
       tied to SidePanel's own threshold. See `absoluteBreakpoint`'s own doc
       comment for why this is now a per-consumer prop rather than always
       this one hardcoded value. ── */
    const outerRef = useRef<HTMLDivElement>(null);
    const [measuredParentWidth, setParentWidth] = useState(9999);
    // `containerWidth`, when given, stands in for the measured parent (see that prop's own doc comment).
    const parentWidth = containerWidth ?? measuredParentWidth;
    parentWidthRef.current = parentWidth;
    // `overlayHeader` short-circuits this to permanently true — see that
    // prop's own doc comment for why (equivalent to `absoluteBreakpoint`
    // being `Infinity`, just named for the consumer's actual intent).
    const isNarrow = overlayHeader || parentWidth < absoluteBreakpoint;

    const stableOuterRef = useCallback((el: HTMLDivElement | null) => {
      (outerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const measuresParent = containerWidth === undefined;
    useLayoutEffect(() => {
      const el = outerRef.current?.parentElement;
      if (!el || !measuresParent) return;
      setParentWidth(el.getBoundingClientRect().width);
      const ro = new ResizeObserver(([entry]) => setParentWidth(entry.contentRect.width));
      ro.observe(el);
      return () => ro.disconnect();
    }, [measuresParent]);

    // Full-screen toggle (see `allowFullScreen`'s own doc comment above) —
    // self-contained, not controlled from outside. Deliberately NOT reset
    // when the panel closes: closing while full-screen and reopening later
    // should come back full-screen, the same way a resized width is
    // remembered across a close/reopen (just per-mount rather than via a
    // `storageKey` cookie) — confirmed as the wanted behavior over
    // "always reopens at the pre-full-screen size."

    // `exitFullScreenSignal` escape hatch (see its own doc comment above) —
    // skips the very first render (a `ref` instead of state/`useEffect`'s
    // dependency-array-only comparison, so passing an initial non-
    // `undefined` value doesn't itself force an exit before the panel has
    // ever been toggled into full-screen) and calls `setIsFullScreen(false)`
    // whenever the value actually changes afterward. Harmless no-op when
    // the panel isn't currently full-screen (`setIsFullScreen(false)` when
    // it's already `false` is a bailed-out no-render, same "unchanged
    // value" React behavior any other `useState` setter has).
    const prevExitFullScreenSignalRef = useRef(exitFullScreenSignal);
    useEffect(() => {
      if (exitFullScreenSignal !== prevExitFullScreenSignalRef.current) {
        setIsFullScreen(false);
      }
      prevExitFullScreenSignalRef.current = exitFullScreenSignal;
    }, [exitFullScreenSignal]);

    // Full-screen toggling snaps the width instantly rather than sliding
    // through the normal 250ms `widthTransition` below (per explicit
    // request — full screen should happen immediately on click, not
    // animate into place). The render where `isFullScreen` actually FLIPS
    // is the one that needs the instant jump, in both directions (entering
    // AND exiting); every other render — a drag-resize, or the panel's own
    // open/close slide — should still use the normal animated transition.
    // Tracked with a ref rather than comparing inline against a plain
    // variable, since we need "did THIS render change the value" rather
    // than "is it currently true," and a plain `useEffect` (not
    // `useLayoutEffect`) is enough because the ref only needs to catch up
    // before the NEXT render, not before this one paints.
    const prevIsFullScreenRef = useRef(isFullScreen);
    const fullScreenJustToggled = prevIsFullScreenRef.current !== isFullScreen;
    useEffect(() => {
      prevIsFullScreenRef.current = isFullScreen;
    });
    const widthTransition = isResizing || fullScreenJustToggled || instantWidthChange
      ? "none"
      : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)";

    // Shown when `allowFullScreen` is on, and also while full-screen regardless
    // (e.g. after an `autoFullScreen` jump) so there's always a way back out.
    const fullScreenToggle = allowFullScreen || isFullScreen ? (
      <Tooltip content={isFullScreen ? "Exit full screen" : "Full screen"} placement="bottom" asLabel>
        <button
          type="button"
          aria-label={isFullScreen ? "Exit full screen" : "Full screen"}
          onClick={() => {
            // Leaving an auto full-screen jump: restore a width just under the
            // 90% threshold, or the panel would jump straight back in.
            if (isFullScreen && autoEnteredRef.current) {
              autoEnteredRef.current = false;
              setWidth(Math.min(maxWidth, Math.max(minWidth, Math.floor(parentWidth * 0.9) - 1)));
            }
            if (!isFullScreen) autoEnteredRef.current = false; // manual entry
            setIsFullScreen((v) => !v);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lyra-sm text-lyra-fg-action hover:bg-lyra-state-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
        >
          {isFullScreen ? (
            <Minimize2 className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Maximize2 className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          )}
        </button>
      </Tooltip>
    ) : null;

    // Dragging a width that's currently clamped to the full measured
    // container width doesn't mean anything, so the handle disappears while
    // full-screen — it comes back at whatever width was active before, once
    // toggled back off.
    const dragHandle = resizable && open && !isFullScreen ? (
      <div
        onMouseDown={onMouseDown}
        // Keyboard-operable "window splitter" (WCAG 2.1.1): focusable,
        // arrow keys resize — see usePanelDragResize's onKeyDown.
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panel"
        aria-valuenow={Math.round(currentWidth)}
        aria-valuemin={minWidth}
        aria-valuemax={maxWidth}
        tabIndex={0}
        onKeyDown={onResizeKeyDown}
        className="absolute top-0 bottom-0 z-10 flex items-center justify-center group focus-visible:outline-none"
        style={{ [side === "right" ? "left" : "right"]: -4, width: 8, cursor: "col-resize" }}
      >
        {/* Full-height edge line, blue (active border) on hover — same affordance as SidePanel/Draggable. */}
        <div
          className={`absolute inset-y-0 ${side === "right" ? "left-1/2" : "right-1/2"} w-0.5 bg-transparent group-hover:bg-lyra-border-active group-focus-visible:w-1 group-focus-visible:bg-lyra-border-focus transition-colors`}
          aria-hidden="true"
        />
      </div>
    ) : null;

    // `currentWidth` (px, from drag-resize state) clamped to the measured
    // `parentWidth` — the panel never renders wider than the space its
    // parent container actually has, even mid-drag or at its default
    // minWidth/maxWidth (previously unclamped, which could overflow past
    // the panel's own container edge when nested inside another narrow
    // container, e.g. the docked Customer Information panel). While
    // full-screen (`isFullScreen`), this is simply `parentWidth` itself —
    // a literal `"100%"` on this panel's `position: absolute` wrapper
    // resolves against the nearest positioned ancestor, which isn't
    // necessarily the same element `parentWidth` measures, so it could
    // bleed wider than the actual container too. Every place that sizes
    // off `currentWidth` needs to read this instead, not just the
    // outermost shell (`inner`'s own width, and the left-side
    // absolute-positioning wrapper further down, would otherwise still cap
    // content at the pre-full-screen px width inside an outer shell that's
    // already gone full width, leaving empty space instead of actually
    // filling it).
    const displayWidth: number | string = isFullScreen ? parentWidth : Math.min(currentWidth, parentWidth);

    // The container shrinking can push the panel past 90% of it too, not just dragging.
    useEffect(() => {
      if (
        autoFullScreen && open && !isFullScreen &&
        currentWidth >= parentWidth * 0.9
      ) {
        autoEnteredRef.current = true;
        setIsFullScreen(true);
      }
    }, [autoFullScreen, open, isFullScreen, currentWidth, parentWidth]);

    const inner = (
      <div
        className="relative flex flex-col h-full"
        style={{ width: displayWidth, minWidth: displayWidth }}
      >
        {dragHandle}
        {/* Snap content invisible on close (no squish); fade in on open */}
        <div
          className="flex flex-col flex-1 min-h-0"
          style={{
            opacity: open ? 1 : 0,
            visibility: open ? "visible" : "hidden",
            transition: open ? "opacity 150ms ease 30ms" : "none",
          }}
        >
          {/* Without a title the header is omitted unless `headerWithoutTitle` opts in. */}
          {(headerTitle || (headerWithoutTitle && (headerSubhead || headerIcon || headerTitleBadge || headerActions || headerTabs || onBack || onClose || fullScreenToggle))) && (
            <ContainerHeader
              title={headerTitle}
              subhead={headerSubhead}
              icon={headerIcon}
              onBack={onBack}
              backIcon={backIcon}
              titleBadge={headerTitleBadge}
              actions={<>{headerActions}{fullScreenToggle}</>}
              tabs={headerTabs}
              onClose={onClose}
              closeIcon={closeIcon}
              bordered={false}
              className={headerClassName}
            />
          )}
          <PanelContent>{children}</PanelContent>
          <ContainerFooterSlot
            content={footer}
            align={footerAlign}
            bordered={footerBordered}
            scrollShadow={footerScrollShadow}
            scrollFade={footerScrollFade}
          />
        </div>
      </div>
    );

    // 12px inset on all sides; h-[calc(100%-24px)] makes room for the vertical
    // margin, and the absolute layout's offsets move from 0 to 12px.
    const inset = margin && !isFullScreen && (open || isClosing);
    const cardShadow = inset ? (shadow ? "shadow-lg" : "shadow-none") : "";
    const dockedMargin = inset ? "m-3 h-[calc(100%-24px)]" : "";
    const overlayMargin = inset ? (side === "right" ? "top-3 right-3 h-[calc(100%-24px)]" : "top-3 left-3 h-[calc(100%-24px)]") : "";
    // Keep border visible during close animation so it doesn't snap away
    const border = (open || isClosing)
      ? (inset ? "border border-lyra-border-subtle" : side === "right" ? "border-l border-lyra-border-subtle" : "border-r border-lyra-border-subtle")
      : "";
    const interiorWidth: number | string = open ? displayWidth : 0;
    const pos = side === "right" ? "right-0" : "left-0";
    // Literal class strings so Tailwind's content scanner finds them.
    // With `margin` the panel is a floating card, so `rounded` rounds all four
    // corners in either layout; without it, only the inner edge and only in the
    // overlay layout (a flush, docked panel stays square).
    const cardRadius = rounded && inset ? "rounded-[12px]" : "";
    const radius = cardRadius || (rounded && !isFullScreen ? (side === "right" ? "rounded-l-[12px]" : "rounded-r-[12px]") : "");

    // Overlay instead of pushing the main content column: the parent
    // container is genuinely too narrow to squeeze further (`isNarrow`,
    // <1440px), or the panel is full-screen (`isFullScreen`, user-triggered
    // via `allowFullScreen`'s toggle) — same mechanism either way
    // (`position: absolute`, covering whatever's beside it rather than
    // requiring that sibling to shrink out of the way), just a different
    // trigger. See `allowFullScreen`'s own doc comment for why full-screen
    // deliberately reuses this instead of needing its own separate layout
    // branch.
    if (isNarrow || isFullScreen) {
      return (
        <div
          ref={stableOuterRef}
          className={cn("absolute top-0 z-[5] h-full overflow-hidden bg-lyra-bg-surface-overlay shadow-lg", pos, border, radius, overlayMargin, cardShadow, className)}
          style={{ width: interiorWidth, transition: widthTransition }}
          {...props}
        >
          {inner}
        </div>
      );
    }

    return (
      <div
        ref={stableOuterRef}
        className={cn("relative flex flex-col h-full bg-lyra-bg-surface-overlay shrink-0", border, cardRadius, dockedMargin, cardShadow, className)}
        style={{
          width: interiorWidth,
          minWidth: 0,
          overflow: "hidden",
          transition: widthTransition,
        }}
        {...props}
      >
        {/* Left-side interior: align content to right edge during animation */}
        {side === "left"
          ? <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: displayWidth, minWidth: displayWidth }}>{inner}</div>
          : inner
        }
      </div>
    );
  }
);
InteriorPanel.displayName = "InteriorPanel";

export { InteriorPanel };
