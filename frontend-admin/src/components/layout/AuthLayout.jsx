import { Link } from 'react-router-dom';
import ThemeToggle from '../theme/ThemeToggle';

const AuthLayout = ({ title, subtitle, children, footerLinks }) => (
  <main className="min-h-screen relative flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12 overflow-hidden transition-colors duration-300">

    {/* Background ambient blobs */}
    <div className="pointer-events-none absolute -top-48 -left-48 w-[600px] h-[600px] rounded-full bg-indigo-200/50 dark:bg-indigo-900/20 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-48 -right-48 w-[500px] h-[500px] rounded-full bg-violet-200/50 dark:bg-violet-900/20 blur-3xl" />

    {/* Grid texture */}
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.06]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(0,0,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    />

    {/* Card */}
    <div className="relative z-10 w-full max-w-5xl flex flex-col lg:flex-row rounded-2xl overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/50">

      {/* ── Left intro panel ── */}
      <aside className="lg:w-[42%] relative flex flex-col justify-between bg-zinc-900 dark:bg-zinc-950 p-10 overflow-hidden">
        {/* Inner orbs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />
        {/* Inner grid */}
        <div
          className="absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 flex flex-col gap-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span
              className="text-white font-semibold text-base tracking-tight"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              Horse Riding Admin
            </span>
          </div>

          {/* Copy */}
          <div>
            <p className="text-indigo-400 text-xs font-mono uppercase tracking-[0.18em] mb-4">
              Stable Operations
            </p>
            <h1
              className="text-white text-2xl lg:text-[1.75rem] font-semibold leading-snug mb-4"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif", letterSpacing: '-0.01em' }}
            >
              Control your stable operations with one panel.
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Secure access for admin operations, account recovery, and profile maintenance across devices.
            </p>
          </div>
        </div>

        {/* Feature chips */}
        <div className="relative z-10 flex flex-wrap gap-2 mt-10">
          {['Riders', 'Schedules', 'Horses', 'Reports'].map((label) => (
            <span
              key={label}
              className="px-3 py-1 rounded-full border border-zinc-700 text-zinc-500 text-xs font-mono tracking-wide"
            >
              {label}
            </span>
          ))}
        </div>
      </aside>

      {/* ── Right form panel ── */}
      <section className="flex-1 flex flex-col bg-white dark:bg-zinc-900 transition-colors duration-300">

        {/* Theme toggle row */}
        <div className="flex items-center justify-end px-8 pt-6">
          <ThemeToggle />
        </div>

        {/* Form content */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-12 pb-10 pt-4">

          {/* Title block — only rendered when passed */}
          {(title || subtitle) && (
            <div className="mb-8">
              {title && (
                <h2
                  className="text-2xl font-semibold text-zinc-900 dark:text-white mb-1"
                  style={{ fontFamily: "'DM Serif Display', Georgia, serif", letterSpacing: '-0.02em' }}
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">{subtitle}</p>
              )}
            </div>
          )}

          {/* Page-specific content slot */}
          {children}

          {/* Footer links */}
          {footerLinks?.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium transition-colors duration-150 underline-offset-2 hover:underline"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Panel footer */}
        <p className="text-center text-zinc-400 dark:text-zinc-600 text-xs pb-6 px-8">
          Protected by end-to-end encryption · Horse Riding Admin © 2025
        </p>
      </section>

    </div>
  </main>
);

export default AuthLayout;