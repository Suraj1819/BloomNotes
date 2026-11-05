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
} from 'lucide-react';

const SEARCH_SECTIONS = [
  {
    key: 'notes',
    title: 'Notes',
    icon: NotebookPen,
    description: 'Your saved notes',
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
    icon: FolderTree,
    description: 'Organized collections',
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
    icon: Tag,
    description: 'Find notes by tags',
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
    icon: BookOpen,
    description: 'Your journal entries',
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
    icon: Sparkles,
    description: 'Personal collections',
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
    icon: Lock,
    description: 'Your private files',
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
    <div className="relative min-h-full">
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">

        {/* Page Header */}
        <div className="mb-7">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#E8D8FF] bg-white/80 shadow-sm dark:border-white/10 dark:bg-gray-900/80">
              <SearchIcon
                size={21}
                className="text-[#7652C8]"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#252044] dark:text-white">
                Search
              </h1>

              <p className="text-sm text-[#766A91] dark:text-gray-400">
                Find anything across your BloomNotes workspace.
              </p>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <form onSubmit={submit} className="mb-7">
          <div className="group relative">
            <SearchIcon
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B7BAA] transition-colors group-focus-within:text-[#7652C8]"
            />

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search notes, folders, journal, vault..."
              className="h-13 w-full rounded-2xl border-[#E3D5FA] bg-white/90 pl-11 pr-12 text-sm shadow-sm transition-all placeholder:text-[#A69AB9] focus:border-[#A78BFA] focus:ring-2 focus:ring-[#A78BFA]/20 dark:border-white/10 dark:bg-gray-900/80 dark:text-white"
              autoFocus
            />

            {input && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#8B7BAA] transition-colors hover:bg-[#F2ECFF] hover:text-[#7652C8] dark:hover:bg-gray-800"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between px-1">
            <p className="text-xs text-[#877B9E] dark:text-gray-400">
              Search across all your saved content
            </p>

            <span className="text-xs text-[#877B9E] dark:text-gray-400">
              Press Enter to search
            </span>
          </div>
        </form>

        {/* Initial State */}
        {!q && (
          <div className="rounded-2xl border border-dashed border-[#DCCCF5] bg-white/55 px-5 py-14 text-center dark:border-white/10 dark:bg-gray-900/40">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1EAFE] dark:bg-purple-950/50">
              <FileSearch
                size={26}
                className="text-[#7652C8] dark:text-purple-300"
              />
            </div>

            <h2 className="text-base font-semibold text-[#332A50] dark:text-white">
              Search your workspace
            </h2>

            <p className="mx-auto mt-1 max-w-sm text-sm text-[#877B9E] dark:text-gray-400">
              Enter a keyword to find notes, folders, tags, journal entries,
              personal space items and vault files.
            </p>
          </div>
        )}

        {/* Loading State */}
        {q && isFetching && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#E8D8FF] bg-white/65 py-12 dark:border-white/10 dark:bg-gray-900/50">
            <Loader2
              size={19}
              className="animate-spin text-[#7652C8]"
            />

            <span className="text-sm text-[#766A91] dark:text-gray-300">
              Searching your workspace...
            </span>
          </div>
        )}

        {/* Error State */}
        {q && !isFetching && isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50/80 px-5 py-10 text-center dark:border-red-900/40 dark:bg-red-950/20">
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#332A50] dark:text-white">
                  Search results
                </h2>

                <p className="mt-0.5 text-xs text-[#877B9E] dark:text-gray-400">
                  Results for "{q}"
                </p>
              </div>

              <span className="rounded-full border border-[#E8D8FF] bg-white/75 px-3 py-1 text-xs font-semibold text-[#7652C8] dark:border-white/10 dark:bg-gray-900/70 dark:text-purple-300">
                {totalResults} found
              </span>
            </div>

            {/* Result Sections */}
            {totalResults > 0 ? (
              <div className="space-y-4">
                {sections.map((section) => (
                  <Section
                    key={section.key}
                    icon={section.icon}
                    title={section.title}
                    items={section.items}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#DCCCF5] bg-white/55 px-5 py-14 text-center dark:border-white/10 dark:bg-gray-900/40">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1EAFE] dark:bg-purple-950/50">
                  <SearchIcon
                    size={22}
                    className="text-[#7652C8]"
                  />
                </div>

                <h3 className="text-base font-semibold text-[#332A50] dark:text-white">
                  No results found
                </h3>

                <p className="mt-1 text-sm text-[#877B9E] dark:text-gray-400">
                  No matches found for "{q}". Try another keyword.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Section({ icon: Icon, title, items }) {
  if (!items?.length) return null;

  return (
    <Card className="overflow-hidden border border-[#E8D8FF] bg-white/85 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-gray-900/80">
      <CardHeader className="border-b border-[#EEE5FA] px-5 py-3.5 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F1EAFE] dark:bg-purple-950/50">
              <Icon
                size={16}
                className="text-[#7652C8] dark:text-purple-300"
              />
            </div>

            <CardTitle className="text-sm font-semibold text-[#332A50] dark:text-white">
              {title}
            </CardTitle>
          </div>

          <span className="rounded-full bg-[#F3EDFF] px-2.5 py-1 text-xs font-semibold text-[#7652C8] dark:bg-purple-950/60 dark:text-purple-300">
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
                className="group flex w-full items-center gap-3 border-b border-[#F0EAF8] px-5 py-3.5 text-left transition-colors last:border-0 hover:bg-[#F8F5FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#A78BFA] dark:border-white/5 dark:hover:bg-gray-800/70"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#332A50] transition-colors group-hover:text-[#7652C8] dark:text-gray-100 dark:group-hover:text-purple-300">
                    {item.title}
                  </p>

                  {item.sub && (
                    <p className="mt-0.5 truncate text-xs text-[#9387A8] dark:text-gray-400">
                      {item.sub}
                    </p>
                  )}
                </div>

                <ArrowUpRight
                  size={16}
                  className="shrink-0 text-[#B5A7CA] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 dark:text-gray-500"
                />
              </button>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}