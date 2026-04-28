import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import React, { useEffect, useState } from "react";
import {
  AppSafeAreaView,
  AppText,
  BLACK,
  Button,
  ELEVEN,
  FOURTEEN,
  Input,
  PictureModal,
  SEMI_BOLD,
  SIXTEEN,
  TEN,
  WHITE,
} from "../../shared";
import { useAppSelector } from "../../store/hooks";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import { colors } from "../../theme/colors";
import {
  back_ic,
  doneIcon,
  folder,
  NO_NOTIFICATION_ICON,
  NO_NOTIFICATION_ICON_LIGHT,
  uploadIcon,
} from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";
import FastImage from "react-native-fast-image";
import { useDispatch } from "react-redux";
import { getUserTickets, submitTicket, getTicketCategories } from "../../actions/accountActions";
import { showError } from "../../helper/logger";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import { borderWidth } from "../../theme/dimens";
import ImageCropPicker from "react-native-image-crop-picker";
import SupportSkeleton from "./SupportSkeleton";
import CustomDropdown from "../../shared/components/CustomDropdown";
import moment from "moment";
import { useTheme } from "../../hooks/useTheme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const H_PADDING = Math.max(14, SCREEN_WIDTH * 0.04);
const CONTENT_WIDTH = SCREEN_WIDTH - H_PADDING * 2;

const TicketCard = ({ item, onSupportChat }) => {
  const { colors: themeColors, isDark } = useTheme();

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return colors.buyButtonColor;
      case 'closed': return colors.sellButtonColor;
      case 'resolved': return colors.green;
      default: return themeColors.button;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onSupportChat(item)}
      style={[
        styles.ticketCard,
        {
          backgroundColor: themeColors.card,
          borderColor: themeColors.border,
        }
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <AppText weight={SEMI_BOLD} type={FOURTEEN} style={{ color: themeColors.text }}>
            {item.subject}
          </AppText>
          <AppText type={TEN} style={{ color: themeColors.secondaryText, marginTop: 4 }}>
            Ticket ID: #{item.ticketId}
          </AppText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15', borderColor: getStatusColor(item.status) + '30' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <AppText weight={SEMI_BOLD} type={TEN} style={{ color: getStatusColor(item.status) }}>
            {item.status}
          </AppText>
        </View>
      </View>

      <View style={[styles.cardDivider, { backgroundColor: themeColors.border }]} />

      <View style={styles.cardBody}>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <AppText type={TEN} style={{ color: themeColors.secondaryText }}>Category</AppText>
            <AppText weight={SEMI_BOLD} type={ELEVEN} style={{ color: themeColors.text, marginTop: 2, textTransform: 'capitalize' }}>
              {item.category?.replace(/_/g, ' ') || "General"}
            </AppText>
          </View>
          <View style={[styles.infoItem, { alignItems: 'flex-end' }]}>
            <AppText type={TEN} style={{ color: themeColors.secondaryText, textAlign: "right" }}>Priority</AppText>
            <View style={[styles.priorityBadge, { backgroundColor: themeColors.button + '20' }]}>
              <AppText weight={SEMI_BOLD} type={TEN} style={{ color: themeColors.button, textTransform: 'capitalize' }}>
                {item.priority || "Medium"}
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <AppText type={TEN} style={{ color: themeColors.secondaryText }}>Created on</AppText>
            <AppText type={ELEVEN} style={{ color: themeColors.text, marginTop: 2 }}>
              {moment(item.createdAt).format("DD MMM, YYYY")} at {moment(item.createdAt).format("hh:mm A")}
            </AppText>
          </View>
          <TouchableOpacity onPress={() => onSupportChat(item)}>
            <AppText weight={SEMI_BOLD} type={ELEVEN} style={{ color: themeColors.button }}>
              View Details {'>'}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const TicketList = ({ userTickets, onSupportChat }) => {
  const { isDark } = useTheme();
  const renderEmpty = () => (
    <View style={styles.noDataRow}>
      <FastImage
        source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
        resizeMode="contain"
        style={{ width: 120, height: 120, opacity: isDark ? 0.6 : 1 }}
      />
      <AppText type={FOURTEEN} style={{ color: colors.secondaryText, marginTop: 16 }}>No support tickets found</AppText>
    </View>
  );

  return (
    <FlatList
      data={userTickets}
      renderItem={({ item }) => <TicketCard item={item} onSupportChat={onSupportChat} />}
      keyExtractor={(item) => item?._id?.toString() || Math.random().toString()}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={{ paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
    />
  );
};

const Support = () => {
  const dispatch = useDispatch();
  const { colors: themeColors, isDark, theme } = useTheme();
  const userTickets = useAppSelector((state) => state.home.userTickets);
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const [activeTab, setActiveTab] = useState("issue");
  const [subject, setSubject] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [issuePic, setIssuePic] = useState();
  const [isVisible, setIsVisible] = useState(false);
  const [contentLoading, setContentLoading] = useState(true);

  useEffect(() => {
    dispatch(getUserTickets());
    dispatch(getTicketCategories(setCategories, setPriorities));
  }, []);

  useEffect(() => {
    if (Array.isArray(userTickets)) {
      setContentLoading(false);
    }
  }, [userTickets]);

  const handleResetInput = () => {
    setSubject("");
    setDesc("");
    setCategory("");
    setPriority("medium");
    setIssuePic("");
  };

  const handleSubmit = () => {
    if (!subject.trim()) {
      showError("Please Enter Subject");
      return;
    }
    if (!category) {
      showError("Please Select Category");
      return;
    }
    if (!desc.trim()) {
      showError("Please Enter Description");
      return;
    }

    var formData = new FormData();
    formData.append("subject", subject.trim());
    formData.append("description", desc.trim());
    formData.append("category", category);
    formData.append("priority", priority);
    if (issuePic) {
      formData.append("issue_image", issuePic);
    }
    dispatch(submitTicket(formData, handleResetInput));
  };

  const onPressCamera = () => {
    ImageCropPicker.openCamera({
      multiple: false,
      mediaType: "photo",
      cropping: true,
      compressImageQuality: 1,
    })
      .then((image) => {
        if (
          image?.size < 2000000 &&
          (image?.mime === "image/png" ||
            image?.mime === "image/jpeg" ||
            image?.mime === "image/jpg")
        ) {
          let mime = image?.mime?.split("/");
          let tempphoto = {
            uri: image.path,
            name: "issuePic_image" + image.modificationDate + "." + mime[1],
            type: image.mime,
          };
          setIssuePic(tempphoto);
        } else {
          setIssuePic("");
          showError(
            "Only JPEG, PNG & JPG formats and file size upto 2MB are supported"
          );
          return;
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };
  const onPressGallery = () => {
    ImageCropPicker.openPicker({
      multiple: false,
      mediaType: "photo",
      cropping: true,
      compressImageQuality: 1,
    })
      .then((image) => {
        if (
          image?.size < 2000000 &&
          (image?.mime === "image/png" ||
            image?.mime === "image/jpeg" ||
            image?.mime === "image/jpg")
        ) {
          let mime = image?.mime?.split("/");
          let tempphoto = {
            uri: image.path,
            name: "issuePic_image" + image.modificationDate + "." + mime[1],
            type: image.mime,
          };
          setIssuePic(tempphoto);
        } else {
          setIssuePic("");
          showError(
            "Only JPEG, PNG & JPG formats and file size upto 2MB are supported"
          );
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const renderSubmitTicketForm = () => (
    <View style={[styles.formCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
      <Input
        title={"Subject*"}
        placeholder={"Enter subject"}
        value={subject}
        onChangeText={(text) => setSubject(text)}
        autoCapitalize="none"
        returnKeyType="next"
        containerStyle={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)", borderColor: themeColors.border }}
        inputStyle={{ color: themeColors.text }}
        placeholderTextColor={themeColors.secondaryText}
      />
      <View style={{ marginBottom: 16 }}>
        <AppText type={TEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginBottom: 8 }}>
          Category*
        </AppText>
        <CustomDropdown
          data={categories.map(c => c.name)}
          selected={categories.find(c => c.id === category)?.name || "Select Category"}
          onSelect={(name) => {
            const cat = categories.find(c => c.name === name);
            setCategory(cat?.id);
          }}
          theme={theme}
        />
      </View>
      <View style={{ marginBottom: 16 }}>
        <AppText type={TEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginBottom: 8 }}>
          Priority*
        </AppText>
        <CustomDropdown
          data={priorities.map(p => p.name)}
          selected={priorities.find(p => p.id === priority)?.name || "Select Priority"}
          onSelect={(name) => {
            const pri = priorities.find(p => p.name === name);
            setPriority(pri?.id);
          }}
          theme={theme}
        />
      </View>
      <Input
        title={"Description*"}
        placeholder={"Enter description"}
        value={desc}
        onChangeText={(text) => setDesc(text)}
        autoCapitalize="none"
        returnKeyType="next"
        multiline={true}
        containerStyle={{
          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
          borderColor: themeColors.border,
          height: 90,
          alignItems: 'flex-start',
          paddingTop: 8
        }}
        inputStyle={{ color: themeColors.text, textAlignVertical: 'top' }}
        placeholderTextColor={themeColors.secondaryText}
      />
      <TouchableOpacityView
        onPress={() => setIsVisible(true)}
        style={[styles.fileContainer, { borderColor: themeColors.button, backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.01)" }]}
      >
        <FastImage
          source={issuePic ? doneIcon : uploadIcon}
          style={styles.uploadIcon}
          resizeMode="contain"
        />
        <AppText style={{ color: themeColors.text, marginTop: 8, fontSize: 13 }}>
          {issuePic ? "File uploaded" : "Upload Supporting image (Optional)"}
        </AppText>
      </TouchableOpacityView>

      <Button
        children="Submit"
        containerStyle={{ marginTop: 20, backgroundColor: themeColors.button }}
        disabled={!subject || !category || !desc}
        onPress={handleSubmit}
        loading={isLoading}
      />
    </View>
  );

  const handleSupportChat = (chat) => {
    NavigationService.navigate('Ticket_Screen', { data: chat });
  };

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background, flex: 1 }}>
      <KeyBoardAware style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => NavigationService.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <FastImage
              source={back_ic}
              resizeMode="contain"
              style={{ width: 22, height: 22 }}
              tintColor={themeColors.text}
            />
          </TouchableOpacity>
          <AppText weight={SEMI_BOLD} type={SIXTEEN} style={{ color: themeColors.text }}>
            Help Center
          </AppText>
          <View style={{ width: 22 }} />
        </View>
        <View style={[styles.container, { paddingHorizontal: H_PADDING }]}>
          {contentLoading ? (
            <SupportSkeleton />
          ) : (
            <>
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[
                    styles.tabView,
                    {
                      backgroundColor: activeTab === "issue" ? themeColors.button : themeColors.card,
                      borderColor: themeColors.border,
                      borderWidth: activeTab === "issue" ? 0 : 1,
                    },
                  ]}
                  onPress={() => setActiveTab("issue")}
                  activeOpacity={0.8}
                >
                  <AppText style={{ color: activeTab === "issue" ? themeColors.buttonText : themeColors.text }} weight={SEMI_BOLD} type={ELEVEN}>
                    Issue List
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tabView,
                    {
                      backgroundColor: activeTab !== "issue" ? themeColors.button : themeColors.card,
                      borderColor: themeColors.border,
                      borderWidth: activeTab !== "issue" ? 0 : 1,
                    },
                  ]}
                  onPress={() => setActiveTab("ticket")}
                  activeOpacity={0.8}
                >
                  <AppText style={{ color: activeTab !== "issue" ? themeColors.buttonText : themeColors.text }} weight={SEMI_BOLD} type={ELEVEN}>
                    Submit Ticket
                  </AppText>
                </TouchableOpacity>
              </View>

              {activeTab === "issue" ? (
                <TicketList userTickets={userTickets} onSupportChat={handleSupportChat} />
              ) : (
                renderSubmitTicketForm()
              )}
            </>
          )}
        </View>
      </KeyBoardAware>
      <PictureModal
        isVisible={isVisible}
        onBackButtonPress={() => setIsVisible(false)}
        onPressGallery={onPressGallery}
        onPressCamera={onPressCamera}
      />
    </AppSafeAreaView>
  );
};

export default Support;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: H_PADDING,
    paddingTop: 12,
    paddingBottom: 8,
  },
  container: {
    flex: 1,
    paddingTop: 12,
  },
  tabContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  tabView: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ticketCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 1.5 },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 0.5,
  },
  statusDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  cardDivider: {
    height: 1, width: '100%', marginBottom: 12,
  },
  cardBody: {
    gap: 16,
  },
  infoGrid: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  infoItem: {
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4,
  },
  fileContainer: {
    alignItems: "center", justifyContent: "center", paddingVertical: 18,
    borderWidth: 1.5, borderStyle: "dashed", borderRadius: 12, marginTop: 12,
  },
  uploadIcon: {
    height: 36, width: 36,
  },
  formCard: {
    borderRadius: 16, padding: 18, marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 1.5 },
    }),
  },
  noDataRow: {
    width: "100%", justifyContent: "center", alignItems: "center", paddingVertical: 60,
  },
});
