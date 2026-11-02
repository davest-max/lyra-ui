import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../button";
import { InteriorPanel } from "../interior-panel";
import { InfoIcon } from "../icons/info-icon";
import { PanelForm, PanelFrame, PanelTabs, panelFooter } from "./InteriorPanel.shared";

/* One page per InteriorPanel scenario, shown under "InteriorPanel/Variants"
   in the sidebar. Static references for design review; the interactive
   playground is InteriorPanel → Default (which also covers the app-level
   "In-Contact" overlay setup via its "Cover page header" control).
   "!autodocs" keeps this folder from getting a second Docs page. The four stories paired with Sol's Panel in
   lyra-sol-compare (Right, WithFullScreen, WithTabs, Left) stay in
   InteriorPanel.stories.tsx unchanged. */
const meta: Meta<typeof InteriorPanel> = {
  title: "Custom Primitives/InteriorPanel/Variants",
  component: InteriorPanel,
  tags: ["!autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
};

export default meta;
type Story = StoryObj<typeof InteriorPanel>;

export const States: Story = {
  name: "States (Open, Closed, Side, Resizable)",
  render: () => (
    <div className="grid grid-cols-2 gap-6 max-w-5xl">
      <PanelFrame label="Open — right (default)">
        <InteriorPanel side="right" open headerTitle="Open" onClose={() => {}}>
          <PanelForm />
        </InteriorPanel>
      </PanelFrame>
      <PanelFrame label="Open — left" side="left">
        <InteriorPanel side="left" open headerTitle="Left" onClose={() => {}}>
          <PanelForm />
        </InteriorPanel>
      </PanelFrame>
      <PanelFrame label="Closed (open=false)">
        <InteriorPanel side="right" open={false} headerTitle="Closed" onClose={() => {}}>
          <PanelForm />
        </InteriorPanel>
      </PanelFrame>
      <PanelFrame label="Not resizable (resizable=false)">
        <InteriorPanel side="right" open resizable={false} headerTitle="Fixed width" onClose={() => {}}>
          <PanelForm />
        </InteriorPanel>
      </PanelFrame>
    </div>
  ),
};

export const HeaderAndFooter: Story = {
  name: "Header and Footer Options",
  render: () => (
    <div className="grid grid-cols-2 gap-6 max-w-5xl">
      <PanelFrame label="Subtitle and icon">
        <InteriorPanel
          open
          headerTitle="Customer Information"
          headerSubhead="Noah Bennett · CST-10296"
          headerIcon={<InfoIcon className="h-5 w-5" />}
          onClose={() => {}}
        >
          <PanelForm />
        </InteriorPanel>
      </PanelFrame>
      <PanelFrame label="Tabs in header">
        <InteriorPanel open headerTitle="Customer Information" headerTabs={<PanelTabs />} onClose={() => {}}>
          <PanelForm />
        </InteriorPanel>
      </PanelFrame>
      <PanelFrame label="Footer">
        <InteriorPanel open headerTitle="With footer" footer={panelFooter} onClose={() => {}}>
          <PanelForm />
        </InteriorPanel>
      </PanelFrame>
      <PanelFrame label="Full screen button">
        <InteriorPanel open headerTitle="Wide Report" allowFullScreen onClose={() => {}}>
          <PanelForm />
        </InteriorPanel>
      </PanelFrame>
    </div>
  ),
};

/** `defaultFullScreen` + `onFullScreenChange`: a consumer that remounts the panel per context (one slide-over per
 *  assignment) keeps each one's full-screen state and brings it back in it. Toggle full screen on A, switch to B and
 *  back: A comes back full-screen, B as it was left. */
function RememberedFullScreen() {
  const [context, setContext] = React.useState<"A" | "B">("A");
  const [fullScreenBy, setFullScreenBy] = React.useState<Record<string, boolean>>({});
  return (
    <div className="flex flex-col gap-3 max-w-3xl">
      <div className="flex gap-2">
        {(["A", "B"] as const).map((c) => (
          <Button key={c} variant={c === context ? "default" : "outline"} onClick={() => setContext(c)}>
            {`Assignment ${c}`}
          </Button>
        ))}
      </div>
      <PanelFrame label={`Assignment ${context} · full screen: ${fullScreenBy[context] ? "on" : "off"}`}>
        <InteriorPanel
          key={context}
          open
          headerTitle={`Assignment ${context}`}
          allowFullScreen
          defaultFullScreen={!!fullScreenBy[context]}
          onFullScreenChange={(on) => setFullScreenBy((prev) => ({ ...prev, [context]: on }))}
          onClose={() => {}}
        >
          <PanelForm />
        </InteriorPanel>
      </PanelFrame>
    </div>
  );
}

export const FullScreenRemembered: Story = {
  name: "Full Screen Remembered per Context",
  render: () => <RememberedFullScreen />,
};

/** `containerWidth`: a panel inside a `display: contents` host (so it lays out as a flex item of the row around it,
 *  as a portaled panel does) measures a parent of 0 — "narrow", and any drag past 90% of 0 would go full screen. Given
 *  the row's width instead, it docks beside the content and resizes normally. */
function ContainerWidthDemo() {
  const rowRef = React.useRef<HTMLDivElement>(null);
  const [rowWidth, setRowWidth] = React.useState<number>();
  React.useLayoutEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    setRowWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setRowWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={rowRef} className="relative flex h-[420px] max-w-4xl overflow-hidden rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-base">
      <div className="flex-1 min-w-0 p-6 lyra-body-md text-lyra-fg-secondary">The page column</div>
      {/* Mounted once the row's width is known, so the panel never measures its 0-wide host. */}
      {rowWidth !== undefined && rowWidth > 0 && (
      <div style={{ display: "contents" }}>
        <InteriorPanel
          open
          headerTitle="Docked beside the column"
          containerWidth={rowWidth}
          absoluteBreakpoint={0}
          resizable
          allowFullScreen
          autoFullScreen
          onClose={() => {}}
        >
          <PanelForm />
        </InteriorPanel>
      </div>
      )}
    </div>
  );
}

export const ContainerWidth: Story = {
  name: "Container Width (portaled host)",
  render: () => <ContainerWidthDemo />,
};
