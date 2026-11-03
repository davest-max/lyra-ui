import type { Meta, StoryObj } from "@storybook/react";
import { VoiceCallControls } from "../voice-call-controls";
import { CallDemo, NARROW_BAR_WIDTH, RAIL_WIDTH } from "./VoiceCallControls.shared";

const meta: Meta<typeof VoiceCallControls> = {
  title: "UI/VoiceCallControls",
  component: VoiceCallControls,
  tags: ["autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
};
export default meta;

/* Every layout and state (left rail, narrow overflow menu, on hold, unmatched caller, masking, ...) has its
   own page under "VoiceCallControls/Variants" — see VoiceCallControls.variants.stories.tsx. */

interface PlaygroundProps {
  layout: "bar" | "narrow" | "rail";
  startOnHold: boolean;
  transcript: boolean;
  showAddVideo: boolean;
  customerLabel: string;
  customerInitials: string;
}

/* The Default playground: a live call (ticking timer, real hold / transcript / video state). Remounts when a
   control changes, so "Start on hold" and the rest take effect. */
function Playground({ layout, startOnHold, transcript, showAddVideo, customerLabel, customerInitials }: PlaygroundProps) {
  return (
    <CallDemo
      key={JSON.stringify({ layout, startOnHold, transcript, showAddVideo, customerLabel, customerInitials })}
      layout={layout === "rail" ? "rail" : "bar"}
      width={layout === "rail" ? RAIL_WIDTH : layout === "narrow" ? NARROW_BAR_WIDTH : undefined}
      startOnHold={startOnHold}
      transcript={transcript}
      showAddVideo={showAddVideo}
      customerLabel={customerLabel || undefined}
      customerInitials={customerInitials || undefined}
    />
  );
}

export const Default: StoryObj<typeof Playground> = {
  render: (args) => <Playground {...args} />,
  args: {
    layout: "bar",
    startOnHold: false,
    transcript: true,
    showAddVideo: true,
    customerLabel: "Marcus Webb",
    customerInitials: "MW",
  },
  parameters: {
    controls: {
      include: [
        "startOnHold",
        "transcript",
        "showAddVideo",
        "customerLabel",
        "customerInitials",
        "layout",
        "Start on hold",
        "Transcript available",
        "Add video",
        "Customer",
        "Initials",
        "Layout",
      ],
      sort: "none",
    },
  },
  argTypes: {
    startOnHold: {
      name: "Start on hold",
      control: "boolean",
      description: "Opens the call on hold, with the \"On hold\" timer under the call timer (`onHold`, `onHoldElapsedSeconds`). Hold / Resume still toggles it.",
      table: { category: "Behavior", defaultValue: { summary: "false" } },
    },
    transcript: {
      name: "Transcript available",
      control: "boolean",
      description: "Whether this call has a transcript (`onToggleTranscript` passed). Off, the Transcript button stays but is disabled, with a \"Transcript not available\" tooltip.",
      table: { category: "Behavior", defaultValue: { summary: "available when onToggleTranscript is set" } },
    },
    showAddVideo: {
      name: "Add video",
      control: "boolean",
      description: "Shows the Add video button (`showAddVideo`).",
      table: { category: "Behavior", defaultValue: { summary: "true" } },
    },
    customerLabel: {
      name: "Customer",
      control: "text",
      description: "Name, number or email shown with the avatar (`customerLabel`). Clear it to hide both.",
      table: { category: "Content" },
    },
    customerInitials: {
      name: "Initials",
      control: "text",
      description: "Initials in the avatar (`customerInitials`). Clear it for an unmatched caller: the generic person icon.",
      table: { category: "Content" },
    },
    layout: {
      name: "Layout",
      control: { type: "radio", labels: { bar: "Bar", narrow: "Bar, narrow (under 600px)", rail: "Left rail" } },
      options: ["bar", "narrow", "rail"],
      description:
        "Bar: the full-width call bar under the transcript. Narrow: the same bar in a 520px container, where Mask, Record, Keypad and Transcript fold into a \"…\" menu. Left rail: the stacked card for a narrow column (`layout=\"rail\"`).",
      table: { category: "Appearance", defaultValue: { summary: "bar" } },
    },
  },
};
