import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarCheck,
  Building2,
  LayoutGrid,
  Medal,
  GraduationCap,
  BookOpen,
  Users,
  CreditCard,
  Wallet,
  BarChart3,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import ThemeToggle from '../theme/ThemeToggle';
import { HorseIcon } from '../ui/HorseIcon';
import { logoutAdmin } from '../../features/auth/authSlice';

const navSections = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Bookings', to: '/admin/bookings', icon: CalendarCheck },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Stables', to: '/admin/stables', icon: Building2 },
      { label: 'Arenas', to: '/admin/arenas', icon: LayoutGrid },
      { label: 'Horses', to: '/admin/horses', icon: HorseIcon },
      { label: 'Disciplines', to: '/admin/disciplines', icon: Medal },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Coaches', to: '/admin/coaches', icon: GraduationCap },
      { label: 'Riders', to: '/admin/riders', icon: Users },
    ],
  },
  {
    label: 'Learning',
    items: [
      { label: 'Courses', to: '/admin/courses', icon: BookOpen },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Payments', to: '/admin/payments', icon: CreditCard },
      { label: 'Payouts', to: '/admin/payouts', icon: Wallet },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
      { label: 'Settings', to: '/admin/settings', icon: Settings },
      { label: 'Notifications', to: '/admin/notifications', icon: Bell },
    ],
  },
  ];

const SidebarContent = ({ onNavigate }) => (
  <div className="flex h-full flex-col bg-equestrian-green-950 text-white">
    <div className="flex items-center gap-3 px-6 pb-8 pt-6">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-equestrian-gold-500 shadow-lg shadow-equestrian-gold-900/20">
        <HorseIcon size={20} className="text-white" />
      </div>
      <div>
        <h2 className="text-lg font-bold leading-tight text-white">
          Equora
        </h2>
      </div>
    </div>

    <nav className="flex-1 space-y-6 overflow-y-auto px-4">
      {navSections.map((section) => (
        <div key={section.label}>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-equestrian-green-300/60">
            {section.label}
          </p>
          <div className="space-y-1">
            {section.items.map(({ label, to, icon: NavIcon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-equestrian-gold-500 text-white shadow-md shadow-equestrian-gold-900/20'
                      : 'text-equestrian-green-100/70 hover:bg-equestrian-green-900 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center transition-colors duration-200 ${
                        isActive ? 'text-white' : 'text-equestrian-green-300/70 group-hover:text-white'
                      }`}
                    >
                      <NavIcon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    </span>
                    <span className="flex-1">{label}</span>
                    {isActive && (
                      <ChevronRight size={14} strokeWidth={3} className="text-white/80" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
    
    <div className="p-4">
        <div className="rounded-xl bg-equestrian-green-900/50 p-4 border border-equestrian-green-800">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-equestrian-green-800 flex items-center justify-center text-xs font-bold text-equestrian-green-100">
                    JD
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">John Doe</p>
                    <p className="text-xs text-equestrian-green-300 truncate">Club Director</p>
                </div>
            </div>
        </div>
    </div>
  </div>
);

const AdminAppLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { admin } = useSelector((state) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logoutAdmin());
    setProfileOpen(false);
    navigate('/admin/login', { replace: true });
  };

  const initials = `${admin?.first_name?.[0] || 'A'}${admin?.last_name?.[0] || ''}`.toUpperCase();
  const fullName = [admin?.first_name, admin?.last_name].filter(Boolean).join(' ') || 'Admin';

  return (
    <div className="h-screen overflow-hidden bg-equestrian-stone-50 dark:bg-equestrian-stone-950 lg:grid lg:grid-cols-[280px_1fr]">

      <aside className="hidden h-full overflow-hidden border-r border-equestrian-stone-200 bg-equestrian-green-950 dark:border-equestrian-stone-800 lg:block">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-30 bg-equestrian-stone-950/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.aside
              className="fixed bottom-0 left-0 top-0 z-40 w-[85vw] max-w-[300px] overflow-hidden bg-equestrian-green-950 shadow-2xl lg:hidden"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
                className="absolute right-4 top-4 z-50 flex h-8 w-8 items-center justify-center rounded-lg bg-equestrian-green-900 text-white hover:bg-equestrian-green-800"
              >
                <X size={18} />
              </button>
              <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex h-full flex-col overflow-hidden">

        <header className="flex shrink-0 items-center justify-between gap-4 bg-white px-6 py-4 shadow-sm dark:bg-equestrian-stone-900 lg:bg-transparent lg:shadow-none">
          
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-equestrian-stone-600 shadow-sm ring-1 ring-equestrian-stone-200 transition hover:bg-equestrian-stone-50 dark:bg-equestrian-stone-800 dark:text-equestrian-stone-300 dark:ring-equestrian-stone-700"
            >
              <Menu size={20} />
            </button>
            <span className="text-lg font-bold text-equestrian-green-950 dark:text-white">Equora</span>
          </div>

          {/* Search bar placeholder - visual only as per design inspiration */}
          <div className="hidden max-w-md flex-1 lg:block">
             <div className="relative">
                {/* Search input could go here */}
             </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />

            <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-equestrian-stone-500 shadow-sm ring-1 ring-equestrian-stone-200 hover:text-equestrian-stone-700 dark:bg-equestrian-stone-800 dark:text-equestrian-stone-400 dark:ring-equestrian-stone-700">
                <Bell size={20} />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-equestrian-stone-800"></span>
            </button>

            <div className="relative pl-2" ref={profileRef}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setProfileOpen((o) => !o); }}
                className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-equestrian-stone-100 dark:hover:bg-equestrian-stone-800"
                aria-expanded={profileOpen}
                aria-haspopup="true"
                aria-label="Account menu"
              >
                <div className="hidden text-right md:block">
                  <strong className="block text-sm font-bold text-equestrian-stone-900 dark:text-white">
                    {fullName}
                  </strong>
                  <span className="block text-xs font-medium text-equestrian-stone-500 dark:text-equestrian-stone-400">
                    {admin?.email}
                  </span>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-equestrian-green-900 text-sm font-bold text-white shadow-md ring-2 ring-white dark:ring-equestrian-stone-800">
                  {initials}
                </div>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-equestrian-stone-200 bg-white py-1 shadow-lg dark:border-equestrian-stone-700 dark:bg-equestrian-stone-900"
                  >
                    <div className="border-b border-equestrian-stone-100 px-4 py-3 dark:border-equestrian-stone-800 md:hidden">
                      <p className="text-sm font-bold text-equestrian-stone-900 dark:text-white">{fullName}</p>
                      <p className="text-xs text-equestrian-stone-500 dark:text-equestrian-stone-400">{admin?.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-equestrian-stone-700 hover:bg-equestrian-stone-100 dark:text-equestrian-stone-200 dark:hover:bg-equestrian-stone-800"
                    >
                      <LogOut size={18} />
                      Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminAppLayout;
