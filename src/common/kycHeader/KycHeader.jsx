import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import Feather from 'react-native-vector-icons/Feather'
import { AppText } from '../AppText'
import { useNavigation } from '@react-navigation/native'
const KycHeader = ({title}) => {
  const navigation = useNavigation()
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={()=>navigation.goBack()}>
        <Feather name="arrow-left" size={20} color={'#222'}/>
      </TouchableOpacity>
      <View>
        <AppText style={{fontWeight:'700',fontSize:16}}>{title}</AppText>
      </View>
    </View>
  )
}

export default KycHeader

const styles = StyleSheet.create({
    container:{paddingHorizontal:16,paddingTop:17,flexDirection:"row",width:"70%",justifyContent:"space-between",alignItems:"center",marginBottom:10}
})