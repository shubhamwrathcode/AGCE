import re
import os

def fix_emergency(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r') as f:
        content = f.read()

    # KeyboardAwareScrollView replacement
    if "KeyboardAwareScrollView" not in content and "KeyboardAvoidingView" in content:
        content = content.replace(
            "import { useNavigation",
            "import { KeyboardAwareScrollView } from '@codler/react-native-keyboard-aware-scroll-view';\nimport { useNavigation"
        )
        content = content.replace("  KeyboardAvoidingView,\n", "")
        content = content.replace("  ScrollView,\n", "")
        
        # Replace KeyboardAvoidingView tags with View
        content = re.sub(r'<KeyboardAvoidingView[^>]*>', '<View style={styles.flex}>', content)
        content = content.replace('</KeyboardAvoidingView>', '</View>')

        # Replace ScrollView tags with KeyboardAwareScrollView
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

    # Remaining Theme replacements
    content = content.replace("backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF'", "backgroundColor: themeColors.background")
    content = content.replace("backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7'", "backgroundColor: themeColors.input")
    content = content.replace("backgroundColor: isDark ? '#2A2A2E' : '#F7F7F7'", "backgroundColor: themeColors.input")
    content = content.replace("backgroundColor: isDark ? '#2E2E32' : '#2A2A2E'", "backgroundColor: isDark ? colors.white : colors.black")
    
    content = content.replace("color: isDark ? '#FFFFFF' : '#1C1C1E'", "color: themeColors.text")
    content = content.replace("color: isDark ? '#FFFFFF' : '#1A1A1C'", "color: themeColors.text")
    content = content.replace("color: isDark ? '#8A8A93' : '#9E9EAE'", "color: themeColors.secondaryText")
    content = content.replace("color: isDark ? '#8A8A93' : '#8E8E93'", "color: themeColors.secondaryText")
    content = content.replace("color: isDark ? '#000000' : '#FFFFFF'", "color: isDark ? '#000000' : '#FFFFFF'")
    content = content.replace("color: '#FFFFFF'", "color: isDark ? colors.black : '#FFFFFF'")
    
    content = content.replace("borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F0F0'", "borderBottomColor: themeColors.border")
    content = content.replace("borderColor: isDark ? '#2C2C2E' : '#E5E5EA'", "borderColor: themeColors.border")
    content = content.replace("backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA'", "backgroundColor: themeColors.border")

    with open(filepath, 'w') as f:
        f.write(content)

fix_emergency('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/Security/EmergencyContact/AddEmergencyContact.jsx')
fix_emergency('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/Security/EmergencyContact/EmergencyContactMain.jsx')

