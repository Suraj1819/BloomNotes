import { useMemo, useState, useEffect } from 'react';
import {
  Activity,
  CalendarCheck,
  Flame,
  TrendingDown,
  TrendingUp,
  Trophy,
  Sparkles,
  Clock,
  Calendar,
  Award,
  Info,
  FileEdit,
  FilePlus2,
  X,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Zap,
  Target,
} from 'lucide-react';

const glass = 'bn-glass-card';
const RANGES = [7, 14, 30, 90];

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildDays(notes, n) {
  const today = startOfToday();
  const days = Array.from({ length: n }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (n - 1 - i));
    return { key: date.toDateString(), date, edited: 0, created: 0, items: [] };
  });
  const map = new Map(days.map((d) => [d.key, d]));
  notes.forEach((note) => {
    const cRaw = note.created_at;
    const uRaw = note.updated_at;
    const createdSameAsUpdated = cRaw && uRaw && new Date(cRaw).getTime() === new Date(uRaw).getTime();

    if (cRaw) {
      const cKey = new Date(cRaw).toDateString();
      const c = map.get(cKey);
      if (c) {
        c.created += 1;
        c.items.push({
          id: note.id,
          title: note.title || 'Untitled',
          action: 'create',
          time: new Date(cRaw).toLocaleTimeString('en-IN', {
            hour: 'numeric',
            minute: '2-digit',
          }),
        });
      }
    }
    if (uRaw && !createdSameAsUpdated) {
      const uKey = new Date(uRaw).toDateString();
      const u = map.get(uKey);
      if (u) {
        u.edited += 1;
        u.items.push({
          id: note.id,
          title: note.title || 'Untitled',
          action: 'edit',
          time: new Date(uRaw).toLocaleTimeString('en-IN', {
            hour: 'numeric',
            minute: '2-digit',
          }),
        });
      }
    }
  });
  return days;
}

function niceMax(v) {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / pow) * pow;
}

const fmtDay = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const fmtDayLong = (d) =>
  d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

export default function ActivityAnalytics({ notes = [] }) {
  const [range, setRange] = useState(14);

  const all = useMemo(() => buildDays(notes, range * 2), [notes, range]);
  const days = all.slice(range);
  const prev = all.slice(0, range);

  const total = days.reduce((s, d) => s + d.edited, 0);
  const totalCreated = days.reduce((s, d) => s + d.created, 0);
  const prevTotal = prev.reduce((s, d) => s + d.edited, 0);
  const delta = prevTotal ? Math.round(((total - prevTotal) / prevTotal) * 100) : null;
  const activeDays = days.filter((d) => d.edited + d.created > 0).length;
  const avgPerDay = activeDays ? (total / activeDays).toFixed(1) : '0';
  const best = days.reduce((b, d) => (d.edited + d.created > b.edited + b.created ? d : b), days[0]);
  const hasData = notes.length > 0;

  const { streak, longestStreak } = useMemo(() => {
    const longer = buildDays(notes, 120);
    let current = 0;
    let bestS = 0;
    let running = 0;
    longer.forEach((d) => {
      if (d.edited + d.created > 0) {
        running += 1;
        bestS = Math.max(bestS, running);
      } else {
        running = 0;
      }
    });
    let i = longer.length - 1;
    if (longer[i].edited + longer[i].created === 0) i -= 1;
    while (i >= 0 && longer[i].edited + longer[i].created > 0) {
      current += 1;
      i -= 1;
    }
    return { streak: current, longestStreak: bestS };
  }, [notes]);

  const productivity = useMemo(() => {
    const consistency = Math.round((activeDays / range) * 100);
    const momentum = delta === null ? 50 : Math.min(100, Math.max(0, 50 + delta));
    const volumeScore = Math.min(100, (total / (range * 2)) * 100);
    return Math.round(consistency * 0.5 + momentum * 0.3 + volumeScore * 0.2);
  }, [activeDays, range, delta, total]);

  const weekComparison = useMemo(() => {
    const currentWeek = days.slice(-7);
    const lastWeek = days.slice(-14, -7);
    const sumC = currentWeek.reduce((s, d) => s + d.edited, 0);
    const sumL = lastWeek.reduce((s, d) => s + d.edited, 0);
    return { currentWeek: sumC, lastWeek: sumL };
  }, [days]);

  return (
    <section aria-label="Activity analytics" className="mb-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-text-main sm:text-xl">
            <Activity size={17} className="text-accent" />
            Activity analytics
          </h2>
          <p className="mt-1 text-xs text-text-muted sm:text-sm">
            A live view of note creation and latest update activity.
          </p>
        </div>
        <div
          role="tablist"
          aria-label="Date range"
          className="inline-flex rounded-xl border border-border/60 bg-card/60 p-1 backdrop-blur-xl"
        >
          {RANGES.map((r) => (
            <button
              key={r}
              role="tab"
              type="button"
              aria-selected={range === r}
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                range === r
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              {r}D
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className={`${glass} rounded-3xl p-8 text-center sm:p-12`}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Activity size={26} />
          </div>
          <h3 className="text-base font-semibold text-text-main sm:text-lg">
            No activity data yet
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-text-muted sm:text-sm">
            Once you start creating and editing notes, your writing rhythm will
            appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <Kpi icon={Activity} label={`Notes updated, last ${range}d`} value={total} tone="violet">
              {delta === null ? (
                <span className="text-text-muted">No prior data</span>
              ) : (
                <span
                  className={
                    delta >= 0
                      ? 'text-emerald-600 dark:text-emerald-300'
                      : 'text-rose-600 dark:text-rose-300'
                  }
                >
                  {delta >= 0 ? (
                    <TrendingUp size={12} className="mr-1 inline" />
                  ) : (
                    <TrendingDown size={12} className="mr-1 inline" />
                  )}
                  {delta >= 0 ? '+' : ''}
                  {delta}% vs prev
                </span>
              )}
            </Kpi>
            <Kpi icon={CalendarCheck} label="Active days" value={`${activeDays}/${range}`} tone="sky">
              <span className="text-text-muted">
                {Math.round((activeDays / range) * 100)}% consistency
              </span>
            </Kpi>
            <Kpi icon={Trophy} label="Best day" value={(best?.edited || 0) + (best?.created || 0)} tone="amber">
              <span className="text-text-muted">
                {best && best.edited + best.created > 0 ? fmtDay(best.date) : 'No activity yet'}
              </span>
            </Kpi>
            <Kpi icon={Flame} label="Current streak" value={`${streak}d`} tone="rose">
              <span className="text-text-muted">
                {longestStreak > 0 ? `Best: ${longestStreak}d` : 'Start today'}
              </span>
            </Kpi>
            <Kpi icon={Zap} label="Avg / active day" value={avgPerDay} tone="emerald">
              <span className="text-text-muted">notes updated per active day</span>
            </Kpi>
            <Kpi icon={Target} label="Productivity" value={`${productivity}%`} tone="indigo">
              <span className="text-text-muted">
                {productivity >= 75
                  ? 'Excellent rhythm'
                  : productivity >= 50
                    ? 'Steady pace'
                    : 'Room to grow'}
              </span>
            </Kpi>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className={`${glass} rounded-2xl p-4 sm:p-5 lg:col-span-2`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-text-main">Daily activity</h3>
                  <p className="mt-0.5 text-[11px] text-text-muted">
                    Notes created and last updated over the last {range} days
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <i className="h-2.5 w-2.5 rounded-sm bg-accent" /> Edited
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <i className="h-0.5 w-4 rounded bg-amber-500" /> Created
                  </span>
                </div>
              </div>
              <DailyChart days={days} />
            </div>

            <div className={`${glass} flex flex-col rounded-2xl p-4 sm:p-5`}>
              <div className="mb-4">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-text-main">
                  <Clock size={14} className="text-accent" />
                  When you write
                </h3>
                <p className="mt-1 text-[11px] text-text-muted">
                  Share of notes by latest update time
                </p>
              </div>
              <TimeOfDay notes={notes} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <WeekComparison
              thisWeek={weekComparison.currentWeek}
              lastWeek={weekComparison.lastWeek}
            />
            <DayOfWeek notes={notes} />
          </div>

          <div className={`${glass} mt-4 rounded-2xl p-4 sm:p-5`}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-text-main">
                  <Calendar size={14} className="text-accent" />
                  Consistency heatmap
                </h3>
                <p className="mt-1 text-[11px] text-text-muted">
                  Notes updated per day, last 12 weeks
                </p>
              </div>
              <HeatLegend />
            </div>
            <Heatmap notes={notes} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TopActiveDays days={days} />
            <EditCreateRatio edited={total} created={totalCreated} />
          </div>
        </>
      )}
    </section>
  );
}

/* ---------------- KPI ---------------- */
function Kpi({ icon: Icon, label, value, children, tone = 'violet' }) {
  const tones = {
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
    sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-300',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300',
  };
  return (
    <div className={`${glass} min-w-0 rounded-2xl p-3.5 sm:p-4`}>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium text-text-muted sm:text-xs">
          {label}
        </span>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon size={15} strokeWidth={1.9} />
        </span>
      </div>
      <p className="mt-3 text-xl font-bold tabular-nums tracking-tight text-text-main sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 truncate text-[10px] sm:text-[11px]">{children}</p>
    </div>
  );
}

/* ---------------- DAILY CHART (with tooltip + modal) ---------------- */
function DailyChart({ days }) {
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState(null);

  const W = 720;
  const H = 260;
  const L = 34;
  const R = 10;
  const T = 14;
  const B = 30;
  const plotW = W - L - R;
  const plotH = H - T - B;

  const max = niceMax(
    Math.max(1, ...days.map((d) => Math.max(d.edited, d.created))),
  );
  const slot = plotW / days.length;
  const bw = Math.min(28, slot * 0.62);

  const x = (i) => L + slot * i + slot / 2;
  const y = (v) => T + plotH - (v / max) * plotH;

  const ticks = [0, max / 2, max];
  const labelEvery = Math.ceil(days.length / 8);

  const linePts = days.map((d, i) => `${x(i).toFixed(1)},${y(d.created).toFixed(1)}`);
  const line = linePts.join(' ');
  const areaPath = days.length
    ? `M ${x(0).toFixed(1)} ${(T + plotH).toFixed(1)} L ${linePts.join(' L ')} L ${x(days.length - 1).toFixed(1)} ${(T + plotH).toFixed(1)} Z`
    : '';

  const h = hover !== null ? days[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Notes edited and created per day"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="createdArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={L}
              x2={W - R}
              y1={y(t)}
              y2={y(t)}
              stroke="currentColor"
              className="text-border"
              strokeOpacity="0.6"
              strokeDasharray={t === 0 ? '0' : '3 4'}
            />
            <text
              x={L - 8}
              y={y(t) + 3.5}
              textAnchor="end"
              fontSize="10"
              className="fill-text-muted tabular-nums"
            >
              {t}
            </text>
          </g>
        ))}

        {hover !== null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={T}
            y2={T + plotH}
            stroke="currentColor"
            className="text-accent/60"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}

        {days.map((d, i) => {
          const bh = Math.max(d.edited ? 3 : 0, (d.edited / max) * plotH);
          return (
            <rect
              key={d.key}
              x={x(i) - bw / 2}
              y={T + plotH - bh}
              width={bw}
              height={bh}
              rx="3"
              className="fill-accent transition-opacity cursor-pointer"
              fillOpacity={hover === null || hover === i ? 0.92 : 0.35}
              onClick={() => setSelected(d)}
            />
          );
        })}

        {areaPath && <path d={areaPath} fill="url(#createdArea)" />}

        <polyline
          points={line}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {days.map((d, i) =>
          d.created > 0 ? (
            <circle
              key={`dot-${d.key}`}
              cx={x(i)}
              cy={y(d.created)}
              r={hover === i ? 4.5 : 3}
              fill="#f59e0b"
              className="transition-all"
            />
          ) : null,
        )}

        {days.map((d, i) =>
          i % labelEvery === 0 || i === days.length - 1 ? (
            <text
              key={`label-${d.key}`}
              x={x(i)}
              y={H - 10}
              textAnchor="middle"
              fontSize="10"
              className={`fill-current transition-colors ${
                hover === i ? 'text-accent font-semibold' : 'text-text-muted'
              }`}
            >
              {fmtDay(d.date)}
            </text>
          ) : null,
        )}

        {days.map((d, i) => (
          <rect
            key={`hit-${d.key}`}
            x={L + slot * i}
            y={T}
            width={slot}
            height={plotH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            tabIndex={0}
            role="button"
            aria-label={`${fmtDay(d.date)}: ${d.edited} edited, ${d.created} created. Click for details.`}
            onClick={() => setSelected(d)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelected(d);
              }
            }}
            className="cursor-pointer focus-visible:outline-none"
          />
        ))}
      </svg>

      {h && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2"
          style={{
            left: `${Math.min(88, Math.max(12, (x(hover) / W) * 100))}%`,
          }}
        >
          <div className="w-44 rounded-xl border border-border/60 bg-card/95 p-2.5 shadow-xl backdrop-blur-xl">
            <p className="text-[11px] font-bold text-text-main">{fmtDayLong(h.date)}</p>
            <div className="mt-1.5 space-y-1 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-text-muted">
                  <span className="h-1.5 w-1.5 rounded-sm bg-accent" /> Edited
                </span>
                <span className="font-semibold text-text-main">{h.edited}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Created
                </span>
                <span className="font-semibold text-text-main">{h.created}</span>
              </div>
            </div>
            <p className="mt-1.5 border-t border-border/50 pt-1.5 text-[9px] italic text-text-muted">
              Click for details →
            </p>
          </div>
        </div>
      )}

      {selected && (
        <DayModal day={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

/* ---------------- DAY MODAL ---------------- */
function DayModal({ day, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const weekday = day.date.toLocaleDateString('en-IN', { weekday: 'long' });
  const fullDate = day.date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const totalItems = day.edited + day.created;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-modal-title"
    >
      <div
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border/60 bg-card p-5 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition hover:bg-border/60 hover:text-text-main"
          aria-label="Close"
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        <div className="pr-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent">{weekday}</p>
          <h3 id="day-modal-title" className="mt-1 text-lg font-bold tracking-tight text-text-main">
            {fullDate}
          </h3>
          <p className="mt-1 text-xs text-text-muted">
            {totalItems === 0
              ? 'No activity this day'
              : `${totalItems} total ${totalItems === 1 ? 'activity' : 'activities'}`}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <ModalStat label="Created" value={day.created} color="violet" />
          <ModalStat label="Edited" value={day.edited} color="emerald" />
        </div>

        {day.items.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">
              Items ({day.items.length})
            </p>
            <ul className="max-h-52 space-y-1.5 overflow-y-auto">
              {day.items.map((item, i) => (
                <li
                  key={`${item.id || i}-${item.action}-${i}`}
                  className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/40 px-3 py-2"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                      item.action === 'edit'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-violet-500/10 text-violet-500'
                    }`}
                  >
                    {item.action === 'edit' ? '✎' : '+'}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-text-main">
                    {item.title}
                  </span>
                  <span className="shrink-0 text-[10px] tabular-nums text-text-muted">
                    {item.time}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-105"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalStat({ label, value, color }) {
  const colors = {
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  };
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 p-3">
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-[10px] font-medium text-text-muted">{label}</span>
        <span className={`h-2 w-2 rounded-sm ${colors[color]}`} />
      </div>
      <p className="mt-1.5 text-xl font-bold tabular-nums text-text-main">{value}</p>
    </div>
  );
}

/* ---------------- TIME OF DAY ---------------- */
function TimeOfDay({ notes }) {
  const blocks = useMemo(() => {
    const b = [
      { label: 'Morning', range: '6 am – 12 pm', count: 0, icon: Sunrise },
      { label: 'Afternoon', range: '12 – 6 pm', count: 0, icon: Sun },
      { label: 'Evening', range: '6 pm – 12 am', count: 0, icon: Sunset },
      { label: 'Night', range: '12 – 6 am', count: 0, icon: Moon },
    ];
    notes.forEach((n) => {
      if (!n.updated_at) return;
      const hr = new Date(n.updated_at).getHours();
      b[hr >= 6 && hr < 12 ? 0 : hr >= 12 && hr < 18 ? 1 : hr >= 18 ? 2 : 3].count += 1;
    });
    return b;
  }, [notes]);

  const sum = blocks.reduce((s, b) => s + b.count, 0);
  if (!sum) {
    return <p className="mt-8 text-center text-xs text-text-muted">Not enough data yet.</p>;
  }

  const peak = blocks.reduce((a, b) => (b.count > a.count ? b : a), blocks[0]);

  return (
    <div className="flex flex-1 flex-col">
      <ul className="space-y-3.5">
        {blocks.map((b) => {
          const pct = Math.round((b.count / sum) * 100);
          const Icon = b.icon;
          const isPeak = b.label === peak.label && b.count > 0;
          return (
            <li key={b.label}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-text-main">
                  <Icon size={12} className="text-accent" />
                  {b.label}
                  {isPeak && (
                    <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] font-bold text-accent">
                      PEAK
                    </span>
                  )}
                </span>
                <span className="tabular-nums text-text-muted">{pct}%</span>
              </div>
              <div
                className="mt-1.5 h-2 overflow-hidden rounded-full bg-border/60"
                role="img"
                aria-label={`${b.label}: ${pct}%`}
              >
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-[10px] text-text-muted">{b.range}</p>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto pt-4">
        <div className="flex items-start gap-2 rounded-xl bg-accent/5 p-2.5">
          <Sparkles size={13} className="mt-0.5 shrink-0 text-accent" />
          <p className="text-[11px] leading-4 text-text-muted">
            You write most in the <strong className="text-text-main">{peak.label.toLowerCase()}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- WEEK COMPARISON ---------------- */
function WeekComparison({ thisWeek, lastWeek }) {
  const delta =
    lastWeek === 0
      ? thisWeek > 0
        ? 100
        : 0
      : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  const isUp = delta >= 0;
  const max = Math.max(thisWeek, lastWeek, 1);

  return (
    <div className={`${glass} rounded-2xl p-4 sm:p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-text-main">Week over week</h3>
          <p className="mt-1 text-[11px] text-text-muted">This week vs last week</p>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
            isUp
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-300'
          }`}
        >
          {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {isUp ? '+' : ''}
          {delta}%
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <BarRow label="This week" value={thisWeek} max={max} tone="bg-accent" />
        <BarRow label="Last week" value={lastWeek} max={max} tone="bg-text-muted/40" />
      </div>
    </div>
  );
}

function BarRow({ label, value, max, tone }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-text-muted">{label}</span>
        <span className="font-bold tabular-nums text-text-main">{value}</span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-border/50">
        <div className={`h-full rounded-full ${tone} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ---------------- DAY OF WEEK ---------------- */
function DayOfWeek({ notes }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const counts = useMemo(() => {
    const c = Array(7).fill(0);
    notes.forEach((n) => {
      if (!n.updated_at) return;
      c[new Date(n.updated_at).getDay()] += 1;
    });
    return c;
  }, [notes]);

  const max = Math.max(1, ...counts);
  const sum = counts.reduce((s, v) => s + v, 0);
  const bestIdx = counts.indexOf(Math.max(...counts));
  const peakDay = days[bestIdx];

  return (
    <div className={`${glass} rounded-2xl p-4 sm:p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-text-main">Day of week pattern</h3>
          <p className="mt-1 text-[11px] text-text-muted">Which days you're most active</p>
        </div>
        {sum > 0 && (
          <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-bold text-accent">
            Peak: {peakDay}
          </span>
        )}
      </div>

      <div className="mt-5 flex items-end gap-1.5">
        {counts.map((v, i) => {
          const h = sum > 0 ? Math.max(6, (v / max) * 90) : 6;
          const isBest = i === bestIdx && v > 0;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={`w-full rounded-t-md transition-all ${
                  isBest ? 'bg-accent' : 'bg-accent/40'
                }`}
                style={{ height: `${h}px` }}
                title={`${days[i]}: ${v} edits`}
              />
              <span
                className={`text-[10px] font-medium ${
                  isBest ? 'text-accent' : 'text-text-muted'
                }`}
              >
                {days[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- HEATMAP ---------------- */
function Heatmap({ notes }) {
  const days = useMemo(() => buildDays(notes, 84), [notes]);
  const max = Math.max(1, ...days.map((d) => d.edited + d.created));

  const cell = 14;
  const gap = 4;
  const cols = 12;
  const leftPad = 26;
  const topPad = 18;
  const W = leftPad + cols * (cell + gap) - gap;
  const H = topPad + 7 * (cell + gap) - gap;

  const weekdays = ['Mon', '', 'Wed', '', 'Fri', '', ''];

  const monthLabels = [];
  let lastCol = -1;
  days.forEach((d, i) => {
    const col = Math.floor(i / 7);
    const m = d.date.getMonth();
    if (col !== lastCol) {
      monthLabels.push({
        col,
        label: d.date.toLocaleDateString('en-IN', { month: 'short' }),
      });
      lastCol = col;
    }
  });

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full min-w-[420px] max-w-3xl"
        role="img"
        aria-label="Edit heatmap, last 12 weeks"
      >
        {monthLabels.map((m, i) => {
          const prev = monthLabels[i - 1];
          if (prev && m.col - prev.col < 2) return null;
          return (
            <text
              key={`${m.label}-${i}`}
              x={leftPad + m.col * (cell + gap)}
              y={10}
              fontSize="9"
              className="fill-text-muted"
            >
              {m.label}
            </text>
          );
        })}

        {weekdays.map((label, i) =>
          label ? (
            <text
              key={`wd-${i}`}
              x={leftPad - 4}
              y={topPad + i * (cell + gap) + cell - 3}
              fontSize="9"
              textAnchor="end"
              className="fill-text-muted"
            >
              {label}
            </text>
          ) : null,
        )}

        {days.map((d, i) => (
          <rect
            key={d.key}
            x={leftPad + Math.floor(i / 7) * (cell + gap)}
            y={topPad + (i % 7) * (cell + gap)}
            width={cell}
            height={cell}
            rx="3"
            className={d.edited + d.created ? 'fill-accent' : 'fill-border'}
            fillOpacity={d.edited + d.created ? 0.25 + 0.75 * ((d.edited + d.created) / max) : 0.5}
          >
            <title>{`${fmtDayLong(d.date)}: ${d.edited + d.created} activities (${d.edited} updated, ${d.created} created)`}</title>
          </rect>
        ))}
      </svg>
    </div>
  );
}

function HeatLegend() {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
      Less
      {[0.15, 0.4, 0.65, 0.9].map((o) => (
        <i key={o} className="h-2.5 w-2.5 rounded-[3px] bg-accent" style={{ opacity: o }} />
      ))}
      More
    </div>
  );
}

/* ---------------- TOP DAYS ---------------- */
function TopActiveDays({ days }) {
  const top = [...days]
    .filter((d) => d.edited + d.created > 0)
    .sort((a, b) => b.edited + b.created - (a.edited + a.created))
    .slice(0, 5);

  return (
    <div className={`${glass} rounded-2xl p-4 sm:p-5`}>
      <div className="flex items-center gap-2">
        <Award size={14} className="text-accent" />
        <h3 className="text-sm font-semibold text-text-main">Most active days</h3>
      </div>
      <p className="mt-1 text-[11px] text-text-muted">Your top 5 days this period</p>

      {top.length === 0 ? (
        <p className="mt-6 text-center text-xs text-text-muted">No activity in this range.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {top.map((d, i) => {
            const total = d.edited + d.created;
            return (
              <li
                key={d.key}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/40 px-3 py-2.5"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                    i === 0
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                      : i === 1
                        ? 'bg-sky-500/15 text-sky-600 dark:text-sky-300'
                        : i === 2
                          ? 'bg-orange-500/15 text-orange-600 dark:text-orange-300'
                          : 'bg-accent/10 text-accent'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-text-main">
                    {fmtDayLong(d.date)}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-[10px] text-text-muted">
                    <span className="inline-flex items-center gap-0.5">
                      <FileEdit size={9} /> {d.edited}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <FilePlus2 size={9} /> {d.created}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 text-sm font-bold tabular-nums text-text-main">
                  {total}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ---------------- EDIT/CREATE RATIO ---------------- */
function EditCreateRatio({ edited, created }) {
  const total = edited + created;
  const size = 120;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const editFrac = total ? edited / total : 0;
  const editLen = editFrac * circumference;

  return (
    <div className={`${glass} rounded-2xl p-4 sm:p-5`}>
      <div className="flex items-center gap-2">
        <Info size={14} className="text-accent" />
        <h3 className="text-sm font-semibold text-text-main">Edit vs create ratio</h3>
      </div>
      <p className="mt-1 text-[11px] text-text-muted">How you spend time in your workspace</p>

      {total === 0 ? (
        <p className="mt-6 text-center text-xs text-text-muted">No activity yet.</p>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={stroke}
              strokeOpacity="0.25"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              className="text-accent"
              strokeWidth={stroke}
              strokeDasharray={`${editLen} ${circumference - editLen}`}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
            <text
              x={size / 2}
              y={size / 2 + 2}
              textAnchor="middle"
              className="fill-text-main"
              fontSize="16"
              fontWeight="700"
            >
              {Math.round(editFrac * 100)}%
            </text>
            <text
              x={size / 2}
              y={size / 2 + 16}
              textAnchor="middle"
              className="fill-text-muted"
              fontSize="9"
            >
              edits
            </text>
          </svg>

          <ul className="w-full space-y-2 text-xs">
            <li className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-accent" />
                <span className="text-text-main">Edited</span>
              </span>
              <span className="font-semibold tabular-nums text-text-muted">{edited}</span>
            </li>
            <li className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-500/50" />
                <span className="text-text-main">Created</span>
              </span>
              <span className="font-semibold tabular-nums text-text-muted">{created}</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}