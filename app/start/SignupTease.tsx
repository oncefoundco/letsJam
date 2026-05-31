// A static, non-interactive preview of the post-login Start screen, shown
// behind the sign-in modal as a "here's what you'll get" tease. Mirrors the
// Lead Signup Figma. Decorative only — the auth modal's overlay sits on top and
// captures all interaction, so everything here is plain markup (aria-hidden).

const FONT = { fontFamily: "var(--font-public-sans)" } as const;

const TEASE_FILES = ["2026-CRM-deals.csv", "Q2-ProductRoadmap.pdf"];
const TEASE_TIMES = ["Immediately", "Schedule", "Draft"];

export function SignupTease() {
  return (
    <div
      aria-hidden
      className="flex flex-1 flex-col items-stretch gap-6 px-6 pb-12 pt-4 md:px-12 lg:flex-row lg:gap-11 lg:px-16 lg:pb-16 lg:pt-8"
    >
      <section className="flex min-w-0 flex-1 flex-col justify-between gap-12 rounded-3xl bg-white p-6 md:p-8 lg:p-12">
        <div className="flex flex-col gap-6">
          <h2
            className="text-[40px] leading-none tracking-[-0.96px] text-[#1a1a1a] md:text-[48px]"
            style={{ fontFamily: "var(--font-queens)" }}
          >
            Start a New Jam
          </h2>

          <Field label="Define your challenge">
            <div
              className="min-h-[180px] w-full rounded-2xl bg-[#f5f5f5] p-4 text-[15px] leading-[1.5] text-[#1a1a1a]"
              style={FONT}
            >
              Why is our enterprise expansion stalling, and what should we do
              about it in Q1?
            </div>
          </Field>

          <Field label="Upload context">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#f5f5f5] p-3 text-[14px] leading-none text-black"
                style={FONT}
              >
                <UploadIcon />
                Select Files
              </span>
              {TEASE_FILES.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[rgba(60,91,203,0.1)] p-3 text-[14px] leading-none text-[#3c5bcb]"
                  style={FONT}
                >
                  <DocIcon />
                  {name}
                  <RemoveDot />
                </span>
              ))}
            </div>
          </Field>

          <Field label="Start time">
            <div className="flex flex-wrap items-center gap-3">
              {TEASE_TIMES.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center justify-center rounded-full bg-[#f5f5f5] p-3 text-[14px] leading-none text-black"
                  style={FONT}
                >
                  {label}
                </span>
              ))}
            </div>
          </Field>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <TeaseButton>Draft Jam</TeaseButton>
          <TeaseButton>Invite team</TeaseButton>
        </div>
      </section>

      <aside className="flex w-full flex-col items-center gap-6 lg:w-auto lg:flex-1 lg:self-stretch">
        <div className="flex w-full items-start justify-between gap-4">
          <h2
            className="text-[40px] leading-none tracking-[-0.96px] text-[#1a1a1a] md:text-[48px]"
            style={{ fontFamily: "var(--font-queens)" }}
          >
            Previous Jams
          </h2>
          <span
            className="shrink-0 rounded-full bg-white p-3 text-[14px] leading-none text-black"
            style={FONT}
          >
            Filter by date
          </span>
        </div>
        <p className="mt-4 text-[18px] italic leading-[1.5] text-[#1a1a1a]" style={FONT}>
          No previous jams found.
        </p>
      </aside>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[14px] font-medium leading-none text-black" style={FONT}>
        {label}
      </span>
      {children}
    </div>
  );
}

function TeaseButton({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="flex flex-1 items-center justify-center rounded-2xl bg-[#1a1a1a] py-4 text-[14px] font-medium leading-none text-white"
      style={{ fontFamily: "var(--font-inter)" }}
    >
      {children}
    </span>
  );
}

function UploadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 16V4m0 0L7 9m5-5l5 5M5 19h14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function RemoveDot() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path
        d="M1.5 1.5l7 7M8.5 1.5l-7 7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
