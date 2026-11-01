import * as React from "react";
import { Clock, Pause, TriangleAlert, CircleAlert, User } from "lucide-react";
import { cn } from "../lib/utils";
import {
  CHANNEL_ROW_COMPONENTS,
  CHANNEL_TYPE_META,
  CHANNEL_TYPE_TAG_VARIANT,
  KindChannelRow,
  type InteractionChannel,
  type ChannelType,
} from "./channel-row";
import { Popover } from "./popover";
import { Tooltip } from "./tooltip";
import { getHoldBadgeColor, type HoldSeverity } from "./hold-sla";

/** The on-hold timer's colour: read from a string's time, else the caller's `holdSeverity` (a live node's). */
const holdTone = (elapsed: React.ReactNode, holdSeverity: HoldSeverity | undefined): HoldSeverity =>
  typeof elapsed === "string" ? getHoldBadgeColor(elapsed) : (holdSeverity ?? "success");
import { Badge, getPillInlineStyles, type BadgeColor } from "./badge";
import { Button } from "./button";
import { ShowMoreChevron } from "./show-more";
import { RADIUS_CLASSES, type RadiusSize } from "./accordion";
import { containerBorderClasses, type ContainerBorders } from "./container";
import { formatPhoneForDisplay } from "./phone-input";

/* ── Helpers ── */

/** First + last name initials (e.g. "Sofia Martinez" → "SM"). Falls back to
 *  "C" (for "Customer") when there's no name to derive initials from. */
function getInitials(name?: string): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

/* ── InteractionNavItem ── */

export interface InteractionNavItemProps {
  /** Corner radius of the expanded card, from the radius tokens (same scale as `Container`). Default "sm". */
  radius?: RadiusSize;
  /**
   * Which sides of the expanded card draw its border: "all" (default), "none", or a list such as `["left"]`
   * (same as `Container`'s `borders`). The active card's thick left selection bar shows whatever this is set to.
   */
  borders?: ContainerBorders;
  /** Customer's full name — OR, for an interaction with no matched
   *  customer, whatever raw address identifies it instead (a dialed phone
   *  number, a typed email/WhatsApp handle) — the card's title (expanded
   *  mode) and, by default, its compact-mode initials are both derived from
   *  this. Falls back to "C" / "Customer" only when this is left entirely
   *  unset. */
  customerName?: string;
  /**
   * Whether `customerName` above is an actual customer's name, as opposed
   * to a raw address standing in for one (see that prop's own doc comment).
   * Only affects the compact tile's AVATAR: a real name still gets initials
   * either way `customerName` is used for the title text itself, but a raw
   * address has no real initials to speak of — passing `false` here shows a
   * generic person icon in the avatar instead of `getInitials` deriving a
   * stray, meaningless leading character off the address (e.g. "1" off a
   * phone number starting with a "1" country code). Previously this showed
   * the interaction's own current-channel icon instead — changed per
   * explicit request, since the channel icon read as "this is an email/
   * voice/etc. conversation" rather than clearly communicating "unknown
   * customer" the way a person icon does.
   * Omit when the consumer doesn't distinguish the two cases — inferred
   * from whether `customerName` is non-empty, same as before this prop
   * existed.
   */
  customerIdentified?: boolean;
  /** Open channels/conversations for this interaction. A compact-mode count
   *  badge appears when there's more than one; the expanded card lists each
   *  as its own row (chip + elapsed time + preview), dispatched to the
   *  matching per-type row component (`ChatChannelRow`/`EmailChannelRow`/
   *  `SmsChannelRow`/`WhatsAppChannelRow`/`VoiceChannelRow` in
   *  `channel-row.tsx`) based on `type`. */
  channels?: InteractionChannel[];
  /**
   * For a card with no channels — an assignment that isn't a conversation
   * (a meeting, a training, a task…): its kind's icon, shown on the compact
   * tile's top-left corner, where a channel icon or count would be. Pass a
   * Lucide icon element; it's sized to fit. Ignored while the card has
   * channels (rows that are kind rows, `InteractionChannel.kind`, don't
   * count). Unset (default): nothing changes.
   */
  kindIcon?: React.ReactNode;
  /**
   * The "new" outline: while the card is inactive and has no warning or
   * critical severity, its border is `border-strong` instead of
   * `border-subtle`, so a card not yet opened since it arrived stands out.
   * Pass it with `isNewAssignment` until the first click. Default `false`.
   */
  newOutline?: boolean;
  /** Elapsed time label as 4-digit MM:SS (e.g. "00:02" = 2 seconds since the
   *  customer's last response) — shown under the compact avatar tile. Or a
   *  node that renders the time itself (a self-ticking timer): the card then
   *  doesn't re-render each second; its accessible name leaves the time out,
   *  and an on-hold badge takes its colour from `holdSeverity`. */
  elapsed: React.ReactNode;
  /** The on-hold badge's colour when `elapsed` is a node (a string's is read
   *  from its time). */
  holdSeverity?: HoldSeverity;
  /**
   * True when the customer has sent a message the agent hasn't replied to
   * yet: the avatar switches from primary (blue) to success (green)/warning
   * (amber)/critical (red) — see `awaitingSeverity` below — and a badge dot
   * appears. Default (false) is primary with no badge.
   */
  awaitingResponse?: boolean;
  /** When `awaitingResponse` is true, which visual tier to render —
   *  `"success"` (green) for a reply that just landed and is still well
   *  within SLA, `"warning"` (amber) once the wait's gotten old enough to
   *  need attention, `"critical"` (red) once it's genuinely overdue.
   *  Ignored when `awaitingResponse` is false, and defaults to `"critical"`
   *  when left unset while `awaitingResponse` IS true — matching this
   *  prop's own pre-existing binary behavior, so any consumer that doesn't
   *  pass it (this file's own stories included) renders exactly as
   *  before. */
  awaitingSeverity?: "success" | "warning" | "critical";
  /**
   * True when this interaction was just assigned to the agent and hasn't
   * been opened/acknowledged yet — a distinct signal from `awaitingResponse`
   * above (a customer waiting on a reply): a card can be a brand-new
   * assignment with no customer message pending at all, or vice versa, so
   * this is its own independent flag rather than another `awaitingSeverity`
   * tier. Per explicit request/reference screenshot: adds a small red dot
   * to the FAR left of the customer name in the expanded header row (ahead
   * of the open-channel-count/channel-type badge that would otherwise lead
   * it), and, on the collapsed compact tile, a red dot at the bottom-right
   * corner. That bottom-right dot is otherwise driven by
   * `awaitingResponse`'s own success/warning/critical escalation (see
   * `awaitingSeverity` above) — this is the one case where it's forced red
   * regardless of that ladder, since "just assigned" is a red-worthy signal
   * on its own even when nothing else here is overdue. Deliberately does
   * NOT touch the avatar's top-left "!" badge — per explicit follow-up,
   * that glyph is reserved for SLA-breach signaling
   * (`severity === "critical"`, further down) and isn't overloaded with a
   * second, unrelated meaning. Default `false` (every existing consumer
   * renders exactly as before).
   */
  isNewAssignment?: boolean;
  /** Color of `isNewAssignment`'s pulsing dots — the one in the expanded
   *  card's header and the compact tile's bottom-right corner dot — on the
   *  same scale as `awaitingSeverity`: `"success"` (green), `"warning"`
   *  (amber) or `"critical"` (red). They pulse at every level. Default
   *  `"critical"` (red, as before). */
  newAssignmentSeverity?: "success" | "warning" | "critical";
  /** Whether this is the currently-open/selected interaction. */
  active?: boolean;
  /** Tints the whole expanded card (background + outer border) with the
   *  warning/yellow treatment — per explicit request ("make the ENTIRE card
   *  background yellow and give the entire card background a warning
   *  border"). Overrides `expandedCardClassName`'s normal background AND
   *  its normal active/inactive/severity border logic unconditionally
   *  while true, regardless of `active`/`awaitingSeverity` — a consumer
   *  drives this off its own domain state (e.g. "this interaction has a
   *  live call the agent has navigated away from"); this component has no
   *  opinion on what "on hold" means, just how to paint the card once told
   *  it applies. Shared by both the real expanded card and the compact
   *  tile's hover-preview popover below (both reuse the same
   *  `expandedCardClassName`), so a held interaction reads the same way in
   *  either. Default `false` (every existing consumer renders exactly as
   *  before). */
  onHold?: boolean;
  /**
   * Whether the parent LeftNav rail is expanded. False renders the compact
   * avatar tile (icon-rail mode); true renders the full detail card. Mirrors
   * CreateNew's `expanded` prop so it can be used the same way as a LeftNav
   * `header`/`footer` slot.
   */
  expanded?: boolean;
  onClick?: () => void;
  /**
   * Called when the agent chooses "Unassign & Dismiss" from a channel's
   * kebab menu while this card has only that *one* channel open — with
   * nothing left once it's gone, the whole card goes with it, so the
   * consumer should remove it entirely (e.g. filter it out of whatever list
   * rendered it). When a card has more than one open channel, "Unassign &
   * Dismiss" calls `onDismissChannel` instead (see below) — this component
   * decides which of the two applies based on `channels.length` at click
   * time, so the consumer never has to duplicate that check itself. Omit to
   * leave "Unassign & Dismiss" inert on a single-channel card — e.g. for a
   * fixed demo card with no backing state to remove it from. Only wired onto
   * each channel's *default* menu; a channel with a `menuItems` override
   * handles its own actions instead. */
  onDismiss?: () => void;
  /**
   * Called with the specific channel object when the agent chooses
   * "Unassign & Dismiss" from a card that has *more than one* open channel —
   * ends just that one channel (the consumer should drop it from this
   * interaction's own channel list, matching on `channel.id ?? channel.type`
   * since two open channels can share the same `type`), leaving the rest of
   * the card and its other channels open. See `onDismiss` above for the
   * single-channel case, where the whole card goes instead. */
  onDismissChannel?: (channel: InteractionChannel) => void;
  /** Rendered at the end of the expanded card's header row, next to the
   *  customer name — e.g. an "Add Outbound" button (see `AddChannelButton`
   *  in `create-new.tsx`) letting the agent start another channel with this
   *  same contact without leaving the card. Kept as a generic slot (not a
   *  dedicated `onAddOutbound` prop) so this component has no direct
   *  dependency on `create-new.tsx`'s outbound-picker types — the consumer
   *  composes whatever trigger it needs. Compact (icon-rail) mode has no
   *  header row of its own to put this in, but it isn't dropped there —
   *  hovering the compact tile opens a popover previewing the full expanded
   *  card (see the compact-mode branch below), and that preview's header
   *  row renders this exact same `headerAction`. If whatever's passed here
   *  opens its own popover (like `AddChannelButton` does), make sure its
   *  z-index accounts for sometimes being nested inside that hover
   *  popover — see `AddChannelButton`'s own doc comment in create-new.tsx. */
  headerAction?: React.ReactNode;
  /** Rendered below the channel rows (e.g. Accept / Decline on a ringing incoming call). Clicks inside it should stop propagation. */
  footerAction?: React.ReactNode;
  /** Keeps the collapsed tile's hover preview card open regardless of pointer (e.g. an incoming call awaiting Accept/Decline). */
  forceHoverOpen?: boolean;
  /**
   * Controls which open channel is "current" (the blue-highlighted row on
   * an `active` card) from outside this component — e.g. a `ChannelTab` bar
   * rendered elsewhere (under a record-header `PageHeader`) that needs to
   * stay in lockstep with this same card. When provided, this always wins
   * over whatever the card would otherwise compute on its own (a row click,
   * or a newly-opened channel taking over as current); when omitted, the
   * card manages its own current-channel state exactly as before — every
   * existing consumer that doesn't pass this keeps working unchanged. Pass
   * the same key `onCurrentChannelChange` reports back (see below) — a
   * `channelKey`: `channel.id` when set, else `channel.type`.
   */
  currentChannelKey?: string;
  /**
   * Fired whenever the effective current channel changes — from a row
   * click, from a newly-opened channel auto-taking over, or (if this
   * component is uncontrolled) just to notify a listener without it having
   * to own `currentChannelKey` itself. A consumer building a synced
   * `ChannelTab` bar should store this in the same piece of state it passes
   * back in as `currentChannelKey`, so a click on either side updates both.
   */
  onCurrentChannelChange?: (key: string) => void;
  /**
   * Adds a chevron toggle to the expanded card's header row that expands/
   * collapses the channel list below it — opt-in (default `false`, every
   * existing consumer's header row is completely unchanged) rather than a
   * behavior change applied to every consumer of this component at once,
   * per explicit request. Each card manages its own expanded/collapsed
   * state internally (defaults to expanded, matching this component's
   * pre-existing always-shown behavior) — nothing outside this component
   * needs to read or coordinate it, so it isn't lifted into a controlled
   * prop pair the way `currentChannelKey` above is. Only takes effect
   * when there's at least one channel to collapse; with none AND no
   * `headerAction` either, the header row renders with no trailing action
   * at all.
   *
   * Per a later explicit follow-up request, this no longer REPLACES
   * `headerAction` in that same slot the way it originally did — the two
   * now render side by side (chevron, then `headerAction`) whenever both
   * are present, so a consumer can keep its existing "Add Channel"
   * trigger on screen even once a card is also collapsible.
   */
  collapsible?: boolean;
  /**
   * External one-shot override for the channel list's expanded/collapsed
   * state — e.g. a page-level "Collapse all"/"Expand all" bulk action
   * controlling every card in a list at once. Deliberately NOT a normal
   * continuously-controlled prop pair (there's no plain `channelsExpanded`/
   * `onChannelsExpandedChange`, unlike `currentChannelKey` above): a simple
   * controlled boolean would PERMANENTLY link every card to the same
   * state, so toggling one card's own chevron afterward would have to
   * either fight the controlling parent or stop working entirely. The
   * whole point here is a one-time "set them all to X right now" — after
   * which each card goes right back to toggling independently via its own
   * chevron, exactly as if this prop were never passed.
   *
   * `version` is a nonce, not a value to diff against `expanded` itself:
   * bump it (e.g. an incrementing counter) any time `expanded` should be
   * re-applied, even if `expanded`'s own value hasn't changed since the
   * last bump (e.g. two consecutive "Collapse all" clicks in a row with no
   * individual card toggled in between — `expanded` would be `false` both
   * times, but the second click still needs to re-collapse any card the
   * agent individually re-expanded since the first one).
   */
  channelsExpandedOverride?: { expanded: boolean; version: number };
  /**
   * Reports this card's own current channel-list expanded/collapsed state
   * — fired on mount and every time it changes, whether that's from the
   * per-card chevron, the "click a collapsed card to expand it" behavior
   * below, or `channelsExpandedOverride` above. Purely informational (this
   * component's `channelsExpanded` stays its own internally-owned state
   * either way — see `channelsExpandedOverride`'s own doc comment for why
   * it isn't a controlled prop); a consumer driving a page-level "Collapse
   * all"/"Expand all" toggle (`AssignmentsExpandCollapseAllButton`,
   * assignments-section-caption.tsx) can use this to notice once every
   * card happens to already agree with one direction — e.g. the agent
   * manually expanded every card by hand — and flip that toggle's own
   * `allExpanded` to match, without having to wait for another bulk click.
   */
  onChannelsExpandedChange?: (expanded: boolean) => void;
  /** Hides the channel chip on every channel row of this card (a row's own
   *  `InteractionChannel.hideChip` hides just that one). Default `false`. */
  hideChip?: boolean;
  className?: string;
}

/** Identity used for current-channel tracking, click-to-select, and dismiss
 *  — `id` when the consumer supplied one, else `type`. See
 *  `InteractionChannel.id`'s own doc comment for why `type` alone isn't
 *  enough once an interaction can have two channels of the same type open
 *  at once. */
function channelKey(ch: InteractionChannel): string {
  return ch.id ?? ch.type;
}

const InteractionNavItem = React.forwardRef<HTMLDivElement, InteractionNavItemProps>(
  (
    {
      radius = "sm",
      borders = "all",
      customerName,
      customerIdentified,
      channels = [],
      kindIcon,
      newOutline = false,
      elapsed,
      holdSeverity,
      awaitingResponse = false,
      awaitingSeverity,
      isNewAssignment = false,
      newAssignmentSeverity = "critical",
      active = false,
      onHold = false,
      expanded = false,
      onClick,
      onDismiss,
      onDismissChannel,
      headerAction,
      footerAction,
      forceHoverOpen,
      currentChannelKey,
      onCurrentChannelChange,
      collapsible = false,
      channelsExpandedOverride,
      onChannelsExpandedChange,
      hideChip = false,
      className,
    },
    ref
  ) => {
    // Own the channel list's expanded/collapsed state — see `collapsible`'s
    // own doc comment above for why this stays internal rather than a
    // controlled prop. Declared unconditionally (not inside `cardBody`'s
    // JSX below, which isn't a component/hook of its own) regardless of
    // whether `collapsible` is actually true, same "hooks can't be called
    // conditionally" reasoning `hoverCardOpen` below already documents for
    // itself.
    const [channelsExpanded, setChannelsExpanded] = React.useState(true);

    // Reports every change (see `onChannelsExpandedChange`'s own doc
    // comment above) — a plain effect, not inlined at each of the three
    // `setChannelsExpanded` call sites below, so a consumer gets exactly
    // one notification per actual change regardless of which of those
    // triggered it, without having to duplicate the call three times.
    React.useEffect(() => {
      onChannelsExpandedChange?.(channelsExpanded);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [channelsExpanded]);

    // Applies `channelsExpandedOverride` (see its own doc comment above)
    // the moment its `version` changes — "adjusting state during render
    // when a prop changes," the same pattern (compare against a ref of the
    // last-seen value, update during render rather than in a `useEffect`)
    // `currentChannelKeys`/`prevChannelKeys`/`channelKeysChanged` below
    // already uses for the "a newly-opened channel takes over as current"
    // case. A `useEffect` here would apply the override one render late —
    // this fires in the SAME render the new `version` arrives in, which
    // matters for a bulk "Collapse all" click meant to feel instant across
    // every card in a list at once, not staggered by an extra render each.
    const lastAppliedOverrideVersionRef = React.useRef(channelsExpandedOverride?.version);
    if (
      channelsExpandedOverride &&
      channelsExpandedOverride.version !== lastAppliedOverrideVersionRef.current
    ) {
      lastAppliedOverrideVersionRef.current = channelsExpandedOverride.version;
      if (channelsExpanded !== channelsExpandedOverride.expanded) {
        setChannelsExpanded(channelsExpandedOverride.expanded);
      }
    }
    const initials = getInitials(customerName);
    // `formatPhoneForDisplay` is a no-op for a real customer name (or any
    // other non-phone-shaped string — an email address, a WhatsApp handle)
    // and only reformats `customerName` when it's actually standing in for
    // a raw dialed number (see that prop's own doc comment) — safe to call
    // unconditionally rather than branching on `hasCustomerName` below.
    const displayName = formatPhoneForDisplay(customerName) || "Customer";
    const channelCount = channels.length;
    // Whether there's a real customer name to derive initials from at all —
    // `customerIdentified` wins when the consumer passes it explicitly
    // (they know definitively whether `customerName` is a real name or just
    // a stand-in address, see that prop's own doc comment); otherwise falls
    // back to non-empty-`customerName` the same way this worked before that
    // prop existed. An interaction identified only by a raw address (a
    // quick-dialed phone number, an anonymous inbound email/WhatsApp handle)
    // has no real initials to derive — `getInitials`' own "C" fallback (or,
    // worse, a stray leading digit/symbol off the address itself) reads as
    // meaningless in the compact tile's avatar — a generic person icon
    // communicates "unknown/unidentified customer" far better than a letter
    // that isn't actually anyone's initial (previously this showed the
    // current channel's own icon instead — changed per explicit request, see
    // `customerIdentified`'s own doc comment above). Only affects the
    // avatar: `displayName` below still shows `customerName` as-is either
    // way (the raw address is exactly what should read as this card's title
    // when there's no real name).
    const hasCustomerName = customerIdentified ?? Boolean(customerName?.trim());

    // Internal handle onto the compact tile's own DOM node, alongside
    // (not instead of) the forwarded `ref` — needed so the Tab-trap logic
    // below (see `previewContentRef`'s own doc comment) can call
    // `.focus()` on the tile itself without depending on what shape of
    // ref, if any, a consumer happened to pass in.
    const tileRef = React.useRef<HTMLDivElement | null>(null);
    const setTileRef = (node: HTMLDivElement | null) => {
      tileRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    };

    // The single channel actually treated as "current" (the one that gets
    // the blue-highlighted row) — resolved here rather than trusting each
    // `InteractionChannel.current` flag verbatim, since a consumer flipping
    // one channel's `current` to true has no way to also flip every sibling
    // back to false in that same update (a real bug: two channels both
    // landing on `current: true`, both rendering highlighted at once).
    // Keyed by `channelKey` (id, or `type` when no id was supplied) rather
    // than `type` alone — two channels can share a `type` (e.g. two SMS
    // threads with the same customer on different numbers), and keying on
    // `type` would highlight/select/dismiss *both* of them together instead
    // of just the one actually clicked. Falls back to the *last* channel
    // actually flagged `current` (ignoring any earlier stale ones), or the
    // last channel overall if none are flagged. Clicking any row (see
    // `onSelect` below) overrides this default — the override self-heals
    // back to the fallback once that channel is no longer present (e.g. it
    // was dismissed), since the `.some(...)` check below stops matching it.
    // This is what lets an agent toggle which open channel is "current"
    // within one card.
    const [manualCurrentKey, setManualCurrentKey] = React.useState<string | null>(null);

    // Opening a new channel on this interaction (e.g. the agent starts a
    // second channel with a contact who already has a card) always takes
    // over as "current" — even overriding a previous manual pick above —
    // since the whole point of opening it was to bring it into view now.
    // Without this, a card where the agent had earlier clicked to view one
    // channel would silently keep that one "current" forever, leaving every
    // newly-opened channel after it unhighlighted. Detected by diffing this
    // render's channel keys against the last render's (tracked as state,
    // not a ref, and adjusted directly during render per React's "adjusting
    // state when a prop changes" pattern — this re-renders immediately
    // before paint instead of one tick late the way a `useEffect` would).
    const currentChannelKeys = channels.map(channelKey);
    const [prevChannelKeys, setPrevChannelKeys] = React.useState<string[]>(currentChannelKeys);
    const channelKeysChanged =
      currentChannelKeys.length !== prevChannelKeys.length ||
      currentChannelKeys.some((k, i) => k !== prevChannelKeys[i]);
    if (channelKeysChanged) {
      setPrevChannelKeys(currentChannelKeys);
      const justOpenedKey = currentChannelKeys.find((k) => !prevChannelKeys.includes(k));
      if (justOpenedKey !== undefined) {
        // Uncontrolled: the new channel becomes current here. A controlling
        // parent (`currentChannelKey` passed) is NOT told: a row appearing
        // isn't the agent picking it, the parent already knows it added the
        // channel, and calling its setter here would update another
        // component during render. `onCurrentChannelChange` fires only for
        // an actual click on a row.
        setManualCurrentKey(justOpenedKey);
      }
    }

    const fallbackCurrentChannel = [...channels].reverse().find((c) => c.current) ?? channels[channels.length - 1];
    const fallbackCurrentKey = fallbackCurrentChannel ? channelKey(fallbackCurrentChannel) : undefined;
    // Controlled (a `currentChannelKey` prop was passed) always wins over
    // whatever this card would otherwise compute on its own — see the
    // prop's own doc comment. Uncontrolled: unchanged from before, the
    // manual pick (if it still matches an open channel) or the fallback.
    const effectiveCurrentKey =
      currentChannelKey !== undefined
        ? currentChannelKey
        : channels.some((c) => channelKey(c) === manualCurrentKey) ? manualCurrentKey : fallbackCurrentKey;

    // Compact mode only: hovering the icon-rail avatar tile opens a popover
    // previewing the full expanded card (name, headerAction, every channel
    // row) so the agent can read — and act on — the card's detail without
    // switching the whole rail to expanded mode. Same hover-intent pattern
    // as `OutboundContactRow`'s flyout in create-new.tsx: open immediately
    // on enter, but close on a short delay (rather than instantly on
    // mouseleave) so there's time to move the pointer from the tile into
    // the popover's own content — both the tile and the content re-arm the
    // open state on their own mouseenter, so hovering over either keeps it
    // open. Declared unconditionally (not inside the `!expanded` branch
    // below) because hooks can't be called conditionally, even though
    // they're only ever read there.
    const [hoverCardOpen, setHoverCardOpen] = React.useState(false);
    const closeHoverCardTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    // Which of this card's channel rows currently have a portaled popover of
    // their own open — a row's kebab dropdown OR its Outcome popover (see
    // `handleChannelMenuOpenChange` below, and each `RowComponent` call's
    // `onMenuOpenChange`/`outcome.onOpenChange` wrapping further down) — a
    // Set, not a single bool, since a multi-channel card has one independent
    // kebab AND one independent Outcome popover per row. While non-empty,
    // the hover-preview popover must never close out from under an open one
    // of these: both `KebabMenuButton`'s dropdown and `ChannelRow`'s Outcome
    // `Popover` portal their content straight to `document.body` (same as
    // every Radix Popper-based primitive), landing outside both the compact
    // tile and this preview's own wrapper div DOM-wise — so moving the
    // pointer off the wrapper and onto that portaled content genuinely fires
    // the wrapper's `onMouseLeave` even though the agent is still actively
    // using the card. Without this, opening either one and then moving
    // toward its content reads as "left the card," the 150ms timer below
    // elapses, and the whole preview (dropdown/popover included, since it's
    // a child of `content`) unmounts out from under the agent before they
    // can finish using it — this exact bug was already fixed once for the
    // kebab dropdown, then resurfaced for the Outcome popover since it has
    // its own separate open state the original fix never accounted for.
    const openChannelMenuKeysRef = React.useRef<Set<string>>(new Set());
    const openHoverCard = () => {
      if (closeHoverCardTimeoutRef.current) {
        clearTimeout(closeHoverCardTimeoutRef.current);
        closeHoverCardTimeoutRef.current = null;
      }
      setHoverCardOpen(true);
    };
    const scheduleCloseHoverCard = () => {
      if (closeHoverCardTimeoutRef.current) clearTimeout(closeHoverCardTimeoutRef.current);
      // Never arm the close timer while any channel row's kebab dropdown OR
      // Outcome popover is still open — see `openChannelMenuKeysRef`'s own
      // doc comment above.
      if (openChannelMenuKeysRef.current.size > 0) return;
      closeHoverCardTimeoutRef.current = setTimeout(() => setHoverCardOpen(false), 150);
    };
    // Passed to each channel row as `onMenuOpenChange` (threaded through
    // `ChannelRow`/`ChannelRowInstanceProps` in channel-row.tsx down to that
    // row's own `KebabMenuButton`) AND reused below to wrap that same row's
    // `outcome.onOpenChange` (each with its own distinctly-prefixed key, so
    // the two popovers' tracking can't collide if both were somehow open on
    // the same row at once). Opening either cancels/prevents the close timer
    // immediately (`openHoverCard`); closing one only re-arms it once every
    // such popover on this card is shut — a card can have more than one
    // channel row, each with its own kebab AND Outcome popover, and this
    // only ever fires for the one that actually changed.
    const handleChannelMenuOpenChange = (key: string, open: boolean) => {
      if (open) {
        openChannelMenuKeysRef.current.add(key);
        openHoverCard();
      } else {
        openChannelMenuKeysRef.current.delete(key);
        if (openChannelMenuKeysRef.current.size === 0) scheduleCloseHoverCard();
      }
    };
    React.useEffect(() => {
      return () => {
        if (closeHoverCardTimeoutRef.current) clearTimeout(closeHoverCardTimeoutRef.current);
      };
    }, []);

    // `null` when not awaiting at all; otherwise `awaitingSeverity`,
    // defaulting to `"critical"` — see that prop's own doc comment above
    // for why the default preserves this card's pre-existing binary red
    // behavior for any consumer that doesn't pass real wait-time data.
    const severity: "success" | "warning" | "critical" | null = awaitingResponse ? awaitingSeverity ?? "critical" : null;

    // The compact tile's bottom-right corner dot (below) used to be driven
    // purely by `severity` — a plain green/amber/red escalation ladder for
    // `awaitingResponse`. Per explicit request, RED there now means "new
    // assignment" specifically, not "critical/overdue": `isNewAssignment`
    // forces it red even with nothing awaiting a response at all, and a
    // merely-`critical`-severity card that ISN'T a new assignment no longer
    // shows that dot (green/warning are untouched either way — only the
    // red tier's meaning changed). See `isNewAssignment`'s own doc comment
    // above for the full reasoning. A new assignment's dot takes
    // `newAssignmentSeverity` (red by default), same as the header dot.
    const cornerDotVariant: "success" | "warning" | "critical" | null = isNewAssignment
      ? newAssignmentSeverity
      : severity === "critical"
      ? null
      : severity;
    const tone =
      // Per explicit request ("a non-active interactionNavItem that is on
      // hold should have the yellow background and border and avatar when
      // collapsed — just the blue area"): wins outright ahead of
      // `severity`, same "onHold beats everything else" precedent
      // `expandedCardClassName` already establishes for the full card's own
      // background/border below — just scoped to the compact tile's small
      // avatar square specifically (the only place `tone` is read; the
      // phone/pause channel-type icon and its badge just above this square
      // are untouched). `!active` guards it per that same explicit
      // request's own wording — an ACTIVE card's compact tile isn't in
      // scope here (in practice the active interaction is shown via the
      // real expanded card, not this tile, but the guard is explicit
      // rather than relying on that always being true). Full-strength
      // `border-lyra-status-warning-strong` (not the `/30` alpha every
      // inactive severity branch below uses) to match `expandedCardClassName`'s
      // own onHold border treatment — a held call is a stronger signal than
      // an ordinary severity tint.
      // Per explicit request ("don't change the tile color when on hold"):
      // `onHold` no longer overrides the tile's own avatar colors — it falls
      // through to the same `severity`/default tone as any other call. The
      // hold state is still conveyed by the "On hold · mm:ss" line and the
      // phone/pause channel icon.
      severity === "critical"
        ? { bg: "bg-lyra-status-critical-subtle", text: "text-lyra-status-critical-strong", border: active ? "border-lyra-status-critical-strong" : "border-lyra-status-critical-medium/30" }
        : severity === "warning"
        ? { bg: "bg-lyra-status-warning-subtle", text: "text-lyra-status-warning-strong", border: active ? "border-lyra-status-warning-strong" : "border-lyra-status-warning-strong/30" }
        : severity === "success"
        ? { bg: "bg-lyra-status-success-subtle", text: "text-lyra-status-success-strong", border: active ? "border-lyra-status-success-strong" : "border-lyra-status-success-strong/30" }
        : { bg: "bg-lyra-status-info-subtle", text: "text-lyra-status-info-strong", border: active ? "border-lyra-status-info-strong" : "border-lyra-status-info-medium/30" };

    // `activate` — defaults to plain `onClick`, but the real expanded
    // card's own call site below passes `handleExpandedCardActivate`
    // instead (see that function's own doc comment) so Enter/Space
    // activation gets the exact same "also expand a collapsed card" side
    // effect a mouse click there gets, rather than only auto-expanding for
    // mouse users.
    const handleKeyDown = (e: React.KeyboardEvent, activate: () => void = () => onClick?.()) => {
      // `e.target !== e.currentTarget` — keydown bubbles, and this handler
      // is now used only by the compact tile's own `handleTileKeyDown`
      // below (the preview wrapper and the real expanded card each got a
      // real, native `Button` instead — see the stretched-hit-target
      // restructuring further down — so this guard only ever needs to
      // matter for the tile's own nested interactive descendants inside
      // its hover-preview popover). Without this guard, Enter/Space
      // pressed while focus is on one of those bubbles up here too, and
      // this always calls
      // `preventDefault()` — which silently cancels the focused element's
      // own native "Enter/Space triggers a click" default action before it
      // can fire. Same `target === currentTarget` guard `modal.tsx`/
      // `overlay.tsx` already use for their own backdrop-click checks —
      // only a keydown that originates on the tile/wrapper itself (tabbing
      // to it directly, the common case) still activates; anything
      // bubbling up from a nested descendant is left alone to handle its
      // own Enter/Space activation normally.
      if (e.target !== e.currentTarget) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate();
      }
    };

    // Compact mode only: the hover-preview's own content (see the `!expanded`
    // branch below) is a Radix `Popover.Content`, portaled straight to the
    // very end of `document.body` — its position in the DOM (and so its
    // place in the browser's *default* Tab order) is completely decoupled
    // from where it visually/logically sits, right next to this tile.
    // Confirmed live: tabbing forward from the tile skipped over all of the
    // preview's own content entirely and landed in unrelated main-content
    // dashboard/queue elements instead — the preview's "+" header action,
    // channel rows, and kebabs were only ever reachable by continuing to
    // tab through the *rest of the whole page* first, if at all. Fixed with
    // a small, self-contained "roving" Tab loop instead of relying on raw
    // DOM order: forward-Tab from the tile jumps straight into the
    // preview's own first stop (the content wrapper itself, see
    // `previewContentRef` below); forward-Tab off the *last* focusable row
    // inside it loops back to the tile rather than escaping into the page.
    // Shift+Tab off that first stop steps back out to the tile the same
    // way. The tile's own Shift+Tab (leaving the loop from its own start)
    // is left alone — normal page order already handles that correctly.
    const previewContentRef = React.useRef<HTMLDivElement | null>(null);

    // The real, invisible `Button` that now covers the whole hover-preview
    // card (the stretched hit-target — see the restructuring further down)
    // is the actual Tab-order entry point into the preview now that the
    // wrapper div itself is no longer focusable.
    const previewEntryButtonRef = React.useRef<HTMLButtonElement | null>(null);
    /** The expanded card's stretched `Button`: its keyboard focus opens a cut-off name's tooltip. */
    const cardButtonRef = React.useRef<HTMLButtonElement | null>(null);

    // Every element inside the preview a Tab press could land on, in DOM
    // (== visual) order — deliberately a plain allow-list query, not a
    // library, since this only ever needs to answer "is focus currently on
    // the last one of these" below.
    const getPreviewFocusables = (): HTMLElement[] => {
      const root = previewContentRef.current;
      if (!root) return [];
      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
    };
    const handleTileKeyDown = (e: React.KeyboardEvent) => {
      handleKeyDown(e);
      // Only while the preview is actually mounted — otherwise there's
      // nothing to jump into, and eating the keypress here would strand
      // focus on the tile with nowhere for Tab to go.
      if (e.key === "Tab" && !e.shiftKey && previewContentRef.current) {
        e.preventDefault();
        previewEntryButtonRef.current?.focus();
      }
    };
    // Handles the preview's own Shift+Tab-at-the-start case — the new
    // invisible entry `Button` has no children, so a keydown on it only
    // ever fires when focus is genuinely on that button itself (no
    // `document.activeElement` check needed, unlike the trailing-edge case
    // below which has to distinguish "the last real focusable" from
    // everything else).
    const handlePreviewEntryKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        tileRef.current?.focus();
      }
    };
    // Stays on the wrapper div — still catches Tab bubbling up from any
    // descendant — but now only handles the forward-Tab-off-the-last-
    // focusable case: the div itself is no longer focusable/clickable (no
    // more nested `role="button"`), so there's no Enter/Space activation or
    // Shift+Tab-off-the-first-stop case left to handle here — both moved to
    // `handlePreviewEntryKeyDown` above, on the new entry button.
    const handlePreviewContentKeyDown = (e: React.KeyboardEvent) => {
      if (e.key !== "Tab" || e.shiftKey) return;
      const focusables = getPreviewFocusables();
      const last = focusables.length > 0 ? focusables[focusables.length - 1] : previewEntryButtonRef.current;
      if (document.activeElement === last) {
        e.preventDefault();
        tileRef.current?.focus();
      }
    };

    // `elapsed` can now arrive as `""` (every channel on this card closed —
    // see the app-level `elapsed` prop's own call-site comment,
    // AgentNextGenPage.tsx) — appended conditionally so that doesn't leave
    // a dangling ", " with nothing after it.
    const ariaLabel = `${displayName}${isNewAssignment ? ", new assignment" : ""}${awaitingResponse ? ", awaiting response" : ""}${channelCount > 1 ? `, ${channelCount} open channels` : ""}${typeof elapsed === "string" && elapsed ? `, ${elapsed}` : ""}`;

    // Header row + channel list — the expanded card's actual content,
    // factored out so it can be rendered both by the real expanded return
    // below and inside the compact tile's hover popover (see `!expanded`
    // branch), without keeping two copies of this markup in sync by hand.
    //
    // `channelRows` factored out of `cardBody` itself (rather than inlined
    // straight into whichever wrapper below ends up rendering it) so the
    // `collapsible`/non-`collapsible` branches just below can pick between
    // two different WRAPPERS around the exact same rows, instead of two
    // separate copies of this `.map()` that would need to stay in sync by
    // hand.
    const channelRows = channels.map((ch, i) => {
              // Only ever highlighted on the active card — an inactive card's
              // "current" channel still renders plain, same as every other row.
              const highlighted = active && (channelKey(ch) === effectiveCurrentKey || !!ch.alwaysHighlighted);
              const RowComponent = ch.kind ? KindChannelRow : CHANNEL_ROW_COMPONENTS[ch.type];
              return (
                <RowComponent
                  key={`${channelKey(ch)}-${i}`}
                  kind={ch.kind}
                  elapsed={ch.elapsed}
                  hideChip={hideChip || ch.hideChip}
                  // Was missing entirely, same class of bug as `outcome`'s
                  // own doc comment just below — every other per-channel
                  // field here got forwarded from `ch`, but this one (added
                  // alongside `InteractionChannel.elapsedOverride`,
                  // channel-row.tsx) never made it into this explicit
                  // per-field list, so a consumer's on-hold chip silently
                  // never appeared — this row kept rendering its own plain
                  // clock+timer regardless of what `elapsedOverride` was set
                  // to.
                  elapsedOverride={ch.elapsedOverride}
                  onHoldElapsed={ch.onHoldElapsed}
                  statusBadge={ch.statusBadge}
                  recording={ch.recording}
                  preview={ch.preview}
                  highlighted={highlighted}
                  isFirst={i === 0}
                  awaitingResponse={ch.awaitingResponse}
                  awaitingSeverity={ch.awaitingSeverity}
                  removable={ch.removable}
                  removeVariant={ch.removeVariant}
                  menuItems={ch.menuItems}
                  // The standalone Consult / Transfer button is off unless the
                  // channel asks for it; when on, the kebab drops its copy.
                  showConsultTransfer={ch.showConsultTransfer ?? false}
                  consultTransferLabel={ch.consultTransferLabel}
                  consultTransferDisabledReason={ch.consultTransferDisabledReason}
                  endCallDisabledReason={ch.endCallDisabledReason}
                  showKebab={ch.showKebab}
                  alwaysShowOutcome={ch.alwaysShowOutcome}
                  showDismissButton={ch.showDismissButton}
                  onEndCall={ch.onEndCall}
                  controlsDisabled={ch.controlsDisabled}
                  direction={ch.direction}
                  // Keeps the hover-preview popover open (and its close
                  // timer disarmed) for as long as this row's own kebab
                  // dropdown is open — see `handleChannelMenuOpenChange`'s
                  // doc comment above.
                  onMenuOpenChange={(open) => handleChannelMenuOpenChange(channelKey(ch), open)}
                  // More than one open channel — "Unassign & Dismiss" only
                  // ends this one, not the whole card (see `onDismissChannel`
                  // above). With just one, ending it means ending the card.
                  // Passes the whole channel (not just its `type`) so a
                  // consumer with two same-type channels open can tell
                  // exactly which one to drop.
                  onDismiss={() => {
                    if (channels.length > 1) onDismissChannel?.(ch);
                    else onDismiss?.();
                  }}
                  onSelect={() => {
                    // Unconditional even when controlled — harmless (ignored
                    // by `effectiveCurrentKey` while `currentChannelKey` is
                    // defined) and keeps the uncontrolled path unchanged.
                    setManualCurrentKey(channelKey(ch));
                    onCurrentChannelChange?.(channelKey(ch));
                  }}
                  // Was missing entirely — every other per-channel field
                  // above (`elapsed`/`preview`/`awaitingResponse`/etc.) got
                  // forwarded from `ch`, but this one line never made it
                  // in, so `ChannelRow`'s Outcome button always rendered as
                  // its unwired-placeholder fallback (`outcome` undefined),
                  // silently doing nothing on click regardless of what the
                  // consumer passed on `InteractionChannel.outcome` — same
                  // bug in both the expanded card below and the compact
                  // tile's hover-preview popover, since both render THIS
                  // shared `cardBody` (see its own doc comment above).
                  //
                  // Wrapped (not passed straight through) so opening it
                  // also keeps the hover-preview popover open — same
                  // `openChannelMenuKeysRef`/`handleChannelMenuOpenChange`
                  // mechanism the kebab dropdown above already uses (see
                  // its own doc comment), just keyed with an `outcome:`
                  // prefix so the two popovers' open/close tracking can't
                  // collide if somehow both were open on the same row at
                  // once. Without this, the Outcome popover (portaled to
                  // `document.body`, same as the kebab's dropdown) sat
                  // outside this preview's own wrapper DOM-wise, so moving
                  // the pointer off the tile and into it still read as
                  // "left the card" — the 150ms close timer fired and
                  // unmounted the whole preview (Outcome popover included)
                  // out from under the agent before they could use it,
                  // same bug already fixed once for the kebab dropdown.
                  outcome={
                    ch.outcome && {
                      ...ch.outcome,
                      onOpenChange: (open: boolean) => {
                        handleChannelMenuOpenChange(`outcome:${channelKey(ch)}`, open);
                        ch.outcome!.onOpenChange(open);
                      },
                    }
                  }
                />
              );
    });

    // The chevron toggle rendered in `headerAction`'s spot when `collapsible`
    // is true (see that prop's own doc comment) — `Button variant="icon"
    // size="icon-sm"` per CLAUDE.md's Rule zero (no hand-rolled `<button>`s),
    // not `ActionIconButton`: that wrapper's own size scale (actions.tsx,
    // `ACTION_ICON_BUTTON_SIZE_MAP`) starts at `icon-md` (32px) and has no
    // way to reach `icon-sm` (24px) at all. 24px is what this needs to
    // actually match its neighbors — each channel row's own trailing button
    // cluster (channel-row.tsx) uses this exact same `Button variant="icon"
    // size="icon-sm"` for Consult/Transfer and Outcome, and `KebabMenuButton`
    // (kebab-menu-button.tsx, a separate hand-rolled trigger for unrelated
    // reasons — see its own doc comment — not a sign this one should be
    // hand-rolled too) is `h-6 w-6`, the same 24px, right below this row.
    // `h-3.5 w-3.5` on the icon itself (was `h-4 w-4`) matches
    // `KebabMenuButton`'s own `MoreVertical` icon size for the same reason.
    // Same `ChevronDown` + `rotate-180` treatment `Accordion`'s own trigger
    // chevron uses (accordion.tsx) for the identical "pointing down =
    // expanded, rotates to point up = collapsed" convention.
    // `stopPropagation` — this header row sits inside the card's own
    // `onClick`-handling wrapper (selecting/activating the interaction), so
    // without it, toggling the chevron would also select the card
    // underneath it, same fix already applied to the "Select Channel"
    // popover elsewhere in this app for the same "interactive control
    // nested inside a clickable row" shape.
    const channelsToggle = channels.length > 0 && (
      <Button
        variant="icon"
        size="icon-sm"
        title={channelsExpanded ? "Collapse channels" : "Expand channels"}
        aria-expanded={channelsExpanded}
        onClick={(e) => {
          e.stopPropagation();
          setChannelsExpanded((v) => !v);
        }}
      >
        <ShowMoreChevron open={channelsExpanded} size="sm" />
      </Button>
    );

    const cardBody = (
      <div className="relative z-[1] flex flex-col">
        {/* `px-3` (12px) — matches each channel row's own `px-3` below
            (channel-row.tsx's `ChannelRow`), so the whole card reads with
            one consistent 12px horizontal inset top to bottom rather than
            this name row sitting slightly wider (`px-4`/16px) than the
            rows beneath it.

            `pt-1` (was `pt-2`) — per explicit request/reference screenshot,
            matches `pb-1` (4px) so this row sits evenly centered top-to-
            bottom rather than sitting 4px closer to the bottom. Mattered
            most with `collapsible` (this component's own new chevron
            toggle) collapsed: with no channel rows left beneath it, this
            name row IS the whole visible card, and the old 8px-top/4px-
            bottom split read as visibly off-center rather than just a
            slightly-tight top inset above other content. */}
        {/* Hover tooltips on the header's icons, name and timer — only while the
            card is collapsed (`collapsible` with its channel rows hidden), where
            these are all that's left to read: the dot, count/channel badges and
            clock carry no visible text, and the name can be cut off. Expanded,
            the rows below already say all of it, so `disabled` keeps the same
            wrapper structure but never opens. */}
        <div className="flex items-center gap-2 px-3 pt-1 pb-1">
          {/* "New assignment" indicator — per explicit request, the FAR
              left of this row, ahead of even the open-channel-count/
              channel-type badge just below (see `isNewAssignment`'s own
              doc comment above). Plain dot (not the "!" glyph the compact
              tile's own corner badge uses) — this row already has the
              customer's name right next to it to carry the actual
              meaning, so a plain color signal reads clearly without
              needing its own icon here too. Colored by
              `newAssignmentSeverity`; `pulse` is the `Badge` dot's own ping ring. */}
          {isNewAssignment && (
            <Tooltip content="New assignment" placement="top">
              <Badge shape="circle" dot pulse variant={newAssignmentSeverity} size="sm" className="shrink-0" aria-label="New assignment" />
            </Tooltip>
          )}
          {/* Open-channel count — per explicit request, shown once there's
              more than one open channel to actually count (a single-
              channel card's own channel type is normally obvious from its
              one visible chip row below, so a "1" badge here would just be
              noise — EXCEPT while `collapsible` has that row hidden, see
              the sibling badge just below for that case). Same circular
              `Badge` shape/size the compact icon-rail tile already uses
              for this exact same count (see that branch's own
              `channelCount > 1` badge further down) — reused rather than a
              fresh style, just rendered inline here instead of absolutely
              positioned on a corner, since this expanded header has a
              normal flow row to sit in rather than a small square avatar
              to overlay. `aria-label` overridden (Badge's own default
              reads "N notifications", which is wrong here) — passed as a
              real prop so it lands in Badge's own `{...rest}` spread,
              which runs AFTER its internal default and so wins. */}
          {channelCount > 1 && (
            <Tooltip content={`${channelCount} open channels`} placement="top" disabled={!(collapsible && !channelsExpanded)}>
              <Badge
                shape="circle"
                size="sm"
                count={channelCount}
                className="shrink-0"
                aria-label={`${channelCount} open channels`}
              />
            </Tooltip>
          )}
          {/* Single-channel type indicator — per explicit follow-up
              request/reference screenshot: a COLLAPSED single-channel card
              (channel rows hidden — see `collapsible` above) lost the only
              place its channel type was visible at all, unlike the
              multi-channel case just above (a count is still informative
              collapsed OR expanded) or the non-collapsible case (the chip
              row is always right there). Same circular `Badge` shape/size
              as the count badge, colored via `getPillInlineStyles`
              (badge.tsx, exported for exactly this reuse) with
              `CHANNEL_TYPE_TAG_VARIANT`'s own purple/teal/pink channel-
              type color (channel-row.tsx — the same mapping this card's
              own `*ChannelRow` chips already use), so this reads as "the
              same channel, just badge-shaped" rather than an unrelated new
              color. That map's declared type is the wider `TagVariant`
              (it also covers non-color semantic names like "critical" for
              OTHER `Tag` consumers), but every value it actually assigns
              per `ChannelType` is one of the three color names also
              present in `BadgeColor` — the cast below is narrowing to what
              the map is already guaranteed to contain, not asserting
              something unverified. */}
          {collapsible && !channelsExpanded && channelCount === 1 && channels[0] && !channels[0].kind && (
            <Tooltip content={`${CHANNEL_TYPE_META[channels[0].type].label} channel`} placement="top">
            <Badge
              shape="circle"
              size="sm"
              className="shrink-0"
              style={getPillInlineStyles("subtle", CHANNEL_TYPE_TAG_VARIANT[channels[0].type] as BadgeColor)}
              aria-label={`${CHANNEL_TYPE_META[channels[0].type].label} channel open`}
            >
              {/* `h-2.5 w-2.5` (10px, was `CHANNEL_TYPE_META`'s own default
                  `h-4 w-4`/16px) — cloned down to fit this `size="sm"`
                  circle badge's own 16px diameter (`min-w-[16px] h-[16px]
                  px-1`, badge.tsx): the un-resized 16px icon would fill the
                  ENTIRE badge with none of its own `px-1` padding left to
                  breathe, the same "too cramped" problem this file's own
                  `size="sm"` numeric badges avoid by pairing that diameter
                  with `text-[10px]`, not full-size digits. */}
              {React.cloneElement(
                CHANNEL_TYPE_META[channels[0].type].icon as React.ReactElement<{ className?: string }>,
                { className: "h-2.5 w-2.5" }
              )}
            </Badge>
            </Tooltip>
          )}
          {/* Per explicit request: while a `collapsible` card is collapsed
              (channel rows hidden — and with them each row's own elapsed
              timer), the card-level `elapsed` timer is shown on the right,
              next to the chevron,, so the wait/call time stays visible. Only
              the NAME truncates: it keeps `flex-1` + `truncate`, so it
              yields space to the `shrink-0` timer, which floats to the
              right beside the chevron and is never clipped. Same severity colors as the
              compact tile's timer (onHold/critical/warning/success). */}
          {/* The full name in a tooltip while it's cut off (hover, or the card's keyboard focus); a collapsed card
              shows it either way. */}
          <Tooltip
            content={displayName}
            placement="top"
            onlyWhenTruncated={!(collapsible && !channelsExpanded)}
            // Keyboard focus opens it only while it's cut off: never on a collapsed card's name that fits.
            focusTarget={collapsible && !channelsExpanded ? undefined : cardButtonRef}
          >
            <span
              className={cn(
                "min-w-0 flex-1 truncate lyra-heading-sm text-lyra-fg-default"
              )}
            >
              {displayName}
            </span>
          </Tooltip>
          {collapsible && !channelsExpanded && elapsed && onHold && (
            // Per explicit request: while the call is on hold the timer
            // (the hold time) is a 12px pill badge with a pause icon.
            <Tooltip content={<>On hold: {elapsed}</>} placement="top">
            <Badge
              shape="pill"
              color={holdTone(elapsed, holdSeverity)}
              variant="subtle"
              fontSize={12}
              icon={<Pause strokeWidth={2} />}
              className="shrink-0"
              aria-label={typeof elapsed === "string" ? `On hold ${elapsed}` : "On hold"}
            >
              {/* Fixed-width time (tabular digits in a `5ch` box = "mm:ss"):
                  a hold never lasts an hour, so the badge keeps one constant
                  width as the digits tick instead of jittering the header. */}
              <span className="inline-block w-[5ch] text-center tabular-nums">{elapsed}</span>
            </Badge>
            </Tooltip>
          )}
          {collapsible && !channelsExpanded && elapsed && !onHold && (
            <Tooltip content={<>Duration: {elapsed}</>} placement="top">
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 lyra-body-xs",
                onHold
                  ? "text-lyra-status-critical-strong"
                  : severity === "critical"
                  ? "text-lyra-status-critical-strong"
                  : severity === "warning"
                  ? "text-lyra-status-warning-strong"
                  : severity === "success"
                  ? "text-lyra-status-success-strong"
                  : "text-lyra-fg-secondary"
              )}
              aria-label={typeof elapsed === "string" ? `Elapsed ${elapsed}` : "Elapsed"}
            >
              <Clock className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
              {/* Fixed-width time: tabular digits in a box sized to the
                  string's own length in `ch` ("mm:ss" = 5ch). It only widens
                  once, when a call passes an hour ("h:mm:ss"), and stays
                  constant while the digits tick. */}
              {/* A node's length isn't known: it gets the "mm:ss" 5ch as a minimum. */}
              <span
                className={cn("inline-block text-right tabular-nums", typeof elapsed !== "string" && "min-w-[5ch]")}
                style={typeof elapsed === "string" ? { width: `${elapsed.length}ch` } : undefined}
              >
                {elapsed}
              </span>
            </span>
            </Tooltip>
          )}
          {/* Per explicit follow-up request: `headerAction` (typically an
              "Add Channel" `+` trigger) and the collapse/expand chevron
              (`collapsible`, above) are no longer mutually exclusive in
              this one slot — a card can show BOTH side by side now,
              preserving the existing per-card collapse/"Collapse all"-
              "Expand all" bulk feature while still surfacing `headerAction`
              wherever a consumer passes one. Order: per a later explicit
              follow-up request, `headerAction` (a content action, typically
              "Add Channel") now renders FIRST/leftmost, with the chevron
              (a structural view control) after it — reversed from this
              slot's original chevron-then-action order — wrapped in a
              `shrink-0` row of their own so gap between them lines up with
              the rest of this header's spacing regardless of which one (or
              both, or neither) actually renders. */}
          {(collapsible || headerAction) && (
            <div className="flex shrink-0 items-center gap-0.5">
              {headerAction}
              {collapsible && channelsToggle}
            </div>
          )}
        </div>

        {channels.length > 0 && (
          collapsible ? (
            // CSS-only expand/collapse (`grid-template-rows: 0fr` ↔ `1fr`,
            // the standard "animate to auto height" trick) rather than a
            // JS-measured height or `Accordion`'s own `--radix-accordion-
            // content-height` variable (that variable is wired to Radix's
            // own `Accordion.Content`, not reusable here without pulling
            // this whole row list into a real `Accordion` instance) —
            // `overflow-hidden` on the inner wrapper clips the row list
            // while its grid track animates between the two sizes.
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-200 ease-in-out",
                channelsExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <div className="flex flex-col">{channelRows}</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">{channelRows}</div>
          )
        )}
        {footerAction && <div className="px-3 pb-3 pt-1">{footerAction}</div>}
      </div>
    );

    // The expanded card's own outer chrome (border/shadow/background),
    // shared between the real expanded return and the hover popover's
    // preview of it — same reasoning as `cardBody` above.
    const expandedCardClassName = cn(
      "relative flex w-full cursor-pointer flex-col overflow-hidden text-left transition-colors",
      // `radius` / `borders` (same props as `Container`): the corner radius token, and which sides draw the border.
      RADIUS_CLASSES[radius],
      borders === "all" ? "border" : containerBorderClasses(borders),
      // Per `onHold`'s own doc comment above: overrides the plain surface
      // background unconditionally while true — a `bg-lyra-bg-surface-base`
      // ternary'd branch here rather than baked into the base string above,
      // same reasoning as the border override just below.
      "bg-lyra-bg-surface-base",
      // The selection bar: a thick left border whenever the card is active, whatever `borders` says.
      active && "border-l-4",
      // Active cards get a permanent `shadow-md` (the "elevated" token per
      // Shadows.stories.tsx); inactive cards stay flat, hover or not — the
      // real expanded (rail-expanded) card intentionally has no hover
      // shadow. Only the compact tile below (and its hover-popover preview,
      // which reuses this same class) gets a hover shadow — see that
      // branch's own comment for why the drop shadow is scoped to the
      // collapsed rail specifically, per an explicit follow-up request.
      active && "shadow-md",
      // Two separate signals, both visible at once:
      //  - Severity outline: a card-level `"warning"`/`"critical"` severity
      //    outlines the WHOLE card in that status color whether or not the
      //    card is active, so an overdue card in the rail reads as overdue
      //    without having to be selected first. `"success"` stays an
      //    active-only tint, as before.
      //  - Selection bar: `active`'s thick left border (`border-l-4` above)
      //    is always the blue `border-active`, colored on the left edge only
      //    (`border-l-*`, after the outline color so it wins), so selection
      //    never reads as severity or vice versa.
      // An active card with no warning/critical severity is blue all round,
      // same as before.
      //
      // Each branch also gets a `hover:` darkening of that same border,
      // per an explicit follow-up request ("darker border color... around
      // the entire card" — this is the card's own outer chrome, shared by
      // both the real expanded card and the compact tile's hover-popover
      // preview above, which is why this lives here rather than as a
      // one-off on either render path). Two different techniques, deliberately:
      //  - The inactive card's `border-subtle` (rgba(0,0,0,.10) /
      //    rgba(255,255,255,.10), lyra-tokens.css) darkens to the real next
      //    tier up, `border-default` (.16 alpha) — an actual token that
      //    already exists for exactly this "a little darker than subtle"
      //    step, in both themes.
      //  - `border-active` (#166cca / #4896ec) and `status-critical-strong`
      //    (#bc2626 / #fa7f7f) have no such next-darker token — each is
      //    already its theme's most saturated tier, and `border-focus`
      //    isn't a substitute (it's yellow in dark mode, a focus-ring
      //    color, not a "darker active" one). `color-mix()` toward black
      //    is used instead, computed against whichever theme's value the
      //    token already resolves to, so it darkens correctly in both
      //    themes without hardcoding either one's hex directly.
      // `onHold` wins outright, ahead of `active`/`severity` — see its own
      // doc comment above: a held card's border is always the warning
      // treatment, whether or not it's also the active card or separately
      // awaiting a response.
      // `onHold` no longer tints the card border/background — per explicit
      // request, a held call keeps its normal severity / active styling.
      severity === "critical"
        ? "border-lyra-status-critical-strong hover:border-[color-mix(in_srgb,var(--lyra-color-status-critical-strong)_80%,black_20%)]"
        : severity === "warning"
        ? "border-lyra-status-warning-strong hover:border-[color-mix(in_srgb,var(--lyra-color-status-warning-strong)_80%,black_20%)]"
        : !active && newOutline
        ? "border-lyra-border-strong hover:border-[color-mix(in_srgb,var(--lyra-color-border-strong)_80%,black_20%)]"
        : !active
        ? "border-lyra-border-subtle hover:border-lyra-border-soft"
        : severity === "success"
        ? "border-lyra-status-success-strong hover:border-[color-mix(in_srgb,var(--lyra-color-status-success-strong)_80%,black_20%)]"
        : "border-lyra-border-active hover:border-[color-mix(in_srgb,var(--lyra-color-border-active)_80%,black_20%)]",
      // Selection bar (see above). `color:` hint so Tailwind reads the
      // arbitrary value as a color, not a border width.
      active &&
        "border-l-lyra-border-active hover:border-l-[color:color-mix(in_srgb,var(--lyra-color-border-active)_80%,black_20%)]"
    );

    /* ── Compact: icon-rail avatar tile ── */
    if (!expanded) {
      return (
        <Popover
          open={hoverCardOpen || !!forceHoverOpen}
          onOpenChange={setHoverCardOpen}
          placement="right"
          align="start"
          sideOffset={8}
          showArrow={false}
          // Hover-opened, not click-opened — stealing focus into the
          // popover the instant the pointer happens to land on the tile
          // would be disruptive (and isn't what a hover preview is for).
          onOpenAutoFocus={(e) => e.preventDefault()}
          // Radix's default on close is to return focus to the trigger —
          // exactly the compact tile itself, which (per its own onFocus
          // doc comment below) opens this same popover on focus. Left
          // unguarded, EVERY close (the 150ms mouse-away timer, Escape,
          // clicking elsewhere) refocused the tile, which immediately
          // reopened it right back — a close that never actually stuck,
          // confirmed live: `openHoverCard` firing again in the same tick
          // right after the close timer fired. This was also the real
          // cause of "hovering one tile sometimes opens a different one" —
          // with a card stuck permanently reopening itself, a second,
          // genuinely-hovered tile's own preview could end up rendered
          // alongside a first one that visually never left. Same "don't
          // hand focus back to the trigger on close" fix already
          // established for `TagPicker` (tag-picker.tsx) — this is that
          // same fix, just missing here until now.
          onCloseAutoFocus={(e) => e.preventDefault()}
          // Each channel row's kebab menu (`KebabMenuButton`, built on
          // `MenuRadix`/Radix DropdownMenu) portals its own dropdown content
          // straight to `document.body` — outside this hover popover's own
          // DOM subtree — same as every other Radix Popper-based primitive
          // (Popover, Select, DropdownMenu, Tooltip all share
          // `@radix-ui/react-popper` under the hood, and every one of their
          // portaled Content nodes gets wrapped in a
          // `[data-radix-popper-content-wrapper]` div). Radix's own
          // outside-interaction detection has no way to know that dropdown
          // "belongs" to this popover, so clicking a kebab item registers as
          // an interaction outside *this* popover's content and closes the
          // whole hover card out from under the menu — see the identical fix
          // for `FilterChip`'s nested dropdown-in-overflow-panel case
          // (CONTRIBUTING.md §17).
          onInteractOutside={(e) => {
            if ((e.target as Element)?.closest?.("[data-radix-popper-content-wrapper]")) {
              e.preventDefault();
            }
          }}
          // The preview card below already supplies its own complete
          // chrome (border/background/shadow, via `expandedCardClassName`)
          // matching the real expanded card exactly, so this popover's own
          // default panel styling is stripped down to a bare, invisible
          // frame around it — same "let the real content supply its own
          // chrome" convention `AddChannelButton`'s Menu-in-Popover uses
          // in create-new.tsx.
          className="z-[9999] w-64 rounded-lyra-sm border-0 bg-transparent p-0 shadow-none"
          // The preview card below supplies its own complete chrome (see
          // the comment above `className`) — Popover's default 16px body
          // inset would add an unwanted gap between this bare frame and
          // that card's own edges.
          bodyPadding={false}
          content={
            <div
              // Re-arms the open state on its own hover so moving the
              // pointer from the tile into this preview (to actually read
              // it or click something in it) doesn't let the close timer
              // started by leaving the tile go on to close it.
              onMouseEnter={openHoverCard}
              onMouseLeave={scheduleCloseHoverCard}
              // Keyboard equivalent of the mouseenter/mouseleave pair above
              // — see the compact tile's own `onFocus`/`onBlur` doc comment
              // below for why this needs to exist at all. React's
              // `onFocus`/`onBlur` bubble (unlike native `focus`/`blur`),
              // so these fire for a focus landing on ANY descendant here —
              // the "+" headerAction, a channel row, its kebab button —
              // not just this wrapper div itself, exactly mirroring how
              // `onMouseEnter`/`onMouseLeave` already re-arm/disarm the
              // close timer for the mouse case above. Tabbing onward from
              // the compact tile into this now-open preview keeps it open;
              // tabbing past its last focusable element with nothing else
              // grabbing focus within `scheduleCloseHoverCard`'s own delay
              // lets it close, same as moving the mouse away.
              onFocus={openHoverCard}
              onBlur={scheduleCloseHoverCard}
              onKeyDown={handlePreviewContentKeyDown}
              // Mouse clicks anywhere on the card (name, a channel row,
              // empty space) bubble up to here — `cardBody` paints ABOVE
              // the stretched Button below, so the Button itself only ever
              // receives keyboard/AT activation, whose synthesized click
              // also bubbles here. Clicks on the card's own real controls
              // (chevron, kebab, Outcome, etc.) already stopPropagation.
              // A click handler on a non-interactive div is fine for a11y
              // because the Button is the keyboard/AT equivalent.
              onClick={onClick}
              ref={previewContentRef}
              // `shadow-md` added here only (not baked into
              // `expandedCardClassName` itself, which the real expanded
              // card also uses and should stay flat) — always on while this
              // preview is shown, not just conditional on hover, per an
              // explicit follow-up ("this should always be there"). Skipped
              // when `active`, which already carries its own permanent
              // shadow via `expandedCardClassName`.
              className={cn(expandedCardClassName, !active && "shadow-md")}
            >
              {/* Stretched hit-target (CONTRIBUTING.md §0 — never a
                  hand-rolled `<button>`): a real, invisible `Button`
                  covering the whole preview, a sibling of `cardBody` rather
                  than an ancestor of it, so nothing here nests one
                  interactive element inside another (the axe-core
                  `no-focusable-content` violation this whole restructuring
                  fixes). `absolute inset-0` sizes it against this div's own
                  `relative` (baked into `expandedCardClassName`); its
                  default `z-index: auto` keeps it painting BELOW
                  `cardBody`'s own `relative z-[1]` wrapper, so it never
                  blocks clicks to any of `cardBody`'s real action buttons
                  (CSS 2.1 painting order, category 6 vs. 3/5). Mouse clicks
                  therefore land on `cardBody` and bubble to this div's
                  onClick; the Button is the keyboard/AT entry point, and its
                  synthesized click bubbles to the same handler. Visible
                  chrome stripped via `className` overrides; the
                  focus-visible ring it inherits from `Button`'s own base
                  classes is what now traces the whole card's edge when
                  Tab lands here, replacing the ring this div used to carry
                  itself. */}
              <Button
                ref={previewEntryButtonRef}
                variant="ghost"
                aria-label={ariaLabel}
                onKeyDown={handlePreviewEntryKeyDown}
                className="absolute inset-0 h-full w-full p-0 hover:bg-transparent active:bg-transparent"
              />
              {cardBody}
            </div>
          }
        >
          <div
            ref={setTileRef}
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={handleTileKeyDown}
            onMouseEnter={openHoverCard}
            onMouseLeave={scheduleCloseHoverCard}
            // Keyboard equivalent of the hover pair above — per explicit
            // accessibility request: this compact tile's own popover
            // preview (`content` above) is the ONLY way to reach anything
            // in the expanded card — the "+" headerAction, each channel
            // row, its kebab menu (Outcome/Consult-Transfer/etc.) — and
            // Radix's `Popover.Content` isn't even mounted into the DOM
            // while closed, so a keyboard user tabbing to this tile
            // previously had no way to open it at all: pressing Tab again
            // just skipped straight past every bit of that content to the
            // next rail item. Opening on focus (and closing on blur, via
            // the exact same `openHoverCard`/`scheduleCloseHoverCard`
            // functions the mouse handlers already use — including their
            // existing "don't close while a channel row's own kebab
            // dropdown is open" guard) makes tabbing here behave like
            // hovering it, with no change to the mouse experience at all.
            onFocus={openHoverCard}
            onBlur={scheduleCloseHoverCard}
            aria-label={ariaLabel}
            aria-current={active ? "true" : undefined}
            className={cn(
              // `mb-2` lives here (on the item itself) rather than as a `gap` on
              // LeftNav's wrapping container, so spacing between cards — and
              // between the last card and the nav list below it — only appears
              // when there's an actual rendered tile to carry it. A parent `gap`
              // would still reserve that space even with zero interactions open,
              // since LeftNav's `header` slot is an always-truthy React node
              // (a Fragment around a `.map()`) even when it renders nothing.
              "flex cursor-pointer flex-col items-center gap-1 rounded-lyra-sm p-1.5 mb-2 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
              // No shadow on the tile itself, hover or not — per an explicit
              // follow-up, the drop shadow belongs only on the hover-popover
              // preview card above (the thing that actually appears on
              // hover), not this small icon-rail square.
              //
              // Background driven by `hoverCardOpen` state, not CSS `:hover`
              // — the pointer leaves this tile's own DOM node the moment it
              // moves into the preview popover next to it, which would
              // otherwise drop the `:hover` pseudo-class (and the
              // background with it) even though the preview it triggered is
              // still open and the tile should still read as "the one being
              // shown." `hoverCardOpen` stays true across that move (the
              // preview's own onMouseEnter re-arms it), so the background
              // does too.
              active ? "bg-lyra-bg-surface-base shadow-sm" : hoverCardOpen && "bg-lyra-state-hover",
              className
            )}
          >
            <span className="relative inline-flex">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lyra-sm border lyra-body-sm-emphasis",
                  tone.bg,
                  tone.text,
                  // `newOutline` (not yet opened) darkens the collapsed tile's border too, as it does the expanded
                  // card's — unless a warning or critical severity already speaks for it.
                  !active && newOutline && severity !== "critical" && severity !== "warning" ? "border-lyra-border-strong" : tone.border
                )}
                aria-hidden="true"
              >
                {hasCustomerName ? initials : <User className="h-4 w-4" strokeWidth={1.5} />}
              </span>
              {/* A channel-less card's kind, in the corner a channel count would take. */}
              {kindIcon && channels.every((c) => c.kind) && (
                <span
                  className="absolute -left-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-lyra-border-subtle bg-lyra-bg-surface-base text-lyra-fg-secondary [&>svg]:h-3 [&>svg]:w-3"
                  aria-hidden="true"
                  data-kind-icon=""
                >
                  {kindIcon}
                </span>
              )}
              {/* Per explicit follow-up: the top-left "!" badge is
                  reserved for SLA-breach signaling (`severity ===
                  "critical"`, below) — `isNewAssignment` does NOT also
                  render it here, only the bottom-right red dot
                  (`cornerDotVariant`, further down) and the expanded
                  header's own red dot (above `cardBody`). Overloading
                  this corner's alert glyph with a second, unrelated
                  meaning would make it ambiguous which one a red "!" was
                  actually reporting. */}
              {channelCount > 1 && (
                <span
                  className={cn(
                    "absolute -left-1.5 -top-1.5 flex h-[18px] items-center justify-center rounded-full font-bold text-lyra-fg-on-primary",
                    // Fixed `w-[18px]` (not `min-w`) for the icon case — per
                    // explicit follow-up, letting the icon's own intrinsic
                    // width push this wider than 18px (via `min-w` alone)
                    // stretched the badge into an oval/rounded-square
                    // instead of staying a small circle. The plain digit
                    // case below keeps its original `min-w-[18px] px-1`
                    // (and needs to: a 2-digit count, e.g. "12", genuinely
                    // is wider than 18px and should grow as a pill rather
                    // than get clipped) — only the icon glyphs get the
                    // hard-capped square treatment, since `h-2.5 w-2.5`
                    // below is small enough to always fit inside 18px with
                    // room to spare.
                    severity === "critical" || severity === "warning" ? "w-[18px]" : "min-w-[18px] px-1 text-[10px]",
                    // Blue by default — only switches to the same critical
                    // red / warning amber / success green (see `severity`)
                    // the avatar/border already use once the interaction is
                    // actually awaiting a response. This badge is just a
                    // count, not itself a "needs attention" signal, so it
                    // shouldn't default to a status color the way a
                    // notification badge would.
                    severity === "critical"
                      ? "bg-lyra-bg-destructive"
                      : severity === "warning"
                      ? "bg-lyra-status-warning-strong"
                      : severity === "success"
                      ? "bg-lyra-status-success-strong"
                      : "bg-lyra-bg-primary"
                  )}
                  aria-label={
                    severity === "critical"
                      ? "SLA breached"
                      : severity === "warning"
                      ? "Nearing SLA breach"
                      : `${channelCount} open channels`
                  }
                >
                  {/* Per explicit request, once this card is actually
                      overdue ("warning"/"critical"), this badge swaps from
                      the plain channel count to the exact same glyph
                      `ChannelTab`'s own `tabIcon` uses (channel-row.tsx) for
                      the matching tier — a triangle for "warning", a
                      circled "!" for "critical" — so a collapsed, multi-
                      channel card reads as an alert at a glance, the same
                      way the record-header tab bar already does, instead of
                      staying a neutral count no matter how late it's gotten.
                      The green "success" tier keeps the plain count — a
                      channel that's right on track isn't something to alert
                      on — same reasoning `tabIcon` itself uses. `currentColor`
                      stroke inherits this badge's own `text-lyra-fg-on-
                      primary` (white), same contrast treatment the digit it
                      replaces already had. */}
                  {severity === "critical" ? (
                    <CircleAlert className="h-2.5 w-2.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
                  ) : severity === "warning" ? (
                    <TriangleAlert className="h-2.5 w-2.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
                  ) : (
                    <span aria-hidden="true">{channelCount}</span>
                  )}
                </span>
              )}
              {cornerDotVariant && (
                /* Bottom-right corner (was top-right), now a small `Badge`
                   dot (`size="sm"` — Badge's own size vocabulary) instead
                   of a bespoke span, so this dot indicator shares the same
                   implementation as every other corner badge in the
                   library. `cornerDotVariant` ("success" | "warning" |
                   "critical") lines up 1:1 with `Badge`'s own
                   `BadgeCircleVariant` values — green/amber still escalate
                   with `awaitingResponse` exactly as before
                   (`getAwaitingSeverity`, AgentNextGenPage.tsx); red now
                   means "new assignment" specifically (see
                   `cornerDotVariant`'s own doc comment above). */
                <Badge
                  shape="circle"
                  dot
                  pulse={isNewAssignment}
                  variant={cornerDotVariant}
                  size="sm"
                  className="absolute bottom-[-2px] right-[-2px] ring-2 ring-lyra-bg-surface-shell"
                  aria-hidden="true"
                />
              )}
            </span>
            {/* Same "success"/"warning"/"critical" color escalation
                `ChannelRow`'s own elapsed-time text uses (channel-row.tsx)
                and `Tab`'s own `textColorClass`/`iconColorClass` (tabs.tsx)
                — per explicit request, this compact tile's timer shouldn't
                be the one place that stays plain gray no matter how overdue
                the card actually is. Deliberately NOT `tone.text` (used for
                the avatar above): that falls back to a blue "info" tint
                even while nothing's awaiting at all, which would recolor
                this timer on every ordinary card, not just an overdue one —
                this stays the plain gray `text-lyra-fg-secondary` look
                whenever `severity` is `null`, same as before.
                Skipped entirely (not just left blank) when `elapsed` is
                `""` — per a further explicit follow-up, once every channel
                on this card is closed there's nothing left to count, so the
                counter itself is removed rather than showing a stale/frozen
                time (the app-level caller is what actually decides when to
                pass `""` — see `elapsed`'s own call-site comment,
                AgentNextGenPage.tsx). */}
            {elapsed && (
              <span
                className={cn(
                  "lyra-body-xs tabular-nums",
                  // `onHold` wins outright, ahead of `severity` — same
                  // "held call is a stronger signal" precedent the outer
                  // card's own border/background treatment already
                  // establishes (see `onHold`'s own doc comment above).
                  // Per explicit request, this counter now reads
                  // `elapsed`'s own hold-time value (app-level `elapsed`
                  // prop's own call-site comment) in the same red the rest
                  // of the app already uses for "on hold"/critical states,
                  // rather than staying plain gray while the tile's avatar
                  // badge and border have already escalated.
                  // Per explicit request: on hold, the collapsed rail shows
                  // just the counter (plain text, no badge/icon — the pause
                  // indicator is the avatar's top badge, and a pill doesn't
                  // fit the narrow rail), colored by hold SLA (15s warning,
                  // 30s critical).
                  (onHold ? holdTone(elapsed, holdSeverity) : severity) === "critical"
                    ? "text-lyra-status-critical-strong"
                    : (onHold ? holdTone(elapsed, holdSeverity) : severity) === "warning"
                    ? "text-lyra-status-warning-strong"
                    : (onHold ? holdTone(elapsed, holdSeverity) : severity) === "success"
                    ? "text-lyra-status-success-strong"
                    : "text-lyra-fg-secondary"
                )}
                aria-label={onHold ? (typeof elapsed === "string" ? `On hold ${elapsed}` : "On hold") : undefined}
                aria-hidden={onHold ? undefined : true}
              >
                {elapsed}
              </span>
            )}
          </div>
        </Popover>
      );
    }

    // Per explicit request: while the LEFT NAV ITSELF is expanded (this is
    // the real full-detail card, not the icon-rail compact tile/hover-
    // preview above — those don't get this), clicking a COLLAPSED card
    // also expands its channel list, instead of the agent having to
    // separately hit the chevron after selecting it. Only acts when
    // there's actually something to expand (`collapsible && !channelsExpanded`
    // — a no-op otherwise, so this never fights a card that's already open
    // or one that isn't collapsible at all); `onClick` (the consumer's own
    // select/activate handler) always still fires either way, unchanged.
    const handleExpandedCardActivate = () => {
      if (collapsible && !channelsExpanded) setChannelsExpanded(true);
      onClick?.();
    };

    /* ── Expanded: full detail card ── */
    return (
      <div
        ref={ref}
        // See the hover-preview wrapper's own onClick comment above: mouse
        // clicks bubble here (cardBody sits above the stretched Button);
        // the Button's own keyboard-synthesized click bubbles here too.
        onClick={handleExpandedCardActivate}
        // `mb-2` (not baked into `expandedCardClassName`, which the compact
        // mode's hover-popover preview above also uses — that preview floats
        // in a Popover and shouldn't pick up a bottom margin) — same
        // per-item-not-parent-gap spacing as the compact tile above.
        className={cn(expandedCardClassName, "mb-2", className)}
      >
        {/* Stretched hit-target (CONTRIBUTING.md §0 — never a hand-rolled
            `<button>`): see the identical pattern on the hover-preview
            wrapper above for the full stacking/painting-order reasoning.
            It carries no onClick of its own: a real <button> turns
            Enter/Space into a click that bubbles to the wrapper's onClick
            above, so keyboard, screen reader and mouse all run the same
            handler once. */}
        <Button
          ref={cardButtonRef}
          variant="ghost"
          aria-label={ariaLabel}
          aria-current={active ? "true" : undefined}
          className="absolute inset-0 h-full w-full p-0 hover:bg-transparent active:bg-transparent"
        />
        {cardBody}
      </div>
    );
  }
);
InteractionNavItem.displayName = "InteractionNavItem";

export type { InteractionChannel, ChannelType } from "./channel-row";
export { InteractionNavItem };
