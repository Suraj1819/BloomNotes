// src/pages/dashboard/Search.jsx

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { searchApi } from '../../services/index.js';

import {
  Card,
  CardBody,
  CardTitle,
  CardHeader,
} from '../../components/ui/Card.jsx';

import { Button } from '../../components/ui/Button.jsx';

import {
  Search as SearchIcon,
  NotebookPen,
  FolderTree,
  Tag,
  BookOpen,
  Sparkles,
  Lock,
  ArrowUpRight,
  X,
  Loader2,
  FileSearch,
  Command,
  ArrowRight,
  RefreshCw,
  SearchX,
} from 'lucide-react';

import { cn } from '../../lib/utils.js';

import lavenderBg from '../../../assets/background/favv.png';

const SEARCH_SECTIONS = [
  {
    key: 'notes',
    title: 'Notes',
    description: 'Your saved notes',
    icon: NotebookPen,
    getItems: (data, navigate) =>
      (data?.notes || []).map((n) => ({
        id: n.id,
        title: n.title || 'Untitled note',
        sub: n.excerpt,
        onClick: () => navigate(`/app/notes/${n.id}`),
      })),
  },
  {
    key: 'folders',
    title: 'Folders',
    description: 'Organized collections',
    icon: FolderTree,
    getItems: (data, navigate) =>
      (data?.folders || []).map((f) => ({
        id: f.id,
        title: f.name,
        onClick: () => navigate(`/app/folders/${f.id}`),
      })),
  },
  {
    key: 'tags',
    title: 'Tags',
    description: 'Find notes by tags',
    icon: Tag,
    getItems: (data, navigate) =>
      (data?.tags || []).map((t) => ({
        id: t.id,
        title: t.name,
        onClick: () => navigate(`/app/notes?tag=${t.id}`),
      })),
  },
  {
    key: 'journal',
    title: 'Journal',
    description: 'Your journal entries',
    icon: BookOpen,
    getItems: (data, navigate) =>
      (data?.journal || []).map((j) => ({
        id: j.id,
        title: j.title || 'Untitled entry',
        sub: j.entry_date,
        onClick: () => navigate(`/app/journal?edit=${j.id}`),
      })),
  },
  {
    key: 'personalSpace',
    title: 'Personal Space',
    description: 'Personal collections',
    icon: Sparkles,
    getItems: (data, navigate) =>
      (data?.personalSpace || []).map((p) => ({
        id: p.id,
        title: p.title || p.kind,
        sub: p.kind,
        onClick: () => navigate('/app/personal-space'),
      })),
  },
  {
    key: 'vault',
    title: 'Vault',
    description: 'Your private files',
    icon: Lock,
    getItems: (data, navigate) =>
      (data?.vault || []).map((v) => ({
        id: v.id,
        title: v.file_name,
        sub: v.mime_type,
        onClick: () => navigate('/app/vault'),
      })),
  },
];

// Real-time search debounce (ms)
const DEBOUNCE_MS = 300;

export default function Search() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const q = params.get('q') || '';
  const [input, setInput] = useState(q);

  // Sync local input when the URL query changes (back/forward navigation)
  useEffect(() => {
    setInput(q);
  }, [q]);

  // ✅ Real-time search: debounce input → URL update → query fires
  useEffect(() => {
    const trimmed = input.trim();

    // Skip if input already matches URL (avoids update loops)
    if (trimmed === q.trim()) return;

    const t = setTimeout(() => {
      if (trimmed) {
        setParams({ q: trimmed }, { replace: true });
      } else {
        setParams({}, { replace: true });
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(t);
  }, [input, q, setParams]);

  const {
    data,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['search', q],
    queryFn: () => searchApi.global(q),
    enabled: q.trim().length > 0,
  });

  const returnToDashboard = () => {
    setInput('');
    setParams({});
    navigate('/dashboard', { replace: true });
  };

  // ✅ Enter dabane par turant search (debounce skip)
  const submit = (event) => {
    event.preventDefault();
    const value = input.trim();
    if (value) {
      setParams({ q: value });
    } else {
      returnToDashboard();
    }
  };

  const clearInput = () => {
    setInput('');
    setParams({});
  };

  const sections = useMemo(
    () =>
      SEARCH_SECTIONS.map((section) => ({
        ...section,
        items: section.getItems(data, navigate),
      })),
    [data, navigate]
  );

  const totalResults = sections.reduce(
    (total, section) => total + section.items.length,
    0
  );

  const hasQuery = Boolean(q.trim());

  return (
    <div
      className="relative isolate min-h-full overflow-hidden bg-transparent"
      style={{
        backgroundImage: `url(${lavenderBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 bg-white/30 dark:bg-slate-950/80" />

      <main className="relative mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 lg:px-9 lg:py-9">
        {/* Page header */}
        <header className="mb-7 sm:mb-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card/70 text-accent shadow-sm backdrop-blur-xl sm:h-14 sm:w-14">
                <SearchIcon size={25} strokeWidth={1.8} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-text-main sm:text-3xl">
                    Search
                  </h1>
                  <span className="rounded-full border border-border/60 bg-card/60 px-2.5 py-1 text-[11px] font-semibold text-text-muted backdrop-blur-xl">
                    Workspace
                  </span>
                </div>
                <p className="mt-1 text-sm text-text-muted">
                  Find notes, folders, tags, journal entries and files in one place.
                </p>
              </div>
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto">
              {hasQuery && (
                <Button
                  variant="outline"
                  onClick={returnToDashboard}
                  className="w-full justify-center sm:w-auto"
                >
                  <ArrowRight size={15} />
                  Dashboard
                </Button>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <SearchIcon size={14} className="text-accent/70" />
            <div className="h-px flex-1 bg-border/60" />
          </div>
        </header>

        {/* Search panel */}
        <section className="bn-glass-card mb-7 rounded-3xl p-3.5 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <div>
              <h2 className="text-sm font-semibold text-text-main">
                Search your workspace
              </h2>
              <p className="mt-0.5 text-xs text-text-muted">
                Start typing — results appear as you type.
              </p>
            </div>
          </div>

          <form onSubmit={submit}>
            <div className="relative">
              <SearchIcon
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
              />

              {/*
                ✅ type="text" instead of "search" — native browser clear (X)
                button render nahi hoga, isliye double cross nahi aayega.
              */}
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Search notes, folders, journal, tags and vault..."
                aria-label="Search workspace"
                autoFocus
                spellCheck={false}
                autoComplete="off"
                className="h-12 w-full rounded-2xl border border-border/70 bg-input/60 pl-11 pr-24 text-sm text-text-main outline-none backdrop-blur-xl transition-all placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/15 sm:h-14"
              />

              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {input && (
                  <button
                    type="button"
                    onClick={clearInput}
                    aria-label="Clear search"
                    title="Clear search"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition hover:bg-accent/10 hover:text-accent"
                  >
                    <X size={15} />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-accent px-3 text-xs font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <SearchIcon size={13} />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </div>
          </form>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 px-1 pt-3">
            <p className="text-xs text-text-muted">
              Results update automatically as you type.
            </p>
            {hasQuery && (
              <button
                type="button"
                onClick={clearInput}
                className="text-xs font-semibold text-accent transition hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        </section>

        {/* Initial state */}
        {!hasQuery && (
          <section className="bn-glass-card rounded-3xl px-5 py-14 text-center sm:py-16">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-card/70 text-accent shadow-sm">
              <FileSearch size={27} strokeWidth={1.7} />
            </div>

            <h2 className="text-lg font-semibold tracking-tight text-text-main">
              Find anything in your workspace
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-muted">
              Search across notes, folders, tags, journal entries, personal space and private vault files.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                { label: 'Notes', icon: NotebookPen },
                { label: 'Folders', icon: FolderTree },
                { label: 'Tags', icon: Tag },
                { label: 'Journal', icon: BookOpen },
                { label: 'Vault', icon: Lock },
              ].map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/55 px-3 py-1.5 text-[11px] font-medium text-text-muted backdrop-blur-xl"
                >
                  <Icon size={12} className="text-accent" />
                  {label}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Loading state */}
        {hasQuery && isFetching && (
          <section className="bn-glass-card rounded-3xl px-5 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Loader2 size={22} className="animate-spin" />
            </div>
            <p className="text-sm font-semibold text-text-main">
              Searching your workspace
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Looking for matching notes, folders and files...
            </p>
          </section>
        )}

        {/* Error state */}
        {hasQuery && !isFetching && isError && (
          <section className="bn-glass-card rounded-3xl border border-danger/20 px-5 py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-danger">
              <SearchX size={22} />
            </div>
            <h2 className="text-base font-semibold text-text-main">
              Search could not be completed
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-muted">
              Something went wrong while searching. Please try again.
            </p>
            <Button
              variant="outline"
              className="mt-5"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw size={14} />
              Try again
            </Button>
          </section>
        )}

        {/* Search results */}
        {hasQuery && !isFetching && !isError && data && (
          <div className="space-y-5">
            <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/55 px-4 py-3 backdrop-blur-xl">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-text-main">
                    Search results
                  </h2>
                  <span className="h-1 w-1 rounded-full bg-accent/70" />
                  <span className="text-[11px] text-text-muted">
                    {totalResults} {totalResults === 1 ? 'match' : 'matches'}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-text-muted">
                  Results for <span className="font-semibold text-text-main">“{q}”</span>
                </p>
              </div>

              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border/60 bg-card/70 px-3 py-2 text-xs font-semibold text-accent">
                <SearchIcon size={13} />
                {totalResults} found
              </span>
            </section>

            {totalResults > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {sections.map((section) => (
                  <Section
                    key={section.key}
                    icon={section.icon}
                    title={section.title}
                    description={section.description}
                    items={section.items}
                  />
                ))}
              </div>
            ) : (
              <section className="bn-glass-card rounded-3xl px-5 py-14 text-center sm:py-16">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-card/70 text-accent shadow-sm">
                  <SearchX size={27} strokeWidth={1.7} />
                </div>
                <h3 className="text-lg font-semibold text-text-main">
                  No matching results
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-muted">
                  We couldn't find anything for “{q}”. Try a different keyword or search phrase.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={clearInput}
                >
                  <X size={14} />
                  Clear search
                </Button>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* Search result section */
function Section({ icon: Icon, title, description, items }) {
  if (!items?.length) return null;

  return (
    <Card className="bn-glass-card group overflow-hidden rounded-3xl border border-border/60 bg-card/65 shadow-sm backdrop-blur-xl transition-all duration-200 hover:shadow-md">
      <CardHeader className="border-b border-border/50 px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card/70 text-accent">
              <Icon size={18} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold text-text-main">
                {title}
              </CardTitle>
              <p className="mt-0.5 text-[11px] text-text-muted">
                {description}
              </p>
            </div>
          </div>

          <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 px-2 text-xs font-semibold text-accent">
            {items.length}
          </span>
        </div>
      </CardHeader>

      <CardBody className="p-0">
        <ul>
          {items.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={item.onClick}
                className={cn(
                  'group/item flex w-full min-w-0 items-center gap-3 px-4 py-3.5 text-left sm:px-5',
                  'transition-colors duration-200 hover:bg-accent/[0.045]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/50',
                  index !== items.length - 1 && 'border-b border-border/45'
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-card/70 text-accent transition-colors group-hover/item:bg-accent/10">
                  <FileSearch size={15} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-main transition-colors group-hover/item:text-accent">
                    {item.title}
                  </p>
                  {item.sub && (
                    <p className="mt-0.5 truncate text-xs text-text-muted">
                      {item.sub}
                    </p>
                  )}
                </div>

                <ArrowUpRight
                  size={16}
                  className="shrink-0 text-text-muted/70 transition-all group-hover/item:-translate-y-0.5 group-hover/item:translate-x-0.5 group-hover/item:text-accent"
                />
              </button>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}