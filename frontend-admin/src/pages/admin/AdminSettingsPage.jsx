import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Settings } from 'lucide-react';
import AppButton from '../../components/ui/AppButton';
import FormInput from '../../components/ui/FormInput';
import { getAdminSettingsApi, updateAdminSettingsApi } from '../../features/operations/operationsApi';

const emptySettings = {
  platform_fee_percent: '',
  commission_rate_percent: '',
};

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const data = await getAdminSettingsApi();
        setSettings({
          platform_fee_percent: data?.platform_fee_percent ?? data?.data?.platform_fee_percent ?? '',
          commission_rate_percent: data?.commission_rate_percent ?? data?.data?.commission_rate_percent ?? '',
        });
      } catch (error) {
        toast.error(error.message || 'Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateAdminSettingsApi({
        platform_fee_percent: Number(settings.platform_fee_percent),
        commission_rate_percent: Number(settings.commission_rate_percent),
      });
      toast.success('Settings saved successfully.');
    } catch (error) {
      toast.error(error.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-6 flex items-center gap-2">
        <Settings size={20} className="text-emerald-500" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Platform Settings</h2>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading settings...</p>
      ) : (
        <form className="max-w-lg space-y-6" onSubmit={handleSave}>
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Platform Fees
            </h3>
            <FormInput
              label="Platform Fee (%)"
              name="platform_fee_percent"
              type="number"
              placeholder="e.g. 5"
              value={settings.platform_fee_percent}
              onChange={(e) => setSettings((p) => ({ ...p, platform_fee_percent: e.target.value }))}
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Commission Rates
            </h3>
            <FormInput
              label="Commission Rate (%)"
              name="commission_rate_percent"
              type="number"
              placeholder="e.g. 10"
              value={settings.commission_rate_percent}
              onChange={(e) => setSettings((p) => ({ ...p, commission_rate_percent: e.target.value }))}
            />
          </div>

          <AppButton type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </AppButton>
        </form>
      )}
    </section>
  );
};

export default AdminSettingsPage;
