import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { deleteCookie, getCookie, setCookie } from '../../lib/cookies';
import { AUTH_COOKIE_NAME } from '../../lib/axiosInstance';
import {
  changePasswordAdminApi,
  changeProfileAdminApi,
  forgotPasswordAdminApi,
  loginAdminApi,
  resendResetTokenAdminApi,
  resetPasswordAdminApi,
  signupAdminApi,
} from './authApi';

const ADMIN_STORAGE_KEY = 'hr_admin_profile';

const loadAdmin = () => {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const persistAdmin = (admin) => {
  if (admin) {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(admin));
  } else {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  }
};

const applyAuthPayload = (payload) => {
  const { admin, token } = payload;
  if (token) {
    setCookie(AUTH_COOKIE_NAME, token, { days: 7, sameSite: 'Strict' });
  }
  persistAdmin(admin || null);
  return { admin: admin || null, token: token || null };
};

export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  const token = getCookie(AUTH_COOKIE_NAME);
  const admin = loadAdmin();

  if (!token || !admin) {
    deleteCookie(AUTH_COOKIE_NAME);
    persistAdmin(null);
    return { admin: null, token: null };
  }

  return { admin, token };
});

export const signupAdmin = createAsyncThunk('auth/signup', async (payload) => {
  const data = await signupAdminApi(payload);
  return applyAuthPayload(data);
});

export const loginAdmin = createAsyncThunk('auth/login', async (payload) => {
  const data = await loginAdminApi(payload);
  return applyAuthPayload(data);
});

export const forgotAdminPassword = createAsyncThunk('auth/forgotPassword', async (payload) =>
  forgotPasswordAdminApi(payload)
);

export const resendAdminResetToken = createAsyncThunk('auth/resendResetToken', async (payload) =>
  resendResetTokenAdminApi(payload)
);

export const resetAdminPassword = createAsyncThunk('auth/resetPassword', async (payload) =>
  resetPasswordAdminApi(payload)
);

export const changeAdminPassword = createAsyncThunk('auth/changePassword', async (payload) =>
  changePasswordAdminApi(payload)
);

export const changeAdminProfile = createAsyncThunk('auth/changeProfile', async (payload) =>
  changeProfileAdminApi(payload)
);

const initialState = {
  admin: null,
  token: null,
  initialized: false,
  status: 'idle',
  actionStatus: 'idle',
  error: null,
  message: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthFeedback: (state) => {
      state.error = null;
      state.message = null;
      state.status = 'idle';
      state.actionStatus = 'idle';
    },
    logoutAdmin: (state) => {
      deleteCookie(AUTH_COOKIE_NAME);
      persistAdmin(null);
      state.admin = null;
      state.token = null;
      state.status = 'idle';
      state.actionStatus = 'idle';
      state.error = null;
      state.message = 'Logged out successfully.';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.admin = action.payload.admin;
        state.token = action.payload.token;
        state.initialized = true;
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.initialized = true;
      })
      .addCase(signupAdmin.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.message = null;
      })
      .addCase(signupAdmin.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.admin = action.payload.admin;
        state.token = action.payload.token;
        state.message = 'Admin account created successfully.';
      })
      .addCase(signupAdmin.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(loginAdmin.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.message = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.admin = action.payload.admin;
        state.token = action.payload.token;
        state.message = 'Logged in successfully.';
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(forgotAdminPassword.pending, (state) => {
        state.actionStatus = 'loading';
        state.error = null;
        state.message = null;
      })
      .addCase(forgotAdminPassword.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        state.message = action.payload.message || 'Password reset instructions sent.';
      })
      .addCase(forgotAdminPassword.rejected, (state, action) => {
        state.actionStatus = 'failed';
        state.error = action.error.message;
      })
      .addCase(resendAdminResetToken.pending, (state) => {
        state.actionStatus = 'loading';
        state.error = null;
      })
      .addCase(resendAdminResetToken.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        state.message = action.payload.message || 'Reset token resent.';
      })
      .addCase(resendAdminResetToken.rejected, (state, action) => {
        state.actionStatus = 'failed';
        state.error = action.error.message;
      })
      .addCase(resetAdminPassword.pending, (state) => {
        state.actionStatus = 'loading';
        state.error = null;
      })
      .addCase(resetAdminPassword.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        state.message = action.payload.message || 'Password reset successfully.';
      })
      .addCase(resetAdminPassword.rejected, (state, action) => {
        state.actionStatus = 'failed';
        state.error = action.error.message;
      })
      .addCase(changeAdminPassword.pending, (state) => {
        state.actionStatus = 'loading';
        state.error = null;
      })
      .addCase(changeAdminPassword.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        state.message = action.payload.message || 'Password changed successfully.';
      })
      .addCase(changeAdminPassword.rejected, (state, action) => {
        state.actionStatus = 'failed';
        state.error = action.error.message;
      })
      .addCase(changeAdminProfile.pending, (state) => {
        state.actionStatus = 'loading';
        state.error = null;
      })
      .addCase(changeAdminProfile.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        state.admin = action.payload.admin || state.admin;
        persistAdmin(state.admin);
        state.message = action.payload.message || 'Profile updated successfully.';
      })
      .addCase(changeAdminProfile.rejected, (state, action) => {
        state.actionStatus = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { clearAuthFeedback, logoutAdmin } = authSlice.actions;

export default authSlice.reducer;
