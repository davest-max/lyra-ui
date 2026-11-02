import type { Meta, StoryObj } from "@storybook/react";
import { useState, useRef, useEffect } from "react";
import { PanelLeft } from "lucide-react";
import { DashboardCard, type DashboardCardMetric } from "../dashboard-card";
import { TabList, Tab } from "../tabs";
import { PageHeader } from "../page-header";
import { Separator } from "../separator";
import { cn } from "../../lib/utils";
import { Input } from "../input";
import { Select } from "../select";
import { Textarea } from "../textarea";
import { Switch } from "../switch";
import { Checkbox } from "../checkbox";
import { RadioButtonGroup } from "../radio-button-group";
import { DatePicker } from "../date-picker";
import { PhoneInput } from "../phone-input";
import { InteriorPanel } from "../interior-panel";
import { SidePanel } from "../side-panel";
import { Button } from "../button";
import { Stepper } from "../stepper";

/* ── Foundations/Breakpoints ──
   A live reference for every responsive threshold in lyra-ui. Almost all
   of them are CSS *container* queries (`@container`), not `@media`
   queries — see the Overview story below for why that distinction
   matters here. Each demo wraps the REAL classes/components (not a
   reimplementation) in a `resize-x overflow-auto` dashed box — the same
   "drag the edge to see it collapse live" convention already used by
   `Tabs.stories.tsx`'s `OverflowMenuDemo` and `ChannelRow.stories.tsx`'s
   `ChannelTabResponsive` — so nothing here can silently drift from what
   the real components actually do. */

const meta: Meta = {
  title: "Foundations/Breakpoints",
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj;

/* ── Shared resize-box shell ── */
function ResizeBox({
  width = 900,
  children,
}: {
  width?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="resize-x overflow-auto rounded-lyra-md border border-dashed border-lyra-border-soft p-4"
      style={{ width, maxWidth: "100%" }}
    >
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   Overview
   ════════════════════════════════════════════════════ */

const REGISTRY = [
  { family: "Container Grid", wrap: ".lyra-container-grid-wrap", query: ".lyra-container-grid", thresholds: "991px, 768px (LYRA_CONTAINER_GRID_STACK_MAX_WIDTH)", usedBy: "AgentDashboard, DashboardQueue" },
  { family: "Form Grid", wrap: ".lyra-form-grid-wrap", query: ".lyra-form-grid", thresholds: "768px, 480px", usedBy: "FormTemplate" },
  { family: "Card Split", wrap: ".lyra-card-split-wrap", query: ".lyra-card-split", thresholds: "480px", usedBy: "DashboardCard children composition; agent-next-gen-v1's Customer Information Overview tab (fields list + Latest Interaction, via -even)" },
  { family: "Metric Row", wrap: ".lyra-metric-row-wrap", query: ".lyra-metric-row", thresholds: "768px, 550px, 360px", usedBy: "DashboardCard's metrics mode" },
  { family: "Tab Overflow", wrap: ".lyra-tab-overflow-wrap", query: ".lyra-tab-overflow-full / -collapsed", thresholds: "400px", usedBy: "TabList overflowMenu" },
  { family: "Stepper Compact", wrap: ".lyra-stepper-wrap", query: ".lyra-stepper-full / -compact / -column", thresholds: "480px", usedBy: "Stepper (horizontal, compact=\"auto\")" },
  { family: "Breadcrumb Collapse", wrap: ".lyra-page-header-breadcrumb-wrap", query: "-full / -collapsed", thresholds: "480px", usedBy: "PageHeader" },
  { family: "Container Header Actions Boundary", wrap: ".lyra-container-header-actions-wrap", query: "(boundary only — see the two families below)", thresholds: "480px", usedBy: "ContainerHeader actionsWrap prop" },
  { family: "Container Header Filter Collapse", wrap: ".lyra-container-header-actions-wrap", query: "-filter-full / -filter-compact / -filter-trigger", thresholds: "480px (same boundary as Actions Boundary above)", usedBy: "agent-next-gen-v1's DateFilterChip / ContactHistoryDateFilterChip" },
  { family: "Container Header Search Inline/Below", wrap: ".lyra-container-header-actions-wrap", query: "-search-inline / -search-below", thresholds: "480px (same boundary as Actions Boundary above)", usedBy: "agent-next-gen-v1's ContactHistoryCard (via ContainerHeader's tabs slot)" },
  { family: "Transcript Avatar Collapse", wrap: ".lyra-transcript-wrap", query: ".lyra-transcript-avatar", thresholds: "400px", usedBy: "agent-next-gen-v1's InteractionTranscript message bubbles" },
];

export const Overview: Story = {
  name: "Overview",
  render: () => (
    <div className="max-w-[1100px]">
      <div className="mb-8">
        <h2 className="lyra-heading-xl text-lyra-fg-default mb-1">Breakpoints</h2>
        <p className="lyra-body-lg text-lyra-fg-secondary max-w-[700px]">
          Almost every responsive threshold in lyra-ui is a CSS{" "}
          <span className="font-mono">@container</span> query, not a{" "}
          <span className="font-mono">@media</span> query — a plain{" "}
          <span className="font-mono">@media</span> query only reacts to the
          browser window resizing, so it can't catch a side panel or nav
          opening and shrinking a component's actual available width while
          the window itself stays the same size. A container query measures
          the nearest ancestor container element instead, so it reacts
          correctly either way. Every story below is a real component (or
          real utility class) wrapped in a draggable box — drag its right
          edge to see the collapse happen live, at the exact pixel
          thresholds listed here.
        </p>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-lyra-border-medium">
            <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Family</th>
            <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Wrapper class</th>
            <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Query class</th>
            <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Thresholds</th>
            <th className="py-2 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Used by</th>
          </tr>
        </thead>
        <tbody>
          {REGISTRY.map((r) => (
            <tr key={r.family} className="border-b border-lyra-border-subtle">
              <td className="py-3 pr-4 lyra-body-md-emphasis text-lyra-fg-default whitespace-nowrap">{r.family}</td>
              <td className="py-3 pr-4 lyra-body-md text-lyra-fg-disabled font-mono whitespace-nowrap">{r.wrap}</td>
              <td className="py-3 pr-4 lyra-body-md text-lyra-fg-action font-mono whitespace-nowrap">{r.query}</td>
              <td className="py-3 pr-4 lyra-body-md text-lyra-fg-secondary whitespace-nowrap">{r.thresholds}</td>
              <td className="py-3 lyra-body-md text-lyra-fg-secondary">{r.usedBy}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="lyra-body-sm text-lyra-fg-secondary mt-6 max-w-[700px]">
        Two other, structurally different cases exist outside this table —
        see the "Viewport Media Query" and "JS-Measured Thresholds" stories
        further down.
      </p>
    </div>
  ),
};

/* ════════════════════════════════════════════════════
   Container Grid — .lyra-container-grid-wrap / .lyra-container-grid
   ════════════════════════════════════════════════════ */

function PlaceholderCard({ label }: { label: string }) {
  return (
    <div className="flex h-24 flex-1 items-center justify-center rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-shell lyra-body-sm-emphasis text-lyra-fg-secondary">
      {label}
    </div>
  );
}

// Generic placeholder data reused from the Metric Row demo further below
// (defined there, referenced here — safe: by the time this story's `render`
// actually runs, the whole module has already finished evaluating, so the
// `const` further down the file is long since initialized). Kept as one
// shared dataset rather than a second copy so both demos show the exact
// same placeholder values.

function ContainerGridRow({
  count,
  showMetricRows,
  metricCount,
}: {
  count: number;
  showMetricRows: boolean;
  metricCount: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="lyra-body-sm-emphasis text-lyra-fg-secondary">{count} card{count > 1 ? "s" : ""}</span>
      <div className="lyra-container-grid-wrap">
        <div className="lyra-container-grid">
          {Array.from({ length: count }, (_, i) =>
            showMetricRows ? (
              <DashboardCard
                key={i}
                metrics={METRIC_ROW_DEMO_DATA.slice(0, metricCount)}
                metricVariant="contained"
              />
            ) : (
              <PlaceholderCard key={i} label={`Card ${i + 1}`} />
            )
          )}
        </div>
      </div>
    </div>
  );
}

interface ContainerGridArgs {
  /** Swap the plain placeholder cards for real `DashboardCard` metric rows —
   *  proves any card type, not just a generic placeholder, can sit in a
   *  `.lyra-container-grid` slot and stay independently responsive to its
   *  own width regardless of how the outer grid itself has collapsed. */
  showMetricRows: boolean;
  /** How many metrics each metric-row card shows (1-4). Only meaningful —
   *  and only shown as a control — when "Show metric rows" is on. */
  metricCount: number;
}

export const ContainerGrid: StoryObj<ContainerGridArgs> = {
  name: "Container Grid",
  argTypes: {
    showMetricRows: {
      name: "Show metric rows in card slots",
      control: "boolean",
    },
    metricCount: {
      name: "Metrics per row",
      control: { type: "range", min: 1, max: 4, step: 1 },
      if: { arg: "showMetricRows", truthy: true },
    },
  },
  args: {
    showMetricRows: false,
    metricCount: 3,
  },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <p className="lyra-body-sm text-lyra-fg-secondary">
        A row of summary cards (`AgentDashboard`'s Performance/Productivity
        row). Cards stay inline and evenly split the row regardless of how
        many there are — 6-up down to 1-up are all shown below at full
        width — collapsing to a 2-up grid at ≤991px, then a single column
        at ≤768px, for every count. Container Grid holds any card type —
        turn on "Show metric rows" below to swap the placeholders for real
        `DashboardCard` metric rows, and use "Metrics per row" to see each
        one stay independently responsive to its own card's width (its own
        `.lyra-metric-row-wrap` boundary — see the Metric Row story) no
        matter how the outer grid has collapsed around it.
      </p>
      <ResizeBox width={1100}>
        <div className="flex flex-col gap-6">
          {[6, 5, 4, 3, 2, 1].map((count) => (
            <ContainerGridRow
              key={count}
              count={count}
              showMetricRows={args.showMetricRows}
              metricCount={args.metricCount}
            />
          ))}
        </div>
      </ResizeBox>
    </div>
  ),
};

/* ════════════════════════════════════════════════════
   Form Grid — .lyra-form-grid-wrap / .lyra-form-grid
   ════════════════════════════════════════════════════ */

// Shared across every row, rendered once. Deliberately NOT `flex-grow`/
// `flex-shrink` based — a flex row divides ITS OWN leftover width among
// only the fields actually sitting in it, so a 4-field row and a 1-field
// row would land on different per-field sizes at the identical container
// width (the 1-field row has far more slack to grow into). Per "can all
// of the static fields shrink as the width shrinks so they are all the
// same size all the time?", every field instead gets an explicit `width`
// computed purely from the shared container's own inline size via `cqi`
// (1cqi = 1% of the nearest `container-type: inline-size` ancestor's
// width — here, that's each row's own `.lyra-form-grid-wrap`, which is
// always the same width as every other row's, since they're all full-
// width children of the same `ResizeBox`). Same formula everywhere means
// every field, in every row, is pixel-identical at any given width —
// never a function of how many fields happen to share that particular
// row.
//
// The field width is a STEPPED/sawtooth function of container width `C`,
// not one continuous ramp — four stages, one per "how many fields
// currently fit side by side" (4, 3, 2, then 1/full-width). Each stage's
// own `clamp(240px, ..., 320px)` is derived from "N fields, evenly
// filling the row": N fields + (N-1) 16px gaps filling a container of
// width C means each field is (C - (N-1)×16px) / N. Written as
// `calc((100cqi - Xpx) / N)` (100cqi = 100% of the container = C) so the
// formula reads as exactly that derivation. Substituting a stage's own
// formula back into "do N fields fit" (N×fieldWidth + (N-1)×16px vs. C)
// reduces to an identity — so within a stage's unclamped range, N fields
// fill the row with zero slack at every width, meaning the stage's floor
// (240px) lands at the EXACT container width where N fields stop
// fitting and the row wraps to N-1.
//
// That's what makes the transition between stages a snap back up to the
// next stage's ceiling (320px) rather than a continued flatline: at the
// pixel where N fields' floor-width no longer fits, the row wraps to
// N-1, and N-1 fields — now with a whole field's worth of gap-adjusted
// room to split between fewer of them — start out back at their own
// 320px ceiling, then shrink again as the container keeps narrowing,
// until THEIR floor is hit and the next wrap happens. Reported per "in
// the form grid static width when the fields go from 4 to 3 up as the
// screen resizes it doesn't seem like they are shrinking to the min
// width" (fixed once already with a single continuous 4-field-derived
// ramp — see PROJECT_SUMMARY.md) and then per "when the inputs drop and
// make space on resize the forms should go back to max-width and shrink
// until min-width and break again then snap back to max width when more
// space is made": a single ramp can only ever be tuned to make ONE
// wrap point (e.g. 4→3) shrink-then-wrap cleanly — every OTHER wrap
// point (3→2, 2→1) still lands wherever it lands on that same ramp,
// which is not guaranteed to be a floor-to-wrap match at all. A stepped
// function fixes every wrap point at once, each stage tuned to its own N.
//
//   Stage 4 (C ≥ 1008px): (100cqi - 48px) / 4 — ceiling 320px at
//     C=1328px, floor 240px at C=1008px (4×240+3×16=1008, exact).
//   Stage 3 (751px < C ≤ 1007px): (100cqi - 32px) / 3 — at C=1007px this
//     evaluates to ~325px, clamped to the 320px ceiling (the snap-back-
//     up), then ramps down to the 240px floor at C=752px (3×240+2×16=752,
//     exact).
//   Stage 2 (495px < C ≤ 751px): (100cqi - 16px) / 2 — snaps back to the
//     320px ceiling at C=751px, ramps down to the 240px floor at C=496px
//     (2×240+16=496, exact).
//   Stage 1 (C ≤ 495px): the lone field is guaranteed alone on its own
//     line (2×240px-floor fields no longer fit above 495px), so per "when
//     the forms go to one column make them full width" it stretches to
//     100% instead of snapping to a fifth stage's 320px ceiling — a
//     single field pinned to 320px in an otherwise-empty row still reads
//     as a bug, not as "make more room" the way the 2/3/4-across stages
//     read once fields are visibly filling the row edge-to-edge.
//
// Every stage is still driven purely by the shared container's own width
// via `cqi` (never a row's own field count), so — per "can all of the
// static fields shrink as the width shrinks so they are all the same
// size all the time?" — every field, in every row, is still
// pixel-identical at any given container width, regardless of how many
// fields that particular row actually has (a 2-field row cycles through
// the exact same four stages as the 4-field row, it just never needs its
// OWN wrap to happen in the stage-4/stage-3 ranges since 2 fields
// already comfortably fit there). `flex: 0 0 auto` so flexbox's own
// grow/shrink algorithm never fights these explicit widths; wrapping is
// still pure flex-wrap (below) — a row drops a field to the next line
// the moment its current fields' widths (whatever the active stage
// currently computes) no longer fit alongside each other.
const FORM_GRID_STATIC_FIELD_CSS = `
  .form-grid-static-field {
    flex: 0 0 auto;
    width: clamp(240px, calc((100cqi - 48px) / 4), 320px);
  }
  @container (max-width: 1007px) {
    .form-grid-static-field {
      width: clamp(240px, calc((100cqi - 32px) / 3), 320px);
    }
  }
  @container (max-width: 751px) {
    .form-grid-static-field {
      width: clamp(240px, calc((100cqi - 16px) / 2), 320px);
    }
  }
  @container (max-width: 495px) {
    .form-grid-static-field {
      width: 100%;
    }
  }
`;

// The field "slot" types available in the demo's "Field Type" control.
// `input` matches the original fake placeholder's look-and-feel (a real
// `Input` renders identically: label above, single bordered field below).
// The rest are real lyra-ui form components — each already accepts a
// `label` prop, so a single `label` slot value (e.g. "First Name") works
// unchanged across every type, letting one control re-render all rows'
// fields as any of them without touching row/count logic at all.
type FormFieldType =
  | "input"
  | "select"
  | "textarea"
  | "switch"
  | "checkbox"
  | "radio-group"
  | "date-picker"
  | "phone-input";

const FIELD_TYPE_OPTIONS: { value: FormFieldType; label: string }[] = [
  { value: "input", label: "Input Field" },
  { value: "select", label: "Select" },
  { value: "textarea", label: "Text Area" },
  { value: "switch", label: "Switch" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio-group", label: "Radio Group" },
  { value: "date-picker", label: "Date Picker" },
  { value: "phone-input", label: "Phone Input" },
];

// Sample option lists for the two components that need one.
const FIELD_SELECT_OPTIONS = [
  { value: "opt-1", label: "Option 1" },
  { value: "opt-2", label: "Option 2" },
  { value: "opt-3", label: "Option 3" },
];
const FIELD_RADIO_OPTIONS = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
];

function PlaceholderField({
  label,
  staticWidth,
  fieldType = "input",
}: {
  label: string;
  staticWidth?: boolean;
  fieldType?: FormFieldType;
}) {
  // Every real component below owns its own label rendering, so the slot
  // wrapper here only carries the width/flex behavior (240-320px bounded
  // for Static Width vs. stretch-to-fill otherwise) — no more hand-drawn
  // label + empty box.
  let field: React.ReactNode;
  switch (fieldType) {
    case "select":
      field = <Select label={label} placeholder="Select..." options={FIELD_SELECT_OPTIONS} />;
      break;
    case "textarea":
      field = <Textarea label={label} rows={2} />;
      break;
    case "switch":
      field = <Switch label={label} />;
      break;
    case "checkbox":
      field = <Checkbox label={label} />;
      break;
    case "radio-group":
      field = <RadioButtonGroup label={label} options={FIELD_RADIO_OPTIONS} orientation="horizontal" />;
      break;
    case "date-picker":
      field = <DatePicker label={label} />;
      break;
    case "phone-input":
      field = <PhoneInput label={label} />;
      break;
    case "input":
    default:
      field = <Input label={label} placeholder={label} />;
      break;
  }

  return (
    <div className={staticWidth ? "form-grid-static-field" : "flex-1"}>
      {field}
    </div>
  );
}

const FORM_GRID_DEMO_FIELDS = ["First Name", "Last Name", "Email", "Phone"];

function FormGridRow({
  count,
  staticWidth,
  fieldType,
}: {
  count: number;
  staticWidth?: boolean;
  fieldType?: FormFieldType;
}) {
  // Still the real `.lyra-form-grid` class/wrap (so every row shares the
  // exact same real breakpoints, per the prior fix — no per-row custom
  // collapse width). But at the real ≤768px stage, `.lyra-form-grid`
  // itself switches to `display: grid; grid-template-columns: repeat(2,
  // minmax(0, 1fr))` — two EVENLY divided tracks. A 240-320px-bounded
  // field sitting left-aligned in a much wider track (however wide half
  // the row happens to be) leaves a large reserved gap before the next
  // track starts, which reads as an unintended "justify-content:
  // space-between" even though nothing is actually set to that — it's
  // just bounded-width content in variable-width tracks. Reported via
  // screenshot: "it doesn't place them directly inline ... they should
  // retain their position as the container gets smaller until they do not
  // have space then go to the next line" — i.e. pure flex-wrap reflow the
  // whole way, never switching to a grid-track layout at all. Fixed with
  // an inline `style` override (wins over any class regardless of
  // container-query specificity) that pins `display`/`flexDirection`/
  // `flexWrap` for the static case only, so fields wrap purely based on
  // their own min/max width + gap vs. whatever room is actually left,
  // continuously, rather than snapping into evenly-divided tracks at
  // 768px or a forced column at 480px.
  return (
    <div className="flex flex-col gap-1.5">
      <span className="lyra-body-sm-emphasis text-lyra-fg-secondary">{count} field{count > 1 ? "s" : ""}</span>
      <div className="lyra-form-grid-wrap">
        <div
          className={cn("lyra-form-grid", staticWidth && "items-start")}
          style={staticWidth ? { display: "flex", flexDirection: "row", flexWrap: "wrap" } : undefined}
        >
          {FORM_GRID_DEMO_FIELDS.slice(0, count).map((label) => (
            <PlaceholderField key={label} label={label} staticWidth={staticWidth} fieldType={fieldType} />
          ))}
        </div>
      </div>
    </div>
  );
}

export const FormGrid: Story = {
  name: "Form Grid",
  args: {
    staticWidth: false,
    fieldType: "input" as FormFieldType,
  },
  argTypes: {
    staticWidth: { name: "Static Width", control: "boolean" },
    fieldType: {
      name: "Field Type",
      control: "select",
      options: FIELD_TYPE_OPTIONS.map((o) => o.value),
    },
  },
  render: (args) => {
    const staticWidth = (args as { staticWidth?: boolean }).staticWidth ?? false;
    const fieldType = (args as { fieldType?: FormFieldType }).fieldType ?? "input";
    return (
      <div className="flex flex-col gap-4">
        {staticWidth && <style>{FORM_GRID_STATIC_FIELD_CSS}</style>}
        <p className="lyra-body-sm text-lyra-fg-secondary">
          `FormTemplate`'s field grid — the same two-stage collapse as
          Container Grid, but its own narrower thresholds: 2-up at ≤768px,
          single column at ≤480px. 4-up down to 1-up are all shown below at
          full width. Each field is a real, swappable lyra-ui component —
          use "Field Type" to render every slot as an Input, Select, Text
          Area, Switch, Checkbox, Radio Group, Date Picker, or Phone Input.
          "Static Width" keeps every field between a 320px ceiling and a
          240px floor — and every field is exactly the same size at any
          given width, regardless of which row it's in or how many fields
          that row happens to have (a size based on how many fields share
          a row would size a lone field very differently than one of
          four). Rather than one continuous shrink, sizing runs as four
          stages — one per "how many fields currently fit side by side"
          (4/3/2/1) — each ramping from the 320px ceiling down to the
          240px floor as the row narrows, snapping back UP to the 320px
          ceiling the instant a field drops to the next line (there's now
          one fewer field splitting the same space), then shrinking again
          until the next drop. Fields hold their position and wrap onto
          the next line purely once they no longer fit at their current
          shared size, rather than snapping into the 2-up/1-up grid stages
          the stretchy fields above use. Once the row is too narrow to fit
          two fields at their 240px floor (≤495px), every field is
          necessarily alone on its own line — at that point it stretches
          to fill the full row width instead of snapping back to a 320px
          ceiling with nothing left to size against.
        </p>
        <ResizeBox width={1100}>
          <div className="flex flex-col gap-6">
            {[4, 3, 2, 1].map((count) => (
              <FormGridRow key={count} count={count} staticWidth={staticWidth} fieldType={fieldType} />
            ))}
          </div>
        </ResizeBox>
      </div>
    );
  },
};

/* ════════════════════════════════════════════════════
   Card Split — .lyra-card-split-wrap / .lyra-card-split
   ════════════════════════════════════════════════════ */

export const CardSplit: Story = {
  name: "Card Split",
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="lyra-body-sm text-lyra-fg-secondary">
        A `DashboardCard` body split into a fixed stat column beside a
        chart/empty-state region — row layout by default, stacking to a
        column (divider hidden) at ≤480px.
      </p>
      <ResizeBox width={600}>
        <div className="lyra-card-split-wrap">
          <div className="lyra-card-split">
            <div className="lyra-card-split-fixed flex flex-col gap-3">
              <PlaceholderCard label="Stat A" />
              <PlaceholderCard label="Stat B" />
            </div>
            <Separator orientation="vertical" className="lyra-card-split-divider h-auto self-stretch" />
            <div className="lyra-card-split-chart flex items-center justify-center rounded-lyra-lg border border-dashed border-lyra-border-subtle text-lyra-fg-disabled lyra-body-sm">
              Chart area
            </div>
          </div>
        </div>
      </ResizeBox>
    </div>
  ),
};

/* ════════════════════════════════════════════════════
   Metric Row — .lyra-metric-row-wrap / .lyra-metric-row (real DashboardCard)
   ════════════════════════════════════════════════════ */

// Generic placeholder data — plain number + subhead, no trend/sparkline —
// so the demo below isolates the row's own count-collapse behavior
// (4-up/3-up/2-up/1-up) from the separate sparkline-relocation stage (which
// only applies when a metric actually has `sparkline` data; see the real
// `DashboardCard` "Divided"/"Contained" stories for that in context).
const METRIC_ROW_DEMO_DATA: DashboardCardMetric[] = [
  { value: 70, label: "Subhead" },
  { value: 10, label: "Subhead" },
  { value: 58, label: "Subhead" },
  { value: 2, label: "Subhead" },
];

function MetricRowDemoRow({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="lyra-body-sm-emphasis text-lyra-fg-secondary">{count}-up</span>
      <DashboardCard
        metrics={METRIC_ROW_DEMO_DATA.slice(0, count)}
        metricVariant="contained"
        className="w-full border-0 bg-transparent shadow-none"
      />
    </div>
  );
}

export const MetricRow: Story = {
  name: "Metric Row (Dashboard Card)",
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="lyra-body-sm text-lyra-fg-secondary">
        `DashboardCard`'s `metrics` mode, "contained" variant (each metric in
        its own bordered box) — three ordered stages as it narrows: ≤768px
        moves any sparkline below its text (not shown here — these use plain
        generic numbers/subheads with no sparkline data), ≤550px becomes a
        2-up grid, ≤360px drops to a single column. 4-up, 3-up, 2-up, and
        1-up are shown below at full width. This is the real `DashboardCard`
        component — its own `.lyra-metric-row-wrap` boundary is applied
        internally.
      </p>
      <ResizeBox>
        <div className="flex flex-col gap-6">
          {[4, 3, 2, 1].map((count) => (
            <MetricRowDemoRow key={count} count={count} />
          ))}
        </div>
      </ResizeBox>
    </div>
  ),
};

/* ════════════════════════════════════════════════════
   Tab Overflow — .lyra-tab-overflow-wrap (real TabList overflowMenu)
   ════════════════════════════════════════════════════ */

const OVERFLOW_TABS = ["Overview", "Details", "Tickets", "Accounts", "Interactions", "Directory", "History"];

function TabOverflowDemo() {
  const [active, setActive] = useState(OVERFLOW_TABS[0]);
  return (
    <TabList overflowMenu aria-label="Overflow demo tabs">
      {OVERFLOW_TABS.map((label) => (
        <Tab key={label} active={active === label} onClick={() => setActive(label)}>
          {label}
        </Tab>
      ))}
    </TabList>
  );
}

export const TabOverflow: Story = {
  name: "Tab Overflow Menu",
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="lyra-body-sm text-lyra-fg-secondary">
        `TabList overflowMenu="wide"` (the default) — the real `TabList`
        component, `.lyra-tab-overflow-wrap` applied internally. At ≤400px
        the whole row collapses to exactly two full-width slots: the active
        tab, and a "N More" dropdown holding every other tab in order.
      </p>
      <ResizeBox>
        <TabOverflowDemo />
      </ResizeBox>
    </div>
  ),
};

/* ════════════════════════════════════════════════════
   Breadcrumb Collapse — .lyra-page-header-breadcrumb-wrap (real PageHeader)
   ════════════════════════════════════════════════════ */

export const BreadcrumbCollapse: Story = {
  name: "Breadcrumb Collapse",
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="lyra-body-sm text-lyra-fg-secondary">
        `PageHeader`'s breadcrumb slot — below ≤480px of the slot's own
        width, every parent crumb collapses behind a single ellipsis
        trigger (its popover lists them all) so the current-page title
        truncates on one line instead of the trail wrapping onto a second.
      </p>
      <ResizeBox width={560}>
        <div className="rounded-lyra-md border border-lyra-border-subtle overflow-hidden">
          <PageHeader
            title="This is a very long parent name that needs to truncate"
            breadcrumb={[
              { label: "Dashboards" },
              { label: "Sales" },
              { label: "Q3 Reports" },
            ]}
          />
        </div>
      </ResizeBox>
    </div>
  ),
};

/* ════════════════════════════════════════════════════
   Stepper Compact — .lyra-stepper-wrap (real Stepper)
   ════════════════════════════════════════════════════ */

export const StepperCompact: Story = {
  name: "Stepper Compact",
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="lyra-body-sm text-lyra-fg-secondary">
        A horizontal `Stepper` — at ≤480px of its own container's width, the
        numbered row of steps swaps for a one-line summary (the current
        step's title, "Step 2 of 4") and a segmented progress bar. The full
        list stays in the page, visually hidden, for screen readers.
      </p>
      <ResizeBox width={620}>
        <Stepper
          aria-label="Setup progress"
          steps={[
            { title: "Tenant setup" },
            { title: "Prepare tenant access" },
            { title: "Create employee access" },
            { title: "Verify" },
          ]}
          currentStep={1}
          fill
        />
      </ResizeBox>
    </div>
  ),
};

/* ════════════════════════════════════════════════════
   Viewport media query — the one real `@media` breakpoint in the library
   ════════════════════════════════════════════════════ */

export const ViewportMediaQuery: Story = {
  name: "Viewport Media Query (TransferBox)",
  parameters: {
    docs: {
      description: {
        story:
          "TransferBox is the one component in lyra-ui using a real viewport @media query (Tailwind's `md:`, @media (min-width: 768px)) instead of a container query — it switches its two-list-plus-arrows layout from a column stack to a row arrangement at that width. Because this reacts to the actual browser viewport, not a container's own width, it CANNOT be demonstrated with a resize-x box the way every other story on this page is — dragging a box's edge has no effect on it. To see it collapse, shrink the Storybook preview panel itself (or use the toolbar's Viewport addon) below 768px.",
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="lyra-body-sm text-lyra-fg-secondary max-w-[700px]">
        Unlike every other story on this page, this one is NOT driven by a
        container query — it's a real{" "}
        <span className="font-mono">@media (min-width: 768px)</span> (Tailwind's
        `md:`) on `TransferBox`. A resize-x box can't demonstrate it, since it
        only reacts to the actual browser viewport, not a wrapping div's
        width. Shrink the Storybook preview panel itself below 768px (or use
        the toolbar's Viewport addon) to see its layout switch from a row of
        two lists to a stacked column.
      </p>
      <div className="rounded-lyra-md border border-dashed border-lyra-border-soft p-4 lyra-body-sm text-lyra-fg-secondary">
        See <span className="font-mono">Custom Primitives/TransferBox</span> for
        the live component.
      </div>
    </div>
  ),
};

/* ════════════════════════════════════════════════════
   JS-measured thresholds — ResizeObserver, not CSS at all
   ════════════════════════════════════════════════════ */

function useMeasuredWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(9999);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** The REAL `InteriorPanel` component, unlike the two `SidePanelPinGuardDemo`
 *  stand-ins below — it renders standalone with no extra shell context
 *  needed, so there's no reason to reproduce its logic separately. It
 *  measures its own PARENT element's width via `ResizeObserver` (`isNarrow
 *  = parentWidth < 1024`, see interior-panel.tsx) rather than a
 *  `@container` query: above 1024px it's a normal inline flex child
 *  squeezing the content column; below it, `position: absolute; top: 0;
 *  height: 100%` overlays the content instead. 1024px — not a separate
 *  value — deliberately matches `SidePanel`'s own pin-guard threshold below
 *  (previously 1050px here), so every panel in the system reacts to the
 *  same pixel width. The wrapping row needs its own `relative` for that
 *  overlay to stay confined here rather than escaping to the next
 *  positioned ancestor up the tree (or the viewport, absent one) — see
 *  `InteriorPanel.stories.tsx` and PROJECT_SUMMARY.md for the bug this
 *  caused when a story was missing it, and `admin-shell.tsx`'s own
 *  "Interior panels row" comment for the same guard in the real shell. */
function InteriorPanelDemo() {
  const [open, setOpen] = useState(true);
  return (
    <div className="relative flex h-[320px] overflow-hidden rounded-lyra-lg border border-lyra-border-subtle">
      <div className="flex flex-1 flex-col items-start gap-3 p-4">
        <Button onClick={() => setOpen((v) => !v)}>Toggle Panel</Button>
        <p className="lyra-body-sm text-lyra-fg-secondary">Main content column.</p>
      </div>
      <InteriorPanel side="right" open={open} headerTitle="Details" onClose={() => setOpen(false)}>
        <div className="p-4">
          <p className="lyra-body-md text-lyra-fg-secondary">Panel content goes here.</p>
        </div>
      </InteriorPanel>
    </div>
  );
}

/** The REAL `SidePanel` component — not a reproduction. `AdminShell` and the
 *  "Agent Next Gen" template each wrap this exact same primitive with their
 *  own "container-width pin guard" (measure own width via `ResizeObserver`,
 *  force `pinned` to `false` and hide the pin button below a threshold),
 *  both at 1024px — deliberately the same value, not two independent
 *  constants for what's meant to be identical responsiveness behavior (see
 *  admin-shell.tsx's and AgentNextGenTemplate.stories.tsx's own copies of
 *  this guard; Agent Next Gen's was previously 768px, unified to 1024px).
 *  Neither real component is reasonably embeddable here, though:
 *  `AdminShell` needs a `storageKeyPrefix`/nav tree/cookie plumbing, and the
 *  "Agent Next Gen" template isn't even an exported component — it's a
 *  ~1000-line function defined inside `AgentNextGenTemplate.stories.tsx`
 *  itself (interaction list, channel tabs, AI panel, notifications, ...),
 *  not something to duplicate here. This demo reproduces just their shared
 *  guard logic, but wires it to the real `SidePanel` — same pin button
 *  disappearing, same forced-unpinned overlay behavior — rather than a
 *  plain colored box standing in for it. See `AdminShell.stories.tsx` and
 *  `AgentNextGenTemplate.stories.tsx` for the two real pages in full
 *  context. */
function SidePanelPinGuardDemo({ threshold, label }: { threshold: number; label: string }) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>();
  const isNarrow = width < threshold;
  const [pinned, setPinned] = useState(true);
  const [hoverOpen, setHoverOpen] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>();
  // `pinned` itself is deliberately left untouched by `isNarrow` — only the
  // RENDERED value (`effectivePinned`) is overridden while narrow, so
  // widening back out above the threshold naturally restores the pinned
  // state instead of requiring a fresh manual re-pin. Per "I wanted it to
  // [the real apps] go behave like the storybook" — this auto-restore is
  // the desired shared behavior, not the "stays unpinned" behavior a
  // previous pass here mistakenly matched to the (also since-reverted)
  // real components. See admin-shell.tsx's "Container-width pin guard" for
  // the corrected real equivalent.
  const effectivePinned = isNarrow ? false : pinned;
  const open = effectivePinned || hoverOpen;

  const onHoverStart = () => {
    clearTimeout(hoverTimer.current);
    setHoverOpen(true);
  };
  const onHoverEnd = () => {
    hoverTimer.current = setTimeout(() => setHoverOpen(false), 300);
  };

  return (
    <div ref={ref} className="relative flex h-40 overflow-hidden rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-base">
      <SidePanel
        side="left"
        open={open}
        pinned={effectivePinned}
        onPinToggle={isNarrow ? undefined : () => setPinned((v) => !v)}
        headerTitle={label}
        width={220}
        onMouseEnter={!effectivePinned ? onHoverStart : undefined}
        onMouseLeave={!effectivePinned ? onHoverEnd : undefined}
      />
      <div className="flex flex-1 flex-col items-start justify-center gap-2 p-4">
        {/* Same trigger real pages give the unpinned case — a hover-to-
            reveal icon button (PageHeader's own `panelToggle`, unpinned
            branch) — rather than hovering the content area itself. */}
        {!effectivePinned && (
          <button
            onMouseEnter={onHoverStart}
            onMouseLeave={onHoverEnd}
            className="flex h-8 w-8 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary transition-colors hover:bg-lyra-state-hover"
            aria-label="Hover to reveal panel"
          >
            <PanelLeft className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
          </button>
        )}
        <span className="lyra-body-sm text-lyra-fg-secondary">
          Measured width: {Math.round(width)}px —{" "}
          {isNarrow
            ? `pin disabled, hover the icon to reveal (< ${threshold}px)`
            : `pinned (≥ ${threshold}px) — click the pin icon to unpin`}
        </span>
      </div>
    </div>
  );
}

export const JsMeasuredThresholds: Story = {
  name: "JS-Measured Thresholds",
  render: () => (
    <div className="flex flex-col gap-6">
      <p className="lyra-body-sm text-lyra-fg-secondary max-w-[700px]">
        Three components measure their own rendered width with
        `ResizeObserver` and React state instead of a CSS container query —
        all three now share the same 1024px threshold, deliberately, rather
        than each picking its own nearby value. `InteriorPanel` measures
        its own PARENT element's width, switching from a normal inline flex
        child to a `position: absolute` overlay below 1024px (previously
        1050px) — shown below as the real component (it renders
        standalone, so there's no reason to reproduce it separately). The
        other two are the real `SidePanel` component wired to the exact
        "container-width pin guard" `AdminShell` and the "Agent Next Gen"
        template each apply to it: below 1024px, `pinned` is forced to
        `false` and the pin button disappears entirely, falling back to
        hover-to-reveal — widening back out above it restores the pinned
        state automatically, rather than requiring a manual re-pin.
        `AdminShell`'s real guard has always used 1024px; the "Agent Next
        Gen" template's own copy (`AgentNextGenTemplate.stories.tsx`, which
        isn't a standalone exported component, so it's not embeddable here
        directly) previously used 768px, unified per "the side panel
        components for admin and agent should functionally be the same ...
        from a responsiveness perspective they should not be different."
        Drag each box's edge to see it flip; use "Toggle Panel" on the
        first one to open/close it, the pin icon on the other two to
        pin/unpin, and hover the panel-toggle icon to reveal them when
        unpinned.
      </p>
      <div className="flex flex-col gap-4">
        <ResizeBox width={1200}>
          <InteriorPanelDemo />
        </ResizeBox>
        <ResizeBox width={1200}>
          <SidePanelPinGuardDemo threshold={1024} label="AdminShell (real threshold: 1024px)" />
        </ResizeBox>
        <ResizeBox width={1200}>
          <SidePanelPinGuardDemo threshold={1024} label='"Agent Next Gen" template (real threshold: 1024px)' />
        </ResizeBox>
      </div>
    </div>
  ),
};
