/* Shared example data and helpers for VoiceCallControls.stories.tsx (Default
   playground) and VoiceCallControls.variants.stories.tsx (Variants pages).
   Not a stories file, so the two can't drift apart. */
import * as React from "react";
import { VoiceCallControls, type VoiceCallControlsProps } from "../voice-call-controls";

/** Example callers. `initials` omitted = no contact match (the generic person avatar). */
export const CALLERS = {
  marcus: { label: "Marcus Webb", initials: "MW" },
  maya: { label: "Maya Chen", initials: "MC" },
  sofia: { label: "Sofia Martinez", initials: "SM" },
  unmatched: { label: "+1 (614) 555-0147", initials: undefined },
} as const;

/** Width a left rail gives the card: the rail layout's default (and minimum) width, 240px. */
export const RAIL_WIDTH = 240;
/** A bar narrower than 600px folds Mask / Record / Keypad / Transcript into a "…" menu. */
export const NARROW_BAR_WIDTH = 520;

/** A ticking seconds counter, so the call timer in each story runs instead of sitting still. */
export function useElapsedSeconds(startAt = 9) {
  const [seconds, setSeconds] = React.useState(startAt);
  React.useEffect(() => {
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  return seconds;
}

export interface CallDemoProps
  extends Omit<VoiceCallControlsProps, "onHangUp" | "elapsedSeconds" | "onHold" | "onHoldChange" | "onHoldElapsedSeconds" | "onToggleTranscript" | "transcriptOpen" | "onToggleVideo" | "videoOpen"> {
  /** Seconds already on the call clock when the story opens. */
  startAt?: number;
  /** Start with the call on hold (with a running "On hold" timer). */
  startOnHold?: boolean;
  /** The call has a transcript (the Transcript button toggles a transcript-open state here). Off: the button is disabled. */
  transcript?: boolean;
  /** Start with the transcript open. */
  startTranscriptOpen?: boolean;
  /** Start with video added. */
  startVideoOpen?: boolean;
  /** Wrapper width in px; omit for the full width of the story. */
  width?: number;
}

/**
 * A live call: ticking timer, real hold / transcript / video state, and a "Restart call" button once
 * End Call has finished its exit animation.
 */
export function CallDemo({
  startAt = 9,
  startOnHold = false,
  transcript = true,
  startTranscriptOpen = false,
  startVideoOpen = false,
  width,
  ...props
}: CallDemoProps) {
  const elapsedSeconds = useElapsedSeconds(startAt);
  const [onHold, setOnHold] = React.useState(startOnHold);
  const [holdStartedAt, setHoldStartedAt] = React.useState<number | null>(startOnHold ? elapsedSeconds - 20 : null);
  const [transcriptOpen, setTranscriptOpen] = React.useState(startTranscriptOpen);
  const [videoOpen, setVideoOpen] = React.useState(startVideoOpen);
  const [ended, setEnded] = React.useState(false);
  const [callKey, setCallKey] = React.useState(0);

  return (
    <div style={width ? { width, maxWidth: "100%" } : undefined}>
      {ended ? (
        <div className="flex items-center gap-3 rounded-lyra-md border border-dashed border-lyra-border-soft p-4">
          <span className="lyra-body-md text-lyra-fg-secondary">Call ended.</span>
          <button
            type="button"
            className="lyra-body-md-emphasis text-lyra-fg-action underline-offset-2 hover:underline"
            onClick={() => {
              setEnded(false);
              setCallKey((k) => k + 1);
            }}
          >
            Restart call
          </button>
        </div>
      ) : (
        <VoiceCallControls
          key={callKey}
          {...props}
          elapsedSeconds={elapsedSeconds}
          onHangUp={() => setEnded(true)}
          onHold={onHold}
          onHoldChange={(next) => {
            setOnHold(next);
            setHoldStartedAt(next ? elapsedSeconds : null);
          }}
          onHoldElapsedSeconds={holdStartedAt !== null ? Math.max(0, elapsedSeconds - holdStartedAt) : undefined}
          onToggleTranscript={transcript ? () => setTranscriptOpen((o) => !o) : undefined}
          transcriptOpen={transcriptOpen}
          onToggleVideo={() => setVideoOpen((o) => !o)}
          videoOpen={videoOpen}
        />
      )}
    </div>
  );
}
