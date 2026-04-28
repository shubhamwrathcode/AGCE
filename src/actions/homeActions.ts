import {Alert} from 'react-native';
import {appOperation} from '../appOperation';
import {logger, showError, showSuccess} from '../helper/logger';
import {
  AddToFavoriteProps,
  CancelOrderProps,
  GetFeeDetailProps,
  OpenOrdersProps,
  PastOrdersProps,
  PlaceOrderProps,
} from '../helper/types';
import NavigationService from '../navigation/NavigationService';
import {
  COIN_TRANSACTION_HISTORY_SCREEN,
  CONVERT_HISTORY_SCREEN,
  LAKED_STAKING,
  QS_TRANSACTION,
  STAKING_HISTORY,
  STAKING_SUCCESS,
  WALLET_DETAIL_SCREEN,
} from '../navigation/routes';
import {setLoading} from '../slices/authSlice';
import {
  onCancelOrder,
  setBannerList,
  setCoinList,
  setConversion,
  setConversionHistory,
  setFavoriteArray,
  setFavoriteArrayLoaded,
  setFavorites,
  setFeeDetails,
  setHistoricData,
  setLakedStaking,
  setNotificationList,
  setOrderData,
  setPastOrders,
  setQbsHistory,
  setStaking,
  setStakingHistory,
  setUserEligibility,
  setAllProjectList,
  setCheckCommitExistense,
  setUserCommitProject,
  setPastAllProjects,
  setUserCommits,
  setSingleProject,
  setUserProjectTotalCommit,
  setUserProjectUpdateCommit,
  setCommitDetails,
  setActivityLogs,
  setReferralList,
  setMemeList
} from '../slices/homeSlice';
import {AppDispatch} from '../store/store';
import {getOpenOrders, getUserWallet} from './walletActions';
import { setUserData } from '../slices/authSlice';
export const getBannerList = () => async (dispatch: AppDispatch) => {
  try {
    const response: any = await appOperation.customer.banner_list();
    if (response.success) {
      const bannerData = response?.data?.filter(
        (        banner: { status: string; }) => banner?.status === 'Active',
      );
      dispatch(setBannerList(bannerData));
    }
  } catch (e) {
    logger(e);
  }
};
export const getQbsHistory = () => async (dispatch: AppDispatch) => {
  try {
    const response: any = await appOperation.customer.qbs_history();
    if (response?.success) {
      dispatch(setQbsHistory(response?.data));
    }
  } catch (e) {
    logger(e);
  }
};

export const getMemeList = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.meme_list();
    if (response.success) {
      dispatch(setMemeList(response?.data));
    }
  } catch (e) {
    logger(e);
  } finally {
    dispatch(setLoading(false));
  }
};

export const getNotificationList = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.notification_list();
    if (response.success) {
      dispatch(setNotificationList(response?.data));
    }
  } catch (e) {
    logger(e);
  } finally {
    dispatch(setLoading(false));
  }
};

export const markAsRead = (id: any) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.mark_as_read(id);
    if (response.success) {
      dispatch(getNotificationList())
    }
  } catch (e) {
    logger(e);
  } finally {
    dispatch(setLoading(false));
  }
};

export const getFavoriteArray = () => async (dispatch: AppDispatch) => {
  try {
    const response: any = await appOperation.customer.favorite_array();
    // console.log(response, "getFavoriteArray");
    if (response.success) {
      dispatch(setFavoriteArray(response?.data?.pairs ?? []));
    }
  } catch (e) {
    logger(e);
  } finally {
    dispatch(setFavoriteArrayLoaded(true));
  }
};

export const addToFavorites =
  (data: AddToFavoriteProps) => async (dispatch: AppDispatch) => {
    dispatch(setLoading(true));
    try {
      const response: any = await appOperation.customer.add_to_favorite(data);

      if (response.success) {
        // dispatch(setFavoriteArray(response?.data));
        dispatch(getFavoriteArray());
        // dispatch(setFavorites());
      }
    } catch (e) {
      logger(e);
    } finally {
      dispatch(setLoading(false));
    }
  };

export const getPastOrders =
  (data: PastOrdersProps) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.customer.past_orders(data);
      // console.log(response, "getPastOrders");
      if (response.success) {
        dispatch(setPastOrders(response?.data));
      }
    } catch (e) {
      logger(e);
    } finally {
      dispatch(setLoading(false));
    }
  };

export const getHistoricData =
  (data: OpenOrdersProps, item: any) => async (dispatch: AppDispatch) => {
    try {
      // dispatch(setLoading(true));

      dispatch(setHistoricData([]));
      const response: any = await appOperation.customer.open_orders(data);
      // console.log(response,'==repo');
      
      if (response.success) {
        dispatch(setLoading(false));
        dispatch(setHistoricData(response?.data));
        
      }
    } catch (e) {
      logger(e);
    } finally {
      dispatch(setLoading(false));
      // console.log('==repoer');
      NavigationService.navigate(WALLET_DETAIL_SCREEN, {item});
    }
  };

export const cancelOrder =
  (data: CancelOrderProps) => async (dispatch: AppDispatch) => {
    try {
      const response: any = await appOperation.customer.cancel_order(data);

      if (response.success) {
        showSuccess(response?.message || "Order cancelled successfully");
        dispatch(onCancelOrder(data.order_id));
        dispatch(getOpenOrders(0, 10));
      } else {
        showError(response?.message || "Failed to cancel order");
      }
      return response;
    } catch (e) {
      logger(e);
      showError(e?.message || "An error occurred");
      return { success: false, message: e?.message };
    }
  };

export const placeOrder =
  (data: PlaceOrderProps, setVisible: any) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.customer.place_order(data);

      if (response.success) {
        dispatch(setOrderData(data));
        showError(response?.message);
        setVisible(true);
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

  export const closePosition =
  (data: any) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.customer.close_position(data);
      if (response?.success) {
        showError(response?.message || 'Position closed');
      } else {
        showError(response?.message || 'Failed');
      }
    } catch (e) {
      logger(e);
      showError(e?.message);
    } finally {
      dispatch(setLoading(false));
    }
  };

  export const cancelFutureOrder =
  (data: { orderId: string }) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.customer.cancelFutureOrder(data);
      if (response?.success) {
        showError(response?.message || 'Order cancelled');
      } else {
        showError(response?.message || 'Failed');
      }
    } catch (e) {
      logger(e);
      showError(e?.message);
    } finally {
      dispatch(setLoading(false));
    }
  };



  export const placeReverseOrder =
  (data: any) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.customer.place_reverse_order(data);

      if (response.success) {
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

  /** Place new futures order (Limit/Market). Uses same futures/order endpoint. */
  export const placeFutureOrder =
  (data: {
    baseCurrency: string;
    quoteCurrency: string;
    marketType: 'LIMIT' | 'MARKET';
    side: 'LONG' | 'SHORT';
    quantity: number;
    leverage: number;
    price?: number;
    takeProfit?: number;
    stopLoss?: number;
  }) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const payload: any = {
        baseCurrency: data.baseCurrency,
        quoteCurrency: data.quoteCurrency,
        marketType: data.marketType,
        side: data.side,
        quantity: data.quantity,
        leverage: data.leverage,
      };
      if (data.marketType === 'LIMIT' && data.price != null) payload.price = data.price;
      if (data.takeProfit != null) payload.takeProfit = data.takeProfit;
      if (data.stopLoss != null) payload.stopLoss = data.stopLoss;
      const response: any = await appOperation.customer.place_reverse_order(payload);
      if (response?.success) {
        showError(response?.message || 'Order placed successfully');
      } else {
        showError(response?.message || 'Order failed');
      }
    } catch (e) {
      logger(e);
      showError(e?.message);
    } finally {
      dispatch(setLoading(false));
    }
  };

export const getFeeDetails =
  (data: GetFeeDetailProps) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.customer.fee_detail(data);

      if (response.success) {
        dispatch(setFeeDetails(response?.data));
      }
    } catch (e) {
      logger(e);
    } finally {
      dispatch(setLoading(false));
    }
  };

export const getConversionHistory = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await appOperation.customer.convert_history();
    // console.log('res:::::getConversionHistory:::::', response);

    if (response?.code == 200) {
      dispatch(setConversionHistory(response?.data));
    }
  } catch (e) {
    logger('getConversionHistory', e);
  } finally {
    dispatch(setLoading(false));
  }
};

export const conversion = (data: any) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await appOperation.customer.conversion_rate(data);
    // console.log('res:::::conversion:::', response);
    if (response?.success) {
      dispatch(setConversion(response?.data));
    } else {
      dispatch(setConversion(''));
    }

    // console.log(response, 'res');
  } catch (e) {
    showError(e.message);
    dispatch(setConversion(''));
  } finally {
    dispatch(setLoading(false));
  }
};

export const swapToken = (data: any) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await appOperation.customer.swap_token(data);
    // console.log('res:::::swapToken:::', response);
    if (response?.success) {
      showError(response?.message);
      NavigationService.navigate(CONVERT_HISTORY_SCREEN);
      dispatch(getUserWallet());
    }
    // dispatch(setConversion(response.data));
    // console.log(response, 'res');
  } catch (e) {
    showError(e.message);
  } finally {
    dispatch(setLoading(false));
  }
};

export const getCoinList = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.coin_list();
    if (response?.success) {
      dispatch(setCoinList(response.data));
    }
  } catch (e) {
    logger('getCoinList', e);
  } finally {
    dispatch(setLoading(false));
  }
};

export const QS_Buy =
  (data: any) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response = await appOperation.customer.qs_BuySell(data);
      if (response?.success) {
        showError(response?.message);
        // dispatch(getTransactionHistory());
      } else {
        // dispatch(setConversion(''));
        showError(response?.message);
      }
    } catch (e) {
      showError(e?.message);
    } finally {
      dispatch(setLoading(false));
    }
  };

export const getTransactionHistory =
  (skip: number, limit: number) => async (dispatch: AppDispatch) => {
    try {
      const response: any = await appOperation.customer.qs_Hisory(skip, limit);
      if (response?.success) {
        if (response?.data?.length == 0) {
          showError("No More Data");
        }else {
          dispatch(setQbsHistory(response?.data));
        }
      }
    } catch (e) {
      logger(e);
    }
  };

  export const getActivityLogs =
  (skip: number, limit: number) => async (dispatch: AppDispatch) => {
    try {
      const response: any = await appOperation.customer.get_Activity_logs(skip, limit);
      if (response?.success) {
        if (response?.data?.length == 0) {
          showError("No More Data");
        }else {
          dispatch(setActivityLogs(response?.data));
        }
      }
    } catch (e) {
      logger(e);
    }
  };

  export const getReferralList = (data:any) => async (dispatch: AppDispatch) => {
     dispatch(setLoading(true));
    try {
      const response: any = await appOperation.customer.get_my_referral_tree();
      if (response?.success) {
          const d = response?.data;
          const items = Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : [];
          dispatch(setReferralList(items));
      }
    } catch (e) {
      logger(e);
    } finally {
       dispatch(setLoading(false));
    }
  };

export const getStaking = () => async (dispatch: AppDispatch) => {
  try {
    const response: any = await appOperation.customer.Staking_Home();
    if (response?.success) {
      dispatch(setStaking(response?.data));
    }
  } catch (e) {}
};

export const PLACE_STAKING = (data: any, stakeCurrency: any) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await appOperation.customer.place_staking(data);
    if (response?.success) {
      dispatch(getStaking());
      NavigationService.navigate(STAKING_SUCCESS, {stakeCurrency: stakeCurrency});
      showError(response?.message);
    }
  } catch (e) {
    showError(e);
  } finally {
    dispatch(setLoading(false));
  }
};

export const Laked_staking_income =
  () => async (dispatch: AppDispatch) => {
    try {
      const response: any = await appOperation.customer.Laked_Staking_History();
      if (response?.success) {
        dispatch(setLakedStaking(response?.data));
      }
    } catch (e) {}
  };

export const staking_history = (data: any) => async (dispatch: AppDispatch) => {
  try {
    const response: any = await appOperation.customer.Staking_History(data);
    if (response?.success) {
      dispatch(setStakingHistory(response?.data));
    }
  } catch (e) {}
};

export const getCommitDetails = (id: any) => async (dispatch: AppDispatch) => {
  try {
    const response: any = await appOperation.customer.get_commit_details(id);
    if (response?.success) {
      dispatch(setCommitDetails(response?.data));
    }
  } catch (e) {
    e?.message;
  }
};

export const BREAK_STAKING = (data: any) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await appOperation.customer.break_staking(data);
    if (response?.success == true) {
      showError(response?.message);
      dispatch(Laked_staking_income());
    }
  } catch (e) {
    showError(e);
  } finally {
    dispatch(setLoading(false));
  }
};

export const getUserEligibility = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.user_eligibility();
    // console.log(response, '===response');
    if (response?.success) {
      dispatch(setUserEligibility(response));
    }
  } catch (e) {
    logger(e);
  } finally {
    dispatch(setLoading(false));
  }
};

export const getAllProjects = (data: any) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.all_project(data);
    // console.log(response, '===response');
    if (response?.success) {
      dispatch(setAllProjectList(response?.data));
    }
  } catch (e) {
    logger(e);
  } finally {
    dispatch(setLoading(false));
  }
};

export const getPastAllProjects = (data: any) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.get_past_all_projects(data);
    // console.log(response, '===response');
    if (response?.success) {
      dispatch(setPastAllProjects(response?.data));
    }
  } catch (e) {
    logger(e);
  } finally {
    dispatch(setLoading(false));
  }
};

export const getUserCommits = (data: any) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.get_user_commits();
    // console.log(response, '===response');
    if (response?.success) {
      dispatch(setUserCommits(response?.data));
    }
  } catch (e) {
    logger(e);
  } finally {
    dispatch(setLoading(false));
  }
};

export const checkCommitExistense = (data: any) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.check_commit_existense(data);
    // console.log(response, '===response');
    if (response?.success) {
      dispatch(setCheckCommitExistense(response));
    }
  } catch (e) {
    logger(e);
  } finally {
    dispatch(setLoading(false));
  }
};

export const getSingleProject = (data: any) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.get_single_project(data);
    if (response?.success) {
      dispatch(setSingleProject(response?.data));
    }
  } catch (e) {
    logger(e);
  } finally {
    dispatch(setLoading(false));
  }
};

export const projectTotalCommit = (data: any) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.project_total_commit(data);
    if (response?.success) {
      dispatch(setUserProjectTotalCommit(response?.data));
    }
  } catch (e) {
    logger(e);
  } finally {
    dispatch(setLoading(false));
  }
};

export const userCommitProject = (data: any) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.user_commit_project(data);
    // console.log(response, '===userCommitProject');
    if (response?.success) {
      dispatch(setUserCommitProject(response));
      showError(response?.message);
    }else {
      showError(response?.message);
    }  
  } catch (e) {
    logger(e);
    showError(e?.message);
  } finally {
    dispatch(setLoading(false));
  }
};

export const userCommitUpdateProject = (data: any, id:any ) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.user_update_commit_project(data, id);
    if (response?.success) {
      dispatch(setUserProjectUpdateCommit(response?.data));
      showError(response?.message);
    }else {
      showError(response?.message);
    }  
  } catch (e) {
    logger(e);
    showError(e?.message);
  } finally {
    dispatch(setLoading(false));
  }
};

export const getUserProfile = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.customer.get_profile();
    if (response?.success) {
      dispatch(setUserData(response?.data));
    }
  } catch (e) {
    logger(e);

  } finally {
    dispatch(setLoading(false));
  }
}
