import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import AppButton from '../../components/ui/AppButton';
import FormInput from '../../components/ui/FormInput';
import { clearAuthFeedback, resetAdminPassword } from '../../features/auth/authSlice';

const AdminResetPasswordPage = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { actionStatus, error, message } = useSelector((state) => state.auth);

  const tokenFromQuery = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [formData, setFormData] = useState({ token: tokenFromQuery, new_password: '', confirmPassword: '' });

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (message) toast.success(message);
  }, [message]);

  const onChange = (event) => {
    dispatch(clearAuthFeedback());
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    dispatch(clearAuthFeedback());

    if (formData.new_password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    await dispatch(
      resetAdminPassword({
        token: formData.token,
        new_password: formData.new_password,
      })
    );
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="set a new password."
      footerLinks={[{ to: '/admin/login', label: 'Back to login' }]}
    >
      <form className="auth-form flex flex-col gap-4" onSubmit={onSubmit}>
        <FormInput
          label="New password"
          name="new_password"
          type="password"
          value={formData.new_password}
          onChange={onChange}
          autoComplete="new-password"
          required
        />

        <FormInput
          label="Confirm password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={onChange}
          autoComplete="new-password"
          required
        />

        <AppButton type="submit" disabled={actionStatus === 'loading'}>
          {actionStatus === 'loading' ? 'Resetting...' : 'Reset password'}
        </AppButton>
      </form>
    </AuthLayout>
  );
};

export default AdminResetPasswordPage;
