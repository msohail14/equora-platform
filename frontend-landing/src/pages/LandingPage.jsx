const ADMIN_URL = 'https://admin.equorariding.com';
const APP_STORE_URL = '#';
const PLAY_STORE_URL = '#';

// Placeholder images — replace with real photos later via /public/images/
const IMAGES = {
  hero: '/images/hero.jpg',
  stable: '/images/stable.jpg',
  coach: '/images/coach.jpg',
  rider: '/images/rider.jpg',
  stableValue: '/images/stable-value.jpg',
  cta: '/images/cta.jpg',
};

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">Equora</span>
            </a>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <a href="#for-stables" className="hover:text-emerald-600 transition">For Stables</a>
              <a href="#for-coaches" className="hover:text-emerald-600 transition">For Coaches</a>
              <a href="#for-riders" className="hover:text-emerald-600 transition">For Riders</a>
              <a href="#how-it-works" className="hover:text-emerald-600 transition">How It Works</a>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={`${ADMIN_URL}/admin/login`}
                className="hidden sm:inline-flex rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 transition"
              >
                Sign In
              </a>
              <a
                href="/onboarding/stable"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section — Full-width background */}
      <section className="relative min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-emerald-950 to-gray-900">
          <img
            src={IMAGES.hero}
            alt="Horse and rider"
            className="h-full w-full object-cover opacity-40"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/70 via-gray-900/50 to-transparent" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full bg-emerald-500/20 px-4 py-1.5 mb-6 backdrop-blur-sm border border-emerald-400/30">
              <span className="text-sm font-medium text-emerald-300">The equestrian management platform</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
              Run your stable.<br />
              Fill your sessions.<br />
              <span className="text-emerald-400">All in one platform.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-300 max-w-xl leading-relaxed">
              Booking, coaches, horses, and riders — finally connected. The modern way to manage equestrian operations.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <a
                href="/onboarding/stable"
                className="rounded-xl bg-emerald-500 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-emerald-400 transition text-center"
              >
                Get Started as a Stable
              </a>
              <a
                href="/onboarding/coach"
                className="rounded-xl bg-white/10 backdrop-blur-sm px-8 py-4 text-base font-semibold text-white shadow-lg ring-1 ring-white/20 hover:bg-white/20 transition text-center"
              >
                Join as a Coach
              </a>
              <a
                href="/onboarding/rider"
                className="rounded-xl bg-white/10 backdrop-blur-sm px-8 py-4 text-base font-semibold text-white shadow-lg ring-1 ring-white/20 hover:bg-white/20 transition text-center"
              >
                Join as a Rider
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Who is this for — Image cards */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Built for everyone</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">Who is Equora for?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <ImageCard
              id="for-stables"
              image={IMAGES.stable}
              title="Stables"
              description="Fill your schedule and manage everything — horses, coaches, bookings, and riders in one dashboard."
              cta="Get Started"
              ctaHref={`${ADMIN_URL}/admin/signup`}
            />
            <ImageCard
              id="for-coaches"
              image={IMAGES.coach}
              title="Coaches"
              description="Manage your students, grow your bookings, and control your availability across multiple stables."
              cta="Join Now"
              ctaHref={`${ADMIN_URL}/onboarding/coach`}
            />
            <ImageCard
              id="for-riders"
              image={IMAGES.rider}
              title="Riders"
              description="Book training sessions in seconds. Pick your coach, choose your time, and ride."
              cta="Download App"
              ctaHref={APP_STORE_URL}
            />
          </div>
        </div>
      </section>

      {/* Stable Value Section — Split layout with image */}
      <section className="py-24 bg-emerald-50 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">For Stable Owners</span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                Turn your stable into a fully booked operation
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Everything you need to run a modern equestrian facility. From scheduling to payments, we handle the complexity so you can focus on what matters.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  { text: 'Accept bookings automatically', sub: 'Riders book directly — no phone calls needed' },
                  { text: 'Manage horses & schedules', sub: 'Track availability, health, and sessions per horse' },
                  { text: 'Add your coaches', sub: 'Invite coaches and manage their schedules' },
                  { text: 'Track sessions in real time', sub: 'Live dashboard with today\'s bookings and stats' },
                  { text: 'Get discovered by new riders', sub: 'Appear in the Equora app for riders in your area' },
                ].map((item) => (
                  <li key={item.text} className="flex gap-4">
                    <span className="flex-shrink-0 mt-1 h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </span>
                    <div>
                      <span className="font-semibold text-gray-900">{item.text}</span>
                      <p className="text-sm text-gray-500 mt-0.5">{item.sub}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <a
                href="/onboarding/stable"
                className="mt-10 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-emerald-700 transition"
              >
                Create Stable Account
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-emerald-200 via-emerald-100 to-amber-100">
                <img
                  src={IMAGES.stableValue}
                  alt="Beautiful horse stable at sunset"
                  className="w-full h-[500px] object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 hidden lg:block">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">12 bookings today</p>
                    <p className="text-xs text-gray-500">All slots filled</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 bg-white rounded-xl shadow-lg p-4 hidden lg:block">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">4.9 rating</p>
                    <p className="text-xs text-gray-500">From 200+ riders</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Simple setup</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">Up and running in 3 steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <Step
              number="01"
              title="Create your stable"
              description="Sign up with your phone or email. Add your stable name, location, and basic info — takes under 2 minutes."
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                </svg>
              }
            />
            <Step
              number="02"
              title="Add coaches & horses"
              description="Invite your coaches by email or phone. Add your horses with a quick form. Set your weekly availability."
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              }
            />
            <Step
              number="03"
              title="Start receiving bookings"
              description="Riders discover your stable in the app and book sessions directly. You manage everything from one dashboard."
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* Final CTA — Full-width background */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-gray-900 to-gray-900">
          <img
            src={IMAGES.cta}
            alt="Horse riding at sunset"
            className="h-full w-full object-cover opacity-30"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gray-900/50" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-white leading-tight">Ready to transform your equestrian business?</h2>
          <p className="mt-6 text-lg text-gray-300">
            Join stables and coaches already using Equora to fill their schedules and grow their business.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/onboarding/stable"
              className="w-full sm:w-auto rounded-xl bg-emerald-500 px-10 py-4 text-lg font-semibold text-white shadow-lg hover:bg-emerald-400 transition"
            >
              Start your stable today
            </a>
            <a
              href="/onboarding/coach"
              className="w-full sm:w-auto rounded-xl bg-white/10 backdrop-blur-sm px-10 py-4 text-lg font-semibold text-white shadow-lg ring-1 ring-white/25 hover:bg-white/20 transition"
            >
              Join as a coach
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                <span className="text-2xl font-bold text-white">Equora</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                The modern equestrian management platform. Connecting stables, coaches, and riders in one seamless experience.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Platform</h4>
              <ul className="space-y-3">
                <li><a href="/onboarding/stable" className="text-sm text-gray-400 hover:text-emerald-400 transition">For Stables</a></li>
                <li><a href="/onboarding/coach" className="text-sm text-gray-400 hover:text-emerald-400 transition">For Coaches</a></li>
                <li><a href="/onboarding/rider" className="text-sm text-gray-400 hover:text-emerald-400 transition">For Riders</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Account</h4>
              <ul className="space-y-3">
                <li><a href={`${ADMIN_URL}/admin/login`} className="text-sm text-gray-400 hover:text-emerald-400 transition">Admin Login</a></li>
                <li><a href="/onboarding/stable" className="text-sm text-gray-400 hover:text-emerald-400 transition">Create Account</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Equora. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-400 transition">Privacy Policy</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-400 transition">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const CARD_GRADIENTS = {
  Stables: 'from-emerald-200 to-emerald-400',
  Coaches: 'from-sky-200 to-sky-400',
  Riders: 'from-amber-200 to-amber-400',
};

const CARD_ICONS = {
  Stables: (
    <svg className="h-16 w-16 text-white/80" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  ),
  Coaches: (
    <svg className="h-16 w-16 text-white/80" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  ),
  Riders: (
    <svg className="h-16 w-16 text-white/80" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  ),
};

const ImageCard = ({ id, image, title, description, cta, ctaHref }) => (
  <div id={id} className="group rounded-2xl overflow-hidden bg-white shadow-md ring-1 ring-gray-100 hover:shadow-xl transition-all duration-300">
    <div className={`h-56 overflow-hidden bg-gradient-to-br ${CARD_GRADIENTS[title] || 'from-gray-200 to-gray-400'} flex items-center justify-center relative`}>
      <img
        src={image}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        onError={(e) => { e.target.style.display = 'none'; }}
      />
      {CARD_ICONS[title] || null}
    </div>
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed mb-4">{description}</p>
      <a
        href={ctaHref}
        className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition"
      >
        {cta}
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </a>
    </div>
  </div>
);

const Step = ({ number, title, description, icon }) => (
  <div className="relative">
    <div className="flex items-center gap-4 mb-4">
      <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <span className="text-5xl font-bold text-gray-100">{number}</span>
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;
