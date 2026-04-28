import React, {  useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AppSafeAreaView, AppText, BOLD, Button, Input, MEDIUM, SEMI_BOLD, TWENTY, Toolbar, YELLOW } from "../../shared";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import { universalPaddingHorizontal } from "../../theme/dimens";
import { colors } from "../../theme/colors";
import { useDispatch } from "react-redux";
import { useAppSelector } from "../../store/hooks";
import ModalSwap from "../home/ModalSwap";

const SwapNEXBCoin = () => {
    const dispatch = useDispatch();
    const userData = useAppSelector(state => state.auth.userData);
    const coinList = useAppSelector(state => state.home.coinList);
    // const covtertCoin = useAppSelector(state => state.home.covtertCoin);
    const { _id }: any = userData ?? "";
    // const { amountToBuy, fromCurrency, toCurrency }: any = covtertCoin ?? "";
    const [usdt, setUsdt] = useState("");
    const [nexb, setNexb] = useState("");
    const [visible, setVisible] = useState(false);
    const usdtInput = useRef(null);
    const nexbInput = useRef(null);
    const findUSDTID = coinList?.find((e: any) => {
        return e?.short_name == 'USDT'
    });
    const findNEXBID = coinList?.find((e: any) => {
        return e?.short_name == 'NEXB'
    });
   
    const handlePopup = () => {
        setVisible(false);
    };
    return (
        <AppSafeAreaView>
            <Toolbar title="Launchpad" isSecond />
            <KeyBoardAware>
                <AppText style={styles.topText} weight={BOLD} type={TWENTY}>
                    Swap <AppText weight={BOLD} color={YELLOW} type={TWENTY}>NEXB</AppText> Coin
                </AppText>
                <View style={styles.container}>
                    <Input
                        title={'USDT'}
                        placeholder={'Enter USDT'}
                        value={usdt}
                        onChangeText={text => setUsdt(text)
                        }
                        keyboardType="numeric"
                        autoCapitalize="none"
                        returnKeyType="next"
                    />
                    <Input
                        title={'NEXB'}
                        placeholder={'Enter NEXB Coin'}
                        value={nexb}
                        onChangeText={text => setNexb(text)}
                        keyboardType="numeric"
                        autoCapitalize="none"
                        returnKeyType="next"
                        editable={usdt?.length ? false : true}
                    />
                    <View style={styles.headingContianer}>
                        <AppText weight={MEDIUM}>
                            Min. - 100 USDT
                        </AppText>
                        <AppText weight={MEDIUM}>
                            Max. - 1,000 USDT
                        </AppText>
                    </View>

                    <Button
                        isSecond
                        children={'Swap'}
                        onPress={() => setVisible(true)}
                        style={{
                            width: '100%', backgroundColor: colors.buttonBg, borderRadius: 30,
                            paddingVertical: 6, marginTop: 20, alignItems: "center",
                            justifyContent: "center",
                        }}
                    />
                </View>
                <ModalSwap visible={visible} handleVisiblity={handlePopup} onPress={() => setVisible(false)} />
            </KeyBoardAware>
        </AppSafeAreaView>
    )
}
export default SwapNEXBCoin;
const styles = StyleSheet.create({
    topText: {
        textAlign: 'center',
        marginTop: 30
    },
    container: {
        paddingHorizontal: universalPaddingHorizontal,
        paddingVertical: 10,
        backgroundColor: colors.inputBackground,
        borderWidth: 1,
        borderColor: colors.inputBorder,
        borderRadius: 18
    },
    headingContianer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: universalPaddingHorizontal,
        paddingVertical: 10,
        borderRadius: 15,
        backgroundColor: colors.buttonBgDisabled,
        marginTop: 20,

    },
    button: {
        width: '100%',
        marginTop: 25
    }
})