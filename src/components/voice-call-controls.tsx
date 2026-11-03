// VoiceCallControls — ported into lyra-ui from agent-next-gen-v3's own
// `agent-next-gen-voice-call-controls.tsx` (that file's full build history
// is preserved below, unchanged) so every consuming app gets the same
// call-control bar instead of hand-copying it. Two changes made in the
// port itself, beyond the mechanical import-path updates: (1) the Record
// button's "disabled while masking" `Tooltip` is no longer reachable-proof
// — see `recordDisabled`'s own doc comment further down for why the
// original's native `disabled` attribute made that explanation
// unreachable by hover OR keyboard, and how this fixes it; (2) the
// unmatched-caller avatar fallback (no `customerInitials`) swapped from a
// bespoke purple circle + `Plus` glyph to this design system's own
// standard "primary" avatar look (same `bg-lyra-bg-primary`/generic `User`
// icon `InteractionNavItem`'s own avatar already falls back to) — see
// `customerInitials`'s own doc comment.
//
// VoiceCallControls — the fixed-to-the-bottom-of-the-content-area call
// toolbar for an active VOICE channel (Hold/Mute/Mask/Record/Keypad/Add
// video/Hang Up), per explicit request/reference screenshot. Sits in
// the exact spot `InteractionComposer` occupies for a chat channel — a
// `shrink-0` sibling directly below `InteractionTranscript`, in each of the
// three page components' own "voice has no composer" branch (see that
// branch's own doc comment, AgentNextGenPage.tsx/AgentWorkspace2WithDeskPage
// .tsx/AgentWorkspaceAdvancedPage.tsx) — so a live voice call gets this bar
// in that exact slot instead of nothing.
//
// Every button here except Hang Up is purely decorative/local-state (Hold/
// Mute/Mask/Record/Add video each just toggle their own icon and fire a
// toast; Keypad opens a small popover dialpad) — there's no real telephony
// backing any of this in the prototype, same "fake it with a toast"
// convention every other placeholder control in this app already follows
// (Send Transcript/Download Transcript/Translate Messages, etc.). Hang Up
// is the one exception: it's wired to a real `onHangUp` callback (the
// caller closes this channel, same as picking "Closed" from the status
// popover) since ending the call is the one action here an agent actually
// depends on to move on to logging an outcome.
//
// This bar used to carry THREE renderings — a WIDE two-row centered card, a
// COMPACT icon-only row, and a `stretch` single-row variant of the wide
// buttons for Phase 1/Phase 2 — auto-toggling between wide/compact via a
// `ResizeObserver` self-measuring this bar's own rendered width against a
// 768px breakpoint (a pattern `InteractionTranscript`'s own
// `transcriptNarrow`/`transcriptBubbleFullWidth`, agent-next-gen-
// transcript.tsx, and `ScheduleToolbar`'s own `containerRef`/`isWide`/
// `isCompact`, SchedulePanel.tsx, also use). Per an explicit bug report
// ("opened the details panel with the left nav closed, opened the left
// nav, then closing the details panel again didn't resize the bar back")
// and the explicit follow-up fix request that replaced trying to chase that
// bug further ("just take the existing compact version — stretch it the
// full width of the container and remove media queries"): all of that
// responsive machinery — the `ResizeObserver`/`isCompact` state, the wide
// two-row card, and the `stretch` single-row card — is gone. This bar now
// always renders what used to be the COMPACT (icon-only) JSX, unconditionally,
// stretched to fill whatever width its container gives it (`w-full` on the
// card below AND on the outer full-bleed wrapper — see that wrapper's own
// doc comment for why both levels need it explicitly rather than leaning on
// ambient flex stretch — no `max-w`/`mx-auto` cap) instead of only kicking
// in below a measured breakpoint. Below, every main control still drops its
// visible label for a hover/focus `Tooltip` (`CompactCallControlButton`),
// the timer still shows its "MM:SS" digits next to a Clock icon, and
// Volume/Transcript still trail in their own leading/trailing flex slots —
// none of that content changed, only the "which rendering, and how wide"
// logic around it. `stretch` stays as an accepted prop (default `false`)
// purely so Phase 1/Phase 2's existing call sites don't need to change
// their JSX — it no longer affects anything rendered here.
//
// Per a later explicit follow-up request/reference screenshot ("make the
// voice controls larger and label the buttons again"), every main control
// (Hold/Mask/Record/Keypad/Transcript/Volume/Mute/Add video) switched back
// from that icon-only `CompactCallControlButton` treatment to a labeled
// icon-over-text button instead — bigger tap target, and the label is now
// always-visible text again rather than only surfacing on hover/focus via
// `Tooltip`. This ISN'T a return to the old three-way wide/compact/stretch
// responsive split this file just spent the paragraph above removing —
// there's still exactly one rendering, it's just the LABELED one now
// instead of the icon-only one, still unconditionally stretched to its
// container's width. `WideCallControlButton` (below) — defined back when
// this file had that old wide rendering, but unused since it was removed —
// is what got reactivated for this, reworked to compose as a `Tooltip`/
// `Popover` trigger the same way `CompactCallControlButton` already does
// (see its own doc comment for why that requires `forwardRef`+`...rest`
// rather than a plain named-prop function). `CompactCallControlButton`
// itself is left defined but unused below — nothing left in this file
// calls it now that every control uses the labeled button instead — kept
// rather than deleted in case a genuinely narrow/compact rendering is ever
// wanted again later. Hang Up is the one control excluded from this
// change, per explicit request ("keep the End Call button filled red") —
// it stays the same solid-red `Button` it already was (see that render
// site's own doc comment), just bumped from `size="default"` to `size="lg"`
// so it still reads as proportionate next to the now-taller labeled
// buttons beside it.
//
// Per a later explicit follow-up request/reference screenshot ("make the
// end call button the same height as the mute and add video buttons and add
// the customer avatar. Add the name / number/email above the timer"): the
// trailing dark cluster (Mute/Add video/End Call) switched from
// `items-center` to `items-stretch` and End Call's fixed `size="lg"` height
// (h-9) got overridden to `h-auto`, so it now stretches to match whichever
// of Mute/Add video is tallest (their own `WideCallControlButton` shape is
// already `h-auto`, sized by content) instead of sitting short and centered
// next to them — no hardcoded pixel height to keep in sync if either of
// those buttons' own height ever changes. Separately, the leading slot
// gained an optional avatar chip + identity line (`customerLabel`/
// `customerInitials`, see their own doc comments on `VoiceCallControlsProps`
// below) stacked above the existing elapsed timer, per the reference
// screenshot's small purple circle + phone number/name sitting above the
// call duration. The avatar's purple background reuses this app's own
// existing "Voice channel = purple" accent convention (see
// `CHANNEL_TYPE_TAG_VARIANT`/`CHANNEL_TYPE_ICON_COLOR_CLASS`,
// agent-next-gen-contact-history.tsx and channel-row.tsx, both already
// purple for Voice) rather than inventing a new color. Its glyph is a
// generic `Plus` fallback (this design system's `interaction-nav-item.tsx`
// already falls back to a generic icon — there just a person outline —
// when there's no real contact match; `Plus` reads closer to the reference
// screenshot's unmatched-quickdial-number case, see `Interaction.id`'s own
// `quickdial:<number>` doc comment) shown in white — an explicit follow-up
// clarified this should be white, not the icon's original black/dark
// tone — with real initials (`customerInitials`) taking over instead once a
// caller has a genuine contact match, same "initials over generic icon
// once known" split that avatar convention already uses.
//
// Left rail layout (`layout="rail"`): the same controls stacked for a narrow
// column (a left rail beside the conversation) instead of a full-width bar:
// a header (Avatar, customer label, timer, hold badge), a tinted 3-column
// grid of icon-only buttons (Hold, Mask, Record, Keypad, Transcript, Volume),
// each named by a Tooltip, then Mute and End Call side by side as full labeled
// buttons; with a labeled "Video" button, Mute and Video share that row and
// End Call goes full width below. At least 240px wide (its default width). Same state, handlers, toasts,
// masking/record rule and hang-up animation as the bar; nothing is
// measured, it always renders this way.
//
// One component for every app: agent-next-gen-v3 and agent-next-gen-demo each
// kept their own fork of this file (`agent-next-gen-voice-call-controls.tsx`)
// and both now import this one instead. Its props are the union of all three:
// v3's "View Transcript?" confirm (`transcriptNeedsConfirm`), the demo's
// controlled mute / record / mask, DTMF (`onSendDtmf`), `show*` toggles,
// tick-based timers (`callStartTick` / `holdStartTick` + `renderClock`), a
// transcript menu (`transcriptMenu`) and a node `customerLabel`; both forks'
// `stacked` maps to `layout="rail"`. Like both forks, Hold / Mask / Record no
// longer fire toasts (only the decorative video toggle does). The Transcript
// button never disappears: with nothing to open it shows disabled.
import React, { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";
import { Badge } from "./badge";
import { Avatar } from "./avatar";
import { Menu } from "./menu";
import { ContainerHeader as PanelHeader } from "./container-header";
import { InfoIcon } from "./icons/info-icon";
import { getHoldSeverity } from "./hold-sla";
import { Button } from "./button";
import { Popover } from "./popover";
import { Slider } from "./slider";
import { Spinner } from "./spinner";
import { Tooltip } from "./tooltip";
import { KebabMenuButton } from "./kebab-menu-button";
import type { MenuEntry } from "./menu";
import type { ToastItem } from "./toast";
import {
  createLucideIcon,
  Pause,
  Play,
  Mic,
  MicOff,
  AudioLines,
  Circle,
  Grid3x3,
  Video,
  VideoOff,
  PhoneOff,
  Clock,
  Volume2,
  VolumeX,
  FileText,
  MoreHorizontal,
} from "lucide-react";

/** Renders a tick count (seconds since the call started) as "MM:SS" — same
 *  format/shape `InteractionNavItem`'s own per-channel `elapsed` prop
 *  expects (interaction-nav-item.tsx), kept as its own tiny local copy
 *  here rather than a shared export since it's a one-line pure function,
 *  not worth a cross-file dependency either component would have to carry. */
function formatElapsedTime(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const mm = Math.floor(clamped / 60);
  const ss = clamped % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/** One column: icon on top, visible label underneath — the main control
 *  shape this bar now uses everywhere (see this file's own top doc comment
 *  for the "why now again" history). Was originally used only by a since-
 *  removed wide rendering, unused for a while after that (only tooltip-only
 *  `CompactCallControlButton` remained), then reactivated and reworked
 *  here per a later explicit follow-up request.
 *
 *  Built with `React.forwardRef` and a `...rest` spread — same reasoning as
 *  `CompactCallControlButton`'s own doc comment just below gives for why
 *  that one needs it: this button has to compose correctly as either a
 *  `Popover`'s trigger child (Keypad/Volume both clone their own
 *  click/ref/aria-* props onto their immediate child via Radix's
 *  `asChild`/`Slot`) or a plain button with native attributes
 *  (`disabled` on Record) — a fixed named-prop list would silently drop
 *  whichever of those it didn't explicitly declare. `label` itself no
 *  longer needs to reach a `Tooltip` the way it used to (that's now this
 *  button's own always-visible text, not hover-only content), so unlike
 *  `CompactCallControlButton`, most call sites below no longer wrap this in
 *  one at all — see each call site's own comment for the one exception
 *  (Record, which still has genuinely EXTRA hover content beyond its
 *  label: why it's disabled). */
const WideCallControlButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: React.ReactNode;
    label: string;
    /** Tints icon+label the same blue "selected" treatment lyra-ui's own
     *  active states already use, once this control is toggled on (Hold/
     *  Mute/Mask/Record/Add video). Omit/`false` for the plain gray look. */
    active?: boolean;
    /** Hang Up doesn't use this component at all (see this file's own top
     *  doc comment for why it's excluded) — kept for parity with
     *  `CompactCallControlButton`'s own identical prop in case a future
     *  critical-styled control besides Hang Up ever needs this shape. */
    critical?: boolean;
    /** Same darker-at-rest treatment as `CompactCallControlButton`'s own
     *  `strong` prop — Mute/Add video pass this, matching the reference
     *  screenshot's visibly darker icons for that pair. */
    strong?: boolean;
    /** Same `ghost`/`outline` swap as `CompactCallControlButton`'s own
     *  `variant` prop — Mute/Add video pass `"outline"`, every other
     *  control keeps the default plain `ghost` look. */
    variant?: "ghost" | "outline";
  }
>(({ icon, label, active, critical, strong, variant = "ghost", className, ...rest }, ref) => {
  return (
    <Button
      ref={ref}
      variant={variant}
      className={cn(
        // Per explicit follow-up request/reference screenshot ("make the
        // voice controls larger"): `h-auto w-20` (unchanged from this
        // component's original wide-rendering sizing) plus `gap-1.5`/
        // `py-2` (was `gap-1`/`py-1.5`) for a bit more breathing room
        // around the now-larger icon (`h-5 w-5` at each call site below,
        // was `h-4 w-4` to match `CompactCallControlButton`'s icon-only
        // sizing) and the visible label text beneath it.
        "h-auto w-20 shrink-0 flex-col gap-1.5 rounded-lyra-sm px-1 py-2",
        critical
          ? "text-lyra-status-critical-strong hover:bg-lyra-status-critical-subtle hover:text-lyra-status-critical-strong active:bg-lyra-status-critical-medium"
          : active
          ? "text-lyra-fg-active-strong bg-lyra-bg-active-subtle hover:text-lyra-fg-active-strong"
          : strong
          ? "text-lyra-fg-default hover:text-lyra-fg-default"
          : "text-lyra-fg-secondary hover:text-lyra-fg-default",
        className
      )}
      {...rest}
    >
      {icon}
      <span className="lyra-body-xs w-full truncate text-center">{label}</span>
    </Button>
  );
});
WideCallControlButton.displayName = "WideCallControlButton";

/** Plain 24×24px icon-only button — the narrow-container rendering of
 *  Hold/Mask/Record/Keypad/Transcript/Volume (see this file's own top doc
 *  comment for why there are two shapes). `label` is still required, it's
 *  just surfaced via a `Tooltip` at the call site instead of rendered
 *  directly here (Keypad/Volume's own call sites wrap `Tooltip` around the
 *  whole `Popover` instead, per those render sites' own comments, since
 *  both also need to be a `Popover` trigger).
 *
 *  Per explicit request ("when the width of the call controls goes below
 *  991px make the hold/mask/record/keypad/transcript/volume icon only
 *  buttons and 24px"): `VoiceCallControls` measures its own rendered width
 *  via `ResizeObserver` (`controlsCompact`, below — same "measure my own
 *  container, not the viewport" approach `ScheduleToolbar` already uses
 *  for its own breakpoint, schedule-panel.tsx) and swaps those six
 *  controls from `WideCallControlButton` to this component once it drops
 *  below that width. Mute/Add video/End Call are deliberately excluded —
 *  the request named only the six controls above.
 *
 *  Built with `React.forwardRef` and a `...rest` spread (rather than a
 *  fixed named-prop list) specifically so it composes correctly as either a
 *  `Tooltip`'s or a `Popover`'s trigger child: both clone extra props
 *  (event handlers, a `ref` for position measurement, `aria-*` state) onto
 *  their immediate child via Radix's `asChild`/`Slot` mechanism, which only
 *  reaches the real DOM `<button>` if this component actually forwards a
 *  `ref` and spreads through whatever it's handed — a plain, non-forwardRef
 *  function component only works for `onClick` because that name happens
 *  to already be a named prop; a hover-only prop like `onPointerEnter`
 *  (which `Tooltip` needs) would be silently dropped the same way a `ref`
 *  would. */
const CompactCallControlButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: React.ReactNode;
    active?: boolean;
    critical?: boolean;
    /**
     * Per explicit request ("make the mute and video icons darker"): swaps
     * this button's own DEFAULT (non-active, non-critical) resting color
     * from `fg-secondary` (60% opacity — this bar's usual resting-state
     * gray, still used by every other control here) to `fg-default` (80%
     * opacity) — the SAME token every one of these buttons already promotes
     * to on hover/focus (see the plain `else` branch below), just applied
     * at rest instead of only on interaction. Both are existing lyra-ui
     * neutral-text tiers (see lyra-tokens.css), not one-off colors, so this
     * stays inside the request's own "keep the same styling for lyra-ui"
     * instruction. Ignored once `active`/`critical` is true — those already
     * render in their own (even stronger) blue/red, so there's nothing left
     * for this to darken further. Mute and Video are the two call sites
     * that pass this below; every other control keeps the plain resting
     * `secondary` gray unchanged.
     */
    strong?: boolean;
    /**
     * Per explicit request ("make the mute / video buttons outline icon
     * buttons"): lets Mute/Video opt into `Button`'s real `"outline"`
     * variant (a bordered, `bg-lyra-bg-control` surface) instead of this
     * component's own default `"ghost"` (transparent until hover) — every
     * other control here (Hold/Mask/Record/Keypad/Transcript) omits this
     * and keeps the existing plain `ghost` look unchanged. The `active`/
     * `critical`/`strong` tint classes above are unaffected either way —
     * they already override `outline`'s own default `bg`/`text` tokens via
     * `cn()`'s tailwind-merge the same way they already override `ghost`'s.
     */
    variant?: "ghost" | "outline";
  }
>(({ icon, active, critical, strong, variant = "ghost", className, ...rest }, ref) => {
  return (
    <Button
      ref={ref}
      variant={variant}
      size="icon"
      aria-pressed={critical ? undefined : active}
      className={cn(
        // 40px (`Button`'s own "icon-xl" size token) — bumped up from an
        // initial 24px per explicit follow-up request ("bump the buttons
        // up to 40px").
        "h-10 w-10 shrink-0 rounded-lyra-sm",
        critical
          ? "text-lyra-status-critical-strong hover:bg-lyra-status-critical-subtle hover:text-lyra-status-critical-strong active:bg-lyra-status-critical-medium"
          : active
          ? "text-lyra-fg-active-strong bg-lyra-bg-active-subtle hover:text-lyra-fg-active-strong"
          : strong
          ? "text-lyra-fg-default hover:text-lyra-fg-default"
          : "text-lyra-fg-secondary hover:text-lyra-fg-default",
        className
      )}
      {...rest}
    >
      {icon}
    </Button>
  );
});
CompactCallControlButton.displayName = "CompactCallControlButton";

/** Plain 3x4 dialpad — Keypad's own popover body, shared by both the wide
 *  and compact renderings. Each digit press just appends to this popover's
 *  own local display (no real DTMF tone/signal to send in this prototype);
 *  `Clear` resets it. Closes on outside click/Escape like any other plain,
 *  uncontrolled `Popover`. */
function DialPad({ onDigit }: { onDigit?: (digit: string) => void }) {
  const [digits, setDigits] = useState("");
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
  return (
    <div className="flex flex-col gap-3 p-3 w-[220px]">
      <div className="lyra-body-md-emphasis text-lyra-fg-default text-center min-h-[24px] tracking-wider">
        {digits || <span className="text-lyra-fg-secondary">Enter digits</span>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {keys.map((key) => (
          <Button
            key={key}
            variant="outline"
            className="h-10 w-full lyra-body-md-emphasis"
            onClick={() => {
              setDigits((d) => d + key);
              onDigit?.(key);
            }}
          >
            {key}
          </Button>
        ))}
      </div>
      <Button variant="ghost" size="sm" onClick={() => setDigits("")} disabled={!digits}>
        Clear
      </Button>
    </div>
  );
}

/** The collapsed volume trigger — compact rendering only (see this file's
 *  own top doc comment for why the wide rendering keeps its own separate
 *  icon instead). A single icon button (the live volume glyph, same
 *  `Volume2`/`VolumeX` swap the wide trigger uses) opens a small popover
 *  holding just the volume slider.
 *
 *  Per explicit follow-up request ("take the transcript button out of the
 *  volume dropdown and put it to the left of the volume button"): this used
 *  to also fold a "Show/Hide transcript" row into this same popover
 *  (`CompactVolumeAndTranscriptButton`, see this file's own git history) —
 *  transcript is back to being its own separate `WideCallControlButton`
 *  (was `CompactCallControlButton` — see this file's own top doc comment
 *  for that later rename-in-place) at this component's own call site
 *  instead, so this trigger is volume-only again.
 *
 *  `volume`/`onVolumeChange` are lifted to the OUTER `VoiceCallControls`
 *  component rather than local state here — see this file's own top doc
 *  comment for why (the value has to survive a resize back across the
 *  breakpoint into the wide rendering's own separate volume trigger). */
function CompactVolumeButton({
  volume,
  onVolumeChange,
  disabled,
  compact,
  placement = "top",
}: {
  volume: number;
  onVolumeChange: (volume: number) => void;
  /** Per explicit request ("when end call is clicked ... disable the
   *  other buttons at the same time"): disables the trigger itself
   *  (forwarded to `WideCallControlButton` below, same as every other
   *  control in this bar) and forces the popover closed/unopenable rather
   *  than leaving an already-open volume slider live while the call is
   *  hanging up — same "force off a conflicting open state" convention
   *  the Mask/Record pair above already follows. */
  disabled?: boolean;
  /** Mirrors `VoiceCallControls`'s own `controlsCompact` (see that file's
   *  top doc comment / `CompactCallControlButton`'s) — swaps this
   *  trigger from `WideCallControlButton` to the icon-only 24px
   *  `CompactCallControlButton` below the 991px breakpoint, same as every
   *  other control in the centered cluster. Uses a native `title` rather
   *  than `Tooltip` for the same reason Keypad's own call site does — see
   *  that comment. */
  compact?: boolean;
  /** Which side the volume popover opens on. Default "top" (the bar); the left rail opens it to the right. */
  placement?: "top" | "right";
}) {
  const [open, setOpen] = useState(false);

  return (
    // No more wrapping `Tooltip` — per later explicit follow-up request
    // ("label the buttons again"), the trigger below is now a labeled
    // `WideCallControlButton` (visible "Volume" text) rather than the old
    // hand-rolled icon-only `<button>` a hover `Tooltip` used to be the
    // only way to name, so there's nothing left for a tooltip to add here.
    // `Popover`'s trigger still clones its own click/ref/aria props onto
    // its immediate child via Radix's `asChild`/`Slot` mechanism — that's
    // exactly what `WideCallControlButton`'s own `forwardRef`+`...rest`
    // are for (see that component's own doc comment).
    <Popover
      open={open && !disabled}
      onOpenChange={(next: boolean) => {
        if (!disabled) setOpen(next);
      }}
      placement={placement}
      content={
        <div className="flex items-center gap-2 p-3 w-[200px]">
          <button
            type="button"
            onClick={() => onVolumeChange(volume === 0 ? 70 : 0)}
            aria-label={volume === 0 ? "Unmute" : "Mute"}
            className="shrink-0 text-lyra-fg-secondary hover:text-lyra-fg-default"
          >
            {volume === 0 ? (
              <VolumeX className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <Volume2 className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            )}
          </button>
          <Slider
            value={volume}
            onChange={onVolumeChange}
            min={0}
            max={100}
            step={1}
            showTicks={false}
            label="Call volume"
            className="flex-1 min-w-0 [&>label]:sr-only"
          />
        </div>
      }
    >
      {compact ? (
        <CompactCallControlButton
          icon={
            volume === 0 ? (
              <VolumeX className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <Volume2 className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            )
          }
          active={open}
          disabled={disabled}
          aria-label="Volume"
          title="Volume"
          aria-pressed={open}
        />
      ) : (
        <WideCallControlButton
          icon={
            volume === 0 ? (
              <VolumeX className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <Volume2 className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            )
          }
          label="Volume"
          active={open}
          disabled={disabled}
          aria-label="Volume"
          aria-pressed={open}
        />
      )}
    </Popover>
  );
}

/** Mask is on: lucide's `audio-lines-off` (lucide-react 1.x, ISC). lyra-ui's lucide (0.468) predates it, so its
 *  paths are copied here; swap for the import once lyra-ui moves to lucide 1.x. */
const AudioLinesOff = createLucideIcon("AudioLinesOff", [
  ["path", { d: "M10 10v11", key: "tkf9cx" }],
  ["path", { d: "M10 3v1.35", key: "1rsffz" }],
  ["path", { d: "M14 14v1", key: "hsexio" }],
  ["path", { d: "M14 8v.35", key: "isohmc" }],
  ["path", { d: "M18 5v7.35", key: "1b0cqo" }],
  ["path", { d: "M2 10v3", key: "1fnikh" }],
  ["path", { d: "m2 2 20 20", key: "1ooewy" }],
  ["path", { d: "M22 10v3", key: "154ddg" }],
  ["path", { d: "M6 6v11", key: "11sgs0" }],
]);

/** "View Transcript?" popover (`transcriptNeedsConfirm`): shown when the agent is looking at another contact, so
 *  opening the transcript means navigating back to this one first. Ported from agent-next-gen-v3's fork. */
function buildTranscriptConfirmPopoverSlots(onConfirm: () => void, onCancel: () => void) {
  return {
    header: (
      <PanelHeader
        title="View Transcript?"
        icon={<InfoIcon className="h-5 w-5" aria-hidden="true" />}
        bordered={false}
        className="px-5 pb-0"
      />
    ),
    content: (
      <p className="pb-2 pt-1 lyra-body-md text-lyra-fg-secondary">
        You're not currently viewing this contact. Navigate back to it to view the transcript?
      </p>
    ),
    footer: (
      <div className="flex items-center justify-end gap-2 px-5 pb-4 pt-1">
        <Button variant="outline" size="md" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="md" onClick={onConfirm}>
          View Transcript
        </Button>
      </div>
    ),
  };
}

/* ── Props ──
   One component for every app: this API is the union of lyra-ui's own and the two app forks it replaced
   (agent-next-gen-v3's and agent-next-gen-demo's `agent-next-gen-voice-call-controls.tsx`). Every state is
   "controlled once its `on*Change` is passed, else local": a prototype with no telephony gets working
   toggles for free, an app with a real provider passes the state and handlers. */
export interface VoiceCallControlsProps {
  /** Ends the call, after a 1s "Hanging Up..." and a 300ms collapse. The one action every caller wires. */
  onHangUp: () => void;

  /* ── Timers ── pass seconds, or start ticks plus `renderClock` (re-renders only the timers each tick). */
  /** Seconds since the call started, shown as "MM:SS" next to a clock (a pulsing red dot while recording). */
  elapsedSeconds?: number;
  /** Seconds on hold, shown as an "On hold MM:SS" badge (colored by `getHoldSeverity`) while `onHold`. */
  onHoldElapsedSeconds?: number;
  /** Clock tick (seconds) the call started on. Used with `renderClock` instead of `elapsedSeconds`. */
  callStartTick?: number;
  /** Clock tick (seconds) the hold started on. Used with `renderClock` instead of `onHoldElapsedSeconds`. */
  holdStartTick?: number;
  /** Renders the live timers from the caller's clock: called with a function of the current tick, e.g.
   *  `(render) => <ClockTick>{render}</ClockTick>`, so each tick re-renders only the timer text, not the bar. */
  renderClock?: (render: (nowTick: number) => React.ReactNode) => React.ReactNode;

  /* ── Call state (controlled once the handler is passed) ── */
  /** Whether the call is on hold. Controlled once `onHoldChange` is passed. */
  onHold?: boolean;
  /** Called with the new hold state from Hold / Resume. */
  onHoldChange?: (onHold: boolean) => void;
  /** Whether the agent's mic is muted. Controlled once `onMuteChange` is passed. */
  muted?: boolean;
  onMuteChange?: (muted: boolean) => void;
  /** Whether the call is being recorded. Controlled once `onRecordingChange` is passed. Masking stops it. */
  recording?: boolean;
  onRecordingChange?: (recording: boolean) => void;
  /** Whether voice masking is on (Record is disabled meanwhile). Controlled once `onMaskedChange` is passed. */
  masked?: boolean;
  onMaskedChange?: (masked: boolean) => void;
  /** Called with each digit pressed on the Keypad (DTMF). */
  onSendDtmf?: (digit: string) => void;

  /* ── Transcript ── one of these; with none, the Transcript button shows disabled ("Transcript not available"). */
  /** Opens/closes the caller's transcript panel. */
  onToggleTranscript?: () => void;
  /** Whether that panel is open (tints the button). */
  transcriptOpen?: boolean;
  /** The agent is viewing another contact: Transcript first asks "View Transcript?", then calls
   *  `onConfirmViewTranscript`. */
  transcriptNeedsConfirm?: boolean;
  onConfirmViewTranscript?: () => void;
  /** Transcript opens a menu of these entries instead (e.g. View / Send / Download transcript). Wins over the
   *  two options above. */
  transcriptMenu?: MenuEntry[];

  /* ── Video ── */
  /** Opens/closes the caller's video window. Omit for a local, decorative toggle (with a toast). */
  onToggleVideo?: () => void;
  videoOpen?: boolean;

  /* ── Which controls show (all default true) ── */
  showHold?: boolean;
  showMute?: boolean;
  showRecord?: boolean;
  showMask?: boolean;
  showKeypad?: boolean;
  /** Shows the video button ("Add video" in the bar, "Video" in the rail). */
  showAddVideo?: boolean;

  /* ── Identity ── */
  /** Who the call is with (name, number or email, or a node such as a call switcher), with an avatar. Omit both. */
  customerLabel?: React.ReactNode;
  /** Initials in the avatar; omit for an unmatched caller (generic person icon). */
  customerInitials?: string;

  /* ── Layout ── */
  /** "bar" (default): the full-width call bar, which collapses its labels, then into a "…" menu, as it narrows.
   *  "rail": the stacked card for a narrow column (240px minimum): avatar header, a grid of icon-only controls,
   *  then Mute, Video and End Call. */
  layout?: "bar" | "rail";
  /** @deprecated Use `layout="rail"`. The app forks' name for the controls stacked at the top of the left nav. */
  stacked?: boolean;
  /** @deprecated No effect; kept so existing call sites compile. */
  stretch?: boolean;
  /** Toast surface, used only by the decorative (uncontrolled) video toggle. */
  onAddToast?: (toast: Omit<ToastItem, "id">) => void;
  className?: string;
}

export function VoiceCallControls({
  onHangUp,
  elapsedSeconds,
  onHoldElapsedSeconds,
  callStartTick,
  holdStartTick,
  renderClock,
  onHold: onHoldControlled,
  onHoldChange,
  muted: mutedControlled,
  onMuteChange,
  recording: recordingControlled,
  onRecordingChange,
  masked: maskedControlled,
  onMaskedChange,
  onSendDtmf,
  onToggleTranscript,
  transcriptOpen,
  transcriptNeedsConfirm,
  onConfirmViewTranscript,
  transcriptMenu,
  onToggleVideo,
  videoOpen,
  showHold = true,
  showMute = true,
  showRecord = true,
  showMask = true,
  showKeypad = true,
  showAddVideo = true,
  customerLabel,
  customerInitials,
  layout = "bar",
  stacked = false,
  onAddToast,
  className,
}: VoiceCallControlsProps) {
  const rail = layout === "rail" || stacked;

  /* ── State: controlled once the handler is passed, else local ── */
  const [localOnHold, setLocalOnHold] = useState(false);
  const onHold = onHoldChange ? !!onHoldControlled : localOnHold;
  const setOnHold = onHoldChange ?? setLocalOnHold;
  const [localMuted, setLocalMuted] = useState(false);
  const muted = onMuteChange ? !!mutedControlled : localMuted;
  const setMuted = onMuteChange ?? setLocalMuted;
  const [localMasked, setLocalMasked] = useState(false);
  const masked = onMaskedChange ? !!maskedControlled : localMasked;
  const setMasked = onMaskedChange ?? setLocalMasked;
  const [localRecording, setLocalRecording] = useState(false);
  const recording = onRecordingChange ? !!recordingControlled : localRecording;
  const setRecording = onRecordingChange ?? setLocalRecording;
  const [localVideoAdded, setLocalVideoAdded] = useState(false);
  const videoAdded = onToggleVideo ? !!videoOpen : localVideoAdded;
  const [keypadOpen, setKeypadOpen] = useState(false);
  /** The transcript menu or "View Transcript?" popover. */
  const [transcriptPopoverOpen, setTranscriptPopoverOpen] = useState(false);
  const [volume, setVolume] = useState(70);

  /* ── Hang up: 1s "Hanging Up..." with every control disabled, then a 300ms collapse, then `onHangUp`. ── */
  const HANG_UP_HOLD_MS = 1000;
  const HANG_UP_EXIT_MS = 300;
  const [isEnding, setIsEnding] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const hangUpTimeoutsRef = useRef<number[]>([]);
  useEffect(() => {
    return () => {
      hangUpTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);
  const barRef = useRef<HTMLDivElement>(null);
  const [collapseHeight, setCollapseHeight] = useState<number | null>(null);
  useEffect(() => {
    if (!isExiting) return;
    const el = barRef.current;
    if (!el) return;
    setCollapseHeight(el.getBoundingClientRect().height);
    const raf = requestAnimationFrame(() => setCollapseHeight(0));
    return () => cancelAnimationFrame(raf);
  }, [isExiting]);
  const handleHangUp = () => {
    if (isEnding) return;
    setIsEnding(true);
    setKeypadOpen(false);
    setTranscriptPopoverOpen(false);
    hangUpTimeoutsRef.current.push(
      window.setTimeout(() => {
        setIsExiting(true);
        hangUpTimeoutsRef.current.push(window.setTimeout(() => onHangUp(), HANG_UP_EXIT_MS));
      }, HANG_UP_HOLD_MS)
    );
  };

  /* ── Bar breakpoints (measured on the card; the rail never changes): under 991px the middle controls go
     icon-only, under 768px Mute / Video / End Call too, under 600px Mask / Record / Keypad / Transcript fold
     into a "…" menu. ── */
  const CONTROLS_COMPACT_BREAKPOINT = 991;
  const CONTROLS_ICON_ONLY_BREAKPOINT = 768;
  const CONTROLS_MENU_BREAKPOINT = 600;
  const cardRef = useRef<HTMLDivElement>(null);
  const [controlsCompact, setControlsCompact] = useState(false);
  const [controlsIconOnly, setControlsIconOnly] = useState(false);
  const [controlsMenu, setControlsMenu] = useState(false);
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setControlsCompact(width < CONTROLS_COMPACT_BREAKPOINT);
      setControlsIconOnly(width < CONTROLS_ICON_ONLY_BREAKPOINT);
      setControlsMenu(width < CONTROLS_MENU_BREAKPOINT);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [rail]);

  /* ── Actions ── */
  const recordDisabled = masked || isEnding;
  const toggleHold = () => setOnHold(!onHold);
  const toggleMute = () => setMuted(!muted);
  const toggleMask = () => {
    const next = !masked;
    setMasked(next);
    // Masking and recording can't run together.
    if (next && recording) setRecording(false);
  };
  const toggleRecord = () => {
    if (recordDisabled) return;
    setRecording(!recording);
  };
  const toggleVideo = () => {
    if (onToggleVideo) {
      onToggleVideo();
      return;
    }
    const next = !localVideoAdded;
    setLocalVideoAdded(next);
    onAddToast?.({ variant: "info", title: next ? "Video added to call" : "Video removed from call" });
  };
  const blockKeysWhileRecordDisabled = (e: React.KeyboardEvent) => {
    if (recordDisabled && (e.key === "Enter" || e.key === " ")) e.preventDefault();
  };

  /* ── Timers ── `renderClock` + start ticks, else plain seconds. */
  const liveTimer = (startTick: number | undefined, seconds: number | undefined, render: (s: number) => React.ReactNode) => {
    if (startTick !== undefined && renderClock) return renderClock((now) => render(now - startTick));
    if (seconds !== undefined) return render(seconds);
    return null;
  };
  const textSize = rail ? "lyra-body-md" : "lyra-body-sm";
  const callTimer = liveTimer(callStartTick, elapsedSeconds, (s) => (
    <span className={cn("flex items-center gap-1 text-lyra-fg-secondary", textSize)} aria-label={`Call duration ${formatElapsedTime(s)}`}>
      {recording ? (
        <Circle
          className="h-4 w-4 shrink-0 animate-pulse fill-lyra-status-critical-strong text-lyra-status-critical-strong"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      ) : (
        <Clock className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
      )}
      {/* Fixed digit width in the bar so the controls beside it don't shift as the seconds change. */}
      <span className={cn("tabular-nums", !rail && "w-[34px] shrink-0 text-right")}>{formatElapsedTime(s)}</span>
    </span>
  ));
  const holdBadge = onHold
    ? liveTimer(holdStartTick, onHoldElapsedSeconds, (s) => (
        <Badge
          shape="pill"
          color={getHoldSeverity(s)}
          variant="subtle"
          fontSize={12}
          icon={<Pause strokeWidth={2} />}
          className="self-start"
          aria-label={`On hold ${formatElapsedTime(s)}`}
        >
          On hold {formatElapsedTime(s)}
        </Badge>
      ))
    : null;

  /* ── Transcript ── menu > confirm > toggle > unavailable (disabled, still shown). */
  const transcriptMode = transcriptMenu ? "menu" : transcriptNeedsConfirm ? "confirm" : onToggleTranscript ? "toggle" : "none";
  const transcriptActive = transcriptMode === "menu" ? transcriptPopoverOpen : !!transcriptOpen || (transcriptMode === "confirm" && transcriptPopoverOpen);
  const renderTranscript = (size: "wide" | "compact" | "rail") => {
    const icon = <FileText className="h-5 w-5" strokeWidth={1.5} />;
    const unavailable = transcriptMode === "none";
    const extra: React.ButtonHTMLAttributes<HTMLButtonElement> = unavailable
      ? // aria-disabled (not disabled, same as Record) so the tooltip can still say why.
        { "aria-disabled": true, className: "opacity-40" }
      : transcriptMode === "toggle"
        ? { onClick: onToggleTranscript }
        : {};
    const button =
      size === "wide" ? (
        <WideCallControlButton icon={icon} label="Transcript" active={transcriptActive} disabled={isEnding} {...extra} />
      ) : (
        <CompactCallControlButton icon={icon} aria-label="Transcript" active={transcriptActive} disabled={isEnding} {...extra} />
      );
    const popoverProps = {
      open: transcriptPopoverOpen && !isEnding,
      onOpenChange: (next: boolean) => {
        if (!isEnding) setTranscriptPopoverOpen(next);
      },
      placement: (rail ? "right" : "top") as "right" | "top",
    };
    if (transcriptMode === "menu") {
      return (
        <Popover {...popoverProps} bodyPadding={false} content={<Menu items={transcriptMenu!} bare />}>
          {button}
        </Popover>
      );
    }
    if (transcriptMode === "confirm") {
      return (
        <Popover
          {...popoverProps}
          className="w-72"
          {...buildTranscriptConfirmPopoverSlots(
            () => {
              setTranscriptPopoverOpen(false);
              onConfirmViewTranscript?.();
            },
            () => setTranscriptPopoverOpen(false)
          )}
        >
          {button}
        </Popover>
      );
    }
    if (unavailable) {
      return (
        <Tooltip content="Transcript not available" placement="top">
          {button}
        </Tooltip>
      );
    }
    return size === "wide" ? button : <Tooltip content="Transcript" placement="top">{button}</Tooltip>;
  };

  /* ── Narrow bar overflow ("…") menu: Mask, Record, Keypad, Transcript. ── */
  const overflowMenuItems: MenuEntry[] = [
    ...(showMask
      ? [
          {
            id: "mask",
            label: "Mask",
            icon: masked ? <AudioLinesOff className="h-4 w-4" strokeWidth={1.5} /> : <AudioLines className="h-4 w-4" strokeWidth={1.5} />,
            active: masked,
            disabled: isEnding,
            onClick: toggleMask,
          } satisfies MenuEntry,
        ]
      : []),
    ...(showRecord
      ? [
          {
            id: "record",
            label: recording ? "Stop" : "Record",
            icon: (
              <Circle
                className={cn("h-4 w-4", recording && "fill-lyra-status-critical-strong text-lyra-status-critical-strong")}
                strokeWidth={1.5}
              />
            ),
            active: recording,
            disabled: recordDisabled,
            onClick: toggleRecord,
          } satisfies MenuEntry,
        ]
      : []),
    ...(showKeypad
      ? [
          {
            id: "keypad",
            label: "Keypad",
            icon: <Grid3x3 className="h-4 w-4" strokeWidth={1.5} />,
            active: keypadOpen,
            disabled: isEnding,
            submenuContent: <DialPad onDigit={onSendDtmf} />,
          } satisfies MenuEntry,
        ]
      : []),
    transcriptMode === "menu"
      ? ({
          id: "transcript",
          label: "Transcript",
          icon: <FileText className="h-4 w-4" strokeWidth={1.5} />,
          disabled: isEnding,
          submenu: transcriptMenu,
        } satisfies MenuEntry)
      : ({
          id: "transcript",
          label: "Transcript",
          icon: <FileText className="h-4 w-4" strokeWidth={1.5} />,
          active: transcriptOpen,
          // In a menu the click is already deliberate, so a confirm-first transcript navigates straight away.
          disabled: isEnding || transcriptMode === "none",
          onClick: transcriptMode === "confirm" ? onConfirmViewTranscript : onToggleTranscript,
        } satisfies MenuEntry),
  ];

  /* ── Shared pieces ── */
  const holdIcon = (cls: string) => (onHold ? <Play className={cls} strokeWidth={1.5} /> : <Pause className={cls} strokeWidth={1.5} />);
  const holdActiveClass = onHold
    ? "text-lyra-status-warning-strong bg-lyra-status-warning-subtle hover:text-lyra-status-warning-strong"
    : undefined;
  const maskIcon = (cls: string) =>
    masked ? <AudioLinesOff className={cls} strokeWidth={1.5} /> : <AudioLines className={cls} strokeWidth={1.5} />;
  const recordIcon = (cls: string) => (
    <Circle className={cn(cls, recording && "fill-lyra-status-critical-strong text-lyra-status-critical-strong")} strokeWidth={1.5} />
  );
  const recordTooltip = masked ? "Recording disabled while masking is on" : recording ? "Stop" : "Record";
  const keypadPopover = (trigger: React.ReactElement) => (
    <Popover
      open={keypadOpen && !isEnding}
      onOpenChange={(next: boolean) => {
        if (!isEnding) setKeypadOpen(next);
      }}
      placement={rail ? "right" : "top"}
      bodyPadding={false}
      content={<DialPad onDigit={onSendDtmf} />}
    >
      {trigger}
    </Popover>
  );
  const videoIcon = (cls: string) => (videoAdded ? <Video className={cls} strokeWidth={1.5} /> : <VideoOff className={cls} strokeWidth={1.5} />);
  const endCallContent = (
    <>
      {isEnding ? (
        <Spinner variant="circle" size="sm" color="inverse" label="Hanging up" />
      ) : (
        <PhoneOff className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
      )}
      {isEnding ? "Hanging Up..." : "End Call"}
    </>
  );
  const outerClass = cn(
    "w-full shrink-0 transition-all duration-300 ease-in-out",
    isExiting && "pointer-events-none translate-y-4 opacity-0",
    collapseHeight !== null && "overflow-hidden"
  );
  const outerStyle = collapseHeight !== null ? { height: collapseHeight } : undefined;

  /* ── Left rail: a stacked card, at least 240px wide. ── */
  if (rail) {
    // Each grid cell is a third of the row and centers its button.
    const cell = "flex w-1/3 justify-center";
    // Bottom buttons: tight side padding so two labeled buttons fit side by side at 240px.
    const rowButton = "min-w-0 gap-1 px-2";
    return (
      <div ref={barRef} style={outerStyle} className={cn(outerClass, "min-w-[240px]", className)}>
        <div
          role="group"
          aria-label="Call controls"
          className="flex w-full flex-col gap-4 rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-container-subtle p-4"
        >
          {/* Header: who the call is with, how long it has run, and the hold badge while on hold. */}
          <div className="flex min-w-0 items-center gap-3">
            {customerLabel && <Avatar size="lg" color="primary" initials={customerInitials} />}
            <div className="flex min-w-0 flex-col gap-0.5">
              {customerLabel && <span className="truncate lyra-body-md text-lyra-fg-default">{customerLabel}</span>}
              {callTimer}
              {holdBadge}
            </div>
          </div>

          {/* Icon-only controls on a white panel; each is named by its Tooltip and aria-label. 20px icons in 40px
              buttons, the same size as Volume and the bar's icon-only controls. */}
          <div className="flex flex-wrap gap-y-1 rounded-lyra-md bg-lyra-bg-surface-base px-2 py-2">
            {showHold && (
              <div className={cell}>
                <Tooltip content={onHold ? "Resume" : "Hold"} placement="top">
                  <CompactCallControlButton
                    icon={holdIcon("h-5 w-5")}
                    active={onHold}
                    aria-label={onHold ? "Resume" : "Hold"}
                    className={holdActiveClass}
                    onClick={toggleHold}
                    disabled={isEnding}
                  />
                </Tooltip>
              </div>
            )}
            {showMask && (
              <div className={cell}>
                <Tooltip content="Mask" placement="top">
                  <CompactCallControlButton icon={maskIcon("h-5 w-5")} active={masked} aria-label="Mask" onClick={toggleMask} disabled={isEnding} />
                </Tooltip>
              </div>
            )}
            {showRecord && (
              <div className={cell}>
                {/* aria-disabled (not disabled) while masked, so the "why" tooltip stays reachable. */}
                <Tooltip content={recordTooltip} placement="top">
                  <CompactCallControlButton
                    icon={recordIcon("h-5 w-5")}
                    active={recording}
                    aria-label={recording ? "Stop" : "Record"}
                    aria-disabled={recordDisabled}
                    className={recordDisabled ? "opacity-40" : undefined}
                    onClick={toggleRecord}
                    onKeyDown={blockKeysWhileRecordDisabled}
                  />
                </Tooltip>
              </div>
            )}
            {showKeypad && (
              <div className={cell}>
                {keypadPopover(
                  <CompactCallControlButton
                    icon={<Grid3x3 className="h-5 w-5" strokeWidth={1.5} />}
                    active={keypadOpen}
                    aria-label="Keypad"
                    title="Keypad"
                    disabled={isEnding}
                  />
                )}
              </div>
            )}
            <div className={cell}>{renderTranscript("rail")}</div>
            <div className={cell}>
              <CompactVolumeButton volume={volume} onVolumeChange={setVolume} disabled={isEnding} compact placement="right" />
            </div>
          </div>

          {/* Mute and End Call side by side. With Video, Mute and Video share the row and End Call takes the full
              width below: three labeled buttons don't fit 240px on one line. */}
          <div className="grid grid-cols-2 gap-1.5">
            {showMute && (
              <Button
                variant="outline"
                size="lg"
                aria-pressed={muted}
                className={cn(rowButton, muted && "border-lyra-border-active bg-lyra-bg-active-subtle text-lyra-fg-active-strong")}
                onClick={toggleMute}
                disabled={isEnding}
              >
                {muted ? <MicOff className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" /> : <Mic className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />}
                {muted ? "Unmute" : "Mute"}
              </Button>
            )}
            {showAddVideo && (
              <Button
                variant="outline"
                size="lg"
                aria-pressed={videoAdded}
                className={cn(rowButton, videoAdded && "border-lyra-border-active bg-lyra-bg-active-subtle text-lyra-fg-active-strong")}
                onClick={toggleVideo}
                disabled={isEnding}
              >
                {videoIcon("h-5 w-5")}
                Video
              </Button>
            )}
            <Button
              variant="destructive"
              size="lg"
              // Full width when it would otherwise sit alone in a row or under Mute + Video.
              className={cn(rowButton, showAddVideo === showMute && "col-span-2")}
              onClick={handleHangUp}
              disabled={isEnding}
            >
              {endCallContent}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Bar ── three columns: identity + timers | middle controls | Mute, Add video, End Call. The outer columns
     are equal (`1fr auto 1fr`) so the middle cluster stays centered however long the customer label is. */
  return (
    <div ref={barRef} style={outerStyle} className={cn(outerClass, "bg-lyra-bg-surface-base px-6 py-3", className)}>
      <div
        ref={cardRef}
        role="group"
        aria-label="Call controls"
        className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg border border-lyra-border-subtle bg-lyra-bg-surface-container-subtle px-3 py-2"
      >
        <div className="flex min-w-0 items-center gap-2">
          {customerLabel && <Avatar initials={customerInitials} color="primary" size="md" />}
          <div className="flex min-w-0 flex-col justify-center">
            {customerLabel && <span className="truncate lyra-body-sm text-lyra-fg-primary">{customerLabel}</span>}
            {callTimer}
            {holdBadge}
          </div>
        </div>

        <div className="flex min-w-0 items-stretch justify-center gap-1">
          <span aria-hidden="true" className="h-4 w-px shrink-0 self-center bg-lyra-border-subtle" />
          {showHold &&
            (controlsCompact ? (
              <Tooltip content={onHold ? "Resume" : "Hold"} placement="top">
                <CompactCallControlButton
                  icon={holdIcon("h-5 w-5")}
                  active={onHold}
                  aria-label={onHold ? "Resume" : "Hold"}
                  className={holdActiveClass}
                  onClick={toggleHold}
                  disabled={isEnding}
                />
              </Tooltip>
            ) : (
              <WideCallControlButton
                icon={holdIcon("h-5 w-5")}
                label={onHold ? "Resume" : "Hold"}
                active={onHold}
                className={holdActiveClass}
                onClick={toggleHold}
                disabled={isEnding}
              />
            ))}
          {controlsMenu ? (
            overflowMenuItems.length > 0 && (
              <KebabMenuButton
                items={overflowMenuItems}
                ariaLabel="More call controls"
                icon={<MoreHorizontal className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />}
                className="h-10 w-10 rounded-lyra-sm text-lyra-fg-secondary hover:text-lyra-fg-default"
                disabled={isEnding}
              />
            )
          ) : (
            <>
              {showMask &&
                (controlsCompact ? (
                  <Tooltip content="Mask" placement="top">
                    <CompactCallControlButton icon={maskIcon("h-5 w-5")} active={masked} aria-label="Mask" onClick={toggleMask} disabled={isEnding} />
                  </Tooltip>
                ) : (
                  <WideCallControlButton icon={maskIcon("h-5 w-5")} label="Mask" active={masked} onClick={toggleMask} disabled={isEnding} />
                ))}
              {showRecord && (
                // The tooltip shows when masked (why Record is off) or when icon-only (its name).
                <Tooltip content={recordTooltip} placement="top" disabled={!masked && !controlsCompact}>
                  {controlsCompact ? (
                    <CompactCallControlButton
                      icon={recordIcon("h-5 w-5")}
                      active={recording}
                      aria-label={recording ? "Stop" : "Record"}
                      aria-disabled={recordDisabled}
                      className={recordDisabled ? "opacity-40" : undefined}
                      onClick={toggleRecord}
                      onKeyDown={blockKeysWhileRecordDisabled}
                    />
                  ) : (
                    <WideCallControlButton
                      icon={recordIcon("h-5 w-5")}
                      label={recording ? "Stop" : "Record"}
                      active={recording}
                      aria-disabled={recordDisabled}
                      className={recordDisabled ? "opacity-40" : undefined}
                      onClick={toggleRecord}
                      onKeyDown={blockKeysWhileRecordDisabled}
                    />
                  )}
                </Tooltip>
              )}
              {showKeypad &&
                keypadPopover(
                  controlsCompact ? (
                    <CompactCallControlButton
                      icon={<Grid3x3 className="h-5 w-5" strokeWidth={1.5} />}
                      active={keypadOpen}
                      aria-label="Keypad"
                      title="Keypad"
                      disabled={isEnding}
                    />
                  ) : (
                    <WideCallControlButton
                      icon={<Grid3x3 className="h-5 w-5" strokeWidth={1.5} />}
                      label="Keypad"
                      active={keypadOpen}
                      aria-label="Keypad"
                      disabled={isEnding}
                    />
                  )
                )}
              {renderTranscript(controlsCompact ? "compact" : "wide")}
            </>
          )}
          <CompactVolumeButton volume={volume} onVolumeChange={setVolume} disabled={isEnding} compact={controlsCompact} />
          <span aria-hidden="true" className="h-4 w-px shrink-0 self-center bg-lyra-border-subtle" />
        </div>

        {/* Mute and Add video are outlined ("strong") to stand apart from the middle cluster; End Call stretches to
            their height. */}
        <div className="flex min-w-0 items-stretch justify-end gap-2">
          {showMute &&
            (controlsIconOnly ? (
              <Tooltip content={muted ? "Unmute" : "Mute"} placement="top">
                <CompactCallControlButton
                  icon={muted ? <MicOff className="h-5 w-5" strokeWidth={1.5} /> : <Mic className="h-5 w-5" strokeWidth={1.5} />}
                  active={muted}
                  strong
                  variant="outline"
                  aria-label={muted ? "Unmute" : "Mute"}
                  onClick={toggleMute}
                  disabled={isEnding}
                />
              </Tooltip>
            ) : (
              <WideCallControlButton
                icon={muted ? <MicOff className="h-5 w-5" strokeWidth={1.5} /> : <Mic className="h-5 w-5" strokeWidth={1.5} />}
                label={muted ? "Unmute" : "Mute"}
                active={muted}
                strong
                variant="outline"
                onClick={toggleMute}
                disabled={isEnding}
              />
            ))}
          {showAddVideo &&
            (controlsIconOnly ? (
              <Tooltip content={videoAdded ? "Remove video" : "Add video"} placement="top">
                <CompactCallControlButton
                  icon={videoIcon("h-5 w-5")}
                  active={videoAdded}
                  strong
                  variant="outline"
                  aria-label={videoAdded ? "Remove video" : "Add video"}
                  onClick={toggleVideo}
                  disabled={isEnding}
                />
              </Tooltip>
            ) : (
              <WideCallControlButton
                icon={videoIcon("h-5 w-5")}
                label={videoAdded ? "Remove video" : "Add video"}
                active={videoAdded}
                strong
                variant="outline"
                onClick={toggleVideo}
                disabled={isEnding}
              />
            ))}
          {controlsIconOnly ? (
            <Tooltip content={isEnding ? "Hanging Up..." : "End Call"} placement="top">
              <Button
                variant="destructive"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={handleHangUp}
                disabled={isEnding}
                aria-label={isEnding ? "Hanging Up..." : "End Call"}
              >
                {isEnding ? (
                  <Spinner variant="circle" size="sm" color="inverse" label="Hanging up" />
                ) : (
                  <PhoneOff className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                )}
              </Button>
            </Tooltip>
          ) : (
            <Button variant="destructive" size="lg" className="h-auto shrink-0 gap-1.5" onClick={handleHangUp} disabled={isEnding}>
              {endCallContent}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
