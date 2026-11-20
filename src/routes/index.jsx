// The demo stage: the scenarios on the left, the real app in a phone frame on
// the right. The phone is an iframe of the app's own routes in demo mode, so
// everything in it is sample data kept in this browser.
//
// Scenarios live in src/lib/demoScenarios.js; this file is only the layout.
// On narrow screens there is no frame: the list is one screen, the app is the
// next, with a small button back to the list.
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Pill from "@/components/Pill";
import { DEMO_DB_KEY, enterDemo, isDemo } from "@/lib/demo";
import { EXPLORE, SCENARIOS } from "@/lib/demoScenarios";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Rozana · Demo" }, { name: "theme-color", content: "#ffffff" }],
  }),
  component: DemoStage,
});

const PHONE = { width: 390, height: 844, bezel: 12 };
const ALL = [...SCENARIOS, EXPLORE];
// Wide enough for the panel and the framed phone side by side.
const WIDE = "(min-width: 900px)";

function seed(scenario) {
  try {
    enterDemo(scenario.setup || null);
  } catch {
    /* storage blocked: the app shows whatever it can */
  }
}

function hasDemoData() {
  try {
    return isDemo() && Boolean(window.localStorage.getItem(DEMO_DB_KEY));
  } catch {
    return false;
  }
}

/** Scales the framed phone down on short windows so it always fits. */
function usePhoneScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => {
      const outer = PHONE.height + PHONE.bezel * 2;
      setScale(Math.min(1, (window.innerHeight - 48) / outer));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return scale;
}

function DemoStage() {
  const [selectedId, setSelectedId] = useState(EXPLORE.id);
  // What the phone shows. `run` changes on every reset so the iframe reloads.
  const [phone, setPhone] = useState(null);
  // Narrow screens only: the list, or the app full screen.
  const [view, setView] = useState("list");
  const scale = usePhoneScale();
  const frameRef = useRef(null);

  const selected = ALL.find((item) => item.id === selectedId) || EXPLORE;

  // First visit: the full sample kitchen. A reload keeps whatever was there.
  useEffect(() => {
    if (!hasDemoData()) seed(EXPLORE);
    setPhone({ path: EXPLORE.start, run: Date.now() });
  }, []);

  const start = (scenario) => {
    seed(scenario);
    setSelectedId(scenario.id);
    setPhone({ path: scenario.start, run: Date.now() });
  };

  // Wide: a tap starts the scenario. Narrow: a tap opens its steps first,
  // except "Explore freely", which has none and goes straight in.
  const choose = (scenario) => {
    const wide = window.matchMedia(WIDE).matches;
    if (wide || !scenario.steps.length) {
      start(scenario);
      if (!wide) setView("app");
      return;
    }
    setSelectedId(scenario.id);
  };

  const openOnPhone = (path) => {
    const win = frameRef.current?.contentWindow;
    if (win) win.location.assign(path);
    setView("app");
  };

  const startOver = () => {
    start(selected);
    if (!window.matchMedia(WIDE).matches) setView("app");
  };

  return (
    <div className="min-h-[100dvh] bg-white text-ink">
      <h1 className="sr-only">Rozana demo</h1>
      <div className="mx-auto flex min-h-[100dvh] max-w-[1180px] items-start justify-center min-[900px]:items-center gap-12 px-4 min-[900px]:px-8">
        <aside
          className={cn(
            "w-full max-w-[460px] py-6 min-[900px]:block min-[900px]:w-[340px] min-[900px]:shrink-0 min-[900px]:py-8",
            view === "app" ? "hidden" : "block",
          )}
        >
          <ScenarioList
            selected={selected}
            onChoose={choose}
            onStart={(scenario) => {
              start(scenario);
              setView("app");
            }}
            onGo={openOnPhone}
            onStartOver={startOver}
          />
        </aside>

        <section
          aria-label="The app"
          className={cn(
            "min-[900px]:flex min-[900px]:flex-1 min-[900px]:justify-center min-[900px]:pl-[6%]",
            view === "list" ? "hidden" : "flex",
          )}
        >
          <PhoneFrame scale={scale}>
            {phone ? (
              <iframe
                ref={frameRef}
                key={phone.run}
                src={phone.path}
                title="Rozana"
                className="h-full w-full border-0 bg-background"
              />
            ) : null}
          </PhoneFrame>
        </section>
      </div>

      {/* Narrow screens: a slim strip above the app, so nothing in the app is covered. */}
      {view === "app" ? (
        <div className="fixed inset-x-0 top-0 z-50 flex h-10 items-center gap-2 border-b border-border bg-white px-2 min-[900px]:hidden">
          <button
            type="button"
            onClick={() => setView("list")}
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-2 text-small font-semibold text-ink"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Scenarios
          </button>
          <span className="truncate text-small text-ink-mid">{selected.title}</span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Wide screens: a phone-sized frame, scaled down on short windows.
 * Narrow screens: no frame, the app fills the screen. One iframe either way.
 */
function PhoneFrame({ scale, children }) {
  return (
    <div
      style={{ "--phone-scale": scale }}
      className="fixed inset-x-0 bottom-0 top-10 min-[900px]:static min-[900px]:h-[calc(868px*var(--phone-scale))] min-[900px]:w-[calc(414px*var(--phone-scale))] min-[900px]:shrink-0"
    >
      <div className="h-full w-full min-[900px]:h-[868px] min-[900px]:w-[414px] min-[900px]:origin-top-left min-[900px]:rounded-[56px] min-[900px]:bg-ink min-[900px]:p-3 min-[900px]:shadow-[0_24px_60px_rgba(26,22,20,0.18)] min-[900px]:[transform:scale(var(--phone-scale))]">
        <div className="h-full w-full overflow-hidden bg-background min-[900px]:rounded-[44px]">{children}</div>
      </div>
    </div>
  );
}

function ScenarioList({ selected, onChoose, onStart, onGo, onStartOver }) {
  return (
    <div>
      <p className="eyebrow">Scenarios</p>
      <ul className="mt-3 space-y-2">
        {SCENARIOS.map((scenario) => (
          <li key={scenario.id}>
            <ScenarioCard
              scenario={scenario}
              active={selected.id === scenario.id}
              onChoose={onChoose}
              onStart={onStart}
              onGo={onGo}
            />
          </li>
        ))}
      </ul>
      <div className="mt-2">
        <ScenarioCard scenario={EXPLORE} active={selected.id === EXPLORE.id} onChoose={onChoose} />
      </div>
      <button
        type="button"
        onClick={onStartOver}
        className="mt-5 inline-flex h-11 items-center gap-2 rounded-full px-1 text-small font-semibold text-ink-mid transition-colors hover:text-ink"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" /> Start over
      </button>
    </div>
  );
}

function ScenarioCard({ scenario, active, onChoose, onStart, onGo }) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white transition-colors",
        active ? "border-ink" : "border-border hover:border-ink-mid",
      )}
    >
      <button
        type="button"
        onClick={() => onChoose(scenario)}
        aria-pressed={active}
        className="block w-full rounded-2xl px-4 py-3 text-left"
      >
        <span className="block text-body font-semibold leading-snug text-ink">{scenario.title}</span>
        <span className="mt-0.5 block text-small leading-snug text-ink-mid">{scenario.summary}</span>
      </button>

      {active && scenario.steps.length ? (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <p className="text-small font-semibold text-ink-mid">Try this</p>
          <ol className="mt-2 space-y-2">
            {scenario.steps.map((step, index) => {
              const text = typeof step === "string" ? step : step.text;
              const go = typeof step === "string" ? null : step.go;
              return (
                <li key={index} className="flex gap-2.5 text-small leading-snug text-ink">
                  <span className="num w-4 shrink-0 font-semibold text-chili">{index + 1}</span>
                  {go ? (
                    <button
                      type="button"
                      onClick={() => onGo(go)}
                      className="inline-flex items-start gap-1 text-left font-medium underline decoration-border underline-offset-4 hover:decoration-ink"
                    >
                      {text}
                      <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    </button>
                  ) : (
                    <span>{text}</span>
                  )}
                </li>
              );
            })}
          </ol>
          {onStart ? (
            <Pill size="sm" onClick={() => onStart(scenario)} className="mt-4 w-full min-[900px]:hidden">
              Start
            </Pill>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
