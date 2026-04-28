import {
  Dimensions,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { AppText, SEMI_BOLD, YELLOW } from "../../shared";
import FastImage from "react-native-fast-image";
import {
  externalLinkIcon,
  folder,
  rectangleIcon,
  subscribe,
  trxIcon,
} from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";
import { ARBITORY_SCREEN } from "../../navigation/routes";
import { useNavigation } from "@react-navigation/native";
import EarningModal from "../../shared/components/BuyPackageModal";
import { useDispatch } from "react-redux";
import {
  getWalletType,
  subscribeEarningPackage,
} from "../../actions/walletActions";
import { useAppSelector } from "../../store/hooks";
import { BASE_URL } from "../../helper/Constants";
import BuyPackageModal from "../../shared/components/BuyPackageModal";
import OrderDetailsModal from "../../shared/components/OrderDetailsModal";
import { formatDate, formatToLakh } from "../../helper/utility";
import { colors } from "../../theme/colors";
import CustomDots from "../home/CustomDots";
import { SpinnerSecond } from "../../shared/components/SpinnerSecond";

const EarningMain = ({ packageList, theme }) => {
  const dispatch = useDispatch();
  const listRef = useRef(null);
  const WalletTypes = useAppSelector((state) => state.wallet.walletTypes);
  const [modalVisible, setModalVisible] = useState(false);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [subscribeData, setSubscribeData] = useState("");
  const [packages, setPackage] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    dispatch(getWalletType());
  }, []);

  const handlePackages = (data) => {
    setPackage(data);
    setModalVisible(true);
  };

  const handleNext = (data) => {
    const today = new Date();
    const subscriptionDate = formatDate(today);
    const redemptionDate = formatDate(
      new Date(
        today.getTime() + data?.package?.duration_days * 24 * 60 * 60 * 1000
      )
    );
    setSubscribeData({ ...data, subscriptionDate, redemptionDate });
    // setSubscribeData(data);
    // setModalVisible(false);
    setShowOrderDetail(true);
  };

  const handeStepBack = () => {
    setShowOrderDetail(false);
    setModalVisible(true);
  };


  const closeAllModal = () => {
    setShowOrderDetail(false);
    setModalVisible(false);
  }
  const buyEarningPackage = (data) => {
    dispatch(subscribeEarningPackage(data, closeAllModal));
  };

  const CurrencyCard = ({ item }) => {
    console.log(item, "item")
    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: theme !== "Dark" ? "#fff" : "#18191DB2" },
        ]}
        activeOpacity={0.7}
        onPress={() => handlePackages(item)}
      >
        <FastImage
          resizeMode="contain"
          style={styles.graph}
          source={rectangleIcon}
        />
        <View style={{ borderRadius: 50, overflow: "hidden" }}>
          <FastImage
            source={{ uri: BASE_URL + item?.icon_path }}
            style={{ width: 30, height: 30 }}
            resizeMode="cover"
          />
        </View>
        <AppText
          style={[styles.title, { color: theme !== "Dark" ? "#222" : "#fff" }]}
        >
          {item?.currency}{" "}
          <AppText style={{ fontSize: 11, fontWeight: "500" }}>
            ({item?.currency_fullname})
          </AppText>
        </AppText>
        <View style={{ flexDirection: "row" }}>
          <AppText color={YELLOW} weight={SEMI_BOLD}>
            {formatToLakh(item?.min_amount)}
          </AppText>
          <AppText color={YELLOW}> - </AppText>
          <AppText color={YELLOW} weight={SEMI_BOLD}>
            {formatToLakh(item?.max_amount)}
          </AppText>
        </View>
        <AppText style={styles.subtitle} color={YELLOW} weight={SEMI_BOLD}>
          {item?.return_percentage_yearly}%/Annum
        </AppText>
        <AppText style={styles.subtitle} color={YELLOW} weight={SEMI_BOLD}>
          {item?.return_percentage_monthly}%/Month
        </AppText>
        <TouchableOpacity>
          {/* <Text >Subscribe</Text> */}
          <TouchableOpacity  onPress={() => handlePackages(item)}>
          <FastImage source={subscribe} style={{ width: 80, height: 20 }} resizeMode="contain" />
          </TouchableOpacity>
         
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };
  return (
    <View
      style={{
        marginTop: "10%",
        backgroundColor: theme !== "Dark" ? "#F5F5F5" : "transparent",
      }}
    >
     
      {/* {packageList?.map((item) => {
        return (
          <> */}
            <FlatList
              contentContainerStyle={{ paddingHorizontal: 0, marginTop: 10 }}
              data={packageList}
              onSnapToItem={(index) => setActiveIndex(index)}
              ref={listRef}
              showsHorizontalScrollIndicator={false}
              // horizontal
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }) => <CurrencyCard item={item} />}
            />
            {/* <View style={styles.dotContainer}>
              {item?.slice(0, 6)?.map((_, index) => (
                <CustomDots
                  key={index}
                  index={index}
                  activeIndex={activeIndex}
                />
              ))}
            </View> */}
          {/* </>
        ); */}
      {/* })} */}

      <BuyPackageModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        packages={packages}
        onNext={handleNext}
        theme={theme}
        WalletTypes={WalletTypes}
      />
      <OrderDetailsModal
        visible={showOrderDetail}
        onClose={() => setShowOrderDetail(!showOrderDetail)}
        subscribeData={subscribeData}
        onBack={handeStepBack}
        onBuy={buyEarningPackage}
      />
      <SpinnerSecond />
    </View>
  );
};

export default EarningMain;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.buttonBg,
    borderRadius: 10,
    margin: 6,
    padding: 15,
    alignItems: "center",
    // backgroundColor: "#fff",
    shadowColor: "#000",
    elevation: 2,
    overflow: "hidden",
    // marginTop: 30
    // width:Width/3
  },
  iconCircle: (color) => ({
    backgroundColor: color,
    width: 30,
    height: 30,
    borderRadius: 15,
    marginBottom: 8,
  }),
  title: {
    fontWeight: "bold",
    fontSize: 13,
    marginBottom: 4,
    textAlign: "center",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 12,
    // color: "#666",
    marginBottom: 3,
  },
  subscribeButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  subscribeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  graph: {
    position: "absolute",
    right: -21,
    top: 0,
    height: 100,
    width: 100,
    borderRadius: 20,
    // zIndex: 999,
  },
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
});
