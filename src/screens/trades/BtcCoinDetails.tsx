import React, { useEffect, useRef, useState } from "react";
import {
  AppSafeAreaView,
  AppText,
  BLACK,
  BLACKOPACITY,
  BOLD,
  Button,
  CommonModal,
  DESC,
  EIGHTEEN,
  FIFTEEN,
  FOURTEEN,
  GREEN,
  Input,
  RED,
  SECOND,
  SEMI_BOLD,
  SIXTEEN,
  TEN,
  THIRTEEN,
  TWELVE,
  TWENTY,
  WHITE,
  YELLOW,
} from "../../shared";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { StyleSheet, View } from "react-native";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import { colors } from "../../theme/colors";
import {
  toFixedEight,
  checkToFixedThree,
  toFixedThree,
} from "../../helper/utility";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import FastImage from "react-native-fast-image";
import {
  add_more,
  checkIc,
  depositIcon,
  downIcon,
  graphIcon,
  historyIcon,
  HOME_BG,
  HomeBg,
  starFillIcon,
  starIcon,
} from "../../helper/ImageAssets";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  addToFavorites,
  getFeeDetails,
  getPastOrders,
  placeOrder,
} from "../../actions/homeActions";
import { SpinnerSecond } from "../../shared/components/SpinnerSecond";
import NavigationService from "../../navigation/NavigationService";
import {
  COIN_DETAILS_CHART_SCREEN,
  COIN_TRANSACTION_HISTORY_SCREEN,
  DEPOSIT_INR_SCREEN,
  DEPOSIT_SCREEN,
  KYC_STATUS_SCREEN,
  ORDER_HISTORY,
} from "../../navigation/routes";
import {
  borderWidth,
  inputHeight,
  smallButtonHeight,
  universalPaddingHorizontal,
  universalPaddingHorizontalHigh,
} from "../../theme/dimens";
import {
  BASE_URL,
  errorText,
  placeHolderText,
  titleText,
} from "../../helper/Constants";
import { percentageData } from "../../helper/dummydata";
import {
  setBuyOrders,
  setOpenOrders,
  setRandom,
  setSellOrders,
  setSocket,
} from "../../slices/homeSlice";
import PopupModal from "../home/Model";
import { connect } from "socket.io-client";
import { showError } from "../../helper/logger";
import CoinTransactionHistory, {
  OpenOrders,
} from "../home/CoinTransactionHistory";
import { PickerSelect } from "../../shared/components/PickerSelect";
import RBSheet from "react-native-raw-bottom-sheet";
import OpenOrderFound from "./OpenOrderFound";
import PairModal from "../../shared/components/PairModal";
import { fontFamilyMedium, fontFamilySemiBold } from "../../theme/typography";

const socket = connect(BASE_URL, {
  transports: ["websocket"],
  forceNew: true,
  autoConnect: true,
  upgrade: false,
  rejectUnauthorized: false,
  reconnectionAttempts: 5,
});
export const Data = [
  {
    label: "0.1",
    value: "0.1",
  },
  {
    label: "0.01",
    value: "0.01",
  },
  {
    label: "0.001",
    value: "0.001",
  },
  {
    label: "0.0001",
    value: "0.0001",
  },
];
export const DataLimit = [
  {
    id: "0.1",
    name: "Limit",
  },
  {
    id: "0.1",
    name: "Market",
  },
];
export const ColorData = [
  {
    id: 1,
    multyColor: true,
    red: false,
    green: false,
  },
  {
    id: 2,
    multyColor: false,
    red: true,
    green: false,
  },
  {
    id: 3,
    multyColor: false,
    red: false,
    green: true,
  },
];
const BtcCoinDetails = ({ coinDetails }) => {
  const dispatch = useAppDispatch();
  const route = useRoute();
  const rbSheet = useRef();
  const rbSheetlimit = useRef();
  const rbSheetNumber = useRef();
  const coinData = useAppSelector((state) => state.home.coinData);
  //   const coinDetail = route?.params?.coinDetail;
  const coinDetail = coinDetails ? coinDetails : coinData[0];
  // console.log(coinDetail, "coinDetail");

  const {
    base_currency,
    base_currency_id,
    quote_currency,
    quote_currency_id,
    change,
    _id,
    buy_price,
  } = coinDetail;

  const favoriteArray = useAppSelector((state) => state.home.favorites);
  const userData = useAppSelector((state) => state.auth.userData);
  const buyOrders = useAppSelector((state) => state.home.buyOrders);
  const sellOrders = useAppSelector((state) => state.home.sellOrders);
  const random = useAppSelector((state) => state.home.random);
  const userWallet = useAppSelector((state) => state.wallet.userWallet);
  const { skip_buy_sell, id, kycVerified } = userData ?? "";
  const amountInput = useRef(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBuy, setIsBuy] = useState(true);
  const [isLimit, setIsLimit] = useState(true);
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("1");
  const [activePercentage, setActivePercentage] = useState<string | number>("");
  const [isConfirm, setIsConfirm] = useState(false);
  const [total, setTotal] = useState<string | number>("");
  const [balance, setBalance] = useState<string | number>(0);
  const [_balance, _setBalance] = useState<string | number>(0);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPair, setShowPair] = useState(false);
  const [colorId, setColorId] = useState("1");
  const [numberSelect, setNumberSelect] = useState("0.0001");
  const [numberSelectLimit, setNumberLimit] = useState("Limit");
  const lastSixObjects = sellOrders && sellOrders?.slice(-6);
  const lastTenObjects = sellOrders && sellOrders?.slice(-12);
  const startingSixObjects = buyOrders && buyOrders?.slice(0, 6);
  const startingTenObjects = buyOrders && buyOrders?.slice(0, 12);

  // console.log(favoriteArray?.pairs?.includes(_id), "favoriteArray");
  // useEffect(() => {
  //   if(favoriteArray?.pairs?.includes(_id)) {
  //     setIsFavorite(true);
  //   } else {
  //     setIsFavorite(false);
  //   }
  // }, []);

  useEffect(() => {
    setPrice(toFixedEight(buy_price));
  }, [buy_price, isLimit]);

  useEffect(() => {
    setTotal(multiply(buy_price, 1)?.toString());
  }, [buy_price]);
  useEffect(() => {
    socket?.on("connect", () => {
      console.log("connected to detail socket server");
      dispatch(setSocket(socket));
      dispatch(setRandom(Math.random()));
    });

    return () => {
      socket?.off("connect");
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let data = {
        message: "exchange",
        userId: id,
        base_currency_id: base_currency_id,
        quote_currency_id: quote_currency_id,
      };
      if (id && base_currency_id && quote_currency_id) {
        socket?.emit("message", data);
        console.log("event name exchange emitted");
        setBalance(0);
        dispatch(setOpenOrders([]));
        dispatch(setBuyOrders([]));
        dispatch(setSellOrders([]));
      }
    }, [base_currency_id, quote_currency_id, id, random])
  );
  useEffect(() => {
    socket?.on("message", (res) => {
      // console.log(res?.open_orders,'====res');
      setBalance(res?.balance?.quote_currency_balance);
      _setBalance(res?.balance?.base_currency_balance);
      dispatch(setOpenOrders(res?.open_orders ? res?.open_orders : []));
      dispatch(setBuyOrders(res?.buy_order ? res?.buy_order : []));
      dispatch(setSellOrders(res?.sell_order ? res?.sell_order : []));
      // setLoading(false);
    });
    return () => {
      socket?.off("message");
    };
  }, []);
  useEffect(() => {
    let interval = setInterval(() => {
      if (id && base_currency_id && quote_currency_id) {
        let data = {
          message: "exchange",
          userId: id,
          base_currency_id: base_currency_id,
          quote_currency_id: quote_currency_id,
        };
        socket?.emit("message", data);
      }
    }, 5000);
    return () => {
      clearInterval(interval);
    };
  }, [base_currency_id, quote_currency_id, id, random]);

  useEffect(() => {
    if (isBuy && _balance) {
      setBalance(_balance?.quote_currency_balance);
    } else {
      setBalance(_balance?.base_currency_balance);
    }
  }, [isBuy, _balance]);

  useEffect(() => {
    if (base_currency) {
      let data = { currency_id: base_currency_id };
      dispatch(getFeeDetails(data));
    }
  }, [base_currency_id]);

  const onAdd = () => {
    let data = {
      pair_id: _id,
    };
    dispatch(addToFavorites(data));
    setIsFavorite(!isFavorite);
  };

  const onNavigate = () => {
    let pastData = {
      base_currency_id: base_currency_id,
      quote_currency_id: quote_currency_id,
    };
    let currencyName = {
      firstCoin: base_currency,
      secondCoin: quote_currency,
    };
    NavigationService.navigate(ORDER_HISTORY, { data: pastData, currencyName });
    // dispatch(getPastOrders(pastData));
  };

  const onSubmit = () => {
    if (kycVerified !== 2) {
      NavigationService.navigate(KYC_STATUS_SCREEN);
      return;
    }
    if (skip_buy_sell) {
      let data = {
        base_currency_id: base_currency_id,
        order_type: isLimit ? "LIMIT" : "MARKET",
        price: price,
        quantity: amount,
        quote_currency_id: quote_currency_id,
        side: isBuy ? "BUY" : "SELL",
      };
      dispatch(placeOrder(data, setVisible));

      setTimeout(() => {
        let _data = {
          message: "exchange",
          userId: id,
          base_currency_id: base_currency_id,
          quote_currency_id: quote_currency_id,
        };

        if (id && base_currency_id && quote_currency_id) {
          socket?.emit("exchange", _data);
          console.log("event name exchange emitted");
        }
      }, 2000);
    } else {
      setIsConfirm(true);
    }
  };

  const multiply = (numOne, numTwo) => {
    let temp = Number(numOne) * Number(numTwo);
    return toFixedEight(temp);
  };

  const percentCalculation = (balance, percentage) => {
    return (parseFloat(balance) * parseFloat(percentage)) / 100;
  };
  const handleTotalPercentage = (value) => {
    setActivePercentage(value);
    if (isBuy) {
      handleTotal(percentCalculation(balance, value));
    } else {
      handleQty(percentCalculation(balance, value));
    }
  };
  const handleAmount = (text) => {
    setPrice(text?.toString());
    setTotal(multiply(text, amount));
  };

  const handleQty = (text) => {
    setAmount(text?.toString());
    setTotal(multiply(text, price));
  };
  const handleTotal = (text) => {
    const qty = Number(text) / Number(price);
    setAmount(qty?.toString());
    setTotal(multiply(price, qty));
  };
  const onConfirm = () => {
    let data = {
      base_currency_id: base_currency_id,
      order_type: isLimit ? "LIMIT" : "MARKET",
      price: price,
      quantity: amount,
      quote_currency_id: quote_currency_id,
      side: isBuy ? "BUY" : "SELL",
      total: total,
    };
    dispatch(placeOrder(data, setVisible));
    setTimeout(() => {
      let _data = {
        message: "exchange",
        userId: id,
        base_currency_id: base_currency_id,
        quote_currency_id: quote_currency_id,
      };

      if (id && base_currency_id && quote_currency_id) {
        socket?.emit("exchange", _data);
        console.log("event name exchange emitted");
      }
    }, 10000);
  };
  const handlePopup = () => {
    setVisible(false);
  };
  // const onDeposit = (isInr: boolean) => {
  //   let temp = userWallet?.find(e => {
  //     return e?.chain[0] === isBuy ? quote_currency_id : base_currency_id;
  //   });

  //   if (!temp) {
  //     showError(errorText``.temp);
  //     return;
  //   }
  //   let walletDetail = {
  //     currency_id: isBuy ? quote_currency_id : base_currency_id,
  //     chain: temp?.chain,
  //     currency: isBuy ? quote_currency : base_currency,
  //   };

  //   isInr
  //     ? NavigationService.navigate(DEPOSIT_INR_FIRST_SCREEN, {walletDetail})
  //     : NavigationService.navigate(DEPOSIT_SCREEN, {walletDetail});
  // };
  const coinHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.nameContainer}>
          <View>
            <TouchableOpacityView
              onPress={() => setShowPair(true)}
              style={styles.pairNameContainer}
            >
              <AppText type={SIXTEEN} weight={SEMI_BOLD}>
                {base_currency}/{quote_currency}
              </AppText>
              <FastImage
                source={downIcon}
                tintColor={colors.white}
                resizeMode="contain"
                style={styles.selectDown}
              />
            </TouchableOpacityView>
            <View
              style={[
                styles.bedge,
                change < 0 && {
                  backgroundColor: colors.red,
                },
              ]}
            >
              <AppText color={WHITE} weight={SEMI_BOLD}>
                {toFixedThree(change)}
              </AppText>
            </View>
          </View>

          <TouchableOpacityView onPress={() => onAdd()}>
            <FastImage
              source={
                favoriteArray?.pairs?.includes(_id) ? starFillIcon : starIcon
              }
              resizeMode="contain"
              style={styles.star}
            />
          </TouchableOpacityView>
        </View>
        <View style={styles.nameContainer}>
          <TouchableOpacityView onPress={() => onNavigate()}>
            <FastImage
              source={historyIcon}
              resizeMode="contain"
              style={styles.historyIcon}
            />
          </TouchableOpacityView>
          <TouchableOpacityView
            onPress={() => {
              NavigationService.navigate(COIN_DETAILS_CHART_SCREEN, {
                coinDetail,
              });
            }}
          >
            <FastImage
              source={graphIcon}
              resizeMode="contain"
              style={styles.graphIcon}
            />
          </TouchableOpacityView>
        </View>
      </View>
    );
  };
  const buySellContainer = () => {
    return (
      <View style={{ flex: 1.5, marginEnd: 10 }}>
        <View style={styles.buttonContainer}>
          <Button
            children="Buy"
            containerStyle={[styles.buyButton, isBuy && styles.buyButtonActive]}
            titleStyle={[styles.buySellTitle, isBuy && { color: colors.white }]}
            onPress={() => setIsBuy(true)}
          />
          <Button
            children="Sell"
            containerStyle={[
              styles.sellButton,
              !isBuy && styles.sellButtonActive,
            ]}
            titleStyle={[
              styles.buySellTitle,
              !isBuy && { color: colors.white },
            ]}
            onPress={() => setIsBuy(false)}
          />
        </View>
        <TouchableOpacityView
          onPress={() => rbSheetlimit?.current?.open()}
          style={styles.dropDownContainer}
        >
          <AppText type={SIXTEEN} weight={SEMI_BOLD}>
            {numberSelectLimit}
          </AppText>
          <FastImage
            source={downIcon}
            tintColor={colors.white}
            resizeMode="contain"
            style={{ height: 10, width: 10 }}
          />
        </TouchableOpacityView>
        {isLimit && (
          <Input
            placeholder={placeHolderText.empty}
            title={titleText.price}
            value={price}
            onChangeText={(text) => handleAmount(text)}
            keyboardType="numeric"
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => amountInput?.current?.focus()}
            currency={quote_currency}
            editable={isLimit}
            containerStyle={styles.inputContainer}
            titleStyle={styles.inputContainer2}
          />
        )}
        <Input
          placeholder={placeHolderText.empty}
          title={titleText.amount}
          value={amount}
          onChangeText={(text) => handleQty(text)}
          keyboardType="numeric"
          returnKeyType="done"
          onSubmitEditing={() => onSubmit()}
          assignRef={(input) => {
            amountInput.current = input;
          }}
          currency={base_currency}
          containerStyle={styles.inputContainer}
          titleStyle={styles.inputContainer2}
        />
        <View style={styles.buttonContainer2}>
          {percentageData.map((e) => {
            return (
              <TouchableOpacityView
                onPress={() => {
                  handleTotalPercentage(e.value);
                }}
                style={[
                  styles.percentageContainer,
                  activePercentage === e.value && {
                    backgroundColor: colors.buttonBg,
                  },
                ]}
              >
                <AppText color={WHITE} type={TEN}>
                  {e.value}%
                </AppText>
              </TouchableOpacityView>
            );
          })}
        </View>

        <View style={[styles.buttonContainer2]}>
          <AppText color={DESC}>Available</AppText>
          <View style={styles.bottomContainer4}>
            <AppText type={FOURTEEN} style={{ marginRight: 10 }}>
              {isBuy ? checkToFixedThree(balance) : toFixedThree(_balance)}
            </AppText>
            <AppText type={FOURTEEN}>
              {isBuy ? quote_currency : base_currency}
            </AppText>

            <TouchableOpacityView
              // onPress={() => {
              //   onDeposit(isBuy && quote_currency === 'INR');
              // }}
              style={styles.addMoreButton}
            >
              <FastImage
                source={add_more}
                style={styles.addMore}
                resizeMode="contain"
                tintColor={colors.buttonBg}
              />
            </TouchableOpacityView>
          </View>
        </View>

        <Button
          children={kycVerified !== 2 ? "Verify KYC" : isBuy ? "Buy" : "Sell"}
          containerStyle={[
            styles.mainButton,
            { backgroundColor: isBuy ? colors.green : colors.red },
          ]}
          onPress={() => onSubmit()}
          titleStyle={styles.mainButtonTitle}
        />
      </View>
    );
  };
  const orders = () => {
    return (
      <View style={styles.bottomContainer}>
        <View style={styles.mainView}>
          {/* <TouchableOpacityView
            onPress={() => rbSheet?.current?.open()}
            style={[styles.colorBoxContainer, { marginBottom: 10 }]}
          >
            {colorId == "1" ? (
              <>
                <View style={styles.redBox} />
                <View style={styles.greenBox} />
              </>
            ) : colorId == "2" ? (
              <View style={styles.onlyRedBox} />
            ) : (
              <View style={styles.onlyGreenBox} />
            )}
          </TouchableOpacityView> */}
          {/* <TouchableOpacityView
            onPress={() => rbSheetNumber?.current?.open()}
            style={styles.numberSelectContainer}
          >
            <AppText style={{ flex: 1 }} weight={SEMI_BOLD}>
              {numberSelect}
            </AppText>
            <FastImage
              source={downIcon}
              tintColor={colors.white}
              resizeMode="contain"
              style={styles.selectDown}
            />
          </TouchableOpacityView> */}
        </View>
        {colorId == "1" ? (
          <>
            <View style={styles.bottomContainer3}>
              <View>
                <AppText
                  type={TEN}
                  weight={BOLD}
                  color={BLACKOPACITY}
                >{`Price\n(${quote_currency})`}</AppText>
                <View style={styles.margin} />
                {lastSixObjects?.map((e) => {
                  return (
                    <AppText color={RED} type={TEN}>
                      {e.price.toFixed(numberSelect?.length)}
                    </AppText>
                  );
                })}
              </View>
              <View>
                <AppText
                  type={TEN}
                  weight={BOLD}
                  color={BLACKOPACITY}
                >{`Amount\n(${base_currency})`}</AppText>
                <View style={[styles.margin, { alignItems: "flex-end" }]} />
                {lastSixObjects?.map((e) => {
                  return (
                    <AppText type={TEN}>
                      {e?.quantity.toFixed(numberSelect.length)}
                    </AppText>
                  );
                })}
              </View>
            </View>
            <View style={styles.bottomContainer2}>
              <View>
                <View style={styles.margin} />
                {startingSixObjects?.map((e) => {
                  return (
                    <AppText color={GREEN} type={TEN}>
                      {e?.price.toFixed(numberSelect.length)}
                    </AppText>
                  );
                })}
              </View>
              <View>
                <View style={styles.margin} />
                {startingSixObjects?.map((e) => {
                  return (
                    <AppText type={TEN}>
                      {e?.quantity.toFixed(numberSelect.length)}
                    </AppText>
                  );
                })}
              </View>
            </View>
          </>
        ) : colorId == "2" ? (
          <View style={[styles.bottomContainer3, { flex: 1 }]}>
            <View>
              <AppText
                type={TEN}
                weight={BOLD}
                color={BLACKOPACITY}
              >{`Price\n(${quote_currency})`}</AppText>
              <View style={styles.margin} />
              {lastTenObjects?.map((e) => {
                return (
                  <AppText color={RED} type={TEN}>
                    {e?.price.toFixed(numberSelect.length)}
                  </AppText>
                );
              })}
            </View>
            <View>
              <AppText
                type={TEN}
                weight={BOLD}
                color={BLACKOPACITY}
              >{`Amount\n(${base_currency})`}</AppText>
              <View style={[styles.margin, { alignItems: "flex-end" }]} />
              {lastTenObjects?.map((e) => {
                return (
                  <AppText type={TEN}>
                    {e?.quantity.toFixed(numberSelect.length)}
                  </AppText>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.bottomContainer2}>
            <View>
              <AppText
                type={TEN}
                weight={BOLD}
                color={BLACKOPACITY}
              >{`Price\n(${quote_currency})`}</AppText>
              <View style={styles.margin} />
              {startingTenObjects?.map((e) => {
                return (
                  <AppText color={GREEN} type={TEN}>
                    {e?.price.toFixed(numberSelect.length)}
                  </AppText>
                );
              })}
            </View>
            <View>
              <AppText
                type={TEN}
                weight={BOLD}
                color={BLACKOPACITY}
              >{`Amount\n(${base_currency})`}</AppText>
              <View style={styles.margin} />
              {startingTenObjects?.map((e) => {
                return (
                  <AppText type={TEN}>
                    {e?.quantity.toFixed(numberSelect.length)}
                  </AppText>
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  };
  const changeColor = (id: any) => {
    setColorId(id);
    rbSheet?.current?.close();
  };
  const renderColor = () => {
    return (
      <View style={styles.flexRowContainer}>
        {ColorData?.map((item) => {
          return (
            <TouchableOpacityView
              onPress={() => changeColor(item.id)}
              style={[styles.colorBoxContainer]}
            >
              {item.multyColor ? (
                <>
                  <View style={styles.redBox} />
                  <View style={styles.greenBox} />
                </>
              ) : item.red ? (
                <View style={styles.onlyRedBox} />
              ) : (
                <View style={styles.onlyGreenBox} />
              )}
            </TouchableOpacityView>
          );
        })}
      </View>
    );
  };
  const selectNumber = (item: any) => {
    setNumberSelect(item.label);
  };
  const renderNumber = () => {
    return Data?.map((item) => {
      return (
        <TouchableOpacityView
          activeOpacity={0.5}
          onPress={() => selectNumber(item)}
          style={styles.selectContainer}
        >
          <AppText>{item.label}</AppText>
          {numberSelect == item.label ? (
            <FastImage
              source={checkIc}
              tintColor={colors.green}
              resizeMode="stretch"
              style={styles.checkImage}
            />
          ) : (
            <></>
          )}
        </TouchableOpacityView>
      );
    });
  };
  const selectNumberLimitOn = (item: any) => {
    setNumberLimit(item.name);
    if (item.name == "Limit") {
      setIsLimit(true);
    } else {
      setIsLimit(false);
    }
  };
  const renderLimit = () => {
    return DataLimit?.map((item) => {
      return (
        <TouchableOpacityView
          activeOpacity={0.5}
          onPress={() => selectNumberLimitOn(item)}
          style={styles.selectContainer}
        >
          <AppText type={THIRTEEN} weight={SEMI_BOLD}>
            {item.name}
          </AppText>
          {numberSelectLimit == item.name ? (
            <FastImage
              source={checkIc}
              tintColor={colors.white}
              resizeMode="contain"
              style={styles.checkImage}
            />
          ) : (
            <></>
          )}
        </TouchableOpacityView>
      );
    });
  };
  const [getIndex, setGetIndex] = useState(0);
  return (
    <AppSafeAreaView isMargin={false} source={HomeBg}>
      <KeyBoardAware>
        {coinHeader()}
        <View style={[styles.mainView]}>
          {buySellContainer()}
          {orders()}
        </View>
        <View
          style={{
            flex: 1,
            marginBottom: 70,
          }}
        >
          <AppText
            type={SIXTEEN}
            style={{ marginHorizontal: 5, alignSelf: "center" }}
          >
            Open Orders(0)
          </AppText>
          <View
            style={{
              borderBottomColor: "white",
              borderBottomWidth: StyleSheet.hairlineWidth,
            }}
          />

          <OpenOrders coinDetail={coinDetail} />
        </View>
      </KeyBoardAware>

      {/* <SpinnerSecond loading={loading} /> */}
      <CommonModal
        isVisible={isConfirm}
        onBackButtonPress={() => setIsConfirm(false)}
        title={"Are you sure you want to\nexecute this order?"}
        onPressNo={() => setIsConfirm(false)}
        onPressYes={() => {
          setIsConfirm(false);
          onConfirm();
        }}
      />
      <PopupModal visible={visible} handleVisiblity={handlePopup} />
      <PairModal showPair={showPair} setShowPair={setShowPair} />
      <RBSheet
        ref={rbSheet}
        closeOnDragDown={true}
        closeOnPressMask={true}
        height={80}
        animationType="none"
        customStyles={{
          container: {
            backgroundColor: colors.inputBorder,
            height: 80,
            borderRadius: 10,
          },
          wrapper: {
            backgroundColor: "#0006",
          },
          draggableIcon: {
            backgroundColor: "transparent",
          },
        }}
      >
        {renderColor()}
      </RBSheet>
      <RBSheet
        ref={rbSheetNumber}
        closeOnDragDown={true}
        closeOnPressMask={true}
        height={300}
        animationType="none"
        customStyles={{
          container: {
            backgroundColor: colors.inputBorder,
            height: 240,
            borderRadius: 10,
            paddingHorizontal: universalPaddingHorizontal,
          },
          wrapper: {
            backgroundColor: "#0006",
          },
          draggableIcon: {
            backgroundColor: "transparent",
          },
        }}
      >
        {renderNumber()}
      </RBSheet>
      <RBSheet
        ref={rbSheetlimit}
        closeOnDragDown={true}
        closeOnPressMask={true}
        height={130}
        animationType="none"
        customStyles={{
          container: {
            backgroundColor: colors.inputBorder,
            height: 200,
            borderRadius: 10,
            paddingHorizontal: universalPaddingHorizontal,
          },
          wrapper: {
            backgroundColor: "#0006",
          },
          draggableIcon: {
            // backgroundColor: 'transparent',
            width: 120,
          },
        }}
      >
        {renderLimit()}
      </RBSheet>
    </AppSafeAreaView>
  );
};
export default BtcCoinDetails;
const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "space-between",
  },
  bedge: {
    height: 25,
    borderRadius: 5,
    backgroundColor: colors.green,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    width: 70,
    // paddingHorizontal: 5,
  },
  star: {
    height: 25,
    width: 25,
    marginStart: 20,
  },
  nameContainer: {
    flexDirection: "row",
  },
  historyIcon: {
    height: 25,
    width: 25,
    marginEnd: 20,
  },
  graphIcon: {
    height: 30,
    width: 30,
  },
  buttonContainer: {
    flexDirection: "row",
    backgroundColor: colors.blackFive,
    marginTop: 20,
    borderRadius: 10,
  },
  buyButton: {
    flex: 1,
    backgroundColor: colors.transparent,
    // borderTopRightRadius: 0,
    // borderBottomRightRadius: 0,
    borderRadius: 10,
    height: smallButtonHeight,
  },
  buyButtonActive: {
    flex: 1,
    backgroundColor: colors.green,
    // borderTopRightRadius: 5,
    // borderBottomRightRadius: 5,
    borderRadius: 10,
  },
  sellButton: {
    flex: 1,
    backgroundColor: colors.blackFive,
    // borderTopLeftRadius: 0,
    // borderBottomLeftRadius: 0,
    height: smallButtonHeight,
    // borderRadius: 5,
    borderRadius: 10,
  },
  sellButtonActive: {
    flex: 1,
    backgroundColor: colors.red,
    // borderTopLeftRadius: 5,
    // borderBottomLeftRadius: 5,
    borderRadius: 10,
  },
  buySellTitle: {
    fontSize: 14,
    color: colors.white,
    // fontWeight:"600",
    fontFamily: fontFamilySemiBold,
  },

  limitButtonActive: {
    flex: 1,
    backgroundColor: colors.buttonBg,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    borderRadius: 5,
  },
  marketButtonActive: {
    flex: 1,
    backgroundColor: colors.buttonBg,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
    borderRadius: 5,
  },
  limitMarketTitle: {
    fontSize: 12,
    color: colors.white,
  },
  buttonContainer2: {
    flexDirection: "row",
    marginTop: 15,
    justifyContent: "space-between",
    alignItems: "center",
  },
  percentageContainer: {
    height: smallButtonHeight,
    padding: universalPaddingHorizontal,
    alignItems: "center",
    justifyContent: "center",
    width: "23%",
    backgroundColor: colors.blackFive,
    borderRadius: 5,
  },
  divider: {
    height: 0.4,
    backgroundColor: colors.thirdBg,
    marginVertical: 5,
  },
  bottomContainer: {
    // flexDirection: 'row',
    flex: 1,
    marginStart: 10,
    marginTop: 20,
  },
  bottomContainer2: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-between",
    // marginEnd: 5,
  },
  bottomContainer3: {
    flexDirection: "row",
    justifyContent: "space-between",
    // marginStart: 5,
  },
  margin: {
    marginTop: 10,
  },
  mainButton: {
    marginVertical: universalPaddingHorizontalHigh,
  },
  mainButtonTitle: {
    color: colors.white,
  },
  bottomContainer4: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  addMoreButton: {
    padding: 5,
    marginStart: 10,
  },
  addMore: {
    height: 15,
    width: 15,
    // marginBottom: 5,
    // bottom: 12,
  },
  mainView: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputContainer: {
    marginTop: 5,
    backgroundColor: colors.blackFive,
    borderWidth: 0,
    fontSize: 12,
    // borderColor: colors.borderColor,
    // borderWidth: borderWidth,
  },
  inputContainer2: {
    marginTop: 5,
  },
  totalBox: {
    marginVertical: 10,
    backgroundColor: colors.buttonBgDisabled,
    borderRadius: 5,
    padding: 4,
    alignItems: "center",
  },
  colorBoxContainer: {
    width: 41,
    height: 35,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  redBox: {
    width: 20,
    height: 10,
    backgroundColor: colors.red,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  greenBox: {
    width: 20,
    height: 10,
    backgroundColor: colors.green,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  flexRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: universalPaddingHorizontal,
  },
  onlyRedBox: {
    width: 20,
    height: 20,
    backgroundColor: colors.red,
    borderRadius: 50,
  },
  onlyGreenBox: {
    width: 20,
    height: 20,
    backgroundColor: colors.green,
    borderRadius: 50,
  },
  numberSelectContainer: {
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.white,
    height: 35,
    width: 80,
    marginBottom: 10,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 5,
    flexDirection: "row",
  },
  pairNameContainer: {
    borderRadius: 5,
    borderWidth: 1,
    backgroundColor: colors.black,
    borderColor: colors.disabledText,
    height: 46,
    width: 120,
    marginBottom: 10,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 6,
    flexDirection: "row",
  },
  selectDown: {
    height: 5,
    width: 10,
  },
  selectContainer: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    // borderWidth: 1,
    // borderColor: colors.white,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
    justifyContent: "space-between",
  },
  checkImage: {
    height: 16,
    width: 16,
  },
  dropDownContainer: {
    marginTop: 15,
    height: 40,
    borderWidth: borderWidth,
    borderColor: colors.inputBorder,
    borderRadius: 5,
    paddingHorizontal: universalPaddingHorizontal,
    backgroundColor: colors.blackFive,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // paddingVertical:
  },
});
