import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import AppButton from '../../components/ui/AppButton';
import FormInput from '../../components/ui/FormInput';
import { clearAuthFeedback, signupAdmin } from '../../features/auth/authSlice';

const AdminSignupPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, message } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });

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
    const result = await dispatch(signupAdmin(formData));
    if (signupAdmin.fulfilled.match(result)) {
      navigate('/admin/dashboard');
    }
  };

  return (
    <AuthLayout
      title="Create Admin Account"
      subtitle="Register and get instant access to admin dashboard."
      footerLinks={[{ to: '/admin/login', label: 'Back to login' }]}
    >
      <form className="auth-form" onSubmit={onSubmit}>
        <div className="grid-two">
          <FormInput
            label="First name"
            name="first_name"
            value={formData.first_name}
            onChange={onChange}
            autoComplete="given-name"
          />
          <FormInput
            label="Last name"
            name="last_name"
            value={formData.last_name}
            onChange={onChange}
            autoComplete="family-name"
          />
        </div>

        <FormInput
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={onChange}
          autoComplete="email"
          required
        />

        <FormInput
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={onChange}
          autoComplete="new-password"
          required
        />

        <AppButton type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Creating account...' : 'Create account'}
        </AppButton>
      </form>
    </AuthLayout>
  );
};

export default AdminSignupPage;
