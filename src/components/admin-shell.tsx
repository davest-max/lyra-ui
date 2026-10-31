import { useState, useRef, useEffect } from "react";
import { SidePanel } from "./side-panel";
import { useSidePanelToggle } from "./use-side-panel-toggle";
import { InteriorPanel } from "./interior-panel";
import { PageHeader, type PageHeaderBreadcrumb } from "./page-header";
import { TreeMenu, type TreeMenuItem } from "./tree-menu";
import { cn } from "../lib/utils";
import { MAIN_CONTENT_ID } from "./skip-link";

/* ── Cookie helpers (left-panel pinned state only — mirrors the pattern
   already used by OutboundEngagementPage / DesktopDesignsPage) ── */
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
}
function readBoolCookie(name: string, fallback: boolean): boolean {
  const val = getCookie(name);
  if (val === "true") return true;
  if (val === "false") return false;
  return fallback;
}

export interface AdminShellProps {
  /** Cookie key prefix for the left panel's pinned state, e.g. "lyra_outbound" or "lyra_panel". */
  storageKeyPrefix: string;
  /** Label shown in both side panels' header (e.g. "Outbound", "Designer"). */
  navTitle: string;
  /** Left nav tree items. */
  navItems: TreeMenuItem[];
  /**
   * Forces the internal `TreeMenu` to fully remount when this value
   * changes (passed straight through as its `key`) — needed whenever
   * `navItems` can swap between entirely different datasets at the same
   * page (e.g. Monitor's "Call Centers" vs. "Service Groups" view
   * switcher, via `navHeaderBadge`). Without this, `TreeMenu`'s rows track
   * their own open/closed state via `useState(item.defaultOpen ?? false)`
   * initialized once per component instance — if the dataset changes but
   * `TreeMenu` itself doesn't remount, React's index-based reconciliation
   * reuses each row's existing instance (and its stale open state) for
   * whatever new item now lands at that same index, even though the new
   * item's own `defaultOpen` says otherwise. Omit when `navItems` is the
   * one fixed dataset every other `AdminShell` page has.
   */
  navKey?: React.Key;
  /**
   * Rendered inline immediately after `navTitle` in the left panel's own
   * header row (forwarded to `SidePanel`'s `headerTitleBadge`) — e.g. a
   * view-switcher trigger (a bare chevron opening a small `Select` of view
   * options) sitting right next to the nav title text, for a page whose
   * left tree can show more than one dataset (Outbound-Campaigns' Monitor
   * dashboard: "Call Centers" vs. "Service Groups"). Omit for the plain
   * title-only header every other `AdminShell` page uses.
   */
  navHeaderBadge?: React.ReactNode;
  /**
   * Forwarded to the left panel's `TreeMenu` — makes selection exact (no
   * parent-active cascade, any selected row at any depth gets the same
   * background pill) instead of the default cascading-parent-active
   * behavior every other `AdminShell` left nav uses. Off by default so
   * existing consumers are unaffected; only turn this on for a tree meant
   * to have exactly one selected row at a time, at any depth. See
   * `TreeMenu`'s own `exactSelection` doc comment (tree-menu.tsx).
   */
  navExactSelection?: boolean;
  /** Pinned state to fall back to before the cookie is read. */
  defaultLeftPinned?: boolean;

  /** Renders the PageHeader row. Off for the bare "Shell" template. */
  showPageHeader?: boolean;
  pageTitle?: string;
  /**
   * Caption shown below `pageTitle` (forwarded to `PageHeader`'s
   * `subtitle`) — e.g. the Monitor dashboard's "Call Centers"/"Service
   * Groups" category label under its static "Monitor" title. Omit for a
   * plain title with no caption, same as every other `AdminShell` page.
   */
  pageSubtitle?: string;
  pageBadge?: string;
  pageActions?: React.ReactNode;
  /**
   * Parent breadcrumb(s) shown before `pageTitle`, e.g. `{ label: "Forms",
   * onClick: goBackToList }` — passed straight through to PageHeader's own
   * `breadcrumb` prop (see page-header.tsx), which renders "ParentName /
   * Title" (or a full multi-crumb trail for an array). Omit for a plain
   * title with no trail, same as before this prop existed.
   */
  pageBreadcrumb?: PageHeaderBreadcrumb | PageHeaderBreadcrumb[];

  /**
   * Interior (in-content) detail panel. Left fully controlled by the
   * consumer since it's usually opened from inside `children` (e.g. a
   * TableToolbar button) rather than by the shell itself.
   */
  interiorPanelTitle?: string;
  interiorPanelOpen?: boolean;
  onInteriorPanelClose?: () => void;
  interiorPanelContent?: React.ReactNode;

  /** Right side panel content — mirrors the left nav panel. */
  rightPanelContent?: React.ReactNode;

  /** Main content, rendered below the PageHeader. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * AdminShell — shared page template for admin-style CRUD/config screens
 * (left nav-tree side panel, PageHeader, main content, interior detail
 * panel, right side panel). Extracted from the Outbound Engagement page;
 * also used by Agent Workspace Premium's Designer page and (per an
 * explicit "every new page should be in AdminShell" directive)
 * Outbound-Campaigns' Monitor dashboard.
 *
 * Every new page in a consuming app should render this rather than
 * hand-rolling its own root layout/side panel/page header — that already
 * happened once (Monitor dashboard originally built its own `SidePanel` +
 * `PageHeader` + pin/hover/narrow-container-guard wiring from scratch
 * instead of reaching for this), duplicating everything `AdminShell`
 * already owns. `navHeaderBadge`/`navExactSelection`/`pageSubtitle` exist
 * specifically because that migration needed them — check whether an
 * existing `AdminShellProps` field already covers what a new page needs
 * before reaching for a one-off layout.
 *
 * See Storybook: "Templates/Admin UIs".
 */
export function AdminShell({
  storageKeyPrefix,
  navTitle,
  navItems,
  navKey,
  navHeaderBadge,
  navExactSelection = false,
  defaultLeftPinned = false,
  showPageHeader = false,
  pageTitle,
  pageSubtitle,
  pageBadge,
  pageActions,
  pageBreadcrumb,
  interiorPanelTitle = "Details",
  interiorPanelOpen = false,
  onInteriorPanelClose,
  interiorPanelContent,
  rightPanelContent,
  children,
  className,
}: AdminShellProps) {
  const pinCookieKey = `${storageKeyPrefix}_panel_pinned`;
  /* Tracks collapsed/expanded state *while pinned*, independent of the pin
     flag itself — without this, toggling the panel closed (still pinned)
     only lived in this mount's React state, so navigating to a page that
     remounts AdminShell (e.g. a list ↔ detail swap) re-derived
     `leftPanelOpen` from the pin cookie alone and snapped it back open. */
  const openCookieKey = `${storageKeyPrefix}_panel_open`;
  const mainRef = useRef<HTMLElement>(null);

  /* ── Container-width pin guard ──
     Measures this shell's own rendered width (not window.innerWidth) so
     pinning is correctly disabled any time the available space is narrow —
     whether that's a narrow browser window, a narrow Storybook canvas, or
     the content area having shrunk because something else (e.g. a docked
     AI panel) is eating width while the window itself stays wide. Mirrors
     the `isNarrowContainer` pattern used by the Agent Next Gen template. */
  const [containerWidth, setContainerWidth] = useState(9999);
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    setContainerWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const isNarrowContainer = containerWidth < 1024;

  /* ── Side panels ──
     The PageHeader toggle ↔ SidePanel wiring (hover flyout, pinned preview, keyboard open with focus-out / Escape,
     pin) is `useSidePanelToggle`. Below 1024px a panel renders unpinned (`pinDisabled`): crossing it closes the
     panel, and widening back restores it to the stored pinned state without clearing it, as the Storybook
     `SidePanelPinGuardDemo` does. The left panel's pinned state, and its open state while pinned, live in cookies so
     a remount (a list ↔ detail swap) keeps them. */
  const [leftPanelPinned, setLeftPanelPinned] = useState(() => readBoolCookie(pinCookieKey, defaultLeftPinned));
  const [leftPanelOpen, setLeftPanelOpen] = useState(() =>
    readBoolCookie(openCookieKey, readBoolCookie(pinCookieKey, defaultLeftPinned))
  );
  const effectiveLeftPinned = isNarrowContainer ? false : leftPanelPinned;
  const left = useSidePanelToggle({
    side: "left",
    open: leftPanelOpen,
    onOpenChange: (next) => {
      setLeftPanelOpen(next);
      if (effectiveLeftPinned) setCookie(openCookieKey, String(next));
    },
    pinned: leftPanelPinned,
    onPinnedChange: (next) => {
      setLeftPanelPinned(next);
      setCookie(pinCookieKey, String(next));
      setCookie(openCookieKey, String(next));
    },
    pinDisabled: isNarrowContainer,
  });
  const right = useSidePanelToggle({ side: "right", pinDisabled: isNarrowContainer });

  return (
    <main ref={mainRef} className={cn("flex flex-1 overflow-hidden bg-lyra-bg-surface-base relative animate-in fade-in-0 duration-500", className)}>

      {/* ════ Left side panel ════
          z-[8] sits between the interior panel's z-[5] and the app-level
          icon LeftNav's z-10 chevron toggle / z-20 hover-open overlay
          (see left-nav.tsx): high enough that this panel still stacks above
          the interior detail panel when both are overlays at once, but low
          enough that it never covers the icon rail's own toggle affordance. */}
      <SidePanel
        side="left"
        {...left.sidePanelProps}
        headerTitle={navTitle}
        headerTitleBadge={navHeaderBadge}
        className="z-[8] focus:outline-none"
      >
        <TreeMenu key={navKey} className="px-2" items={navItems} exactSelection={navExactSelection} />
      </SidePanel>

      {/* ════ Main content column ════ */}
      {/* `id` + `tabIndex={-1}` — the target of the left nav / side panel's "Skip to main content" link. */}
      <div id={MAIN_CONTENT_ID} tabIndex={-1} className="flex flex-col flex-1 min-h-0 overflow-hidden focus:outline-none">

        {/* ════ Page Header ════ */}
        {showPageHeader && (
          <PageHeader
            title={pageTitle ?? ""}
            subtitle={pageSubtitle}
            breadcrumb={pageBreadcrumb}
            panelToggle="left"
            badge={pageBadge}
            {...left.pageHeaderProps}
            {...right.pageHeaderProps}
            actions={pageActions}
          />
        )}

        {/* ════ Interior panels row ════
            `relative` here (not just on the outer `<main>`) matters:
            `InteriorPanel` switches to `position: absolute; top: 0; height:
            100%` below 1024px of this row's width, and without a positioned
            ancestor of its own it anchors to `<main>` instead — which
            starts at the same top edge as the PageHeader, so the panel
            renders over the header instead of below it. Scoping the
            positioned ancestor to this row keeps it confined to the area
            below the PageHeader. */}
        <div className="relative flex flex-1 min-h-0 overflow-hidden">

          {/* ════ Main content column ════ */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {children}
          </div>

          {/* Interior right panel — `storageKey` scoped by both
              `storageKeyPrefix` and `interiorPanelTitle` (not just the
              prefix alone): `FormsPage.tsx` and `FormDetailPage.tsx` share
              the same `storageKeyPrefix` on purpose (so the left panel's
              pin state stays consistent across both), but their interior
              panels are different panels ("Details" vs. "Settings") that
              need independently remembered widths, not one shared value. */}
          {interiorPanelContent !== undefined && (
            <InteriorPanel
              side="right"
              open={interiorPanelOpen}
              headerTitle={interiorPanelTitle}
              onClose={onInteriorPanelClose}
              storageKey={`${storageKeyPrefix}_interior_width_${interiorPanelTitle}`}
            >
              {interiorPanelContent}
            </InteriorPanel>
          )}

        </div>
      </div>

      {/* ════ Right side panel ════ */}
      {rightPanelContent !== undefined && (
        <SidePanel
          side="right"
          {...right.sidePanelProps}
          headerTitle={navTitle}
          className="focus:outline-none"
        >
          {rightPanelContent}
        </SidePanel>
      )}

    </main>
  );
}
