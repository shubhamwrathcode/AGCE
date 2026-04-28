import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import React from 'react';
import { appBg } from '../../helper/ImageAssets';
import KycHeader from '../../shared/components/kycHeader/KycHeader';
import Feather from 'react-native-vector-icons/Feather'
import NavigationService from '../../navigation/NavigationService';
import InputBox from '../../shared/components/inputBox/InputBox';

const AadharVerify = () => {
  return (
     <ImageBackground source={appBg} resizeMode="cover" style={styles.container}>
      <KycHeader title={'KYC Verification'} />
      <ScrollView contentContainerStyle={styles.formWrapper}>
        <Text style={styles.sectionTitle}>Document Type</Text>

        <Text style={styles.label}>Select Document Type*</Text>
        {/* <TextInput style={styles.input} placeholder="XYZ" /> */}
        <InputBox placeHolder={'XYZ'}/>


        <Text style={styles.label}>Aadhaar Number*</Text>
        {/* <TextInput style={styles.input} placeholder="XYZ" /> */}
        <InputBox placeHolder={'XYZ'}/>

        <Text style={styles.label}>Front Image</Text>
        <Text style={styles.noteText}>
          Only JPG, PNG & PDF formats and file size upto 5MB are supported
        </Text>

        <TouchableOpacity style={styles.uploadBox}>
          <View style={{alignSelf:'center'}}>
            <Feather name="upload" size={20} color={'#EEC879'}/>
            </View>
            <View style={{alignSelf:"center"}}>
            <Text style={styles.uploadText}> Upload Image</Text>
          </View>
        </TouchableOpacity>
         <Text style={styles.label}>Upload Back Image</Text>
                <Text style={styles.noteText}>
                  Only JPG, PNG & PDF formats and file size upto 5MB are supported
                </Text>
        
             <TouchableOpacity style={styles.uploadBox}>
          <View style={{alignSelf:'center'}}>
            <Feather name="upload" size={20} color={'#EEC879'}/>
            </View>
            <View style={{alignSelf:"center"}}>
            <Text style={styles.uploadText}> Upload Image</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextBtn} onPress={()=>NavigationService.navigate('UploadSelfie')}>
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>

        
      </ScrollView>
    </ImageBackground>
  )
}

export default AadharVerify

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    flex: 1,
  },
  formWrapper: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
    fontSize: 14,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  dropdownText: {
    fontSize: 14,
    color: '#555',
  },
  noteText: {
    fontSize: 12,
    color: '#777',
    marginBottom: 8,
  },
  uploadBox: {
    height: 120,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#f1c40f',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    flexDirection:"column"
    // backgroundColor: '#fffbe6',
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f1c40f',
  },
  nextBtn: {
    backgroundColor: '#f1c40f',
    height: 44,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom:'3%'
  },
  nextText: {
    fontWeight: '700',
    color: '#000',
    fontSize: 16,
  },
});