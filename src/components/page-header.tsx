import * as React from "react";
import { PanelLeft, PanelRight } from "lucide-react";
import { Tooltip } from "./tooltip";
import { Badge } from "./badge";
import type { BadgeColor, BadgePillVariant } from "./badge";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbEllipsis } from "./breadcrumb";
import { cn } from "../lib/utils";

interface PageHeaderBreadcrumb {
  /** Parent page label */
  label: string;
  /** Click handler for the parent link */
  onClick?: () => void;
  /** Opt-in: renders the crumb as a real `<a href>` link (see `BreadcrumbLink`'s `href`). */
  href?: string;
}

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Page title text */
  title: string;
  /**
   * Leading icon rendered before the title, with a vertical divider between
   * them by default (see `iconDivider` to drop it) — switches the header
   * into a "record header" layout (icon | title stacked above `subtitle`),
   * for pages about a specific customer, agent, case, etc. rather than a
   * static section title. Mutually exclusive with `breadcrumb` — when both
   * are passed, `icon` takes precedence.
   */
  icon?: React.ReactNode;
  /**
   * Set `false` to drop the vertical divider `icon` renders between itself
   * and the title block — for an `icon` that already reads as a complete,
   * self-contained unit (e.g. a colored circle avatar shell built from
   * `Icon`'s own `background`/`shape="circle"`, icon.tsx) rather than a
   * bare glyph that needs the divider to visually separate it from the
   * text next to it. Per explicit request (agent-next-gen-v2's own
   * interaction record header, once its `icon` became exactly that kind of
   * circle avatar) — default `true` (the divider lyra-ui's own `PageHeader`
   * "Record Header" story demonstrates) keeps every existing bare-icon
   * consumer unchanged. No effect when `icon` isn't set.
   */
  iconDivider?: boolean;
  /**
   * Arbitrary content rendered immediately after the title/subtitle block
   * (before `actions`) — e.g. a compact `ChannelToggleGroup` distinguishing
   * which of an interaction's several open channels is current, sitting
   * directly right of the customer name. Was `titlePrefix` (rendered
   * before the title instead) until an explicit request to flip the
   * order — renamed along with the move since "prefix" would otherwise be
   * actively wrong once it's rendering after. Unlike `icon`, this doesn't
   * add its own divider or switch the header into the "record header"
   * layout — it's just an extra flex item in the same left-side row, so it
   * composes with any of the three title layouts (plain/`icon`/
   * `breadcrumb`) rather than being mutually exclusive with them. Renders
   * once regardless of which title layout is active. Add your own visual
   * divider inside this slot's own content if you want one (see
   * `agent-next-gen-v1`'s usage) — this prop doesn't render one itself,
   * since not every consumer will want the same treatment.
   */
  titleSuffix?: React.ReactNode;
  /**
   * Lets `titleSuffix`'s own wrapper grow to fill whatever width is left in
   * the header row (between the title block and `actions`), instead of its
   * default `shrink-0` (content-sized, snug against the title). Off by
   * default — a compact cluster like a `ChannelToggleGroup` should stay
   * snug against the title rather than stretching away from it (see
   * `titleSuffix`'s own doc comment for why `shrink-0` is the default in
   * the first place). Turn this on when `titleSuffix` instead holds
   * something built to size itself off its own available width, e.g. a
   * `TabList` — `Tab`'s 48px-tall row/bottom-border design collapses into
   * its 2-slot "active + N More" layout (or worse, visibly clips/squishes)
   * almost immediately when confined to a `shrink-0` sliver next to the
   * title, since `TabList`'s own internal `w-full` then has almost nothing
   * real to fill. Confirmed via screenshot: a single-channel `ChannelTab`
   * cluster in `titleSuffix` rendering as a disjointed icon + orphaned
   * kebab + stray underline fragment instead of a real tab.
   */
  titleSuffixGrow?: boolean;
  /**
   * Vertical alignment/placement of `titleSuffix` against the header row —
   * `"center"` (default) renders it as a sibling AFTER the whole
   * title+subtitle block, centered against that block's full height (the
   * original/every-other-existing-consumer behavior); `"start"` renders it
   * INSIDE the title row itself instead — a real DOM sibling of the `<h1>`
   * (and `badge`, if passed), right after them and before `subtitle` — so it
   * sits flush against the title's own line, directly beside the title and
   * above `subtitle`, rather than drifting down toward the middle of the
   * taller title+subtitle block once a subtitle is present. Per explicit
   * follow-up requests for `AgentDashboardHeader`'s "Personal Queue" chip
   * ("directly to the right of the page header and above the subhead", then
   * "put the span after the h1 inside the parent div"). Only takes effect
   * on the `icon`/plain title branches, which share that title-row shape —
   * a `breadcrumb` header falls back to the `"center"` branch's placement
   * (still top-aligned via CSS there, just not structurally inline; see
   * this component's own "trade-off" comment further down). Scoped to this
   * one prop rather than changing the shared default, since every other
   * `titleSuffix` consumer (e.g. `agent-next-gen-v1`'s `ChannelToggleGroup`)
   * already relies on the centered, after-block behavior.
   */
  titleSuffixAlign?: "center" | "start";
  /**
   * Whether the `icon` slot's wrapper span is `aria-hidden` (default: true).
   * The wrapper is hidden from assistive tech by default because `icon` is
   * normally purely decorative — set this to `false` when `icon` itself is
   * or contains a real interactive control (e.g. a `PanelPinButton`), since
   * `aria-hidden` on an ancestor removes the whole subtree from the
   * accessibility tree regardless of the control's own `aria-label`.
   */
  iconAriaHidden?: boolean;
  /**
   * Secondary line rendered under the title. With `icon`, this pairs with
   * the leading icon (record header layout). Without `icon`/`breadcrumb`
   * (the plain title branch), it still renders under the title as a plain
   * caption — e.g. a category label like "CALL CENTERS" under a section
   * title — just without the icon/divider treatment. In the `breadcrumb`
   * branch it renders as the same caption directly under the breadcrumb trail.
   */
  subtitle?: React.ReactNode;
  /** Actions rendered on the right side (buttons, icons, etc.) */
  actions?: React.ReactNode;
  /**
   * Which panel toggle(s) to show:
   * - "left"  — outer panel toggle (PanelLeft icon, before the title)
   * - "right" — inner panel toggle (PanelRight icon, after actions)
   * - "both"  — both toggles
   */
  panelToggle?: "left" | "right" | "both";
  /** Called when the left (outer) panel toggle is activated — a click when pinned, or a keyboard / assistive-tech activation (Enter, Space, screen-reader click) when unpinned. A mouse click when unpinned is ignored: the panel opens on hover there. */
  onPanelToggle?: () => void;
  /** Whether the outer panel is pinned — controls click vs hover behavior */
  panelPinned?: boolean;
  /** Called when hovering over the outer panel toggle (unpinned mode) */
  onPanelHoverStart?: () => void;
  /** Called when hover leaves the outer panel toggle (unpinned mode) */
  onPanelHoverEnd?: () => void;
  /** Called when the right (inner) panel toggle is clicked */
  onInnerPanelToggle?: () => void;
  /** Whether the outer (left) panel is currently open — exposed as `aria-expanded` on the "Toggle left panel" button. Omit and no `aria-expanded` is rendered (previous behavior). */
  panelOpen?: boolean;
  /** `id` of the outer (left) panel element — exposed as `aria-controls` on the "Toggle left panel" button. */
  panelControlsId?: string;
  /** Whether the inner (right) panel is currently open — exposed as `aria-expanded` on the "Toggle right panel" button. Omit and no `aria-expanded` is rendered. */
  innerPanelOpen?: boolean;
  /** `id` of the inner (right) panel element — exposed as `aria-controls` on the "Toggle right panel" button. */
  innerPanelControlsId?: string;
  /** Called when hovering over the right panel toggle (unpinned mode) */
  onInnerPanelHoverStart?: () => void;
  /** Called when hover leaves the right panel toggle (unpinned mode) */
  onInnerPanelHoverEnd?: () => void;
  /**
   * Count badge on the left (outer) panel toggle's top-right corner, as `Button`'s own `badge` (hidden when 0 or
   * undefined) — e.g. how many items wait in the panel the toggle opens. The count isn't part of the accessible
   * name: say it in `panelToggleLabel` when it matters.
   */
  panelToggleBadge?: number;
  /** The left (outer) panel toggle's accessible name and tooltip (default "Toggle left panel"), e.g. a translated or more specific label. */
  panelToggleLabel?: string;
  /** The right (inner) panel toggle's accessible name and tooltip (default "Toggle right panel"). */
  innerPanelToggleLabel?: string;
  /**
   * Parent breadcrumb(s) — renders "ParentName / Title" for a single crumb,
   * or "ParentA / ParentB / … / Title" when passed an array for a deeper
   * trail. Composed from the shared `Breadcrumb` parts (see breadcrumb.tsx)
   * rather than a one-off `<nav>`.
   */
  breadcrumb?: PageHeaderBreadcrumb | PageHeaderBreadcrumb[];
  /** Optional badge displayed inline after the title */
  badge?: string;
  /** Badge color — defaults to "green" */
  badgeColor?: BadgeColor;
  /** Badge variant — defaults to "subtle" */
  badgeVariant?: BadgePillVariant;
  /**
   * Whether the row draws its own `border-b` (default: `true`). Turn off
   * for a header sitting directly above content that already establishes
   * its own visual separation right underneath it (e.g. a tab row, or a
   * session/record separator with its own divider) — per explicit
   * request, for a record header like agent-next-gen-v2's interaction
   * view, where the channel tab row / session separator directly below
   * already draws its own line, this header's own border just doubled it
   * up into two parallel lines with an odd, empty-looking gap between
   * them.
   */
  bordered?: boolean;
  /**
   * Shrinks the row from its default `min-h-[68px]`/`py-4` (sized for a
   * default `lg` Button, 36px tall, in `actions`) down to `min-h-[54px]`
   * with the BOTTOM padding removed (top padding unchanged) — per explicit
   * request, for a record header whose own `actions` never grow past a
   * smaller icon-sized control and which sits directly above other
   * tightly-packed content (see `bordered`'s own doc comment for the same
   * "sits directly above other content" reasoning). Off by default — every
   * other existing consumer keeps the taller, evenly-padded default row.
   */
  compact?: boolean;
  /**
   * Title's own heading size — default `"lg"` (`.lyra-heading-lg`, 20px/
   * 600), the tier every existing consumer (record headers, section
   * titles) already renders at. Set to `"2xl"` (`.lyra-heading-2xl`,
   * 28px/700 — the same tier `DashboardCard`'s own metric numbers use, see
   * that class's own doc comment in lyra-tokens.css) for a header that
   * needs to read as a large standalone greeting/stat rather than a
   * page/record title — per explicit request, agent-next-gen-v2's
   * dashboard "Good {period}, {name}" greeting. Applies to the `<h1>` in
   * every title layout (`icon`/`breadcrumb`/plain) so it's consistent
   * regardless of which one a given consumer happens to use.
   */
  titleSize?: "lg" | "2xl";
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      className,
      title,
      icon,
      iconDivider = true,
      titleSuffix,
      titleSuffixGrow = false,
      titleSuffixAlign = "center",
      iconAriaHidden = true,
      subtitle,
      actions,
      panelToggle,
      onPanelToggle,
      panelPinned = true,
      onPanelHoverStart,
      onPanelHoverEnd,
      onInnerPanelToggle,
      panelOpen,
      panelControlsId,
      innerPanelOpen,
      innerPanelControlsId,
      onInnerPanelHoverStart,
      onInnerPanelHoverEnd,
      panelToggleBadge,
      panelToggleLabel = "Toggle left panel",
      innerPanelToggleLabel = "Toggle right panel",
      breadcrumb,
      badge,
      badgeColor = "green",
      badgeVariant = "subtle",
      bordered = true,
      compact = false,
      titleSize = "lg",
      ...props
    },
    ref
  ) => {
    // `titleSuffixAlign="start"` (see that prop's own doc comment) renders
    // `titleSuffix` INSIDE the title row itself — right after the title/
    // `badge`, before `subtitle` — instead of as a sibling of the whole
    // title+subtitle block, so it sits literally next to the `<h1>` in the
    // DOM rather than just visually top-aligned via CSS. Only the `icon`/
    // plain branches share that title-row shape; `breadcrumb` doesn't (see
    // its own "trade-off" comment below), so a `breadcrumb` header with
    // `titleSuffixAlign="start"` still falls back to the after-block
    // placement (still top-aligned via `self-start` below, just not
    // structurally inline).
    const usesBreadcrumbBranch = !icon && !!breadcrumb;
    const suffixInline = titleSuffixAlign === "start" && !!titleSuffix && !usesBreadcrumbBranch;
    const titleSuffixSpan = titleSuffix ? (
      <span
        className={cn(
          "lyra-page-header-suffix",
          titleSuffixGrow ? "flex-1 min-w-0" : "shrink-0",
          titleSuffixAlign === "start" && "self-start"
        )}
      >
        {titleSuffix}
      </span>
    ) : null;
    return (
    // Outer wrapper is the actual `container-type: inline-size` query
    // container (`.lyra-page-header-container`, lyra-tokens.css) — every
    // `@container` rule below styles the INNER row (`.lyra-page-header-
    // suffix-wrap`) as a genuine descendant of it, never the query
    // container element itself. This split exists specifically because a
    // CSS query container can't restyle ITS OWN box based on its own
    // measured size (only descendants) — confirmed live: an earlier pass
    // put `container-type` directly on this same bordered/padded row and
    // tried to flip ITS OWN `flex-direction` to `column` once narrow, and
    // the `@container` rule silently never matched anything (no ancestor
    // container existed for it to resolve against), so the intended
    // "actions wraps below the title" layout never took effect at all.
    // `ref`/`...props` (and `className`) land on this outer wrapper — it's
    // the real DOM root `React.forwardRef`'s consumers get back — rather
    // than the inner row, so nothing behavioral about what `ref` points to
    // changes for any future consumer.
    <div ref={ref} className={cn("lyra-page-header-container", className)} {...props}>
      <div
        className={cn(
          // min-h-[68px] = py-4 (32px) + a default (`lg`) Button's own 36px
          // height — the tallest thing this row's `actions` slot typically
          // holds. Without a fixed floor, the row's real height shrinks to
          // just the title text whenever `actions` is empty/removed, which
          // shifts the title vertically relative to any external sibling
          // that assumes a constant PageHeader height (e.g. LeftNav's own
          // toggle button, positioned via a hardcoded `top` offset — see its
          // doc comment). Kept as a min-height, not a fixed height, so a
          // future taller `actions` element can still grow the row.
          "lyra-page-header-suffix-wrap flex items-center justify-between px-6",
          // `compact` — see that prop's own doc comment. `pt-4 pb-0` keeps
          // the same top inset the default `py-4` already has, dropping
          // only the bottom half — a plain `py-0`/`p-0` would also yank the
          // title away from the top edge, not just close the gap below it.
          compact ? "min-h-[54px] pt-4 pb-0" : "min-h-[68px] py-4",
          // `bordered` — see that prop's own doc comment.
          bordered && "border-b border-lyra-border-subtle",
          // Scopes the container-query wrap/align-self behavior below
          // (lyra-tokens.css) to consumers that actually pass `titleSuffix` —
          // see that CSS block's own doc comment for why: it exists so
          // `titleSuffix` content (e.g. a `ChannelToggleGroup`) can drop to
          // its own row under the title once space gets tight, with
          // `actions` re-pinned top-right against just the title's own line
          // rather than sinking toward the middle of the now-taller
          // title+wrapped-suffix block. Without `titleSuffix`, the title
          // block only ever renders its own normal one-or-two-line
          // title/subtitle stack (never a wrapped THIRD thing pushing it
          // taller the way `titleSuffix` does) — so there's nothing for
          // `actions` to need re-pinning against, and letting the query fire
          // anyway just top-aligns `actions` for no reason the moment this
          // header's own width crosses 768px, independent of anything about
          // actually running out of room (confirmed live: agent-next-gen-v2's
          // record header, which has no `titleSuffix`, saw its own
          // `actions` buttons jump from centered to top-aligned against the
          // title at that same width, with nothing on the left side actually
          // wrapping to explain it).
          titleSuffix && "lyra-page-header-has-suffix"
        )}
      >
      <div className="lyra-page-header-left flex flex-1 min-w-0 items-center gap-3">
        {(panelToggle === "left" || panelToggle === "both") && (
          <>
            {/* Hover reaches the consumer while unpinned (the flyout) and while pinned but closed (SidePanel's
                `preview`); a pinned, open panel has nothing to reveal. */}
            <div
              onMouseEnter={!panelPinned || panelOpen === false ? onPanelHoverStart : undefined}
              onMouseLeave={!panelPinned || panelOpen === false ? onPanelHoverEnd : undefined}
            >
              <Tooltip content={panelToggleLabel} placement="right" asLabel>
                <button
                  onClick={(e) => {
                    // Pinned: every click toggles. Unpinned: the panel is a hover
                    // flyout (`onMouseEnter` on the wrapper above), so a MOUSE click
                    // must stay a no-op — hover already opened it, and toggling would
                    // shut it. A keyboard / assistive-tech activation (Enter, Space,
                    // screen-reader click — all `detail === 0`) has no hover, so it
                    // toggles the flyout; without this Enter did nothing when unpinned.
                    if (panelPinned || e.detail === 0) onPanelToggle?.();
                  }}
                  aria-label={panelToggleLabel}
                  aria-expanded={panelOpen}
                  aria-controls={panelControlsId}
                  className="flex h-8 w-8 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary transition-colors hover:bg-lyra-state-hover active:bg-lyra-state-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
                >
                  {/* The badge as `Button`'s own (button.tsx): a critical circle on the icon's top-right corner. */}
                  <span className="relative inline-flex">
                    <PanelLeft className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                    {panelToggleBadge != null && panelToggleBadge > 0 && (
                      <Badge shape="circle" variant="critical" size="sm" count={panelToggleBadge} className="absolute -top-2 -right-2" />
                    )}
                  </span>
                </button>
              </Tooltip>
            </div>
            <div className="h-5 w-px bg-lyra-border-subtle" />
          </>
        )}
        {/* Each of the three branches below used to carry its own `flex-1`
            (claiming the outer row's — this div's parent, `flex flex-1
            min-w-0 items-center gap-3` — leftover space directly). Dropped
            in favor of `min-w-0` alone once `titleSuffix` shipped: a
            flex-1 title column with nothing else competing for space
            stretches to fill the whole row regardless of how short the
            title text actually is (text still just left-aligns inside
            that oversized box), so `titleSuffix` rendered right after it
            would sit wherever that box happened to end, not snug against
            the text — confirmed from a screenshot of exactly that, the
            toggle group floating at the row's far right next to `actions`
            instead of directly after "Noah Bennett". A lone child of the
            parent's own `flex-1` doesn't need its own flex-grow to reach
            the same rendered width when `titleSuffix` is absent, and
            default flex-shrink (with `min-w-0`) still lets each branch's
            `truncate` work exactly as before. */}
        {icon ? (
          <>
            <span
              className="flex items-center justify-center text-lyra-fg-default shrink-0"
              aria-hidden={iconAriaHidden ? "true" : undefined}
            >
              {icon}
            </span>
            {iconDivider && <div className="h-8 w-px bg-lyra-border-subtle shrink-0" />}
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className={cn(titleSize === "2xl" ? "lyra-heading-2xl" : "lyra-heading-lg", "text-lyra-fg-default leading-tight truncate min-w-0")}>{title}</h1>
                {badge && <Badge color={badgeColor} variant={badgeVariant}>{badge}</Badge>}
                {suffixInline && titleSuffixSpan}
              </div>
              {subtitle && <span className="lyra-body-sm text-lyra-fg-secondary truncate">{subtitle}</span>}
            </div>
          </>
        ) : breadcrumb ? (
          // Two `Breadcrumb` instances, both always rendered — CSS (see
          // `.lyra-page-header-breadcrumb-wrap` in lyra-tokens.css/
          // storybook.css) toggles between them once this slot's own width
          // drops to 480px or below, collapsing every parent crumb into a
          // single ellipsis trigger (its popover lists them all, per
          // BreadcrumbEllipsis's `items` prop) so the current-page title
          // truncates on one line instead of the trail wrapping onto a
          // second one. Same DOM-swap technique TabList's `overflowMenu`
          // uses for `.lyra-tab-overflow-full`/`-collapsed`.
          //
          // Unlike the `icon`/plain title branches (see the comment above
          // this ternary explaining why THEY dropped `flex-1`), this wrap
          // needs `flex-1` — it's a `container-type: inline-size` container,
          // which implies size containment: the browser is barred from
          // using this box's content to compute its own width. As a
          // flex-grow:0 item, that leaves nothing to size it from, so it
          // collapses to a 0px container and permanently matches the
          // `@container (max-width: 480px)` collapsed rule, no matter how
          // wide the actual row is — the exact bug reported (only the "…"
          // ellipsis trigger ever rendering). Giving it `flex-1` makes the
          // flex algorithm hand it a definite width instead of trying to
          // measure its content, which is what the container query needs
          // to work at all. (Trade-off: if `titleSuffix` is ever combined
          // with `breadcrumb`, it may sit away from the title the same way
          // it once did on the icon/plain branches — not fixed here since
          // that combination doesn't have a real usage yet.)
          <div className="lyra-page-header-breadcrumb-wrap min-w-0 flex-1">
            <Breadcrumb className="lyra-page-header-breadcrumb-full min-w-0">
              <BreadcrumbList className="flex-nowrap min-w-0">
                {(Array.isArray(breadcrumb) ? breadcrumb : [breadcrumb]).map((crumb, i) => (
                  <React.Fragment key={i}>
                    <BreadcrumbItem className="shrink-0">
                      <BreadcrumbLink onClick={crumb.onClick} href={crumb.href}>{crumb.label}</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="shrink-0" />
                  </React.Fragment>
                ))}
                <BreadcrumbItem aria-current="page" className="gap-2 min-w-0 flex-1">
                  <h1 className={cn(titleSize === "2xl" ? "lyra-heading-2xl" : "lyra-heading-lg", "text-lyra-fg-default truncate min-w-0")}>{title}</h1>
                  {badge && <Badge color={badgeColor} variant={badgeVariant}>{badge}</Badge>}
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Breadcrumb className="lyra-page-header-breadcrumb-collapsed min-w-0">
              <BreadcrumbList className="flex-nowrap min-w-0">
                <BreadcrumbItem className="shrink-0">
                  <BreadcrumbEllipsis
                    ariaLabel="Show parent pages"
                    items={(Array.isArray(breadcrumb) ? breadcrumb : [breadcrumb]).map((crumb, i) => ({
                      id: `crumb-${i}`,
                      label: crumb.label,
                      onClick: crumb.onClick ?? (crumb.href ? () => window.location.assign(crumb.href!) : undefined),
                    }))}
                  />
                </BreadcrumbItem>
                <BreadcrumbSeparator className="shrink-0" />
                <BreadcrumbItem aria-current="page" className="gap-2 min-w-0 flex-1">
                  <h1 className={cn(titleSize === "2xl" ? "lyra-heading-2xl" : "lyra-heading-lg", "text-lyra-fg-default truncate min-w-0")}>{title}</h1>
                  {badge && <Badge color={badgeColor} variant={badgeVariant}>{badge}</Badge>}
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            {subtitle && <span className="lyra-body-sm text-lyra-fg-secondary block truncate">{subtitle}</span>}
          </div>
        ) : (
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className={cn(titleSize === "2xl" ? "lyra-heading-2xl" : "lyra-heading-lg", "text-lyra-fg-default truncate min-w-0")}>{title}</h1>
              {badge && <Badge color={badgeColor} variant={badgeVariant}>{badge}</Badge>}
              {suffixInline && titleSuffixSpan}
            </div>
            {subtitle && <span className="lyra-body-sm text-lyra-fg-secondary truncate">{subtitle}</span>}
          </div>
        )}
        {!suffixInline && titleSuffixSpan}
      </div>
      <div className="lyra-page-header-actions flex items-center gap-2">
        {actions}
        {(panelToggle === "right" || panelToggle === "both") && (
          <>
            {actions && <div className="mx-1 h-6 w-px bg-lyra-border-subtle" />}
            <div
              onMouseEnter={onInnerPanelHoverStart}
              onMouseLeave={onInnerPanelHoverEnd}
            >
              <Tooltip content={innerPanelToggleLabel} placement="left" asLabel>
                <button
                  onClick={onInnerPanelToggle}
                  aria-label={innerPanelToggleLabel}
                  aria-expanded={innerPanelOpen}
                  aria-controls={innerPanelControlsId}
                  className="flex h-8 w-8 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary transition-colors hover:bg-lyra-state-hover active:bg-lyra-state-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
                >
                  <PanelRight className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                </button>
              </Tooltip>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
    );
  }
);
PageHeader.displayName = "PageHeader";

export { PageHeader };
export type { PageHeaderBreadcrumb, PageHeaderProps };
