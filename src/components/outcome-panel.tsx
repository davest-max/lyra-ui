/**
 * OutcomePanel — the "Log Outcome" form (Resolution, Tags, Disposition code,
 * a free-text Summary, ending in Cancel/"Save & Close").
 *
 * This used to live only inline inside `channel-row.tsx`, split across a
 * `ChannelOutcomeConfig` interface, a `useOutcomePopoverState` hook, and a
 * `buildOutcomePopoverSlots` function that both `ChannelRow`'s standalone
 * Outcome button and `ChannelTab`'s kebab-triggered version called to get
 * matching `header`/`footer`/`content` for their own `<Popover>`. That
 * lower-level trio is relocated here verbatim (still exported, still used
 * by both of those exact call sites via `channel-row.tsx`'s own re-export,
 * so their behavior is unchanged) and packaged with one more thing: an
 * actual `<OutcomePanel>` component, so a consumer that wants this exact
 * form OUTSIDE of `ChannelRow`/`ChannelTab` (a standalone header button not
 * tied to any channel row, say) can drop it in directly from just a
 * `ChannelOutcomeConfig`, instead of hand-assembling a `<Popover>` from the
 * three slots itself.
 */
import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";
import { Popover } from "./popover";
import { ContainerHeader } from "./container-header";
import { Button } from "./button";
import { Menu } from "./menu";
import { Select } from "./select";
import { DispositionSelect, type DispositionOption } from "./disposition-select";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { Tag } from "./tag";
import { type TagPickerOption } from "./tag-picker";
import { WarningIconSolid } from "./icons/warning-icon-solid";

/* ── Outcome popover ──
   Clicking the "Outcome" ghost button opens a popover logging how this
   channel was resolved — Resolution, Tags, Disposition code, and a free-text
   Summary, matching the reference screenshot exactly (a form ending in
   Cancel/"Approve & Save"). All FIELD DATA (option lists, current values,
   change handlers) is supplied by the consumer via this one config object
   rather than hardcoded here — Resolution/Disposition-code choices and the
   tag palette are business data, not something a generic design-system row
   component should own, same reasoning `TagPicker` (tag-picker.tsx) already
   established for its own `options`/`onSelect` props. `ChannelRow` itself
   only owns the POPOVER STRUCTURE (which lyra-ui primitives compose it,
   how the fields lay out) — completely optional: omit `outcome` entirely
   and the Outcome button renders exactly as before (a plain, unwired ghost
   button), so no existing caller/story needs to change. */
export interface ChannelOutcomeConfig {
  /** Controlled open state for this row's Outcome popover. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Popover header title (default: "Log Outcome"). */
  title?: string;
  /** Same `{label, dotColor}` shape (and, when this and the session-status
   *  dropdown share one status vocabulary the way `AgentNextGenPage` wires
   *  them, the literal SAME array) `TRANSCRIPT_SESSION_STATUS_OPTIONS` uses
   *  for the session-status pill's own dropdown — reused here (not
   *  redefined) so this field can render the exact same colored-dot rows,
   *  not just visually similar ones. */
  resolutionOptions: { label: string; dotColor: string }[];
  resolution: string;
  onResolutionChange: (value: string) => void;
  /** Marks this channel as voice — voice interactions have no real Open/
   *  Pending/Resolved/Closed disposition to log, so `voice: true` hides
   *  the Status field entirely. Everything else in the popover (Tags/
   *  Disposition/Summary/Cancel/Save) is unaffected. */
  voice?: boolean;
  /** Every tag that could be applied — same `{label, variant}` shape
   *  `TagPicker`'s own `options` already uses, reused here (not
   *  redefined) so one shared tag palette works for both surfaces. */
  tagOptions: TagPickerOption[];
  /** Currently-applied tag labels — rendered as removable `Tag` pills
   *  above the multi-select dropdown, and as that dropdown's own checked
   *  rows. */
  selectedTags: string[];
  onTagsChange: (labels: string[]) => void;
  /** Per explicit request, grouped into named sections (`category`) with a
   *  favoritable star per row — see `DispositionSelect`'s own doc comment
   *  (disposition-select.tsx) for why this is no longer a flat `Select`. */
  dispositionOptions: DispositionOption[];
  dispositionCode: string;
  onDispositionChange: (value: string) => void;
  summary: string;
  onSummaryChange: (value: string) => void;
  /** "Save & Close" clicked. */
  onSave: () => void;
  /** "Cancel" clicked. */
  onCancel: () => void;
  /** True once this channel's call has ended (voice only) — per explicit
   *  request, swaps the footer from "Cancel"/"Save & Close" to
   *  "Save & Redial"/"Save & Dismiss" instead, since ending a call folds
   *  "wrap this call up" entirely into this popover rather than leaving it
   *  split across a separate standalone dismiss icon. Unset/false leaves
   *  the footer exactly as today — every existing caller/story is
   *  unaffected. */
  callEnded?: boolean;
  /** "Save & Redial" clicked — only rendered while `callEnded` is true.
   *  Called with the Outcome trigger's own DOM node (see
   *  `buildOutcomePopoverSlots`'s `triggerRef` param) so the consumer can
   *  anchor the resulting dial-pad popover right where this Outcome
   *  popover itself was opened from, the same way Contact History's own
   *  Redial button anchors its popover on itself — this Outcome popover's
   *  OWN footer button isn't a safe anchor on its own, since it unmounts
   *  the instant this popover closes. The second argument is that Save &amp; Redial button itself, for a footer that
   *  stays mounted (the inline wrap-up card, which has no popover to close), so the consumer can anchor on the button
   *  that was clicked. */
  onSaveAndRedial?: (anchorEl: HTMLElement | null, button: HTMLElement) => void;
  /** Whether the `callEnded` footer shows "Save & Redial" (default: true).
   *  False leaves only "Save & Dismiss", e.g. for a channel that can't be
   *  redialed. */
  showSaveAndRedial?: boolean;
  /** "Save & Dismiss" clicked — only rendered while `callEnded` is true. */
  onSaveAndDismiss?: () => void;
}

/** Local state the Outcome popover's own nested Resolution dropdown needs
 *  (which body it's showing — the status list, or the "Close Contact?"
 *  confirm). Factored into its own hook so each of the two places that can
 *  render this popover (`ChannelRow`'s standalone button below, and
 *  `ChannelTab`'s kebab-triggered version further down) calls it itself
 *  rather than threading it through as props — each has its own
 *  independent popover instance, so this state must never be shared
 *  between them. The RESOLUTION VALUE itself is NOT here — it's fully
 *  lifted through `ChannelOutcomeConfig.resolution`/`onResolutionChange`,
 *  same as before; only "is the dropdown showing, and which body" is
 *  local. */
export function useOutcomePopoverState() {
  const [resolutionMenuOpen, setResolutionMenuOpen] = React.useState(false);
  const [resolutionMenuView, setResolutionMenuView] = React.useState<"menu" | "confirm">("menu");
  return { resolutionMenuOpen, setResolutionMenuOpen, resolutionMenuView, setResolutionMenuView };
}

// Same helper as `stopSyntheticBubble` in popover.tsx (not exported from
// there, so re-declared locally here rather than reaching into that
// module's internals) — see `buildOutcomePopoverSlots`'s own doc comment
// just below for why THIS popover's content specifically needs its clicks
// stopped, which is a different bug from the pointermove/focus one that
// helper was originally written for.
const stopSyntheticBubble = (e: React.SyntheticEvent) => e.stopPropagation();

/** Builds the Outcome popover's `header`/`footer`/`content` — the actual
 *  Resolution/Tags/Disposition/Summary form (see `ChannelOutcomeConfig`'s
 *  own doc comment above) — shared verbatim between `ChannelRow`'s
 *  standalone Outcome button and `ChannelTab`'s kebab-triggered version, so
 *  the two can't drift into two different forms for logging the same
 *  thing. Each caller still owns its OWN wrapping `<Popover>`
 *  (placement/trigger/exact z-index differ — `ChannelRow` anchors a small
 *  icon button with `align="end"`, `ChannelTab` anchors the whole tab). */
export function buildOutcomePopoverSlots(
  outcome: ChannelOutcomeConfig,
  { resolutionMenuOpen, setResolutionMenuOpen, resolutionMenuView, setResolutionMenuView }: ReturnType<typeof useOutcomePopoverState>,
  // The Outcome trigger's own DOM node — a STABLE anchor that stays
  // mounted across this popover opening/closing (unlike this footer's own
  // "Save & Redial" button, or anything else inside this popover's own
  // content). Each caller supplies a ref to ITS OWN trigger element (see
  // each call site's own doc comment) — optional so an existing caller
  // that hasn't wired one through yet still renders (falls back to
  // `null`, same as omitting `onSaveAndRedial` entirely elsewhere).
  triggerRef?: React.RefObject<HTMLElement | null>
): { header: React.ReactNode; footer: React.ReactNode; content: React.ReactNode } {
  return {
    // `onClick={stopSyntheticBubble}` on all three slots below — per
    // explicit bug report ("if the outcome is updated in an on hold call
    // (non-active interaction) do not switch to that interaction after
    // updating the status - stay on the current interaction"). This
    // popover's `header`/`footer`/`content` are logically nested (in the
    // React tree) inside this specific channel row's own outer element,
    // which is itself nested inside the WHOLE CARD's own `onClick`
    // (`InteractionNavCard`'s `onClick` prop, AgentNextGenPage.tsx/
    // AgentWorkspace2WithDeskPage.tsx — switches `activeInteractionId`).
    // `Popover.Content` renders through a Radix Portal (mounted at
    // `document.body`, nowhere near the card in the actual DOM), but per
    // React's own docs a portal's content still bubbles synthetic events
    // to its LOGICAL React ancestors regardless of where it's mounted in
    // the DOM — see `stopSyntheticBubble`'s own doc comment (popover.tsx)
    // for the exact same "React tree, not DOM tree" mechanism, already
    // relied on there for a different bug (pointermove/focus reaching an
    // outer Tooltip). That existing guard only stops pointermove/leave/
    // focus/blur, deliberately not click — so every click inside this
    // popover (Approve & Save, Cancel, a Resolution/Tags/Disposition pick,
    // even the nested "Closed" confirm) was bubbling all the way up to the
    // card's own `onClick` and silently switching the agent onto whatever
    // OTHER interaction's on-hold call they'd just logged an outcome for,
    // the instant they clicked anything in here. Stopped at all three
    // slots (not just `footer`'s Save/Cancel) since Resolution/Tags/
    // Disposition selections above `onSave` firing all trigger the exact
    // same unwanted switch on their own. This is the "Log Outcome"
    // popover's own click behavior, not a change to the shared `Popover`
    // primitive itself — every other `Popover` consumer is unaffected.
    header: (
      <div onClick={stopSyntheticBubble}>
        <ContainerHeader
          title={outcome.title ?? "Log Outcome"}
          bordered={false}
          className="px-5 pb-0"
          onClose={() => outcome.onOpenChange(false)}
        />
      </div>
    ),
    footer: (
      <div className="flex items-center justify-end gap-2 px-5 pb-4 pt-1" onClick={stopSyntheticBubble}>
        {outcome.callEnded ? (
          <>
            {/* Per explicit request: once a call has ended, the agent
                can't redial or dismiss the contact without first logging
                a real disposition — same "never pre-populated, agent must
                actually pick one" requirement the Disposition field's own
                `error` state (above) already enforces visually; this is
                the same rule enforced as an action gate on both buttons.
                `showSaveAndRedial={false}` omits Save & Redial. */}
            {outcome.showSaveAndRedial !== false && (
              <Button
                variant="outline"
                size="md"
                onClick={(e) => outcome.onSaveAndRedial?.(triggerRef?.current ?? null, e.currentTarget)}
                disabled={!outcome.dispositionCode}
              >
                Save &amp; Redial
              </Button>
            )}
            <Button variant="default" size="md" onClick={outcome.onSaveAndDismiss} disabled={!outcome.dispositionCode}>
              Save &amp; Dismiss
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="md" onClick={outcome.onCancel}>
              Cancel
            </Button>
            <Button variant="default" size="md" onClick={outcome.onSave}>
              Save &amp; Close
            </Button>
          </>
        )}
      </div>
    ),
    content: (
      <div className="flex flex-col gap-4 pb-2 pt-1" onClick={stopSyntheticBubble}>
        {!outcome.voice && (
        <div>
          <Label label="Status" className="mb-1.5" />
          {/* Same colored-dot `Menu` the session-status pill's own dropdown
              uses (`TranscriptSessionSeparator`, `AgentNextGenPage.tsx`) —
              reused here, not just visually matched, so a consumer wiring
              both `outcome.resolutionOptions`/`resolution` and the
              session-status pill to the same underlying status state (as
              `AgentNextGenPage` does) gets a single "is this session Open/
              Pending/Escalated/Resolved/Closed" value that's reflected —
              and changeable — from either surface. This field only owns
              the field-look TRIGGER (bordered box + chevron, matching
              every other field in this popover); the dropdown content
              itself is a plain `Menu`, not `Select`, since `Select`'s own
              single-select mode has no way to render a leading colored dot
              per row. */}
          <Popover
            open={resolutionMenuOpen}
            onOpenChange={(open) => {
              setResolutionMenuOpen(open);
              // Always land back on the status list next time this opens,
              // never stranded on a stale confirm view from a previous
              // visit — same reset `handleStatusMenuOpenChange` performs
              // for the session-status popover.
              setResolutionMenuView("menu");
            }}
            placement="bottom"
            align="start"
            // `z-[10001]` — one tier above this popover's own, now-
            // `z-[9999]`, parent (see that Popover's own doc comment at
            // each call site) — "Select dropdown nested inside a popover
            // nested inside another popover" per CONTRIBUTING.md §4,
            // reused here even though this particular nested overlay is a
            // `Popover` (not a `Select`) since the table's tiers are about
            // nesting *depth*, not component identity.
            className="z-[10001] w-[var(--radix-popover-trigger-width)]"
            // `bodyPadding` defaults to `true` (`popover.tsx`'s own `px-5`
            // inset for plain body content) — a `bare` `Menu` already
            // supplies its own full-bleed row padding (`p-1` per row), so
            // leaving the default on here stacks BOTH insets, reading as
            // oversized gaps around/between rows. Only true for the "menu"
            // view though — the "confirm" view's plain description
            // paragraph DOES want the normal inset, same
            // `bodyPadding={statusMenuView === "confirm"}` split the
            // session-status popover uses (rule #28) — any future
            // `Popover content={<Menu bare .../>}` must set this
            // explicitly too, it's never automatic.
            bodyPadding={resolutionMenuView === "confirm"}
            // `header`/`footer` are real `Popover` slots, only supplied
            // for the confirm view — the menu view has neither, it's just
            // `content`. Same split the session-status popover's own
            // confirm view uses.
            header={
              resolutionMenuView === "confirm" ? (
                <ContainerHeader
                  title="Close Contact?"
                  icon={
                    <WarningIconSolid
                      className="h-5 w-5 text-lyra-status-critical-strong"
                      aria-hidden="true"
                    />
                  }
                  bordered={false}
                  className="px-5 pb-0"
                />
              ) : undefined
            }
            footer={
              resolutionMenuView === "confirm" ? (
                <div className="flex items-center justify-end gap-2 px-5 pb-4 pt-1">
                  <Button
                    variant="destructive"
                    size="md"
                    onClick={() => {
                      outcome.onResolutionChange("Closed");
                      setResolutionMenuOpen(false);
                      setResolutionMenuView("menu");
                    }}
                  >
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setResolutionMenuOpen(false);
                      setResolutionMenuView("menu");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : undefined
            }
            content={
              resolutionMenuView === "confirm" ? (
                <p className="pb-2 pt-1 lyra-body-md text-lyra-fg-secondary">
                  Closing a contact cannot be undone. Are you sure you want to close this contact?
                </p>
              ) : (
                <Menu
                  bare
                  items={outcome.resolutionOptions.map((option) => ({
                    id: option.label,
                    label: option.label,
                    active: option.label === outcome.resolution,
                    icon: (
                      <span
                        aria-hidden="true"
                        className="block h-2 w-2 rounded-full"
                        style={{ backgroundColor: option.dotColor }}
                      />
                    ),
                    onClick: () => {
                      // "Closed" needs a confirm step first (same reasoning
                      // the session-status popover's own
                      // `selectSessionStatus` already established) — every
                      // other status applies immediately and closes the
                      // dropdown.
                      if (option.label === "Closed") {
                        setResolutionMenuView("confirm");
                        return;
                      }
                      outcome.onResolutionChange(option.label);
                      setResolutionMenuOpen(false);
                    },
                  }))}
                />
              )
            }
          >
            <Button
              variant="outline"
              aria-haspopup="menu"
              aria-expanded={resolutionMenuOpen}
              // Same "Closed locks it, nothing left to change" treatment
              // the session-status pill's own trigger already gets (rule
              // #28) — once this reads "Closed" there's no popover to
              // reopen, so the field disables outright rather than staying
              // clickable for no reason.
              disabled={outcome.resolution === "Closed"}
              className="h-9 w-full justify-between border-lyra-border-strong bg-lyra-bg-field font-normal text-lyra-fg-default hover:bg-lyra-bg-field hover:border-lyra-state-border-hover-neutral"
            >
              <span className="truncate">{outcome.resolution}</span>
              {/* Dropped once locked, same as the "#caseId · date" toggle
                  chevron on a Closed session (rule #28) — no chevron on a
                  field that's no longer a dropdown trigger. */}
              {outcome.resolution !== "Closed" && (
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-lyra-fg-secondary transition-transform",
                    resolutionMenuOpen && "rotate-180"
                  )}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              )}
            </Button>
          </Popover>
        </div>
        )}
        <div>
          <Label label="Tags" className="mb-1.5" />
          <Select
            multiple
            placeholder="Select tags"
            options={outcome.tagOptions.map((option) => ({ value: option.label, label: option.label }))}
            values={outcome.selectedTags}
            onValuesChange={outcome.onTagsChange}
            // Same `z-[10001]` tier as the Resolution popover above — this
            // dropdown is a `Select` nested inside this now-`z-[9999]`
            // "Log Outcome" popover, same depth, same failure mode.
            dropdownClassName="z-[10001]"
          />
          {/* Applied tags render as removable pills BELOW the picker
              itself, per explicit request — `Select`'s own multi-select
              mode only ever shows a "{n} selected" summary inside its
              trigger, not a separate persistent pill row, so that's added
              here rather than inside `Select`. Both read/write the exact
              same `selectedTags` array, so removing a pill here and
              un-checking it in the dropdown are two views of one piece of
              state, not two. */}
          {outcome.selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {outcome.selectedTags.map((tagLabel) => {
                const option = outcome.tagOptions.find((o) => o.label === tagLabel);
                return (
                  <Tag
                    key={tagLabel}
                    label={tagLabel}
                    variant={option?.variant ?? "neutral"}
                    onRemove={() =>
                      outcome.onTagsChange(outcome.selectedTags.filter((t) => t !== tagLabel))
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
        <DispositionSelect
          label="Disposition code"
          options={outcome.dispositionOptions}
          value={outcome.dispositionCode}
          onValueChange={outcome.onDispositionChange}
          // Same reasoning as the Tags `Select` above.
          dropdownClassName="z-[10001]"
          // Per explicit request: never pre-populated (the consumer's own
          // default draft now always starts this at `""`) — shown in an
          // error state until the agent actually picks one. Purely
          // derived from `dispositionCode` itself, so it clears the
          // instant a real option is chosen.
          error={!outcome.dispositionCode ? "Please select a disposition code" : undefined}
        />
        <Textarea
          label="Summary"
          rows={5}
          value={outcome.summary}
          onChange={(e) => outcome.onSummaryChange(e.target.value)}
        />
      </div>
    ),
  };
}

export interface OutcomePanelProps {
  /** The same config already threaded through `ChannelRow`/`ChannelTab` via
   *  `InteractionChannel.outcome` — reused here so this standalone panel
   *  and those two inline call sites can never drift into different forms
   *  for logging the same thing. */
  outcome: ChannelOutcomeConfig;
  /** Trigger element the popover anchors to (typically a `Button`) — same
   *  "consumer owns the trigger" contract `Popover.children` itself uses.
   *  Clicking it is the trigger's own responsibility; wire it to
   *  `outcome.onOpenChange(true)`. */
  children: React.ReactElement;
  /** Forwarded straight through to the underlying `Popover` — same
   *  defaults `ChannelRow`'s own standalone Outcome button uses
   *  (`placement="bottom"`, `align="end"`, `z-[9999]`). */
  className?: string;
  placement?: React.ComponentProps<typeof Popover>["placement"];
  align?: React.ComponentProps<typeof Popover>["align"];
  /** Forwarded straight through to the underlying `Popover` — see that
   *  prop's own doc comment (popover.tsx). Needed when the trigger this
   *  panel wraps isn't the rightmost element of its own row (e.g. a kebab
   *  or another control sits to its right): `align="end"` alone aligns to
   *  the TRIGGER's own edge, which can leave this panel not fully covering
   *  content below/beside that wider row. */
  alignOffset?: number;
  /** Forwarded straight through to the underlying `Popover` (default: 10). */
  sideOffset?: number;
  /** Forwarded straight through to the underlying `Popover` (default: true). */
  showArrow?: boolean;
}

/** Standalone, ready-to-drop "Log Outcome" popover — see this file's own
 *  top-of-file doc comment. Owns its own `useOutcomePopoverState` instance
 *  (the Resolution dropdown's local open/view state), same as every other
 *  caller — each mounted `OutcomePanel` gets its own. */
export function OutcomePanel({
  outcome,
  children,
  className,
  placement = "bottom",
  align = "end",
  alignOffset,
  sideOffset,
  showArrow,
}: OutcomePanelProps) {
  const popoverState = useOutcomePopoverState();
  // Own DOM node of the `children` trigger itself — passed to
  // `buildOutcomePopoverSlots` as the "Save & Redial" anchor (see that
  // function's own `triggerRef` param doc comment). Cloned onto `children`
  // below rather than asking the caller to manage its own ref/pass one in,
  // since `OutcomePanel`'s whole point is "drop this in with just a
  // `ChannelOutcomeConfig` and a trigger" — Radix's own `Popover.Trigger
  // asChild` (popover.tsx) already composes refs on a cloned child
  // correctly, so this ref and Radix's own internal one both attach fine.
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const { header, footer, content } = buildOutcomePopoverSlots(outcome, popoverState, triggerRef);
  return (
    <Popover
      open={outcome.open}
      onOpenChange={outcome.onOpenChange}
      placement={placement}
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
      showArrow={showArrow}
      className={cn("z-[9999] w-80", className)}
      onCloseAutoFocus={(e) => e.preventDefault()}
      header={header}
      footer={footer}
      content={content}
    >
      {React.cloneElement(children, { ref: triggerRef } as React.RefAttributes<HTMLElement>)}
    </Popover>
  );
}

