import {
  AppSafeAreaView,
  AppText,
  Header,
  MEDIUM,
  SECOND,
  THIRD,
  THIRTEEN,
  Toolbar,
  WHITE,
} from '../../shared';
import {useIsFocused, useRoute} from '@react-navigation/native';
import {Alert, FlatList, ImageBackground, Platform, StyleSheet, View} from 'react-native';
import {HomeBg} from '../../helper/ImageAssets';
import {Screen} from '../../theme/dimens';
import {colors} from '../../theme/colors';
import {useEffect, useRef, useState} from 'react';
import TouchableOpacityView from '../../shared/components/TouchableOpacityView';
import {Launchpad} from './LaunchPad';
import BtcCoinDetails from './BtcCoinDetails';
import RBSheet from 'react-native-raw-bottom-sheet';
import {getStaking} from '../../actions/homeActions';
import StakingTrade from '../Staking/StakingTrade';
import {useAppDispatch} from '../../store/hooks';
import { slideData } from '../../helper/dummydata';

const Trades = () => {
  const route = useRoute();
  const dispatch = useAppDispatch();
  const coinDetail = route?.params?.coinDetail;
  const path = route?.params?.path;
 const isFocus = useIsFocused()
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [selectedKey, setSelectedKey] = useState('Spot');
  useEffect(() => {
    if (isFocus) {
      setSelectedSlide(path === "Spot" ? 0 : path === "Launchpad" ? 1 : path === "Staking" ? 2 : 0);
      setSelectedKey(path ?? 'Spot');
      dispatch(getStaking());
    }
  }, [isFocus]);
  const rbSheet = useRef(null);
  

  
  const _renderItem = ({item, index}) => {
    return (
      <TouchableOpacityView
        onPress={() => {
          setSelectedKey('Spot');
          setSelectedSlide(index);
        }}
        style={styles.listItemStyle}>
        <AppText
          type={THIRTEEN}
          weight={MEDIUM}
          color={selectedSlide === index ? WHITE : SECOND}>
          {item?.name}
        </AppText>
      </TouchableOpacityView>
    );
  };

  return (
    <AppSafeAreaView source={HomeBg}>
         <Toolbar />
     
        {/* <View style={styles.emptySpace}></View>
        <View style={styles.listView}>
          <FlatList horizontal data={slideData} renderItem={_renderItem} scrollEnabled={false}/>
        </View> */}
        {selectedKey == 'Spot' && <BtcCoinDetails coinDetails={coinDetail} />}
        {/* {selectedKey === 'Launchpad' && <Launchpad onSelectedKey={setSelectedKey} onSelectedSlide={setSelectedSlide}/>}
        {selectedKey == 'Staking' && <StakingTrade />} */}


      <RBSheet
        ref={rbSheet}
        closeOnDragDown={true}
        closeOnPressMask={true}
        height={80}
        animationType="none"
        customStyles={{
          container: {
            backgroundColor: colors.inputBorder,
            height: 80,
            borderRadius: 10,
          },
          wrapper: {
            backgroundColor: '#0006',
          },
          draggableIcon: {
            backgroundColor: 'transparent',
          },
        }}></RBSheet>
    </AppSafeAreaView>
  );
};

export default Trades;
const styles = StyleSheet.create({
  heading: {
    marginHorizontal: 15,
  },
  containerSecond: {flex: 1, flexDirection: 'row'},
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    width: Screen.Width - 20,
    alignSelf: 'center',
    marginTop: 5,
  },
  imgBg: {
    width: Screen.Width,
    height: Screen.Height,
  },
  listView: {
    width: Screen.Width,
    borderBottomWidth: 1,
    borderColor: colors.textGray,
    paddingBottom: 10,
  },
  emptySpace: {
    height: Platform.OS === "android" ? 40 : 65,
  },
  listItemStyle: {
    marginHorizontal: 12,
  },
  bedge: {
    height: 25,
    borderRadius: 5,
    backgroundColor: colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  arrow: {
    height: 8,
    width: 8,
    marginEnd: 5,
    marginBottom: 2,
  },
  containerThird: {flex: 1, alignItems: 'flex-end'},
  icon: {
    height: 30,
    width: 30,
    marginEnd: 10,
  },

  tabConatiner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: Screen.Width / 2,
    padding: 5,
    alignSelf: 'center',
    marginVertical: 25,
    justifyContent: 'center',
  },
  firstTab: {
    backgroundColor: colors.buttonBg,
    width: 25,
    height: 25,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberStyle: {
    top: 1,
  },
  border: {
    width: 50,
    height: 1,
  },
  otherTab: {
    backgroundColor: colors.white,
    width: 25,
    height: 25,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
