import React, { useEffect, useState } from "react";
import {
  AppSafeAreaView,
  AppText,
  BLACK,
  Button,
  SECOND,
  SEMI_BOLD,
  TEN,
  THIRTEEN,
  Toolbar,
  TWELVE,
  YELLOW,
} from "../../shared";
import {
  FlatList,
  StyleSheet,
  View,
  Linking,
  TouchableOpacity,
} from "react-native";
import { commonStyles } from "../../theme/commonStyles";
import {
  universalPaddingHorizontal,
  universalPaddingHorizontalHigh,
} from "../../theme/dimens";
import { useAppSelector } from "../../store/hooks";
import moment from "moment";
import { colors } from "../../theme/colors";
import { checkValue } from "../../helper/utility";
import {
  appBg,
  loginDarkBg,
  bell_ic,
  externalLinkIcon,
  HomeBg,
  folder,
  NO_NOTIFICATION_ICON,
  NO_NOTIFICATION_ICON_LIGHT,
} from "../../helper/ImageAssets";
import { useDispatch } from "react-redux";
import { getNotificationList, markAsRead } from "../../actions/homeActions";
import FastImage from "react-native-fast-image";
import { useTheme } from "../../hooks/useTheme";
import NotificationSkeleton from "./NotificationSkeleton";

const ListEmptyComponent = () => {
  const { colors: themeColors, isDark } = useTheme();
  return (
    <View style={commonStyles.center}>
      <FastImage
        source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
        resizeMode="contain"
        style={{ width: 80, height: 80 }}
        tintColor={isDark ? themeColors.text : undefined}
      />
    </View>
  );
};

const Notification = () => {
  const dispatch = useDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const notificationList = useAppSelector(
    (state) => state.home.notificationList
  );
  const languages = useAppSelector((state) => {
    return state.account.languages;
  });
  const [contentLoading, setContentLoading] = useState(true);

  useEffect(() => {
    dispatch(getNotificationList());
  }, []);

  useEffect(() => {
    if (Array.isArray(notificationList)) {
      setContentLoading(false);
    }
  }, [notificationList]);

  const handleMarkAsRead = (id) => {
    dispatch(
      markAsRead({
        notificationId: id,
      })
    );
  };

  const renderItem = ({ item }) => {
    return (
      <View
        style={[
          styles.renderContainer,
          {
            backgroundColor: themeColors.card,
            borderColor: themeColors.border,
          },
        ]}
      >
        <View style={styles.renderContainerSecond}>
          <View style={styles.renderContainerThird}>
            <AppText weight={SEMI_BOLD} type={THIRTEEN} color={themeColors.text}>
              <View
                style={{
                  backgroundColor: item?.isSeen ? colors.grey : colors.green,
                  width: 10,
                  height: 10,
                  borderRadius: 50,
                }}
              ></View>{" "}
              {item.title}
            </AppText>

            <AppText type={TWELVE} color={themeColors.secondaryText}>{item?.message}</AppText>

            <View style={{ gap: 10, marginTop: 5 }}>
              {item?.link && (
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                  onPress={() => {
                    Linking.openURL(item?.link);
                  }}
                >
                  <AppText type={TWELVE} color={themeColors.button}>
                    Learn more
                  </AppText>
                  <FastImage
                    source={externalLinkIcon}
                    resizeMode="contain"
                    style={{ width: 10, height: 10 }}
                    tintColor={themeColors.button}
                  />
                </TouchableOpacity>
              )}

              {!item?.isSeen && (
                <Button
                  children={"Mark as read"}
                  titleStyle={{ color: themeColors.buttonText, fontSize: 10 }}
                  containerStyle={{ width: "35%", height: 30, backgroundColor: themeColors.button }}
                  onPress={() => handleMarkAsRead(item?._id)}
                />
              )}

              <AppText color={themeColors.secondaryText} type={TWELVE} weight={SEMI_BOLD}>
                {moment(item.createdAt).fromNow()}
              </AppText>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
      <Toolbar
        isSecond
        title={checkValue(languages?.notification_one)}
        style={{ width: "62%" }}
      />
      {contentLoading ? (
        <NotificationSkeleton />
      ) : (
        <FlatList
          data={notificationList}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={commonStyles.flexGrow}
        />
      )}
    </AppSafeAreaView>
  );
};

export default Notification;
const styles = StyleSheet.create({
  renderContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    marginHorizontal: 10,
    paddingVertical: universalPaddingHorizontal,
    marginVertical: universalPaddingHorizontal,
    borderWidth: 1,
    borderRadius: 20,
  },
  icon: {
    height: 50,
    width: 50,
    marginEnd: 10,
  },
  renderContainerSecond: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  renderContainerThird: {
    flex: 1,
  },
});
