import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Animated,
  Dimensions,
  Easing,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import Ionicons from "react-native-vector-icons/Ionicons";
import Modal from "react-native-modal";
import AntDesign from "react-native-vector-icons/AntDesign";
import { useAppSelector } from "../../store/hooks";
import FastImage from "react-native-fast-image";
import { closeIcon, searchIcon } from "../../helper/ImageAssets";
import { colors } from "../../theme/colors";
import NavigationService from "../../navigation/NavigationService";
import { WALLET_SCREEN } from "../../navigation/routes";
const { width } = Dimensions.get("window");

const ANIM_DURATION = 300;

const TradingDataModal = ({ visible, onClose, setCurrency, isDark, theme }) => {
  const tabs = ["Favorites", "USDT", "BTC"];
  const filters = ["All", "New", "AI Agents", "DePIN"];
  const coinData = useAppSelector((state) => state.home.coinPairs);
  const [active, setActive] = useState(1);
  const [selectedTab, setSelectedTab] = useState("Favorites");
  const [isClosing, setIsClosing] = useState(false);
  const closedByUsRef = useRef(false);

  const translateX = useRef(new Animated.Value(-width)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  const darkMode = typeof isDark === "boolean" ? isDark : theme === "Dark";
  const modalBg = darkMode ? "#0F141C" : "#fff";
  const textColor = darkMode ? "#fff" : "#222";
  const subTextColor = darkMode ? "rgba(255,255,255,0.60)" : "#9D9D9D";
  const borderColor = darkMode ? "rgba(255,255,255,0.14)" : "#ccc";
  const rowBorderColor = darkMode ? "rgba(255,255,255,0.08)" : "#eee";
  const inputBg = darkMode ? "rgba(255,255,255,0.06)" : "transparent";
  const iconTint = darkMode ? colors.white : colors.black;
  const searchTint = darkMode ? "rgba(255,255,255,0.70)" : "#595757";

  const runCloseAnimation = (callback) => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -width,
        duration: ANIM_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: ANIM_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished && callback) callback();
    });
  };

  useEffect(() => {
    if (visible) {
      closedByUsRef.current = false;
      setIsClosing(false);
      overlayOpacity.setValue(1);
      translateX.setValue(-width);
      Animated.timing(translateX, {
        toValue: 0,
        duration: ANIM_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      if (closedByUsRef.current) {
        closedByUsRef.current = false;
        return;
      }
      setIsClosing(true);
      runCloseAnimation(() => {
        setIsClosing(false);
        onClose();
      });
    }
  }, [visible]);

  const showModal = visible || isClosing;

  const dummyData = Array(20).fill({
    pair: "XRP",
    coin: "USDT",
    price: "454,758.10",
    change: "-1.24%",
    vol: "17.55M USD",
  });

  const handleChangePair = (item) => {
    setCurrency(item);
    if (isClosing) return;
    closedByUsRef.current = true;
    setIsClosing(true);
    runCloseAnimation(() => {
      setIsClosing(false);
      onClose();
    });
  };

  // const changeSymbol = (symbol) => {
  //   if (webview.current) {
  //     console.log(symbol, "symbol", webview);
  //     webview.current.postMessage(
  //       JSON.stringify({
  //         type: "CHANGE_SYMBOL",
  //         symbol: symbol
  //       })
  //     );
  //   }
  // };

  const [selectedFilter, setSelectedFilter] = useState(filters[0]); // default to "All"

  const handleRequestClose = () => {
    if (isClosing) return;
    closedByUsRef.current = true;
    setIsClosing(true);
    runCloseAnimation(() => {
      setIsClosing(false);
      onClose();
    });
  };

  return (
    <Modal
      transparent={true}
      visible={showModal}
      animationIn="fadeIn"
      animationOut="fadeOut"
      animationInTiming={0}
      animationOutTiming={0}
      onBackdropPress={handleRequestClose}
      style={[
        styles.modalContainer,
        { backgroundColor: darkMode ? "rgba(0,0,0,0.45)" : "rgba(0,0,70,0.2)" },
      ]}
    >
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Animated.View
          style={[
            styles.modal,
            { transform: [{ translateX }], backgroundColor: modalBg, borderRightWidth: darkMode ? 1 : 0, borderRightColor: rowBorderColor },
          ]}
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: textColor }]}>Margin</Text>
              <TouchableOpacity onPress={handleRequestClose}>
                <FastImage
                  source={closeIcon}
                  resizeMode="contain"
                  style={{ width: 20, height: 20 }}
                  tintColor={iconTint}
                />
              </TouchableOpacity>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 0.6,
                borderColor,
                paddingHorizontal: 10,
                // paddingVertical: 8,
                borderRadius: 20,
                marginVertical: 20,
                backgroundColor: inputBg,
              }}
            >
              {/* <AntDesign name={'search1'} color={'#595757'} size={16}/> */}
              <FastImage
                source={searchIcon}
                resizeMode="contain"
                style={{ width: 16, height: 16 }}
                tintColor={searchTint}
              />
              <TextInput
                placeholder="Search Currency Pairs"
                placeholderTextColor={darkMode ? "rgba(255,255,255,0.45)" : "#888"}
                style={[styles.searchInput, { color: darkMode ? "#fff" : "#000" }]}
              />
            </View>

            {/* <View style={styles.tabs}> */}
            {/* {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tab,
            selectedTab === tab && styles.selectedTab, // Add conditional style
          ]}
          onPress={() => setSelectedTab(tab)}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === tab && styles.selectedTabText,
            ]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))} */}
            {/* </View> */}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
            >
              {/* {filters.map((f) => {
    const isSelected = selectedFilter === f;
    return (
      <TouchableOpacity
        key={f}
        onPress={() => setSelectedFilter(f)}
        style={[
          styles.filterBtn,
          isSelected && styles.filterBtnSelected,
        ]}
      >
        <Text style={[styles.filterText, isSelected && styles.filterTextSelected]}>
          {f}
        </Text>
      </TouchableOpacity>
    );
  })} */}
            </ScrollView>

            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>
                Pairs/Vol
              </Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                Price / 24h Change
              </Text>
            </View>

            {coinData.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.row, { borderColor: rowBorderColor }]}
                onPress={() => handleChangePair(item)}
              >
                <View style={{ width: "50%" }}>
                  <Text style={[styles.cell, { color: darkMode ? "#fff" : "#000" }]}>
                    {item?.base_currency}
                    <Text style={{ fontWeight: "400", color: subTextColor }}>
                      /{item?.quote_currency}
                    </Text>
                  </Text>
                  <Text style={[styles.vol, { color: subTextColor }]}>{item.volume}</Text>
                </View>

                <View style={{ flex: 1, width: "50%", alignItems: "flex-end" }}>
                  <Text
                    style={[
                      styles.cell,
                      { fontSize: 14, fontWeight: "bold", color: darkMode ? "#fff" : "#000" },
                    ]}
                  >
                    {item.buy_price}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: item?.change < 0 ? colors.red : colors.green,
                    }}
                  >
                    {item?.change}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default TradingDataModal;
const styles = StyleSheet.create({
  modalContainer: {
    margin: 0,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    backgroundColor: "rgba(0,0,70,0.2)",
  },
  overlay: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  modal: {
    width: "85%",
    height: "100%",
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
  },
  searchInput: {
    // borderWidth: 1,
    // borderColor: '#ccc',
    paddingHorizontal: 10,
    // paddingVertical: 8,
    borderRadius: 8,
    fontSize: 14,
    // marginBottom: 12,
    color: "#000",
    width: "90%",
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 12,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    // backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  tabText: {
    color: "#000",
    fontSize: 14,
  },
  filterScroll: {
    marginBottom: 12,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: "#EBEAE7",
    marginRight: 8,
  },
  filterText: {
    fontSize: 13,
    color: "#000",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableHeaderText: {
    fontWeight: "bold",
    color: "#9D9D9D",
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: "#eee",
    justifyContent: "space-between",
    // alignItems:"center"
  },
  cell: {
    fontSize: 16,
    color: "#000",
    fontWeight: "700",
  },
  vol: {
    fontSize: 12,
    color: "#9D9D9D",
  },
  selectedTab: {
    // backgroundColor: '#FFD700', // or any highlighted color like yellow
    color: "'#F3BB2B'",
  },
  tabText: {
    fontSize: 14,
    color: "#000",
  },
  selectedTabText: {
    fontWeight: "bold",
    color: "'#F3BB2B'",
  },
  filterBtnSelected: {
    backgroundColor: "#fff",
    borderColor: "#FFA500",
    borderWidth: 1, // orange border
  },
  filterText: {
    fontSize: 13,
    color: "#000",
  },
  filterTextSelected: {
    color: "'#F3BB2B'",
    fontWeight: "bold",
  },
});
