import { useState, useRef, useCallback } from 'react';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../lib/firebase';
import { verifyFirebaseToken, bypassOtp, sendMagicLink, onboardStable, stableSetupWizard } from '../lib/api';
import PhoneInput from '../components/PhoneInput';
import PlacesAutocomplete from '../components/PlacesAutocomplete';

const ADMIN_URL = 'https://admin.equorariding.com';
const STEPS = ['Account', 'Stable Info', 'Setup', 'Done'];

const StableOnboardingPage = () => {
  const [step, setStep] = useState(0);
  const [authMethod, setAuthMethod] = useState(null); // 'phone' | 'email'
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stableId, setStableId] = useState(null);

  // Stable info
  const [stableName, setStableName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [description, setDescription] = useState('');

  // Setup wizard
  const [coachEmails, setCoachEmails] = useState('');
  const [horses, setHorses] = useState([{ name: '', breed: '' }]);

  const recaptchaRef = useRef(null);

  const handleSendPhoneOtp = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      // Try Firebase first
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
      const confirmation = await signInWithPhoneNumber(auth, phone, recaptchaRef.current);
      setVerificationId(confirmation);
      setAuthMethod('phone');
    } catch (e) {
      // Firebase billing not active — use bypass mode
      console.warn('Firebase phone auth not available, using bypass mode');
      setVerificationId('bypass');
      setAuthMethod('phone');
    }
    setLoading(false);
  }, [phone]);

  const handleVerifyPhoneOtp = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      let result;
      if (verificationId === 'bypass') {
        // Bypass mode
        result = await bypassOtp({ phone, otp, role: 'stable_owner', mode: 'signup' });
      } else {
        // Real Firebase
        const credential = await verificationId.confirm(otp);
        const idToken = await credential.user.getIdToken();
        result = await verifyFirebaseToken({ idToken, role: 'stable_owner', phone });
      }
      setToken(result.token);
      setUser(result.user);
      setContactPhone(phone);
      if (result.user?.email) setContactEmail(result.user.email);
      setStep(1);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Invalid OTP code.');
    }
    setLoading(false);
  }, [verificationId, otp, phone]);

  const handleSendMagicLink = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      await sendMagicLink({ email, purpose: 'signup', role: 'stable_owner' });
      setAuthMethod('email_sent');
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to send magic link.');
    }
    setLoading(false);
  }, [email]);

  const handleCreateStable = useCallback(async () => {
    if (!stableName.trim()) { setError('Stable name is required.'); return; }
    setError('');
    setLoading(true);
    try {
      const result = await onboardStable(token, {
        stableName: stableName.trim(),
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        description: description.trim() || undefined,
      });
      setStableId(result.stable?.id);
      setStep(2);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to create stable.');
    }
    setLoading(false);
  }, [token, stableName, city, country, contactPhone, contactEmail, description]);

  const handleSetupWizard = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const coaches = coachEmails
        .split(/[,\n]/)
        .map(e => e.trim())
        .filter(Boolean)
        .map(e => (e.includes('@') ? { email: e } : { phone: e }));

      const validHorses = horses.filter(h => h.name.trim());

      await stableSetupWizard(token, {
        stableId,
        coaches: coaches.length > 0 ? coaches : undefined,
        horses: validHorses.length > 0 ? validHorses : undefined,
      });
      setStep(3);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Setup failed.');
    }
    setLoading(false);
  }, [token, stableId, coachEmails, horses]);

  const addHorse = () => setHorses([...horses, { name: '', breed: '' }]);
  const updateHorse = (i, field, value) => {
    const updated = [...horses];
    updated[i][field] = value;
    setHorses(updated);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-100 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">Equora</span>
            </a>
            <a href={`${ADMIN_URL}/admin/login`} className="text-sm text-gray-500 hover:text-emerald-600">
              Already have an account? Sign in
            </a>
          </div>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i < step ? 'bg-emerald-600 text-white' :
                  i === step ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-600' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`hidden sm:inline text-sm font-medium ${i <= step ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${((step) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-xl px-4 py-12">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step 0: Account Creation */}
        {step === 0 && !authMethod && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Get Started as a Stable</h1>
            <p className="text-gray-600 mb-8">Create your account to start managing your stable on Equora.</p>

            <div className="space-y-4">
              {/* Phone option */}
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Sign up with Phone</h3>
                <PhoneInput value={phone} onChange={setPhone} disabled={loading} />
                <button
                  onClick={handleSendPhoneOtp}
                  disabled={phone.length < 10 || loading}
                  className="mt-3 w-full rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
                <div id="recaptcha-container" />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center"><span className="bg-gray-50 px-4 text-sm text-gray-400">or</span></div>
              </div>

              {/* Email option */}
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Sign up with Email</h3>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="you@stable.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    onClick={handleSendMagicLink}
                    disabled={!email.trim() || loading}
                    className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Link'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phone OTP verification */}
        {step === 0 && authMethod === 'phone' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify your phone</h1>
            <p className="text-gray-600 mb-8">Enter the 6-digit code sent to <strong>{phone}</strong></p>
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <button
              onClick={handleVerifyPhoneOtp}
              disabled={otp.length !== 6 || loading}
              className="w-full rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <button onClick={() => { setAuthMethod(null); setVerificationId(null); setOtp(''); }} className="mt-4 w-full text-sm text-gray-500 hover:text-emerald-600">
              Use a different method
            </button>
          </div>
        )}

        {/* Email magic link sent */}
        {step === 0 && authMethod === 'email_sent' && (
          <div className="text-center">
            <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
            <p className="text-gray-600 mb-2">We sent a magic link to <strong>{email}</strong></p>
            <p className="text-sm text-gray-500">Click the link in the email to complete your registration and set up your stable.</p>
            <button onClick={() => { setAuthMethod(null); setEmail(''); }} className="mt-6 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              Use a different method
            </button>
          </div>
        )}

        {/* Step 1: Stable Info */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Set up your stable</h1>
            <p className="text-gray-600 mb-8">Tell us about your stable. You can always update this later.</p>
            <div className="space-y-4">
              <Field label="Stable Name *" value={stableName} onChange={setStableName} placeholder="e.g. Desert Riders Stable" />
              <PlacesAutocomplete
                label="Location"
                value={locationQuery}
                onChange={setLocationQuery}
                placeholder="Search for your city..."
                onPlaceSelect={({ city: c, country: co }) => {
                  setCity(c);
                  setCountry(co);
                  setLocationQuery(`${c}${co ? ', ' + co : ''}`);
                }}
              />
              <div className="grid grid-cols-2 gap-4">
                <Field label="City" value={city} onChange={setCity} placeholder="Riyadh" />
                <Field label="Country" value={country} onChange={setCountry} placeholder="Saudi Arabia" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Contact Phone" value={contactPhone} onChange={setContactPhone} placeholder="+966..." />
                <Field label="Contact Email" value={contactEmail} onChange={setContactEmail} placeholder="info@stable.com" type="email" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell riders about your stable..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                />
              </div>
            </div>
            <button
              onClick={handleCreateStable}
              disabled={loading}
              className="mt-8 w-full rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Stable'}
            </button>
          </div>
        )}

        {/* Step 2: Setup Wizard */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Quick setup</h1>
            <p className="text-gray-600 mb-8">Add your coaches and horses. You can skip this and do it later from your dashboard.</p>

            {/* Invite coaches */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">Invite Coaches</h3>
              <p className="text-sm text-gray-500 mb-3">Enter email addresses or phone numbers, separated by commas.</p>
              <textarea
                value={coachEmails}
                onChange={(e) => setCoachEmails(e.target.value)}
                placeholder="coach@email.com, +966512345678"
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
              />
            </div>

            {/* Add horses */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">Add Horses</h3>
              <div className="space-y-3">
                {horses.map((horse, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      placeholder="Horse name"
                      value={horse.name}
                      onChange={(e) => updateHorse(i, 'name', e.target.value)}
                      className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <input
                      placeholder="Breed (optional)"
                      value={horse.breed}
                      onChange={(e) => updateHorse(i, 'breed', e.target.value)}
                      className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                ))}
              </div>
              <button onClick={addHorse} className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                + Add another horse
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSetupWizard}
                disabled={loading}
                className="flex-1 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save & Continue'}
              </button>
              <button
                onClick={() => setStep(3)}
                className="rounded-lg bg-gray-100 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="text-center py-8">
            <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your stable is ready!</h1>
            <p className="text-gray-600 mb-8">Head to your dashboard to complete your setup and start receiving bookings.</p>
            <a
              href={`${ADMIN_URL}/admin/login`}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-10 py-4 text-base font-semibold text-white shadow-lg hover:bg-emerald-700 transition"
            >
              Go to Dashboard
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
    />
  </div>
);

export default StableOnboardingPage;
