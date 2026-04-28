import { View, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import FastImage from "react-native-fast-image";
import {
  bell_ic,
  defaultPic,
  headPhoneIcon,
  searchIcon,
} from "../helper/ImageAssets";
import { colors } from "../theme/colors";
import NavigationService from "../navigation/NavigationService";
import { NOTIFICATION_SCREEN, SEARCH_SCREEN } from "../navigation/routes";
import { useAppSelector } from "../store/hooks";
import { IMAGE_BASE_URL } from "../helper/Constants";
import { useTheme } from "../hooks/useTheme";

const HeaderTop = () => {
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth.userData);
  
  return (
    <View style={styles.headerView}>
      <TouchableOpacity 
        onPress={() => NavigationService.navigate('ProfileDrawer')} 
        style={[
          styles.avatarContainer, 
          { borderColor: themeColors.border }
        ]}
      >
        <FastImage
          source={userData?.profilepicture ? { uri: IMAGE_BASE_URL + userData?.profilepicture } : defaultPic}
          resizeMode="cover"
          style={styles.avatar}
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[
          styles.searchView, 
          { 
            borderColor: themeColors.border,
            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" 
          }
        ]} 
        onPress={() => NavigationService.navigate(SEARCH_SCREEN)}
      >
        <FastImage
          source={searchIcon}
          tintColor={themeColors.secondaryText}
          resizeMode="contain"
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search"
          placeholderTextColor={themeColors.secondaryText}
          style={[styles.searchInput, { color: themeColors.text }]}
          editable={false}
        />
      </TouchableOpacity>

      <View style={styles.rightIcons}>
        <TouchableOpacity onPress={() => NavigationService.navigate(NOTIFICATION_SCREEN)}>
          <FastImage
            source={bell_ic}
            tintColor={themeColors.text}
            resizeMode="contain"
            style={styles.bellIcon}
          />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => NavigationService.navigate("Support")}>
          <FastImage
            source={headPhoneIcon}
            tintColor={themeColors.text}
            resizeMode="contain"
            style={styles.supportIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HeaderTop;

const styles = StyleSheet.create({
  headerView: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 12,
    alignItems: "center",
    marginVertical: 10,
  },
  avatarContainer: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
  },
  avatar: {
    width: 32,
    height: 32,
  },
  searchView: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.8,
    width: "65%",
    borderRadius: 50,
    height: 35,
    paddingHorizontal: 12,
  },
  searchIcon: {
    width: 14,
    height: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 13,
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bellIcon: {
    width: 22,
    height: 22,
  },
  supportIcon: {
    width: 20,
    height: 20,
  },
});
