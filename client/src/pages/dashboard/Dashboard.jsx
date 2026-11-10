import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Activity,
  Bookmark,
  ChevronRight,
  Compass,
  FilePlus2,
  Grid2X2,
  ListTodo,
  NotebookTabs,
  PenLine,
  Quote,
  Target,
  BookOpen,
  CalendarDays,
  Clock3,
  FileText,
  FolderOpen,
  FolderTree,
  Heart,
  Lightbulb,
  NotebookPen,
  Pin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  TrendingDown,
  Vault,
  Flame,
  BarChart3,
  PieChart,
  Zap,
  X,
} from 'lucide-react';

import {
  notesApi,
  foldersApi,
  remindersApi,
  journalApi,
} from '../../services/index.js';

import { NoteCard } from '../../components/notes/NoteCard.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { PageLoader, EmptyState } from '../../components/ui/Spinner.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { parseDate, dayKey, startOfDay, useNow } from '../../utils/ActivityUtils.js';

import lavenderBackground from '../../../assets/background/fav4.png';

const glass = 'bn-glass-card';

const POLL = 20_000; // realtime refresh interval

const QK = {
  dashboardNotes: ['notes', 'dashboard'],
  allNotesForAnalytics: ['notes', 'analytics', 'all'],
  pinned: ['notes', 'pinned'],
  favorites: ['notes', 'favorites'],
  folders: ['folders'],
  reminders: ['reminders', 'upcoming'],
  allReminders: ['reminders', 'analytics', 'all'],
  journal: ['journal', 'recent'],
  allJournal: ['journal', 'analytics', 'all'],
};

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [activityRange, setActivityRange] = useState('7d');
  const now = useNow(30_000);

  const firstName = (profile?.full_name || 'there').trim().split(/\s+/)[0];

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['notes'] });
    queryClient.invalidateQueries({ queryKey: ['folders'] });
    queryClient.invalidateQueries({ queryKey: ['reminders'] });
    queryClient.invalidateQueries({ queryKey: ['journal'] });
  };

  const createNote = useMutation({
    mutationFn: () => notesApi.create({ title: 'Untitled note' }),
    onSuccess: (note) => {
      invalidateAll();
      navigate(`/app/notes/${note.id}`);
    },
    onError: (error) => toast.error(error.message || 'Could not create note'),
  });

  const {
    data: notesData,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: QK.dashboardNotes,
    queryFn: () => notesApi.list({ limit: 6, sort: 'updated' }),
    staleTime: 15_000,
    refetchInterval: POLL,
    refetchOnWindowFocus: true,
  });

  const { data: analyticsNotes } = useQuery({
    queryKey: QK.allNotesForAnalytics,
    queryFn: () => notesApi.list({ limit: 1000, sort: 'updated' }),
    staleTime: 15_000,
    refetchInterval: POLL,
    refetchOnWindowFocus: true,
  });

  const { data: pinned } = useQuery({
    queryKey: QK.pinned,
    queryFn: () => notesApi.list({ pinned: true, limit: 3 }),
    staleTime: 15_000,
    refetchInterval: POLL,
    refetchOnWindowFocus: true,
  });

  const { data: favorites } = useQuery({
    queryKey: QK.favorites,
    queryFn: () => notesApi.list({ favorite: true, limit: 4 }),
    staleTime: 15_000,
    refetchInterval: POLL,
    refetchOnWindowFocus: true,
  });

  const { data: folders } = useQuery({
    queryKey: QK.folders,
    queryFn: () => foldersApi.list(),
    staleTime: 30_000,
    refetchInterval: POLL * 2,
    refetchOnWindowFocus: true,
  });

  const { data: reminders } = useQuery({
    queryKey: QK.reminders,
    queryFn: () => remindersApi.list({ upcoming: true, limit: 4 }),
    staleTime: 15_000,
    refetchInterval: POLL,
    refetchOnWindowFocus: true,
  });

  // Full reminder list (past + upcoming) so analytics count every day correctly
  const { data: allRemindersData } = useQuery({
    queryKey: QK.allReminders,
    queryFn: () => remindersApi.list({ limit: 500 }),
    staleTime: 15_000,
    refetchInterval: POLL,
    refetchOnWindowFocus: true,
  });

  const { data: journal } = useQuery({
    queryKey: QK.journal,
    queryFn: () => journalApi.list({ limit: 3 }),
    staleTime: 15_000,
    refetchInterval: POLL,
    refetchOnWindowFocus: true,
  });

  // Full journal list for analytics
  const { data: allJournalData } = useQuery({
    queryKey: QK.allJournal,
    queryFn: () => journalApi.list({ limit: 500 }),
    staleTime: 15_000,
    refetchInterval: POLL,
    refetchOnWindowFocus: true,
  });

  const recent = notesData?.items || [];
  const allNotes = analyticsNotes?.items || [];
  const pinnedItems = pinned?.items || [];
  const favoriteItems = favorites?.items || [];
  const reminderItems = reminders?.items || [];
  const journalItems = journal?.items || [];
  const allReminders = allRemindersData?.items || reminderItems;
  const allJournal = allJournalData?.items || journalItems;
  const totalNotes = analyticsNotes?.total ?? notesData?.total ?? allNotes.length ?? recent.length;
  const folderItems = Array.isArray(folders) ? folders : (folders?.items || []);
  const folderCount = folderItems.length;
  const favoriteCount = favorites?.total ?? favoriteItems.length;
  const pinnedCount = pinned?.total ?? pinnedItems.length;
  const reminderCount = reminders?.total ?? reminderItems.length;
  const journalCount = journal?.total ?? journalItems.length;
  const hasWorkspaceContent = recent.length > 0 || folderCount > 0 || journalCount > 0;

  // ============================================================
  // DAY DETAILS — per-day breakdown (LOCAL timezone)
  // ============================================================
  const dayDetails = useMemo(() => {
    const map = {};
    const ensure = (k) =>
      (map[k] ||= { edited: 0, created: 0, deleted: 0, journal: 0, reminders: 0, items: [] });
    const fmtTime = (d) =>
      d ? d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '';

    allNotes.forEach((n) => {
      const c = parseDate(n.created_at);
      const u = parseDate(n.updated_at);

      if (c) {
        const e = ensure(dayKey(c));
        e.created += 1;
        e.items.push({
          id: n.id,
          title: n.title || 'Untitled',
          action: 'create',
          time: fmtTime(c),
          ts: c.getTime(),
        });
      }

      // Count as an edit only if updated >60s after creation
      if (u && (!c || u.getTime() - c.getTime() > 60_000)) {
        const e = ensure(dayKey(u));
        e.edited += 1;
        e.items.push({
          id: n.id,
          title: n.title || 'Untitled',
          action: 'edit',
          time: fmtTime(u),
          ts: u.getTime(),
        });
      }
    });

    allJournal.forEach((j) => {
      const d = parseDate(j.entry_date || j.created_at);
      if (!d) return;
      const e = ensure(dayKey(d));
      e.journal += 1;
      const t = parseDate(j.created_at);
      e.items.push({
        id: j.id,
        title: j.title || 'Journal entry',
        action: 'journal',
        time: fmtTime(t),
        ts: (t || d).getTime(),
      });
    });

    allReminders.forEach((r) => {
      const d = parseDate(r.remind_at);
      if (!d) return;
      const e = ensure(dayKey(d));
      e.reminders += 1;
      e.items.push({
        id: r.id,
        title: r.title || 'Reminder',
        action: 'reminder',
        time: fmtTime(d),
        ts: d.getTime(),
      });
    });

    Object.values(map).forEach((e) => e.items.sort((a, b) => b.ts - a.ts));
    return map;
  }, [allNotes, allJournal, allReminders]);

  // ============================================================
  // ANALYTICS
  // ============================================================
  const analytics = useMemo(() => {
    const days = activityRange === '7d' ? 7 : activityRange === '30d' ? 30 : 90;
    const today = startOfDay(now);

    const buckets = Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (days - 1 - i));
      const key = dayKey(d);
      const det = dayDetails[key];
      return {
        date: d,
        key,
        notes: (det?.created || 0) + (det?.edited || 0),
        journal: det?.journal || 0,
        reminders: det?.reminders || 0,
      };
    });

    const sumOffset = (off) => {
      const d = new Date(today);
      d.setDate(d.getDate() - off);
      const x = dayDetails[dayKey(d)];
      return x ? x.created + x.edited + x.journal + x.reminders : 0;
    };

    let thisWeek = 0;
    let lastWeek = 0;
    for (let i = 0; i < 7; i++) {
      thisWeek += sumOffset(i);
      lastWeek += sumOffset(i + 7);
    }
    const weekTrend =
      lastWeek === 0
        ? thisWeek > 0
          ? 100
          : 0
        : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);

    const totalInPeriod = buckets.reduce(
      (s, b) => s + b.notes + b.journal + b.reminders,
      0,
    );

    const distribution = [
      { label: 'Notes', value: Math.max(totalNotes - favoriteCount - pinnedCount, 0) || totalNotes, color: '#8b5cf6' },
      { label: 'Favorites', value: favoriteCount, color: '#f43f5e' },
      { label: 'Pinned', value: pinnedCount, color: '#f59e0b' },
      { label: 'Folders', value: folderCount, color: '#10b981' },
    ].filter((d) => d.value > 0);
    const distTotal = distribution.reduce((s, d) => s + d.value, 0);

    // Streak: if today is still empty, start counting from yesterday
    let streak = 0;
    for (let i = buckets.length - 1; i >= 0; i--) {
      const b = buckets[i];
      if (b.notes + b.journal + b.reminders > 0) streak++;
      else if (i < buckets.length - 1) break;
    }

    let peakDay = buckets[0];
    buckets.forEach((b) => {
      const sum = b.notes + b.journal + b.reminders;
      const peakSum = peakDay.notes + peakDay.journal + peakDay.reminders;
      if (sum > peakSum) peakDay = b;
    });

    const sparkline = buckets.slice(-7).map(
      (b) => b.notes + b.journal + b.reminders,
    );

    return {
      buckets,
      totalInPeriod,
      weekTrend,
      distribution,
      distTotal,
      streak,
      peakDay,
      sparkline,
      thisWeek,
      lastWeek,
      todayCount: sumOffset(0),
    };
  }, [activityRange, dayDetails, now, totalNotes, favoriteCount, pinnedCount, folderCount]);

  const refreshAll = () => {
    invalidateAll();
    refetch();
  };

  const dateLabel = useMemo(
    () =>
      now.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [now],
  );

  const greeting = useMemo(() => {
    const hour = now.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, [now]);

  if (isLoading) return <PageLoader />;

  if (isError) {
    return (
      <PageBackground>
        <main className="mx-auto flex min-h-[70vh] w-full max-w-[1440px] items-center justify-center px-4 py-10 sm:px-6">
          <div className={`${glass} w-full max-w-lg rounded-3xl p-7 text-center sm:p-10`}>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
              <NotebookPen size={25} />
            </div>
            <h2 className="text-xl font-semibold text-text-main">
              Unable to load your workspace
            </h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              {error?.message ||
                'Your dashboard could not be loaded. Please check your connection and try again.'}
            </p>
            <Button className="mt-6" onClick={refreshAll} loading={isFetching} disabled={isFetching}>
              <RefreshCw size={15} /> Try again
            </Button>
          </div>
        </main>
      </PageBackground>
    );
  }

  return (
    <PageBackground>
      <main className="relative mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7 lg:px-9 lg:py-9">
        {/* ================= HEADER ================= */}
        <header className="mb-7 sm:mb-9">
          <div className={`${glass} relative overflow-hidden rounded-[28px] p-5 sm:p-7 lg:p-8`}>
            <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-pink-300/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-accent">
                  <Sparkles size={13} /> YOUR PERSONAL WORKSPACE
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-text-main sm:text-3xl lg:text-[2.15rem]">
                  {greeting}, {firstName} <span aria-hidden="true">✦</span>
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted sm:text-base">
                  Everything you write, save and plan—together in one calm, organized space.
                </p>
                <p className="mt-4 flex items-center gap-2 text-xs font-medium text-text-muted sm:text-sm">
                  <CalendarDays size={15} className="text-accent" /> {dateLabel}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    Live · auto-updating
                  </span>
                  {analytics.streak > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-[11px] font-semibold text-orange-700 dark:text-orange-300">
                      <Flame size={12} /> {analytics.streak}-day streak
                    </span>
                  )}
                  {analytics.todayCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300">
                      <Zap size={12} /> {analytics.todayCount} today
                    </span>
                  )}
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row lg:shrink-0">
                <Button
                  variant="outline"
                  onClick={refreshAll}
                  loading={isFetching}
                  disabled={isFetching}
                  className="justify-center"
                >
                  <RefreshCw size={15} /> Refresh
                </Button>
                <Button
                  onClick={() => createNote.mutate()}
                  loading={createNote.isPending}
                  disabled={createNote.isPending}
                  className="justify-center"
                >
                  <Plus size={16} /> Create a note
                </Button>
              </div>
            </div>

            <div className="relative mt-6 grid grid-cols-1 gap-3 border-t border-border/50 pt-5 sm:grid-cols-4">
              <WelcomeMetric icon={NotebookPen} label="Notes collected" value={totalNotes} />
              <WelcomeMetric icon={Pin} label="Important notes" value={pinnedCount} />
              <WelcomeMetric icon={Heart} label="Saved as favorites" value={favoriteCount} />
              <WelcomeMetric
                icon={TrendingUp}
                label="This week's activity"
                value={analytics.thisWeek}
                trend={analytics.weekTrend}
              />
            </div>
          </div>
        </header>

        {/* ================= STAT CARDS ================= */}
        <section className="mb-8">
          <SectionHeading
            icon={FolderTree}
            title="Workspace overview"
            description="A snapshot of the content and spaces in your BloomNotes workspace."
          />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard
              label="All notes"
              value={totalNotes}
              description="Your thoughts and ideas"
              icon={NotebookPen}
              tone="lavender"
              onClick={() => navigate('/app/notes')}
              spark={analytics.sparkline}
            />
            <StatCard
              label="Favorites"
              value={favoriteCount}
              description="Notes worth revisiting"
              icon={Star}
              tone="rose"
              onClick={() => navigate('/app/favorites')}
            />
            <StatCard
              label="Pinned notes"
              value={pinnedCount}
              description="Your important notes"
              icon={Pin}
              tone="amber"
              onClick={() => navigate('/app/pinned')}
            />
            <StatCard
              label="Folders"
              value={folderCount}
              description="Your organized spaces"
              icon={FolderOpen}
              tone="green"
              onClick={() => navigate('/app/folders')}
            />
          </div>
        </section>

        {/* ================= DAILY ACTIVITY GRAPH ================= */}
        <section className="mb-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <SectionHeading
              icon={BarChart3}
              title="Daily activity"
              description="Your writing rhythm — notes, journal entries and reminders over time."
            />
            <div className="inline-flex items-center gap-1 rounded-xl border border-border/60 bg-card/50 p-1">
              {[
                { key: '7d', label: '7D' },
                { key: '30d', label: '30D' },
                { key: '90d', label: '90D' },
              ].map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setActivityRange(r.key)}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                    activityRange === r.key
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <ActivityChart
            buckets={analytics.buckets}
            range={activityRange}
            dayDetails={dayDetails}
          />

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat
              icon={Zap}
              label="Total in period"
              value={analytics.totalInPeriod}
              tone="violet"
            />
            <MiniStat
              icon={analytics.weekTrend >= 0 ? TrendingUp : TrendingDown}
              label="vs last week"
              value={`${analytics.weekTrend >= 0 ? '+' : ''}${analytics.weekTrend}%`}
              tone={analytics.weekTrend >= 0 ? 'green' : 'rose'}
            />
            <MiniStat
              icon={Flame}
              label="Current streak"
              value={`${analytics.streak} ${analytics.streak === 1 ? 'day' : 'days'}`}
              tone="amber"
            />
            <MiniStat
              icon={Target}
              label="Peak day"
              value={
                analytics.peakDay &&
                analytics.peakDay.notes + analytics.peakDay.journal + analytics.peakDay.reminders > 0
                  ? new Date(analytics.peakDay.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })
                  : '—'
              }
              tone="blue"
            />
          </div>
        </section>

        {/* ================= HEATMAP + DISTRIBUTION ================= */}
        <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ActivityHeatmap buckets={analytics.buckets} />
          </div>
          <div>
            <ContentDistribution
              data={analytics.distribution}
              total={analytics.distTotal}
            />
          </div>
        </section>

        {/* ================= QUICK ACCESS ================= */}
        <section className="mb-8">
          <SectionHeading
            icon={Lightbulb}
            title="Quick access"
            description="Jump straight into the things you use most."
          />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            <QuickAction
              icon={Plus}
              title="New note"
              detail="Capture an idea"
              onClick={() => createNote.mutate()}
            />
            <QuickAction
              icon={Search}
              title="Browse notes"
              detail="Find something"
              onClick={() => navigate('/app/notes')}
            />
            <QuickAction
              icon={BookOpen}
              title="My journal"
              detail="Write a reflection"
              onClick={() => navigate('/app/journal')}
            />
            <QuickAction
              icon={Clock3}
              title="Reminders"
              detail="See what's next"
              onClick={() => navigate('/app/reminders')}
            />
            <QuickAction
              icon={Vault}
              title="Private vault"
              detail="Open saved files"
              onClick={() => navigate('/app/vault')}
            />
          </div>
        </section>

        {/* ================= WORKSPACE PULSE ================= */}
        <section className="mb-8">
          <SectionHeading
            icon={Activity}
            title="Your workspace at a glance"
            description="A simple overview of the spaces you have been using."
          />
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <PulseCard
              icon={NotebookTabs}
              title="Notes library"
              value={totalNotes}
              detail="Notes available in your workspace"
              tone="violet"
              actionLabel="Open library"
              onClick={() => navigate('/app/notes')}
            />
            <PulseCard
              icon={Bookmark}
              title="Saved for later"
              value={favoriteCount}
              detail="Favorite notes you can revisit"
              tone="rose"
              actionLabel="View favorites"
              onClick={() => navigate('/app/favorites')}
            />
            <PulseCard
              icon={ListTodo}
              title="Coming up"
              value={reminderCount}
              detail="Upcoming reminders"
              tone="amber"
              actionLabel="Review reminders"
              onClick={() => navigate('/app/reminders')}
            />
          </div>
        </section>

        {/* ================= DESTINATIONS ================= */}
        <section className="mb-8">
          <SectionHeading
            icon={Compass}
            title="Explore your workspace"
            description="Dedicated spaces for every kind of thought and task."
          />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DestinationCard
              icon={NotebookPen}
              title="All notes"
              detail="Browse, search and organize every note."
              count={totalNotes}
              tone="violet"
              onClick={() => navigate('/app/notes')}
            />
            <DestinationCard
              icon={FolderOpen}
              title="Folders"
              detail="Keep related notes together."
              count={folderCount}
              tone="blue"
              onClick={() => navigate('/app/folders')}
            />
            <DestinationCard
              icon={Star}
              title="Favorites"
              detail="Your most useful notes in one place."
              count={favoriteCount}
              tone="rose"
              onClick={() => navigate('/app/favorites')}
            />
            <DestinationCard
              icon={Pin}
              title="Pinned"
              detail="Quick access to important information."
              count={pinnedCount}
              tone="amber"
              onClick={() => navigate('/app/pinned')}
            />
          </div>
        </section>

        {/* ================= COLLECTIONS ================= */}
        <section className="mb-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <SectionHeading
              icon={FolderTree}
              title="Your collections"
              description="A quick look at the folders that keep your notes organized."
            />
            <TextAction
              label="Manage folders"
              onClick={() => navigate('/app/folders')}
            />
          </div>
          {folderItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {folderItems.slice(0, 3).map((folder, index) => (
                <FolderPreviewCard
                  key={folder.id || folder._id || index}
                  folder={folder}
                  index={index}
                  onClick={() => navigate('/app/folders')}
                />
              ))}
            </div>
          ) : (
            <div
              className={`${glass} flex flex-col items-start gap-4 rounded-3xl p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-300">
                  <FolderOpen size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-main">
                    No folders created yet
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    Create folders when you want to group related notes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/app/folders')}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border/70 bg-card/60 px-3.5 py-2.5 text-xs font-semibold text-text-main transition hover:border-accent/30 hover:text-accent"
              >
                <FolderOpen size={14} /> Open folders
              </button>
            </div>
          )}
        </section>

        {!hasWorkspaceContent && (
          <section className="mb-8">
            <GettingStartedCard
              onCreate={() => createNote.mutate()}
              onBrowse={() => navigate('/app/notes')}
              loading={createNote.isPending}
            />
          </section>
        )}

        {/* ================= PINNED ================= */}
        <section className="mb-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <SectionHeading
              icon={Pin}
              title="Pinned for later"
              description="Keep your most important notes close at hand."
            />
            <TextAction
              label="View pinned"
              onClick={() => navigate('/app/pinned')}
            />
          </div>
          {pinnedItems.length ? (
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {pinnedItems.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <div
              className={`${glass} flex flex-col items-center rounded-3xl px-5 py-7 text-center sm:py-9`}
            >
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Pin size={18} />
              </span>
              <p className="text-sm font-semibold text-text-main">
                Nothing pinned yet
              </p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-text-muted">
                Pin a note you want to access quickly. It will appear in this
                section.
              </p>
            </div>
          )}
        </section>

        {/* ================= RECENT ================= */}
        <section className="mb-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <SectionHeading
              icon={NotebookPen}
              title="Recently edited"
              description="Pick up where you left off with your latest notes."
            />
            <TextAction
              label="Explore all notes"
              onClick={() => navigate('/app/notes')}
            />
          </div>
          {recent.length === 0 ? (
            <div className={`${glass} rounded-3xl px-5 py-12 text-center`}>
              <EmptyState
                icon={NotebookPen}
                title="Your workspace is ready"
                description="Create your first note and start collecting your thoughts, ideas and important information."
                action={
                  <Button
                    onClick={() => createNote.mutate()}
                    loading={createNote.isPending}
                  >
                    <Plus size={15} /> Create your first note
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
              {recent.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          )}
        </section>

        {/* ================= FAVORITES / REMINDERS / JOURNAL ================= */}
        <section className="mb-8 grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
          <DashboardPanel
            className="xl:col-span-1"
            icon={Star}
            title="Favorite notes"
            description="Your personally bookmarked notes."
            actionLabel="See all"
            onAction={() => navigate('/app/favorites')}
            isEmpty={favoriteItems.length === 0}
            emptyTitle="No favorites yet"
            emptyDescription="Mark notes as favorites to keep your best ideas within easy reach."
          >
            {favoriteItems.map((note) => (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/app/notes/${note.id}`)}
                  className="group flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-accent/5 sm:px-5"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                    <Star size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-text-main">
                      {note.title || 'Untitled note'}
                    </span>
                    <span className="mt-1 block text-xs text-text-muted">
                      Open favorite note
                    </span>
                  </span>
                  <ArrowUpRight
                    size={15}
                    className="mt-1 shrink-0 text-text-muted transition group-hover:text-accent"
                  />
                </button>
              </li>
            ))}
          </DashboardPanel>

          <DashboardPanel
            className="xl:col-span-1"
            icon={Clock3}
            title="Upcoming reminders"
            description="A little nudge for what's coming up."
            actionLabel="All reminders"
            onAction={() => navigate('/app/reminders')}
            isEmpty={reminderItems.length === 0}
            emptyTitle="You're all caught up"
            emptyDescription="New reminders and scheduled tasks will show up here."
          >
            {reminderItems.map((reminder) => (
              <li
                key={reminder.id}
                className="flex items-start gap-3 border-b border-border/50 px-4 py-4 last:border-0 sm:px-5"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300">
                  <Clock3 size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold text-text-main">
                    {reminder.title}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-text-muted">
                    <CalendarDays size={12} />
                    {formatDateTime(reminder.remind_at)}
                  </p>
                </div>
              </li>
            ))}
          </DashboardPanel>

          <DashboardPanel
            className="xl:col-span-1"
            icon={BookOpen}
            title="Journal activity"
            description="Recent moments from your journal."
            actionLabel="Open journal"
            onAction={() => navigate('/app/journal')}
            isEmpty={journalItems.length === 0}
            emptyTitle="Your story starts here"
            emptyDescription="Your journal entries will appear here whenever you write a new reflection."
          >
            {journalItems.map((entry) => (
              <li
                key={entry.id}
                className="flex items-start gap-3 border-b border-border/50 px-4 py-4 last:border-0 sm:px-5"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                  <FileText size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold text-text-main">
                    {entry.title || 'Untitled entry'}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-text-muted">
                    <CalendarDays size={12} />
                    {entry.entry_date || 'Journal entry'}
                  </p>
                </div>
              </li>
            ))}
          </DashboardPanel>
        </section>

        {/* ================= WORKFLOW ================= */}
        <section className="mb-8">
          <SectionHeading
            icon={Target}
            title="A calmer way to stay organized"
            description="A few small actions can keep your workspace clear and useful."
          />
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <div className={`${glass} overflow-hidden rounded-3xl p-5 sm:p-6`}>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Sparkles size={18} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-text-main sm:text-base">
                    Make space for your next idea
                  </h3>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-text-muted sm:text-sm">
                    Capture information as it comes, give it a clear title, and
                    use folders or favorites to find it again without effort.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <WorkflowStep
                  number="01"
                  title="Capture"
                  detail="Write it down while it is fresh."
                  icon={PenLine}
                />
                <WorkflowStep
                  number="02"
                  title="Organize"
                  detail="Group related notes into folders."
                  icon={FolderTree}
                />
                <WorkflowStep
                  number="03"
                  title="Revisit"
                  detail="Pin or favorite what matters."
                  icon={RefreshCw}
                />
              </div>
            </div>
            <div
              className={`${glass} relative overflow-hidden rounded-3xl p-5 sm:p-6`}
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-pink-400/10 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 text-accent">
                  <Quote size={17} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em]">
                    A gentle reminder
                  </span>
                </div>
                <p className="mt-4 text-lg font-semibold leading-7 tracking-tight text-text-main">
                  "Small notes today can become meaningful ideas tomorrow."
                </p>
                <p className="mt-3 text-xs leading-5 text-text-muted">
                  Your workspace is here to help you think clearly, remember
                  what matters and make progress at your own pace.
                </p>
                <button
                  type="button"
                  onClick={() => createNote.mutate()}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
                  disabled={createNote.isPending}
                >
                  <FilePlus2 size={14} /> Start a note <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ================= VAULT ================= */}
        <button
          type="button"
          onClick={() => navigate('/app/vault')}
          className={`${glass} group relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-3xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 sm:p-6`}
        >
          <span className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-accent/10 blur-3xl" />
          <span className="relative flex min-w-0 items-center gap-3.5 sm:gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-accent/10 text-accent sm:h-14 sm:w-14">
              <ShieldCheck size={22} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-text-main sm:text-base">
                Your private vault
              </span>
              <span className="mt-1 block max-w-2xl text-xs leading-5 text-text-muted sm:text-sm">
                A dedicated space for important files and documents, kept
                separate from your everyday notes.
              </span>
            </span>
          </span>
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition group-hover:translate-x-1">
            <ArrowRight size={18} />
          </span>
        </button>

        <footer className="mt-9 flex flex-wrap items-center justify-center gap-2 border-t border-border/50 pt-5 text-center text-xs text-text-muted">
          <Sparkles size={13} className="text-accent" />
          <span>A little space to keep your thoughts in order.</span>
          <span className="hidden sm:inline">·</span>
          <span>Made for your everyday ideas.</span>
        </footer>
      </main>
    </PageBackground>
  );
}

// ============================================================
// ACTIVITY CHART (hover tooltip + click modal)
// ============================================================
function ActivityChart({ buckets, range, dayDetails = {} }) {
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState(null);

  const width = 800;
  const height = 260;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(
    4,
    ...buckets.map((b) => b.notes + b.journal + b.reminders),
  );

  const barW = chartW / buckets.length;
  const barInner = Math.min(barW * 0.65, 30);

  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((maxVal / yTicks) * i),
  );

  const points = buckets.map((b, i) => {
    const total = b.notes + b.journal + b.reminders;
    const x = padding.left + barW * i + barW / 2;
    const y = padding.top + chartH - (total / maxVal) * chartH;
    return { x, y, total };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? 0} ${
    padding.top + chartH
  } L ${points[0]?.x ?? 0} ${padding.top + chartH} Z`;

  const showXLabels = buckets.length <= 14;
  const labelEvery = buckets.length <= 7 ? 1 : Math.ceil(buckets.length / 7);

  const getDetail = (b) => dayDetails[b.key] || null;
  const getTotals = (b) => {
    const d = getDetail(b);
    return {
      created: d?.created ?? 0,
      edited: d?.edited ?? 0,
      journal: b.journal,
      reminders: b.reminders,
    };
  };

  const hoverBucket = hover !== null ? buckets[hover] : null;
  const hoverTotals = hoverBucket ? getTotals(hoverBucket) : null;
  const lastIndex = buckets.length - 1;

  return (
    <div className={`${glass} overflow-hidden rounded-3xl p-4 sm:p-6`}>
      <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-violet-500" /> Notes
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-sky-500" /> Journal
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> Reminders
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-gradient-to-r from-pink-500 to-rose-500" />{' '}
          Trend
        </span>
      </div>

      <div className="relative mt-3 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[500px]"
          role="img"
          aria-label={`Activity chart over ${range}`}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
            </linearGradient>
          </defs>

          {tickValues.map((v, i) => {
            const y = padding.top + chartH - (v / maxVal) * chartH;
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="currentColor"
                  className="text-border/60"
                  strokeWidth="1"
                  strokeDasharray={i === 0 ? '0' : '3 4'}
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-current text-text-muted"
                  fontSize="10"
                >
                  {v}
                </text>
              </g>
            );
          })}

          {/* Today highlight */}
          <rect
            x={padding.left + barW * lastIndex}
            y={padding.top}
            width={barW}
            height={chartH}
            className="fill-accent"
            fillOpacity="0.06"
          />

          {hover !== null && (
            <line
              x1={padding.left + barW * hover + barW / 2}
              y1={padding.top}
              x2={padding.left + barW * hover + barW / 2}
              y2={padding.top + chartH}
              stroke="currentColor"
              className="text-accent/60"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          {buckets.map((b, i) => {
            const x = padding.left + barW * i + (barW - barInner) / 2;
            const scale = (val) => (val / maxVal) * chartH;
            const nH = scale(b.notes);
            const jH = scale(b.journal);
            const rH = scale(b.reminders);
            const isActive = hover === i;

            let yCursor = padding.top + chartH;
            const segments = [
              { h: nH, cls: 'fill-violet-500' },
              { h: jH, cls: 'fill-sky-500' },
              { h: rH, cls: 'fill-amber-500' },
            ].filter((s) => s.h > 0);

            return (
              <g
                key={b.key}
                className="cursor-pointer"
                onClick={() => setSelected(b)}
              >
                {segments.map((s, idx) => {
                  yCursor -= s.h;
                  return (
                    <rect
                      key={idx}
                      x={x}
                      y={yCursor}
                      width={barInner}
                      height={s.h}
                      rx={idx === segments.length - 1 ? 3 : 0}
                      className={`${s.cls} transition-opacity`}
                      fillOpacity={hover === null || isActive ? 1 : 0.4}
                    />
                  );
                })}
                <rect
                  x={padding.left + barW * i}
                  y={padding.top}
                  width={barW}
                  height={chartH}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${new Date(b.date).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                  })}. Click for details.`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelected(b);
                    }
                  }}
                />
              </g>
            );
          })}

          {points.length > 1 && (
            <>
              <path d={areaPath} fill="url(#trendArea)" />
              <path
                d={linePath}
                fill="none"
                stroke="#ec4899"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map((p, i) =>
                p.total > 0 ? (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={hover === i ? 4 : 2.5}
                    className="fill-rose-500 stroke-white transition-all"
                    strokeWidth="1.5"
                  />
                ) : null,
              )}
            </>
          )}

          {showXLabels &&
            buckets.map((b, i) => {
              if (i % labelEvery !== 0 && i !== buckets.length - 1) return null;
              const x = padding.left + barW * i + barW / 2;
              const isToday = i === lastIndex;
              const label = isToday
                ? 'Today'
                : range === '7d'
                  ? new Date(b.date).toLocaleDateString('en-IN', {
                      weekday: 'short',
                    })
                  : new Date(b.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    });
              return (
                <text
                  key={b.key}
                  x={x}
                  y={height - padding.bottom + 16}
                  textAnchor="middle"
                  className={`fill-current transition-colors ${
                    hover === i || isToday ? 'text-accent font-semibold' : 'text-text-muted'
                  }`}
                  fontSize="10"
                >
                  {label}
                </text>
              );
            })}
        </svg>

        {hoverBucket && hoverTotals && (
          <div
            className="pointer-events-none absolute top-2 z-20 -translate-x-1/2"
            style={{
              left: `calc(${Math.min(
                88,
                Math.max(12, ((padding.left + barW * hover + barW / 2) / width) * 100),
              )}% )`,
            }}
          >
            <div className="w-48 rounded-xl border border-border/60 bg-card/95 p-3 shadow-2xl backdrop-blur-xl">
              <p className="text-[11px] font-bold text-text-main">
                {new Date(hoverBucket.date).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
              <div className="mt-2 space-y-1 text-[10px]">
                <HoverRow color="bg-violet-500" label="Created" value={hoverTotals.created} />
                <HoverRow color="bg-emerald-500" label="Edited" value={hoverTotals.edited} />
                <HoverRow color="bg-sky-500" label="Journal" value={hoverTotals.journal} />
                <HoverRow color="bg-amber-500" label="Reminders" value={hoverTotals.reminders} />
              </div>
              <div className="mt-2 border-t border-border/50 pt-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-text-main">Total</span>
                  <span className="font-bold tabular-nums text-accent">
                    {hoverTotals.created +
                      hoverTotals.edited +
                      hoverTotals.journal +
                      hoverTotals.reminders}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-[9px] italic text-text-muted">
                Click for full details →
              </p>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <DayDetailModal
          bucket={selected}
          detail={getDetail(selected)}
          totals={getTotals(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function HoverRow({ color, label, value }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-text-muted">
        <span className={`h-1.5 w-1.5 rounded-sm ${color}`} />
        {label}
      </span>
      <span className="font-semibold tabular-nums text-text-main">{value}</span>
    </div>
  );
}

// ============================================================
// DAY DETAIL MODAL
// ============================================================
function DayDetailModal({ bucket, detail, totals, onClose }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const dateObj = new Date(bucket.date);
  const weekday = dateObj.toLocaleDateString('en-IN', { weekday: 'long' });
  const fullDate = dateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const totalAll = totals.created + totals.edited + totals.journal + totals.reminders;
  const items = detail?.items || [];

  const iconStyle = {
    edit: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    journal: 'bg-sky-500/10 text-sky-600 dark:text-sky-300',
    reminder: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
    create: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
  };
  const iconChar = { edit: '✎', journal: 'J', reminder: '•', create: '+' };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/30 p-3 backdrop-blur-md sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <section
        className="relative flex max-h-[min(88vh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-card shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-detail-title"
      >
        <header className="relative shrink-0 overflow-hidden border-b border-border/60 bg-gradient-to-r from-accent/10 via-card to-pink-500/10 px-5 py-5 sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
                Daily activity · {weekday}
              </p>
              <h2 id="day-detail-title" className="mt-1 text-xl font-bold tracking-tight text-text-main sm:text-2xl">
                {fullDate}
              </h2>
              <p className="mt-1.5 text-xs text-text-muted sm:text-sm">
                {totalAll === 0
                  ? 'No activity recorded for this day'
                  : `${totalAll} ${totalAll === 1 ? 'activity' : 'activities'} recorded`}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close activity details"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-card/80 text-text-muted transition hover:border-accent/40 hover:bg-accent/10 hover:text-text-main"
            >
              <X size={17} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <DetailStat label="Created" value={totals.created} />
            <DetailStat label="Edited" value={totals.edited} />
            <DetailStat label="Journal" value={totals.journal} />
            <DetailStat label="Reminders" value={totals.reminders} />
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-text-main">
                  Activity timeline
                </h3>
                <p className="mt-1 text-[11px] text-text-muted">
                  Every recorded item for this date
                </p>
              </div>
              <span className="rounded-full border border-border/60 bg-card/70 px-2.5 py-1 text-[10px] font-semibold tabular-nums text-text-muted">
                {items.length} items
              </span>
            </div>

            {items.length > 0 ? (
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <li
                    key={`${item.id || index}-${item.action}-${index}`}
                    className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/55 px-3 py-3 transition hover:border-accent/30 hover:bg-accent/[0.04] sm:px-4"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${iconStyle[item.action] || iconStyle.create}`}>
                      {iconChar[item.action] || '+'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-text-main">
                        {item.title || 'Untitled'}
                      </span>
                      <span className="mt-0.5 block text-[10px] capitalize text-text-muted">
                        {item.action === 'create' ? 'Note created' : item.action === 'edit' ? 'Note updated' : item.action === 'journal' ? 'Journal entry' : 'Reminder'}
                      </span>
                    </span>
                    <time className="shrink-0 rounded-lg bg-accent/5 px-2.5 py-1.5 text-[10px] font-semibold tabular-nums text-text-muted">
                      {item.time || '—'}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 px-4 py-10 text-center">
                <Activity className="mx-auto mb-2 text-text-muted" size={22} />
                <p className="text-sm font-semibold text-text-main">No activity for this day</p>
                <p className="mt-1 text-xs text-text-muted">Recorded notes, journal entries and reminders will appear here.</p>
              </div>
            )}
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border/60 bg-card/95 px-5 py-4 sm:px-7">
          <p className="text-[10px] text-text-muted">Press Esc to close</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2"
          >
            Done
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

function DetailStat({ label, value }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 p-3">
      <p className="truncate text-[10px] font-medium text-text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-text-main">{value}</p>
    </div>
  );
}

// ============================================================
// HEATMAP
// ============================================================
function ActivityHeatmap({ buckets }) {
  const maxVal = Math.max(
    1,
    ...buckets.map((b) => b.notes + b.journal + b.reminders),
  );

  const firstDate = buckets[0]?.date ? new Date(buckets[0].date) : new Date();
  const startPad = firstDate.getDay();

  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  buckets.forEach((b) => cells.push(b));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const getIntensity = (val) => {
    if (val === 0) return 'bg-border/40';
    const ratio = val / maxVal;
    if (ratio < 0.25) return 'bg-violet-500/25';
    if (ratio < 0.5) return 'bg-violet-500/45';
    if (ratio < 0.75) return 'bg-violet-500/70';
    return 'bg-violet-500';
  };

  const totalActive = buckets.reduce(
    (s, b) => s + b.notes + b.journal + b.reminders,
    0,
  );

  const todayKeyStr = buckets[buckets.length - 1]?.key;

  return (
    <div className={`${glass} rounded-3xl p-4 sm:p-6`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Grid2X2 size={16} className="text-accent" />
            <h3 className="text-sm font-bold text-text-main">Activity heatmap</h3>
          </div>
          <p className="mt-1 text-xs text-text-muted">
            {totalActive} activities in the last {buckets.length} days.
          </p>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-text-muted">
          <span>Less</span>
          {[
            'bg-border/40',
            'bg-violet-500/25',
            'bg-violet-500/45',
            'bg-violet-500/70',
            'bg-violet-500',
          ].map((c) => (
            <span key={c} className={`h-2.5 w-2.5 rounded-sm ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="mt-4 flex gap-1.5 overflow-x-auto pb-2">
        <div className="flex flex-col justify-between gap-1 pr-1 pt-1 text-[9px] text-text-muted">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
          <span>Sun</span>
        </div>
        <div className="flex gap-1.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1.5">
              {week.map((b, di) => {
                if (!b) {
                  return (
                    <span
                      key={di}
                      className="h-3 w-3 rounded-sm sm:h-3.5 sm:w-3.5"
                    />
                  );
                }
                const val = b.notes + b.journal + b.reminders;
                const isToday = b.key === todayKeyStr;
                return (
                  <span
                    key={di}
                    title={`${new Date(b.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}${isToday ? ' (today)' : ''}: ${val} activities`}
                    className={`h-3 w-3 rounded-sm transition hover:ring-1 hover:ring-accent/50 sm:h-3.5 sm:w-3.5 ${
                      isToday ? 'ring-1 ring-accent' : ''
                    } ${getIntensity(val)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DONUT
// ============================================================
function ContentDistribution({ data, total }) {
  const size = 140;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const safeTotal = total || 1;

  return (
    <div className={`${glass} flex h-full flex-col rounded-3xl p-4 sm:p-6`}>
      <div className="flex items-center gap-2">
        <PieChart size={16} className="text-accent" />
        <h3 className="text-sm font-bold text-text-main">Content distribution</h3>
      </div>
      <p className="mt-1 text-xs text-text-muted">How your workspace is composed.</p>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-border/30"
            strokeWidth={stroke}
          />
          {data.map((d, i) => {
            const fraction = d.value / safeTotal;
            const len = fraction * circumference;
            const dash = `${len} ${circumference - len}`;
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={stroke}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              >
                <title>{`${d.label}: ${d.value}`}</title>
              </circle>
            );
            offset += len;
            return el;
          })}
          <text
            x={size / 2}
            y={size / 2 - 2}
            textAnchor="middle"
            className="fill-current text-text-main"
            fontSize="20"
            fontWeight="700"
          >
            {total}
          </text>
          <text
            x={size / 2}
            y={size / 2 + 14}
            textAnchor="middle"
            className="fill-current text-text-muted"
            fontSize="9"
          >
            items
          </text>
        </svg>

        <ul className="w-full space-y-2">
          {data.map((d) => (
            <li key={d.label} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: d.color }}
                />
                <span className="truncate text-text-main">{d.label}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-text-muted">
                {d.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ============================================================
// MINI STAT
// ============================================================
function MiniStat({ icon: Icon, label, value, tone = 'violet' }) {
  const tones = {
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
    blue: 'bg-sky-500/10 text-sky-600 dark:text-sky-300',
  };
  return (
    <div className={`${glass} flex items-center gap-3 rounded-2xl p-3 sm:p-4`}>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
      >
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-text-muted">
          {label}
        </p>
        <p className="mt-0.5 text-base font-bold tracking-tight text-text-main sm:text-lg">
          {value}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// SPARKLINE
// ============================================================
function Sparkline({ values }) {
  if (!values || values.length < 2) return null;
  const w = 60;
  const h = 22;
  const max = Math.max(...values, 1);
  const step = w / (values.length - 1);
  const pts = values.map(
    (v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`,
  );
  const d = `M ${pts.join(' L ')}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="text-violet-500" aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================
// SMALL CARDS
// ============================================================
function PulseCard({ icon: Icon, title, value, detail, tone = 'violet', actionLabel, onClick }) {
  const tones = {
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
  };
  return (
    <div className={`${glass} group rounded-3xl p-4 transition duration-200 hover:-translate-y-0.5 hover:border-accent/30 sm:p-5`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tones[tone]}`}>
          <Icon size={18} />
        </span>
        <span className="rounded-full border border-border/60 bg-card/50 px-2.5 py-1 text-[10px] font-semibold text-text-muted">
          Overview
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-text-muted">{title}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-text-main">{value}</p>
          <p className="mt-1 text-[11px] leading-5 text-text-muted">{detail}</p>
        </div>
        <button
          type="button"
          onClick={onClick}
          className="mb-1 inline-flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-2 text-[11px] font-semibold text-accent transition hover:bg-accent/10"
        >
          {actionLabel}
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

function DestinationCard({ icon: Icon, title, detail, count, tone = 'violet', onClick }) {
  const tones = {
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
    blue: 'bg-sky-500/10 text-sky-600 dark:text-sky-300',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${glass} group flex min-h-[150px] flex-col rounded-3xl p-4 text-left transition duration-200 hover:-translate-y-1 hover:border-accent/40 sm:p-5`}
    >
      <div className="flex w-full items-center justify-between gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tones[tone]}`}>
          <Icon size={18} />
        </span>
        <span className="rounded-full border border-border/60 bg-card/50 px-2.5 py-1 text-[10px] font-bold tabular-nums text-text-muted">
          {count}
        </span>
      </div>
      <span className="mt-4 block text-sm font-bold text-text-main">{title}</span>
      <span className="mt-1 block text-xs leading-5 text-text-muted">{detail}</span>
      <span className="mt-auto flex items-center gap-1 pt-3 text-[11px] font-semibold text-accent">
        Open space{' '}
        <ArrowUpRight
          size={13}
          className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </span>
    </button>
  );
}

function FolderPreviewCard({ folder, index, onClick }) {
  const palette = [
    'bg-violet-500/10 text-violet-600 dark:text-violet-300',
    'bg-sky-500/10 text-sky-600 dark:text-sky-300',
    'bg-rose-500/10 text-rose-600 dark:text-rose-300',
  ];
  const title = folder.name || folder.title || folder.folder_name || 'Untitled folder';
  const description = folder.description || 'A dedicated place for related notes.';
  const noteCount = Number(
    folder.note_count ?? folder.notes_count ?? folder.notes?.length ?? 0,
  );
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${glass} group flex min-w-0 items-center gap-3 rounded-2xl p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-accent/40`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
          palette[index % palette.length]
        }`}
      >
        <FolderOpen size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-text-main">{title}</span>
        <span className="mt-1 block truncate text-xs text-text-muted">{description}</span>
        <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold text-text-muted">
          <NotebookPen size={11} /> {noteCount} {noteCount === 1 ? 'note' : 'notes'}
        </span>
      </span>
      <ArrowUpRight
        size={15}
        className="shrink-0 text-text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
      />
    </button>
  );
}

function WorkflowStep({ number, title, detail, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/45 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold tracking-[0.15em] text-accent">{number}</span>
        <Icon size={15} className="text-text-muted" />
      </div>
      <p className="mt-3 text-xs font-bold text-text-main">{title}</p>
      <p className="mt-1 text-[11px] leading-5 text-text-muted">{detail}</p>
    </div>
  );
}

function GettingStartedCard({ onCreate, onBrowse, loading }) {
  return (
    <div className={`${glass} relative overflow-hidden rounded-[28px] p-5 sm:p-7`}>
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-400/10 blur-3xl" />
      <div className="relative grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_auto]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[10px] font-bold tracking-wide text-accent">
            <Sparkles size={12} /> GETTING STARTED
          </span>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-text-main sm:text-2xl">
            Your ideas deserve a home.
          </h2>
          <p className="mt-2 max-w-xl text-xs leading-6 text-text-muted sm:text-sm">
            Start with a note, build a collection, and shape your workspace
            around the way you think. Everything begins with one small step.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCreate}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
            >
              <Plus size={14} /> Create first note
            </button>
            <button
              type="button"
              onClick={onBrowse}
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/60 px-4 py-2.5 text-xs font-semibold text-text-main transition hover:bg-card"
            >
              <Grid2X2 size={14} /> Explore workspace
            </button>
          </div>
        </div>
        <div className="hidden h-36 w-36 items-center justify-center rounded-[32px] border border-accent/15 bg-accent/5 text-accent lg:flex">
          <div className="flex h-24 w-24 items-center justify-center rounded-[26px] border border-accent/20 bg-card/60 shadow-sm">
            <NotebookPen size={42} strokeWidth={1.25} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PageBackground({ children }) {
  return (
    <div
      className="relative isolate min-h-full overflow-hidden bg-transparent"
      style={{
        backgroundImage: `url(${lavenderBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 bg-white/30 dark:bg-slate-950/80" />
      {children}
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={17} className="shrink-0 text-accent" />}
        <h2 className="text-lg font-bold tracking-tight text-text-main sm:text-xl">{title}</h2>
      </div>
      <p className="mt-1 text-xs text-text-muted sm:text-sm">{description}</p>
    </div>
  );
}

function WelcomeMetric({ icon: Icon, label, value, trend }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-card/60 text-accent">
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-1.5">
          <span className="block text-lg font-bold leading-tight text-text-main">{value}</span>
          {typeof trend === 'number' && (
            <span
              className={`text-[10px] font-semibold ${
                trend >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-text-muted sm:text-xs">
          {label}
        </span>
      </span>
    </div>
  );
}

function StatCard({ label, value, description, icon: Icon, tone = 'lavender', onClick, spark }) {
  const tones = {
    lavender: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${glass} group min-w-0 rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 sm:rounded-3xl sm:p-5`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold text-text-muted sm:text-sm">{label}</span>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={17} strokeWidth={1.8} />
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <p className="text-2xl font-bold tracking-tight text-text-main sm:text-3xl">{value}</p>
        {spark && spark.length > 1 && (
          <span className="text-violet-500">
            <Sparkline values={spark} />
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className="truncate text-[11px] text-text-muted sm:text-xs">{description}</p>
        <ArrowUpRight
          size={13}
          className="shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
        />
      </div>
    </button>
  );
}

function QuickAction({ icon: Icon, title, detail, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${glass} group flex min-w-0 items-center gap-3 rounded-2xl p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 sm:p-4`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition group-hover:bg-accent/15">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold text-text-main sm:text-sm">{title}</span>
        <span className="mt-0.5 block truncate text-[10px] text-text-muted sm:text-xs">{detail}</span>
      </span>
      <ArrowUpRight
        size={14}
        className="shrink-0 text-text-muted opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
      />
    </button>
  );
}

function TextAction({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-accent transition hover:bg-accent/10"
    >
      {label}
      <ArrowRight size={13} />
    </button>
  );
}

function DashboardPanel({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  isEmpty,
  emptyTitle,
  emptyDescription,
  className = '',
  children,
}) {
  return (
    <section className={`${glass} ${className} min-w-0 overflow-hidden rounded-3xl`}>
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon size={16} className="shrink-0 text-accent" />
            <h2 className="truncate text-sm font-bold text-text-main">{title}</h2>
          </div>
          <p className="mt-1 text-xs text-text-muted">{description}</p>
        </div>
        <button
          type="button"
          onClick={onAction}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold text-accent transition hover:bg-accent/10 sm:text-xs"
        >
          {actionLabel}
          <ArrowRight size={13} />
        </button>
      </div>
      {isEmpty ? (
        <div className="px-5 py-8 text-center">
          <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Icon size={17} />
          </span>
          <p className="text-sm font-semibold text-text-main">{emptyTitle}</p>
          <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-text-muted">
            {emptyDescription}
          </p>
        </div>
      ) : (
        <ul>{children}</ul>
      )}
    </section>
  );
}

function formatDateTime(value) {
  const date = parseDate(value);
  if (!value) return 'Date not set';
  if (!date) return 'Date not available';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}