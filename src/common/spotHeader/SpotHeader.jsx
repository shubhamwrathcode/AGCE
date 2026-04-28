import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import FastImage from 'react-native-fast-image'
import { candle, menu } from '../../helper/ImageAssets'
import TradingDataModal from '../TradingDataModal/TradingDataModal'
import { colors } from '../../theme/colors'
import { AppText } from '../AppText'
import { toFixedThree } from '../../helper/utility'

const SpotHeader = ({ title, setCurrency, theme, isDark, change, onCandlePress }) => {
  const [modalVisible, setModalVisible] = useState(false)

  const darkMode = typeof isDark === "boolean" ? isDark : theme === "Dark";
  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity style={[styles.miniContainer,]} onPress={() => setModalVisible(true)} activeOpacity={0.7}>
          <FastImage source={menu} style={styles.menu} resizeMode='contain' tintColor={darkMode ? colors.white : colors.black} />
          <AppText style={[styles.title, { color: darkMode ? "#fff" : "#222" }]}>{title}</AppText>
          <AppText style={{ color: change < 0 ? colors.red : colors.green }}>{toFixedThree(change)}%</AppText>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.miniContainer, {}]} onPress={onCandlePress} activeOpacity={0.7}>
          <FastImage source={candle} style={styles.strr} resizeMode='contain' tintColor={darkMode ? colors.white : colors.black} />
        </TouchableOpacity>
      </View>
      <TradingDataModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        setCurrency={setCurrency}
        isDark={darkMode}
      />
    </>
  )
}

export default SpotHeader

const styles = StyleSheet.create({
  container: {
    // backgroundColor:"#F5F5F5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingHorizontal: 15
  },
  miniContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  strr: {
    height: 20,
    width: 20,
    marginRight: 5
  },
  menu: {
    height: 42,
    width: 36
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    marginHorizontal: 10
  },
  percent: {
    // color:"#E86161"
  }
})
