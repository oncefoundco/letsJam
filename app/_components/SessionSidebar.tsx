import { ParticipantList } from "@/app/_components/ParticipantList";
import type { Participant } from "@/lib/sessions";

const FONT = { fontFamily: "var(--font-public-sans)" } as const;

export function SessionSidebar({
  topic,
  description,
  decisions,
  files,
  sessionId,
  participants,
  participantLabel,
}: {
  // activeStep is still accepted (the session routes pass it) but the redesigned
  // sidebar no longer renders a phase stepper.
  activeStep?: number;
  topic: string;
  // The host's "Describe your Jam" text, shown under the challenge.
  description?: string;
  decisions?: string[];
  files: string[];
  sessionId: string;
  participants: Participant[];
  participantLabel: string;
}) {
  return (
    <aside className="flex w-full flex-col justify-between gap-8 self-stretch rounded-3xl bg-white p-6 lg:w-[420px] xl:w-[479px]">
      <div className="flex w-full flex-col gap-6 rounded-2xl bg-[#f4f4f4] p-6">
        <div className="flex flex-col gap-3">
          <p className="text-[14px] font-medium leading-none text-black" style={FONT}>
            Our Challenge
          </p>
          <p className="text-[24px] leading-[1.2] text-black" style={FONT}>
            {topic}
          </p>
          {description ? (
            <div className="flex w-full flex-col items-center gap-3">
              <p className="w-full text-[12px] leading-normal text-black" style={FONT}>
                {description}
              </p>
              <span aria-hidden className="flex items-center gap-[3px] py-1 text-black/40">
                <Dot />
                <Dot />
                <Dot />
              </span>
            </div>
          ) : null}
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
              Jam Context
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

function Dot() {
  return <span className="h-[3px] w-[3px] rounded-full bg-current" />;
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
