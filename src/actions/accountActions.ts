import {ACCOUNT_SCREEN, KYC_STATUS_SCREEN, LOGIN_SCREEN} from './../navigation/routes';
import {appOperation} from '../appOperation';
import {logger, showError, showSuccess} from '../helper/logger';
import {
  AlertsProps,
  ChangePasswordProps,
  CurrencyPreferenceProps,
  DownloadTradeReportProps,
  RatingProps,
} from '../helper/types';
import NavigationService from '../navigation/NavigationService';
import {
  NAVIGATION_AUTH_STACK,
  NAVIGATION_BOTTOM_TAB_STACK,
  TWO_FACTOR_QR_SCREEN,
} from '../navigation/routes';
import {setKycData, setUserBankData} from '../slices/accountSlice';
import {setLoading, setLoadingOtp, setUserData} from '../slices/authSlice';
import {
  setCurrency,
  setFlatInvestments,
  setPayoutHistory,
  setReferCode,
  setReferCount,
  setTreeRoot,
  setTwoFaData,
  setUserTickets,
} from '../slices/homeSlice';
import {AppDispatch} from '../store/store';
import {logoutAction} from './authActions';
import {getUserPortfolio, getUserPortfolioArbitrage, getUserPortfolioEarning, getUserPortfolioMain, getUserPortfolioSpot, getUserPortfolioSwap} from './walletActions';
import { Alert } from 'react-native';
import { getReferralList } from './homeActions';
import { Passkey } from 'react-native-passkey';
import { PASSKEY_RP_ID } from '../helper/Constants';

const toBase64URL = (str: string) =>
  str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');


/** Same as web /account-verification: calls verify-registration-token to get signId, registeredBy for OTP step */
export const registerVerifyToken =
  (setData = (data: any) => {}) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.customer.verify_token();
      if (response?.success) {
        // showError(response?.message);
        setData(response?.data);
        // NavigationService.navigate(LOGIN_SCREEN);
      } else {
        showError(response?.message);
      }
    } catch (e) {
      logger(e);
      dispatch(setLoading(false));
    } finally {
      dispatch(setLoading(false));
    }
  };


export const getUserProfile =
  (isNavigate = false, isHome = false, skipGlobalLoading = false) =>
  async (dispatch: AppDispatch) => {
    try {
      if (!skipGlobalLoading) {
        dispatch(setLoading(true));
      }
      const response: any = await appOperation.customer.get_profile();
      if (response?.success) {
        dispatch(setUserData(response?.data));
        dispatch(setCurrency(response?.data?.currency_prefrence));
        isNavigate ? NavigationService.goBack() : null;
        isHome ? NavigationService.reset(NAVIGATION_BOTTOM_TAB_STACK) : null;
      } else if (!response?.success || response?.code === 401) {
        NavigationService.reset(NAVIGATION_AUTH_STACK);
      }
      //  else {
      //   NavigationService.reset(NAVIGATION_AUTH_STACK);
      // }
    } catch (e) {
      logger(e);
      // if (e?.code === 401 || e?.code === 403) {
      NavigationService.reset(NAVIGATION_AUTH_STACK);
      
      // }
    } finally {
      if (!skipGlobalLoading) {
        dispatch(setLoading(false));
      }
    }
  };

/**
 * After signup OTP verification: load profile and enter main app without sending user to Login.
 * On failure navigates to Login only (no full auth-stack reset).
 */
export const enterMainAppAfterSignup =
  () => async (dispatch: AppDispatch) => {
    try {
      const response: any = await appOperation.customer.get_profile();
      if (response?.success) {
        dispatch(setUserData(response?.data));
        dispatch(setCurrency(response?.data?.currency_prefrence));
        NavigationService.resetToMainApp(NAVIGATION_BOTTOM_TAB_STACK);
        return { ok: true as const };
      }
      NavigationService.navigate(NAVIGATION_AUTH_STACK, { screen: LOGIN_SCREEN });
      return { ok: false as const };
    } catch (e) {
      logger(e);
      NavigationService.navigate(NAVIGATION_AUTH_STACK, { screen: LOGIN_SCREEN });
      return { ok: false as const };
    }
  };

  
  export const editUserAvatar =
  (data: FormData) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.customer.edit_avatar(data);
      // console.log('res:::', response);
      if (response?.success) {
        showSuccess(response?.message || "Profile picture updated successfully");
        dispatch(getUserProfile(false));
      } else {
        showError(response?.message || "Failed to update profile picture");
      }
    } catch (e) {
      
      showError(e?.message);

      logger(e);
    } finally {
      dispatch(setLoading(false));
    }
  };

  export const editEmail =
  (data: any, onCloseEmail =()=>{}) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.customer.edit_email(data);
      // console.log('res:::', response);
      if (response?.success) {
        showSuccess(response?.message || "Update successful");
        dispatch(getUserProfile(false));
        onCloseEmail();
      } else {
        showError(response?.message || "Failed to update");
      }
    } catch (e) {
      
      showError(e?.message);

      logger(e);
    } finally {
      dispatch(setLoading(false));
    }
  };
  

  export const editPhone =
  (data: any, onCloseEmail =()=>{}) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.customer.edit_phone(data);
      // console.log('res:::', response);
      if (response?.success) {
        showSuccess(response?.message || "Update successful");
        dispatch(getUserProfile(false));
        onCloseEmail();
      } else {
        showError(response?.message || "Failed to update");
      }
    } catch (e) {
      
      showError(e?.message);

      logger(e);
    } finally {
      dispatch(setLoading(false));
    }
  };
  

  export const editName =
  (data: any, onCloseEmail =()=>{}) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.customer.edit_name(data);
      // console.log('res:::', response);
      if (response?.success) {
        showSuccess(response?.message || "Update successful");
        dispatch(getUserProfile(false));
        onCloseEmail();
      } else {
        showError(response?.message || "Failed to update");
      }
    } catch (e) {
      
      showError(e?.message);

      logger(e);
    } finally {
      dispatch(setLoading(false));
    }
  };

  

  export const editNominee =
  (data: any, onCloseEmail =()=>{}) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.customer.edit_nominee(data);
      // console.log('res:::', response);
      if (response?.success) {
        showSuccess(response?.message || "Update successful");
        dispatch(getUserProfile(false));
        onCloseEmail();
      } else {
        showError(response?.message || "Failed to update");
      }
    } catch (e) {
      
      showError(e?.message);

      logger(e);
    } finally {
      dispatch(setLoading(false));
    }
  };

export const editUserProfile =
  (data: FormData) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.customer.edit_profile(data);
      // console.log('res:::', response);
      if (response?.success) {
        showError(response?.message);
        dispatch(getUserProfile(true));
      } else {
        showError(response?.message);
      }
    } catch (e) {
      
      showError(e?.message);

      logger(e);
    } finally {
      dispatch(setLoading(false));
    }
  };
export const changePassword =
  (data: ChangePasswordProps) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.customer.change_password(data);

      if (response?.success) {
        showSuccess(response?.message || 'Password changed successfully.');
        return true;
      } else {
        showError(response?.message || 'Failed to change password');
        return false;
      }
    } catch (e: any) {
      logger(e);
      showError(e?.message || 'Something went wrong');
      return false;
    } finally {
      dispatch(setLoading(false));
    }
  };

export const changeCurrencyPreference =
  (data: CurrencyPreferenceProps) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      const response: any = await appOperation.customer.change_currency(data);
      if (response?.success) {
        showSuccess(response?.message || "Currency preference updated successfully");
        dispatch(getUserProfile());
        dispatch(getUserPortfolio(""));
        dispatch(getUserPortfolioMain("main"));
        dispatch(getUserPortfolioSpot("spot"));
        dispatch(getUserPortfolioSwap("swap"));
        dispatch(getUserPortfolioEarning("earning"));
        dispatch(getUserPortfolioArbitrage("arbitrage"));
      } else {
        showError(response?.message || "Failed to update currency preference");
      }
    } catch (e: any) {
      logger(e);
      showError(e?.message || "Something went wrong while updating currency");
    } finally {
      dispatch(setLoading(false));
    }
  };
/** Same as web: GET user/kyc-status - returns id_document_status, tax_document_status, selfie_status, needs_resubmission, documents_needing_resubmission, kyc_data */
export const getKycStatus = () => async () => {
  try {
    const response: any = await appOperation.customer.get_kyc_status();
    return response?.success ? response?.data : null;
  } catch (e) {
    logger(e);
    return null;
  }
};

/** Same as web: GET api/meta/countries - list of { code, name, flag } */
export const getCountries = () => async () => {
  try {
    const response: any = await appOperation.customer.get_countries();
    const raw = response?.success ? response?.data : response;
    const list = Array.isArray(raw) ? raw : (raw?.countries ? raw.countries : []);
    return (list || []).map((c: any) => ({
      code: c.code || c.iso2 || c.alpha2 || c.value,
      name: c.name || c.country_name || c.label || c.value,
      flag: c.flag || c.emoji || '',
    }));
  } catch (e) {
    logger(e);
    return [];
  }
};

/** Same as web: GET api/kyc/config/:countryCode - returns id_documents, tax_documents (min, max, regex, requires_back_image) */
export const getKycConfig = (countryCode: string) => async () => {
  try {
    const response: any = await appOperation.customer.get_kyc_config(countryCode);
    if (response?.success && response?.data) return response.data;
    if (response?.id_documents) return response;
    return null;
  } catch (e) {
    logger(e);
    return null;
  }
};

export const createKycSession = (userDetails: any) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const cc = userDetails?.country_code || userDetails?.countryCode;
    const mobile = userDetails?.mobileNumber || userDetails?.phoneNumber || userDetails?.phone;
    const phone = mobile ? `${cc ? String(cc).replace(/\s/g, "") : ""}${String(mobile).replace(/\s/g, "")}` : undefined;
    const body = {
      jurisdiction: "GLOBAL",
      ...(userDetails?.email ? { email: String(userDetails.email) } : {}),
      ...(phone && phone.length > 4 ? { phone } : {}),
      ...(userDetails?.firstName ? { firstName: String(userDetails.firstName) } : {}),
      ...(userDetails?.lastName ? { lastName: String(userDetails.lastName) } : {}),
    };

    const response: any = await appOperation.customer.create_kyc_session(body);
    if (response?.success) {
      return response?.data;
    } else {
      showError(response?.message || 'Failed to start verification');
      return null;
    }
  } catch (e: any) {
    logger(e);
    showError(e?.message || 'Something went wrong');
    return null;
  } finally {
    dispatch(setLoading(false));
  }
};

export const kycVerification = (data: any) => async (dispatch: AppDispatch) => {
  const isResubmission = !!(data && typeof (data as any).get === 'function' && (data as any).get('is_resubmission') === 'true');
  try {
    if (isResubmission) dispatch(setLoadingOtp(true));
    else dispatch(setLoading(true));
    console.log('[KYC API] Request: submit-kyc (FormData)');
    const response: any = await appOperation.customer.kyc_verification(data);
    const resLog = { success: response?.success, message: response?.message, code: response?.code };
    console.log('[KYC API] Response success:', response?.success);
    console.log('[KYC API] Response message:', response?.message);
    console.log('[KYC API] Response full:', JSON.stringify(resLog));
    console.log('[KYC API] Response body (full):', JSON.stringify(response, null, 2));
    if (response?.success) {
      showSuccess(response?.message || 'KYC submitted successfully');
      dispatch(getUserProfile());
      dispatch(setKycData({}));
      NavigationService.navigate(KYC_STATUS_SCREEN);
    } else {
      const errMsg = response?.message || 'Failed to submit KYC';
      console.warn('[KYC API] Showing error toast:', errMsg);
      showError(errMsg);
    }
    return response;
  } catch (e: any) {
    const errMsg = e?.message ?? (typeof e?.data === 'string' ? e?.data : JSON.stringify(e?.data || e));
    console.warn('[KYC API] Error (catch):', errMsg);
    console.warn('[KYC API] Error code:', e?.code);
    console.warn('[KYC API] Error full:', e);
    logger(e);
    showError(errMsg || 'An error occurred while submitting KYC');
    throw e;
  } finally {
    if (isResubmission) dispatch(setLoadingOtp(false));
    else dispatch(setLoading(false));
  }
};

export const setPriceAlert =
  (data: AlertsProps) => async (dispatch: AppDispatch) => {
    try {
      const response: any = await appOperation.customer.price_alert(data);
      // console.log('res:::', response);
      if (response.success) {
        dispatch(getUserProfile());
      }
    } catch (e) {
      logger(e);
    }
  };
export const setCommissionAlert =
  (data: AlertsProps) => async (dispatch: AppDispatch) => {
    try {
      const response: any = await appOperation.customer.commission_alert(data);
      // console.log('res:::', response);
      if (response.success) {
        dispatch(getUserProfile());
      }
    } catch (e) {
      logger(e);
    }
  };
export const setTradeSetting =
  (data: AlertsProps) => async (dispatch: AppDispatch) => {
    try {
      const response: any = await appOperation.customer.trade_setting(data);
      // console.log('res:::', response);
      if (response.success) {
        dispatch(getUserProfile());
      }
    } catch (e) {
      logger(e);
    }
  };
export const setFeeSetting =
  (data: AlertsProps) => async (dispatch: AppDispatch) => {
    try {
      const response: any = await appOperation.customer.fee_setting(data);
      // console.log('res:::', response);
      if (response.success) {
        dispatch(getUserProfile());
      }
    } catch (e) {
      logger(e);
    }
  };

export const getUserBankDetails = () => async (dispatch: AppDispatch) => {
  try {
    const response: any = await appOperation.customer.user_bank_detail();
    // console.log('res:::', response);
    if (response.success) {
      dispatch(setUserBankData(response?.data));
    }
  } catch (e) {
    logger(e);
  }
};

export const addNewBakAccount =
  (data: FormData) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.customer.add_new_bank(data);
      // console.log('res:::', response);
      if (response.sucess) {
        dispatch(getUserBankDetails());
        showError(response?.message);
        NavigationService.goBack();
      }
    } catch (e) {
      logger(e);
      showError(e?.message);
    } finally {
      dispatch(setLoading(false));
    }
  };
export const updateBankAccount =
  (data: FormData) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.customer.edit_bank(data);
      // console.log('res:::', response);
      if (response.success) {
        dispatch(getUserBankDetails());
        showError(response?.message);
        NavigationService.goBack();
      } else {
        showError(response?.message);
      }
    } catch (e) {
      logger(e);
      showError(e?.message);
    } finally {
      dispatch(setLoading(false));
    }
  };

  export const submitTicket =
  (data: FormData,handleResetInput =() => {}) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.customer.submit_ticket(data);
      // console.log('res:::', response);
      if (response.success) {
        dispatch(getUserTickets());
        handleResetInput();
        showError(response?.message);
      } else {
        showError(response?.message);
      }
    } catch (e) {
      logger(e);
      showError(e?.message);
    } finally {
      dispatch(setLoading(false));
    }
  };

  export const ticketMessages =
  (data: any, setMessage = () => {}) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.customer.ticket_messages(data);
      console.log('Ticket Message Response:', response);
      if (response.success) {
        dispatch(getUserTickets());
        setMessage();
        showSuccess(response?.message || "Message sent");
      } else {
        showError(response?.message || "Failed to send message");
      }
    } catch (e) {
      console.log('Ticket Message Error:', e);
      logger(e);
      showError(e?.message);
    } finally {
      dispatch(setLoading(false));
    }
  };

  
export const deleteBankAccount = (id: any) => async (dispatch: AppDispatch) => {
  try {
    let data = {
      _id: id,
    };
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.delete_bank(data);
    // console.log('res:::', response);
    if (response.sucess) {
      dispatch(getUserBankDetails());
      showError(response?.message);
    }
  } catch (e) {
    logger(e);
    showError(e?.message);
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateRating =
  (data: RatingProps) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.customer.add_rating(data);
      // console.log('res:::', response);/
      if (response.success) {
        showError(response?.message);
        dispatch(setLoading(false));
      }
    } catch (e) {
      logger(e);
      showError(e?.message);
    } finally {
      dispatch(setLoading(false));
    }
  };

export const getUserReferCode = () => async (dispatch: AppDispatch) => {
  try {
    const response: any = await appOperation.customer.user_refer_code();
    if (response.success) {
      dispatch(setReferCode(response?.data?.user_code));
      // dispatch(getReferralList(response?.data))
    }
  } catch (e) {
    logger(e);
  }
};
export const getPayoutHistory = () => async (dispatch: AppDispatch) => {
  try {
    const response: any = await appOperation.customer.get_referral_list();
    if (response.success) {
      // dispatch(setPayoutHistory(response?.data));
      dispatch(getReferralList(response?.data))
    }
  } catch (e) {
    logger(e);
  }
};

export const getDownline = (sponsorId: any, level: any) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.get_downline(sponsorId, level);
    if (response.success) {
      dispatch(setTreeRoot(response?.data));
      const flat = flattenTreeInvestments(response?.data);
                    flat.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending
                    dispatch(setFlatInvestments(flat));
    }
  } catch (e) {
    logger(e);
  } finally {
    dispatch(setLoading(false));
  }
};

const flattenTreeInvestments = (node: { total_invested_amount: any[]; name: any; emailId: any; level: number; referrals: any[]; }) => {
  let investments: any[] = [];

  // Add self investments
  if (node?.total_invested_amount?.length > 0) {
      node.total_invested_amount.forEach((inv) => {
          investments.push({
              userName: node.name,
              email: node.emailId,
              level: node.level || 0,
              amount: inv.amount?.$numberDecimal || inv.amount,
              currency: inv.currency,
              investmentId: inv.investmentId,
              status: inv.status,
              self_roi_percent: inv.self_roi_percent,
              your_upline_percent: inv.your_upline_percent,
              date: inv.createdAt,
              type: inv.type || (node.level === 0 ? 'self' : 'downline')
          });
      });
  }

  // Recursively handle referrals
  if (node?.referrals?.length > 0) {
      node.referrals.forEach((child) => {
          investments = [...investments, ...flattenTreeInvestments(child)];
      });
  }

  return investments;
};

export const getUserReferCount = () => async (dispatch: AppDispatch) => {
  try {
    const response: any = await appOperation.customer.user_refer_count();
    if (response.success) {
      dispatch(setReferCount(response?.data));
    }
  } catch (e) {
    logger(e);
  }
};

export const getUserTickets = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.get_user_tickets();
    if (response.success) {
      dispatch(setUserTickets(response?.data?.reverse()));
    }
  } catch (e) {
    logger(e);
  } finally {
    dispatch(setLoading(false));
  }
};

export const getTicketCategories = (setCategories: any, setPriorities: any) => async (dispatch: AppDispatch) => {
  try {
    const response: any = await appOperation.customer.get_ticket_categories();
    if (response?.success) {
      setCategories(response?.data?.categories || []);
      setPriorities(response?.data?.priorities || []);
    }
  } catch (e) {
    logger(e);
  }
};

export const deleteAccount = () => async (dispatch: AppDispatch) => {
  try {
    let data = {status: 'Inactive'};
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.delete_account(data);
    if (response.success) {
      showError(response?.message);
      dispatch(logoutAction());
    }
  } catch (e) {
    logger(e);
    showError(e?.message);
  } finally {
    dispatch(setLoading(false));
  }
};

export const downLoadTradeReport =
  (data: DownloadTradeReportProps) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.customer.download_trade_report(
        data,
      );
      if (response.success) {
        showError(response?.message);
      }
    } catch (e) {
      logger(e);
      showError(e?.message);
    } finally {
      dispatch(setLoading(false));
    }
  };

/** Same as web: calls security/2fa/setup, stores QR data. Caller opens QR sheet (no navigation). */
export const generateTwoFactorQr = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.security2faSetup();
    if (response?.success && response?.data) {
      dispatch(setTwoFaData(response.data));
      return true;
    } else {
      showError(response?.message || 'Failed to get QR code');
      return false;
    }
  } catch (e: any) {
    logger(e);
    showError(e?.message || 'Something went wrong');
    return false;
  } finally {
    dispatch(setLoading(false));
  }
};

/** Same as web: calls security/2fa/confirm with 6-digit code, refreshes profile. Caller closes sheet or goes back. */
export const confirm2fa = (code: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.security2faConfirm(code);
    if (response?.success) {
      dispatch(setTwoFaData(undefined));
      dispatch(getUserProfile());
      showSuccess(response?.message || 'Google Authenticator enabled successfully!');
      return true;
    } else {
      showError(response?.message || 'Failed to enable 2FA');
      return false;
    }
  } catch (e: any) {
    logger(e);
    showError(e?.message || 'Something went wrong');
    return false;
  } finally {
    dispatch(setLoading(false));
  }
};

/** Same as web: POST security/2fa/disable. Supports TOTP code, or email/mobile OTP (otpCode + verifyMethod), or passkey (passkeyUserId). */
export const disable2fa = (
  authenticatorCode?: string | null,
  otpCode?: string | null,
  verifyMethod?: string | null,
  passkeyUserId?: string | null
) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.security2faDisable(
      authenticatorCode ?? undefined,
      otpCode ?? undefined,
      verifyMethod ?? undefined,
      passkeyUserId ?? undefined
    );
    if (response?.success) {
      dispatch(getUserProfile());
      showSuccess(response?.message || 'Google Authenticator disabled successfully');
      return true;
    } else {
      showError(response?.message || 'Failed to disable Google Authenticator');
      return false;
    }
  } catch (e: any) {
    logger(e);
    showError(e?.message || 'Something went wrong');
    return false;
  } finally {
    dispatch(setLoading(false));
  }
};

/** Same as web: POST security/send-otp for 2fa_setup, add_mobile, etc. Get OTP → show SpinnerSecond. */
export const sendSecurityOtp = (target: string, purpose: string, value?: string | null) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.securitySendOtp(target, purpose, value ?? undefined);
    if (response?.success) {
      showSuccess(response?.message || 'OTP sent successfully');
      return true;
    } else {
      showError(response?.message || 'Failed to Send OTP');
      return false;
    }
  } catch (e: any) {
    logger(e);
    showError(e?.message || 'Something went wrong');
    return false;
  } finally {
    dispatch(setLoading(false));
  }
};

/** Same as web: POST security/verify-otp - returns true if verified. Continue → only button loader, no SpinnerSecond. */
export const verifySecurityOtp = (target: string, otp: string, purpose: string, identifier?: string | null) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoadingOtp(true));
    const response: any = await appOperation.customer.securityVerifyOtp(target, otp, purpose, identifier ?? undefined);
    if (response?.success) {
      return true;
    } else {
      showError(response?.message || 'Invalid OTP');
      return false;
    }
  } catch (e: any) {
    logger(e);
    showError(e?.message || 'OTP verification failed');
    return false;
  } finally {
    dispatch(setLoadingOtp(false));
  }
};

/** Same as web: POST security/verify-totp - for add_passkey etc. Returns true if verified */
export const verifySecurityTotp = (code: string, purpose: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.securityVerifyTotp(code, purpose);
    if (response?.success) {
      return true;
    } else {
      showError(response?.message || 'Invalid code');
      return false;
    }
  } catch (e: any) {
    logger(e);
    showError(e?.message || 'Verification failed');
    return false;
  } finally {
    dispatch(setLoading(false));
  }
};

/** Verify identity via passkey for security flows (change email/mobile, etc). Returns userId or null. */
export const verifySecurityPasskey = (signId: string) => async (dispatch: AppDispatch) => {
  try {
    if (!Passkey.isSupported()) {
      showError('Passkeys are not supported on this device');
      return null;
    }
    dispatch(setLoading(true));
    const optionsRes: any = await appOperation.customer.passkeyGetAuthOptions(signId);
    if (!optionsRes?.success || !optionsRes?.data) {
      showError(optionsRes?.message || 'Failed to get passkey options');
      return null;
    }
    const opts = optionsRes.data;
    const challenge =
      typeof opts.challenge === 'string'
        ? toBase64URL(opts.challenge.replace(/-/g, '+').replace(/_/g, '/'))
        : opts.challenge;
    const rpId =
      PASSKEY_RP_ID && PASSKEY_RP_ID.trim()
        ? PASSKEY_RP_ID.trim()
        : (opts.rpId || opts.rp?.id || '');
    const request: any = {
      challenge: challenge || opts.challenge,
      rpId: rpId || 'localhost',
      timeout: opts.timeout,
      userVerification: opts.userVerification || 'preferred',
    };
    if (opts.allowCredentials?.length) {
      request.allowCredentials = opts.allowCredentials.map((c: any) => ({
        type: c.type || 'public-key',
        id: typeof c.id === 'string' ? toBase64URL(c.id.replace(/-/g, '+').replace(/_/g, '/')) : c.id,
        transports: c.transports,
      }));
    }
    const credential = await Passkey.get(request);
    if (!credential) {
      showError('Authentication was cancelled');
      return null;
    }
    const verifyRes: any = await appOperation.customer.passkeyVerifyAuth(signId, credential);
    if (!verifyRes?.success) {
      showError(verifyRes?.message || 'Passkey verification failed');
      return null;
    }
    return verifyRes?.data?.userId ?? null;
  } catch (e: any) {
    logger(e);
    const msg = String(e?.message ?? e?.error ?? '');
    if (e?.name === 'NotAllowedError' || /cancelled|cancel/i.test(msg)) {
      showError('Authentication was cancelled');
    } else {
      showError(e?.message || 'Passkey verification failed');
    }
    return null;
  } finally {
    dispatch(setLoading(false));
  }
};

/** Same as web: GET security/passkeys - returns { success, data: { passkeys: [], count } }. Use to sync hasPasskey with API. */
export const getPasskeyList = () => async (_dispatch: AppDispatch) => {
  try {
    const response: any = await appOperation.customer.passkeyGetList();
    return response;
  } catch (e: any) {
    logger(e);
    return { success: false, data: { passkeys: [], count: 0 } };
  }
};

/**
 * Get passkey registration options for Passkey.create().
 * Returns WebAuthn PublicKeyCredentialCreationOptions (unwrap .publicKey if backend sends it).
 */
export const getPasskeyRegistrationOptions = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.passkeyGetRegistrationOptions();
    console.log('[Passkey] getPasskeyRegistrationOptions API response:', response);
    if (!response?.success || !response?.data) {
      showError(response?.message || 'Failed to get registration options');
      return null;
    }
    // Same as web: optionsResult.data (unwrap publicKey if backend wraps it)
    const data = response.data;
    const options = data?.publicKey ?? data;
    return options;
  } catch (e: any) {
    logger(e);
    showError(e?.message || 'Something went wrong');
    return null;
  } finally {
    dispatch(setLoading(false));
  }
};

/** Verify passkey registration with backend (same as web passkeyVerifyRegistration) */
export const verifyPasskeyRegistration = (credential: object, name: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    console.warn('[Passkey] Calling API verify...');
    const response: any = await appOperation.customer.passkeyVerifyRegistration(credential, name);
    console.warn('[Passkey] API response:', JSON.stringify(response, null, 2));
    if (response?.success) {
      dispatch(getUserProfile());
      showSuccess(response?.message || 'Passkey added successfully!');
      return true;
    } else {
      const msg =
        response?.message ||
        response?.error ||
        (response?.data && (response.data?.message || response.data?.error)) ||
        'Failed to register passkey';
      console.warn('[Passkey] FAILED - backend said:', msg);
      showError(typeof msg === 'string' ? msg : 'Failed to register passkey');
      return false;
    }
  } catch (e: any) {
    console.warn('[Passkey] CATCH error:', e?.message, e?.code, e);
    logger(e);
    const errMsg =
      e?.message ||
      (e?.error && typeof e.error === 'string' ? e.error : null) ||
      (e?.data?.message) ||
      'Something went wrong';
    showError(errMsg);
    return false;
  } finally {
    dispatch(setLoading(false));
  }
};

/** Same as web: POST security/mobile/add — identity proof via emailOtp / tofaCode / passkey on same request (web TwofactorPage does not pre-call verify-otp for add-mobile). */
export const addMobileToAccount = (
  mobileNumber: string,
  countryCode: string,
  mobileOtp: string,
  identity?: {
    emailOtp?: string;
    tofaCode?: string;
    currentMobileOtp?: string;
    passkeyVerified?: boolean;
    passkeyUserId?: string;
    /** Exact `value` used with send-otp target `new_mobile` — links SMS OTP on mobile/add. */
    newMobileIdentifier?: string;
  }
) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoadingOtp(true));
    const payload: Record<string, string | boolean> = {
      mobileNumber: String(mobileNumber ?? '').trim(),
      countryCode: String(countryCode ?? '').trim(),
      mobileOtp: String(mobileOtp ?? '').trim(),
    };
    if (identity?.emailOtp) payload.emailOtp = String(identity.emailOtp).trim();
    if (identity?.tofaCode) payload.tofaCode = String(identity.tofaCode).trim();
    if (identity?.currentMobileOtp) payload.currentMobileOtp = String(identity.currentMobileOtp).trim();
    if (identity?.passkeyVerified === true) payload.passkeyVerified = true;
    if (identity?.passkeyUserId) payload.passkeyUserId = String(identity.passkeyUserId).trim();
    if (identity?.newMobileIdentifier) {
      const id = String(identity.newMobileIdentifier).trim();
      payload.identifier = id;
      payload.value = id;
    }

    if (__DEV__) {
      console.log('[addMobileToAccount] POST security/mobile/add body keys:', Object.keys(payload));
    }

    /** Same shape as web `AuthService.securityMobileAdd` — camelCase only; extra snake_case keys can break strict validators. */
    const response: any = await appOperation.customer.securityMobileAdd(payload as any);
    if (response?.success) {
      dispatch(getUserProfile());
      showSuccess(response?.message || 'Mobile number added successfully!');
      return true;
    } else {
      showError(response?.message || 'Failed to add mobile number');
      return false;
    }
  } catch (e: any) {
    logger(e);
    showError(e?.message || 'Something went wrong');
    return false;
  } finally {
    dispatch(setLoadingOtp(false));
  }
};

/** Same as web: POST security/email/add - add email to account (for users who signed up with phone). Button loader only, no SpinnerSecond. */
export const addEmailToAccount = (data: { email: string; tofaCode?: string; mobileOtp?: string; emailOtp: string }) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoadingOtp(true));
    const response: any = await appOperation.customer.securityEmailAdd(data);
    if (response?.success) {
      dispatch(getUserProfile());
      showSuccess(response?.message || 'Email added successfully!');
      return true;
    } else {
      showError(response?.message || 'Failed to add email');
      return false;
    }
  } catch (e: any) {
    logger(e);
    showError(e?.message || 'Something went wrong');
    return false;
  } finally {
    dispatch(setLoadingOtp(false));
  }
};

/** Same as web: initiate email change - sends OTP to new email */
export const initiateEmailChange = (data: { newEmail: string; tofaCode?: string; currentEmailOtp?: string; currentMobileOtp?: string; passkeyUserId?: string }) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.securityEmailChangeInitiate(data);
    if (response?.success) {
      showSuccess(response?.message || 'OTP sent to your new email.');
      return true;
    } else {
      showError(response?.message || 'Failed to initiate email change');
      return false;
    }
  } catch (e: any) {
    logger(e);
    showError(e?.message || 'Something went wrong');
    return false;
  } finally {
    dispatch(setLoading(false));
  }
};

/** Same as web: complete email change with new email OTP. Button loader only, no SpinnerSecond. */
export const completeEmailChange = (newEmailOtp: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoadingOtp(true));
    const response: any = await appOperation.customer.securityEmailChangeComplete({ newEmailOtp });
    if (response?.success) {
      dispatch(getUserProfile());
      showSuccess(response?.message || 'Email changed successfully!');
      return true;
    } else {
      showError(response?.message || 'Failed to change email');
      return false;
    }
  } catch (e: any) {
    logger(e);
    showError(e?.message || 'Something went wrong');
    return false;
  } finally {
    dispatch(setLoadingOtp(false));
  }
};

/** Same as web: initiate mobile change - sends OTP to new mobile */
export const initiateMobileChange = (data: { newMobileNumber: string; newCountryCode: string; tofaCode?: string; currentEmailOtp?: string; currentMobileOtp?: string; passkeyUserId?: string }) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.securityMobileChangeInitiate(data);
    if (response?.success) {
      showSuccess(response?.message || 'OTP sent to your new mobile.');
      return true;
    } else {
      showError(response?.message || 'Failed to initiate mobile change');
      return false;
    }
  } catch (e: any) {
    logger(e);
    showError(e?.message || 'Something went wrong');
    return false;
  } finally {
    dispatch(setLoading(false));
  }
};

/** Same as web: complete mobile change with new mobile OTP. Button loader only, no SpinnerSecond. */
export const completeMobileChange = (newMobileOtp: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoadingOtp(true));
    const response: any = await appOperation.customer.securityMobileChangeComplete({ newMobileOtp });
    if (response?.success) {
      dispatch(getUserProfile());
      showSuccess(response?.message || 'Mobile number changed successfully!');
      return true;
    } else {
      showError(response?.message || 'Failed to change mobile');
      return false;
    }
  } catch (e: any) {
    logger(e);
    showError(e?.message || 'Something went wrong');
    return false;
  } finally {
    dispatch(setLoadingOtp(false));
  }
};

export const enableTwoFa = (data: any) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.enable_two_fa(data);
    if (response.success) {
      dispatch(getUserProfile());
      NavigationService.navigate(NAVIGATION_BOTTOM_TAB_STACK);
      showError(response?.message);
    } else {
      showError(response?.message);
    }
  } catch (e) {
    logger(e);
    showError(e?.message);
  } finally {
    dispatch(setLoading(false));
  }
};

/** Anti-Phishing: GET status */
export const getAntiPhishingStatus = () => async (dispatch: AppDispatch) => {
  try {
    const response: any = await appOperation.customer.get_anti_phishing_status();
    return response?.success ? response?.data : null;
  } catch (e: any) {
    logger(e);
    return null;
  }
};

/** Anti-Phishing: send verification OTP */
export const sendAntiPhishingOtp = (target: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.send_anti_phishing_otp(target);
    if (response?.success) {
      showSuccess(response?.message || 'OTP sent successfully');
      return true;
    } else {
      showError(response?.message || 'Failed to send OTP');
      return false;
    }
  } catch (e: any) {
    logger(e);
    showError(e?.message || 'Something went wrong');
    return false;
  } finally {
    dispatch(setLoading(false));
  }
};

/** Anti-Phishing: SET code */
export const addAntiPhishingCode = (data: { antiPhishingCode: string; verifyMethod: string; code?: string; passkeyUserId?: string }) => async (dispatch: AppDispatch) => {
  try {
    const payload = { ...data };
    if (payload.code) {
      payload.code = String(payload.code); // Backend might expect string or number, casting to ensure it's normalized.
      // Or try: (payload as any).code = +payload.code;
    }
    console.log('[API] addAntiPhishingCode request payload:', payload);
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.add_anti_phishing_code(payload);
    console.log('[API] addAntiPhishingCode response:', response);
    if (response?.success) {
      showSuccess(response?.message || 'Anti-phishing code set successfully');
      return true;
    } else {
      console.warn('[API] addAntiPhishingCode FAILED:', response?.message || 'Unknown error');
      showError(response?.message || 'Failed to set code');
      return false;
    }
  } catch (e: any) {
    console.error('[API] addAntiPhishingCode CATCH error:', e);
    logger(e);
    showError(e?.message || 'Something went wrong');
    return false;
  } finally {
    dispatch(setLoading(false));
  }
};

/** Anti-Phishing: REMOVE code */
export const removeAntiPhishingCode = (data: { verifyMethod: string; code?: string; passkeyUserId?: string }) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.remove_anti_phishing_code(data);
    if (response?.success) {
      showSuccess(response?.message || 'Anti-phishing code removed successfully');
      return true;
    } else {
      showError(response?.message || 'Failed to remove code');
      return false;
    }
  } catch (e: any) {
    logger(e);
    showError(e?.message || 'Something went wrong');
    return false;
  } finally {
    dispatch(setLoading(false));
  }
};
