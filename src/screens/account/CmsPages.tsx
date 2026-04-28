import React from 'react';
import {AppSafeAreaView, Toolbar} from '../../shared';
import {StyleSheet} from 'react-native';
import {universalPaddingTop} from '../../theme/dimens';
import WebView from 'react-native-webview';
import {useRoute} from '@react-navigation/native';

const CmsPages = () => {
  const route = useRoute();
  const id = route?.params?.id;
  return (
    <AppSafeAreaView>
      <Toolbar isSecond title="" />
      <WebView
        style={{width: '100%', height: '100%'}}
        originWhitelist={['*']}
        source={{
          uri: id,
        }}
        startInLoadingState={true}
        scalesPageToFit={true}
        automaticallyAdjustContentInsets={true}
        scrollEnabled={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        bounces={false}
        sharedCookiesEnabled={true}
        javaScriptEnabledAndroid={true}
      />
    </AppSafeAreaView>
  );
};

export default CmsPages;
const styles = StyleSheet.create({
  container: {
    marginTop: universalPaddingTop,
  },
});
