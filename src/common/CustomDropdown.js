import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { colors } from '../theme/colors';
import { AppText, ELEVEN, SEMI_BOLD, THIRTEEN } from './AppText';
import FastImage from 'react-native-fast-image';
import { DOWN_ARROW, tick } from '../helper/ImageAssets';
import { useTheme } from '../hooks/useTheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CustomDropdown = ({ data = [], onSelect, selected }) => {
  const { colors: themeColors, isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef(null);

  const handleSelect = (item) => {
    onSelect(item);
    setVisible(false);
  };

  const openDropdown = () => {
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownPos({
        top: y + height + 2,
        left: x,
        width: width,
      });
      setVisible(true);
    });
  };

  const isPlaceholder = !selected || selected.toLowerCase().includes("select");

  return (
    <View>
      <TouchableOpacity
        ref={buttonRef}
        style={[
          styles.dropdownTrigger, 
          { 
            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
            borderColor: themeColors.border,
            borderWidth: 1 
          }
        ]}
        onPress={openDropdown}
        activeOpacity={0.8}
      >
        <AppText
          type={THIRTEEN}
          style={{
            flex: 1,
            color: isPlaceholder ? themeColors.secondaryText : themeColors.text
          }}
        >
          {selected || 'Select option'}
        </AppText>
        <FastImage
          source={DOWN_ARROW}
          style={[styles.arrow, { transform: [{ rotate: visible ? '180deg' : '0deg' }] }]}
          tintColor={themeColors.text}
          resizeMode='contain'
        />
      </TouchableOpacity>

      <Modal transparent visible={visible} animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
                borderWidth: 1,
                top: dropdownPos.top,
                left: dropdownPos.left,
                width: dropdownPos.width,
              }
            ]}
          >
            <FlatList
              data={data}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  style={[
                    styles.option,
                    { borderBottomColor: themeColors.border }
                  ]}
                >
                  <AppText
                    type={ELEVEN}
                    style={{ color: themeColors.text }}
                    weight={selected === item ? SEMI_BOLD : undefined}
                  >
                    {item}
                  </AppText>
                  {selected === item && (
                    <FastImage source={tick} style={{ width: 12, height: 12 }} resizeMode="contain" tintColor={themeColors.button} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default CustomDropdown;

const styles = StyleSheet.create({
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 8,
  },
  arrow: {
    width: 10,
    height: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalContent: {
    position: 'absolute',
    borderRadius: 12,
    paddingVertical: 4,
    maxHeight: 250,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
});
