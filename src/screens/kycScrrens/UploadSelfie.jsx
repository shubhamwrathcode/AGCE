import { StyleSheet, Text, TouchableOpacity, View, Image, Dimensions, ImageBackground } from 'react-native';
import React from 'react';
import KycHeader from '../../shared/components/kycHeader/KycHeader';
import  Ionicons  from 'react-native-vector-icons/Ionicons'; // Or use any icon set you prefer
import { appBg } from '../../helper/ImageAssets';

const { width } = Dimensions.get('window');

const UploadSelfie = () => {
  return (
    <ImageBackground source={appBg} style={styles.container}>
      <KycHeader title={'KYC Verification'} />

      <Text style={styles.sectionTitle}>Upload Selfie</Text>

      <View style={styles.uploadBoxContainer}>
        <Text style={styles.uploadText}>Upload Your Image (Selfie)</Text>
        <Text style={styles.uploadSubText}>
          (Only JPEG, PNG & JPG formats and file size upto 5MB are supported)
        </Text>

        <TouchableOpacity style={styles.uploadBox}>
          <Ionicons name="cloud-upload-outline" size={30} color="#D3A93C" />
          <Text style={styles.uploadBtnText}>Upload Image</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomContainer}>
        <Text style={styles.readyText}>Ready to submit your application?</Text>
        <Text style={styles.noteText}>
          Please verify the details you're submitting.{'\n'}Once submitted, you won't be able to change it.
        </Text>

        <TouchableOpacity style={styles.submitBtn}>
          <Text style={styles.submitBtnText}>Submit For Verification</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

export default UploadSelfie;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    color:'#222'
  },
  uploadBoxContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  uploadText: {
    fontWeight: '600',
    marginBottom: 4,
  },
  uploadSubText: {
    fontSize: 11,
    color: 'gray',
    marginBottom: 10,
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: '#D3A93C',
    borderStyle: 'dashed',
    borderRadius: 10,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBtnText: {
    marginTop: 8,
    color: '#999',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 30,
    width: width,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  readyText: {
    color: '#D3A93C',
    fontWeight: '600',
    marginBottom: 5,
  },
  noteText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 15,
  },
  submitBtn: {
    backgroundColor: '#F6C340',
    paddingVertical: 14,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  submitBtnText: {
    fontWeight: 'bold',
    color: '#000',
  },
});


// import { StyleSheet, Text, View } from 'react-native'
// import React from 'react'
// import KycHeader from '../../shared/components/kycHeader/KycHeader'

// const UploadSelfie = () => {
//   return (
//     <View>
//       <KycHeader title={'Kyc Verification'}/>
//     </View>
//   )
// }

// export default UploadSelfie

// const styles = StyleSheet.create({})