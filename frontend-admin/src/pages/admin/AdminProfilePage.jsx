import { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { UserCircle, Lock } from 'lucide-react';
import AppButton from '../../components/ui/AppButton';
import FormInput from '../../components/ui/FormInput';
import axiosInstance from '../../lib/axiosInstance';

const AdminProfilePage = () => {
  const { admin } = useSelector((state) => state.auth);

  const [profileForm, setProfileForm] = useState({
    first_name: admin?.first_name || '',
    last_name: admin?.last_name || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await axiosInstance.put('/admin/change-profile', profileForm);
      toast.success('Profile updated successfully.');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    try {
      await axiosInstance.post('/admin/change-password', passwordForm);
      toast.success('Password changed successfully.');
      setPasswordForm({ current_password: '', new_password: '' });
    } catch (error) {
      toast.error(error.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-2">
          <UserCircle size={20} className="text-emerald-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium text-gray-900 dark:text-gray-100">Email:</span> {admin?.email || '-'}
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium text-gray-900 dark:text-gray-100">Role:</span> {admin?.role || 'Admin'}
          </p>
        </div>

        <form className="max-w-lg space-y-4" onSubmit={handleProfileSave}>
          <FormInput
            label="First Name"
            name="profile_first_name"
            value={profileForm.first_name}
            onChange={(e) => setProfileForm((p) => ({ ...p, first_name: e.target.value }))}
          />
          <FormInput
            label="Last Name"
            name="profile_last_name"
            value={profileForm.last_name}
            onChange={(e) => setProfileForm((p) => ({ ...p, last_name: e.target.value }))}
          />
          <AppButton type="submit" disabled={profileSaving}>
            {profileSaving ? 'Saving...' : 'Update Profile'}
          </AppButton>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-2">
          <Lock size={20} className="text-emerald-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Change Password</h2>
        </div>

        <form className="max-w-lg space-y-4" onSubmit={handlePasswordChange}>
          <FormInput
            label="Current Password"
            name="current_password"
            type="password"
            value={passwordForm.current_password}
            onChange={(e) => setPasswordForm((p) => ({ ...p, current_password: e.target.value }))}
            required
          />
          <FormInput
            label="New Password"
            name="new_password"
            type="password"
            value={passwordForm.new_password}
            onChange={(e) => setPasswordForm((p) => ({ ...p, new_password: e.target.value }))}
            required
          />
          <AppButton type="submit" disabled={passwordSaving}>
            {passwordSaving ? 'Changing...' : 'Change Password'}
          </AppButton>
        </form>
      </section>
    </div>
  );
};

export default AdminProfilePage;
