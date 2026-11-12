import * as React from "react";
import {
  Clock,
  MessageSquare,
  MessageCircle,
  Mail,
  Phone,
  TriangleAlert,
  CircleAlert,
  UserX,
  ArrowLeftRight,
  PhoneIncoming,
  PhoneOutgoing,
  CircleCheck,
  CircleCheckBig,
  Send,
  FileDown,
  Languages,
  PlayCircle,
  X,
  Trash2,
  MessageSquareShare,
  PhoneOff,
  Pause,
  Circle,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Badge } from "./badge";
import { getHoldBadgeColor } from "./hold-sla";
import { Tag, tagVariants, type TagVariant } from "./tag";
import { type MenuEntry } from "./menu";
import { KebabMenuButton } from "./kebab-menu-button";
import { Tab } from "./tabs";
import { Tooltip } from "./tooltip";
import { Button } from "./button";
import { Popover } from "./popover";
import { Label } from "./label";
import { formatPhoneForDisplay } from "./phone-input";
// The Outcome popover's config type + the two shared builders that
// both ChannelRow (below) and ChannelTab (further down) call to render
// it now live in their own module — see that file's own doc comment.
// Re-imported (not re-defined) here so both call sites are unchanged.
import {
  type ChannelOutcomeConfig,
  useOutcomePopoverState,
  buildOutcomePopoverSlots,
} from "./outcome-panel";
export type { ChannelOutcomeConfig };

/* ── WhatsApp icon (not in Lucide) ──
 * Accepts `className` (default `h-3 w-3`, the chip-sized icon `ChannelRow`
 * itself uses) so a larger context — e.g. `ChannelTab`'s tab-sized icon slot
 * below — can size it up without a second hand-copied `<svg>`. */
const WhatsAppIcon = ({ className = "h-3 w-3" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/** Per explicit request ("update the consult/transfer icon to be 2 arrows
 *  like in screenshot 2") — was a Person + redirect-arrow composite (no
 *  single Lucide icon covered "transfer" at the time); replaced with
 *  Lucide's own `ArrowLeftRight` (two opposing horizontal arrows), a
 *  single glyph, so this is now a plain icon rather than a composed one. */
/** A disabled button takes no pointer events, so its reason tooltip sits on a wrapping span. No reason: the child alone. */
const WithDisabledReason = ({ reason, children }: { reason?: string; children: React.ReactNode }) =>
  reason ? (
    <Tooltip content={reason} placement="top">
      <span className="inline-flex" data-disabled-reason={reason}>
        {children}
      </span>
    </Tooltip>
  ) : (
    <>{children}</>
  );

const ConsultTransferIcon = () => (
  <ArrowLeftRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
);

/** Whether a channel was customer-initiated ("inbound") or agent-initiated
 *  ("outbound") — per explicit request (Agent Workspace 2.0 Phase 1 & Phase
 *  2 only), drives the direction-aware icon swap `VoiceDirectionIcon`/
 *  `SmsDirectionIcon` below render. Omit entirely for a channel whose
 *  direction isn't tracked/known — both icons fall back to their plain,
 *  pre-existing glyph in that case, so every consumer that doesn't pass
 *  this renders exactly as before. */
export type ChannelDirection = "inbound" | "outbound";

/** Voice call direction — dedicated Lucide icons cover this natively, so
 *  this just swaps the base `Phone` glyph for `PhoneIncoming`/
 *  `PhoneOutgoing` once `direction` is known. See `ChannelDirection`'s own
 *  doc comment for the omitted-direction fallback. */
export const VoiceDirectionIcon = ({
  direction,
  className = "h-3 w-3",
}: {
  direction?: ChannelDirection;
  className?: string;
}) => {
  if (direction === "inbound") return <PhoneIncoming className={className} strokeWidth={1.5} />;
  if (direction === "outbound") return <PhoneOutgoing className={className} strokeWidth={1.5} />;
  return <Phone className={className} strokeWidth={1.5} />;
};

/** SMS direction — per explicit follow-up request/screenshot (Lucide's own
 *  "message-square-share" icon page, "use this icon and just flip the arrow
 *  for inbound"), this is now Lucide's real `MessageSquareShare` glyph — a
 *  single, purpose-built icon (message square + an arrow escaping its top-
 *  right corner), not a hand-assembled composite. Superseded the earlier
 *  `MessageSquare` + absolute-positioned `ArrowUpRight`/`ArrowDownLeft`
 *  corner-badge overlay (see git history) — that composite's badge kept
 *  needing separate size/offset tuning to stay inside `ChannelRow`'s own
 *  small chip (a real, previously-fixed bug: it overflowed the chip's
 *  rounded border), a problem this single pre-drawn icon doesn't have at
 *  all, since the arrow is already an integral part of the glyph's own
 *  bounding box.
 *
 *  Outbound renders `MessageSquareShare` as-is (arrow escaping up-right —
 *  already reads as "sent out"). Inbound mirrors it horizontally
 *  (`-scale-x-100`) rather than a hand-drawn separate icon — same glyph,
 *  same box, just flipped so the arrow points up-LEFT instead, per the
 *  explicit request to "just flip the arrow." See `ChannelDirection`'s own
 *  doc comment for the omitted-direction fallback (still the plain
 *  `MessageSquare`, unchanged — direction only matters once it's known). */
export const SmsDirectionIcon = ({
  direction,
  className = "h-3 w-3",
}: {
  direction?: ChannelDirection;
  className?: string;
}) => {
  if (!direction) return <MessageSquare className={className} strokeWidth={1.5} />;
  return (
    <MessageSquareShare
      className={cn(className, direction === "inbound" && "-scale-x-100")}
      strokeWidth={1.5}
      aria-hidden="true"
    />
  );
};

/* ── Channel types ── */

export type ChannelType = "chat" | "email" | "sms" | "whatsapp" | "voice";

/** Channel-type → `Tag` color, per CONTRIBUTING.md's "Channel type colors"
 *  convention — Voice is purple, Email is pink, and Chat/SMS/WhatsApp (three
 *  genuinely distinct channels — a website chat widget, texting, and a
 *  WhatsApp thread are three different conversations an agent can have with
 *  the same customer at once, see `ChannelType`'s own doc comment) each get
 *  their own color rather than sharing one, per explicit request: three
 *  same-colored chips in a row (the old "all text channels read as Chat"
 *  simplification) made it too easy to mistake one open channel for
 *  another at a glance. Deliberately NOT one of the reserved status colors
 *  (`success`/`warning`/`critical`/`info`) for any of the three — those
 *  stay reserved for state (resolved/pending/error/informational), same
 *  reasoning CONTRIBUTING.md already gives for Voice/Email. Used by each
 *  `*ChannelRow` below for its chip's non-`awaitingResponse` color (see
 *  `ChannelRow`'s own `variant` prop — `awaitingResponse` still always
 *  overrides to "critical" red regardless of channel type, since that's a
 *  status signal, not a type signal). */
export const CHANNEL_TYPE_TAG_VARIANT: Record<ChannelType, TagVariant> = {
  voice: "purple",
  chat: "teal",
  sms: "neutral",
  whatsapp: "default",
  email: "pink",
};

/** A non-channel assignment row's chip and Outcome (`InteractionChannel.kind`). */
export interface ChannelKindRow {
  label: string;
  icon: React.ReactNode;
  outcome?: React.ReactNode;
}

export interface InteractionChannel {
  /** Hides this row's channel chip (the "Chat"/"Voice" pill). The channel
   *  name stays available to screen readers. `InteractionNavItem`'s own
   *  `hideChip` hides it on every row at once. */
  hideChip?: boolean;
  /** A row for an assignment that isn't a channel — a callback, task,
   *  meeting… — on the same card as its channels, in whatever order the
   *  consumer lists them. The chip shows this label and icon (neutral)
   *  instead of `type`'s; everything else is a normal row (elapsed, preview,
   *  the Outcome/kebab cluster, highlight, select). `type` isn't shown for
   *  it. `outcome`: the consumer's own Outcome trigger (with its popover),
   *  in the Outcome button's place, for a kind whose outcome isn't a
   *  contact's. Unset (default): a channel row, as before. */
  kind?: ChannelKindRow;
  /** Keeps this row blue-highlighted (like the current channel) even when it isn't the card's current channel, e.g. a live call alongside an open chat. Only applies on the active card. */
  alwaysHighlighted?: boolean;
  /** Unique identifier for this specific channel instance. Required to
   *  distinguish between two simultaneously open channels of the same
   *  `type` on one interaction — e.g. two SMS threads with the same
   *  customer on different phone numbers — since `InteractionNavItem` uses
   *  this (falling back to `type` when omitted) to decide which row is
   *  "current", which row a click/kebab-dismiss actually targets, and what
   *  React key each row renders with. Safe to omit when an interaction
   *  never opens more than one channel of the same `type` at once — `type`
   *  alone is a fine identifier in that case. */
  id?: string;
  /** Which channel this row represents — determines its icon, label, and
   *  default kebab menu items (see `ChatChannelRow` / `EmailChannelRow` /
   *  `SmsChannelRow` / `WhatsAppChannelRow` / `VoiceChannelRow` below).
   *  Override the menu for one specific row via `menuItems`. */
  type: ChannelType;
  /** Elapsed time for this channel's last message, as 4-digit MM:SS, or "Now".
   *  Pass `""` for a channel with nothing to time yet (e.g. an agent-
   *  initiated channel still waiting on the customer's very first reply) —
   *  the clock icon + text are omitted entirely rather than showing a blank
   *  or misleadingly-ticking value. Or a node that renders the time itself
   *  (a self-ticking timer): the row then doesn't re-render each second,
   *  and its accessible name leaves the time out. */
  elapsed: React.ReactNode;
  /** Replaces the clock-icon + `elapsed` span entirely with arbitrary
   *  content (e.g. a small colored chip) — per explicit request ("have the
   *  on hold chip replace the timer in hold calls"): a live voice channel
   *  the agent has navigated away from reads as "on hold" via `OnHoldBadge
   *  .tsx`'s `OnHoldPill` (agent-next-gen-v3, app-local — deliberately NOT
   *  imported here, same "build new things locally" convention that
   *  component's own doc comment already establishes) in its card header,
   *  and this prop is what lets that same on-hold state also replace THIS
   *  row's own running "01:57" timer, which would otherwise keep ticking
   *  right alongside it and read as contradictory. `preview` above is
   *  untouched either way (still renders normally alongside whichever of
   *  `elapsedOverride`/`elapsed` wins) — only the clock+time half of this
   *  line is ever swapped. Takes priority over `elapsed` whenever both are
   *  supplied (checked first, via `??`) — omit to leave this row's plain
   *  clock+text behavior exactly as before (every other caller). */
  elapsedOverride?: React.ReactNode;
  /** Per explicit request ("when a call is placed on hold, add an on hold
   *  timer below the call timer in the call controls and in the
   *  interaction nav item") — see `ChannelRowProps.onHoldElapsed`'s own
   *  doc comment (this is the same field, just declared here on the
   *  per-channel data object `InteractionNavItem` iterates over, same
   *  split `elapsedOverride` above already has between this type and
   *  `ChannelRowProps`). Omit to render nothing extra. */
  onHoldElapsed?: string;
  /** A status chip on its own line below the preview/timer line (after the
   *  on-hold badge, if any) — e.g. a `Badge shape="pill" variant="subtle"`
   *  reading "Needs outcome · 00:42". The consumer supplies the whole chip;
   *  the timer above is untouched. See `ChannelRowProps.statusBadge`. */
  statusBadge?: React.ReactNode;
  /** The call is being recorded: the timer's clock icon becomes a pulsing
   *  red dot (the voice call controls' own recording dot) and the timer
   *  keeps counting. See `ChannelRowProps.recording`. */
  recording?: boolean;
  /** Message preview for this channel. */
  preview?: string;
  /**
   * Whether this is the channel currently open/being viewed for this
   * interaction. Only highlighted (blue background) when the parent
   * `InteractionNavItem` itself is `active` — on an inactive card, no
   * channel row is highlighted even if one is marked `current`.
   */
  current?: boolean;
  /** Whether this specific channel is the one awaiting a response —
   *  renders its chip and elapsed-time in critical (red) instead of
   *  success (green) / secondary gray. */
  awaitingResponse?: boolean;
  /** When `awaitingResponse` is true, which visual tier to render —
   *  `"success"` (green) for a reply that just landed and is still well
   *  within SLA, `"warning"` (amber) once the wait's gotten old enough to
   *  need attention, `"critical"` (red) once it's genuinely overdue.
   *  Ignored when `awaitingResponse` is false, and defaults to `"critical"`
   *  when left unset while `awaitingResponse` IS true — matching this
   *  prop's own pre-existing binary behavior, so any consumer that doesn't
   *  pass it renders exactly as before. Lets a consumer with real wait-time
   *  data (e.g. seconds since the customer's last message) drive a
   *  three-stage escalation instead of jumping straight to red the instant
   *  a reply is pending. */
  awaitingSeverity?: "success" | "warning" | "critical";
  /** Show the trailing kebab (⋮) menu for this channel row. Default: true. */
  removable?: boolean;
  /** When `removable` is `false` (see that prop's own doc comment), which
   *  close-button treatment `ChannelRow`'s fallback renders in the kebab's
   *  place — plain "×"/"Close" (default, `"close"`) for an already-closed
   *  channel/interaction, or a red trash icon reading "Delete Draft"
   *  instead, for a genuine, never-launched draft thread (an agent-
   *  initiated channel with no messages sent yet — the same signal that
   *  sets `removable={false}` for it in the first place). Ignored while
   *  `removable` isn't `false`. Default `"close"` — every existing caller
   *  (previously the only case this fallback ever rendered for) renders
   *  exactly as before without passing this. */
  removeVariant?: "close" | "delete-draft";
  /** Override this row's default (per-`type`) kebab menu items. */
  menuItems?: MenuEntry[];
  /** Wires this channel's "Outcome" button to a real popover — see
   *  `ChannelOutcomeConfig`'s own doc comment (below `buildVoiceMenuItems`)
   *  for the full explanation. Omit to leave that button unwired. */
  outcome?: ChannelOutcomeConfig;
  /** Show the standalone "Consult / Transfer" icon button (left of Outcome
   *  in the hover-reveal overlay, or the record header's own copy of this
   *  same cluster — see `ChannelRowProps.showConsultTransfer`'s own doc
   *  comment for the full reasoning). Default: true. Per explicit request
   *  (Agent Workspace 2.0 Phase 1 only), the one consumer that needs this
   *  false is `AgentNextGenPage.tsx`'s own `channels` builder — every other
   *  caller omits this and keeps the button exactly as before. */
  showConsultTransfer?: boolean;
  /** The standalone transfer button's name, for a channel with no consult
   *  (e.g. "Transfer"). Default: "Consult / Transfer". */
  consultTransferLabel?: string;
  /** Disables the transfer button and says why in a tooltip. */
  consultTransferDisabledReason?: string;
  /** Disables the End Call button (see `onEndCall`) and says why in a tooltip. */
  endCallDisabledReason?: string;
  /** Show the trailing "More Options" kebab (⋮) button — see
   *  `ChannelRowProps.showKebab`'s own doc comment for the full reasoning.
   *  Default: true. Per explicit request (Agent Workspace 2.0 Phase 1
   *  only), the one consumer that needs this false is `AgentNextGenPage.
   *  tsx`'s own `channels` builder — every other caller omits this and
   *  keeps the kebab exactly as before. */
  showKebab?: boolean;
  /** Keep the Consult/Transfer + Outcome overlay permanently visible
   *  instead of hover/focus-revealed — see `ChannelRowProps.
   *  alwaysShowOutcome`'s own doc comment for the full reasoning. Default:
   *  true — per explicit request ("always display the outcome button in
   *  the interactionNavItems - no longer have them display on hover
   *  only"), every consumer gets the always-visible treatment without
   *  needing to opt in individually. Pass `false` explicitly to keep the
   *  old hover-reveal behavior for a specific row. */
  alwaysShowOutcome?: boolean;
  /** Show a standalone "Unassign & Dismiss" icon button in this overlay —
   *  see `ChannelRowProps.showDismissButton`'s own doc comment for the
   *  full reasoning. Default: false (every other consumer keeps this
   *  action buried in the kebab's menu only, same as before). */
  showDismissButton?: boolean;
  /** Whether this channel was customer-initiated or agent-initiated — for
   *  `type: "voice"`/`"sms"` only, swaps the row's icon to a direction-
   *  aware glyph (`VoiceDirectionIcon`/`SmsDirectionIcon` above) — per
   *  explicit request (Agent Workspace 2.0 Phase 1 & Phase 2 only). Omit
   *  to leave the plain, pre-existing `Phone`/`MessageSquare` icon exactly
   *  as before (every other channel `type`/consumer ignores this). */
  direction?: ChannelDirection;
  /** Renders a standalone solid-red "End Call" icon button immediately to
   *  the right of the Outcome button — per explicit request ("add an end
   *  call solid red icon to the right of the outcome check buttons in
   *  active call interactionNavitems"), so an agent can hang up a live
   *  voice call straight from its own LeftNav row without first switching
   *  back to it (e.g. while it's on hold — see `elapsedOverride`'s own
   *  doc comment just above). Voice-only in practice (every consumer only
   *  ever sets this for a `type: "voice"` channel), but not restricted to
   *  it here — same "this row has no opinion on what counts as an active
   *  call, just how to render the button once told to" split
   *  `ChannelOutcomeConfig`/`onDismiss` already draw. Omit (the default)
   *  to leave this row exactly as before — no button, no space reserved
   *  for it. */
  onEndCall?: () => void;
  /** Locks the Consult/Transfer, Outcome, and kebab ("More Options")
   *  buttons in this row's trailing cluster — visibly present but
   *  non-interactive (disabled), NOT hidden. Same "reviewing an AI agent's
   *  still-live conversation before deciding whether to take it over"
   *  reasoning as `TranscriptSessionSeparator`'s own `controlsReadOnly`
   *  prop (agent-next-gen-transcript.tsx) — this is that same idea for
   *  this row's own action cluster. `onEndCall`/`onDismiss`/`showDismiss
   *  Button` are untouched by this: those already have their own
   *  visibility gating for exactly this "not taken over yet" state, so
   *  there's nothing for a disabled state to add there. Default: false
   *  (every other consumer's cluster stays fully interactive, unchanged). */
  controlsDisabled?: boolean;
}

/* ── Default menu items, per channel type ──
 * Kept here (not on InteractionNavItem) so each channel type owns its own
 * kebab behavior at the component level — e.g. Voice gets recording actions
 * instead of transcript/translate actions. Override per-row via
 * `InteractionChannel.menuItems`.
 *
 * Icons: "Unassign & Dismiss" uses `UserX` (not a warning/alert glyph —
 * per explicit correction, this action isn't a warning at all, just
 * "remove this agent from the assignment," and sharing `TriangleAlert`
 * with the SLA-severity tab icon (`ChannelTab`'s own `tabIcon`, further
 * down this file) made the two easy to visually confuse on a busy tab
 * bar/kebab menu).
 *
 * Built as functions (not flat consts) so "Unassign & Dismiss" — the one
 * action every channel type shares — can carry a real `onClick` wired to
 * `InteractionNavItem`'s own `onDismiss` prop. That action ends the whole
 * interaction, not just this one channel, so it's threaded down from the
 * card level rather than something a channel row decides on its own. A
 * `menuItems` override on `InteractionChannel` still replaces this whole
 * list, same as before — the override is the consumer's responsibility to
 * wire up, `onDismiss` only ever applies to the *default* menu.
 *
 * "consult-transfer"/"outcome" still live in these lists (unchanged) since
 * `ChannelTab`/`ChannelToggle` (the record-header tab bar) both build their
 * own default kebab from these same two functions and still want both
 * actions in that dropdown. `ChannelRow` (below — the row `InteractionNavItem`
 * renders per open channel) is the one exception: per explicit request, IT
 * promotes these same two actions out of its own kebab into two standalone
 * icon buttons to the kebab's immediate left instead, so see that
 * component's own `kebabItems` for where they're filtered back out of
 * what its dropdown actually shows. */

export function buildDigitalMenuItems(onDismiss?: () => void): MenuEntry[] {
  return [
    { id: "unassign-dismiss", label: "Unassign & Dismiss", icon: <UserX className="h-4 w-4" strokeWidth={1.5} />, onClick: onDismiss },
    { id: "consult-transfer", label: "Consult / Transfer", icon: <ConsultTransferIcon /> },
    { id: "outcome", label: "Outcome", icon: <CircleCheck className="h-4 w-4 text-lyra-status-info-strong" strokeWidth={1.5} /> },
    { id: "send-transcript", label: "Send Transcript", icon: <Send className="h-4 w-4" strokeWidth={1.5} /> },
    { id: "download-transcript", label: "Download Transcript", icon: <FileDown className="h-4 w-4" strokeWidth={1.5} /> },
    { id: "translate-messages", label: "Translate Messages", icon: <Languages className="h-4 w-4" strokeWidth={1.5} /> },
  ];
}

export function buildVoiceMenuItems(onDismiss?: () => void): MenuEntry[] {
  return [
    { id: "unassign-dismiss", label: "Unassign & Dismiss", icon: <UserX className="h-4 w-4" strokeWidth={1.5} />, onClick: onDismiss },
    { id: "consult-transfer", label: "Consult / Transfer", icon: <ConsultTransferIcon /> },
    { id: "outcome", label: "Outcome", icon: <CircleCheck className="h-4 w-4 text-lyra-status-info-strong" strokeWidth={1.5} /> },
    { id: "listen-recording", label: "Listen to Recording", icon: <PlayCircle className="h-4 w-4" strokeWidth={1.5} /> },
    { id: "download-recording", label: "Download Recording", icon: <FileDown className="h-4 w-4" strokeWidth={1.5} /> },
  ];
}

/* ── Base row (shared rendering) ── */

interface ChannelRowProps {
  icon: React.ReactNode;
  label: string;
  /** The consumer's own Outcome trigger, in the Outcome button's place (a
   *  kind row's, `InteractionChannel.kind.outcome`). */
  outcomeTrigger?: React.ReactNode;
  /** Hides the channel chip; `label` is kept as screen-reader text. See
   *  `InteractionChannel.hideChip`. */
  hideChip?: boolean;
  /** Per explicit request ("when hovering on the channel chips - add a
   *  tooltip that is {channel name} ie. inbound voice / outbound voice /
   *  sms / chat / whatsapp / etc.") — the chip's own hover `Tooltip` text.
   *  Defaults to `label` itself (plain "SMS"/"Chat"/"WhatsApp"/"Email") —
   *  only `VoiceChannelRow` (below) overrides this, to a direction-aware
   *  "Inbound Voice"/"Outbound Voice" when it has a real `direction`, same
   *  as the explicit example only distinguished direction for voice. */
  tooltipLabel?: string;
  /** This row's chip color when not `awaitingResponse` — see
   *  `CHANNEL_TYPE_TAG_VARIANT` above. `awaitingResponse` always overrides
   *  to "critical" (red) regardless of this value. */
  variant: TagVariant;
  /** See `InteractionChannel.elapsed`: a string, or a node that renders the time itself. */
  elapsed: React.ReactNode;
  /** See `InteractionChannel.elapsedOverride`'s own doc comment above. */
  elapsedOverride?: React.ReactNode;
  preview?: string;
  /** Blue-highlighted row background — set by the parent when this row is
   *  both `current` and the card is `active`. */
  highlighted?: boolean;
  /** Skip the top divider — set by the parent for the first row in the list. */
  isFirst?: boolean;
  awaitingResponse?: boolean;
  /** See `InteractionChannel.awaitingSeverity`'s own doc comment above. */
  awaitingSeverity?: "success" | "warning" | "critical";
  menuItems: MenuEntry[];
  /** Hide the trailing kebab. Default: true (kebab shown). `false` doesn't
   *  just leave that trailing cluster empty — per explicit request (matching
   *  `ChannelTab`'s own identical `showMenu`/`onDismiss` behavior, channel-
   *  row.tsx's other tab-shaped export further down), it's replaced with a
   *  real close ("×") button wired to `onDismiss` below instead, for the one
   *  case every current caller actually sets this false for: a closed
   *  channel/interaction, which has nothing left to show a kebab menu FOR
   *  but still needs a way to close/remove the row itself. */
  showMenu?: boolean;
  /** Wired to the close ("×") button that replaces the kebab whenever
   *  `showMenu` is false — see that prop's own doc comment. Has no effect
   *  while `showMenu` is true (the kebab's own "Unassign & Dismiss" entry,
   *  built from this same callback one level up in `ChatChannelRow`/etc.,
   *  is what fires it there instead). Omitting this while `showMenu` is
   *  false just leaves the trailing cluster empty, same as before this
   *  close button existed. */
  onDismiss?: () => void;
  /** See `InteractionChannel.removeVariant`'s own doc comment — same
   *  meaning, just threaded down to this row's own close-button fallback
   *  rendering. Default `"close"`. */
  removeVariant?: "close" | "delete-draft";
  /** Marks this channel "current" (see `InteractionNavItem`'s own doc
   *  comment on its internal current-channel state) — lets an agent toggle
   *  which open channel is highlighted within a multi-channel card. Doesn't
   *  stop the click from also bubbling up to the card's own `onClick`
   *  (selecting the whole card), only the kebab button does that. */
  onSelect?: () => void;
  /** Forwarded straight to this row's own `KebabMenuButton` — lets
   *  `InteractionNavItem`'s compact-mode hover-preview popover know when
   *  this row's dropdown opens/closes, so it can keep itself open (and its
   *  close-on-mouseleave timer disarmed) for as long as the dropdown is —
   *  see that component's `handleChannelMenuOpenChange` doc comment. */
  onMenuOpenChange?: (open: boolean) => void;
  /** Wires the "Outcome" ghost button to a real popover (see
   *  `ChannelOutcomeConfig`'s own doc comment above) — omit to leave that
   *  button a plain, unwired placeholder (its pre-existing behavior). */
  outcome?: ChannelOutcomeConfig;
  /** Hide just the standalone "Consult / Transfer" icon button in the
   *  hover-reveal overlay, leaving Outcome and the trailing kebab (governed
   *  by `showMenu`) untouched — per explicit request (Agent Workspace 2.0
   *  Phase 1 only). Default: true (every other consumer keeps this button
   *  exactly as before). */
  showConsultTransfer?: boolean;
  /** See `InteractionChannel.consultTransferLabel`. */
  consultTransferLabel?: string;
  /** See `InteractionChannel.consultTransferDisabledReason`. */
  consultTransferDisabledReason?: string;
  /** See `InteractionChannel.endCallDisabledReason`. */
  endCallDisabledReason?: string;
  /** Hide just the trailing "More Options" kebab (⋮) button, leaving
   *  Consult/Transfer and Outcome (each governed by their own prop)
   *  untouched — per explicit request (Agent Workspace 2.0 Phase 1 only).
   *  Unlike `showMenu={false}` (which REPLACES the kebab with a close
   *  button for a closed/draft row), this just omits it outright — no
   *  replacement. Default: true (every other consumer keeps the kebab
   *  exactly as before). */
  showKebab?: boolean;
  /** Keep the Consult/Transfer + Outcome overlay permanently visible
   *  (no hover/focus-reveal, no `opacity-0`/`pointer-events-none`, and
   *  rendered in normal flow instead of `absolute` — this row's `showKebab`
   *  is typically `false` alongside this, so there's no longer a kebab
   *  sitting to its right for `right-full` to anchor against). Default:
   *  true — per explicit follow-up request ("always display the outcome
   *  button in the interactionNavItems - no longer have them display on
   *  hover only... this can be a component level update"), flipped from
   *  this component's own original opt-in default (previously `false`,
   *  Agent Workspace 2.0 Phase 1 only) to an opt-OUT one: every consumer
   *  now gets the always-visible treatment automatically. Pass `false`
   *  explicitly for a row that still needs the old hover-reveal
   *  behavior. */
  alwaysShowOutcome?: boolean;
  /** Render a standalone "Unassign & Dismiss" icon button (same icon/
   *  action as the kebab's own "Unassign & Dismiss" menu entry — see
   *  `onDismiss`'s own doc comment) directly in this overlay, immediately
   *  right of Outcome — per explicit request (Agent Workspace 2.0 Phase 1
   *  only): once `showKebab={false}` buries that action nowhere, this is
   *  how it stays reachable without the kebab. Default: false (every
   *  other consumer leaves this action inside the kebab's menu only, same
   *  as before). */
  showDismissButton?: boolean;
  /** Passed straight through from `InteractionChannel.onEndCall` — see its
   *  own doc comment for the full reasoning. Omit (the default) to leave
   *  this row's trailing cluster exactly as before. */
  onEndCall?: () => void;
  /** See `InteractionChannel.controlsDisabled`'s own doc comment. Default
   *  false. */
  controlsDisabled?: boolean;
  /** Per explicit request ("when a call is placed on hold, add an on hold
   *  timer below the call timer in the call controls and in the
   *  interaction nav item") — an already-formatted "MM:SS" duration,
   *  rendered as a NEW line ("On hold · MM:SS", in the same red/critical
   *  color every other "needs attention" reading in this app uses)
   *  directly below the existing preview/elapsed-timer row, not a
   *  replacement for it (unlike this row's own pre-existing
   *  `elapsedOverride`, which DOES swap out that whole row — see its own
   *  doc comment — the two are deliberately different treatments for two
   *  different requests). Omit to render nothing extra — every existing
   *  consumer (including `channelOnHold`'s own `elapsedOverride` swap)
   *  is unaffected. */
  onHoldElapsed?: string;
  /** A consumer-supplied status chip, rendered on its own line below the
   *  preview/timer line and after the on-hold badge. Unlike
   *  `elapsedOverride` it adds a line rather than replacing the timer.
   *  Omit to render nothing extra. */
  statusBadge?: React.ReactNode;
  /** Swaps the timer's clock icon for a pulsing red dot while the call is
   *  being recorded; the timer keeps counting and its tooltip reads
   *  "Recording · Duration: mm:ss". Omit (or `false`) for the plain clock. */
  recording?: boolean;
}

// `direction` (see `InteractionChannel.direction`'s own doc comment) is
// deliberately NOT a `ChannelRowProps` field — `icon` above is already the
// fully-resolved glyph by the time it reaches this component. Only the two
// per-type wrappers that need it (`VoiceChannelRow`/`SmsChannelRow`, further
// below) read `direction` off their own `ChannelRowInstanceProps`, to pick
// `VoiceDirectionIcon`/`SmsDirectionIcon` BEFORE calling into `<ChannelRow
// icon={...} />` — every other wrapper (`ChatChannelRow`/`EmailChannelRow`/
// `WhatsAppChannelRow`) still hardcodes its own `icon`, untouched.

// "consult-transfer"/"outcome"/"unassign-dismiss" are promoted out of this
// row's own kebab into their own standalone icon buttons (rendered just to
// its left, see `ChannelRow` below) — per explicit request, scoped to
// `InteractionNavItem` specifically, NOT to `ChannelTab`/`ChannelToggle`
// (the record-header tab bar), which still show all three inside their own
// kebab dropdown via the unmodified `buildDigitalMenuItems`/
// `buildVoiceMenuItems`. Filtered here (rather than never including them in
// the first place) so a consumer passing a custom `InteractionChannel.
// menuItems` override still has those ids recognized/stripped the same way
// the default lists do, instead of silently double-showing them (once as a
// standalone button, once still buried in the dropdown) if their override
// happens to include any of them. `"separator"`/section-label entries pass
// through untouched — this only ever needs to recognize `MenuItemDef`s by
// `id`.
//
// "outcome"/"unassign-dismiss" are always stripped — `alwaysShowOutcome`
// (see that prop's own doc comment) now defaults to `true` for every
// consumer, and the standalone Dismiss icon (`showDismissButton`, see its
// own doc comment) is unconditional for every `InteractionNavItem` row too
// (per a later explicit follow-up request — "unassign and dismiss should
// not be available in the more options in the interactionNavItem more
// options menu" — since the standalone icon is always there now, keeping
// this in the dropdown too would only ever be redundant, never the sole
// path to it). "consult-transfer" is conditional on `keepConsultTransfer`,
// though — per an earlier explicit follow-up request ("in the
// interactionNavItem move consult/transfer into the 3 dots more menu like
// you did in the interaction itself"): a row with `showConsultTransfer`
// `false` (no standalone icon) would otherwise have NO way to reach Consult
// / Transfer at all once this always strips it from the kebab too. The
// render call site below passes `keepConsultTransfer={!showConsultTransfer}`
// — the standalone button and the kebab entry are mutually exclusive, never
// both at once, same "no duplication" reasoning as `outcome`/
// `unassign-dismiss` above.
function stripPromotedChannelRowActions(items: MenuEntry[], options?: { keepConsultTransfer?: boolean }): MenuEntry[] {
  const { keepConsultTransfer = false } = options ?? {};
  return items.filter(
    (item) =>
      typeof item === "string" ||
      "sectionLabel" in item ||
      ((keepConsultTransfer || item.id !== "consult-transfer") &&
        item.id !== "outcome" &&
        item.id !== "unassign-dismiss")
  );
}

const ChannelRow: React.FC<ChannelRowProps> = ({
  icon,
  label,
  outcomeTrigger,
  hideChip = false,
  tooltipLabel,
  variant,
  elapsed,
  elapsedOverride,
  preview,
  highlighted,
  isFirst,
  awaitingResponse,
  awaitingSeverity,
  menuItems,
  showMenu = true,
  onDismiss,
  removeVariant = "close",
  onSelect,
  onMenuOpenChange,
  outcome,
  showConsultTransfer = true,
  consultTransferLabel = "Consult / Transfer",
  consultTransferDisabledReason,
  endCallDisabledReason,
  showKebab = true,
  alwaysShowOutcome = true,
  showDismissButton = false,
  onEndCall,
  controlsDisabled = false,
  onHoldElapsed,
  statusBadge,
  recording = false,
}) => {
  // `null` when not awaiting at all (the plain gray look below is
  // untouched); otherwise `awaitingSeverity`, defaulting to `"critical"` —
  // see that prop's own doc comment on `InteractionChannel` for why the
  // default preserves this row's pre-existing binary red behavior for any
  // consumer that doesn't pass real wait-time data.
  const severity: "success" | "warning" | "critical" | null = awaitingResponse ? awaitingSeverity ?? "critical" : null;

  // Coordinates this row's own kebab `Tooltip` ("More Options") with its
  // `KebabMenuButton` dropdown — same "tooltip's trigger and the dropdown's
  // trigger are the same DOM node" problem `ChannelTab`/`ChannelToggle`
  // already solve below with their own `menuOpen` state fed into `Tooltip`'s
  // `disabled` prop (see either one's own doc comment for the fuller
  // explanation). Kept local to this row rather than reusing a prop, since
  // `onMenuOpenChange` here is a callback OUT to `InteractionNavItem` (for
  // its hover-preview popover's own separate close-timer coordination, see
  // that component's `handleChannelMenuOpenChange`) — this needs its own
  // local bit so the tooltip-disable logic doesn't depend on whether a
  // consumer happened to pass that prop at all.
  const [menuOpen, setMenuOpen] = React.useState(false);
  // Outcome popover's own Resolution-dropdown state — see
  // `useOutcomePopoverState`'s own doc comment above.
  const outcomePopoverState = useOutcomePopoverState();
  // This standalone Outcome trigger's own DOM node — a stable anchor for
  // "Save & Redial" (see `buildOutcomePopoverSlots`'s own `triggerRef`
  // param doc comment) that stays mounted across this popover opening and
  // closing, unlike the popover's own footer button.
  const outcomeTriggerRef = React.useRef<HTMLButtonElement>(null);
  /** The row's stretched select `Button`: its keyboard focus opens a cut-off preview's tooltip. */
  const selectButtonRef = React.useRef<HTMLButtonElement>(null);
  return (
  <div
    onClick={onSelect}
    className={cn(
      // `relative` — positioning context for the stretched select Button
      // below (keyboard access to `onSelect`).
      "relative",
      // `group` — hovering anywhere on this row reveals the Consult/
      // Transfer + Outcome buttons overlaid on top of the elapsed-time text
      // below (see that span's own comment) — a plain CSS `:hover` on the
      // small relative wrapper around just that text would work too, but
      // `group` here means hovering the WHOLE row reveals them, matching
      // this row's own `hover:bg-lyra-state-hover` reacting to a hover
      // anywhere on it, not just over the clock icon specifically.
      "group flex flex-col gap-1 px-3 py-2.5 transition-colors",
      onSelect && "cursor-pointer",
      !isFirst && "border-t border-lyra-border-subtle",
      highlighted ? "bg-lyra-status-info-subtle" : "hover:bg-lyra-state-hover"
    )}
  >
    {/* Keyboard/screen-reader entry point for `onSelect` — the row itself
        is a plain div (its trailing cluster holds real buttons, so it can't
        be role="button" without nesting interactive controls). Same
        stretched hit-target pattern as InteractionNavItem: an invisible
        `Button` sibling covering the row, with the row's content painted
        above it (`relative z-[1]` wrapper below). Mouse clicks land on the
        content and bubble to this div's onClick; the Button has no onClick
        of its own — Enter/Space make it fire a click that bubbles to the
        same handler. */}
    {onSelect && (
      <Button
        ref={selectButtonRef}
        variant="ghost"
        // A live node (see `elapsed`) isn't text: the name leaves the time out rather than re-announcing it each tick.
        aria-label={`${label} channel${severity ? ", awaiting response" : ""}${typeof elapsed === "string" && elapsed ? `, ${elapsed}` : ""}`}
        aria-current={highlighted ? "true" : undefined}
        className="absolute inset-0 h-full w-full rounded-none p-0 hover:bg-transparent active:bg-transparent focus-visible:ring-inset focus-visible:ring-offset-0"
      />
    )}
    <div className="relative z-[1] flex flex-col gap-1">
    <div className="flex items-center gap-0">
      {/* Per explicit follow-up bug report ("remove the dots next to the
          channel chips - they are not clear what they mean"): this used to
          render a small extra `Badge` dot here, on top of the chip's own
          red/critical (or, per `awaitingSeverity`, green/orange) color swap
          just below — meant as an unmissable "this specific channel is the
          one awaiting a response" cue for a card with more than one open
          channel where only one might be. Removed outright rather than
          reworked: with no label/tooltip of its own, a bare colored dot
          sitting next to an already-colored chip read as an unexplained
          second signal, not a clarifying one. The chip's own color swap
          (`severity ?? variant` just below) still carries the same
          information on its own, unchanged. */}
      {hideChip ? (
        <span className="sr-only">{tooltipLabel ?? label}</span>
      ) : (
        <Tooltip content={tooltipLabel ?? label} placement="top">
          <span className={cn(tagVariants({ variant: severity ?? variant, shape: "pill" }))}>
            <span aria-hidden="true">{icon}</span>
            {label}
          </span>
        </Tooltip>
      )}
      {/* Trailing button cluster — Consult/Transfer, Outcome, and the kebab
          — grouped together as siblings in ONE wrapper so all three read as
          a single unit in the code, with `gap-0` applied consistently
          across the cluster: no space between Consult/Transfer and
          Outcome, and no space between Outcome and the kebab either.

          The elapsed clock+time text used to live on THIS row too, between
          the chip and this cluster — moved down to the preview line below
          (per explicit follow-up) since that's what was colliding with
          these buttons on a narrow row in the first place; with the timer
          gone, this row only ever has to fit the chip plus this cluster,
          which always leaves room (removing an entire category of
          truncate/clip-on-collision logic this row used to need).

          `ml-auto` pushes this wrapper to the row's far right on its own —
          no intermediate `flex-1` spacer needed now that there's no timer
          text between it and the chip to share space with. `shrink-0`
          keeps its width to just the kebab's natural size, since the two
          ghost buttons inside it are `absolute` and contribute nothing to
          that sizing (same "costs nothing while hidden" property rule #55
          established, still true here — this is what keeps the kebab from
          jumping around based on whether the ghost buttons are showing).

          The ghost-button overlay is positioned `right-full` (not
          `right-0`) relative to THIS wrapper — `right-full` (right:100%)
          plants the overlay's right edge exactly at the wrapper's LEFT
          edge (i.e., immediately before the kebab, touching it with zero
          gap), then the overlay extends further left by its own natural
          width (the two buttons + their now-zero internal gap). On a
          narrow row this can still visually land on top of the CHIP now
          (nothing else left to collide with) — accepted per this same
          follow-up, since the whole point of moving the timer was to stop
          worrying about what the overlay might cover.

          The overlay `div` itself carries no background (see rule #56 —
          these are true ghost `variant="icon"` buttons, no border, no
          resting-state fill, just `hover:bg-lyra-state-hover`/`active:
          bg-lyra-state-pressed` and `rounded-lyra-sm` baked into the
          variant). `pointer-events-none opacity-0` + `group-hover:
          pointer-events-auto group-hover:opacity-100` is the same
          invisible-until-hovered technique used throughout this file. Both
          the overlay and the kebab are gated on `showMenu` together, same
          as before. Per explicit follow-up, `showMenu={false}` no longer
          just leaves this whole cluster empty — see the close-button
          `else` branch right after this block, and `onDismiss`'s own doc
          comment above. */}
      {showMenu ? (
        <span className="relative ml-auto flex h-6 shrink-0 items-center">
          <div
            className={
              // `alwaysShowOutcome` (default `true` — see that prop's own
              // doc comment for the "always visible by default" history)
              // drops the hover/focus-reveal treatment entirely — no
              // `opacity-0`, no `pointer-events-none`, no `absolute`/
              // `right-full` positioning (originally added assuming a
              // kebab sitting just to this overlay's right to anchor
              // against, back when this was an opt-in, Phase-1-only prop
              // with `showKebab` typically `false` alongside it) —
              // rendering this overlay as a normal, always-visible flex
              // item in the row's own flow instead, which now also just
              // pushes a still-visible kebab further right rather than
              // overlaying it, for every consumer that keeps `showKebab`
              // at its own default.
              alwaysShowOutcome
                ? "flex h-6 items-center gap-0"
                : cn(
                    "pointer-events-none absolute inset-y-0 right-full flex h-6 items-center gap-0 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100",
                    // `group-focus-within:` alongside `group-hover:` — per
                    // explicit accessibility request: Consult/Transfer and
                    // Outcome are real buttons, so `opacity-0`/`pointer-events-
                    // none` alone doesn't remove them from the tab order, it
                    // just leaves them invisible (and unclickable, pre-
                    // `pointer-events-auto`) while a keyboard user has actually
                    // tabbed to one. Tabbing into either button now reveals this
                    // whole cluster exactly like hovering the row does; the
                    // hover behavior itself is unchanged.
                    "group-focus-within:pointer-events-auto group-focus-within:opacity-100",
                    // Stay revealed while the Outcome popover it triggers is open
                    // — without this, moving the pointer off the row after
                    // opening it (to actually reach into the now-portaled-
                    // elsewhere popover content) would fade this whole overlay
                    // back to `opacity-0 pointer-events-none`, leaving the
                    // popover open with no visible trigger button anchoring it.
                    outcome?.open && "pointer-events-auto opacity-100"
                  )
            }
          >
            {showConsultTransfer && (
              <WithDisabledReason reason={consultTransferDisabledReason}>
                <Button
                  variant="icon"
                  size="icon-sm"
                  title={consultTransferLabel}
                  disabled={controlsDisabled || !!consultTransferDisabledReason}
                  className="shrink-0 text-lyra-fg-secondary"
                >
                  <ConsultTransferIcon />
                </Button>
              </WithDisabledReason>
            )}
            {/* Kebab ("More Options") — per explicit request, sits
                immediately to the left of Outcome now, rather than as the
                trailing-most element of the whole cluster (its original
                spot, still where `stripPromotedChannelRowActions`'s own
                doc comment above describes it). Purely a position change:
                still the same `showKebab`/`menuItems`/`onMenuOpenChange`
                wiring, just moved inside this same flex row instead of
                being a sibling `span` after it closes. */}
            {showKebab && (
              <Tooltip content="More Options" placement="bottom" disabled={menuOpen}>
                <KebabMenuButton
                  items={stripPromotedChannelRowActions(menuItems, { keepConsultTransfer: !showConsultTransfer })}
                  ariaLabel={`More options for ${label}`}
                  disabled={controlsDisabled}
                  onOpenChange={(open) => {
                    setMenuOpen(open);
                    onMenuOpenChange?.(open);
                  }}
                />
              </Tooltip>
            )}
            {outcomeTrigger ? (
              outcomeTrigger
            ) : outcome ? (
              // Tooltip wraps the Popover from the OUTSIDE, via a plain
              // `<span className="inline-flex">` DOM element for Radix's
              // `asChild` to clone onto — same composition `ChannelToggle`
              // already uses for this exact popover a few hundred lines
              // down. Relying on `Button`'s own `title`-driven auto-Tooltip
              // (the previous approach here) has no way to suppress itself
              // while the Popover it sits on top of is open — unlike this
              // explicit `Tooltip`, which takes a `disabled` prop for
              // exactly that. With no such gate, the "Outcome" hover label
              // could still be showing (the pointer is still resting on
              // this same button right after the click that opened the
              // popover) at the same time as the newly-opened "Log
              // Outcome" popover card, visibly bleeding out from behind/
              // beside it — a real, reported bug, not just a hypothetical
              // one. `disabled={outcome.open}` closes that gap the same
              // way `menuOpen` already does for the kebab's "More Options"
              // tooltip just above.
              <Tooltip content="Outcome" placement="bottom" className="z-[10020]">
                <span className="inline-flex">
                  <Popover
                    open={outcome.open}
                    onOpenChange={outcome.onOpenChange}
                    placement="bottom"
                    align="end"
                    // `z-[9999]` — "Popover nested inside another popover" per
                    // CONTRIBUTING.md §4's own hierarchy table. This row (and so
                    // this whole button cluster) is reused verbatim as the
                    // compact LeftNav tile's hover-preview popover content
                    // (`InteractionNavItem`'s `!expanded` branch) — in that
                    // context this Popover really is nested one level inside
                    // another already-open `Popover`, both otherwise sharing
                    // the same unhelpful `z-50` default, so which one painted on
                    // top came down to DOM/portal mount order rather than any
                    // real stacking rule — the reported symptom (this popover
                    // rendering *underneath* the hover-preview card, and both
                    // flickering open/closed as the mouse crossed the
                    // ambiguous overlap where hit-testing disagreed with what
                    // was visually on top). Bumped unconditionally rather than
                    // only when actually nested, since a Popover always meant
                    // to read as "topmost, modal-like" has no reason to sit at
                    // a lower tier in its other (non-nested, always-expanded
                    // row) usage either — see the Resolution popover and the
                    // Tags/Disposition `Select`s below, raised to `z-[10001]`
                    // for the exact same reason one level deeper.
                    className="z-[9999] w-80"
                    onCloseAutoFocus={(e) => e.preventDefault()}
                    {...buildOutcomePopoverSlots(outcome, outcomePopoverState, outcomeTriggerRef)}
                  >
                    <Button
                      ref={outcomeTriggerRef}
                      variant="icon"
                      size="icon-sm"
                      aria-label="Outcome"
                      disabled={controlsDisabled}
                      className="shrink-0 text-lyra-fg-secondary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Outcome uses the outlined `CircleCheckBig` at a heavier
                          stroke, in the lyra info-strong blue. The outline keeps
                          it visibly distinct from the filled green availability
                          check (shape, not just colour), and the heavier stroke
                          matches what agents already know from the legacy app.
                          Heavier than the §5 default of 1.4, per explicit
                          request. The kebab-menu "Outcome" entries keep the
                          plain `CircleCheck` in their list. */}
                      <CircleCheckBig className="h-4 w-4 text-lyra-status-info-strong" strokeWidth={2.5} />
                    </Button>
                  </Popover>
                </span>
              </Tooltip>
            ) : (
              <Button
                variant="icon"
                size="icon-sm"
                title="Outcome"
                disabled={controlsDisabled}
                className="shrink-0 text-lyra-fg-secondary"
              >
                <CircleCheckBig className="h-4 w-4 text-lyra-status-info-strong" strokeWidth={2.5} />
              </Button>
            )}
            {onEndCall && (
              // A plain ghost icon button: just the red `PhoneOff` glyph, with a light red hover/press state.
              <WithDisabledReason reason={endCallDisabledReason}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="End Call"
                  disabled={!!endCallDisabledReason}
                  className="shrink-0 text-lyra-status-critical-strong hover:bg-lyra-status-critical-subtle hover:text-lyra-status-critical-strong active:bg-lyra-status-critical-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEndCall();
                  }}
                >
                  <PhoneOff className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                </Button>
              </WithDisabledReason>
            )}
            {showDismissButton && onDismiss && (
              <Button
                variant="ghost"
                size="icon-sm"
                title="Unassign & Dismiss"
                className="shrink-0 text-lyra-status-critical-strong hover:bg-lyra-status-critical-subtle hover:text-lyra-status-critical-strong active:bg-lyra-status-critical-medium"
                onClick={onDismiss}
              >
                <UserX className="h-3.5 w-3.5" strokeWidth={1.5} />
              </Button>
            )}
          </div>
        </span>
      ) : (
        onDismiss && (
          // Replaces the kebab entirely (not an addition alongside it —
          // `showMenu` is false here) for a closed channel/interaction, OR
          // for a genuine never-launched draft thread: per explicit
          // request, this row still needs a way to close/remove itself
          // even with nothing left to open a kebab menu FOR. Same plain
          // `variant="icon"` ghost button as Consult/Transfer/Outcome
          // above, always visible (no hover-reveal — unlike those two,
          // there's no separate resting-state element here for it to
          // overlay/collide with), so an agent doesn't have to hover the
          // row first just to find it. Two treatments, keyed off
          // `removeVariant` (see that prop's own doc comment): a plain
          // neutral "×"/"Close" for an already-closed channel/interaction
          // (the pre-existing, still-default look), or a red trash icon
          // reading "Delete Draft" for a draft — per explicit request, so
          // an agent can tell at a glance that closing an untouched draft
          // actually DELETES it (no Contact History entry gets logged for
          // it — see the consumer's own dismiss-handler doc comment for
          // that split) rather than merely dismissing a live assignment.
          removeVariant === "delete-draft" ? (
            <Button
              variant="icon"
              size="icon-sm"
              title="Delete Draft"
              className="ml-auto h-6 shrink-0 text-lyra-status-critical-strong hover:text-lyra-status-critical-strong"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          ) : (
            <Button
              variant="icon"
              size="icon-sm"
              title="Close"
              className="ml-auto h-6 shrink-0 text-lyra-fg-secondary"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          )
        )
      )}
    </div>
    {/* Preview/skill-name line + elapsed clock+time, side by side — NOT
        floated apart (a first pass floated the timer to the far right of
        this row; per explicit follow-up it sits directly next to the
        preview text instead, sharing normal left-to-right flow). `preview`
        is optional (a fresh/unassigned channel may have no skill-name text
        yet) — when it's present, it's the `min-w-0 flex-1 truncate` item so
        IT gives up width first on a narrow row, leaving the timer
        (`shrink-0`, never truncates) fully readable; when it's absent, the
        timer is simply the first (and only) item in this row and sits at
        the same left edge the preview text would have, rather than getting
        pushed or centered anywhere. Always rendered whenever `elapsed` is
        non-empty (not gated on `preview`, unlike before) — see `elapsed`'s
        own doc comment for the `""` case, which now omits this span
        entirely (a bare clock icon with nothing next to it would just read
        as a rendering glitch, not "nothing to time yet"). `elapsedOverride`
        (own doc comment above) takes priority over this whole span whenever
        supplied — `preview` is untouched either way. */}
    <div className="flex items-center gap-1">
      {preview && (
        // The full preview in a tooltip, only while it's cut off (hover, or the row's keyboard focus).
        <Tooltip content={preview} onlyWhenTruncated focusTarget={selectButtonRef}>
          <p className="min-w-0 flex-1 truncate lyra-body-sm text-lyra-fg-secondary">{preview}</p>
        </Tooltip>
      )}
      {elapsedOverride ?? (elapsed && (
        <Tooltip content={<>{recording ? "Recording · Duration: " : "Duration: "}{elapsed}</>} placement="top">
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 lyra-body-xs",
            severity === "critical"
              ? "text-lyra-status-critical-strong"
              : severity === "warning"
              ? "text-lyra-status-warning-strong"
              : severity === "success"
              ? "text-lyra-status-success-strong"
              : "text-lyra-fg-secondary"
          )}
        >
          {/* See `ChannelRowProps.recording`: the same pulsing red dot the
              voice call controls show while recording. */}
          {recording ? (
            <Circle
              className="h-3 w-3 shrink-0 animate-pulse fill-lyra-status-critical-strong text-lyra-status-critical-strong"
              strokeWidth={1.5}
              aria-label="Recording"
            />
          ) : (
            <Clock className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
          )}
          {elapsed}
        </span>
        </Tooltip>
      ))}
    </div>
    {/* On-hold timer — see `ChannelRowProps.onHoldElapsed`'s own doc
        comment for why this is a new line, not a swap of the row above. */}
    {onHoldElapsed && (
      // Per explicit request: the hold timer is a 12px amber pill badge
      // with a pause icon (replaces the plain red "On hold · mm:ss" text).
      <span className="self-start">
        <Tooltip content={`On hold: ${onHoldElapsed}`} placement="top">
        <Badge
          shape="pill"
          color={getHoldBadgeColor(onHoldElapsed)}
          variant="subtle"
          fontSize={12}
          icon={<Pause strokeWidth={2} />}
          aria-label={`On hold ${onHoldElapsed}`}
        >
          On hold · {onHoldElapsed}
        </Badge>
        </Tooltip>
      </span>
    )}
    {/* Status chip — see `ChannelRowProps.statusBadge`. */}
    {statusBadge && <span className="self-start">{statusBadge}</span>}
    </div>
  </div>
  );
};

/* ── Per-type channel rows ──
 * Thin wrappers around `ChannelRow` — each owns its own icon, label, and
 * default kebab menu, so channel-specific behavior lives here instead of
 * being passed down generically from `InteractionNavItem` or a story. */

export interface ChannelRowInstanceProps {
  elapsed: React.ReactNode;
  /** `KindChannelRow` only — see `InteractionChannel.kind`. */
  kind?: ChannelKindRow;
  /** Passed straight through to `ChannelRow` — see `InteractionChannel.hideChip`. */
  hideChip?: boolean;
  /** Passed straight through to `ChannelRow` — see `InteractionChannel.
   *  elapsedOverride`'s own doc comment. */
  elapsedOverride?: React.ReactNode;
  /** Passed straight through to `ChannelRow` — see `InteractionChannel.
   *  onHoldElapsed`'s own doc comment. */
  onHoldElapsed?: string;
  /** Passed straight through to `ChannelRow` — see `InteractionChannel.
   *  statusBadge`'s own doc comment. */
  statusBadge?: React.ReactNode;
  /** Passed straight through to `ChannelRow` — see `InteractionChannel.
   *  recording`'s own doc comment. */
  recording?: boolean;
  preview?: string;
  highlighted?: boolean;
  isFirst?: boolean;
  awaitingResponse?: boolean;
  /** See `InteractionChannel.awaitingSeverity`'s own doc comment above. */
  awaitingSeverity?: "success" | "warning" | "critical";
  removable?: boolean;
  menuItems?: MenuEntry[];
  /** Wired onto the default menu's "Unassign & Dismiss" item (see the
   *  `buildDigitalMenuItems`/`buildVoiceMenuItems` doc comment above —
   *  ignored there when `menuItems` overrides the default list) AND onto
   *  `ChannelRow`'s own close-button fallback for when `removable` is
   *  `false` (see that prop's own doc comment right below, and `ChannelRow
   *  Props.onDismiss`'s) — one callback, two possible triggers depending on
   *  whether this row still has a kebab to fire it from. */
  onDismiss?: () => void;
  /** Passed straight through to `ChannelRow` — see `InteractionChannel.
   *  removeVariant`'s own doc comment. Default `"close"`. */
  removeVariant?: "close" | "delete-draft";
  /** Passed straight through to `ChannelRow` — see its own doc comment. */
  onSelect?: () => void;
  /** Passed straight through to `ChannelRow` — see its own doc comment. */
  onMenuOpenChange?: (open: boolean) => void;
  /** Passed straight through to `ChannelRow` — see its own doc comment. */
  outcome?: ChannelOutcomeConfig;
  /** Passed straight through to `ChannelRow` — see its own doc comment. */
  showConsultTransfer?: boolean;
  /** Passed straight through to `ChannelRow` — see its own doc comment. */
  consultTransferLabel?: string;
  /** Passed straight through to `ChannelRow` — see its own doc comment. */
  consultTransferDisabledReason?: string;
  /** Passed straight through to `ChannelRow` — see its own doc comment. */
  endCallDisabledReason?: string;
  /** Passed straight through to `ChannelRow` — see its own doc comment. */
  showKebab?: boolean;
  /** Passed straight through to `ChannelRow` — see its own doc comment. */
  alwaysShowOutcome?: boolean;
  /** Passed straight through to `ChannelRow` — see its own doc comment. */
  showDismissButton?: boolean;
  /** Passed straight through to `ChannelRow` — see `InteractionChannel.
   *  onEndCall`'s own doc comment. */
  onEndCall?: () => void;
  /** Passed straight through to `ChannelRow` — see `InteractionChannel.
   *  controlsDisabled`'s own doc comment. */
  controlsDisabled?: boolean;
  /** Read (not forwarded) by `VoiceChannelRow`/`SmsChannelRow` only, to pick
   *  a direction-aware icon — see `InteractionChannel.direction`'s own doc
   *  comment. Every other wrapper ignores this. */
  direction?: ChannelDirection;
}

const ChatChannelRow: React.FC<ChannelRowInstanceProps> = ({ menuItems, removable, onDismiss, ...rest }) => (
  <ChannelRow
    {...rest}
    // `MessageCircle` (a rounded chat bubble), not `MessageSquare` — per
    // explicit request, this needs to read as visually distinct from
    // `SmsChannelRow`'s icon at a glance (both used to share the exact
    // same glyph, the actual bug report), since Chat here means a website
    // chat widget conversation, a genuinely different channel from SMS
    // texting, not just a different color for the same icon.
    icon={<MessageCircle className="h-3 w-3" strokeWidth={1.5} />}
    label="Chat"
    variant={CHANNEL_TYPE_TAG_VARIANT.chat}
    menuItems={menuItems ?? buildDigitalMenuItems(onDismiss)}
    showMenu={removable !== false}
    onDismiss={onDismiss}
  />
);

const EmailChannelRow: React.FC<ChannelRowInstanceProps> = ({ menuItems, removable, onDismiss, ...rest }) => (
  <ChannelRow
    {...rest}
    icon={<Mail className="h-3 w-3" strokeWidth={1.5} />}
    label="Email"
    variant={CHANNEL_TYPE_TAG_VARIANT.email}
    menuItems={menuItems ?? buildDigitalMenuItems(onDismiss)}
    showMenu={removable !== false}
    onDismiss={onDismiss}
  />
);

const SmsChannelRow: React.FC<ChannelRowInstanceProps> = ({ menuItems, removable, onDismiss, direction, ...rest }) => (
  <ChannelRow
    {...rest}
    // Direction-aware (`SmsDirectionIcon` — see its own doc comment): a
    // plain `MessageSquare` when `direction` is omitted, a small corner
    // arrow badge on it otherwise. Per explicit request (Agent Workspace
    // 2.0 Phase 1 & Phase 2 only).
    icon={<SmsDirectionIcon direction={direction} className="h-3 w-3" />}
    label="SMS"
    variant={CHANNEL_TYPE_TAG_VARIANT.sms}
    menuItems={menuItems ?? buildDigitalMenuItems(onDismiss)}
    showMenu={removable !== false}
    onDismiss={onDismiss}
  />
);

const WhatsAppChannelRow: React.FC<ChannelRowInstanceProps> = ({ menuItems, removable, onDismiss, ...rest }) => (
  <ChannelRow
    {...rest}
    icon={<WhatsAppIcon />}
    label="WhatsApp"
    variant={CHANNEL_TYPE_TAG_VARIANT.whatsapp}
    menuItems={menuItems ?? buildDigitalMenuItems(onDismiss)}
    showMenu={removable !== false}
    onDismiss={onDismiss}
  />
);

const VoiceChannelRow: React.FC<ChannelRowInstanceProps> = ({ menuItems, removable, onDismiss, direction, ...rest }) => (
  <ChannelRow
    {...rest}
    // Direction-aware (`VoiceDirectionIcon` — see its own doc comment): a
    // plain `Phone` when `direction` is omitted, `PhoneIncoming`/
    // `PhoneOutgoing` otherwise. Per explicit request (Agent Workspace 2.0
    // Phase 1 & Phase 2 only).
    icon={<VoiceDirectionIcon direction={direction} className="h-3 w-3" />}
    label="Voice"
    // See `ChannelRowProps.tooltipLabel`'s own doc comment — the one
    // wrapper the explicit request called out for direction-aware text.
    tooltipLabel={direction === "inbound" ? "Inbound Voice" : direction === "outbound" ? "Outbound Voice" : "Voice"}
    variant={CHANNEL_TYPE_TAG_VARIANT.voice}
    // `buildDigitalMenuItems`, not `buildVoiceMenuItems` — per explicit
    // request ("the more options for the interactionNavItem should be the
    // same as the more options in the contact"): the app's own session-row
    // kebab (`TranscriptSessionSeparator`, agent-next-gen-transcript.tsx —
    // "the contact"'s own more-options menu) has always shown the same
    // fixed Send Transcript/Download Transcript/Translate Messages set
    // regardless of channel type, voice included — it never had a
    // recording-specific branch. This row's kebab defaulting to
    // `buildVoiceMenuItems` (Listen to Recording/Download Recording
    // instead) was the one place that diverged from that "same content
    // everywhere" list. `ChannelTab`/`ChannelToggle` (the record-header tab
    // bar's own, separate kebab, further down this file) still pick
    // `buildVoiceMenuItems` for voice — untouched, since only
    // `InteractionNavItem`'s copy was reported as mismatched.
    menuItems={menuItems ?? buildDigitalMenuItems(onDismiss)}
    showMenu={removable !== false}
    onDismiss={onDismiss}
  />
);

/** A non-channel assignment row (`InteractionChannel.kind`): the kind's chip,
 *  neutral, and a kebab only when the consumer gives it items. */
const KindChannelRow: React.FC<ChannelRowInstanceProps> = ({ kind, menuItems, removable, onDismiss, direction: _direction, ...rest }) => (
  <ChannelRow
    {...rest}
    icon={<span className="inline-flex [&>svg]:h-3 [&>svg]:w-3">{kind?.icon}</span>}
    label={kind?.label ?? ""}
    outcomeTrigger={kind?.outcome}
    variant="neutral"
    menuItems={menuItems ?? []}
    showKebab={(rest.showKebab ?? true) && (menuItems?.length ?? 0) > 0}
    showMenu={removable !== false}
    onDismiss={onDismiss}
  />
);

/** Maps `InteractionChannel.type` to its row component — used by
 *  `InteractionNavItem` to dispatch each channel to the right one. */
const CHANNEL_ROW_COMPONENTS: Record<ChannelType, React.FC<ChannelRowInstanceProps>> = {
  chat: ChatChannelRow,
  email: EmailChannelRow,
  sms: SmsChannelRow,
  whatsapp: WhatsAppChannelRow,
  voice: VoiceChannelRow,
};

/** Per-type icon + label — the same choices each `*ChannelRow` wrapper above
 *  already bakes in, exposed here so `ChannelTab` (and any other component
 *  that needs to represent a channel by its type) doesn't have to re-decide
 *  them. Sized `h-4 w-4` (a `Tab`'s icon slot) rather than the `h-3 w-3` chip
 *  size the rows above use. */
const CHANNEL_TYPE_META: Record<ChannelType, { icon: React.ReactNode; label: string }> = {
  // `MessageCircle`, matching `ChatChannelRow`'s own icon above — see that
  // component's doc comment for why this needs to read as distinct from
  // SMS's `MessageSquare` rather than sharing it.
  chat:     { icon: <MessageCircle className="h-4 w-4" strokeWidth={1.5} />, label: "Chat" },
  email:    { icon: <Mail className="h-4 w-4" strokeWidth={1.5} />, label: "Email" },
  sms:      { icon: <MessageSquare className="h-4 w-4" strokeWidth={1.5} />, label: "SMS" },
  whatsapp: { icon: <WhatsAppIcon className="h-4 w-4" />, label: "WhatsApp" },
  voice:    { icon: <Phone className="h-4 w-4" strokeWidth={1.5} />, label: "Voice" },
};

/* ── ChannelTab ──
 * One open channel rendered as a `Tab` — e.g. the "active conversation area"
 * tab bar under a record-header `PageHeader` (see `AgentNextGenTemplate
 * .stories.tsx`'s `activeInteraction` block), one tab per
 * `TrackedChannel`/`InteractionChannel`, kept in sync with which row is
 * "current" on the matching `InteractionNavItem` card via that component's
 * `currentChannelKey`/`onCurrentChannelChange` props — both should be driven
 * by the same piece of parent state (e.g. `ActiveInteraction.currentChannelId`)
 * so clicking a tab here and clicking a row on the card either update the
 * same thing. Not a full "tab list" wrapper — the consumer still renders its
 * own `<TabList>` around one `ChannelTab` per channel, same as any other set
 * of `Tab`s, and that `<TabList>` should just turn on `overflowMenu` like any
 * other tab bar (per its own standing default — see `tabs.tsx`) — no special
 * wrapper class needed. This used to shed each tab's own address/label text
 * at its own narrower 480px/320px breakpoints via a dedicated
 * `.lyra-channel-tab-list-wrap` container query instead of collapsing into
 * an overflow menu; that bespoke behavior was removed in favor of the
 * standard "active tab + N More" pattern every other `TabList` already uses
 * (see PROJECT_SUMMARY.md's "ChannelTab no longer has its own collapse
 * strategy" entry). A `Tooltip` on every tab always surfaces the type
 * label + address together on its own top line (e.g. "Email |
 * david.brown@example.com"), plus a second, smaller line with this
 * channel's current status and how long it's been since the customer last
 * spoke (`statusLabel`/`lastCustomerContactLabel`) when either is on hand
 * — the tooltip is the one place the type label is always paired with the
 * address, even though the tab FACE itself normally shows `address` alone
 * (replacing the type label there — see that prop's own doc comment, and
 * `showAddressOnFace` for opting a consumer back to the plain type label
 * on the face specifically). */
export interface ChannelTabProps {
  /** Determines this tab's icon, label, and default kebab menu items — same
   *  per-type choices as the matching `*ChannelRow`. */
  type: ChannelType;
  /** The phone number/email address/WhatsApp handle this channel is on, if
   *  any (e.g. `TrackedChannel.addressLabel`). Always shown on this tab's
   *  `Tooltip` (top line, alongside the plain type label — e.g. "Email |
   *  david.brown@example.com") when present, regardless of
   *  `showAddressOnFace` below — the tooltip is the one place it's always
   *  reachable. Per explicit request, also REPLACES the plain type label
   *  ("Email"/"SMS"/etc.) on the tab face itself by default — an agent
   *  scanning open tabs cares which specific number/handle a conversation
   *  is on far more than its generic channel type, which the leading icon
   *  already conveys — see `showAddressOnFace` to opt a consumer back to
   *  the plain type label on the face specifically (e.g. a bar that wants
   *  to stay compact) while still surfacing the address in the tooltip.
   *  Omit entirely when this channel has no address on hand (e.g. a
   *  redialed voice call with no stored number) — the tab just shows icon
   *  + type label (face and tooltip alike), and the tooltip's second line
   *  falls back to whatever `statusLabel`/`lastCustomerContactLabel` alone
   *  provide (or disappears entirely if both are also absent). */
  address?: string;
  /** Show `address` (above) on the tab face itself, REPLACING the plain
   *  type label there — default `true`. Set `false` to keep the face
   *  showing just the plain type label instead (its pre-`address` look)
   *  while still passing `address` through so it reaches the tooltip's top
   *  line — e.g. a bar with several tabs open at once, where every tab
   *  showing its own (often longer) address would crowd the row, but an
   *  agent hovering one specific tab still wants to see which number/
   *  handle it's on. Has no effect on the tooltip either way. */
  showAddressOnFace?: boolean;
  /** Total message count for this channel's conversation, if on hand.
   *  Currently not rendered anywhere on this tab — its old spot, the
   *  `Tooltip`'s second line, now shows `statusLabel`/
   *  `lastCustomerContactLabel` instead (per explicit request: an agent
   *  scanning tabs cares more about where a conversation stands and how
   *  long it's been since the customer last spoke than its raw message
   *  count). Kept as a real prop rather than removed outright — existing
   *  callers already pass it, and it's a reasonable candidate to resurface
   *  elsewhere on this tab later — but omit it for any new integration;
   *  it's a no-op today. */
  messageCount?: number;
  /**
   * This channel's own current status (e.g. "Open"/"Pending"/"Escalated"/
   * "Resolved"/"Closed" — whatever vocabulary the consumer's own status
   * popover uses) — first half of the `Tooltip`'s second line, alongside
   * `lastCustomerContactLabel` below (e.g. "Pending | Last contact 2m
   * ago"). Per explicit request, this replaced `messageCount` in that
   * spot — see that prop's own doc comment. Omit for a channel with no
   * status concept yet (e.g. a channel that's never had its status
   * explicitly set) — the tooltip's second line falls back to whatever
   * `lastCustomerContactLabel` alone provides, or disappears entirely if
   * that's also absent.
   */
  statusLabel?: string;
  /**
   * How long it's been since the CUSTOMER last said something on this
   * channel, already formatted as a short elapsed/relative-time string —
   * whatever convention the consumer's own UI already uses elsewhere (e.g.
   * this app's own "MM:SS" elapsed format, or a humanized "2m ago") — NOT
   * prefixed with "Last contact" here; `ChannelTab`
   * itself adds that label when composing the tooltip's second line (see
   * `statusLabel`'s own doc comment), so pass the bare relative-time value
   * only. Pre-formatted rather than a raw seconds count, same reasoning
   * `address` is already a pre-formatted string: this component has no
   * ticking clock of its own to derive a live "time since" value from —
   * that's the consumer's job (e.g. `AgentNextGenPage.tsx`'s own
   * `clockTick`-driven elapsed-time helpers), this just displays whatever
   * string it's handed. Omit when unknown (e.g. the customer hasn't sent a
   * message on this channel yet).
   */
  lastCustomerContactLabel?: string;
  /** This channel's own conversation/session id, if on hand — distinct from
   *  the customer-record id (`ActiveInteraction.recordId`, e.g. "AGT-2000")
   *  shown in the page header above: one customer record can have several
   *  channels open, each its own conversation with its own id. No longer
   *  shown anywhere on this tab itself (its old spot, this tab's `Tooltip`,
   *  now shows `address` instead — an agent scanning tabs cares which
   *  number/handle a channel is on far more than its internal
   *  conversation id) — kept as a prop purely so existing callers don't
   *  need an unrelated change, and in case some other surface on this tab
   *  wants it later. Omit when unknown. */
  interactionId?: string;
  active?: boolean;
  onClick?: () => void;
  /** Wired to the default kebab menu's "Unassign & Dismiss" entry — the
   *  consumer decides (same as `InteractionNavItem`'s own `onDismiss` vs.
   *  `onDismissChannel` split) whether that should end just this channel or
   *  the whole interaction, based on how many channels are open. */
  onDismiss?: () => void;
  /** Same meaning as `InteractionChannel.removeVariant` (channel-row.tsx's
   *  LeftNav-card counterpart) — which close-button treatment `showMenu={
   *  false}`'s fallback below renders: plain "×"/"Close {type}" (default,
   *  `"close"`) for an already-closed channel/interaction's tab, or a red
   *  trash icon reading "Delete Draft" for a genuine, never-launched draft
   *  thread's tab instead. Ignored while `showMenu` is true. Default
   *  `"close"` — every existing caller renders exactly as before. */
  removeVariant?: "close" | "delete-draft";
  /** Override this tab's default (per-`type`) kebab menu items. */
  menuItems?: MenuEntry[];
  /** Hide the trailing kebab. Default: true (kebab shown). `false` doesn't
   *  just leave that slot empty — per explicit request, it's replaced with a
   *  real close ("×") button wired to `onDismiss` instead (see the
   *  `<Tab onRemove>` call site below), for the one place this is actually
   *  set false today: a closed interaction's own tab, which has nothing left
   *  to show a kebab menu FOR (no Outcome to log, no Consult/Transfer) but
   *  still needs a way to close/remove the tab itself. */
  showMenu?: boolean;
  /** Wires the kebab's "Outcome" entry to open the real Log Outcome popover
   *  (same Resolution/Tags/Disposition/Summary form `ChannelRow`'s own
   *  standalone Outcome button opens — see `ChannelOutcomeConfig`'s doc
   *  comment) instead of being a plain, unwired menu item. Omit to leave
   *  "Outcome" inert, its pre-existing behavior — every existing consumer
   *  that doesn't pass this is unaffected. Unlike `ChannelRow`, there's no
   *  separate standalone Outcome button here to anchor the popover to (the
   *  action only ever lived in this kebab) — the popover anchors to the
   *  whole tab instead, opening below it once "Outcome" is picked from the
   *  dropdown. */
  outcome?: ChannelOutcomeConfig;
  /** Same meaning as `InteractionChannel.awaitingResponse` above (the
   *  LeftNav card's own per-channel prop) — when true, this tab's active-
   *  state color (see `severity`, `Tab`'s own doc comment for the full
   *  mechanics) switches from the plain blue "selected" look to the
   *  warning/critical status tokens, matching `ChannelRow`'s own elapsed-
   *  time text for the exact same channel. Has no visible effect while this
   *  tab isn't the active one — same as `Tab`'s own `severity` prop. Omit
   *  (the default) to leave this tab exactly as it's always looked. */
  awaitingResponse?: boolean;
  /** Same meaning as `InteractionChannel.awaitingSeverity` above — ignored
   *  when `awaitingResponse` is false/omitted, defaults to `"critical"`
   *  when left unset while `awaitingResponse` IS true (same fallback
   *  `ChannelRow`'s own prop uses, for the same reason: a consumer with no
   *  real wait-time data still gets this tab's pre-existing binary red-or-
   *  not behavior once wired up). */
  awaitingSeverity?: "success" | "warning" | "critical";
  className?: string;
}

const ChannelTab: React.FC<ChannelTabProps> = ({
  type,
  address: addressProp,
  showAddressOnFace = true,
  // Destructured but intentionally unused below — kept as a real prop for
  // existing callers/future use; see its own doc comment on
  // `ChannelTabProps.messageCount` for why it's currently unrendered.
  messageCount,
  statusLabel,
  lastCustomerContactLabel,
  interactionId,
  active,
  onClick,
  onDismiss,
  removeVariant = "close",
  menuItems,
  showMenu = true,
  outcome,
  awaitingResponse,
  awaitingSeverity,
  className,
}) => {
  const meta = CHANNEL_TYPE_META[type];
  // `address` isn't guaranteed to already be display-formatted (despite
  // this prop's own doc comment) — several producers upstream just copy a
  // raw dialed/looked-up string through unchanged — so it's normalized
  // here, once, before any of this component's render sites below use it.
  // `formatPhoneForDisplay` is a safe no-op for a non-phone-shaped address
  // (an email, a WhatsApp handle), so this never needs its own type check.
  const address = formatPhoneForDisplay(addressProp);
  // See `ChannelRow`'s own identical `severity` derivation above — same
  // "null when not awaiting at all, otherwise `awaitingSeverity` defaulting
  // to critical" rule, just feeding `Tab`'s `severity` prop instead of a
  // chip/elapsed-text color directly.
  const severity: "success" | "warning" | "critical" | undefined = awaitingResponse ? awaitingSeverity ?? "critical" : undefined;
  // Per explicit request, this tab's own leading icon swaps from the plain
  // per-type glyph (`meta.icon` — the WhatsApp/Mail/Phone/etc. mark) once
  // it's ACTUALLY overdue, so the tab bar reads as a real alert rather than
  // just a recolored version of its normal icon — and escalates AGAIN once
  // SLA is fully breached, not just late: a warning triangle for
  // `"warning"` (getting old, not overdue yet), then a circled exclamation
  // point (`CircleAlert`) for `"critical"` once it's actually breached —
  // same escalation the SLA banner's own copy ("nearing SLA breach" vs.
  // "has breached SLA time") already draws, now mirrored in the icon
  // itself instead of color being the only thing that changes between the
  // two. The green "success" tier (a reply just landed, still well within
  // SLA) keeps the plain per-type icon — just recolored green by `Tab`'s
  // own `iconColorClass` below — since a channel that's right on track
  // isn't something to alert on at all. `TriangleAlert`/`CircleAlert` here
  // are reserved for genuine SLA severity now — `buildDigitalMenuItems`/
  // `buildVoiceMenuItems`'s own "Unassign & Dismiss" entry used to share
  // `TriangleAlert` with this same warning tier, which made the two easy to
  // visually confuse; it now uses `UserX` instead (see those functions'
  // own doc comment), so a warning triangle on this tab bar always means
  // "SLA," never "dismiss." Lucide's `CircleAlert` is the outline circled-
  // "!" mark, distinct from `ErrorIcon`'s hardcoded-red solid dot used in
  // `InlineNotification` — this one needs a `currentColor` stroke, not a
  // fixed fill, so `Tab`'s `iconColorClass` can still recolor it the same
  // way it would any other icon passed into that slot).
  const tabIcon =
    severity === "critical" ? (
      <CircleAlert className="h-4 w-4" strokeWidth={1.5} />
    ) : severity === "warning" ? (
      <TriangleAlert className="h-4 w-4" strokeWidth={1.5} />
    ) : (
      meta.icon
    );
  const defaultMenuItems = type === "voice" ? buildVoiceMenuItems(onDismiss) : buildDigitalMenuItems(onDismiss);
  // Wires the "outcome" entry specifically (see `ChannelTabProps.outcome`'s
  // own doc comment) — every other entry (Unassign & Dismiss, Consult /
  // Transfer, Send/Download Transcript, etc.) is untouched. Only rewritten
  // when `outcome` is actually provided, so an omitted `outcome` leaves
  // this list — and so the kebab's behavior — byte-for-byte what it was
  // before this prop existed.
  const rawMenuItems = menuItems ?? defaultMenuItems;
  const effectiveMenuItems = outcome
    ? rawMenuItems.map((item) =>
        typeof item === "string" || "sectionLabel" in item || item.id !== "outcome"
          ? item
          : {
              ...item,
              // `menu-radix.tsx`'s `onSelect` calls this `onClick` and then
              // lets Radix's default close-on-select run in the very same
              // event — the kebab's `DropdownMenu` unmounts and its own
              // `onCloseAutoFocus` fires a synchronous `.focus()` back onto
              // the kebab trigger, which sits inside this same Popover's
              // Anchor. Calling `outcome.onOpenChange(true)` synchronously
              // here raced that close/focus-return cycle — the Popover's
              // Content would mount and then immediately get treated as
              // having lost focus/interacted-outside before the user ever
              // saw it, so nothing visibly opened. This is the same
              // "Dialog doesn't open from a DropdownMenu item" collision
              // Radix-based menu libraries hit generally (shadcn/ui's docs
              // carry the identical workaround); deferring to the next tick
              // lets the dropdown's own close finish first, so the Popover
              // opens into a settled DOM/focus state instead of the middle
              // of another layer's teardown.
              onClick: () => setTimeout(() => outcome.onOpenChange(true), 0),
            }
      )
    : rawMenuItems;
  // This tab's own kebab dropdown (rendered by `Tab` itself, inside the
  // same button this outer `Tooltip` wraps) has no other way to tell this
  // Tooltip it opened — the tooltip's trigger and the dropdown's trigger
  // are the same DOM node. `Tab`'s `onMenuOpenChange` reports it here so it
  // can feed straight into `disabled` below, instead of the tooltip staying
  // open (and visually sitting on top of the dropdown) the whole time the
  // dropdown is showing.
  const [menuOpen, setMenuOpen] = React.useState(false);
  // Outcome popover's own Resolution-dropdown state — see
  // `useOutcomePopoverState`'s own doc comment above. Declared
  // unconditionally (hooks can't be conditional) even though it's only
  // read when `outcome` is actually provided below.
  const outcomePopoverState = useOutcomePopoverState();
  // Guards the outcome Popover's `onInteractOutside` below — see that
  // prop's own comment for why this ref exists at all (short version:
  // swapping to `asAnchor` to fix the tab-click-opens-it bug also silently
  // lost Radix's built-in "don't treat clicking/refocusing my own trigger
  // as an outside interaction" exemption, since that exemption is wired to
  // `PopoverTrigger` specifically and never fires for `PopoverAnchor`).
  const anchorRef = React.useRef<HTMLSpanElement>(null);
  // Second tooltip line — e.g. "Pending | Last contact 2m ago" — omitted
  // entirely when neither value is on hand rather than rendering an empty/
  // half-blank line under the top line. Used to show message count +
  // address (and, before that, message count + the case/interaction id);
  // per explicit request this now shows this channel's own current status
  // and how long it's been since the customer last spoke instead — an
  // agent scanning tabs cares more about where a conversation stands and
  // whether it's gone quiet than its raw message count (see
  // `messageCount`'s own doc comment for where that went). `lastCustomer
  // ContactLabel` gets its own "Last contact" prefix added here (see that
  // prop's own doc comment for why it arrives as a bare relative-time
  // string instead). The "|" between the two is kept (two distinct facts,
  // not a label and its own value), rendered smaller (`lyra-body-sm`, one
  // step below the tooltip's own default `lyra-body-md`) since it's
  // secondary/reference info, not the tab's primary identity.
  const metaLine = [statusLabel, lastCustomerContactLabel ? `Last contact ${lastCustomerContactLabel}` : undefined]
    .filter(Boolean)
    .join(" | ");
  // Top line is now "{type} | {address}" when an address is on hand (e.g.
  // "Email | david.brown@example.com") — per explicit request, since the
  // tab face itself (below) now shows the address INSTEAD OF the type
  // label whenever one's available, the tooltip is the one place an agent
  // can still confirm which channel TYPE a given address is actually on
  // (address alone doesn't always make that obvious — a phone number could
  // be SMS or Voice). Falls back to the plain type label alone when there's
  // no address to pair it with (unchanged from before).
  const tooltipContent = (
    <div className="flex flex-col gap-0.5">
      <span>{address ? `${meta.label} | ${address}` : meta.label}</span>
      {metaLine && <span className="lyra-body-sm text-lyra-fg-secondary">{metaLine}</span>}
    </div>
  );
  const tabElement = (
    <Tab
      active={active}
      severity={severity}
      onClick={onClick}
      icon={tabIcon}
      menuItems={showMenu ? effectiveMenuItems : undefined}
      onMenuOpenChange={setMenuOpen}
      menuAriaLabel={`More options for ${meta.label}`}
      // Per explicit request: once `showMenu` is off (a closed interaction's
      // tab, per this prop's own doc comment — the one existing caller only
      // ever sets this false for that exact case), the kebab's old spot
      // isn't just left empty — it becomes a real close ("×") button
      // instead, wired to this same `onDismiss` the kebab's own "Unassign &
      // Dismiss" entry already used. `Tab` already supports exactly this
      // (`onRemove`, mutually exclusive with `menuItems` — see its own doc
      // comment in tabs.tsx), so this reuses that built-in slot rather than
      // hand-rolling a second close icon here. `undefined` (not `onDismiss`
      // unconditionally) while `showMenu` is on, so a normal, still-open
      // tab's trailing slot is unaffected — only a closed tab with no kebab
      // gets this.
      onRemove={!showMenu ? onDismiss : undefined}
      // See `ChannelTabProps.removeVariant`'s own doc comment — a genuine
      // draft's tab reads "Delete Draft" (matching the red trash icon
      // `Tab` itself renders for this variant) instead of the plain
      // "Close {type}" every other close-only tab still uses.
      removeLabel={removeVariant === "delete-draft" ? "Delete Draft" : `Close ${meta.label}`}
      removeVariant={!showMenu ? removeVariant : undefined}
      // This outer `Tooltip` already shows "{type} | {address}" (a
      // superset of this tab's own face text below) plus the status/last-
      // contact line — `Tab`'s own built-in truncation tooltip was firing
      // alongside it whenever the face text got clipped, stacking two
      // tooltip bubbles on one hover. See `showTruncationTooltip`'s own
      // doc comment in tabs.tsx.
      showTruncationTooltip={false}
      className={className}
    >
      {/* `data-tab-label` — marks specifically THIS span (not `Tab`'s own
          generic children-wrapper) as the real label text for `TabList`'s
          "N More" overflow dropdown to read (see that attribute's own doc
          comment in tabs.tsx). Per explicit request, this now shows the
          channel's own `address` INSTEAD OF the plain type label
          ("Email"/"SMS"/etc.) whenever one's on hand and `showAddressOnFace`
          is on (default) — an agent scanning open tabs cares which specific
          number/handle/address a conversation is on far more than its
          generic channel type, which the leading icon (and this tab's own
          `Tooltip`, see `tooltipContent` above) already conveys. Falls back
          to the plain type label whenever there's no address to show, or
          `showAddressOnFace` is off (see the `sr-only` branch below for that
          case). */}
      <span data-tab-label>{address && showAddressOnFace ? address : meta.label}</span>
      {/* `showAddressOnFace={false}` means the face above is showing the
          plain type label, not `address` — so there's no visible element
          carrying `address` for `TabList`'s "N More" overflow dropdown to
          read (`data-tab-subhead`, read alongside `data-tab-label` — see
          that attribute's own doc comment in tabs.tsx) once this tab
          collapses into it: an agent scanning a long list of "SMS"/"Voice"/
          "WhatsApp" entries with no number/handle next to any of them can't
          tell which is which. `sr-only` keeps it out of the tab face itself
          while still being real, queryable DOM content for both that
          dropdown and screen readers. Only rendered in this one branch —
          when the face is already showing `address` as its own visible
          `data-tab-label` text above, a second copy here would just
          duplicate it for a screen reader/the dropdown. */}
      {address && !showAddressOnFace && (
        <span data-tab-subhead className="sr-only">
          {address}
        </span>
      )}
    </Tab>
  );
  return (
    <Tooltip content={tooltipContent} placement="bottom" disabled={menuOpen || Boolean(outcome?.open)}>
      {outcome ? (
        // Plain host `<span>`, not `Tab` itself, is what `Popover`'s own
        // `Trigger asChild` clones onto here — `Tooltip`/`Popover` are both
        // ordinary components (not `forwardRef`-and-prop-spreading like
        // `Tab`/`Button` are), so nesting `Popover` directly around
        // `Tooltip` would silently drop Radix's injected ref/handlers the
        // same way `KebabMenuButton` once did as a bare `Tooltip` child
        // (see that component's own doc comment) — except here there's no
        // equivalent fix to reach for, since neither `Tooltip` nor
        // `Popover` is this file's to edit around that. A plain span
        // sidesteps the whole problem: host elements always forward
        // ref/props correctly, and Radix only needs *some* real DOM box to
        // measure for positioning — it doesn't have to be `Tab`'s own
        // element specifically. `inline-flex` so the span shrink-wraps
        // exactly around the tab instead of stretching to a block width —
        // in the PLAIN (uncollapsed) tab row, that leaves this span sized
        // exactly to the real `<button>` inside it, same as if there were
        // no wrapper at all.
        //
        // `lyra-channel-tab-anchor` (lyra-tokens.css) — `Popover`'s own
        // `asAnchor` mode adds no DOM node of its own (`asChild` clones
        // straight onto `tabElement`), so this span's one real DOM child is
        // `Tab`'s own `<button>` — that plain CSS class's `> *` rule
        // targets that button specifically. Needed for `TabList`'s
        // collapsed "active tab + N More" row (`overflowMenu`,
        // `.lyra-tab-overflow-collapsed > *` in lyra-tokens.css): that rule
        // stretches this span itself to fill its half of the row, but
        // `inline-flex` alone doesn't propagate that stretch to a *child*
        // with no `flex-grow`/width of its own — the button just sized to
        // its own content and sat flush-left inside the now-much-wider
        // span, leaving a visible gap before the "N More" trigger instead
        // of a clean 50/50 split (confirmed via screenshot: the active
        // tab's own underline stopped well short of half the row). A plain
        // hand-written CSS class rather than a Tailwind arbitrary-variant
        // utility (`[&>*]:w-full`, what this used to be) for the same
        // reason `.lyra-tab-overflow-collapsed`'s own matching rule is
        // plain CSS now too — see that rule's own doc comment
        // (lyra-tokens.css): this specific stretch was reported as still
        // not landing in practice despite every check on the Tailwind path
        // (compiled output, `cn()`/twMerge survival) coming back clean in
        // isolation, so this removes that whole path from the equation
        // rather than continuing to chase why it wasn't working. Doesn't
        // change anything in the *plain* (uncollapsed) row above — the
        // span still shrink-wraps to the button's own natural width either
        // way, this only matters once something upstream (like that
        // `flex-1`) hands the span more room than the button would take on
        // its own.
        <span ref={anchorRef} className="inline-flex lyra-channel-tab-anchor">
          <Popover
            open={outcome.open}
            onOpenChange={outcome.onOpenChange}
            placement="bottom"
            align="start"
            // Same `z-[9999]`/`onCloseAutoFocus` reasoning as `ChannelRow`'s
            // own Outcome popover — see that component's call site.
            className="z-[9999] w-80"
            onCloseAutoFocus={(e) => e.preventDefault()}
            // `tabElement` is `Tab`, which carries its own `onClick` (channel
            // selection) — without `asAnchor`, Radix's `Trigger` ALSO wires
            // up its own click-to-toggle on that same element, so an
            // ordinary click to switch channels was firing `onOpenChange`
            // right alongside `onClick`, popping this open on every tab
            // click instead of only when "Outcome" is picked from the
            // kebab. `asAnchor` makes `tabElement` a pure position
            // reference — `open` is driven exclusively by the kebab menu
            // item's `onClick` above (`effectiveMenuItems`), never by a
            // click on the tab itself. See `Popover`'s own `asAnchor` doc
            // comment for the general problem this solves.
            asAnchor
            // `modal` — see `Popover`'s own doc comment for the full
            // mechanics. Short version: `asAnchor` means Radix never
            // learns this tab is "our own" trigger (that exemption is
            // wired to `PopoverTrigger` specifically), so when the kebab's
            // `DropdownMenu` closes and returns focus to the kebab button
            // sitting inside this same anchor, non-modal mode couldn't
            // reliably tell that apart from a real outside interaction —
            // it flashed open, then immediately dismissed itself. Trapping
            // focus inside via `modal` while open sidesteps the detection
            // problem entirely instead of trying to out-guess it by hand.
            modal
            // Belt-and-suspenders alongside `modal`: still ignore any
            // stray interaction that lands back inside the tab/kebab
            // itself specifically (rather than relying purely on focus
            // trapping), so only a click truly outside the tab can close
            // this popover.
            onInteractOutside={(e) => {
              if (anchorRef.current?.contains(e.target as Node)) {
                e.preventDefault();
              }
            }}
            {...buildOutcomePopoverSlots(outcome, outcomePopoverState, anchorRef)}
          >
            {tabElement}
          </Popover>
        </span>
      ) : (
        tabElement
      )}
    </Tooltip>
  );
};

/* ── ChannelToggle / ChannelToggleGroup ──
 * A toggle-button rendering of the same "one open channel" concept
 * `ChannelTab` represents — same per-type icon/label/address/tooltip/kebab
 * behavior (built on the exact same `CHANNEL_TYPE_META`/`buildDigitalMenu
 * Items`/`buildVoiceMenuItems`/`KebabMenuButton`/`Tooltip` pieces `ChannelTab`
 * itself uses, not a re-derivation of any of it), just styled as a
 * `ToggleGroup`-style segmented pill instead of a `Tab`'s underline —
 * requested specifically for `PageHeader`'s `titlePrefix` slot (a compact
 * cluster to the left of the title, where an underlined tab strip reads
 * oddly against a single-line header row the way it doesn't in a full
 * `TabList` beneath one).
 *
 * Not built on `ToggleGroup` itself: that component's generic `items`
 * array renders each item's `label` inside the one real `<button>` it
 * owns, and a channel toggle's kebab is itself an interactive control —
 * nesting it in there would be a button-inside-a-button, the same reason
 * `Tab`'s own `menuItems` slot renders `KebabMenuButton` with `as="span"`
 * instead of letting it default to a real nested `<button>` (see that
 * prop's own doc comment in kebab-menu-button.tsx). `ChannelToggle` reuses
 * `ToggleGroup`'s exact visual classes by hand (selected/unselected pill
 * treatment, `role="radio"`/`aria-checked`) so the two read as the same
 * design-system control, and `ChannelToggleGroup` reuses its outer shell
 * classes (`role="radiogroup"`, rounded bordered strip, dividers between
 * items) the same way `TabList` is the shell `ChannelTab` needs but never
 * duplicates itself. */

export interface ChannelToggleProps extends ChannelTabProps {
  /** This toggle's position in its `ChannelToggleGroup` — only used to
   *  decide whether the divider immediately before it should render (first
   *  item never gets one). Set automatically by `ChannelToggleGroup`. */
  isFirst?: boolean;
}

/**
 * Per explicit follow-up request ("let's make the interaction tabs a toggle
 * group instead of tabs but keep the same functionality"): this now carries
 * full `ChannelTab` parity, not just the compact `titlePrefix`-slot subset
 * it originally shipped with (icon + type label + kebab only). Every prop
 * `ChannelTabProps` defines now actually does something here — same
 * severity-driven icon swap, same two-line tooltip, same close/delete-draft
 * fallback when `showMenu` is off, same Outcome popover wiring — built by
 * duplicating `ChannelTab`'s own logic for each rather than re-deriving it
 * (see each block's comment below for exactly which `ChannelTab` section it
 * mirrors). `address` is still deliberately never shown on the pill FACE
 * itself (unlike `ChannelTab`'s full-width row) — this toggle's compact
 * segmented-pill shape has no room for it without crowding neighboring
 * pills; it's still fully reachable in the `Tooltip`, same as before.
 */
const ChannelToggle: React.FC<ChannelToggleProps> = ({
  type,
  address: addressProp,
  statusLabel,
  lastCustomerContactLabel,
  interactionId,
  active,
  onClick,
  onDismiss,
  removeVariant = "close",
  menuItems,
  showMenu = true,
  outcome,
  awaitingResponse,
  awaitingSeverity,
  className,
  isFirst,
}) => {
  const meta = CHANNEL_TYPE_META[type];
  // See `ChannelTab`'s own identical normalization above — `address` isn't
  // guaranteed to already be display-formatted, so it's normalized here
  // too before this component's tooltip below uses it.
  const address = formatPhoneForDisplay(addressProp);
  // Mirrors `ChannelTab`'s own `severity`/`tabIcon` derivation verbatim —
  // see that component's doc comments (above) for the full "success/
  // warning/critical, escalating icon" reasoning; not re-explained here.
  const severity: "success" | "warning" | "critical" | undefined = awaitingResponse ? awaitingSeverity ?? "critical" : undefined;
  const tabIcon =
    severity === "critical" ? (
      <CircleAlert className="h-4 w-4" strokeWidth={1.5} />
    ) : severity === "warning" ? (
      <TriangleAlert className="h-4 w-4" strokeWidth={1.5} />
    ) : (
      meta.icon
    );
  const defaultMenuItems = type === "voice" ? buildVoiceMenuItems(onDismiss) : buildDigitalMenuItems(onDismiss);
  // Same tooltip-vs-kebab-dropdown/outcome-popover coordination `ChannelTab`
  // needs — see that component's own `menuOpen`/`outcomePopoverState`/
  // `anchorRef` comments for the full explanation of each.
  const [menuOpen, setMenuOpen] = React.useState(false);
  const outcomePopoverState = useOutcomePopoverState();
  const anchorRef = React.useRef<HTMLSpanElement>(null);
  // Mirrors `ChannelTab`'s own `effectiveMenuItems` — rewrites the kebab's
  // "Outcome" entry to open the real popover, deferred a tick past Radix's
  // own dropdown-close/focus-return cycle for the identical reason that
  // component's comment explains.
  const rawMenuItems = menuItems ?? defaultMenuItems;
  const effectiveMenuItems = outcome
    ? rawMenuItems.map((item) =>
        typeof item === "string" || "sectionLabel" in item || item.id !== "outcome"
          ? item
          : { ...item, onClick: () => setTimeout(() => outcome.onOpenChange(true), 0) }
      )
    : rawMenuItems;
  // Mirrors `ChannelTab`'s own `metaLine`/`tooltipContent` verbatim — same
  // "{type} | {address}" top line, same "{status} | Last contact {label}"
  // second line, same omit-entirely-when-empty rule.
  const metaLine = [statusLabel, lastCustomerContactLabel ? `Last contact ${lastCustomerContactLabel}` : undefined]
    .filter(Boolean)
    .join(" | ");
  const tooltipContent = (
    <div className="flex flex-col gap-0.5">
      <span>{address ? `${meta.label} | ${address}` : meta.label}</span>
      {metaLine && <span className="lyra-body-sm text-lyra-fg-secondary">{metaLine}</span>}
    </div>
  );
  const activeTextClass = "text-lyra-fg-active-strong";
  const toggleElement = (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        // `h-8` (32px) — per explicit request, every button inside a
        // `ChannelToggleGroup` should be the same fixed height regardless
        // of its own content, rather than sizing to `py-1.5` + whatever's
        // tallest among its icon/label/trailing-control children (the same
        // "no fixed height on the outer `<button>`" gap that caused the
        // kebab-vs-trash-fallback mismatch this toggle's own trailing
        // control comment below already documents/fixes at the CHILD
        // level — this fixes it at the button's own root instead, so
        // nothing inside ever needs to match anything else's height again).
        "relative inline-flex h-8 items-center gap-1.5 px-3 py-1.5 lyra-body-md rounded-lyra-sm transition-colors select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-1",
        active
          ? "bg-lyra-bg-active-subtle border border-lyra-border-active text-lyra-fg-active-strong hover:bg-lyra-state-hover-active-subtle active:bg-lyra-state-pressed-active-subtle"
          : "text-lyra-fg-default border border-transparent hover:bg-lyra-bg-surface-shell hover:border-lyra-border-soft active:bg-lyra-bg-disabled active:border-lyra-border-soft",
        className
      )}
    >
      <span className={cn("shrink-0", active ? activeTextClass : "text-lyra-fg-secondary")} aria-hidden="true">
        {tabIcon}
      </span>
      <span>{meta.label}</span>
      {showMenu ? (
        <KebabMenuButton
          as="span"
          items={effectiveMenuItems}
          ariaLabel={`More options for ${meta.label}`}
          onOpenChange={setMenuOpen}
        />
      ) : onDismiss ? (
        // Mirrors `Tab`'s own `onRemove` rendering (tabs.tsx) — same
        // active/inactive (never fixed-red) color, same `stopPropagation`
        // so this click never also selects the toggle. Per explicit bug
        // fix, the icon itself now splits on `removeVariant` the same way
        // `ChannelRow`'s own equivalent fallback already does just above in
        // this file (lines ~836-862): a plain `X` for an already-closed
        // channel/interaction (`removeVariant` default `"close"`), or
        // `Trash2` only for a genuine never-launched draft
        // (`"delete-draft"`) — this toggle previously always rendered
        // `Trash2` regardless, which read as "delete" even for a channel
        // that's simply closed and has nothing left to delete. `h-6 w-6`
        // (not the plain `h-5 w-5` this originally
        // shipped with) — per explicit follow-up request/bug report ("the
        // voice button is taller than the other buttons when it is the
        // last item"): this toggle's outer `<button>` has no fixed height
        // of its own (see `toggleElement`'s own className above), so its
        // rendered height is just whichever trailing child happens to be
        // tallest — and `KebabMenuButton` (rendered instead of this span
        // whenever `showMenu` is on, right above) is hardcoded `h-6 w-6`
        // (kebab-menu-button.tsx), a full 4px taller than this span's old
        // `h-5 w-5`. A pill showing its kebab (any active/`showMenu`
        // channel) rendered measurably taller than one showing this trash
        // fallback instead (an inactive/closed one) — purely from that
        // mismatched trailing-icon box, with nothing about the channel
        // itself actually differing. Matching both to the same `h-6 w-6`
        // keeps every pill in a `ChannelToggleGroup` the same height
        // regardless of which trailing control it happens to render.
        <span
          role="button"
          tabIndex={0}
          aria-label={removeVariant === "delete-draft" ? "Delete Draft" : `Close ${meta.label}`}
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onDismiss(); } }}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-lyra-xs flex-shrink-0 transition-colors",
            "hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
            active ? activeTextClass : "text-lyra-fg-disabled group-hover:text-lyra-fg-secondary"
          )}
        >
          {removeVariant === "delete-draft" ? (
            <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          )}
        </span>
      ) : null}
    </button>
  );

  return (
    <>
      {/* Divider — same "always in the DOM, invisible next to the active
          pill" trick `ToggleGroup` itself uses, so adding/removing a
          channel never shifts neighboring dividers' widths. */}
      {!isFirst && (
        <span aria-hidden="true" className={cn("w-px h-4 bg-lyra-border-subtle flex-shrink-0", active && "opacity-0")} />
      )}
      <Tooltip content={tooltipContent} placement="bottom" disabled={menuOpen || Boolean(outcome?.open)}>
        {outcome ? (
          // Same plain-`<span>`-as-Popover-anchor approach `ChannelTab` uses
          // and the same reasoning for it — see that component's own
          // `anchorRef`/`asAnchor`/`modal`/`onInteractOutside` comments for
          // the full explanation, not re-derived here.
          <span ref={anchorRef} className="inline-flex">
            <Popover
              open={outcome.open}
              onOpenChange={outcome.onOpenChange}
              placement="bottom"
              align="start"
              className="z-[9999] w-80"
              onCloseAutoFocus={(e) => e.preventDefault()}
              asAnchor
              modal
              onInteractOutside={(e) => {
                if (anchorRef.current?.contains(e.target as Node)) {
                  e.preventDefault();
                }
              }}
              {...buildOutcomePopoverSlots(outcome, outcomePopoverState, anchorRef)}
            >
              {toggleElement}
            </Popover>
          </span>
        ) : (
          toggleElement
        )}
      </Tooltip>
    </>
  );
};

export interface PlainToggleTabProps {
  /** Leading icon, e.g. `<History className="h-4 w-4" />` — this component
   *  has no per-`ChannelType` icon of its own to fall back to (unlike
   *  `ChannelToggle`), so the caller always supplies one. */
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  /** Same trailing-kebab slot `ChannelToggle` renders when `showMenu` is on
   *  — omit for no trailing control at all (this component has no close/
   *  delete-draft fallback; it's for non-channel items that are always
   *  either menu-less or kebab-driven). */
  menuItems?: MenuEntry[];
  /** Accessible label for the kebab, when `menuItems` is passed. */
  menuAriaLabel?: string;
  className?: string;
  /** Set automatically by `ChannelToggleGroup` — see `ChannelToggleProps
   *  .isFirst`'s own doc comment. */
  isFirst?: boolean;
  children: React.ReactNode;
}

/**
 * A non-channel sibling for `ChannelToggle` inside the same
 * `ChannelToggleGroup` — same selectable pill shell (icon + label +
 * optional kebab, `role="radio"`, same divider handling), just without any
 * of `ChannelToggle`'s channel-specific behavior (address/tooltip/severity/
 * outcome/close-fallback). Built for `ChannelToggleGroup`'s one legitimate
 * non-`ChannelType` member today — a past-session "history conversation"
 * tab opened via a Customer Information deep link, which still needs to sit
 * in the same "one selected item" strip and look identical to its
 * `ChannelToggle` neighbors, just isn't itself an open channel. Kept as its
 * own tiny component rather than stretching `ChannelToggle` to cover a
 * non-`ChannelType` case with optional/undefined `type`.
 */
const PlainToggleTab: React.FC<PlainToggleTabProps> = ({ icon, active, onClick, menuItems, menuAriaLabel, className, isFirst, children }) => {
  return (
    <>
      {!isFirst && (
        <span aria-hidden="true" className={cn("w-px h-4 bg-lyra-border-subtle flex-shrink-0", active && "opacity-0")} />
      )}
      <button
        type="button"
        role="radio"
        aria-checked={active}
        onClick={onClick}
        className={cn(
          // `h-8` (32px) — matches `ChannelToggle`'s own fixed height (see
          // that button's identical `h-8` comment) so a `PlainToggleTab`
          // sitting alongside `ChannelToggle` siblings in the same
          // `ChannelToggleGroup` (its one real use case) is always the same
          // height as them, never sized to its own icon/label/kebab content.
          "relative inline-flex h-8 items-center gap-1.5 px-3 py-1.5 lyra-body-md rounded-lyra-sm transition-colors select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-1",
          active
            ? "bg-lyra-bg-active-subtle border border-lyra-border-active text-lyra-fg-active-strong hover:bg-lyra-state-hover-active-subtle active:bg-lyra-state-pressed-active-subtle"
            : "text-lyra-fg-default border border-transparent hover:bg-lyra-bg-surface-shell hover:border-lyra-border-soft active:bg-lyra-bg-disabled active:border-lyra-border-soft",
          className
        )}
      >
        <span className={cn("shrink-0", active ? "text-lyra-fg-active-strong" : "text-lyra-fg-secondary")} aria-hidden="true">
          {icon}
        </span>
        <span>{children}</span>
        {menuItems && <KebabMenuButton as="span" items={menuItems} ariaLabel={menuAriaLabel ?? "More options"} />}
      </button>
    </>
  );
};

export interface ChannelToggleGroupProps {
  /**
   * One or more `ChannelToggle`/`PlainToggleTab` elements — typed as plain
   * `React.ReactNode` (not a strict `ReactElement<...>[]` union) because a
   * real caller's children are usually `{items.map(...)}` mixed with a
   * conditional trailing item (e.g. `{extra && <PlainToggleTab>...}`),
   * which TypeScript's JSX children-checking doesn't structurally match
   * against an explicit array-of-`ReactElement` union even though every
   * actual element in it really is one — `React.Children.toArray` below
   * does the real runtime normalization/validation instead of the type
   * system.
   */
  children: React.ReactNode;
  /**
   * Trailing content rendered inside this same bordered/rounded shell,
   * after the last toggle (e.g. an "Add Channel" `+` button). Passed
   * through as plain `React.ReactNode`, NOT cloned with `isFirst`/
   * `role="radio"` the way `children` are — this is a one-off action living
   * in the group's shell, not another selectable channel, so it shouldn't
   * pick up toggle/pill styling or radiogroup semantics. No automatic
   * divider before it (tried that first; a screenshot of the actual target
   * look showed plain whitespace, not a rule line) — the caller supplies its
   * own left spacing on `action` itself if it wants separation from the
   * last toggle (e.g. a small `ml-*`).
   */
  action?: React.ReactNode;
  className?: string;
}

/** Outer pill-strip shell for one or more `ChannelToggle`/`PlainToggleTab`s
 *  — same `role="radiogroup"` + bordered/rounded/padded container
 *  `ToggleGroup` itself renders (see that component's root `className`),
 *  reused verbatim rather than re-guessed so the two controls are visually
 *  identical. Sets each child's `isFirst` automatically — consumers just
 *  `.map()` their channels into `ChannelToggle`s (plus, at most, one trailing
 *  `PlainToggleTab` for a non-channel item) like any other list. */
const ChannelToggleGroup: React.FC<ChannelToggleGroupProps> = ({ children, action, className }) => {
  const items = React.Children.toArray(children) as React.ReactElement<ChannelToggleProps | PlainToggleTabProps>[];
  return (
    <div
      role="radiogroup"
      className={cn(
        "inline-flex items-center rounded-lyra-md border border-lyra-border-subtle bg-lyra-bg-surface-base p-0.5 gap-0",
        className
      )}
    >
      {items.map((child, i) => React.cloneElement(child, { isFirst: i === 0 }))}
      {action}
    </div>
  );
};

export {
  ChannelRow,
  ChatChannelRow,
  EmailChannelRow,
  SmsChannelRow,
  WhatsAppChannelRow,
  VoiceChannelRow,
  KindChannelRow,
  CHANNEL_ROW_COMPONENTS,
  CHANNEL_TYPE_META,
  ChannelTab,
  ChannelToggle,
  ChannelToggleGroup,
  PlainToggleTab,
  WhatsAppIcon,
  // Re-exported here for backward compatibility (both call sites above
  // still import them the same way). For a consumer that needs the Outcome
  // popover's exact Resolution/Tags/Disposition/Summary form OUTSIDE of
  // `ChannelRow`/`ChannelTab` themselves, prefer the packaged
  // `<OutcomePanel>` component (outcome-panel.tsx) over hand-assembling
  // these two directly. `ConsultTransferIcon` alongside them for the same
  // "no reason to redraw it a third time" logic — the "Consult / Transfer"
  // entry's own composite icon (no single Lucide glyph covers "transfer").
  useOutcomePopoverState,
  buildOutcomePopoverSlots,
  ConsultTransferIcon,
};
