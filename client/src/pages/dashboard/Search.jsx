// src/pages/dashboard/Search.jsx

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { searchApi } from '../../services/index.js';

import {
  Card,
  CardBody,
  CardTitle,
  CardHeader,
} from '../../components/ui/Card.jsx';

import { Input } from '../../components/ui/Input.jsx';

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
} from 'lucide-react';

import { cn } from '../../lib/utils.js';

import lavenderBg from '../../../assets/background/favv1.png';

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

export default function Search() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const q = params.get('q') || '';
  const [input, setInput] = useState(q);

  useEffect(() => {
    setInput(q);
  }, [q]);

  const {
    data,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['search', q],
    queryFn: () => searchApi.global(q),
    enabled: q.trim().length > 0,
  });

  const submit = (e) => {
    e.preventDefault();

    const value = input.trim();

    if (value) {
      setParams({ q: value });
    } else {
      setParams({});
    }
  };

  const clearSearch = () => {
    setInput('');
    setParams({});
  };

  const sections = SEARCH_SECTIONS.map((section) => ({
    ...section,
    items: section.getItems(data, navigate),
  }));

  const totalResults = sections.reduce(
    (total, section) => total + section.items.length,
    0
  );

  return (
    <div className="relative isolate min-h-full overflow-hidden bg-[#FFF8FC] dark:bg-[#17131F]">

      {/* Floral Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <img
          src={lavenderBg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        <div className="absolute inset-0 bg-white/55 dark:bg-[#17131F]/80" />

        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/40 dark:from-transparent dark:to-[#17131F]/40" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">

        {/* Page Header */}
        <section className="mb-8">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-white/75 text-[#B65F8D] shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-[#E9A7C3]">
              <SearchIcon size={22} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#B66B91] dark:text-[#E5A5C0]">
                  Workspace
                </span>

                <span className="h-1 w-1 rounded-full bg-[#C98BA7]" />

                <span className="text-[10px] font-medium text-[#987C8C] dark:text-[#BCA8B5]">
                  Quick discovery
                </span>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-[#382832] sm:text-3xl dark:text-white">
                Search
              </h1>

              <p className="mt-1 text-xs text-[#806D79] sm:text-sm dark:text-[#C5B4BE]">
                Find everything across your BloomNotes workspace.
              </p>
            </div>

          </div>

        </section>

        {/* Search Panel */}
        <section className="mb-8">

          <div className="rounded-[22px] border border-white/75 bg-white/65 p-3 shadow-[0_8px_30px_rgba(100,55,80,0.07)] backdrop-blur-2xl sm:p-5 dark:border-white/10 dark:bg-[#241B29]/70">

            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <div>
                <h2 className="text-sm font-semibold text-[#44313D] dark:text-white">
                  What are you looking for?
                </h2>

                <p className="mt-0.5 text-xs text-[#907C88] dark:text-[#BCAAB5]">
                  Search across all your saved content.
                </p>
              </div>

              <div className="hidden items-center gap-1.5 rounded-lg border border-[#EBDCE4] bg-white/65 px-2 py-1.5 text-[10px] font-medium text-[#927E89] sm:flex dark:border-white/10 dark:bg-white/5 dark:text-[#C4B3BE]">
                <Command size={12} />
                Search
              </div>
            </div>

            <form onSubmit={submit}>
              <div className="group relative">

                <SearchIcon
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#B17A94] transition-colors group-focus-within:text-[#B65F8D] dark:text-[#C38CA6]"
                />

                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Search notes, folders, journal, vault..."
                  className="h-12 w-full rounded-xl border border-[#EADAE3] bg-white/90 pl-11 pr-12 text-sm text-[#44313D] shadow-sm outline-none transition-all placeholder:text-[#AD9AA4] focus:border-[#CE8EAD] focus:ring-2 focus:ring-[#CE8EAD]/15 sm:h-14 dark:border-white/10 dark:bg-[#302632]/90 dark:text-white dark:placeholder:text-[#A995A4]"
                  autoFocus
                />

                {input && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#A17D90] transition-colors hover:bg-[#F9EAF1] hover:text-[#B65F8D] dark:text-[#C2A4B4] dark:hover:bg-white/10"
                  >
                    <X size={16} />
                  </button>
                )}

              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">

                <p className="text-[11px] text-[#957F8B] dark:text-[#BBA9B4]">
                  Search notes, tags, folders and more.
                </p>

                <span className="text-[10px] font-medium text-[#A38D99] dark:text-[#BBA9B4]">
                  Press Enter to search
                </span>

              </div>
            </form>

          </div>

        </section>

        {/* Initial State */}
        {!q && (
          <div className="overflow-hidden rounded-[22px] border border-white/75 bg-white/55 px-5 py-14 text-center shadow-[0_8px_30px_rgba(100,55,80,0.05)] backdrop-blur-xl sm:py-16 dark:border-white/10 dark:bg-[#241B29]/65">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/80 bg-white/80 text-[#B65F8D] shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-[#E9A7C3]">
              <FileSearch size={29} strokeWidth={1.5} />
            </div>

            <h2 className="text-lg font-semibold tracking-tight text-[#44313D] dark:text-white">
              Search your workspace
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#907C88] dark:text-[#C0AFB9]">
              Enter a keyword to discover your notes, folders, tags,
              journal entries, personal space and vault files.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['Notes', 'Folders', 'Journal', 'Vault'].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-[11px] font-medium text-[#99798B] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-[#C6A9B8]"
                >
                  {item}
                </span>
              ))}
            </div>

          </div>
        )}

        {/* Loading State */}
        {q && isFetching && (
          <div className="rounded-[22px] border border-white/75 bg-white/60 px-5 py-14 text-center shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#241B29]/65">

            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F9EAF1] text-[#B65F8D] dark:bg-white/10 dark:text-[#E9A7C3]">
              <Loader2 size={22} className="animate-spin" />
            </div>

            <p className="text-sm font-semibold text-[#44313D] dark:text-white">
              Searching your workspace
            </p>

            <p className="mt-1 text-xs text-[#957F8B] dark:text-[#BBA9B4]">
              Finding matching content...
            </p>

          </div>
        )}

        {/* Error State */}
        {q && !isFetching && isError && (
          <div className="rounded-[22px] border border-red-200/80 bg-red-50/80 px-5 py-12 text-center backdrop-blur-xl dark:border-red-900/40 dark:bg-red-950/30">

            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-300">
              <X size={21} />
            </div>

            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              Something went wrong
            </p>

            <p className="mt-1 text-xs text-red-500 dark:text-red-300">
              We couldn't complete your search. Please try again.
            </p>

          </div>
        )}

        {/* Search Results */}
        {q && !isFetching && !isError && data && (
          <div className="space-y-5">

            {/* Result Summary */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/75 bg-white/55 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#241B29]/65">

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-[#44313D] dark:text-white">
                    Search results
                  </h2>

                  <span className="h-1 w-1 rounded-full bg-[#C98BA7]" />

                  <span className="text-[11px] text-[#927D89] dark:text-[#BBA9B4]">
                    {totalResults} matches
                  </span>
                </div>

                <p className="mt-1 truncate text-xs text-[#927D89] dark:text-[#BBA9B4]">
                  Results for "{q}"
                </p>
              </div>

              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#EBD6E1] bg-[#FFF5F9] px-3 py-2 text-xs font-semibold text-[#B65F8D] dark:border-white/10 dark:bg-white/5 dark:text-[#E9A7C3]">
                <SearchIcon size={13} />
                {totalResults} found
              </span>

            </div>

            {/* Result Sections */}
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
              <div className="rounded-[22px] border border-white/75 bg-white/55 px-5 py-14 text-center shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#241B29]/65">

                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/80 bg-white/80 text-[#B65F8D] shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-[#E9A7C3]">
                  <SearchIcon size={24} />
                </div>

                <h3 className="text-base font-semibold text-[#44313D] dark:text-white">
                  No results found
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm text-[#927D89] dark:text-[#BBA9B4]">
                  No matches found for "{q}". Try another keyword.
                </p>

                <button
                  type="button"
                  onClick={clearSearch}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#BD6D96] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#A95782]"
                >
                  Clear search
                  <ArrowRight size={14} />
                </button>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

/* Search Result Section */

function Section({ icon: Icon, title, description, items }) {
  if (!items?.length) return null;

  return (
    <Card className="group overflow-hidden rounded-[20px] border border-white/75 bg-white/75 shadow-[0_5px_22px_rgba(100,55,80,0.055)] backdrop-blur-2xl transition-shadow duration-200 hover:shadow-[0_9px_28px_rgba(100,55,80,0.09)] dark:border-white/10 dark:bg-[#241B29]/75">

      {/* Section Header */}
      <CardHeader className="border-b border-[#EEDFE6]/80 px-4 py-4 sm:px-5 dark:border-white/10">

        <div className="flex items-center justify-between gap-3">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#F0DCE6] bg-[#FFF3F8] text-[#B65F8D] dark:border-white/10 dark:bg-white/5 dark:text-[#E9A7C3]">
              <Icon size={18} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold text-[#44313D] dark:text-white">
                {title}
              </CardTitle>

              <p className="mt-0.5 text-[11px] text-[#927D89] dark:text-[#BBA9B4]">
                {description}
              </p>
            </div>

          </div>

          <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg bg-[#F9EAF1] px-2 text-xs font-semibold text-[#B65F8D] dark:bg-white/10 dark:text-[#E9A7C3]">
            {items.length}
          </span>

        </div>

      </CardHeader>

      {/* Section Results */}
      <CardBody className="p-0">

        <ul>
          {items.map((item, index) => (
            <li key={item.id}>

              <button
                type="button"
                onClick={item.onClick}
                className={cn(
                  'group/item flex w-full items-center gap-3 px-4 py-3.5 text-left sm:px-5',
                  'transition-colors duration-200',
                  'hover:bg-[#FFF4F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D58EAD]',
                  'dark:hover:bg-white/[0.045]',
                  index !== items.length - 1 &&
                    'border-b border-[#F0E4EA]/80 dark:border-white/[0.06]'
                )}
              >

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FAF0F5] text-[#B77A96] transition-colors group-hover/item:bg-[#F5DFE9] dark:bg-white/5 dark:text-[#D9A7BE] dark:group-hover/item:bg-white/10">
                  <FileSearch size={15} />
                </div>

                <div className="min-w-0 flex-1">

                  <p className="truncate text-sm font-medium text-[#44313D] transition-colors group-hover/item:text-[#B65F8D] dark:text-gray-100 dark:group-hover/item:text-[#E9A7C3]">
                    {item.title}
                  </p>

                  {item.sub && (
                    <p className="mt-0.5 truncate text-xs text-[#998590] dark:text-[#BBA9B4]">
                      {item.sub}
                    </p>
                  )}

                </div>

                <ArrowUpRight
                  size={16}
                  className="shrink-0 text-[#B99CAC] transition-all group-hover/item:-translate-y-0.5 group-hover/item:translate-x-0.5 group-hover/item:text-[#B65F8D] dark:text-[#A58D9D]"
                />

              </button>

            </li>
          ))}
        </ul>

      </CardBody>

    </Card>
  );
}