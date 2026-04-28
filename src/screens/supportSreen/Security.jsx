import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
} from 'react-native';
import React, { useState } from 'react';
import { appBg } from '../../helper/ImageAssets';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';

const Security = () => {
  const navigation = useNavigation();
  const [selectedOption, setSelectedOption] = useState('none');

 const [settings, setSettings] = useState({
    authenticator: false,
    mobile: false,
    email: false,
    none: true,
  });


   const toggleSwitch = (key) => {
    const updatedSettings = {
      ...settings,
      [key]: !settings[key],
    };

    // If turning ON any key except 'none', 'none' should be OFF
    if (key !== 'none' && updatedSettings[key]) {
      updatedSettings.none = false;
    }

    // If turning ON 'none', all others should be OFF
    if (key === 'none' && updatedSettings.none) {
      updatedSettings.authenticator = false;
      updatedSettings.mobile = false;
      updatedSettings.email = false;
    }

    setSettings(updatedSettings);
  };
  const options = [
    { key: 'authenticator', label: 'Authenticator App' },
    { key: 'mobile', label: 'Mobile OTP' },
    { key: 'email', label: 'Email OTP' },
    { key: 'none', label: 'None' },
  ];

  return (
    <ImageBackground source={appBg} style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color={'#222'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Two Factor Authentication</Text>
      </View>

      <View style={styles.card}>
        {options.map((item) => (
          <TouchableOpacity
            key={item.key}
            onPress={() => setSelectedOption(item.key)}
            style={[
              styles.option,
              selectedOption === item.key && styles.selectedOption,
            ]}
            activeOpacity={0.8}
          >
            <Text style={styles.optionText}>{item.label}</Text>
             <Switch
              value={settings[item.key]}
              onValueChange={() => toggleSwitch(item.key)}
              trackColor={{ false: '#ccc', true: '#F3BB2B' }}
              thumbColor={settings[item.key] ? '#fff' : '#f4f3f4'}
              ios_backgroundColor="#ccc"
            />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.saveBtn}>
        <Text style={styles.saveText}>Save Settings</Text>
      </TouchableOpacity>
    </ImageBackground>
  );
};

export default Security;

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width:"80%",
    justifyContent:"space-between"
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 16,
    color: '#222',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    // elevation: 2,
    borderWidth:1,
    borderColor:"#D4D4D4"
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    // borderBottomWidth: 0.5,
    // borderBottomColor: '#eee',
    borderRadius: 8,
    marginBottom: 6,
    borderWidth:1,
    borderColor:"#D4D4D4"
  },
  selectedOption: {
    // borderWidth: 2,
    // borderColor: '#0B82E6',
    backgroundColor: '#F4F8FF',
  },
  optionText: {
    fontSize: 14,
    color: '#222',
  },
  saveBtn: {
    backgroundColor: '#FFCE52',
    paddingVertical: 14,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 30,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
});
