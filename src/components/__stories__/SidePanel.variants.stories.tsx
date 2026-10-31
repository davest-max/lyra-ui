import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ChevronDown, User } from "lucide-react";
import { SidePanel } from "../side-panel";
import { PanelPinButton } from "../panel-pin-button";
import { PageHeader } from "../page-header";
import { useSidePanelToggle } from "../use-side-panel-toggle";
import { Select } from "../select";
import { TreeMenu, type TreeMenuItem } from "../tree-menu";
import { PanelForm } from "./InteriorPanel.shared";

/* One page per SidePanel scenario, shown under "SidePanel/Variants" in the
   sidebar. Static references for design review; the interactive playground is
   SidePanel → Default. "!autodocs" keeps this folder from getting a second Docs
   page. The two stories paired with Sol's Side Panel in lyra-sol-compare (Left,
   Right) stay in SidePanel.stories.tsx unchanged. */
const meta: Meta<typeof SidePanel> = {
  title: "Custom Primitives/SidePanel/Variants",
  component: SidePanel,
  tags: ["!autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
};

export default meta;
type Story = StoryObj<typeof SidePanel>;

/* Static frame for a panel state: `relative` so an unpinned (overlay) panel has a positioned ancestor. */
function StateFrame({ label, side = "right", children }: { label: string; side?: "left" | "right"; children: React.ReactNode }) {
  const filler = (
    <div className="flex-1 bg-lyra-bg-surface-base p-4">
      <p className="lyra-body-sm text-lyra-fg-secondary">Main content</p>
    </div>
  );
  return (
    <div className="flex flex-col gap-2">
      <p className="lyra-label text-lyra-fg-secondary">{label}</p>
      <div className="relative flex h-[320px] overflow-hidden rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-base">
        {side === "left" && children}
        {filler}
        {side === "right" && children}
      </div>
    </div>
  );
}

export const States: Story = {
  name: "States (Pinned, Unpinned, Closed, Side, Resizable)",
  render: () => (
    <div className="grid grid-cols-2 gap-6 max-w-5xl">
      <StateFrame label="Pinned — right (pushes content)">
        <SidePanel side="right" pinned headerTitle="Pinned"><PanelForm /></SidePanel>
      </StateFrame>
      <StateFrame label="Pinned — left" side="left">
        <SidePanel side="left" pinned headerTitle="Pinned"><PanelForm /></SidePanel>
      </StateFrame>
      <StateFrame label="Unpinned — overlay">
        <SidePanel side="right" headerTitle="Overlay"><PanelForm /></SidePanel>
      </StateFrame>
      <StateFrame label="Closed (open=false)">
        <SidePanel side="right" pinned open={false} headerTitle="Closed"><PanelForm /></SidePanel>
      </StateFrame>
      <StateFrame label="Not resizable (resizable=false)">
        <SidePanel side="right" pinned resizable={false} headerTitle="Fixed width"><PanelForm /></SidePanel>
      </StateFrame>
    </div>
  ),
};

/* ── View Switcher (headerTitleBadge) ──
   `headerTitleBadge` renders inline right after `headerTitle`, same row —
   distinct from `headerActions`, which sits at the header's far right.
   Here it's a bare-chevron `Select` (single-select, same composition as
   `Select.stories.tsx`'s "Custom Trigger (Icon, Single-Select)" story)
   letting the panel switch between two entirely different trees, the
   header title following whichever is active. Modeled on Outbound-
   Campaigns' Monitor dashboard side menu (`CallCentersSideMenu.tsx`),
   which needed exactly this: a chevron after the title opening a
   Call Centers / Service Groups switcher. */

type ViewSwitcherView = "treeA" | "treeB";

const TREE_A_ITEMS: TreeMenuItem[] = [
  { label: "Financial Services", children: [{ label: "FS_HCI" }, { label: "FS_Manual" }] },
  { label: "Hospitality", children: [{ label: "H_HCI" }, { label: "H_Manual" }] },
];

const TREE_B_ITEMS: TreeMenuItem[] = [
  { label: "Team Alpha", children: [{ label: "Alpha_Primary" }, { label: "Alpha_Backup" }] },
  { label: "Team Beta", children: [{ label: "Beta_Primary" }, { label: "Beta_Backup" }] },
];

export const ViewSwitcher: Story = {
  name: "Side Panel — View Switcher (headerTitleBadge)",
  render: () => {
    const [view, setView] = useState<ViewSwitcherView>("treeA");
    return (
      <div className="relative h-[420px] flex overflow-hidden rounded-lyra-lg border border-lyra-border-subtle">
        <SidePanel
          side="left"
          pinned
          headerTitle={view === "treeA" ? "Tree A" : "Tree B"}
          headerTitleBadge={
            <Select
              options={[
                { value: "treeA", label: "Tree A" },
                { value: "treeB", label: "Tree B" },
              ]}
              value={view}
              onValueChange={(v) => setView(v as ViewSwitcherView)}
              trigger={<ChevronDown className="h-4 w-4" aria-hidden="true" />}
              dropdownAlign="left"
            />
          }
        >
          <TreeMenu key={view} className="px-2" items={view === "treeA" ? TREE_A_ITEMS : TREE_B_ITEMS} />
        </SidePanel>
        <div className="flex flex-1 flex-col bg-lyra-bg-surface-base p-4">
          <p className="lyra-body-sm text-lyra-fg-secondary">Main content column.</p>
        </div>
      </div>
    );
  },
};

/* ── PanelPinButton ──
   Moved in from its own top-level story — `PanelPinButton` was extracted
   out of `SidePanel`'s own header (see `side-panel.tsx`) into its own atom,
   same Tooltip/button/focus-ring and the pin-icon-rotates-45°-when-pinned
   animation, reusable anywhere a consumer needs to drive a panel's
   `pinned`/`open` state from outside the panel itself — kept alongside
   `SidePanel` here since that's its one real usage in this repo. */
export const PinButton: Story = {
  name: "PanelPinButton",
  render: () => {
    const [pinned, setPinned] = useState(false);
    return (
      <div className="flex items-center gap-3 rounded-lyra-md border border-lyra-border-subtle p-3">
        <PanelPinButton pinned={pinned} onToggle={() => setPinned((v) => !v)} />
        <span className="lyra-body-sm text-lyra-fg-secondary">{pinned ? "Pinned" : "Unpinned"}</span>
      </div>
    );
  },
};

/* ── PanelPinButton — Custom icon ──
   agent-next-gen-v1's Designer-panel trigger sits on the interaction
   record header, next to the customer name — the `User` icon that's
   already there, not a separate `Pin` glyph. Passing `icon` swaps the
   glyph and switches the "pinned" indicator from the default's rotate-45°
   animation (a pin-specific metaphor that looks wrong on an arbitrary
   glyph) to a selected/pressed background instead — same Tooltip/aria
   behavior either way. */
export const PinButtonCustomIcon: Story = {
  name: "PanelPinButton — Custom Icon (Designer panel trigger)",
  render: () => {
    const [pinned, setPinned] = useState(false);
    return (
      <div className="flex items-center gap-3 rounded-lyra-md border border-lyra-border-subtle p-3">
        <PanelPinButton
          pinned={pinned}
          onToggle={() => setPinned((v) => !v)}
          icon={<User className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />}
          pinnedLabel="Unpin Designer panel"
          unpinnedLabel="Pin Designer panel"
        />
        <span className="lyra-body-sm text-lyra-fg-secondary">{pinned ? "Pinned" : "Unpinned"}</span>
      </div>
    );
  },
};

/* ── PageHeader toggles — useSidePanelToggle ──
   A left and a right SidePanel, each driven by its PageHeader toggle through `useSidePanelToggle` (the wiring
   AdminShell uses). The left one starts pinned and open: close it with the toggle, then hover the toggle to preview
   it without moving the page. The right one starts unpinned: hovering its toggle opens it as a flyout, which closes
   `SIDE_PANEL_HOVER_CLOSE_MS` after the pointer leaves the toggle and the panel; Enter on the toggle opens it with
   focus inside, and Escape or tabbing out closes it. The left toggle carries a count badge and its own label. */
export const PageHeaderToggles: Story = {
  name: "PageHeader Toggles (useSidePanelToggle)",
  render: () => {
    const left = useSidePanelToggle({ side: "left", defaultOpen: true, defaultPinned: true });
    const right = useSidePanelToggle({ side: "right" });
    return (
      <div className="relative flex h-[420px] overflow-hidden rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-base">
        <SidePanel side="left" {...left.sidePanelProps} headerTitle="Assignments" skipToMain={false} className="focus:outline-none">
          <PanelForm />
        </SidePanel>
        <div className="flex min-w-0 flex-1 flex-col">
          <PageHeader
            title="Page Title"
            panelToggle="both"
            panelToggleBadge={3}
            panelToggleLabel="Show assignments"
            innerPanelToggleLabel="Show details"
            {...left.pageHeaderProps}
            {...right.pageHeaderProps}
          />
          <div className="flex-1 p-4">
            <p className="lyra-body-sm text-lyra-fg-secondary">
              Left: {left.pinned ? "pinned" : "unpinned"}, {left.open ? "open" : left.previewing ? "previewing" : "closed"}. Right:{" "}
              {right.open ? "open" : "closed"}.
            </p>
          </div>
        </div>
        <SidePanel side="right" {...right.sidePanelProps} headerTitle="Details" className="focus:outline-none">
          <PanelForm />
        </SidePanel>
      </div>
    );
  },
};
