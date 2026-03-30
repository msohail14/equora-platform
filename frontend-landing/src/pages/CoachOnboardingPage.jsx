import { useState, useRef, useCallback } from 'react';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../lib/firebase';
import { verifyFirebaseToken, bypassOtp, sendMagicLink, onboardCoach, setCredentials } from '../lib/api';
import PhoneInput from '../components/PhoneInput';

const APP_STORE_URL = '#';
const PLAY_STORE_URL = '#';
const STEPS = ['Account', 'Profile', 'Set Password', 'Get the App'];

const CoachOnboardingPage = () => {
  const [step, setStep] = useState(0);
  const [authMethod, setAuthMethod] = useState(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Profile
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [defaultDuration, setDefaultDuration] = useState('45');
  const [approvalMode, setApprovalMode] = useState('manual');
  const [coachType, setCoachType] = useState('freelancer');

  // Credentials
  const [credEmail, setCredEmail] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [credConfirm, setCredConfirm] = useState('');

  const recaptchaRef = useRef(null);

  const handleSendPhoneOtp = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
      const confirmation = await signInWithPhoneNumber(auth, phone, recaptchaRef.current);
      setVerificationId(confirmation);
      setAuthMethod('phone');
    } catch (e) {
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
        result = await bypassOtp({ phone, otp, role: 'coach', mode: 'signup' });
      } else {
        const credential = await verificationId.confirm(otp);
        const idToken = await credential.user.getIdToken();
        result = await verifyFirebaseToken({ idToken, role: 'coach', phone });
      }
      setToken(result.token);
      if (result.user?.first_name) setFirstName(result.user.first_name);
      if (result.user?.last_name) setLastName(result.user.last_name);
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
      await sendMagicLink({ email, purpose: 'signup', role: 'coach' });
      setAuthMethod('email_sent');
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to send magic link.');
    }
    setLoading(false);
  }, [email]);

  const handleSaveProfile = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      await onboardCoach(token, {
        bio: bio.trim() || undefined,
        defaultDuration: Number(defaultDuration) || 45,
        approvalMode,
        coachType,
      });
      setStep(2);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to save profile.');
    }
    setLoading(false);
  }, [token, bio, defaultDuration, approvalMode, coachType]);

  const handleSetCredentials = useCallback(async () => {
    if (!credEmail.trim() || !credPassword) {
      setError('Email and password are required.');
      return;
    }
    if (credPassword !== credConfirm) {
      setError('Passwords do not match.');
      return;
    }
    if (credPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await setCredentials(token, { email: credEmail.trim(), password: credPassword });
      setStep(3);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to set credentials.');
    }
    setLoading(false);
  }, [token, credEmail, credPassword, credConfirm]);

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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Join Equora as a Coach</h1>
            <p className="text-gray-600 mb-8">Create your account to manage your students, schedule, and bookings.</p>
            <div className="space-y-4">
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

              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Sign up with Email</h3>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="you@email.com"
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

        {/* Email sent */}
        {step === 0 && authMethod === 'email_sent' && (
          <div className="text-center">
            <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
            <p className="text-gray-600 mb-2">We sent a magic link to <strong>{email}</strong></p>
            <p className="text-sm text-gray-500">Click the link to complete your registration.</p>
            <button onClick={() => { setAuthMethod(null); setEmail(''); }} className="mt-6 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              Use a different method
            </button>
          </div>
        )}

        {/* Step 1: Profile Setup */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Set up your profile</h1>
            <p className="text-gray-600 mb-8">Tell riders about yourself. You can update this anytime.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell riders about your experience, specialties, and teaching style..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Session Duration</label>
                <select
                  value={defaultDuration}
                  onChange={(e) => setDefaultDuration(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Booking Approval</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setApprovalMode('manual')}
                    className={`rounded-lg border p-3 text-left text-sm transition ${approvalMode === 'manual' ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <span className="font-semibold text-gray-900">Manual</span>
                    <p className="text-xs text-gray-500 mt-0.5">Review and approve each booking</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalMode('auto')}
                    className={`rounded-lg border p-3 text-left text-sm transition ${approvalMode === 'auto' ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <span className="font-semibold text-gray-900">Auto-approve</span>
                    <p className="text-xs text-gray-500 mt-0.5">Bookings are confirmed instantly</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coach Type</label>
                <select
                  value={coachType}
                  onChange={(e) => setCoachType(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                >
                  <option value="freelancer">Freelancer</option>
                  <option value="stable_employed">Stable Employed</option>
                  <option value="independent">Independent</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="flex-1 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
              <button
                onClick={() => setStep(2)}
                className="rounded-lg bg-gray-100 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Done */}
        {/* Step 2: Set Password */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Set your login credentials</h1>
            <p className="text-gray-600 mb-8">Choose an email and password to log into the Equora app.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={credEmail}
                  onChange={(e) => setCredEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={credPassword}
                  onChange={(e) => setCredPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={credConfirm}
                  onChange={(e) => setCredConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button
                onClick={handleSetCredentials}
                disabled={loading}
                className="flex-1 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save & Continue'}
              </button>
              <button
                onClick={() => setStep(3)}
                className="rounded-lg bg-gray-100 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Download App */}
        {step === 3 && (
          <div className="text-center py-8">
            <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h1>
            <p className="text-gray-600 mb-8">Download the Equora app to manage your schedule, accept bookings, and track your earnings.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <a
                href={APP_STORE_URL}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-gray-800 transition"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                App Store
              </a>
              <a
                href={PLAY_STORE_URL}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-gray-800 transition"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.48c-.45-.29-.73-.77-.73-1.3V1.82c0-.53.28-1.01.73-1.3l11.07 11.48L3.18 23.48zm1.34-23.16L16.19 11 13.27 13.92 4.52.32zm16.54 10.13l-3.33 1.94-3.23-3.35 3.23-3.35 3.33 1.94c.95.55.95 2.27 0 2.82zm-4.67 2.72L13.27 16.1l-8.75 8.06 12.87-7.49z"/></svg>
                Google Play
              </a>
            </div>
            <p className="text-sm text-gray-500">Already have the app? Log in with the email and password you just set.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachOnboardingPage;
