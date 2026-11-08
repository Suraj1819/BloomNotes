
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

import {
  ArrowRight,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  CalendarClock,
  FolderTree,
  Lock,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';

import landingBg from '../../../assets/background/favv.png';

/* ----------------------------------
   MIDNIGHT ROSE PALETTE
---------------------------------- */

const rose = {
  primary: '#704256',
  hover: '#835269',
  deep: '#4D2D40',
  pink: '#D9A5B8',
  blush: '#F4E6EB',
  pale: '#FAF3F6',
  text: '#392B34',
  muted: '#897681',
};

/* ----------------------------------
   NOTE THEMES
---------------------------------- */

const noteThemes = [
  {
    name: 'A Quiet Morning',
    category: 'Personal Journal',
    description: 'A little space to collect your thoughts and begin again.',
    placeholder: 'Write down your thoughts...',
    surface: '#F8EDF0',
    input: '#FFF8FA',
    accent: '#B77D91',
    tag: '#EBD3DC',
  },
  {
    name: 'Daily Thoughts',
    category: 'Daily Notes',
    description: 'Capture the little things that make every day meaningful.',
    placeholder: 'What is on your mind today?',
    surface: '#F0EDF4',
    input: '#FAF8FC',
    accent: '#9580A7',
    tag: '#DED5E8',
  },
  {
    name: 'My Ideas',
    category: 'Creative Space',
    description: 'Give your ideas a place to grow into something wonderful.',
    placeholder: 'Start collecting your ideas...',
    surface: '#F8F0E8',
    input: '#FFFAF4',
    accent: '#BD9470',
    tag: '#EEDCCB',
  },
  {
    name: 'Study Corner',
    category: 'Study Notes',
    description: 'Keep your learning, important points and revisions together.',
    placeholder: 'Write your study notes...',
    surface: '#EAF1F2',
    input: '#F7FBFB',
    accent: '#75999E',
    tag: '#D2E3E4',
  },
  {
    name: 'Little Reminders',
    category: 'Reminders',
    description: 'Remember the small things that deserve your attention.',
    placeholder: 'Add a reminder...',
    surface: '#F5F0E4',
    input: '#FFFCF4',
    accent: '#AE9660',
    tag: '#E9DFBF',
  },
  {
    name: 'To Remember',
    category: 'Personal',
    description: 'Keep meaningful thoughts and important moments close.',
    placeholder: 'Write something to remember...',
    surface: '#F2EDE9',
    input: '#FBF8F5',
    accent: '#A68C7B',
    tag: '#E4D8CE',
  },
  {
    name: 'My Plans',
    category: 'Planning',
    description: 'Turn your thoughts into clear plans and small steps.',
    placeholder: 'Write your plans here...',
    surface: '#EAF1EB',
    input: '#F7FBF7',
    accent: '#78967D',
    tag: '#D5E5D6',
  },
  {
    name: 'Private Space',
    category: 'Private Notes',
    description: 'A personal corner for thoughts that belong only to you.',
    placeholder: 'This space is yours...',
    surface: '#EDECF4',
    input: '#F9F8FC',
    accent: '#8984AB',
    tag: '#DCD9EC',
  },
];

/* ----------------------------------
   FEATURES
---------------------------------- */

const features = [
  {
    icon: NotebookPen,
    title: 'Simple writing',
    description: 'A space for every thought.',
  },
  {
    icon: FolderTree,
    title: 'Stay organised',
    description: 'Keep everything in order.',
  },
  {
    icon: Lock,
    title: 'Private space',
    description: 'Your notes, your way.',
  },
];

/* ----------------------------------
   BUTTON COLOR MAP
---------------------------------- */

const getButtonColor = (color) => {
  const colorMap = {
    '#B77D91': '#966276',
    '#9580A7': '#76638A',
    '#BD9470': '#99744F',
    '#75999E': '#587D82',
    '#AE9660': '#8C7748',
    '#A68C7B': '#826A5B',
    '#78967D': '#58775E',
    '#8984AB': '#6B668E',
  };

  return colorMap[color] || rose.primary;
};

/* ----------------------------------
   LANDING PAGE
---------------------------------- */

export default function Landing() {
  const { user } = useAuth();
  const { parentTheme, setParentTheme } = useTheme();

  const isDark = parentTheme === 'dark';

  const [activeTheme, setActiveTheme] = useState(0);
  const [direction, setDirection] = useState(1);
  const [themeNotes, setThemeNotes] = useState({});

  const currentTheme = noteThemes[activeTheme];
  const nextThemeColor =
    noteThemes[(activeTheme + 1) % noteThemes.length].accent;
  const previousThemeColor =
    noteThemes[(activeTheme - 1 + noteThemes.length) % noteThemes.length].accent;

  /* ----------------------------------
     NAVIGATION
  ---------------------------------- */

  const nextTheme = () => {
    setDirection(1);
    setActiveTheme((prev) => (prev + 1) % noteThemes.length);
  };

  const previousTheme = () => {
    setDirection(-1);
    setActiveTheme(
      (prev) => (prev - 1 + noteThemes.length) % noteThemes.length
    );
  };

  const goToTheme = (index) => {
    if (index === activeTheme) return;

    setDirection(index > activeTheme ? 1 : -1);
    setActiveTheme(index);
  };

  const updateNote = (value) => {
    setThemeNotes((prev) => ({
      ...prev,
      [activeTheme]: value,
    }));
  };

  const toggleTheme = () => {
    setParentTheme(isDark ? 'light' : 'dark');
  };

  /* ----------------------------------
     CARD ANIMATION
  ---------------------------------- */

  const cardVariants = {
    enter: (dir) => ({
      opacity: 0,
      y: dir > 0 ? 65 : -65,
      x: dir > 0 ? 18 : -18,
      rotate: dir > 0 ? 4 : -4,
      scale: 0.96,
    }),

    center: {
      opacity: 1,
      y: 0,
      x: 0,
      rotate: 0.3,
      scale: 1,
    },

    exit: (dir) => ({
      opacity: 0,
      y: dir > 0 ? -55 : 55,
      x: dir > 0 ? -15 : 15,
      rotate: dir > 0 ? -4 : 4,
      scale: 0.96,
    }),
  };

  return (
    <div
      className={`relative isolate flex min-h-[100svh] w-full flex-col overflow-x-hidden transition-colors duration-300 lg:h-[100dvh] lg:min-h-[560px] lg:overflow-hidden ${
        isDark ? 'text-white' : 'text-[#392B34]'
      }`}
    >
      {/* BACKGROUND */}

      <div className="fixed inset-0 -z-20">
        <img
          src={landingBg}
          alt=""
          className="h-full w-full object-cover object-center [filter:none]"
        />
      </div>

      <div
        className={`fixed inset-0 -z-10 transition-colors duration-300 ${
          isDark ? 'bg-[#211722]/55' : 'bg-[#F8EFF3]/30'
        }`}
      />

      {/* HEADER */}

      <header className="relative z-30 flex w-full shrink-0 flex-row items-center justify-between gap-2 px-3 py-3 sm:px-8 sm:py-4 lg:px-12">

        {/* Brand: logo and larger title on mobile too */}

        <Link
          to="/"
          aria-label="BloomNotes home"
          className="flex min-w-0 flex-1 items-center overflow-visible outline-none focus:outline-none focus:ring-0 sm:flex-none"
        >
          {/* Logo already contains the BloomNotes wordmark; render it only once. */}
          <span className="origin-left scale-[0.88] xs:scale-[0.98] sm:scale-[1.28] lg:scale-[1.38]">
            <Logo />
          </span>
        </Link>

        <div className="ml-auto flex shrink-0 items-center justify-end gap-2 sm:gap-5">

          {/* Theme toggle */}

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#704256] text-white shadow-sm transition hover:bg-[#835269] focus:outline-none focus:ring-0 sm:h-10 sm:w-10"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#704256] px-3.5 py-2 text-[11px] font-semibold text-white shadow-md transition hover:bg-[#835269] focus:outline-none focus:ring-0 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
            >
              Open App
              <ArrowRight size={15} />
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#704256] px-3.5 py-2 text-[11px] font-semibold text-white shadow-md transition hover:bg-[#835269] focus:outline-none focus:ring-0 sm:gap-2 sm:px-6 sm:py-2.5 sm:text-sm"
            >
              Login
              <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </header>

      {/* MAIN */}

      <main className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-1 items-start px-3 pb-5 pt-2 sm:px-8 sm:py-5 lg:min-h-0 lg:items-center lg:px-12 lg:pb-3">

        <div className="grid w-full min-w-0 grid-cols-1 items-start gap-7 sm:gap-9 lg:items-center lg:gap-12 lg:grid-cols-[0.9fr_1.1fr]">

          {/* DESKTOP HERO ONLY */}

          <section className="hidden flex-col justify-center py-6 lg:flex">

            <div
              className={`mb-5 inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${
                isDark
                  ? 'border-white/10 bg-white/10 text-[#F0C8D7]'
                  : 'border-[#E8D4DD] bg-[#FFF8FA]/80 text-[#704256]'
              }`}
            >
              <Sparkles size={14} />
              A little space for your thoughts
            </div>

            <h1
              className={`max-w-[650px] text-[clamp(2.5rem,5vw,5.2rem)] font-semibold leading-[1.05] tracking-[-0.055em] ${
                isDark ? 'text-white' : 'text-[#392B34]'
              }`}
            >
              Your thoughts.
              <br />
              Your space.
              <br />
              <span className="text-[#B77D91]">
                Your BloomNotes.
              </span>
            </h1>

            <p
              className={`mt-6 max-w-[480px] text-base leading-7 ${
                isDark ? 'text-white/65' : 'text-[#897681]'
              }`}
            >
              A calm and simple space to write, organise and keep the thoughts
              that matter to you. Make room for ideas, plans and everyday notes.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">

              <Link
                to={user ? '/dashboard' : '/login'}
                className="inline-flex h-12 items-center gap-3 rounded-full bg-[#704256] px-6 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#835269] focus:outline-none focus:ring-0"
              >
                Login
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/login"
                className="inline-flex h-12 items-center rounded-full border border-[#D9A5B8]/50 bg-[#FFF8FA]/80 px-6 text-sm font-semibold text-[#704256] transition hover:bg-[#F4E6EB] focus:outline-none focus:ring-0"
              >
                Explore your space
              </Link>
            </div>

            {/* FEATURES */}

            <div className="mt-10 grid max-w-[560px] grid-cols-3 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;

                return (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        isDark
                          ? 'bg-[#704256]/60 text-[#F0C8D7]'
                          : 'bg-[#F4E6EB] text-[#704256]'
                      }`}
                    >
                      <Icon size={17} />
                    </div>

                    <div>
                      <h3
                        className={`text-xs font-semibold ${
                          isDark ? 'text-white/90' : 'text-[#392B34]'
                        }`}
                      >
                        {feature.title}
                      </h3>

                      <p
                        className={`mt-1 text-[11px] leading-5 ${
                          isDark ? 'text-white/55' : 'text-[#897681]'
                        }`}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className={`mt-8 flex items-center gap-5 text-xs ${
                isDark ? 'text-white/50' : 'text-[#897681]'
              }`}
            >
              <span className="flex items-center gap-2">
                <ShieldCheck size={14} />
                Personal space
              </span>

              <span className="flex items-center gap-2">
                <Lock size={13} />
                Your notes, your way
              </span>
            </div>
          </section>

          {/* WRITING PAD */}

          <section className="relative flex min-w-0 w-full flex-col items-center justify-center pt-2 pb-3 sm:pt-4 sm:pb-5 lg:pt-16 lg:pb-6">

            {/* TILTED REMINDER CARD */}

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="relative z-20 mb-3 ml-auto flex w-fit max-w-[calc(100%-12px)] rotate-[4deg] items-center gap-2 rounded-2xl border border-[#E8D4DD] bg-[#FFF8FA] px-3 py-2.5 text-[#704256] shadow-xl transition-transform duration-300 hover:rotate-0 sm:gap-3 sm:px-5 sm:py-4 xl:absolute xl:-top-2 xl:right-3 xl:mb-0 xl:ml-0 xl:rotate-[5deg]" 
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4E6EB]">
                <CalendarClock size={17} />
              </div>

              <div>
                <p className="text-xs font-semibold">
                  A little reminder
                </p>

                <p className="mt-1 text-[10px] text-[#897681]">
                  Make time for yourself.
                </p>
              </div>

              <Check size={15} className="text-[#B77D91]" />
            </motion.div>

            {/* MOBILE WRITING PAD TITLE */}

            <div className="mb-3 flex w-full max-w-[620px] items-center justify-between gap-3 lg:hidden">
              <div>
                <p
                  className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${
                    isDark ? 'text-white/50' : 'text-[#897681]'
                  }`}
                >
                  YOUR PERSONAL SPACE
                </p>

                <h1
                  className={`mt-1 text-xl font-semibold tracking-tight ${
                    isDark ? 'text-white' : 'text-[#704256]'
                  }`}
                >
                  Start writing.
                </h1>
              </div>

              <NotebookPen
                size={22}
                className="text-[#B77D91]"
              />
            </div>

            {/* CARD STACK */}

            <div className="relative w-full max-w-[620px] min-w-0 overflow-visible">

              {/* BACK CARD 3 */}

              <div
                className="absolute inset-x-4 top-0 h-full translate-y-4 rotate-[3deg] rounded-[24px] shadow-lg transition-colors duration-300 sm:rounded-[28px] sm:translate-y-5"
                style={{ backgroundColor: currentTheme.accent }}
              />

              {/* BACK CARD 2 */}

              <div
                className="absolute inset-x-2 top-0 h-full translate-y-2 -rotate-[2deg] rounded-[24px] shadow-lg transition-colors duration-300 sm:rounded-[28px] sm:translate-y-3"
                style={{ backgroundColor: currentTheme.tag }}
              />

              {/* ACTIVE CARD */}

              <div className="relative z-10">
                <AnimatePresence
                  mode="wait"
                  initial={false}
                  custom={direction}
                >
                  <motion.div
                    key={activeTheme}
                    custom={direction}
                    variants={cardVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      duration: 0.42,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="relative min-h-[350px] w-full rounded-[22px] p-4 shadow-2xl transition-colors duration-300 xs:min-h-[370px] sm:min-h-[420px] sm:rounded-[28px] sm:p-9" 
                    style={{
                      backgroundColor: currentTheme.surface,
                      color: rose.text,
                    }}
                  >

                    {/* CARD HEADER */}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: currentTheme.accent,
                          }}
                        />

                        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#897681] sm:text-[11px] sm:tracking-[0.18em]">
                          {currentTheme.category}
                        </span>
                      </div>

                      <span className="text-[11px] tabular-nums text-[#A18E98] sm:text-xs">
                        {String(activeTheme + 1).padStart(2, '0')} /{' '}
                        {String(noteThemes.length).padStart(2, '0')}
                      </span>
                    </div>

                    {/* CARD TITLE */}

                    <h2 className="mt-5 break-words text-xl font-semibold tracking-tight sm:mt-9 sm:text-4xl">
                      {currentTheme.name}
                    </h2>

                    <p className="mt-2 max-w-[420px] text-[11px] leading-5 text-[#897681] sm:mt-3 sm:text-sm sm:leading-6">
                      {currentTheme.description}
                    </p>

                    {/* WRITING AREA */}

                    <textarea
                      value={themeNotes[activeTheme] || ''}
                      onChange={(e) => updateNote(e.target.value)}
                      placeholder={currentTheme.placeholder}
                      aria-label={`Write in ${currentTheme.name}`}
                      className="mt-4 min-h-[145px] w-full resize-none rounded-2xl border border-white/60 p-3 text-sm leading-6 text-[#392B34] outline-none transition-all placeholder:text-[#A9959F] focus:border-[#B77D91] focus:outline-none focus:ring-0 sm:mt-7 sm:min-h-[180px] sm:p-5 sm:leading-7"
                      style={{
                        backgroundColor: currentTheme.input,
                      }}
                    />

                    {/* CARD FOOTER */}

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] text-[#A18E98] sm:text-[11px]">
                        Temporary note
                      </span>

                      <span className="text-[10px] tabular-nums text-[#A18E98] sm:text-[11px]">
                        {(themeNotes[activeTheme] || '').length} characters
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* NAVIGATION */}

            <div className="relative z-30 mt-4 flex w-full max-w-[620px] items-center justify-between gap-1.5 px-0 sm:mt-7 sm:gap-2 sm:px-1">

              {/* PREVIOUS */}

              <button
                type="button"
                onClick={previousTheme}
                aria-label="Previous theme"
                className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-3 text-[11px] font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-0 sm:h-11 sm:gap-2 sm:px-5 sm:text-sm"
                style={{
                  backgroundColor: getButtonColor(previousThemeColor),
                }}
              >
                <ChevronLeft size={17} />
                <span>Previous</span>
              </button>

              {/* THEME DOTS */}

              <div className="flex min-w-0 flex-1 items-center justify-center gap-1 sm:gap-1.5">
                {noteThemes.map((theme, index) => (
                  <button
                    key={theme.name}
                    type="button"
                    onClick={() => goToTheme(index)}
                    aria-label={`Go to ${theme.name}`}
                    className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-0 sm:h-2 ${
                      index === activeTheme
                        ? 'w-4 sm:w-6'
                        : 'w-1.5 opacity-50 hover:opacity-100 sm:w-2'
                    }`}
                    style={{
                      backgroundColor: currentTheme.accent,
                    }}
                  />
                ))}
              </div>

              {/* NEXT */}

              <button
                type="button"
                onClick={nextTheme}
                aria-label="Next theme"
                className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-0 sm:h-12 sm:gap-2 sm:px-6 sm:text-sm"
                style={{
                  backgroundColor: getButtonColor(nextThemeColor),
                }}
              >
                <span>Next</span>
                <ChevronRight size={17} />
              </button>
            </div>


          </section>
        </div>
      </main>

      {/* RESPONSIVE FOOTER */}

      <footer
        className={`relative z-20 mt-auto flex w-full shrink-0 flex-col items-center justify-center gap-2 border-t px-4 py-4 text-center text-xs sm:flex-row sm:justify-between sm:px-8 sm:py-5 sm:text-sm lg:px-12 ${
          isDark
            ? 'border-white/10 text-white/55'
            : 'border-[#E8D4DD]/70 text-[#897681]'
        }`}
      >
        <p className="font-medium">© {new Date().getFullYear()} BloomNotes</p>

        <p className="text-xs leading-5 sm:text-sm">
          A little space to let your thoughts bloom.
        </p>

        <Link
          to="/privacy"
          className="text-xs font-semibold transition hover:text-[#B77D91] focus:outline-none focus:ring-0 sm:text-sm"
        >
          Privacy
        </Link>
      </footer>
    </div>
  );
}
