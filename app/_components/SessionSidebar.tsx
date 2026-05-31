import { ParticipantList } from "@/app/_components/ParticipantList";
import type { Participant } from "@/lib/sessions";

const FONT = { fontFamily: "var(--font-public-sans)" } as const;

const STEPS = [
  "Waiting Room",
  "Discussion",
  "Self Reflection",
  "Synthesize",
  "Vote",
  "The call",
];

export function SessionSidebar({
  activeStep,
  topic,
  decisions,
  files,
  sessionId,
  participants,
  participantLabel,
}: {
  activeStep: number;
  topic: string;
  decisions?: string[];
  files: string[];
  sessionId: string;
  participants: Participant[];
  participantLabel: string;
}) {
  return (
    <aside className="flex w-full flex-col gap-8 rounded-3xl bg-white p-6 lg:w-[420px] xl:w-[479px]">
      <StepIndicator activeStep={activeStep} />

      <div className="flex w-full flex-col gap-6 rounded-2xl bg-[#f4f4f4] p-6">
        <div className="flex flex-col gap-3">
          <p className="text-[14px] font-medium leading-none text-black" style={FONT}>
            Session
          </p>
          <p className="text-[24px] leading-[1.2] text-black" style={FONT}>
            {topic}
          </p>
        </div>

        {decisions && decisions.length > 0 ? (
          <div className="flex flex-col gap-3">
            <p
              className="text-[14px] font-medium leading-none text-black"
              style={FONT}
            >
              Problem Statement / Decisions Surfaced:
            </p>
            <ol
              className="flex list-decimal flex-col gap-3 pl-[18px] text-[12px] leading-[1.2] text-black"
              style={FONT}
            >
              {decisions.map((item, idx) => (
                <li key={idx} className="leading-[1.2]">
                  {item}
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {files.length > 0 ? (
          <div className="flex flex-col gap-3">
            <p
              className="text-[14px] font-medium leading-none text-black"
              style={FONT}
            >
              Session Context
            </p>
            <div className="flex flex-wrap gap-2">
              {files.map((name, idx) => (
                <span
                  key={`${name}-${idx}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white p-2 text-[12px] leading-none text-black"
                  style={FONT}
                >
                  <DocIcon />
                  {name}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <ParticipantList
        participants={participants}
        sessionId={sessionId}
        label={participantLabel}
      />
    </aside>
  );
}

function StepIndicator({ activeStep }: { activeStep: number }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {STEPS.map((label, idx) => {
        const active = idx === activeStep;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`grid h-6 w-6 place-items-center rounded-full text-[10px] leading-none ${
                active ? "bg-[#e85d3c] text-white" : "bg-white text-black"
              }`}
              style={FONT}
            >
              {idx + 1}
            </span>
            {active ? (
              <span className="text-[14px] leading-none text-[#1a1a1a]" style={FONT}>
                {label}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
