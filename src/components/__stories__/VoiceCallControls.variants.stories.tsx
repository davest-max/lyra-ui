import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { VoiceCallControls } from "../voice-call-controls";
import { CallDemo, CALLERS, NARROW_BAR_WIDTH, RAIL_WIDTH } from "./VoiceCallControls.shared";

/* One page per VoiceCallControls layout or scenario, under "VoiceCallControls/Variants". The interactive
   playground is VoiceCallControls → Default. "!autodocs" keeps this folder from getting a second Docs page.
   Every example is a live call: the timer ticks, Hold / Transcript / Video toggle, End Call plays its exit. */
const meta: Meta<typeof VoiceCallControls> = {
  title: "UI/VoiceCallControls/Variants",
  component: VoiceCallControls,
  tags: ["!autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
};
export default meta;
type Story = StoryObj<typeof VoiceCallControls>;

const Caption = ({ children }: { children: ReactNode }) => (
  <p className="mb-2 lyra-body-sm-emphasis text-lyra-fg-secondary">{children}</p>
);

/* ── Left Rail — the stacked card for a narrow column (`layout="rail"`), as in the reference design. ── */
export const LeftRail: Story = {
  name: "Left Rail",
  render: () => (
    <CallDemo
      layout="rail"
      width={RAIL_WIDTH}
      startAt={279}
      customerLabel={CALLERS.maya.label}
      customerInitials={CALLERS.maya.initials}
      showAddVideo={false}
    />
  ),
};

/* ── Left Rail States — on hold, transcript open, with Add video (Mute and Video share a row, End Call goes full width below),
   an unmatched caller, and no transcript (button disabled). ── */
export const LeftRailStates: Story = {
  name: "Left Rail States",
  render: () => (
    <div className="flex flex-wrap items-start gap-8">
      <div>
        <Caption>On hold</Caption>
        <CallDemo layout="rail" width={RAIL_WIDTH} startAt={312} startOnHold customerLabel={CALLERS.maya.label} customerInitials={CALLERS.maya.initials} showAddVideo={false} />
      </div>
      <div>
        <Caption>Transcript open</Caption>
        <CallDemo layout="rail" width={RAIL_WIDTH} startAt={88} startTranscriptOpen customerLabel={CALLERS.marcus.label} customerInitials={CALLERS.marcus.initials} showAddVideo={false} />
      </div>
      <div>
        <Caption>With Add video (video on)</Caption>
        <CallDemo layout="rail" width={RAIL_WIDTH} startAt={140} startVideoOpen customerLabel={CALLERS.sofia.label} customerInitials={CALLERS.sofia.initials} />
      </div>
      <div>
        <Caption>Unmatched caller</Caption>
        <CallDemo layout="rail" width={RAIL_WIDTH} startAt={45} customerLabel={CALLERS.unmatched.label} showAddVideo={false} />
      </div>
      <div>
        <Caption>No transcript (button disabled)</Caption>
        <CallDemo layout="rail" width={RAIL_WIDTH} startAt={64} transcript={false} customerLabel={CALLERS.marcus.label} customerInitials={CALLERS.marcus.initials} showAddVideo={false} />
      </div>
    </div>
  ),
};

/* ── States — the bar: on hold, transcript open, video on, Add video hidden, unmatched caller, no transcript. ── */
export const States: Story = {
  name: "States",
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <Caption>On hold (hold timer under the call timer)</Caption>
        <CallDemo startAt={312} startOnHold customerLabel={CALLERS.marcus.label} customerInitials={CALLERS.marcus.initials} />
      </div>
      <div>
        <Caption>Transcript open</Caption>
        <CallDemo startAt={88} startTranscriptOpen customerLabel={CALLERS.marcus.label} customerInitials={CALLERS.marcus.initials} />
      </div>
      <div>
        <Caption>Video on</Caption>
        <CallDemo startAt={140} startVideoOpen customerLabel={CALLERS.sofia.label} customerInitials={CALLERS.sofia.initials} />
      </div>
      <div>
        <Caption>Add video hidden</Caption>
        <CallDemo startAt={27} showAddVideo={false} customerLabel="Priya Nair" customerInitials="PN" />
      </div>
      <div>
        <Caption>Unmatched caller (no contact match: generic person avatar)</Caption>
        <CallDemo startAt={45} customerLabel={CALLERS.unmatched.label} />
      </div>
      <div>
        <Caption>No transcript (Transcript button disabled, &quot;Transcript not available&quot; tooltip)</Caption>
        <CallDemo startAt={64} transcript={false} customerLabel={CALLERS.marcus.label} customerInitials={CALLERS.marcus.initials} />
      </div>
    </div>
  ),
};

/* ── Narrow — the bar below 600px: Mask, Record, Keypad and Transcript fold into a "…" menu (Keypad's
   dialpad opens off its menu row). Hold and Volume stay as icon buttons either side of it. ── */
export const NarrowOverflowMenu: Story = {
  name: "Narrow (<600px) — Overflow Menu",
  render: () => (
    <CallDemo width={NARROW_BAR_WIDTH} startAt={58} customerLabel={CALLERS.marcus.label} customerInitials={CALLERS.marcus.initials} />
  ),
};

/* ── Masking disables Record — masking can't be preset (it's internal state), so click Mask. Record then
   turns aria-disabled, not disabled, so its "Recording disabled while masking is on" tooltip stays
   reachable by hover and keyboard. Shown in both layouts. ── */
export const MaskingDisablesRecord: Story = {
  name: "Masking Disables Record (click Mask)",
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <Caption>Bar</Caption>
        <CallDemo startAt={132} customerLabel={CALLERS.sofia.label} customerInitials={CALLERS.sofia.initials} />
      </div>
      <div>
        <Caption>Left rail</Caption>
        <CallDemo layout="rail" width={RAIL_WIDTH} startAt={132} customerLabel={CALLERS.sofia.label} customerInitials={CALLERS.sofia.initials} showAddVideo={false} />
      </div>
    </div>
  ),
};
