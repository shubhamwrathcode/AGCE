import re

filepath = '/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/Security/PhoneVerification/ChangePhoneNumberScreen.js'
with open(filepath, 'r') as f:
    content = f.read()

# Add KeyboardAwareScrollView import
content = content.replace(
    "import { useNavigation } from '@react-navigation/native';",
    "import { KeyboardAwareScrollView } from '@codler/react-native-keyboard-aware-scroll-view';\nimport { useNavigation } from '@react-navigation/native';"
)

# Remove unused imports 
content = content.replace("  ScrollView,\n", "")
content = content.replace("  KeyboardAvoidingView,\n", "")

# Replace KeyboardAvoidingView tags with View
content = re.sub(r'<KeyboardAvoidingView[^>]*>', '<View style={styles.flex}>', content)
content = content.replace('</KeyboardAvoidingView>', '</View>')

# Replace ScrollView tags with KeyboardAwareScrollView + props
scroll_props = """<KeyboardAwareScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraScrollHeight={Platform.OS === 'ios' ? 24 : 60}
        >"""
content = re.sub(r'<ScrollView[^>]*>', scroll_props, content)
content = content.replace('</ScrollView>', '</KeyboardAwareScrollView>')


# Theme replacements
content = content.replace("backgroundColor: isDark ? '#121214' : '#FFFFFF'", "backgroundColor: themeColors.background")
content = content.replace("backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7'", "backgroundColor: themeColors.input")
content = content.replace("backgroundColor: isDark ? '#2A2A2E' : '#F7F7F7'", "backgroundColor: themeColors.input")
content = content.replace("backgroundColor: isDark ? '#1E1E22' : '#F5F5F7'", "backgroundColor: isDark ? colors.inputBorder : '#F5F5F7'")
content = content.replace("backgroundColor: isDark ? '#2D2D30' : '#E5E5EA'", "backgroundColor: themeColors.border")

content = content.replace("color: isDark ? '#FFFFFF' : '#1A1A1C'", "color: themeColors.text")
content = content.replace("color: isDark ? '#FFFFFF' : '#000000'", "color: themeColors.text")
content = content.replace("color: isDark ? '#FFFFFF' : '#1C1C1E'", "color: themeColors.text")
content = content.replace("color: isDark ? '#8A8A93' : '#9E9EAE'", "color: themeColors.secondaryText")
content = content.replace("color: isDark ? '#D1D1D6' : '#4E4E54'", "color: themeColors.secondaryText")
content = content.replace("color: (countdown > 0 || isLoading) ? (isDark ? '#4E4E54' : '#C7C7CC') : colors.orangeTheme", "color: (countdown > 0 || isLoading) ? themeColors.secondaryText : colors.orangeTheme")

content = content.replace("borderBottomColor: isDark ? '#1E1E22' : '#F0F0F0'", "borderBottomColor: themeColors.border")
content = content.replace("tintColor={isDark ? '#FFFFFF' : '#000000'}", "tintColor={isDark ? colors.white : colors.black}")
content = content.replace("placeholderTextColor={isDark ? '#8A8A93' : '#9E9EAE'}", "placeholderTextColor={themeColors.secondaryText}")
content = content.replace("backgroundColor: isDark ? '#FFFFFF' : '#22252A'", "backgroundColor: isDark ? colors.white : '#22252A'")
content = content.replace("color: isDark ? '#000000' : '#FFFFFF'", "color: isDark ? '#000000' : '#FFFFFF'")

with open(filepath, 'w') as f:
    f.write(content)
