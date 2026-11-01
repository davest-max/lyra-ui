import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ToggleGroup } from "../toggle-group";
import { makeItems } from "./ToggleGroup.shared";

const meta: Meta<typeof ToggleGroup> = {
  title: "Custom Primitives/Toggle Group",
  component: ToggleGroup,
  tags: ["autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
  // Real ToggleGroup props stay on the Docs page; Default's own
  // `parameters.controls.include` below curates the Controls panel.
  argTypes: {
    type: { control: "radio", options: ["single", "multiple"] },
    disabled: { control: "boolean" },
    fullWidth: { control: "boolean" },
    allowDeselect: { control: "boolean" },
    itemMaxWidth: { control: "number" },
    ariaLabel: { control: "text" },
    ariaLabelledBy: { control: "text" },
    ariaDescribedBy: { control: "text" },
    showTruncationTooltip: { control: "boolean" },
    menuAriaLabel: { control: "text" },
    items: { table: { disable: true } },
    onValueChange: { table: { disable: true } },
    onValuesChange: { table: { disable: true } },
  },
};

export default meta;

/* Every state side by side, and the narrow-row truncation example, have their
   own pages under "Toggle Group/Variants" — see
   ToggleGroup.variants.stories.tsx. */

/* ── Default — consolidated Default, Multiple Selection, With Disabled Item and
   Fully Disabled into one controls-driven story. `itemCount` and
   `disabledItem` are story-only args that shape `items`. The demo keeps the
   selection in state and remounts (via `key`) whenever a control changes. ── */

interface ToggleGroupDemoProps {
  type?: "single" | "multiple";
  disabled?: boolean;
  disabledItem?: boolean;
  withMenu?: boolean;
  itemCount?: number;
  withIcons?: boolean;
  withLabel?: boolean;
  withBadge?: boolean;
  badgeType?: "number" | "alert";
  fullWidth?: boolean;
  allowDeselect?: boolean;
  itemMaxWidth?: "none" | "80" | "120";
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

function ToggleGroupDemo({
  type = "single",
  disabled = false,
  disabledItem = false,
  withMenu = false,
  itemCount = 3,
  withIcons = false,
  withLabel = true,
  withBadge = false,
  badgeType = "number",
  fullWidth = false,
  allowDeselect = false,
  itemMaxWidth = "none",
  ariaLabel = "View",
  ariaDescribedBy,
}: ToggleGroupDemoProps) {
  const maxWidth = itemMaxWidth === "none" ? undefined : Number(itemMaxWidth);
  const longLabels = maxWidth !== undefined;
  const [value, setValue] = useState("a");
  const [values, setValues] = useState<string[]>(["a"]);
  const baseItems = makeItems(itemCount, disabledItem, { icons: withIcons, label: withLabel, menu: withMenu, badge: withBadge, badgeType });
  // With a max item width, plain-text labels get longer so the cut-off shows.
  const items = longLabels
    ? baseItems.map((item, i) => (item.label === "Toggle" ? { ...item, label: `Toggle option ${i + 1}` } : item))
    : baseItems;

  const group =
    type === "multiple" ? (
      <ToggleGroup
        type="multiple"
        items={items}
        values={values}
        onValuesChange={setValues}
        disabled={disabled}
        fullWidth={fullWidth}
        itemMaxWidth={maxWidth}
        ariaLabel={ariaLabel || undefined}
        ariaDescribedBy={ariaDescribedBy || undefined}
        showTruncationTooltip
      />
    ) : (
      <ToggleGroup
        items={items}
        value={value}
        onValueChange={setValue}
        disabled={disabled}
        fullWidth={fullWidth}
        allowDeselect={allowDeselect}
        itemMaxWidth={maxWidth}
        ariaLabel={ariaLabel || undefined}
        ariaDescribedBy={ariaDescribedBy || undefined}
        showTruncationTooltip
      />
    );

  return group;
}

type ToggleGroupDemoStory = StoryObj<ToggleGroupDemoProps>;

export const Default: ToggleGroupDemoStory = {
  render: (args) => <ToggleGroupDemo key={JSON.stringify(args)} {...args} />,
  args: {
    type: "single",
    disabled: false,
    disabledItem: false,
    withMenu: false,
    itemCount: 3,
    withIcons: false,
    withLabel: true,
    withBadge: false,
    badgeType: "number",
    fullWidth: false,
    allowDeselect: false,
    itemMaxWidth: "none",
    ariaLabel: "View",
  },
  parameters: {
    controls: {
      // Storybook matches `include` against each control's display `name`
      // (falling back to its key), so list the names; keys are kept too.
      include: [
        "Selection", "Allow deselect", "Disabled", "Disabled item", "With menu",
        "Items", "Icons", "Label", "Group name",
        "With badge", "Badge type", "Full width", "Max item width",
        "type", "allowDeselect", "disabled", "disabledItem", "withMenu",
        "itemCount", "withIcons", "withLabel", "ariaLabel", "ariaDescribedBy",
        "withBadge", "badgeType", "fullWidth", "itemMaxWidth",
      ],
      sort: "none",
    },
  },
  argTypes: {
    type: {
      name: "Selection",
      control: "radio",
      options: ["single", "multiple"],
      description: "Single lets one item be on at a time: the group is one Tab stop, and ←/→ (or ↑/↓, Home, End) move and select. Multiple lets any number be on: each item is its own Tab stop, and Space or Enter toggles it (`type`).",
      table: { category: "Behavior", defaultValue: { summary: "single" } },
    },
    allowDeselect: {
      name: "Allow deselect",
      control: "boolean",
      description: "Single only. Clicking the selected item again clears the selection (`allowDeselect`). Off, the selected item stays selected, like a radio group.",
      if: { arg: "type", eq: "single" },
      table: { category: "Behavior", defaultValue: { summary: "false" } },
    },
    disabled: {
      name: "Disabled",
      control: "boolean",
      description: "Dims the whole group and stops it changing.",
      table: { category: "Behavior", defaultValue: { summary: "false" } },
    },
    disabledItem: {
      name: "Disabled item",
      control: "boolean",
      description: "Disables one item (`disabled` on one item): the middle one, or the last when there are only two.",
      table: { category: "Behavior", defaultValue: { summary: "false" } },
    },
    withMenu: {
      name: "With menu",
      control: "boolean",
      description: "Adds a kebab (⋮) button inside each toggle that opens a menu (`menuItems`). It is its own button after the toggle in the Tab order, with a \"More options\" tooltip on hover and focus. Clicking it doesn't select the toggle.",
      table: { category: "Behavior", defaultValue: { summary: "false" } },
    },
    itemCount: {
      name: "Items",
      control: { type: "range", min: 2, max: 5, step: 1 },
      description: "How many toggles are in the group.",
      table: { category: "Content", defaultValue: { summary: "3" } },
    },
    withIcons: {
      name: "Icons",
      control: "boolean",
      description: "Shows an icon before each label.",
      table: { category: "Content", defaultValue: { summary: "false" } },
    },
    ariaLabel: {
      name: "Group name",
      control: "text",
      description: "What a screen reader calls the group, e.g. \"View\" (`ariaLabel`). Not shown on screen.",
      table: { category: "Content", defaultValue: { summary: "none" } },
    },
    withLabel: {
      name: "Label",
      control: "boolean",
      description: "Shows the text label. Off leaves icon-only toggles, which show their label in a tooltip on hover and keyboard focus (`tooltip` + `ariaLabel` on each item).",
      if: { arg: "withIcons", truthy: true },
      table: { category: "Content", defaultValue: { summary: "true" } },
    },
    withBadge: {
      name: "With badge",
      control: "boolean",
      description: "Adds a red badge to each toggle.",
      table: { category: "Appearance", defaultValue: { summary: "false" } },
    },
    badgeType: {
      name: "Badge type",
      control: "radio",
      options: ["number", "alert"],
      description: "Number shows a count in the badge. Alert shows an \"!\".",
      if: { arg: "withBadge", truthy: true },
      table: { category: "Appearance", defaultValue: { summary: "number" } },
    },
    fullWidth: {
      name: "Full width",
      control: "boolean",
      description: "Stretches the group across the full width of the page, with equal-width items. A label that gets cut off shows in full in a tooltip on hover.",
      table: { category: "Appearance", defaultValue: { summary: "false" } },
    },
    itemMaxWidth: {
      name: "Max item width",
      control: "select",
      options: ["none", "80", "120"],
      description: "Caps each item's width in px (`itemMaxWidth`). Longer labels are cut off with an ellipsis and show in full in a tooltip on hover and focus (`showTruncationTooltip`). The demo lengthens the labels so the cut-off shows.",
      table: { category: "Appearance", defaultValue: { summary: "none" } },
    },
  },
};
