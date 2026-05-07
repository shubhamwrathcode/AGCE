import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import React, { useEffect } from 'react'
import { AppText, EIGHT, ELEVEN, SEMI_BOLD, TEN, WHITE } from '../../shared'
import FastImage from 'react-native-fast-image'
import { folder, satIcon, searchIcon } from '../../helper/ImageAssets'
import LinearGradient from 'react-native-linear-gradient';
import { useAppSelector } from '../../store/hooks'
import moment from 'moment'
import { colors } from '../../theme/colors'
import { useDispatch } from 'react-redux'
import { getUserPayList } from '../../actions/walletActions'

const EarningBalance = ({theme}) => {
  const dispatch = useDispatch();
  const userPayoutList = useAppSelector((state) => state.wallet.userPayoutList);
  console.log(userPayoutList, "userPayoutList");

  useEffect(() => {
    dispatch(getUserPayList());
  }, []);
  return (
    <View>

  <ScrollView horizontal showsHorizontalScrollIndicator={true}>
  <View style={{ padding: 10 }}>
    {/* Fixed Width Container to align headings with data */}
    <View style={{ minWidth: 500 }}>
      
      {/* Header Row */}
      <View style={{ flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderColor: theme !== "Dark" ? "#ccc" : '#595959'}}>
      <View style={{ width: 50, alignItems: "center"}}>
          <AppText style={{ fontWeight: "700" ,textAlign:"start"}}>S.no</AppText>
        </View>
        <View style={{ width: 150, alignItems: "center"}}>
          <AppText style={{ fontWeight: "700" ,textAlign:"start"}}>Date</AppText>
        </View>
        <View style={{ width: 100, }}>
          <AppText style={{ fontWeight: "700",textAlign:'center' }}>Plan Id</AppText>
        </View>
        <View style={{ flex: 1 ,width:100}}>
          <AppText style={{ fontWeight: "700",textAlign:"center" }}>Currency</AppText>
        </View>
        <View style={{ flex: 1 ,width:100}}>
          <AppText style={{ fontWeight: "700",textAlign:"center" }}>Amount</AppText>
        </View>
        <View style={{ flex: 1 ,width:100}}>
          <AppText style={{ fontWeight: "700",textAlign:"center" }}>Payout No.</AppText>
        </View>
        <View style={{ flex: 1 ,width:100}}>
          <AppText style={{ fontWeight: "700",textAlign:"center" }}>Status</AppText>
        </View>
        <View style={{ flex: 1 ,width:100}}>
          <AppText style={{ fontWeight: "700",textAlign:"center" }}>Note</AppText>
        </View>
      </View>

      {/* List Rows */}
      {userPayoutList?.length !== 0 ? userPayoutList.map((item, index) => (
        <View
          key={index}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 15,
            borderBottomWidth: 1,
            borderColor: theme !== "Dark" ? "#eee" : '#595959'
          }}
        >
           <View style={{ width: 50, alignItems: "center"}}>
            <AppText>{index + 1}</AppText>
          </View>
          <View style={{ width: 150, alignItems: "center"}}>
            <AppText>{moment(item?.createdAt).format("lll")}</AppText>
          </View>
          <View style={{ width: 100, alignItems: "center"}}>
            <AppText>{item?.plan_id}</AppText>
          </View>
          <View style={{ width: 100, alignItems: "center"}}>
            <AppText>{item?.currency}</AppText>
          </View>
          <View style={{ width: 100, alignItems: "center"}}>
            <AppText>{item?.amount}</AppText>
          </View>
          <View style={{ width: 100, alignItems: "center"}}>
            <AppText>{item?.payout_no}</AppText>
          </View>
          <View style={{ width: 100, alignItems: "center"}}>
            <AppText>{item?.status}</AppText>
          </View>
          <View style={{ width: 100, alignItems: "center"}}>
            <AppText>{item?.note}</AppText>
          </View>
          {/* Currency Column */}
          {/* <View style={{ width: 180 ,alignItems:"start"}}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <FastImage source={satIcon} style={{ width: 17, height: 17 }} resizeMode="contain" />
              <AppText type={ELEVEN} weight={SEMI_BOLD}>1000SATS</AppText>
            </View>
            <AppText type={TEN}>1000*SATS (Ordinals)</AppText>
          </View> */}

          {/* Balance Column */}
          {/* <View style={{ width: 150,alignItems:"center" }}>
            <AppText type={ELEVEN}>0.00000000</AppText>
            <AppText type={TEN}>≈ ₹ 0.00000000</AppText>
          </View> */}

          {/* Action Buttons Column */}
          {/* <View style={{ flexDirection: "row", gap: 10, flex: 1 }}>
            <LinearGradient colors={['#D3D3D3', '#F8F8F8']} start={{x: 0, y: 0}} end={{x: 1, y: 0}}  style={{ borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
              <AppText type={TEN}>Deposit</AppText>
            </LinearGradient>
            <LinearGradient colors={['#2FA00C', '#3EAD18','#5EC732','#72D742','#79DD48']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={{ borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
              <AppText type={TEN} color={WHITE}>Withdraw</AppText>
            </LinearGradient>
            <LinearGradient colors={['#FFE10B', '#FFE631','#FFEA51','#FFEC65','#FFED6C']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={{ backgroundColor: "#FFE631", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
              <AppText type={EIGHT}>Wallet Transfer</AppText>
            </LinearGradient>
          </View> */}
        </View>
      )) : <View style={{height: 80, marginLeft: 120, justifyContent: "center"}}><FastImage source={folder} resizeMode="contain" style={{width: 60, height: 60}} /><AppText >No Data</AppText></View>}
    </View>
  </View>
</ScrollView>




          {/* <View>
            <View style={{flexDirection: "row", justifyContent: "space-between", marginTop: 20}}>
              <AppText style={{fontWeight:"700"}}>CURRENCY</AppText>
              <AppText style={{marginRight: 70,fontWeight:"700"}}>BALANCE</AppText>
              <AppText style={{fontWeight:"700"}}>ACTION</AppText>
            </View>
            <View style={{flexDirection: "row", justifyContent: "space-between", marginTop: 20}}>
                <View>
                <View style={{flexDirection: "row", alignItems: "center", gap: 5}}>
                <FastImage source={satIcon} style={{width: 12, height: 12}}resizeMode="contain" />
                <AppText type={EIGHT} weight={SEMI_BOLD}>1000SATS</AppText>
              </View>
              <AppText type={EIGHT}>1000*SATS (Ordinals)</AppText>
                
                </View>
                <View> 
                    <AppText type={EIGHT} >0.00000000</AppText>
                    <AppText type={EIGHT} > ≈ ₹ 0.00000000</AppText>
                </View>
             
              <View style={{flexDirection: "row", gap: 10}}>
                 <View style={{backgroundColor: "#FFE631" ,borderRadius: 10, justifyContent: "center", paddingHorizontal: 10}}>
                    <AppText type={EIGHT} >Wallet Transfer</AppText>
                </View>
                <View style={{backgroundColor: "#2FA00C" ,borderRadius: 10, justifyContent: "center", paddingHorizontal: 10}}>
                    <AppText type={EIGHT} color={WHITE}>Withdraw</AppText>
                </View>
                <View style={{backgroundColor: "#FFE631" ,borderRadius: 10, justifyContent: "center", paddingHorizontal: 10}}>
                    <AppText type={EIGHT} >Wallet Transfer</AppText>
                </View>
              </View>
            </View>
            <View style={{flexDirection: "row", justifyContent: "space-between", marginTop: 20}}>
                <View>
                <View style={{flexDirection: "row", alignItems: "center", gap: 5}}>
                <FastImage source={satIcon} style={{width: 12, height: 12}}resizeMode="contain" />
                <AppText type={EIGHT} weight={SEMI_BOLD}>1000SATS</AppText>
              </View>
              <AppText type={EIGHT}>1000*SATS (Ordinals)</AppText>
                
                </View>
                <View> 
                    <AppText type={EIGHT} >0.00000000</AppText>
                    <AppText type={EIGHT} > ≈ ₹ 0.00000000</AppText>
                </View>
             
              <View style={{flexDirection: "row", gap: 10}}>
                <View style={{backgroundColor: "#FFE631" ,borderRadius: 10, justifyContent: "center", paddingHorizontal: 10}}>
                    <AppText type={EIGHT} >Wallet Transfer</AppText>
                </View>
                <View style={{backgroundColor: "#2FA00C" ,borderRadius: 10, justifyContent: "center", paddingHorizontal: 10}}>
                    <AppText type={EIGHT} color={WHITE}>Withdraw</AppText>
                </View>
                <View style={{backgroundColor: "#FFE631" ,borderRadius: 10, justifyContent: "center", paddingHorizontal: 10}}>
                    <AppText type={EIGHT} >Wallet Transfer</AppText>
                </View>
              </View>
            </View>
            <View style={{flexDirection: "row", justifyContent: "space-between", marginTop: 20}}>
                <View>
                <View style={{flexDirection: "row", alignItems: "center", gap: 5}}>
                <FastImage source={satIcon} style={{width: 12, height: 12}}resizeMode="contain" />
                <AppText type={EIGHT} weight={SEMI_BOLD}>1000SATS</AppText>
              </View>
              <AppText type={EIGHT}>1000*SATS (Ordinals)</AppText>
                
                </View>
                <View> 
                    <AppText type={EIGHT} >0.00000000</AppText>
                    <AppText type={EIGHT} > ≈ ₹ 0.00000000</AppText>
                </View>
             
              <View style={{flexDirection: "row", gap: 10}}>
                <View style={{backgroundColor: "#FFE631" ,borderRadius: 10, justifyContent: "center", paddingHorizontal: 10}}>
                    <AppText type={EIGHT} >Wallet Transfer</AppText>
                </View>
                <View style={{backgroundColor: "#2FA00C" ,borderRadius: 10, justifyContent: "center", paddingHorizontal: 10}}>
                    <AppText type={EIGHT}color={WHITE} >Withdraw</AppText>
                </View>
                <View style={{backgroundColor: "#FFE631" ,borderRadius: 10, justifyContent: "center", paddingHorizontal: 10}}>
                    <AppText type={EIGHT} >Wallet Transfer</AppText>
                </View>
              </View>
            </View>
            <View style={{flexDirection: "row", justifyContent: "space-between", marginTop: 20}}>
                <View>
                <View style={{flexDirection: "row", alignItems: "center", gap: 5}}>
                <FastImage source={satIcon} style={{width: 12, height: 12}}resizeMode="contain" />
                <AppText type={EIGHT} weight={SEMI_BOLD}>1000SATS</AppText>
              </View>
              <AppText type={EIGHT}>1000*SATS (Ordinals)</AppText>
                
                </View>
                <View> 
                    <AppText type={EIGHT} >0.00000000</AppText>
                    <AppText type={EIGHT} > ≈ ₹ 0.00000000</AppText>
                </View>
             
              <View style={{flexDirection: "row", gap: 10}}>
                <View style={{backgroundColor: "#FFE631" ,borderRadius: 10, justifyContent: "center", paddingHorizontal: 10}}>
                    <AppText type={EIGHT} >Wallet Transfer</AppText>
                </View>
                <View style={{backgroundColor: "#2FA00C" ,borderRadius: 10, justifyContent: "center", paddingHorizontal: 10}}>
                    <AppText type={EIGHT} color={WHITE}>Withdraw</AppText>
                </View>
                <View style={{backgroundColor: "#FFE631" ,borderRadius: 10, justifyContent: "center", paddingHorizontal: 10}}>
                    <AppText type={EIGHT} >Wallet Transfer</AppText>
                </View>
              </View>
            </View>
            <View style={{flexDirection: "row", justifyContent: "space-between", marginTop: 20}}>
                <View>
                <View style={{flexDirection: "row", alignItems: "center", gap: 5}}>
                <FastImage source={satIcon} style={{width: 12, height: 12}}resizeMode="contain" />
                <AppText type={EIGHT} weight={SEMI_BOLD}>1000SATS</AppText>
              </View>
              <AppText type={EIGHT}>1000*SATS (Ordinals)</AppText>
                
                </View>
                <View> 
                    <AppText type={EIGHT} >0.00000000</AppText>
                    <AppText type={EIGHT} > ≈ ₹ 0.00000000</AppText>
                </View>
             
              <View style={{flexDirection: "row", gap: 10}}>
                <View style={{backgroundColor: "#FFE631" ,borderRadius: 10, justifyContent: "center", paddingHorizontal: 10}}>
                    <AppText type={EIGHT} >Wallet Transfer</AppText>
                </View>
                <View style={{backgroundColor: "#2FA00C" ,borderRadius: 10, justifyContent: "center", paddingHorizontal: 10}}>
                    <AppText type={EIGHT} color={WHITE} >Withdraw</AppText>
                </View>
                <View style={{backgroundColor: "#FFE631" ,borderRadius: 10, justifyContent: "center", paddingHorizontal: 10}}>
                    <AppText type={EIGHT} >Wallet Transfer</AppText>
                </View>
              </View>
            </View>
            <View style={{flexDirection: "row", justifyContent: "space-between", marginTop: 20}}>
                <View>
                <View style={{flexDirection: "row", alignItems: "center", gap: 5}}>
                <FastImage source={satIcon} style={{width: 12, height: 12}}resizeMode="contain" />
                <AppText type={EIGHT} weight={SEMI_BOLD}>1000SATS</AppText>
              </View>
              <AppText type={EIGHT}>1000*SATS (Ordinals)</AppText>
                
                </View>
                <View> 
                    <AppText type={EIGHT} >0.00000000</AppText>
                    <AppText type={EIGHT} > ≈ ₹ 0.00000000</AppText>
                </View>
             
              <View style={{flexDirection: "row", gap: 10}}>
                <View style={{backgroundColor: "#FFE631" ,borderRadius: 10, justifyContent: "center", paddingHorizontal: 10}}>
                    <AppText type={EIGHT} >Wallet Transfer</AppText>
                </View>
                <View style={{backgroundColor: "#2FA00C" ,borderRadius: 10, justifyContent: "center", paddingHorizontal: 10}}>
                    <AppText type={EIGHT} color={WHITE} >Withdraw</AppText>
                </View>
                <View style={{backgroundColor: "#FFE631" ,borderRadius: 10, justifyContent: "center", paddingHorizontal: 10}}>
                    <AppText type={EIGHT} >Wallet Transfer</AppText>
                </View>
              </View>
            </View>
          </View> */}
    </View>
  )
}

export default EarningBalance

const styles = StyleSheet.create({
     mainView: {
    borderWidth: 1,
    borderColor: "#D4D4D4",
    margin: 10,
    borderRadius: 18,
    padding: 10,
    paddingHorizontal: 14,
  },
  tabView: {
    borderWidth: 1,
    borderColor: '#F3BB2B',
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    padding: 5,
    borderRadius: 4,
    alignItems: "center",
    paddingHorizontal:10
  },
  searchView: {
    flexDirection: "row",
    // justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#00000033",
    width: "34%",
    borderRadius: 30,
    height: 35,
    padding:0,
  },

})