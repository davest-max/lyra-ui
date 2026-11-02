import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { PhoneCall, MessageCircle, Mail, MessageSquare, Phone, Plus, ChevronRight, ChevronDown, Check, ContactRound } from "lucide-react";
import { PageHeader } from "../page-header";
import { Button } from "../button";
import { Link } from "../link";
import { Avatar } from "../avatar";
import { Badge } from "../badge";
import { Tag, type TagVariant } from "../tag";
import { MenuRadix } from "../menu-radix";
import { Tab, TabList } from "../tabs";
import { WhatsAppIcon } from "../channel-row";
import { AiIcon } from "../icons/ai-icon";
import { cn } from "../../lib/utils";

/* Interactive playground for PageHeader. Every layout, panel-toggle and record-header example lives
   on the Variants page (UI/PageHeader/Variants).

   The Agent layout is the agent record header (avatar, channel buttons, Contact Details, session
   details); the Admin layout is the standard page header with its buttons. Everything beyond
   PageHeader's own props (channel buttons, outcome, session details row) is composed here so you can
   try a look before moving it into an app. */

type LayoutOption = "agent" | "admin";
type ChannelOption = "Chat" | "Voice" | "Email" | "WhatsApp" | "SMS";

interface PageHeaderDemoProps {
  layout?: LayoutOption;
  title?: string;
  showAvatar?: boolean;
  showAvatarStatus?: boolean;
  showBreadcrumb?: boolean;
  breadcrumbTrail?: string;
  breadcrumbLinks?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  showSubtitleLink?: boolean;
  subtitleLinkText?: string;
  badge?: string;
  badgeColor?: string;
  badgeVariant?: "subtle" | "solid";
  titleSize?: "lg" | "2xl";
  bordered?: boolean;
  compact?: boolean;
  iconDivider?: boolean;
  panelToggle?: "none" | "left" | "right" | "both";
  showActions?: boolean;
  channel?: ChannelOption;
  showChannelButtons?: boolean;
  showOutcome?: boolean;
  outcomeChip?: string;
}

const CHANNELS: { name: ChannelOption; icon: React.ReactNode }[] = [
  { name: "Chat", icon: <MessageCircle className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> },
  { name: "Voice", icon: <Phone className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> },
  { name: "Email", icon: <Mail className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> },
  { name: "WhatsApp", icon: <WhatsAppIcon className="h-4 w-4" /> },
  { name: "SMS", icon: <MessageSquare className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> },
];

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

/** Separator used between the pieces of the subtitle line. */
const Sep = () => <span className="h-4 w-px shrink-0 bg-lyra-border-strong" aria-hidden="true" />;

function SubtitleLine({
  channel,
  text,
  link,
}: {
  /** Agent layout only: the channel icon and name at the start of the line. */
  channel?: ChannelOption;
  text: string;
  /** Link label, or undefined for no link. */
  link?: string;
}) {
  const ch = CHANNELS.find((c) => c.name === channel);
  return (
    <span className="flex min-w-0 items-center gap-3 lyra-body-sm text-lyra-fg-secondary">
      {ch && (
        <>
          <span className="inline-flex shrink-0 items-center gap-1.5">
            {channel === "Voice" ? <PhoneCall className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> : ch.icon}
            {ch.name}
          </span>
          {text && <Sep />}
        </>
      )}
      {text && <span className="truncate">{text}</span>}
      {link && (
        <>
          {(text || ch) && <Sep />}
          <Link size="sm" className="inline-flex shrink-0 items-center gap-1">
            {link}
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </>
      )}
    </span>
  );
}

function ChannelButtons({ selected }: { selected: ChannelOption }) {
  // The "+" leads and the buttons run right-to-left, ending next to Contact Details.
  const list = [...CHANNELS].reverse();
  return (
    <span className="flex items-center gap-1.5">
      <Button variant="ghost" size="icon-md" title="Add Channel">
        <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
      </Button>
      {list.map((c) => (
        <Button
          key={c.name}
          variant="outline"
          size="icon-md"
          title={c.name}
          aria-label={c.name}
          aria-pressed={c.name === selected}
          className={cn(
            c.name === selected && "border-lyra-border-active bg-lyra-bg-active-subtle text-lyra-fg-action hover:bg-lyra-bg-active-subtle"
          )}
        >
          {c.icon}
        </Button>
      ))}
    </span>
  );
}

const STATUS_OPTIONS: { label: string; variant: TagVariant; dotColor: string }[] = [
  { label: "Open", variant: "warning", dotColor: "var(--lyra-color-status-warning-strong)" },
  { label: "Pending", variant: "info", dotColor: "var(--lyra-color-status-info-strong)" },
  { label: "Escalated", variant: "purple", dotColor: "var(--lyra-color-accent-purple-strong)" },
  { label: "Resolved", variant: "success", dotColor: "var(--lyra-color-status-success-strong)" },
  { label: "Closed", variant: "critical", dotColor: "var(--lyra-color-status-critical-strong)" },
];

function OutcomeGroup({ chip }: { chip: string }) {
  // The chip is a Tag that opens a status menu. The picked status is local to the demo; the control sets the starting one.
  const [status, setStatus] = React.useState(chip);
  React.useEffect(() => setStatus(chip), [chip]);
  const variant = STATUS_OPTIONS.find((o) => o.label === status)?.variant ?? "neutral";
  return (
    <span className="inline-flex items-center gap-3">
      <Button variant="ghost" size="sm" className="text-lyra-fg-default">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-lyra-bg-primary text-lyra-fg-on-primary" aria-hidden="true">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </span>
        Outcome
      </Button>
      {chip && (
        <MenuRadix
          align="end"
          modal={false}
          items={STATUS_OPTIONS.map((o) => ({
            id: o.label,
            label: o.label,
            icon: <span aria-hidden="true" className="block h-2 w-2 rounded-full" style={{ backgroundColor: o.dotColor }} />,
            active: o.label === status,
            onClick: () => setStatus(o.label),
          }))}
          trigger={
            <button
              type="button"
              aria-label={`Status: ${status}. Change status`}
              className="rounded-lyra-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
            >
              <Tag label={status} variant={variant} trailingIcon={<ChevronDown className="h-3 w-3" strokeWidth={1.5} />} />
            </button>
          }
        />
      )}
    </span>
  );
}

function PageHeaderDemo({
  layout = "agent",
  title = "Lucas Thomas",
  showAvatar = true,
  showAvatarStatus = true,
  showBreadcrumb = false,
  breadcrumbTrail = "Dashboards, Sales",
  breadcrumbLinks = false,
  showSubtitle = true,
  subtitle = "(282) 283-7606 · # CTX-20261021-63785",
  showSubtitleLink = true,
  subtitleLinkText = "Session Details",
  badge = "",
  badgeColor = "green",
  badgeVariant = "subtle",
  titleSize = "lg",
  bordered = true,
  compact = false,
  iconDivider = false,
  panelToggle = "none",
  showActions = true,
  channel = "Voice",
  showChannelButtons = true,
  showOutcome = true,
  outcomeChip = "Open",
}: PageHeaderDemoProps) {
  const agent = layout === "agent";
  // The Agent layout always shows the session details row under the header; the Admin layout never does.
  const row = agent;
  const link = showSubtitleLink ? subtitleLinkText : undefined;
  // Comma-separated labels become the parent crumbs; the title is always the last crumb.
  // An avatar takes precedence over a breadcrumb (PageHeader's `icon` wins over `breadcrumb`).
  const crumbs = breadcrumbTrail
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean)
    .map((label) => (breadcrumbLinks ? { label, href: "#" } : { label }));

  const subtitleNode = showSubtitle ? (
    <SubtitleLine channel={agent ? channel : undefined} text={subtitle} link={link} />
  ) : undefined;

  const channelButtons = agent && showChannelButtons;
  const outcome = agent && showOutcome ? <OutcomeGroup chip={outcomeChip} /> : null;

  return (
    <>
      <PageHeader
        title={title}
        // In the Agent layout the subtitle line lives in the session details row below.
        subtitle={row ? undefined : subtitleNode}
        icon={
          showAvatar ? (
            <Avatar
              initials={initialsOf(title)}
              size="lg"
              color="primary"
              badgePosition="bottom-right"
              badge={showAvatarStatus ? <Badge shape="circle" dot variant="success" bordered size="md" /> : undefined}
            />
          ) : undefined
        }
        iconDivider={iconDivider}
        breadcrumb={!showAvatar && showBreadcrumb && crumbs.length > 0 ? crumbs : undefined}
        badge={badge || undefined}
        badgeColor={badgeColor as never}
        badgeVariant={badgeVariant}
        titleSize={titleSize}
        bordered={bordered}
        compact={compact}
        panelToggle={panelToggle === "none" ? undefined : panelToggle}
        actions={
          agent ? (
            <>
              {channelButtons && <ChannelButtons selected={channel} />}
              {showActions && (
                <Button variant="outline">
                  <ContactRound className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                  Contact Details
                </Button>
              )}
            </>
          ) : showActions ? (
            <>
              <Button variant="outline">Secondary</Button>
              <Button>Primary</Button>
              <div className="mx-1 h-6 w-px bg-lyra-border-subtle" />
              <Button variant="outline">
                <AiIcon className="h-4 w-4" />
                Ask AI
              </Button>
            </>
          ) : undefined
        }
      />
      {row && (
        // Session details row under the header (a composition, not a PageHeader prop), always on in the Agent
        // layout: the subtitle line on the left, the outcome on the right.
        <div className="px-6">
          <div className="flex items-center justify-between gap-4 border-b border-lyra-border-subtle pb-3 pt-1">
            <div className="min-w-0">{subtitleNode}</div>
            {outcome}
          </div>
        </div>
      )}
    </>
  );
}

const meta: Meta<typeof PageHeaderDemo> = {
  title: "UI/PageHeader",
  component: PageHeader as never,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof PageHeaderDemo>;

export const Default: Story = {
  name: "Default",
  parameters: {
    controls: {
      // Storybook matches `include` against each control's display name, so names and keys are both listed.
      include: [
        "Layout", "Title", "Avatar", "Avatar status", "Breadcrumb", "Breadcrumb trail", "Breadcrumb links",
        "Subtitle", "Subtitle text", "Subtitle link", "Subtitle link text", "Badge", "Badge color", "Badge style",
        "Actions", "Channel", "Channel buttons", "Outcome", "Outcome chip",
        "Title size", "Border", "Compact", "Icon divider", "Panel toggle",
        "layout", "title", "showAvatar", "showAvatarStatus", "showBreadcrumb", "breadcrumbTrail", "breadcrumbLinks",
        "showSubtitle", "subtitle", "showSubtitleLink", "subtitleLinkText", "badge", "badgeColor", "badgeVariant",
        "showActions", "channel", "showChannelButtons", "showOutcome", "outcomeChip",
        "titleSize", "bordered", "compact", "iconDivider", "panelToggle",
      ],
      sort: "none",
    },
  },
  args: {
    layout: "agent",
    title: "Lucas Thomas",
    showAvatar: true,
    showAvatarStatus: true,
    showBreadcrumb: false,
    breadcrumbTrail: "Dashboards, Sales",
    breadcrumbLinks: false,
    showSubtitle: true,
    subtitle: "(282) 283-7606 · # CTX-20261021-63785",
    showSubtitleLink: true,
    subtitleLinkText: "Session Details",
    badge: "",
    badgeColor: "green",
    badgeVariant: "subtle",
    showActions: true,
    channel: "Voice",
    showChannelButtons: true,
    showOutcome: true,
    outcomeChip: "Open",
    titleSize: "lg",
    bordered: true,
    compact: false,
    iconDivider: false,
    panelToggle: "none",
  },
  argTypes: {
    layout: {
      name: "Layout",
      control: "radio",
      options: ["agent", "admin"],
      labels: { agent: "Agent", admin: "Admin" },
      description: "Agent: the agent record header (Contact Details button, channel buttons, and a session details row under it holding the subtitle line and outcome). Admin: the standard page header with its Secondary / Primary / Ask AI buttons.",
      table: { category: "Content", defaultValue: { summary: "agent" } },
    },
    title: {
      name: "Title",
      control: "text",
      description: "Page title (`title`). The avatar initials come from it.",
      table: { category: "Content" },
    },
    showAvatar: {
      name: "Avatar",
      control: "boolean",
      description: "Circle avatar with initials before the title (`icon`). Takes precedence over Breadcrumb.",
      table: { category: "Content", defaultValue: { summary: "true" } },
    },
    showAvatarStatus: {
      name: "Avatar status",
      control: "boolean",
      description: "Green status dot on the avatar's corner.",
      if: { arg: "showAvatar" },
      table: { category: "Content", defaultValue: { summary: "true" } },
    },
    showBreadcrumb: {
      name: "Breadcrumb",
      control: "boolean",
      description: "Show a breadcrumb trail before the title (`breadcrumb`). Hidden while Avatar is on, since an avatar takes precedence.",
      if: { arg: "showAvatar", truthy: false },
      table: { category: "Breadcrumb", defaultValue: { summary: "false" } },
    },
    breadcrumbTrail: {
      name: "Breadcrumb trail",
      control: "text",
      description: "Parent crumbs, comma-separated (`breadcrumb`). The title is the last crumb. One crumb gives a single parent, several give a deeper trail.",
      if: { arg: "showBreadcrumb" },
      table: { category: "Breadcrumb", defaultValue: { summary: "Dashboards, Sales" } },
    },
    breadcrumbLinks: {
      name: "Breadcrumb links",
      control: "boolean",
      description: "Render each parent crumb as a real link (`href` on each crumb) instead of a button.",
      if: { arg: "showBreadcrumb" },
      table: { category: "Breadcrumb", defaultValue: { summary: "false" } },
    },
    showSubtitle: {
      name: "Subtitle",
      control: "boolean",
      description: "Show a line under the title (`subtitle`). In the Agent layout it starts with the channel and sits in the session details row under the header.",
      table: { category: "Subtitle", defaultValue: { summary: "true" } },
    },
    subtitle: {
      name: "Subtitle text",
      control: "text",
      description: "The subtitle string. Only used while Subtitle is on.",
      if: { arg: "showSubtitle" },
      table: { category: "Subtitle" },
    },
    showSubtitleLink: {
      name: "Subtitle link",
      control: "boolean",
      description: "Add a link at the end of the subtitle. Only used while Subtitle is on.",
      if: { arg: "showSubtitle" },
      table: { category: "Subtitle", defaultValue: { summary: "true" } },
    },
    subtitleLinkText: {
      name: "Subtitle link text",
      control: "text",
      description: "The link's label.",
      if: { arg: "showSubtitleLink" },
      table: { category: "Subtitle", defaultValue: { summary: "Session Details" } },
    },
    badge: {
      name: "Badge",
      control: "text",
      description: "Badge text shown after the title (`badge`), for example \"Active Call\". Leave empty for none.",
      table: { category: "Content" },
    },
    badgeColor: {
      name: "Badge color",
      control: "select",
      options: ["slate", "red", "orange", "yellow", "lime", "green", "teal", "blue", "purple", "pink", "success", "info", "warning", "critical"],
      description: "Badge color (`badgeColor`).",
      table: { category: "Appearance", defaultValue: { summary: "green" } },
    },
    badgeVariant: {
      name: "Badge style",
      control: "radio",
      options: ["subtle", "solid"],
      description: "Badge variant (`badgeVariant`).",
      table: { category: "Appearance", defaultValue: { summary: "subtle" } },
    },
    showActions: {
      name: "Actions",
      control: "boolean",
      description: "Show the action buttons on the right (`actions`): Contact Details in the Agent layout, Secondary / Primary / Ask AI in the Admin layout.",
      table: { category: "Content", defaultValue: { summary: "true" } },
    },
    channel: {
      name: "Channel",
      control: "select",
      options: ["Chat", "Voice", "Email", "WhatsApp", "SMS"],
      description: "Agent layout: the current channel. Shown at the start of the subtitle line and as the selected channel button.",
      if: { arg: "layout", eq: "agent" },
      table: { category: "Agent", defaultValue: { summary: "Voice" } },
    },
    showChannelButtons: {
      name: "Channel buttons",
      control: "boolean",
      description: "Agent layout: channel icon buttons with a \"+\", to the left of Contact Details.",
      if: { arg: "layout", eq: "agent" },
      table: { category: "Agent", defaultValue: { summary: "true" } },
    },
    showOutcome: {
      name: "Outcome",
      control: "boolean",
      description: "Agent layout: the Outcome control and status chip.",
      if: { arg: "layout", eq: "agent" },
      table: { category: "Agent", defaultValue: { summary: "true" } },
    },
    outcomeChip: {
      name: "Outcome chip",
      control: "text",
      description: "Status chip next to Outcome. Leave empty for none.",
      if: { arg: "showOutcome" },
      table: { category: "Agent", defaultValue: { summary: "Open" } },
    },
    titleSize: {
      name: "Title size",
      control: "radio",
      options: ["lg", "2xl"],
      description: "Title heading size (`titleSize`): lg is 20px, 2xl is 28px for greeting-style headers.",
      table: { category: "Appearance", defaultValue: { summary: "lg" } },
    },
    bordered: {
      name: "Border",
      control: "boolean",
      description: "Bottom border (`bordered`).",
      table: { category: "Appearance", defaultValue: { summary: "true" } },
    },
    compact: {
      name: "Compact",
      control: "boolean",
      description: "Shorter row (`compact`).",
      table: { category: "Appearance", defaultValue: { summary: "false" } },
    },
    iconDivider: {
      name: "Icon divider",
      control: "boolean",
      description: "Divider between the avatar and the title (`iconDivider`).",
      if: { arg: "showAvatar" },
      table: { category: "Appearance", defaultValue: { summary: "false" } },
    },
    panelToggle: {
      name: "Panel toggle",
      control: "radio",
      options: ["none", "left", "right", "both"],
      description: "Which panel toggle buttons show (`panelToggle`).",
      table: { category: "Behavior", defaultValue: { summary: "none" } },
    },
  },
  render: (args) => <PageHeaderDemo {...args} />,
};

/** `tabs`: a page's views as a row under the title, inside the header (agent-next-gen-demo's Home). The `TabList`
 *  carries the header's `px-6` itself, so its bottom border spans the full width and is the header's bottom line. */
function PageHeaderWithTabsDemo() {
  const views = ["Dashboard", "Customers", "Accounts", "Tickets"];
  const [active, setActive] = React.useState(views[0]);
  return (
    <div className="bg-lyra-bg-surface-base">
      <PageHeader
        title="Good morning John"
        subtitle="User Name: jsmith"
        actions={<Button variant="secondary">My Assignment Queue: 3</Button>}
        tabs={
          <TabList className="px-6" overflowMenu>
            {views.map((view) => (
              <Tab key={view} active={active === view} onClick={() => setActive(view)}>
                {view}
              </Tab>
            ))}
          </TabList>
        }
      />
      <div className="p-6 lyra-body-md text-lyra-fg-secondary">{active}</div>
    </div>
  );
}

export const WithTabs: Story = {
  name: "With tabs",
  render: () => <PageHeaderWithTabsDemo />,
};
