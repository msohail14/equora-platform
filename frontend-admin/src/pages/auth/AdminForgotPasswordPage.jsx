import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import AppButton from '../../components/ui/AppButton';
import FormInput from '../../components/ui/FormInput';
import {
  clearAuthFeedback,
  forgotAdminPassword,
  resendAdminResetToken,
} from '../../features/auth/authSlice';

const AdminForgotPasswordPage = () => {
  const dispatch = useDispatch();
  const { actionStatus, error, message } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');

  const isLoading = actionStatus === 'loading';

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (message) toast.success(message);
  }, [message]);

  const onSubmit = async (event) => {
    event.preventDefault();
    dispatch(clearAuthFeedback());
    await dispatch(forgotAdminPassword({ email }));
  };

  const _onResend = async () => {
    if (!email) {
      toast.error('Please enter email first.');
      return;
    }
    dispatch(clearAuthFeedback());
    await dispatch(resendAdminResetToken({ email }));
  };

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your admin email to receive reset instructions."
      footerLinks={[{ to: '/admin/login', label: 'Back to login' }]}
    >
      <form className="auth-form" onSubmit={onSubmit}>
        <FormInput
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => {
            dispatch(clearAuthFeedback());
            setEmail(event.target.value);
          }}
          placeholder="admin@company.com"
          autoComplete="email"
          required
        />

        <div className="flex mt-5 flex-wrap gap-2">
          <AppButton type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send reset email'}
          </AppButton>
          
        </div>
      </form>
    </AuthLayout>
  );
};

export default AdminForgotPasswordPage;
