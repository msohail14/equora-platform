import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import AppButton from '../../components/ui/AppButton';
import FormInput from '../../components/ui/FormInput';
import PhoneInput from '../../components/ui/PhoneInput';
import PlacesAutocomplete from '../../components/ui/PlacesAutocomplete';
import { submitStableRegistrationApi } from '../../features/auth/authApi';

const AdminSignupPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    business_name: '',
    owner_first_name: '',
    owner_last_name: '',
    preferred_email: '',
    phone: '',
    city: '',
    country: '',
    description: '',
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceSelect = (place) => {
    setForm((prev) => ({
      ...prev,
      business_name: place.name || prev.business_name,
      city: place.city || prev.city,
      country: place.country || prev.country,
      phone: place.contact_phone || prev.phone,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.business_name || !form.owner_first_name || !form.owner_last_name || !form.preferred_email) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      await submitStableRegistrationApi(form);
      setSubmitted(true);
    } catch (err) {
      toast.error(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthLayout
        title="Application Submitted"
        subtitle="Thank you for registering your stable."
      >
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Your registration for <span className="font-semibold text-gray-900 dark:text-white">{form.business_name}</span> has been received.
            </p>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Our team will review your application and send your login credentials to <span className="font-semibold text-gray-900 dark:text-white">{form.preferred_email}</span> once approved.
            </p>
          </div>
          <Link
            to="/admin/login"
            className="inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
          >
            Back to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Register Your Stable"
      subtitle="Submit your business details and we'll set up your account."
      footerLinks={[{ to: '/admin/login', label: 'Already have an account? Sign in' }]}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <PlacesAutocomplete
          onSelect={handlePlaceSelect}
          placeholder="Search your stable on Google Maps..."
        />
        <p className="!mt-1 text-xs text-gray-500 dark:text-gray-400">
          Select from results to auto-fill, or enter details manually below.
        </p>

        <FormInput
          label="Stable / Business Name"
          name="business_name"
          value={form.business_name}
          onChange={onChange}
          placeholder="e.g. Royal Equestrian Club"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="Owner First Name"
            name="owner_first_name"
            value={form.owner_first_name}
            onChange={onChange}
            placeholder="First name"
            required
          />
          <FormInput
            label="Owner Last Name"
            name="owner_last_name"
            value={form.owner_last_name}
            onChange={onChange}
            placeholder="Last name"
            required
          />
        </div>

        <FormInput
          label="Preferred Sign-In Email"
          name="preferred_email"
          type="email"
          value={form.preferred_email}
          onChange={onChange}
          placeholder="owner@stablename.com"
          required
        />
        <p className="!mt-1 text-xs text-gray-500 dark:text-gray-400">
          This will be your login email once approved.
        </p>

        <PhoneInput
          label="Phone Number"
          name="phone"
          value={form.phone}
          onChange={(val) => setForm((p) => ({ ...p, phone: val }))}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="City"
            name="city"
            value={form.city}
            onChange={onChange}
            placeholder="e.g. Riyadh"
          />
          <FormInput
            label="Country"
            name="country"
            value={form.country}
            onChange={onChange}
            placeholder="e.g. Saudi Arabia"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            About Your Stable
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            rows={3}
            placeholder="Brief description of your stable, services offered, number of horses, etc."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-emerald-400"
          />
        </div>

        <AppButton type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Registration'}
        </AppButton>
      </form>
    </AuthLayout>
  );
};

export default AdminSignupPage;
