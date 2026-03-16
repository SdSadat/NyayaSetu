import { useState, useEffect } from 'react';
import { Routes, Route, Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Ask from './pages/Ask';
import Learn from './pages/Learn';
import LessonView from './pages/LessonView';
import Quiz from './pages/Quiz';
import Drishti from './pages/Drishti';
import SharedReport from './pages/SharedReport';
import Sources from './pages/Sources';
import Cards from './pages/Cards';
import CardView from './pages/CardView';
import Login from './pages/Login';
import Disclaimer from './components/Disclaimer';
import { getUsername, isLoggedIn, clearAuth, onAuthChange } from './lib/auth';

/* ─── SVG Icons ─────────────────────────────────────────── */

function IconShield() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconBrain() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A5.5 5.5 0 0 0 4 7.5c0 1.12.34 2.17.92 3.04A5.5 5.5 0 0 0 7 20h1" />
      <path d="M14.5 2A5.5 5.5 0 0 1 20 7.5c0 1.12-.34 2.17-.92 3.04A5.5 5.5 0 0 1 17 20h-1" />
      <path d="M12 2v20" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

/* ─── Landing Page ──────────────────────────────────────── */

function Landing() {
  return (
    <main className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pb-16 sm:pb-20 pt-10 sm:pt-24">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-hero-glow opacity-60 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          {/* Logo */}
          <div className="mx-auto mb-8 w-64 animate-fade-in sm:w-80">
            <img
              src="/logos/NyayaSetu_logo.png"
              alt="NyayaSetu"
              className="w-full drop-shadow-2xl"
            />
          </div>

          {/* Tagline */}
          <p className="mx-auto max-w-2xl animate-slide-up text-lg text-gray-400 sm:text-xl">
            AI-powered legal literacy for{' '}
            <span className="font-semibold text-white">Bharat</span>. Understand
            your rights with source-backed, cited legal information.
          </p>

          {/* AI badge */}
          <div className="mt-6 inline-flex animate-slide-up items-center gap-2 rounded-full border border-neon-cyan/20 bg-neon-cyan/5 px-4 py-2 text-sm text-neon-cyan">
            <IconBrain />
            <span>Powered by AI &middot; Grounded in Law</span>
          </div>

          {/* CTA buttons */}
          <div className="mt-10 flex animate-slide-up flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/ask" className="btn-primary gap-2">
              <IconShield />
              Ask a Legal Question
            </Link>
            <Link to="/learn" className="btn-secondary gap-2">
              <IconBook />
              Learn Your Rights
            </Link>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="relative px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Three Modules, One{' '}
              <span className="text-gradient">Mission</span>
            </h2>
            <p className="mt-3 text-gray-400">
              Legal awareness made accessible through AI-powered tools
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-3">
            {/* Sahayak */}
            <Link
              to="/ask"
              className="glass-card-hover glass-card-cyan group flex flex-col items-center text-center"
            >
              <div className="mb-4 h-24 w-24 overflow-hidden rounded-2xl">
                <img
                  src="/logos/sahayak-removebg-preview.png"
                  alt="Sahayak"
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <h3 className="text-lg font-bold text-neon-cyan">Sahayak</h3>
              <p className="mt-1 text-xs font-medium uppercase tracking-widest text-gray-500">
                Citizen Reasoning Assistant
              </p>
              <p className="mt-3 text-sm text-gray-400">
                Describe a scenario in plain language. Get cited legal
                information from verified sources.
              </p>
              <div className="mt-auto flex items-center gap-1 pt-4 text-sm font-medium text-neon-cyan opacity-0 transition-opacity group-hover:opacity-100">
                Ask Now <IconArrow />
              </div>
            </Link>

            {/* Jagrut */}
            <Link
              to="/learn"
              className="glass-card-hover glass-card-gold group flex flex-col items-center text-center"
            >
              <div className="mb-4 h-24 w-24 overflow-hidden rounded-2xl">
                <img
                  src="/logos/jagrut-removebg-preview.png"
                  alt="Jagrut"
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <h3 className="text-lg font-bold text-neon-gold">Jagrut</h3>
              <p className="mt-1 text-xs font-medium uppercase tracking-widest text-gray-500">
                Legal Literacy Engine
              </p>
              <p className="mt-3 text-sm text-gray-400">
                Bite-sized lessons on fundamental rights and everyday legal
                situations.
              </p>
              <div className="mt-auto flex items-center gap-1 pt-4 text-sm font-medium text-neon-gold opacity-0 transition-opacity group-hover:opacity-100">
                Start Learning <IconArrow />
              </div>
            </Link>

            {/* Drishti */}
            <Link
              to="/drishti"
              className="glass-card-hover glass-card-purple group flex flex-col items-center text-center"
            >
              <div className="mb-4 h-24 w-24 overflow-hidden rounded-2xl">
                <img
                  src="/logos/drishti-removebg-preview.png"
                  alt="Drishti"
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <h3 className="text-lg font-bold text-neon-purple">Drishti</h3>
              <p className="mt-1 text-xs font-medium uppercase tracking-widest text-gray-500">
                Professional Summarizer
              </p>
              <p className="mt-3 text-sm text-gray-400">
                Upload judgments and get structured case briefs with cited
                analysis.
              </p>
              <div className="mt-auto flex items-center gap-1 pt-4 text-sm font-medium text-neon-purple opacity-0 transition-opacity group-hover:opacity-100">
                Summarize <IconArrow />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="glass-card">
            <h3 className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-gray-500">
              How It Works
            </h3>
            <div className="space-y-5">
              {[
                {
                  step: '1',
                  icon: <IconSearch />,
                  title: 'Describe Your Situation',
                  desc: 'Ask in plain language -- no legal jargon needed.',
                },
                {
                  step: '2',
                  icon: <IconBrain />,
                  title: 'AI Retrieves & Verifies',
                  desc: 'We search bare acts, court rulings, and state rules. Every claim is cross-verified.',
                },
                {
                  step: '3',
                  icon: <IconStar />,
                  title: 'Get Cited Information',
                  desc: 'Receive source-backed legal information with certainty scores and jurisdiction tags.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex items-start gap-4 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neon-cyan/10 text-neon-cyan">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-sm text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="px-4 py-8 sm:py-12 pb-24 sm:pb-12">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6 text-center text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            Retrieval-first, never hallucinated
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-neon-cyan" />
            Every claim cited to source
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-neon-purple" />
            Refuses when uncertain
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-neon-gold" />
            Information, never advice
          </div>
        </div>
      </section>
    </main>
  );
}

/* ─── Mobile Bottom Nav ──────────────────────────────────── */

function MobileBottomNav() {
  const location = useLocation();

  const tabs = [
    { to: '/',        label: 'Home',    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { to: '/ask',     label: 'Sahayak', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
    { to: '/learn',   label: 'Jagrut',  icon: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' },
    { to: '/cards',   label: 'Cards',   icon: 'M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z' },
    { to: '/drishti', label: 'Drishti', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
  ];

  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-dark-950/95 backdrop-blur-xl sm:hidden">
      <div className="flex items-stretch justify-around px-1" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {tabs.map((tab) => {
          const isActive = tab.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(tab.to);
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 transition-colors ${isActive ? 'text-neon-cyan' : 'text-gray-600'}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
                strokeLinecap="round" strokeLinejoin="round"
              >
                <path d={tab.icon} />
              </svg>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-neon-cyan' : 'text-gray-600'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute top-0 h-[2px] w-8 rounded-full bg-neon-cyan" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

/* ─── Main App ──────────────────────────────────────────── */

// Routes that need a fixed full-height viewport (no page scroll, no footer)
const FULLSCREEN_ROUTES = ['/ask', '/drishti'];

function IconUser() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isFullScreen = FULLSCREEN_ROUTES.includes(location.pathname);

  // Reactive auth state
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [username, setUsernameState] = useState(getUsername());

  useEffect(() => {
    return onAuthChange(() => {
      setLoggedIn(isLoggedIn());
      setUsernameState(getUsername());
    });
  }, []);

  function handleLogout() {
    clearAuth();
    navigate('/');
  }

  return (
    <div className={`relative flex flex-col ${isFullScreen ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {/* Ambient glow background */}
      <div className="ambient-glow" />

      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-dark-950/88 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/" className="group flex min-w-0 items-center gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5 transition-all hover:border-neon-cyan/20 hover:bg-white/[0.04]">
            <img
              src="/logos/NyayaSetu_logo.png"
              alt="NyayaSetu"
              className="h-8 w-8 shrink-0 rounded-md object-contain"
            />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold text-gray-100">NyayaSetu</p>
              <p className="truncate text-[10px] uppercase tracking-wider text-gray-500">Legal Intelligence Platform</p>
            </div>
          </Link>

          <nav className="no-scrollbar -mr-1 flex min-w-0 items-center gap-0.5 overflow-x-auto pr-1">
            {/* Nav links hidden on mobile — bottom nav handles it */}
            <NavLink
              to="/ask"
              className={({ isActive }) =>
                `nav-link hidden sm:block ${isActive ? 'active' : ''}`
              }
            >
              Sahayak
            </NavLink>
            <NavLink
              to="/learn"
              className={({ isActive }) =>
                `nav-link hidden sm:block ${isActive ? 'active' : ''}`
              }
            >
              Jagrut
            </NavLink>
            <NavLink
              to="/cards"
              className={({ isActive }) =>
                `nav-link hidden sm:block ${isActive ? 'active' : ''}`
              }
            >
              Rights Cards
            </NavLink>
            <NavLink
              to="/drishti"
              className={({ isActive }) =>
                `nav-link hidden sm:block ${isActive ? 'active' : ''}`
              }
            >
              Drishti
            </NavLink>
            <NavLink
              to="/sources"
              className={({ isActive }) =>
                `nav-link hidden sm:block ${isActive ? 'active' : ''}`
              }
            >
              Sources
            </NavLink>

            {/* Auth section */}
            <div className="ml-auto sm:ml-2 flex shrink-0 items-center gap-1.5 sm:border-l border-white/[0.08] sm:pl-3">
              {loggedIn ? (
                <>
                  <span className="hidden items-center gap-1.5 rounded-lg bg-neon-cyan/10 px-2.5 py-1.5 text-xs font-medium text-neon-cyan sm:flex">
                    <IconUser />
                    {username}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                    title="Sign out"
                  >
                    <IconLogout />
                    <span className="hidden sm:inline">Sign out</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 rounded-lg border border-neon-cyan/20 bg-neon-cyan/5 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/40 hover:bg-neon-cyan/10"
                >
                  <IconUser />
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Page Content */}
      <div className={`relative z-10 flex-1 ${isFullScreen ? 'overflow-hidden' : ''}`}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/ask" element={<Ask />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:id" element={<LessonView />} />
          <Route path="/learn/:id/quiz" element={<Quiz />} />
          <Route path="/cards" element={<Cards />} />
          <Route path="/cards/:id" element={<CardView />} />
          <Route path="/drishti" element={<Drishti />} />
          <Route path="/drishti/s/:shareId" element={<SharedReport />} />
          <Route path="/sources" element={<Sources />} />
        </Routes>
      </div>

      {/* Footer — hidden on full-screen routes */}
      {!isFullScreen && <Disclaimer />}

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}
