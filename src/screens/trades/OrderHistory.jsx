import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import moment from "moment";
import {
  AppSafeAreaView,
  AppText,
  Button,
  FIFTEEN,
  FOURTEEN,
  Header,
  SEMI_BOLD,
  SIXTEEN,
  THIRTEEN,
  TWELVE,
  Toolbar,
  WHITE,
  YELLOW,
} from "../../shared";
import { colors } from "../../theme/colors";
import { useSelector } from "react-redux";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { getPastOrders } from "../../actions/homeActions";
import { Screen } from "../../theme/dimens";
import SpaceBetweenView from "../../shared/components/SpaceBetweenView";
import { twoFixedTwo } from "../../helper/utility";
import { HomeBg } from "../../helper/ImageAssets";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";

const OrderHistory = () => {
  const dispatch = useAppDispatch();
  const route = useRoute();
  const currencies = route?.params?.data;
  const name = route?.params?.currencyName;
  const pastOrder = useAppSelector((state) => state.home.pastOrders);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    dispatch(getPastOrders(currencies));
  }, []);
  const RenderTabBarAuth = (props) => {
    const routes = [
      { key: "first", title: 'Past Orders'},
      { key: "second", title: 'Trade History'},
    ];
    return (
      <View style={styles.tabBarMain}>
        {routes.map((route, i) => {
          return (
            <TouchableOpacityView
              key={i}
              onPress={() => props?.setIndex(i)}
            >
              <AppText
                type={FOURTEEN}
                color={i === props?.index ? YELLOW : WHITE}
              >
                {route.title}
              </AppText>
            </TouchableOpacityView>
          );
        })}
      </View>
    );
  };

  return (
    <AppSafeAreaView source={HomeBg}>
      {/* <Header /> */}
      <Toolbar
        isLogo={false}
        isSecond
        title={`${name?.firstCoin}/${name?.secondCoin}`}
      />
      <View style={{ flex: 1 }}>
      <RenderTabBarAuth index={index} setIndex={setIndex} />
        <View
            style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <AppText type={SIXTEEN}>Nothing to show.</AppText>
           </View>
      </View>
    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  tabBarMain: {
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:"space-around",
    marginTop: 20,
    borderBottomColor:"white",
    borderWidth: StyleSheet.hairlineWidth
  },
});

export default OrderHistory;
