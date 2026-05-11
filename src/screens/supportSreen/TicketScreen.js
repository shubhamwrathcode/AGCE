import { useRoute } from "@react-navigation/native";
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Clipboard,
} from "react-native";
import FastImage from "react-native-fast-image";
import {
  AppText,
  SEMI_BOLD,
  AppSafeAreaView,
  FOURTEEN,
  TEN,
  ELEVEN,
  FIFTEEN,
  Input
} from "../../shared";
import NavigationService from "../../navigation/NavigationService";
import { colors } from "../../theme/colors";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { ticketMessages } from "../../actions/accountActions";
import moment from "moment";
import { back_ic, Send_Img, copyIcon } from "../../helper/ImageAssets";
import { showSuccess } from "../../helper/logger";
import { useTheme } from "../../hooks/useTheme";

const TicketScreen = () => {
  const route = useRoute();
  const dispatch = useAppDispatch();
  const flatListRef = React.useRef(null);
  const { colors: themeColors, isDark } = useTheme();
  const userTickets = useAppSelector((state) => state.home.userTickets);
  const userData = useAppSelector((state) => state.auth.userData);
  const chatData = route?.params?.data;

  // Get user initial for avatar (same as web logic)
  const getUserInitial = () => {
    if (userData?.first_name) {
      return userData.first_name.charAt(0).toUpperCase();
    }
    if (userData?.name) {
      return userData.name.charAt(0).toUpperCase();
    }
    if (userData?.emailId) {
      return userData.emailId.charAt(0).toUpperCase();
    }
    return "U";
  };

  const userInitial = getUserInitial();

  // Find the latest chat object from Redux to ensure we see new messages
  const chat = userTickets?.find(t => t._id === chatData?._id) || chatData;
  const messages = chat?.ticket || [];

  const [message, setMessage] = useState("");

  // Scroll to bottom whenever messages update
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);

  const renderMessage = ({ item }) => {
    const isUser = item.replyBy === 1;
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.supportRow]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]}>
            <AppText weight={SEMI_BOLD} type={TEN} style={{ color: themeColors.button }}>{item?.name ? item.name.charAt(0).toUpperCase() : "T"}</AppText>
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.supportBubble,
          {
            backgroundColor: isUser ? themeColors.button : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"),
            borderColor: isUser ? 'transparent' : themeColors.border,
            borderWidth: isUser ? 0 : 0.5
          }
        ]}>
          <AppText style={{ color: isUser ? themeColors.buttonText : themeColors.text }} type={ELEVEN}>
            {item.query}
          </AppText>
          <AppText
            style={[styles.timestamp, { color: isUser ? themeColors.buttonText + 'CC' : themeColors.secondaryText }]}
            type={TEN}
          >
            {moment(item.createdAt).format("hh:mm A")}
          </AppText>
        </View>
        {isUser && (
          <View style={[styles.avatar, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]}>
            <AppText weight={SEMI_BOLD} type={TEN} style={{ color: themeColors.button }}>{userInitial}</AppText>
          </View>
        )}
      </View>
    );
  };

  const handleTicketMessages = () => {
    if (!message.trim()) return;
    let data = {
      replyBy: 1,
      query: message.trim(),
      ticket_id: chat?._id,
    }
    dispatch(ticketMessages(data, () => setMessage("")))
  }

  const copyToClipboard = (text) => {
    Clipboard.setString(text);
    showSuccess("Ticket Id Copied!");
  };

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background, flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => NavigationService.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <FastImage source={back_ic} style={{ width: 18, height: 18 }} resizeMode="contain" tintColor={themeColors.text} />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity onPress={() => copyToClipboard(chat?.ticketId)} style={styles.copyBtn}>
            <FastImage source={copyIcon} style={{ width: 14, height: 14 }} resizeMode="contain" tintColor={themeColors.secondaryText} />
          </TouchableOpacity>
          <AppText weight={SEMI_BOLD} type={FIFTEEN} style={{ color: themeColors.text }}>#{chat?.ticketId}</AppText>
        </View>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.content}>
        {/* Ticket Details summary card */}
        <View style={[styles.detailCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={styles.detailRow}>
            <View style={styles.detailCol}>
              <AppText type={TEN} style={{ color: themeColors.secondaryText }}>Created On</AppText>
              <AppText weight={SEMI_BOLD} type={ELEVEN} style={{ marginTop: 2, color: themeColors.text }}>
                {moment(chat?.createdAt).format('DD MMM, YYYY')}
              </AppText>
            </View>
            <View style={[styles.detailCol, { alignItems: 'flex-end' }]}>
              <AppText type={TEN} style={{ color: themeColors.secondaryText }}>Priority</AppText>
              <View style={[styles.priorityBadge, { backgroundColor: themeColors.button + '20' }]}>
                <AppText weight={SEMI_BOLD} type={TEN} style={{ color: themeColors.button, textTransform: 'capitalize' }}>
                  {chat?.priority || "Medium"}
                </AppText>
              </View>
            </View>
          </View>

          <View style={[styles.cardDivider, { backgroundColor: themeColors.border }]} />

          <View style={styles.detailRow}>
            <View style={styles.detailCol}>
              <AppText type={TEN} style={{ color: themeColors.secondaryText }}>Subject</AppText>
              <AppText weight={SEMI_BOLD} type={ELEVEN} style={{ marginTop: 2, color: themeColors.text }} numberOfLines={1}>{chat?.subject}</AppText>
            </View>
            <View style={[styles.detailCol, { alignItems: 'flex-end' }]}>
              <AppText type={TEN} style={{ color: themeColors.secondaryText }}>Category</AppText>
              <AppText weight={SEMI_BOLD} type={ELEVEN} style={{ marginTop: 2, color: themeColors.text, textTransform: 'capitalize' }}>
                {chat?.category?.replace(/_/g, ' ')}
              </AppText>
            </View>
          </View>
        </View>

        {/* Chat List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item?._id || index.toString()}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Footer */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {chat?.status?.toLowerCase() === "open" ? (
          <View style={[styles.inputContainer, { backgroundColor: themeColors.card, borderTopColor: themeColors.border }]}>
            <Input
              placeholder="Type your message..."
              multiline
              mainContainer={{ flex: 1, marginBottom: 0 }}
              value={message}
              onChangeText={setMessage}
              containerStyle={{ borderWidth: 0, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)" }}
              inputStyle={{ color: themeColors.text, height: 44, textAlignVertical: 'top', paddingTop: 8 }}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: themeColors.button, opacity: message.trim() ? 1 : 0.6 }]}
              disabled={!message.trim()}
              onPress={handleTicketMessages}
            >
              <FastImage source={Send_Img} style={{ width: 22, height: 22 }} resizeMode="contain" tintColor={themeColors.buttonText} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.closedFooter, { backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }]}>
            <AppText style={{ color: themeColors.secondaryText }} type={ELEVEN}>This ticket is {chat?.status}.</AppText>
          </View>
        )}
      </KeyboardAvoidingView>
    </AppSafeAreaView>
  );
};

export default TicketScreen;

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  copyBtn: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  detailCard: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 1.5 },
    }),
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailCol: {
    flex: 1,
  },
  cardDivider: {
    height: 1,
    marginVertical: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 8,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  supportRow: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    borderBottomRightRadius: 2,
  },
  supportBubble: {
    borderBottomLeftRadius: 2,
  },
  timestamp: {
    marginTop: 4,
    alignSelf: 'flex-end',
    fontSize: 9,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    borderTopWidth: 1,
    gap: 10,
  },
  sendBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  closedFooter: {
    padding: 24,
    alignItems: 'center',
  },
});
