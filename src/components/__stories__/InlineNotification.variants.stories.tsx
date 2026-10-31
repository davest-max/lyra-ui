import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "../avatar";
import { Button } from "../button";
import { InlineNotification } from "../inline-notification";
import { Tag } from "../tag";
import { MESSAGES, VARIANTS, HEADINGS, INLINE_LINK_CLASS } from "./InlineNotification.shared";

/* One page per Inline Notification variant, shown under "Inline
   Notification/Variants" in the sidebar. Static references for design review;
   the interactive playground is Inline Notification → Default. "!autodocs"
   keeps this folder from getting a second Docs page. */
const meta: Meta<typeof InlineNotification> = {
  title: "Custom Primitives/Inline Notification/Variants",
  component: InlineNotification,
  tags: ["!autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof InlineNotification>;

/* A caption over one gallery example. */
function Example({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="lyra-body-sm-emphasis text-lyra-fg-secondary">{label}</div>
      {children}
    </div>
  );
}

/* Dismiss wired to state. Tab to the close button and press Enter: the notification closes and focus moves to
   "Show again", instead of being lost. */
function DismissibleExample() {
  const [open, setOpen] = useState(true);
  return open ? (
    <InlineNotification variant="info" onDismiss={() => setOpen(false)}>
      {MESSAGES.info}
    </InlineNotification>
  ) : (
    <div>
      <Button variant="outline" size="sm" autoFocus onClick={() => setOpen(true)}>Show again</Button>
    </div>
  );
}

/* The gallery: every tone, then one example each of the options the Default story's controls can't show or
   that are easiest to compare side by side (a title, an action, a dismiss, and `icon`, a ReactNode, so not a control). */
export const AllVariants: Story = {
  name: "All Variants",
  render: () => (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-4">
        {VARIANTS.map((variant) => (
          <InlineNotification key={variant} variant={variant}>
            {MESSAGES[variant]}
          </InlineNotification>
        ))}
      </div>
      <Example label="With Title">
        <InlineNotification variant="warning" heading={HEADINGS.warning}>
          {MESSAGES.warning}
        </InlineNotification>
      </Example>
      <Example label="With Action">
        <InlineNotification
          variant="success"
          actionPlacement="inline"
          action={<a href="#details" className={INLINE_LINK_CLASS} onClick={(e) => e.preventDefault()}>View details</a>}
        >
          {MESSAGES.success}
        </InlineNotification>
      </Example>
      <Example label="Dismissible">
        <DismissibleExample />
      </Example>
      {/* `icon` replaces the status glyph (here a person's avatar, for an item row). The avatar carries no label:
          the visible name beside it says it. A wider-than-20px icon pairs with `actionPlacement="inline"`. */}
      <Example label="With Icon">
        <InlineNotification
          variant="info"
          icon={<Avatar size="xs" initials="MC" />}
          heading={
            <span className="flex items-center gap-2">
              Maya Chen
              <Tag label="Voice" />
            </span>
          }
          actionPlacement="inline"
          action={<Button variant="outline" size="sm">View</Button>}
        >
          On call
        </InlineNotification>
      </Example>
    </div>
  ),
};
