import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { onboardStableApi, stableSetupWizardApi, sendInvitationApi } from '../../features/operations/operationsApi';
import AppButton from '../../components/ui/AppButton';
import PhoneInput from '../../components/ui/PhoneInput';

const STEPS = ['Stable Info', 'Add Coaches', 'Add Horses', 'Done'];

const AdminOnboardingPage = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stableId, setStableId] = useState(null);

  // Stable info
  const [stableName, setStableName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [description, setDescription] = useState('');

  // Coaches
  const [coachContact, setCoachContact] = useState('');
  const [invitations, setInvitations] = useState([]);

  // Horses
  const [horses, setHorses] = useState([{ name: '', breed: '' }]);

  const handleCreateStable = useCallback(async () => {
    if (!stableName.trim()) { toast.error('Stable name is required.'); return; }
    setLoading(true);
    try {
      const result = await onboardStableApi({
        stableName: stableName.trim(),
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        description: description.trim() || undefined,
      });
      setStableId(result.stable?.id);
      toast.success('Stable created successfully!');
      setStep(1);
    } catch (e) {
      toast.error(e.message || 'Failed to create stable.');
    }
    setLoading(false);
  }, [stableName, city, country, contactPhone, contactEmail, description]);

  const handleInviteCoach = useCallback(async () => {
    if (!coachContact.trim() || !stableId) return;
    setLoading(true);
    try {
      const isEmail = coachContact.includes('@');
      await sendInvitationApi({
        stableId,
        ...(isEmail ? { email: coachContact.trim() } : { phone: coachContact.trim() }),
      });
      setInvitations([...invitations, { contact: coachContact.trim(), status: 'sent' }]);
      setCoachContact('');
      toast.success('Invitation sent!');
    } catch (e) {
      toast.error(e.message || 'Failed to send invitation.');
    }
    setLoading(false);
  }, [coachContact, stableId, invitations]);

  const handleAddHorses = useCallback(async () => {
    const validHorses = horses.filter(h => h.name.trim());
    if (validHorses.length === 0) { setStep(3); return; }
    setLoading(true);
    try {
      await stableSetupWizardApi({ stableId, horses: validHorses });
      toast.success(`${validHorses.length} horse(s) added!`);
      setStep(3);
    } catch (e) {
      toast.error(e.message || 'Failed to add horses.');
    }
    setLoading(false);
  }, [stableId, horses]);

  const addHorse = () => setHorses([...horses, { name: '', breed: '' }]);
  const updateHorse = (i, field, value) => {
    const updated = [...horses];
    updated[i][field] = value;
    setHorses(updated);
  };

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Stable Onboarding</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Create a new stable and set it up step by step.</p>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
              i < step ? 'bg-emerald-600 text-white' :
              i === step ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500 dark:bg-emerald-900 dark:text-emerald-300' :
              'bg-gray-100 text-gray-400 dark:bg-gray-800'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`hidden sm:inline text-xs font-medium ${i <= step ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="hidden sm:block w-8 h-px bg-gray-200 dark:bg-gray-700" />}
          </div>
        ))}
      </div>

      {/* Step 0: Stable Info */}
      {step === 0 && (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <Field label="Stable Name *" value={stableName} onChange={setStableName} placeholder="e.g. Desert Riders Stable" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="City" value={city} onChange={setCity} placeholder="Riyadh" />
            <Field label="Country" value={country} onChange={setCountry} placeholder="Saudi Arabia" />
          </div>
          <PhoneInput label="Phone" value={contactPhone} onChange={setContactPhone} />
          <Field label="Email" value={contactEmail} onChange={setContactEmail} placeholder="info@stable.com" />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell riders about your stable..."
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <AppButton onClick={handleCreateStable} disabled={loading}>
            {loading ? 'Creating...' : 'Create Stable'}
          </AppButton>
        </div>
      )}

      {/* Step 1: Invite Coaches */}
      {step === 1 && (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="font-semibold text-gray-900 dark:text-white">Invite Coaches</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Enter an email or phone number to send an invitation.</p>
          <div className="flex gap-2">
            <input
              value={coachContact}
              onChange={(e) => setCoachContact(e.target.value)}
              placeholder="coach@email.com or +966..."
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <AppButton onClick={handleInviteCoach} disabled={loading || !coachContact.trim()}>
              {loading ? 'Sending...' : 'Invite'}
            </AppButton>
          </div>
          {invitations.length > 0 && (
            <ul className="space-y-2 mt-4">
              {invitations.map((inv, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800">
                  <span className="text-gray-700 dark:text-gray-300">{inv.contact}</span>
                  <span className="text-xs text-emerald-600 font-medium">Sent</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2 mt-4">
            <AppButton onClick={() => setStep(2)}>Next: Add Horses</AppButton>
            <AppButton variant="secondary" onClick={() => setStep(2)}>Skip</AppButton>
          </div>
        </div>
      )}

      {/* Step 2: Add Horses */}
      {step === 2 && (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="font-semibold text-gray-900 dark:text-white">Add Horses</h3>
          <div className="space-y-3">
            {horses.map((horse, i) => (
              <div key={i} className="flex gap-2">
                <input
                  placeholder="Horse name"
                  value={horse.name}
                  onChange={(e) => updateHorse(i, 'name', e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
                <input
                  placeholder="Breed (optional)"
                  value={horse.breed}
                  onChange={(e) => updateHorse(i, 'breed', e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            ))}
          </div>
          <button onClick={addHorse} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            + Add another horse
          </button>
          <div className="flex gap-2 mt-4">
            <AppButton onClick={handleAddHorses} disabled={loading}>
              {loading ? 'Saving...' : 'Save & Finish'}
            </AppButton>
            <AppButton variant="secondary" onClick={() => setStep(3)}>Skip</AppButton>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 3 && (
        <div className="text-center py-8 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Stable is ready!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">You can now manage it from the stables page.</p>
          <AppButton onClick={() => window.location.href = '/admin/stables'}>
            Go to Stables
          </AppButton>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
    />
  </div>
);

export default AdminOnboardingPage;
