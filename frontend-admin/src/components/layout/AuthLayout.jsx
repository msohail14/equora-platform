import { Link } from 'react-router-dom';
import ThemeToggle from '../theme/ThemeToggle';
import { ShieldCheck } from 'lucide-react';
import { HorseIcon } from '../ui/HorseIcon';

const AuthLayout = ({ title, subtitle, children, footerLinks }) => (
  <main className="min-h-screen flex bg-equestrian-stone-50 dark:bg-equestrian-stone-950 transition-colors duration-300">
    
    {/* ── Left Image Panel: HQ horse and rider (Hidden on mobile) ── */}
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-equestrian-green-950">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 hover:scale-105"
        style={{
          backgroundImage: "url('https://www.justhorseriders.co.uk/cdn/shop/articles/top_10_riders.png?v=1687771294&width=1080')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-equestrian-green-950/92 via-equestrian-green-950/50 to-equestrian-green-950/20" />
      
      <div className="relative z-10 flex flex-col justify-between w-full p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-equestrian-gold-500/90 backdrop-blur-sm shadow-lg shadow-black/20">
            <HorseIcon size={20} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-wide text-white drop-shadow-md">
            EQUORA
          </span>
        </div>

        <div className="max-w-md">
          <h1 className="text-4xl font-bold leading-tight mb-4 drop-shadow-lg font-serif">
            Excellence in Stable Management
          </h1>
          <p className="text-equestrian-stone-200 text-lg leading-relaxed drop-shadow-md">
            Streamline your operations, manage bookings, and track performance with our comprehensive admin suite.
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-xs font-medium text-equestrian-stone-300/80 uppercase tracking-widest">
          <ShieldCheck size={14} />
          <span>Secure Admin Portal</span>
        </div>
      </div>
    </div>

    {/* ── Right Form Panel ── */}
    <div className="flex-1 flex flex-col justify-center relative">
      {/* Theme Toggle (Top Right) */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md mx-auto px-6 sm:px-8 py-12">
        {/* Mobile Logo (Visible only on mobile) */}
        <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-equestrian-green-600 text-white">
            <HorseIcon size={18} />
          </div>
          <span className="text-lg font-bold text-equestrian-green-950 dark:text-white">
            Equora
          </span>
        </div>

        {/* Header */}
        <div className="mb-8 text-center lg:text-left">
          {title && (
            <h2 className="text-3xl font-bold text-equestrian-green-950 dark:text-white mb-2 font-serif">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-equestrian-stone-500 dark:text-equestrian-stone-400">
              {subtitle}
            </p>
          )}
        </div>

        {/* Content */}
        {children}

        {/* Footer Links */}
        {footerLinks?.length > 0 && (
          <div className="mt-8 pt-6 border-t border-equestrian-stone-100 dark:border-equestrian-stone-800 flex flex-wrap justify-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-equestrian-green-600 hover:text-equestrian-green-700 dark:text-equestrian-green-400 dark:hover:text-equestrian-green-300 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
        
        <p className="mt-8 text-center text-xs text-equestrian-stone-400 dark:text-equestrian-stone-500">
          © 2026 Equora. All rights reserved.
        </p>
      </div>
    </div>
  </main>
);

export default AuthLayout;
