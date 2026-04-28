import React from 'react';
import {Keyboard, KeyboardAvoidingView, Platform, ScrollView, View} from 'react-native';
import {KeyboardAwareScrollView} from '@codler/react-native-keyboard-aware-scroll-view';
import { Screen } from '../theme/dimens';
import {authStyles} from '../screens/auth/authStyles';

const KeyBoardAware = props => {
  return (
    <>
    {Platform.OS === "android" ? 
    <KeyboardAwareScrollView
      {...props}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[{flexGrow: 1}, props.containerStyle]}
      style={[authStyles.mainContainer, props.style]}
      showsVerticalScrollIndicator={false}>
      {props?.children}
    </KeyboardAwareScrollView> : 
    <KeyboardAvoidingView style={[{width:Screen.Width,height:Screen.Height, justifyContent:'flex-end',alignItems:"center",}, {...props.style}]} behavior='padding'>
    <ScrollView showsVerticalScrollIndicator={false} style={{width:Screen.Width,height:Screen.Height,paddingHorizontal: 20}}>
    {props?.children}
    </ScrollView>
    </KeyboardAvoidingView>}
    
    </>
    
  );
};

export default KeyBoardAware;
