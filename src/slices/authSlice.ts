import {createSlice} from '@reduxjs/toolkit';

export type Pending2FA = {
  loginSignId: string;
  availableMethods: any[];
  defaultMethod: number;
  data: any;
} | null;

export const initialState = {
  isLoading: false,
  /** 'otp' = Get OTP / Send OTP (don't show loader on primary buttons), 'primary' | null = show on buttons */
  loadingFor: null as 'primary' | 'otp' | null,
  userData: undefined,
  theme: 'Light',
  appVersion: '',
  /** When set, Login screen shows 2FA verification modals (web-style) instead of navigating to EnterOtp */
  pending2FA: null as Pending2FA,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, {payload}) => {
      state.isLoading = !!payload;
      state.loadingFor = payload ? 'primary' : null;
    },
    setLoadingOtp: (state, {payload}) => {
      state.isLoading = !!payload;
      state.loadingFor = payload ? 'otp' : null;
    },
    setUserData: (state, {payload}) => {
      state.userData = payload;
    },
    setTheme: (state, {payload}) => {
      state.theme = payload;
    },
    setAppVersion: (state, {payload}) => {
      state.appVersion = payload;
    },
    setPending2FA: (state, {payload}: {payload: Pending2FA}) => {
      state.pending2FA = payload;
    },
    clearPending2FA: (state) => {
      state.pending2FA = null;
    },
  },
});
export const {setLoading, setLoadingOtp, setUserData, setTheme, setAppVersion, setPending2FA, clearPending2FA} = authSlice.actions;
// export const authSelector = state => state.auth;
export const authReducer = authSlice.reducer;
