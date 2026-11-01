import * as React from "react";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { Tooltip } from "./tooltip";
import { Badge } from "./badge";

/* ── Types ── */

/**
 * "purple"/"teal"/"pink" are the three fixed accent-hue variants — not
 * status colors like the rest of this union, but a categorical color set
 * for distinguishing same-weight *types* of thing that don't have a
 * success/warning/critical reading (the motivating case: Voice/Chat/Email
 * channel-type tags — see `channelTypeTagVariant` in CONTRIBUTING.md's
 * "Channel type colors" convention). Pick from these three rather than
 * inventing a fourth accent hue for a new categorical grouping — the
 * `lyra-accent-*` token set has more hues available (slate/red/orange/
 * yellow/lime/green/blue), but Tag only exposes the three actually in use
 * so call sites can't drift into an arbitrary, undocumented pairing.
 */
export type TagVariant = "default" | "success" | "warning" | "critical" | "info" | "neutral" | "purple" | "teal" | "pink";
export type TagSize = "sm";

export type TagShape = "default" | "pill";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Tag label */
  label: string;
  /** Visual variant */
  variant?: TagVariant;
  /** Shape — "default" uses rounded-xs corners, "pill" uses 50px border-radius */
  shape?: TagShape;
  /** A small status dot before the label — the circle `Badge` dot (size `sm`, 8×8) in the tag's own text color. It sits in the same 12px box (and the same gap from the label) as the remove "×" button's icon, so a dot and an × have matching spacing. Shown before `icon` when both are given. */
  dot?: boolean;
  /** Pulse the `dot` (the `Badge` dot's `pulse`: a ring radiates out and fades). Ignored unless `dot` is on. Default false. */
  dotPulse?: boolean;
  /** Optional leading icon, rendered before the label — e.g. a channel-type glyph (`Phone`/`MessageCircle`/`Mail`) on a "purple"/"teal"/"pink" channel tag. Sized/colored to match the label text; pass a Lucide icon element at `h-3 w-3` (matches the `X` remove glyph's own size). */
  icon?: React.ReactNode;
  /** Show a remove button — calls onRemove when clicked */
  onRemove?: () => void;
  /** Accessible label for the remove button (default: "Remove {label}") */
  removeLabel?: string;
  /**
   * Optional trailing icon, rendered in the same slot `onRemove`'s "×"
   * button occupies — e.g. a small chevron on a Tag that's itself a
   * dropdown/popover trigger somewhere in the tree (a status pill that
   * opens a status-picker popover, say). Renders as plain decorative
   * content (a `span`, `aria-hidden`), NOT a nested interactive element —
   * unlike the remove button, this has no `onClick`/`Tooltip` of its own,
   * since whatever wraps the whole `Tag` in that dropdown-trigger case
   * already owns the click handling; a `<button>` here would nest inside
   * that wrapping trigger and be invalid HTML (and steal its click).
   * Ignored whenever `onRemove` is also set — both render in the same
   * trailing slot, and a real interactive remove action takes priority
   * over a decorative hint. Sized/colored to match the label text; pass a
   * Lucide icon element at `h-3 w-3` (matches the `X` remove glyph's own
   * size).
   */
  trailingIcon?: React.ReactNode;
  /** Disable the tag and remove button */
  disabled?: boolean;
  /** Optional count after the label — e.g. how many rows a filter chip matches. Rendered as muted text, not a badge. */
  count?: number;
  /** Show the whole label, without the 200px cap and its ellipsis — for a short sentence that must stay readable,
   *  such as a settings lock's reason ("Locked by: Supervisors team profile"). Default false: a chip-length label. */
  fullLabel?: boolean;
  /**
   * Selectable mode: with `selected` (true or false) and `onClick`, the Tag
   * renders as a `<button>` — a toggle chip, e.g. a row of feed filters —
   * with `aria-pressed` and, when selected, `ToggleGroup`'s on-state look
   * (active-subtle fill, active border and text, whatever the `variant`).
   * `onRemove` is ignored in this mode (a button can't hold another
   * button). Without `selected` the Tag stays the static pill it always
   * was, even with an `onClick`: a Radix `asChild` trigger such as
   * `Tooltip`'s composes its own `onClick` onto a Tag it wraps, and that
   * Tag must stay a `<span>`.
   */
  selected?: boolean;
}

/* ── CVA definitions ── */

const tagVariants = cva(
  // `transition-[color,background-color,border-color,filter]`, not the
  // narrower `transition-colors` this used to be — every Tag now gets a
  // hover-brightness reaction by default (`hover:brightness-95`/
  // `dark:hover:brightness-125`, added in the component below rather than
  // here so `disabled` can suppress it), and `filter` needs its own listed
  // property to animate smoothly alongside the existing color transitions.
  "inline-flex items-center border transition-[color,background-color,border-color,filter] px-1.5 py-0.5 lyra-body-sm gap-0.5",
  {
    variants: {
      /* Note: border colors use a CSS color-mix() Tailwind arbitrary value
         rather than Tailwind's built-in slash opacity-modifier syntax (e.g.
         border-lyra-border-active at 30 percent). Tailwind can only generate
         opacity-modified utilities for theme colors defined as raw RGB/HSL
         channel triples; our design tokens are CSS custom properties holding
         full hex/rgba strings (see lyra-tokens.css), so a slash-opacity
         modifier on them silently produces no matching CSS rule at all and
         the border falls back to Tailwind's Preflight default (#e5e7eb gray)
         — which is why Tags previously rendered with a washed-out gray border
         instead of a tinted one. color-mix() works with any color value and
         has broad modern browser support. */
      variant: {
        default:  "bg-lyra-bg-active-subtle text-lyra-fg-active-strong border-[color-mix(in_srgb,var(--lyra-color-border-active)_30%,transparent)]",
        success:  "bg-lyra-status-success-subtle text-lyra-status-success-strong border-[color-mix(in_srgb,var(--lyra-color-status-success-strong)_30%,transparent)]",
        warning:  "bg-lyra-status-warning-subtle text-lyra-status-warning-strong border-[color-mix(in_srgb,var(--lyra-color-status-warning-strong)_30%,transparent)]",
        critical: "bg-lyra-status-critical-subtle text-lyra-status-critical-strong border-[color-mix(in_srgb,var(--lyra-color-status-critical-strong)_30%,transparent)]",
        info:     "bg-lyra-status-info-subtle text-lyra-status-info-strong border-[color-mix(in_srgb,var(--lyra-color-status-info-strong)_30%,transparent)]",
        neutral:  "bg-lyra-bg-surface-canvas text-lyra-fg-secondary border-lyra-border-subtle",
        purple:   "bg-lyra-accent-purple-soft text-lyra-accent-purple-strong border-[color-mix(in_srgb,var(--lyra-color-accent-purple-strong)_30%,transparent)]",
        teal:     "bg-lyra-accent-teal-soft text-lyra-accent-teal-strong border-[color-mix(in_srgb,var(--lyra-color-accent-teal-strong)_30%,transparent)]",
        pink:     "bg-lyra-accent-pink-soft text-lyra-accent-pink-strong border-[color-mix(in_srgb,var(--lyra-color-accent-pink-strong)_30%,transparent)]",
      },
      shape: {
        default: "rounded-lyra-xs",
        pill:    "rounded-[50px]",
      },
    },
    defaultVariants: {
      variant: "default",
      shape: "default",
    },
  }
);

const tagRemoveHoverVariants = cva("", {
  variants: {
    variant: {
      default:  "hover:bg-lyra-state-hover-active-subtle",
      success:  "hover:bg-lyra-status-success-subtle",
      warning:  "hover:bg-lyra-status-warning-subtle",
      critical: "hover:bg-lyra-state-hover-critical-subtle",
      info:     "hover:bg-lyra-status-info-subtle",
      neutral:  "hover:bg-lyra-state-hover",
      purple:   "hover:bg-lyra-accent-purple-soft",
      teal:     "hover:bg-lyra-accent-teal-soft",
      pink:     "hover:bg-lyra-accent-pink-soft",
    },
  },
  defaultVariants: { variant: "default" },
});

/* ── Component ── */

const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  (
    {
      label,
      variant = "default",
      shape = "default",
      dot,
      dotPulse,
      icon,
      onRemove,
      removeLabel,
      trailingIcon,
      disabled,
      count,
      fullLabel = false,
      selected,
      onClick,
      className,
      ...props
    },
    ref
  ) => {
      const selectable = selected !== undefined && !!onClick;
      const content = (
        <>
          {dot && (
            // 12px box = the remove button's X box, so the gap to the label matches an ×'s.
            <span className="flex h-3 w-3 flex-shrink-0 items-center justify-center" aria-hidden="true">
              {/* The small circle `Badge` dot (8×8), recolored to the tag's own text color (inline: the Badge sets its own text color, which `currentColor` would otherwise pick up) so every variant,
                  including purple/teal/pink (which the circle Badge's own roles don't cover), gets a matching dot. */}
              <Badge shape="circle" dot pulse={dotPulse} size="sm" style={{ backgroundColor: "currentColor", color: "inherit" }} />
            </span>
          )}
          {icon && (
            <span className="flex-shrink-0 [&>svg]:h-3 [&>svg]:w-3" aria-hidden="true">
              {icon}
            </span>
          )}
          <span className={fullLabel ? undefined : "truncate max-w-[200px]"}>{label}</span>
          {count !== undefined && <span className="ms-0.5 opacity-70">{count}</span>}
        </>
      );
      if (selectable) {
        return (
          <button
            ref={ref as unknown as React.Ref<HTMLButtonElement>}
            type="button"
            aria-pressed={!!selected}
            disabled={disabled}
            onClick={onClick as unknown as React.MouseEventHandler<HTMLButtonElement>}
            className={cn(
              tagVariants({ variant, shape }),
              "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus",
              !disabled && !selected && "hover:brightness-95 dark:hover:brightness-125",
              selected && !disabled && "bg-lyra-bg-active-subtle border-lyra-border-active text-lyra-fg-active-strong hover:bg-lyra-state-hover-active-subtle",
              disabled && "bg-lyra-bg-disabled text-lyra-fg-disabled border-lyra-border-disabled opacity-60 cursor-not-allowed",
              className
            )}
            {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
          >
            {content}
          </button>
        );
      }
      return (
      <span
        ref={ref}
        onClick={onClick}
        className={cn(
          tagVariants({ variant, shape, className }),
          // Every Tag reacts to hover by default — the tag's own color
          // darkens slightly in light mode (`brightness-95`) or lightens
          // slightly in dark mode (`brightness-125`, since a dark surface
          // needs to get *lighter* to read as "brighter"), rather than a
          // gray background appearing behind it (which would clash with
          // the tag's own tint). Originally only applied inside
          // `TagPicker`'s clickable rows (tag-picker.tsx) via `group-hover:`
          // on a wrapping `<button>`; promoted to Tag's own real `:hover`
          // here so every Tag gets it without a consumer having to opt in.
          // Suppressed when `disabled`, since a disabled tag isn't
          // interactive and shouldn't visually react as if it were.
          !disabled && "hover:brightness-95 dark:hover:brightness-125",
          disabled && "bg-lyra-bg-disabled text-lyra-fg-disabled border-lyra-border-disabled opacity-60"
        )}
        {...props}
      >
        {content}

        {onRemove && !disabled ? (
          <Tooltip content={removeLabel ?? `Remove ${label}`} placement="top" delayMs={400}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              aria-label={removeLabel ?? `Remove ${label}`}
              className={cn(
                // `lyra-hit-24`: 24×24px click/tap target around the 12px ×
                // (WCAG 2.5.8) — a centered ::before, so the tag's size and
                // layout are unchanged.
                "lyra-hit-24 rounded-full flex-shrink-0 transition-colors",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lyra-border-focus",
                tagRemoveHoverVariants({ variant })
              )}
            >
              <X className={cn("h-3 w-3", "block")} strokeWidth={2} aria-hidden="true" />
            </button>
          </Tooltip>
        ) : (
          trailingIcon && (
            <span className="flex-shrink-0 [&>svg]:h-3 [&>svg]:w-3" aria-hidden="true">
              {trailingIcon}
            </span>
          )
        )}
      </span>
    );
  }
);

Tag.displayName = "Tag";

export { Tag, tagVariants };
