import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ToggleGroup } from "../toggle-group";
import { cn } from "../../lib/utils";
import { makeItems } from "./ToggleGroup.shared";

/* One page per Toggle Group variant, shown under "Toggle Group/Variants" in the
   sidebar. Static references for design review; the interactive playground is
   Toggle Group → Default. "!autodocs" keeps this folder from getting a second
   Docs page. */
const meta: Meta<typeof ToggleGroup> = {
  title: "Custom Primitives/Toggle Group/Variants",
  component: ToggleGroup,
  tags: ["!autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
};

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

/* The wrapper every static state preview below sits in. */
const previewShell = "inline-flex items-center rounded-lyra-md border border-lyra-border-subtle bg-lyra-bg-surface-base p-0.5";

/* ── All Variants — every base state (was All States). Hover and press are
   static copies of those styles, since a story can't hold a real hover. ── */
export const AllVariants: Story = {
  name: "All Variants",
  render: () => (
    <div className="flex flex-col gap-6 w-80">
      <div className="flex flex-col gap-1">
        <span className="lyra-body-sm text-lyra-fg-secondary">Off</span>
        <ToggleGroup items={[{ value: "x", label: "Toggle" }]} />
      </div>

      <div className="flex flex-col gap-1">
        <span className="lyra-body-sm text-lyra-fg-secondary">With icons</span>
        <ToggleGroup items={makeItems(3, false, { icons: true })} defaultValue="a" />
      </div>

      <div className="flex flex-col gap-1">
        <span className="lyra-body-sm text-lyra-fg-secondary">Icon only</span>
        <ToggleGroup items={makeItems(3, false, { icons: true, label: false })} defaultValue="a" />
      </div>

      <div className="flex flex-col gap-1">
        <span className="lyra-body-sm text-lyra-fg-secondary">With menu</span>
        <ToggleGroup items={makeItems(3, false, { menu: true })} defaultValue="a" />
      </div>

      <div className="flex flex-col gap-1">
        <span className="lyra-body-sm text-lyra-fg-secondary">With badge</span>
        <ToggleGroup items={makeItems(3, false, { badge: true })} defaultValue="a" />
      </div>

      <div className="flex flex-col gap-1">
        <span className="lyra-body-sm text-lyra-fg-secondary">With alert badge</span>
        <ToggleGroup items={makeItems(3, false, { badge: true, badgeType: "alert" })} defaultValue="a" />
      </div>

      <div className="flex flex-col gap-1">
        <span className="lyra-body-sm text-lyra-fg-secondary">Disabled</span>
        <ToggleGroup items={[{ value: "x", label: "Toggle" }]} disabled />
      </div>

      <div className="flex flex-col gap-1">
        <span className="lyra-body-sm text-lyra-fg-secondary">Hover</span>
        <div className={previewShell}>
          <button
            type="button"
            className="px-4 py-1.5 lyra-body-md rounded-lyra-sm text-lyra-fg-default bg-lyra-bg-surface-shell border border-lyra-border-soft transition-colors"
          >
            Toggle
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="lyra-body-sm text-lyra-fg-secondary">Press</span>
        <div className={previewShell}>
          <button
            type="button"
            className="px-4 py-1.5 lyra-body-md rounded-lyra-sm text-lyra-fg-default bg-lyra-bg-disabled border border-lyra-border-soft transition-colors"
          >
            Toggle
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="lyra-body-sm text-lyra-fg-secondary">On</span>
        <ToggleGroup items={[{ value: "x", label: "Toggle" }]} value="x" onValueChange={() => {}} />
      </div>

      <div className="flex flex-col gap-1">
        <span className="lyra-body-sm text-lyra-fg-secondary">Selected Hover</span>
        <div className={previewShell}>
          <button
            type="button"
            className={cn(
              "px-4 py-1.5 lyra-body-md rounded-lyra-sm font-medium transition-colors",
              "bg-lyra-state-hover-active-subtle border border-lyra-border-active text-lyra-fg-active-strong"
            )}
          >
            Toggle
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="lyra-body-sm text-lyra-fg-secondary">Selected Press</span>
        <div className={previewShell}>
          <button
            type="button"
            className={cn(
              "px-4 py-1.5 lyra-body-md rounded-lyra-sm font-medium transition-colors",
              "bg-lyra-state-pressed-active-subtle border border-lyra-border-active text-lyra-fg-active-strong"
            )}
          >
            Toggle
          </button>
        </div>
      </div>
    </div>
  ),
};

/* ── Full Width — long labels truncate instead of wrapping, and hovering a cut-off label shows it in full. A narrow fixed-width
   box forces the truncation, matching the real case: a combined-panel region
   switch sharing a narrow row with a long interaction title. ── */
export const FullWidth: Story = {
  name: "Full Width",
  render: () => {
    const [value, setValue] = useState("main");
    return (
      <div className="w-80 rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-base p-3">
        <ToggleGroup
          fullWidth
          showTruncationTooltip
          items={[
            { value: "main", label: "Alex Kowalski (CST-10000)" },
            { value: "panel", label: "Search" },
          ]}
          value={value}
          onValueChange={(next) => next && setValue(next)}
        />
      </div>
    );
  },
};

/* ── Icon Only — each item names itself with `ariaLabel` and shows that name
   in its own `tooltip`, on hover and on keyboard focus (Tab into the group,
   then ←/→). ── */
function IconOnlyDemo() {
  const [value, setValue] = useState("a");
  return (
    <ToggleGroup
      ariaLabel="Layout"
      items={makeItems(3, false, { icons: true, label: false })}
      value={value}
      onValueChange={setValue}
    />
  );
}

export const IconOnly: Story = {
  name: "Icon Only",
  render: () => <IconOnlyDemo />,
};

/* ── Max Item Width — `itemMaxWidth` caps each item without `fullWidth`; long
   labels are cut off and, with `showTruncationTooltip`, show in full on hover
   and focus. ── */
function MaxItemWidthDemo() {
  const [value, setValue] = useState("queue");
  return (
    <ToggleGroup
      ariaLabel="Source"
      itemMaxWidth={120}
      showTruncationTooltip
      items={[
        { value: "queue", label: "My queue" },
        { value: "team", label: "Team escalations and callbacks" },
        { value: "all", label: "All open interactions" },
      ]}
      value={value}
      onValueChange={setValue}
    />
  );
}

export const MaxItemWidth: Story = {
  name: "Max Item Width",
  render: () => <MaxItemWidthDemo />,
};

/* ── Allow Deselect — single mode with `allowDeselect`: clicking the selected
   item again clears it, leaving nothing selected (shown here). Without the
   prop, the selected item stays selected. ── */
function AllowDeselectDemo() {
  const [value, setValue] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <ToggleGroup
        ariaLabel="Outcome"
        allowDeselect
        items={[
          { value: "resolved", label: "Resolved" },
          { value: "follow-up", label: "Follow-up" },
          { value: "escalated", label: "Escalated" },
        ]}
        value={value}
        onValueChange={setValue}
      />
      <span className="lyra-body-sm text-lyra-fg-secondary">Selected: {value || "none"}</span>
    </div>
  );
}

export const AllowDeselect: Story = {
  name: "Allow Deselect",
  render: () => <AllowDeselectDemo />,
};

/* ── Disabled With Reason — a disabled group says why as visible text, tied to the group with `ariaDescribedBy` so
   a screen reader reads it on entering the group (a disabled radio takes no focus, so a tooltip alone never reaches
   the keyboard). ── */
export const DisabledWithReason: Story = {
  name: "Disabled With Reason",
  render: () => (
    <div className="flex flex-col gap-1.5">
      <span id="tg-reason-label" className="lyra-label text-lyra-fg-default">
        Home layout
      </span>
      <ToggleGroup
        ariaLabelledBy="tg-reason-label"
        ariaDescribedBy="tg-reason-text"
        items={[
          { value: "one", label: "One column" },
          { value: "two", label: "Two columns" },
        ]}
        value="one"
        disabled
      />
      <p id="tg-reason-text" className="lyra-body-sm text-lyra-fg-secondary">
        Advanced layout is on.
      </p>
    </div>
  ),
};
