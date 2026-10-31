import * as React from "react";
import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TreeMenu, type TreeMenuItem } from "./tree-menu";
import { Tooltip } from "./tooltip";
import { cn } from "../lib/utils";
import { LEFT_NAV_EXPANDED_WIDTH, LEFT_NAV_RAIL_WIDTH } from "../lib/size-tokens";
import { SkipLink } from "./skip-link";
import { Badge } from "./badge";

/* ── Types ── */

export interface NavChild {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export interface NavItem {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  expandable?: boolean;
  defaultOpen?: boolean;
  children?: NavChild[];
  onClick?: () => void;
  /** Count badge: on the icon's top-right corner in the collapsed rail (the
   *  same overlay as `Button`'s `badge`), after the label when expanded.
   *  Hidden when 0 or unset. */
  badge?: number;
}

/** The collapsed rail's icon, with `badge` overlaid like `Button`'s. */
function NavItemIcon({ item }: { item: NavItem }) {
  if (item.badge == null || item.badge <= 0) return <span aria-hidden="true">{item.icon}</span>;
  return (
    <span className="relative inline-flex" aria-hidden="true">
      {item.icon}
      <Badge shape="circle" variant="critical" size="sm" count={item.badge} className="absolute -top-2 -right-2" />
    </span>
  );
}

/** The rail button's accessible name, with the count when there is one. */
function navItemAriaLabel(item: NavItem): string {
  return item.badge != null && item.badge > 0 ? `${item.label}, ${item.badge}` : item.label;
}

/* ── LeftNav ── */

interface LeftNavProps extends React.HTMLAttributes<HTMLElement> {
  /** Navigation items to render */
  items: NavItem[];
  /** Whether the nav is expanded or collapsed */
  open?: boolean;
  /** Called when the toggle button is clicked */
  onToggle?: () => void;
  /** Show/hide the collapse toggle button */
  collapsible?: boolean;
  /**
   * Overlay mode (narrow screens): the aside keeps a fixed 60px footprint;
   * the expanded panel slides out as an absolutely-positioned overlay.
   *
   * Defaults to `"auto"`: LeftNav tracks the window width itself and
   * switches into overlay mode below `overlayBreakpoint` — the same
   * responsive behavior the Agent Next Gen template wires up by hand
   * (`overlay={isNavNarrow}`). Pass an explicit boolean to opt out of the
   * built-in tracking and control the mode yourself (e.g. a template that
   * already tracks width for other reasons, like docked-panel handling).
   */
  overlay?: boolean | "auto";
  /**
   * Window width (px) below which `overlay="auto"` engages overlay mode.
   * 1280 matches the Agent Next Gen template's own nav breakpoint. Ignored
   * when `overlay` is an explicit boolean.
   */
  overlayBreakpoint?: number;
  /** Content pinned to the bottom of the nav rail (e.g. a CreateNew button) */
  footer?: React.ReactNode;
  /**
   * Content pinned to the very top of the nav rail, above everything else
   * — exempt from scrolling, unlike `header` below (e.g. a CreateNew
   * trigger button, which should always stay put while a long list of
   * interaction cards or nav items scrolls underneath it). Like `footer`,
   * consumers should pass their own `expanded` prop tied to `open` in
   * inline mode; overlay mode auto-injects it based on hover state.
   */
  pinnedHeader?: React.ReactNode;
  /**
   * Content rendered at the top of the scrollable item list (e.g. a list
   * of InteractionNavItem active-interaction cards) — scrolls together
   * with the nav items below it in one continuous region, rather than
   * being fixed itself. Use `pinnedHeader` instead for content that must
   * stay fixed (e.g. the CreateNew trigger). Consumers should pass their
   * own `expanded` prop tied to `open` in inline mode; overlay mode
   * auto-injects it based on hover state.
   */
  header?: React.ReactNode;
  /**
   * Renders `items` (the icon+label nav rail — Home/Settings and friends)
   * ABOVE `header` instead of below it, and switches the nav list's own
   * sticky edge from the bottom of the scroll region to the top —
   * "always visible, everything else scrolls past it" now anchors at the
   * top since the rail is first in flow, rather than at the bottom (its
   * position when it's last, the default). Off by default — every existing
   * consumer (AdminShell, the Agent Next Gen template, this component's own
   * stories) already relies on `header`'s "cards above the rail" order and
   * the rail sticking to the bottom of a long card list; this only opts a
   * caller into the opposite arrangement (e.g. a "Home"/"Settings" rail
   * with a section caption + list of cards *below* it, rather than above)
   * without changing anyone else's layout.
   */
  itemsFirst?: boolean;
  /**
   * Lets `header`'s own wrapper grow to fill whatever vertical space is
   * left in the scroll region, rather than shrink-wrapping to its content
   * (the default). Off by default — every existing consumer relies on
   * `header` sizing to its own content so the item rail (or, with
   * `itemsFirst`, whatever follows) sits directly after it with no gap.
   * Meant for a consumer that wants to vertically CENTER something inside
   * `header` (e.g. an empty-state message) when there's little enough
   * content to leave slack — centering only works if the wrapper actually
   * has that slack to distribute in the first place, which requires this
   * flag. Safe to combine with `itemsFirst`: when there's more content
   * than fits, this still just yields to the surrounding scroll region
   * (flex-grow only claims genuinely leftover space, never causes new
   * overflow on its own).
   *
   * Applies `flex-1` alone — deliberately WITHOUT `min-h-0` (see the bug
   * this caused, fixed below at both usage sites: a long list of cards
   * bunching up with no internal scrollbar at all, the whole nav growing
   * past the viewport instead). `min-h-0` would let this wrapper shrink
   * BELOW its own content's natural height whenever the scroll region runs
   * out of room — exactly the case a long card list needs the OPPOSITE
   * of: without a min-height floor, the browser happily compresses this
   * wrapper's flex-item box down to whatever space is left rather than
   * letting it, and the card list it contains, overflow — and it's that
   * overflow the surrounding `overflow-y-auto` scroll region depends on to
   * ever show a scrollbar in the first place. Leaving `min-height` at its
   * default `auto` keeps the item's automatic minimum size pinned to its
   * own content's natural height, so `flex-grow` can still expand it to
   * fill leftover space when content is light (the empty state this flag
   * was built for), while a heavy card list still refuses to shrink below
   * what it actually needs — overflowing the scroll region exactly like
   * the pre-`headerFillsHeight` `flex-shrink-0` default already did.
   */
  headerFillsHeight?: boolean;
  /**
   * Content rendered inside the SAME sticky-top box as `items` when
   * `itemsFirst` is set — directly after them, still pinned together as one
   * unit, exempt from scrolling like `items` itself (unlike `header` below
   * it, which does scroll). Built for a caption/section-header row (e.g.
   * "Assignments (N)") that a consumer wants to stay put under a pinned
   * "Home"-type item rather than scrolling away with the cards beneath it
   * — per explicit request/screenshot ("fix the assignments header under
   * the home button so it doesn't scroll").
   *
   * Only meaningful combined with `itemsFirst` (there's no sticky-top box
   * to join otherwise) — ignored when `itemsFirst` is falsy. Like `header`/
   * `footer`, a consumer should pass their own `expanded` prop tied to
   * `open` in inline mode; overlay mode auto-injects it based on hover
   * state via `injectExpanded`, same as those two.
   */
  stickyCaption?: React.ReactNode;
  /**
   * Accessible name of the item rail's `<nav>` landmark — the expanded
   * `TreeMenu` ("Navigation menu" by default) and the collapsed icon-only
   * rail ("Main navigation" by default). Optional; omit it and both keep
   * their existing names. Pass a distinct value when more than one nav
   * landmark can be on the same page (e.g. a second nav rendered through
   * `NavRail` in `footer`, "Channels") so screen-reader users can tell
   * them apart (axe `landmark-unique`). Not the same as `aria-label`, which
   * still names the outer `<aside>`.
   */
  navAriaLabel?: string;
  /**
   * Renders a "Skip to main content" link as the nav's first tab stop —
   * invisible until a keyboard user tabs onto it, then Enter jumps focus
   * straight to the main content (WCAG 2.4.1 bypass blocks), so they needn't
   * tab through every nav item first. Default `true`; pass `false` if the
   * page provides its own skip link.
   */
  skipToMain?: boolean;
  /** `id` of the main content element the skip link targets (default `"main-content"`; falls back to the page's `<main>`). */
  skipToMainTargetId?: string;
}

/**
 * Clone `expanded` onto every top-level element inside `node` — used to
 * auto-inject overlay mode's `hoverOpen` into `header`/`footer`. Consumers
 * commonly pass more than one element (e.g. a `CreateNew` button plus a
 * list of `InteractionNavItem` cards) wrapped in a `<>...</>` fragment.
 * `React.isValidElement`/`cloneElement` treat a fragment as a single
 * element and clone the fragment itself, which doesn't forward props to
 * its children — so a bare `cloneElement(node, { expanded })` silently
 * no-ops for fragment children. This unwraps one level of fragment first,
 * then clones each real child, so both a single element and a
 * multi-element fragment get `expanded` applied correctly.
 */
function injectExpanded(node: React.ReactNode, expanded: boolean): React.ReactNode {
  const children =
    React.isValidElement(node) && node.type === React.Fragment
      ? (node.props as { children?: React.ReactNode }).children
      : node;

  return React.Children.map(children, (child) =>
    React.isValidElement(child)
      ? React.cloneElement(child as React.ReactElement<{ expanded?: boolean }>, { expanded })
      : child
  );
}

/** Convert NavItem[] → TreeMenuItem[] so TreeMenu can render them */
function toTreeItems(items: NavItem[]): TreeMenuItem[] {
  return items.map((item) => ({
    icon: item.icon,
    label: item.label,
    active: item.active,
    badge: item.badge,
    defaultOpen: item.defaultOpen,
    onClick: item.onClick,
    children: item.expandable ? item.children : undefined,
  }));
}

const LeftNav = React.forwardRef<HTMLElement, LeftNavProps>(
  (
    {
      className,
      items,
      open = true,
      onToggle,
      collapsible = true,
      overlay = "auto",
      overlayBreakpoint = 1280,
      footer,
      pinnedHeader,
      header,
      itemsFirst = false,
      headerFillsHeight = false,
      stickyCaption,
      navAriaLabel,
      skipToMain = true,
      skipToMainTargetId,
      ...props
    },
    ref
  ) => {
    const treeItems = useMemo(() => toTreeItems(items), [items]);
    // Spread only when set: passing `aria-label={undefined}` would override
    // TreeMenu's own "Navigation menu" default, since props spread last.
    const navLabelProps = navAriaLabel ? { "aria-label": navAriaLabel } : undefined;

    /* `overlay="auto"` (the default): track window width internally and
       engage overlay mode below `overlayBreakpoint`. Only wired up in auto
       mode — an explicit boolean skips the listener entirely. SSR-safe:
       starts at Infinity (inline mode) until a real window width is read. */
    const [viewportWidth, setViewportWidth] = useState(() =>
      typeof window === "undefined" ? Number.POSITIVE_INFINITY : window.innerWidth
    );
    useEffect(() => {
      if (overlay !== "auto") return;
      const onResize = () => setViewportWidth(window.innerWidth);
      onResize();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, [overlay]);
    const effectiveOverlay =
      overlay === "auto" ? viewportWidth < overlayBreakpoint : overlay;

    // Hover-open state used in overlay mode
    const [hoverOpen, setHoverOpen] = useState(false);
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const onHoverStart = useCallback(() => {
      clearTimeout(hoverTimer.current);
      setHoverOpen(true);
    }, []);
    const onHoverEnd = useCallback(() => {
      hoverTimer.current = setTimeout(() => setHoverOpen(false), 300);
    }, []);

    const toggleButton = collapsible ? (
      <Tooltip content={open ? "Collapse sidebar" : "Expand sidebar"} placement="right" asLabel>
        <button
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          className={cn(
            // `z-[600]`, not `z-30` — per a further explicit bug report
            // (agent-next-gen-v3's `AgentWorkspaceAdvancedPage`), this
            // button's `-right-3` offset hangs it slightly past LeftNav's
            // own right edge, into the main content column beside it — and
            // once that column's "View customer info" `InteriorPanel`
            // overlay needed to clear a `Popover`'s own `z-50` default (see
            // that overlay's own `z-[500]` doc comment,
            // AgentWorkspaceAdvancedPage.tsx), its full-width overlay
            // started painting over this button in that shared sliver
            // whenever it was open, even though this button sits outside
            // that content column's own layout box. This toggle must stay
            // reachable regardless of whatever panel/overlay the content
            // column has open next to it — same "never hidden behind
            // ANYTHING it happens to sit beside" principle already
            // established for this same app's own toast stack (see that
            // z-index's own doc comment) — so `600` clears that overlay
            // with real headroom rather than trading one narrow miss for
            // another. Was `z-30` before that (raised from `z-10`, per the
            // ORIGINAL bug report below) — still clears every z-index this
            // file's own rails use (topping out at `z-20`), just no longer
            // enough once a content-column overlay elsewhere started using
            // a triple-digit tier of its own.
            //
            // Original `z-10` → `z-30` bug report: this button was
            // rendering UNDER the sticky Home/`stickyCaption` rail
            // (`itemsFirst` branch below, and its mirrored `!itemsFirst`
            // sticky-bottom rail) whenever the two visually overlapped.
            // Both rails are `relative z-20 ... sticky` — themselves an
            // explicit-z-index fix for a DIFFERENT overlap (see that class's
            // own doc comment) — so this button's old `z-10` lost to their
            // `z-20` even though it's positioned and DOM-later, since
            // explicit z-index always wins over a lower one regardless of
            // DOM order.
            "absolute -right-3 top-[25px] z-[600] flex h-5 w-5 items-center justify-center rounded-full border border-lyra-border-soft bg-lyra-bg-surface-base text-lyra-fg-secondary shadow-sm hover:bg-lyra-bg-surface-shell transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
            // Fixed regardless of `header` — this button must stay aligned
            // with the page's PageHeader row (an external, constant-height
            // sibling elsewhere in the layout), not shift based on whatever
            // content happens to be first inside `header`.
          )}
        >
          {open ? (
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
          )}
        </button>
      </Tooltip>
    ) : null;

    // No `overflow`/`flex-1` of its own — this list shares one scroll
    // region with `header` (see the scroll wrapper in both render branches
    // below), rather than owning its own separate scrollbar. `flex-shrink-0`
    // on both the `<nav>` and each item guards against the rail's items
    // compressing their spacing to fit when content overflows instead of
    // scrolling — the bug this replaced (see left-nav.tsx's git history/
    // PROJECT_SUMMARY.md for the reference screenshot).
    const iconOnlyNav = (
      <nav aria-label={navAriaLabel ?? "Main navigation"} className="flex flex-shrink-0 flex-col gap-0.5 items-center">
        {items.map((item, i) => {
          const isActive =
            item.active ||
            (item.children && item.children.some((c) => c.active));
          return (
            // `relative w-9` — matching the button's own `h-9 w-9` exactly,
            // not `w-full`/`justify-center`, and centered within the nav
            // rail via the parent `<nav>`'s `items-center`. `<nav>` has no
            // explicit width, so its default flex cross-axis behavior
            // stretches it to fill the rail's full content width (44px,
            // after the rail's own `px-2`); a `w-full` row here used to
            // inherit that same 44px against the button's 36px, leaving a
            // ~4px gap between the absolutely-positioned `left-0` active bar
            // and the button itself instead of sitting flush against it.
            // Sizing the row to the button's own width removes that gap
            // regardless of the rail's actual width (e.g. with vs. without
            // a `header`) — see the "active bar detached from collapsed nav
            // item" incident in PROJECT_SUMMARY.md.
            <div key={i} className="relative flex w-9 flex-shrink-0 justify-center">
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-lyra-state-hover-primary"
                />
              )}
              <Tooltip content={item.label} placement="right" asLabel>
                <button
                  onClick={item.onClick}
                  aria-label={navItemAriaLabel(item)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lyra-sm transition-colors",
                    // `focus-visible:z-10` — the ring sits outside the button and a
                    // LATER sibling (e.g. the selected item's filled background)
                    // would otherwise paint over its bottom edge.
                    "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
                    isActive
                      ? "bg-lyra-bg-active-moderate text-lyra-fg-active-strong"
                      : "text-lyra-fg-default hover:bg-lyra-state-hover active:bg-lyra-state-pressed"
                  )}
                >
                  <NavItemIcon item={item} />
                </button>
              </Tooltip>
            </div>
          );
        })}
      </nav>
    );

    // Whether the shared scroll region (`header` cards + the sticky nav
    // rail) actually has anything scrolling at all — per explicit report,
    // the sticky rail's own "soft fade instead of a hard edge" (below, both
    // branches) used to render unconditionally, so with few enough cards to
    // fit without scrolling, the fade still overlaid the last visible
    // card's bottom edge even though nothing was actually hidden/scrolling
    // underneath it to indicate. Gated on this instead: `false` (no fade)
    // whenever the content fits without overflowing, `true` once there's
    // enough to actually scroll.
    //
    // Only ONE ref/state pair, shared by both the overlay- and inline-mode
    // branches below — they're mutually exclusive returns (never both
    // mounted at once), so whichever branch is active just attaches this
    // same ref to its own copy of the scroll container.
    //
    // Deliberately `scrollHeight > clientHeight`, not one of
    // `useScrollChevrons`' own `canScrollStart`/`canScrollEnd` booleans
    // (scroll-chevron.tsx, used elsewhere in this library for a similar-
    // looking affordance) — those answer "is there more content PAST THE
    // CURRENT SCROLL POSITION," which is exactly right for a chevron button
    // that should disappear once you've scrolled as far as it points, but
    // wrong here: this fade's job is only to signal "this list can scroll
    // at all," and disappearing again once scrolled all the way to the
    // bottom would just reintroduce the same "fades over content with
    // nothing left to hide" report this fix exists for, at the opposite
    // end of the list instead of the near end.
    //
    // Recomputed two ways: the effect's own dependency array (`header`/
    // `items`/`open`/`hoverOpen` — whatever can actually change how much
    // content is rendered or how much room it has) catches content/layout
    // changes driven by props, and the `ResizeObserver` on the scroll
    // container itself catches anything a prop change wouldn't (e.g. a
    // bare browser window resize changing the rail's own available
    // height) — content growing/shrinking alone doesn't resize the
    // scroll container's own box (it's a fixed-height flex child,
    // `flex-1 min-h-0`), which is exactly why the dependency array half of
    // this still matters and the ResizeObserver alone wouldn't be enough.
    const listScrollRef = useRef<HTMLDivElement>(null);
    const [listHasOverflow, setListHasOverflow] = useState(false);
    useEffect(() => {
      const el = listScrollRef.current;
      if (!el) return;
      const update = () => setListHasOverflow(el.scrollHeight > el.clientHeight + 1);
      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [header, items, open, hoverOpen]);

    /* ── Overlay mode (narrow screens): hover to open, no toggle button ── */
    if (effectiveOverlay) {
      return (
        <aside
          ref={ref}
          aria-label="Main navigation"
          className={cn("relative z-10 flex-shrink-0 overflow-visible bg-lyra-bg-surface-shell w-[var(--lyra-size-left-nav-rail-width)]", className)}
          onMouseEnter={onHoverStart}
          onMouseLeave={onHoverEnd}
          {...props}
        >
          {skipToMain && <SkipLink targetId={skipToMainTargetId} />}
          {/* Sliding panel: 60px footprint when closed, 256px overlay when open */}
          <div
            className="absolute left-0 top-0 bottom-0 flex flex-col bg-lyra-bg-surface-shell overflow-hidden"
            style={{
              width: hoverOpen ? LEFT_NAV_EXPANDED_WIDTH : LEFT_NAV_RAIL_WIDTH,
              zIndex: hoverOpen ? 20 : 10,
              transition: "width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: hoverOpen ? "4px 0 12px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {pinnedHeader && (
              // No top padding here — the pinned header's first item (e.g.
              // CreateNew) should sit flush with the rail's top edge,
              // top-aligned with the container itself rather than inset to
              // match the nav list. Exempt from scrolling, unlike `header`
              // below (see the scroll wrapper's own comment).
              //
              // `pb-1` (4px) while collapsed (`!hoverOpen`) — per explicit
              // request/reference screenshot: with no `header` content
              // above it to add its own top inset (icon-rail mode has none
              // visible), the collapsed "+" icon (e.g. CreateNew) sat flush
              // against the Home icon directly below it with zero gap.
              // Expanded mode is untouched — its own spacing wasn't
              // reported as a problem, so left alone rather than changing
              // both to stay "consistent" when only one was actually asked
              // to change.
              <div className={cn("flex-shrink-0 flex flex-col items-center px-2 pt-0", hoverOpen ? "gap-2" : "gap-1 pb-1")}>
                {injectExpanded(pinnedHeader, hoverOpen)}
              </div>
            )}
            {/* `header` (e.g. InteractionNavItem cards) and the nav item
                list share one scrollable region — the nav list stays in
                its normal flow position right after `header`'s content
                (no artificial gap when there are only one or two cards),
                but is `position: sticky; bottom: 0`, so once a long list
                of cards would otherwise push it below the visible rail, it
                sticks to the bottom of the scroll viewport instead and the
                cards keep scrolling underneath/behind it (see the
                reference screenshot in PROJECT_SUMMARY.md — the nav items
                scrolled out of view entirely before this; an earlier fix
                pinned them to the bottom *unconditionally*, which the user
                caught as wrong too — it left a large empty gap above them
                whenever there were only a few cards, since "sticky", not
                "always pinned regardless of content", is what was asked
                for). Needs an opaque background so scrolled-under cards
                don't show through the nav items' icons/labels. */}
            <div className="relative flex flex-1 flex-col overflow-hidden min-h-0">
              <div ref={listScrollRef} className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden lyra-scrollbar-hide min-h-0">
                {/* No `gap` here — `header` (InteractionNavItem cards) supplies its own
                    bottom margin per item (see InteractionNavItem), so spacing only
                    appears when there's a real card to space out. Order (and which edge
                    the rail sticks to) flips with `itemsFirst` — see its own doc comment. */}
                {itemsFirst && (
                  <div
                    className={cn(
                      // `relative z-20` — see the inline-mode branch's own
                      // copy of this rail (below, `header`'s sibling in the
                      // default render) for the full "cards painting over
                      // this rail" bug writeup; same fix, same reasoning,
                      // just this mode's own copy.
                      //
                      // `pt-0 pb-1` — per explicit request/devtools
                      // screenshot, replacing the previous `pt-1`/no-pb-
                      // when-`header`-present combination. See the
                      // inline-mode branch's own copy of this rail for the
                      // fuller writeup (including why the old 4px gap under
                      // `pinnedHeader` is intentionally gone now).
                      "relative z-20 flex flex-shrink-0 flex-col bg-lyra-bg-surface-shell px-2 pt-0 pb-1 sticky top-0",
                      hoverOpen ? "items-stretch" : "items-center"
                    )}
                  >
                    {hoverOpen ? <TreeMenu items={treeItems} {...navLabelProps} /> : iconOnlyNav}
                    {/* `stickyCaption` — see the inline-mode branch's own
                        copy of this rail for the full writeup; same
                        technique, same reasoning, just this mode's own
                        copy. `injectExpanded`, matching `header`/`footer`/
                        `pinnedHeader`'s own overlay-mode treatment above. */}
                    {stickyCaption && injectExpanded(stickyCaption, hoverOpen)}
                  </div>
                )}
                {header && (
                  <div
                    className={cn(
                      "flex flex-col px-2",
                      // See `headerFillsHeight`'s own doc comment — off by
                      // default (shrink-wrap to content, the original
                      // behavior every other consumer still relies on).
                      // `flex-1` ONLY, no `min-h-0` — see that comment's
                      // own note on why `min-h-0` here breaks a long card
                      // list's ability to overflow/scroll.
                      headerFillsHeight ? "flex-1" : "flex-shrink-0",
                      hoverOpen ? "items-stretch" : "items-center",
                      // See the inline-mode branch's own copy of this line
                      // for the full "bottom reserved padding for the fade,
                      // no top padding" writeup; same change, same
                      // reasoning.
                      itemsFirst && "pb-8",
                      // `pt-1` (4px) when `header` leads the scroll region
                      // (`!itemsFirst`) — a focus ring is drawn OUTSIDE the
                      // control (2px ring + 2px offset = 4px), and this
                      // region's `overflow-y-auto` / wrapper `overflow-hidden`
                      // clip anything past their padding edge, so a focusable
                      // control (e.g. a SearchInput) sitting flush at the top
                      // had the top of its ring cut off. Exactly the ring's
                      // reach, not a design gap (cf. the oversized `pt-8`
                      // reverted below) — `itemsFirst` has the rail above, not
                      // `header`, so it needs no inset.
                      !itemsFirst && "pt-1"
                    )}
                  >
                    {injectExpanded(header, hoverOpen)}
                  </div>
                )}
                {!itemsFirst && (
                  <div className={cn("relative z-20 sticky bottom-0 flex flex-shrink-0 flex-col bg-lyra-bg-surface-shell px-2 pb-3", !header && "pt-3")}>
                    {/* Soft fade instead of a hard edge — per explicit
                        request, same technique used elsewhere for content
                        scrolling underneath a fixed/sticky bar (a solid-to-
                        transparent gradient overlaying the scrolled content
                        rather than the rail's opaque background just
                        cutting it off). `-top-8` places it outside this
                        div's own box, extending up into whatever `header`
                        content (e.g. nav cards) is scrolling underneath the
                        rail, rather than adding empty space inside the
                        rail itself. Gradient runs transparent at the top
                        down to solid (matching the rail's own background)
                        at the bottom, so it blends into the rail exactly
                        where the hard edge used to be.

                        `listHasOverflow &&` — per explicit follow-up
                        report, this used to render unconditionally, so a
                        short list that fits without ever needing to scroll
                        still had this fade cutting across the bottom of
                        its last visible card, even though nothing was
                        actually scrolling underneath the rail to indicate.
                        See `listHasOverflow`'s own doc comment above for
                        how it's computed.

                        `relative z-20` — see the `itemsFirst` rail above
                        for the "cards painting over this rail" bug
                        writeup; mirrored here for the same reason. */}
                    {listHasOverflow && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-b from-transparent to-lyra-bg-surface-shell"
                      />
                    )}
                    {hoverOpen ? <TreeMenu items={treeItems} {...navLabelProps} /> : iconOnlyNav}
                  </div>
                )}
              </div>
              {/* New bottom-of-viewport fade — `itemsFirst` only. See the
                  inline-mode branch's own copy of this fade for the full
                  writeup; same technique, same reasoning, just this mode's
                  own copy. */}
              {itemsFirst && listHasOverflow && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-8 bg-gradient-to-b from-transparent to-lyra-bg-surface-shell"
                />
              )}
            </div>
            {footer && (
              <div className="flex-shrink-0 flex items-center justify-center px-2 pb-3">
                {injectExpanded(footer, hoverOpen)}
              </div>
            )}
          </div>
        </aside>
      );
    }

    /* ── Default (inline) mode ── */
    return (
      <aside
        ref={ref}
        aria-label="Main navigation"
        className={cn(
          "relative z-10 flex h-full flex-shrink-0 flex-col overflow-visible bg-lyra-bg-surface-shell transition-all duration-200",
          open ? "w-[var(--lyra-size-left-nav-width)]" : "w-[var(--lyra-size-left-nav-rail-width)]",
          className
        )}
        {...props}
      >
        {skipToMain && <SkipLink targetId={skipToMainTargetId} />}
        {toggleButton}

        {pinnedHeader && (
          // Same reasoning as the overlay branch above: flush to the top,
          // no pt-3 inset, so the pinned header's first item (CreateNew) is
          // top-aligned with the rail itself. Exempt from scrolling — see
          // the scroll wrapper's own comment below. `pb-1` while collapsed
          // — see the overlay-mode branch above for the full explanation;
          // same change, same reasoning, just this mode's own copy.
          <div className={cn("flex-shrink-0 flex flex-col items-center px-2 pt-0", open ? "gap-2" : "gap-1 pb-1")}>
            {pinnedHeader}
          </div>
        )}

        {/* Scroll wrapper — overflow-hidden + min-h-0 on the outer div constrains height so
            overflow-y-auto on the inner div triggers. The aside keeps overflow-visible for
            the toggle button that pokes out; this wrapper sits as a sibling to that button.
            `header` (e.g. InteractionNavItem cards) and the nav item list share one
            scrollable region — the nav list stays in its normal flow position right after
            `header`'s content (no artificial gap when there are only one or two cards), but
            is `position: sticky; bottom: 0`, so once a long list of cards would otherwise
            push it below the visible rail, it sticks to the bottom of the scroll viewport
            instead and the cards keep scrolling underneath/behind it (see the reference
            screenshot in PROJECT_SUMMARY.md — the nav items scrolled out of view entirely
            before this; an earlier fix pinned them to the bottom *unconditionally*, which the
            user caught as wrong too — it left a large empty gap above them whenever there
            were only a few cards, since "sticky", not "always pinned regardless of content",
            is what was asked for). Needs an opaque background so scrolled-under cards don't
            show through the nav items' icons/labels. */}
        <div className="relative flex flex-1 flex-col overflow-hidden min-h-0">
          <div ref={listScrollRef} className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden lyra-scrollbar-hide min-h-0">
            {/* No `gap` here — `header`'s items (InteractionNavItem cards) carry their own
                bottom margin, so an empty-but-truthy `header` (e.g. a Fragment wrapping a
                zero-length `.map()`) contributes zero visible space instead of a phantom gap
                before the nav list below. Order (and which edge the rail sticks to) flips
                with `itemsFirst` — see its own doc comment. */}
            {itemsFirst && (
              <div
                className={cn(
                  // `z-20` — per explicit bug report, scrolled
                  // `InteractionNavItem` cards were painting OVER this rail
                  // instead of staying hidden behind it. Root cause: a card
                  // can contain its own `position: relative` descendant deep
                  // inside it (e.g. channel-row.tsx's hover-only Consult/
                  // Transfer/Outcome button cluster, `<span className=
                  // "relative ...">`) — `position: relative` with the
                  // default `z-index: auto` doesn't create a new stacking
                  // context, so that descendant (and anything else like it)
                  // is promoted straight into `<aside>`'s own single shared
                  // stacking context (created by ITS `relative z-10`),
                  // painted in tree order alongside every other positioned
                  // element in it — including this rail (`sticky` is also a
                  // "positioned" value). Since this rail is EARLIER in the
                  // DOM (itemsFirst puts it before `header`'s cards) but a
                  // card's own nested positioned descendant is LATER in tree
                  // order, tree order alone let the descendant paint on top
                  // whenever the two visually overlapped during a scroll.
                  // An explicit `z-index` sidesteps tree order entirely —
                  // `z-20` only has to beat the default `z-index: auto`
                  // (effectively 0) every one of those nested positioned
                  // descendants uses, so this rail now always wins
                  // regardless of DOM order. Mirrored below on the
                  // `!itemsFirst` sticky-bottom rail for the same reason,
                  // even though only this arrangement was actually reported.
                  //
                  // `pt-0 pb-1` — per explicit request/devtools screenshot,
                  // replacing the previous `pt-1`/no-pb-when-`header`-
                  // present combination. `pt-1` used to open a small 4px
                  // gap under `pinnedHeader` (e.g. "New Outbound") — gone
                  // now, Home sits flush against it instead, per the same
                  // request. `pb-1` is new: a small 4px gap between this
                  // box's own content (now Home + `stickyCaption`, below)
                  // and the scrolling cards underneath it.
                  "relative z-20 flex flex-shrink-0 flex-col bg-lyra-bg-surface-shell px-2 pt-0 pb-1 sticky top-0",
                  open ? "items-stretch" : "items-center"
                )}
              >
                {open ? <TreeMenu items={treeItems} {...navLabelProps} /> : iconOnlyNav}
                {/* `stickyCaption` — per explicit follow-up request ("fix
                    the assignments header under the home button so it
                    doesn't scroll"): a consumer's section caption (e.g.
                    `AssignmentsSectionCaption`) used to be the first child
                    of `header` below — in normal flow, scrolling away with
                    the cards under it exactly like they do. Rendering it
                    HERE instead, inside this same sticky box as `items`,
                    keeps it pinned together with Home as one unit — it
                    only has to be a sibling in DOM order for `position:
                    sticky`'s own "stick to the top of the nearest
                    scrolling ancestor" behavior to just work; no extra
                    positioning of its own needed. No `injectExpanded` here
                    (this is the inline-mode branch) — a consumer passes
                    its own `expanded` prop directly, same established
                    pattern `header`/`footer` already use inline (see
                    `footer`'s own doc comment for why relying on injection
                    inline specifically caused a real bug once). */}
                {stickyCaption}
                {/* Top fade removed per explicit follow-up request. It had
                    briefly existed here (re-added alongside `stickyCaption`
                    to mirror the bottom-rail fade below) but the `pt-8`
                    reserved-space buffer it depended on had already been
                    reverted (see `header`'s own wrapper className below),
                    and was called out again directly: "remove the top
                    fade." The bottom-of-scroll-viewport fade (`!itemsFirst`
                    branch below, and its own copy further down this file)
                    is unaffected — only this top one, under the sticky
                    Home/`stickyCaption` rail, was removed. */}
              </div>
            )}
            {header && (
              <div
                className={cn(
                  "flex flex-col px-2",
                  // See `headerFillsHeight`'s own doc comment — see the
                  // overlay-mode branch above for the full explanation;
                  // same flag, same reasoning, just this mode's own copy.
                  // `flex-1` ONLY, no `min-h-0` — see that comment's own
                  // note on why `min-h-0` here breaks a long card list's
                  // ability to overflow/scroll.
                  headerFillsHeight ? "flex-1" : "flex-shrink-0",
                  open ? "items-stretch" : "items-center",
                  // `pb-8` — reserved padding below this wrapper, sized to
                  // match the bottom fade's own 32px (`h-8`) height exactly,
                  // so an always-on fade (not scroll-position aware, see the
                  // top fade's own comment above) never lands on a real
                  // card's own edge — only ever on this reserved, otherwise-
                  // invisible space.
                  //
                  // No `pt-8`-sized top padding here (reverted per explicit request —
                  // the `pt-8` tried briefly alongside `stickyCaption`
                  // moving the caption out of `header` created a visibly
                  // oversized gap above the first card/empty-state block).
                  // `header`'s own first child goes back to sitting flush
                  // against the top of the scroll region, same as before
                  // `stickyCaption` existed; the top fade (gated on
                  // `listHasOverflow`, rendered on the sticky rail above,
                  // not on this wrapper) can in principle touch that first
                  // child's very top edge now, but it's a soft gradient, not
                  // a hard line, so this trade-off was accepted as the
                  // better one.
                  itemsFirst && "pb-8",
                  // `pt-1` — see the overlay-mode branch's copy of this line
                  // for why (focus-ring clearance at the top of the scroll
                  // region; 4px = ring + offset, not a visual gap).
                  !itemsFirst && "pt-1"
                )}
              >
                {header}
              </div>
            )}
            {!itemsFirst && (
              <div className={cn("relative z-20 sticky bottom-0 flex flex-shrink-0 flex-col bg-lyra-bg-surface-shell px-2 pb-3", !header && "pt-3")}>
                {/* Soft fade instead of a hard edge — see the overlay-mode
                    branch above for the full explanation (including
                    `listHasOverflow`, gating this the same way here); same
                    technique, same reasoning, just this mode's own copy of
                    the rail. `relative z-20` — see this same rail's `z-20`
                    note in the `itemsFirst` branch above; mirrored here for
                    the same "don't let a card's own nested positioned
                    descendant paint over this rail" reason, even though only
                    the `itemsFirst` arrangement was actually reported. */}
                {listHasOverflow && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-b from-transparent to-lyra-bg-surface-shell"
                  />
                )}
                {open ? <TreeMenu items={treeItems} {...navLabelProps} /> : iconOnlyNav}
              </div>
            )}
          </div>
          {/* New bottom-of-viewport fade — `itemsFirst` only. Unlike the
              `!itemsFirst` arrangement above, where `items` itself is a
              sticky rail sitting right at the scroll region's bottom edge
              (carrying its own fade, unchanged), `itemsFirst` moves Home to
              the TOP and Settings out of the scroll region entirely (into
              `footer`, a sibling AFTER this whole wrapper) — so the scroll
              region's bottom edge has no sticky rail of its own to anchor a
              fade to anymore, just the raw `overflow-hidden` clip edge of
              this non-scrolling wrapper. Attached here (not inside
              `listScrollRef`) specifically so it stays fixed at the visible
              viewport edge rather than scrolling away with the list — this
              wrapper's own `relative` (added above) is what lets it anchor
              to that. `z-20`, same reasoning as the two rails' own z-index
              note above. Gated on `listHasOverflow` (not scroll-position —
              same established convention) and paired with `header`'s own
              `pb-8` reserved space above so it never lands on the last
              card's real bottom edge, only that reserved padding. */}
          {itemsFirst && listHasOverflow && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-8 bg-gradient-to-b from-transparent to-lyra-bg-surface-shell"
            />
          )}
        </div>
        {footer && (
          <div className="flex-shrink-0 flex items-center justify-center px-2 pb-3">
            {footer}
          </div>
        )}
      </aside>
    );
  }
);
LeftNav.displayName = "LeftNav";

/**
 * Renders a `NavItem[]` the exact way `LeftNav`'s own item rail does — a
 * full `TreeMenu` when `expanded`, single icon-only buttons (with
 * tooltips + the same active-bar treatment) when collapsed. Exported so a
 * consumer can render an ADDITIONAL nav row matching the rail's own
 * styling somewhere OTHER than the `items` prop — e.g. inside `footer`, so
 * a single item (Settings, say) can be genuinely pinned to the true
 * bottom of the aside (outside the scrollable region entirely, per
 * `footer`'s own doc comment) while `items` holds a different item (Home,
 * say) positioned elsewhere via `itemsFirst`. Pass it straight to
 * `footer` — `injectExpanded` already clones the right `expanded` value
 * onto it in both overlay and inline mode, same as it does for any other
 * `footer` content, so there's no need to read `open`/`hoverOpen`
 * yourself. Deliberately a separate, independent copy of `LeftNav`'s own
 * internal icon-only rendering (not a shared extraction) — keeps this a
 * zero-risk addition that can't affect `LeftNav`'s own existing rail
 * rendering for any other consumer.
 */
const NavRail = React.forwardRef<
  HTMLElement,
  {
    items: NavItem[];
    expanded?: boolean;
    className?: string;
    /** Optional accessible name for this rail's `<nav>` ("Navigation menu" expanded / "Navigation" collapsed by default) — set it when another nav landmark shares the page. */
    navAriaLabel?: string;
  }
>(
  ({ items, expanded = false, className, navAriaLabel }, ref) => {
    if (expanded) {
      return (
        <TreeMenu
          ref={ref}
          items={toTreeItems(items)}
          className={cn("w-full", className)}
          {...(navAriaLabel ? { "aria-label": navAriaLabel } : undefined)}
        />
      );
    }
    return (
      <nav
        ref={ref}
        aria-label={navAriaLabel ?? "Navigation"}
        className={cn("flex w-full flex-shrink-0 flex-col gap-0.5 items-center", className)}
      >
        {items.map((item, i) => {
          const isActive =
            item.active || (item.children && item.children.some((c) => c.active));
          return (
            <div key={i} className="relative flex w-9 flex-shrink-0 justify-center">
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-lyra-state-hover-primary"
                />
              )}
              <Tooltip content={item.label} placement="right" asLabel>
                <button
                  onClick={item.onClick}
                  aria-label={navItemAriaLabel(item)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lyra-sm transition-colors",
                    // `focus-visible:z-10` — the ring sits outside the button and a
                    // LATER sibling (e.g. the selected item's filled background)
                    // would otherwise paint over its bottom edge.
                    "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
                    isActive
                      ? "bg-lyra-bg-active-moderate text-lyra-fg-active-strong"
                      : "text-lyra-fg-default hover:bg-lyra-state-hover active:bg-lyra-state-pressed"
                  )}
                >
                  <NavItemIcon item={item} />
                </button>
              </Tooltip>
            </div>
          );
        })}
      </nav>
    );
  }
);
NavRail.displayName = "NavRail";

export { LeftNav, NavRail };
export type { LeftNavProps };
