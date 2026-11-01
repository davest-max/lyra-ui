import * as React from "react";
import { cn } from "../lib/utils";
import { Tooltip } from "./tooltip";
import { KebabMenuButton } from "./kebab-menu-button";
import type { MenuEntry } from "./menu";

/* ── Types ── */

export type ToggleGroupType = "single" | "multiple";

export interface ToggleGroupItem {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
  /** Accessible name for the item. Needed when `label` is only an icon; sets `aria-label` on the item's button. */
  ariaLabel?: string;
  /**
   * Opt-in: adds a kebab (⋮) button inside this item that opens these menu
   * entries — same pattern as `Tab`'s `menuItems`. It is a real button next to
   * the item's own radio button (never nested inside it), reachable with Tab
   * right after the item, with a Tooltip showing `menuAriaLabel` on hover and
   * focus. Clicking it opens the menu without selecting the item.
   */
  menuItems?: MenuEntry[];
  /**
   * Opt-in: a tooltip for this item, shown on hover and on keyboard focus.
   * Meant for icon-only items (pair it with `ariaLabel`), the same way an
   * icon-only `Tab` shows its name. Unset (default) adds no tooltip.
   */
  tooltip?: React.ReactNode;
}

export interface ToggleGroupProps {
  /** Items to render */
  items: ToggleGroupItem[];
  /** Selection mode */
  type?: ToggleGroupType;
  /** Controlled selected value (single mode) */
  value?: string;
  /** Controlled selected values (multiple mode) */
  values?: string[];
  /** Default selected value (single, uncontrolled) */
  defaultValue?: string;
  /** Default selected values (multiple, uncontrolled) */
  defaultValues?: string[];
  /** Called when selection changes */
  onValueChange?: (value: string) => void;
  /** Called when selection changes (multiple mode) */
  onValuesChange?: (values: string[]) => void;
  /** Disable all items */
  disabled?: boolean;
  /**
   * When true, the root stretches to `w-full` (instead of its default
   * `inline-flex` content width) and each item becomes an equal-width
   * `flex-1` column filling that width, its label centered — the same
   * "stretch to fill the row" shape `TabList`'s own `fullWidth` prop
   * already gives tab bars. Off by default, matching every other toggle
   * group in the design system (a compact, content-width control sitting
   * inline with other row content, e.g. `SchedulePanel.tsx`'s Day/Week
   * switch) — turn on for a toggle group that's the row's own sole,
   * full-width content instead (e.g. a combined-panel-mode region switch
   * standing in for a `fullWidth` `TabList`).
   */
  fullWidth?: boolean;
  /**
   * When a label is cut off with an ellipsis (only possible with `fullWidth` or `itemMaxWidth`),
   * hovering or focusing that item shows its full label in a tooltip, the same as `TabList`.
   * Items that fit show no tooltip. Default `true`; pass `false` to turn it off.
   */
  showTruncationTooltip?: boolean;
  /** Accessible name and tooltip for each item's `menuItems` kebab. Default "More options". */
  menuAriaLabel?: string;
  /**
   * Single mode only. When `true`, clicking (or pressing Enter/Space on) the
   * already-selected item clears the selection and calls `onValueChange("")`.
   * Default `false`: the selected item stays selected, like a radio group
   * (this is what every lyra-ui and agent-next-gen-v3 caller already wanted —
   * they all ignored the empty value).
   */
  allowDeselect?: boolean;
  /**
   * Opt-in: caps every item's width (a number is px, a string is any CSS
   * length). A label longer than that is cut off with an ellipsis; add
   * `showTruncationTooltip` to show the full label on hover and focus. Works
   * with or without `fullWidth`. Unset (default) keeps today's sizing.
   */
  itemMaxWidth?: number | string;
  /** Accessible name for the group (`aria-label`), e.g. "View". */
  ariaLabel?: string;
  /** Id of a visible element that names the group (`aria-labelledby`). */
  ariaLabelledBy?: string;
  /** Id of a visible element that describes the group (`aria-describedby`), e.g. why it's disabled: read on entering it. */
  ariaDescribedBy?: string;
  /** Additional className on the root */
  className?: string;
}

/* Only an item with a menu gets a wrapper (to anchor its kebab); every other
   item renders exactly as before, with no extra element. */
function ItemWrap({ hasMenu, fullWidth, children }: { hasMenu: boolean; fullWidth: boolean; children: React.ReactNode }) {
  if (!hasMenu) return <>{children}</>;
  return <div className={cn("relative", fullWidth ? "flex flex-1 min-w-0" : "inline-flex")}>{children}</div>;
}

/* An item's kebab: a real button (sibling of the radio button, so no nested
   interactive controls) pinned inside the item's right edge. The tooltip is
   suppressed while the menu is open. */
function ItemMenu({ items, label, className }: { items: MenuEntry[]; label: string; className?: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Tooltip content={label} placement="top" disabled={open}>
      <KebabMenuButton
        items={items}
        ariaLabel={label}
        open={open}
        onOpenChange={setOpen}
        className={cn("absolute right-1.5 top-1/2 -translate-y-1/2", className)}
      />
    </Tooltip>
  );
}

/* Wraps one item's button in a tooltip that only opens while its label is
   actually truncated. `children` receives the ref to put on the truncating
   label element so it can be measured. */
function TruncationTooltip({
  content,
  enabled,
  alwaysContent,
  children,
}: {
  content: React.ReactNode;
  enabled: boolean;
  alwaysContent?: React.ReactNode;
  children: (labelRef: React.RefObject<HTMLSpanElement | null>) => React.ReactElement;
}) {
  const labelRef = React.useRef<HTMLSpanElement>(null);
  const button = children(labelRef);
  if (alwaysContent != null) {
    return (
      <Tooltip content={alwaysContent} placement="top">
        {button}
      </Tooltip>
    );
  }
  if (!enabled) return button;
  // `onlyWhenTruncated` measures the item at the moment the tooltip would open, so it is right
  // whatever the item's width was when it mounted (a cached "is it cut off" flag went stale, e.g. when
  // the group's width changed after first render, and some cut-off items then showed no tooltip).
  return (
    <Tooltip content={content} placement="top" onlyWhenTruncated>
      {button}
    </Tooltip>
  );
}

/* ── Component ── */

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  (
    {
      items,
      type = "single",
      value,
      values,
      defaultValue,
      defaultValues,
      onValueChange,
      onValuesChange,
      disabled,
      fullWidth,
      showTruncationTooltip = true,
      menuAriaLabel = "More options",
      allowDeselect = false,
      itemMaxWidth,
      ariaLabel,
      ariaLabelledBy,
      ariaDescribedBy,
      className,
    },
    ref
  ) => {
    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const setRootRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        rootRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );
    const isSingle = type !== "multiple";
    const truncates = !!fullWidth || itemMaxWidth != null;
    const maxWidthStyle =
      itemMaxWidth != null
        ? { maxWidth: typeof itemMaxWidth === "number" ? `${itemMaxWidth}px` : itemMaxWidth }
        : undefined;

    /* ── Uncontrolled internal state ── */
    const [internalValue, setInternalValue] = React.useState<string>(
      defaultValue ?? ""
    );
    const [internalValues, setInternalValues] = React.useState<string[]>(
      defaultValues ?? []
    );

    const isControlledSingle = value !== undefined;
    const isControlledMulti = values !== undefined;

    const currentValue = isControlledSingle ? value : internalValue;
    const currentValues = isControlledMulti ? values : internalValues;

    const isSelected = (itemValue: string) =>
      type === "multiple"
        ? currentValues.includes(itemValue)
        : currentValue === itemValue;

    const handleClick = (itemValue: string) => {
      if (type === "multiple") {
        const next = currentValues.includes(itemValue)
          ? currentValues.filter((v) => v !== itemValue)
          : [...currentValues, itemValue];
        if (!isControlledMulti) setInternalValues(next);
        onValuesChange?.(next);
      } else {
        // Single: re-selecting the selected item does nothing (radio
        // behavior), unless `allowDeselect` opts back in to clearing it.
        if (currentValue === itemValue && !allowDeselect) return;
        const next = currentValue === itemValue ? "" : itemValue;
        if (!isControlledSingle) setInternalValue(next);
        onValueChange?.(next);
      }
    };

    /* ── Single mode keyboard: one Tab stop + arrow keys (WAI-ARIA radio group) ──
       The Tab stop is the selected item, or the first enabled item when
       nothing (enabled) is selected. Arrow keys move focus to the next/previous
       enabled item, wrapping, and select it (selection follows focus, as in a
       native radio group); Home/End jump to the first/last. Keyboard only:
       mouse behavior and every class are unchanged. */
    const enabledValues = items
      .filter((item) => !(disabled || item.disabled))
      .map((item) => item.value);
    const tabStopValue =
      isSingle && currentValue && enabledValues.includes(currentValue)
        ? currentValue
        : enabledValues[0];

    const handleItemKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, itemValue: string) => {
      if (!isSingle || e.altKey || e.ctrlKey || e.metaKey) return;
      const root = rootRef.current;
      if (!root || enabledValues.length === 0) return;
      const rtl = getComputedStyle(root).direction === "rtl";
      const idx = enabledValues.indexOf(itemValue);
      const n = enabledValues.length;
      let nextIdx: number;
      switch (e.key) {
        case "ArrowDown":
          nextIdx = (idx + 1) % n;
          break;
        case "ArrowUp":
          nextIdx = (idx - 1 + n) % n;
          break;
        case "ArrowRight":
          nextIdx = rtl ? (idx - 1 + n) % n : (idx + 1) % n;
          break;
        case "ArrowLeft":
          nextIdx = rtl ? (idx + 1) % n : (idx - 1 + n) % n;
          break;
        case "Home":
          nextIdx = 0;
          break;
        case "End":
          nextIdx = n - 1;
          break;
        default:
          return;
      }
      e.preventDefault();
      const nextValue = enabledValues[nextIdx];
      const target = Array.from(
        root.querySelectorAll<HTMLButtonElement>("[data-lyra-toggle-item]")
      ).find((el) => el.dataset.value === nextValue);
      target?.focus();
      if (nextValue !== currentValue) handleClick(nextValue);
    };

    return (
      <div
        ref={setRootRef}
        role={isSingle ? "radiogroup" : "group"}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-disabled={disabled || undefined}
        className={cn(
          "items-center rounded-lyra-md border border-lyra-border-subtle bg-lyra-bg-surface-base p-0.5 gap-0",
          fullWidth ? "flex w-full" : "inline-flex",
          className
        )}
      >
        {items.map((item, i) => {
          const selected = isSelected(item.value);
          const isDisabled = disabled || item.disabled;

          /* Divider is always rendered between items to prevent layout shift,
           * but invisible when either neighbour is selected. */
          const prevSelected = i > 0 && isSelected(items[i - 1].value);
          const dividerVisible = i > 0 && !selected && !prevSelected;

          return (
            <React.Fragment key={item.value}>
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "w-px h-4 bg-lyra-border-subtle flex-shrink-0 transition-opacity",
                    dividerVisible ? "opacity-100" : "opacity-0"
                  )}
                />
              )}
              <ItemWrap hasMenu={!!item.menuItems} fullWidth={!!fullWidth}>
              <TruncationTooltip content={item.label} enabled={showTruncationTooltip && truncates} alwaysContent={item.tooltip}>
              {(labelRef) => (
              <button
                type="button"
                // Single: a radio in a radiogroup (one Tab stop, arrow keys).
                // Multiple: a toggle button (`aria-pressed`), each its own Tab stop.
                role={isSingle ? "radio" : undefined}
                aria-checked={isSingle ? selected : undefined}
                aria-pressed={isSingle ? undefined : selected}
                aria-label={item.ariaLabel}
                tabIndex={isSingle ? (item.value === tabStopValue ? 0 : -1) : undefined}
                data-lyra-toggle-item=""
                data-value={item.value}
                disabled={isDisabled}
                style={maxWidthStyle}
                onClick={() => !isDisabled && handleClick(item.value)}
                onKeyDown={(e) => handleItemKeyDown(e, item.value)}
                className={cn(
                  "relative px-4 py-1.5 lyra-body-md rounded-lyra-sm transition-colors select-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-1",
                  // `min-w-0` alongside `flex-1` — a flex item's default
                  // `min-width: auto` floors it at its own content's
                  // natural (unwrapped) width, which silently defeats the
                  // label's own `truncate` below (nothing to actually
                  // truncate INTO if the item itself refuses to shrink past
                  // that width first). With it, an item whose label is too
                  // long for its equal `flex-1` share truncates with an
                  // ellipsis instead of wrapping onto a second line and
                  // growing every item's height to match.
                  fullWidth && "flex-1 min-w-0 flex items-center justify-center",
                  // `itemMaxWidth` without `fullWidth`: a flex box so the
                  // label span below can truncate inside the capped width.
                  !fullWidth && itemMaxWidth != null && "min-w-0 inline-flex items-center justify-center",
                  // Room on the right for the kebab.
                  item.menuItems && "pr-9",
                  /* Off — border always present but transparent, so hover/press don't shift layout */
                  !selected && !isDisabled && [
                    "text-lyra-fg-default border border-transparent",
                    "hover:bg-lyra-bg-surface-shell hover:border-lyra-border-soft",
                    "active:bg-lyra-bg-disabled active:border-lyra-border-soft",
                  ],
                  /* Disabled */
                  isDisabled && !selected && "text-lyra-fg-disabled cursor-not-allowed border border-transparent",
                  /* Selected / On — color change only, no font-weight shift
                     (matches the rest of the system's active-state
                     treatment, e.g. Tag/TreeMenu's leaf-active styling —
                     `font-medium` here was inconsistent with that). */
                  selected && !isDisabled && [
                    "bg-lyra-bg-active-subtle border border-lyra-border-active text-lyra-fg-active-strong",
                    "hover:bg-lyra-state-hover-active-subtle",
                    "active:bg-lyra-state-pressed-active-subtle",
                  ],
                  /* Selected + disabled */
                  selected && isDisabled && [
                    "bg-lyra-bg-active-subtle border border-lyra-border-disabled text-lyra-fg-disabled",
                  ],
                )}
              >
                {/* `min-w-0 truncate` only under `fullWidth` — `item.label`
                    accepts any `ReactNode` (an icon, not just text, per
                    SchedulePanel.tsx's own Day/Week toggle), so this only
                    wraps it in an extra span when there's actually a fixed-
                    width flex slot for it to truncate within; the default
                    inline-content sizing is untouched otherwise. */}
                {truncates ? <span ref={labelRef} className="min-w-0 truncate">{item.label}</span> : item.label}
              </button>
              )}
              </TruncationTooltip>
              {item.menuItems && (
                <ItemMenu
                  items={item.menuItems}
                  label={menuAriaLabel}
                  className={selected && !isDisabled ? "text-lyra-fg-active-strong" : undefined}
                />
              )}
              </ItemWrap>
            </React.Fragment>
          );
        })}
      </div>
    );
  }
);

ToggleGroup.displayName = "ToggleGroup";

export { ToggleGroup };
