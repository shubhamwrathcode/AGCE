import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import React, { useState } from 'react';
import { appBg } from '../../helper/ImageAssets';
import KycHeader from '../../shared/components/kycHeader/KycHeader';
import NavigationService from '../../navigation/NavigationService';
import InputBox from '../../shared/components/inputBox/InputBox';

const KycDetails = () => {
  const [gender, setGender] = useState('male');

  return (
    <ImageBackground source={appBg} resizeMode="cover" style={styles.container}>
      <KycHeader title={'KYC Verification'} />

        <Text style={styles.sectionTitle}>Personal Info</Text>
      <ScrollView contentContainerStyle={styles.formWrapper} >

        {/* First Name */}
        <Text style={styles.label}>First Name*</Text>
        <InputBox placeHolder={'Enter First Name'}/>
        {/* Middle Name */}
        <Text style={styles.label}>Middle Name</Text>
        <InputBox placeHolder={'Enter Middle Name'}/>



        {/* Last Name */}
        <Text style={styles.label}>Last Name*</Text>
        <InputBox placeHolder={'Enter Last Name'}/>


        {/* Gender */}
        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderRow}>
          <TouchableOpacity
            style={styles.genderOption}
            onPress={() => setGender('male')}
          >
            <View style={styles.radioCircle(gender === 'male')} >
              <View style={[gender == 'male' ? {backgroundColor:'#F3BB2B',padding:2,height:14,width:14,borderRadius:8} : {backgroundColor:"#ffff"}]}>

              </View>
              </View>
            <Text style={styles.genderLabel}>Male</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.genderOption}
            onPress={() => setGender('female')}
          >
            <View style={styles.radioCircle(gender === 'female')} >
              <View style={[gender == 'female' ? {backgroundColor:'#F3BB2B',padding:2,height:14,width:14,borderRadius:8} : {backgroundColor:"#ffff"}]}>

              </View>
            </View>
            <Text style={styles.genderLabel}>Female</Text>
          </TouchableOpacity>
        </View>

        {/* Phone Number */}
        <Text style={styles.label}>Mobile Number*</Text>
        <View style={styles.otpInputWrapper}>
          <TextInput
            style={styles.phoneCode}
            value="+91"
            editable={false}
          />
          <TextInput
            style={styles.phoneInput}
            placeholder="Phone number"
            keyboardType="number-pad"
            placeholderTextColor={'#ccc'}
          />
          <TouchableOpacity style={styles.otpInlineBtn}>
            <Text style={styles.getOtpText}>Get OTP</Text>
          </TouchableOpacity>
        </View>



        {/* Email */}
        <Text style={styles.label}>Email ID</Text>
        <InputBox placeHolder={'Enter email ID'}/>


        {/* Email OTP */}
        <Text style={styles.label}>OTP</Text>
        {/* <View style={styles.row}> */}
           <View style={styles.otpInputWrapper}>
          <TextInput
            style={styles.phoneInput}
            placeholder="OTP"
            keyboardType="number-pad"
            placeholderTextColor={'#ccc'}
          />
          <TouchableOpacity style={styles.otpInlineBtn}>
            <Text style={styles.getOtpText}>Get OTP</Text>
          </TouchableOpacity>
        {/* </View> */}
        </View>

        {/* DOB */}
        <Text style={styles.label}>Date Of Birth*</Text>
        <InputBox placeHolder={'DD/MM/YYYY'}/>

        

        {/* Address */}
        <Text style={styles.label}>Address*</Text>
        <InputBox placeHolder={'Enter Address'}/>


        {/* State */}
        <Text style={styles.label}>State*</Text>
        <InputBox placeHolder={'Enter State'}/>


        {/* City */}
        <Text style={styles.label}>City*</Text>
        <InputBox placeHolder={'Enter City'}/>

        {/* Pin Code */}
        <Text style={styles.label}>PIN Code*</Text>
        <InputBox placeHolder={'Enter Pin Code'}/>


        {/* Next Button */}
        <TouchableOpacity style={styles.nextBtn} onPress={()=>NavigationService.navigate('PanVerify')}>
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      </ScrollView>
    </ImageBackground>
  );
};

export default KycDetails;

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    flex: 1,
  },
  formWrapper: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    // marginTop:10
    // marginBottom:50
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    // marginBottom: 12,
    marginHorizontal:20,
    marginTop:20,
    marginBottom:10
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 6,
    color:"#222"
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    marginBottom: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: (selected) => ({
    height: 18,
    width: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 6,
    alignItems:"center",
    justifyContent:"center"
    // backgroundColor: selected ? '#F3BB2B' : '#fff',
    // padding:4
  }),
  genderLabel: {
    fontSize: 14,
    color:"#222"
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  phoneCode: {
     width: 50,
  textAlign: 'center',
  fontSize: 14,
  color: '#000',
  },
  phoneInput: {
  flex: 1,
  paddingHorizontal: 8,
  fontSize: 14,
  color: '#000',
},
  getOtpBtn: {
    backgroundColor: '#f1c40f',
    paddingHorizontal: 12,
    borderRadius: 6,
    height: 44,
    justifyContent: 'center',
  },
  getOtpText: {
    fontWeight: '600',
    color: '#000',
  },
  nextBtn: {
    marginTop: 16,
    backgroundColor: '#f1c40f',
    height: 44,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom:20
  },
  nextText: {
    fontWeight: '700',
    color: '#000',
  },
  otpInlineBtn: {
  backgroundColor: '#f1c40f',
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 4,
},
otpInputWrapper: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 6,
  paddingHorizontal: 8,
  height: 44,
  marginBottom: 12,
},
});
