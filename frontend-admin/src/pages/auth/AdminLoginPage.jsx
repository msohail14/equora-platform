import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import AppButton from '../../components/ui/AppButton';
import FormInput from '../../components/ui/FormInput';
import { clearAuthFeedback, loginAdmin } from '../../features/auth/authSlice';

const AdminLoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, message } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

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
    const result = await dispatch(loginAdmin(formData));
    if (loginAdmin.fulfilled.match(result)) {
      navigate('/admin/dashboard');
    }
  };

  const isLoading = status === 'loading';

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your admin account to continue.">
      <form onSubmit={onSubmit} className="space-y-4">
        <FormInput
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={onChange}
          placeholder="admin@company.com"
          required
        />

        <FormInput
          label="Password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          value={formData.password}
          onChange={onChange}
          placeholder="********"
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-xs font-semibold text-equestrian-green-600 hover:text-equestrian-green-700 dark:text-equestrian-green-400"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          }
          required
        />

        <div className="flex justify-end">
          <Link to="/admin/forgot-password" className="text-xs text-equestrian-green-600 hover:text-equestrian-green-700 dark:text-equestrian-green-400">
            Forgot password?
          </Link>
        </div>

        <AppButton type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Sign in'}
        </AppButton>
      </form>
    </AuthLayout>
  );
};

export default AdminLoginPage;
