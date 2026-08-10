import re

filepath = '/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/Security/LoginTwoStepVerificationScreen.js'
with open(filepath, 'r') as f:
    content = f.read()

# Fix hardcoded backgrounds
content = content.replace("backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7'", "backgroundColor: themeColors.input")
content = content.replace("backgroundColor: isDark ? '#1E1E22' : '#F5F5F7'", "backgroundColor: isDark ? colors.inputBorder : '#F5F5F7'")
content = content.replace("backgroundColor: isDark ? '#2A2A2E' : '#F7F7F7'", "backgroundColor: themeColors.input")
content = content.replace("backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF'", "backgroundColor: themeColors.background")
content = content.replace("backgroundColor: isDark ? '#121214' : '#FFFFFF'", "backgroundColor: themeColors.background")
content = content.replace("backgroundColor: isDark ? '#FFFFFF' : '#1C1C1E'", "backgroundColor: isDark ? colors.white : '#1C1C1E'")
content = content.replace("backgroundColor: isDark ? '#FFFFFF' : '#22252A'", "backgroundColor: isDark ? colors.white : '#22252A'")

# Fix borders
content = content.replace("borderBottomColor: isDark ? '#1E1E22' : '#F0F0F0'", "borderBottomColor: themeColors.border")
content = content.replace("borderColor: isDark ? '#2D2D30' : '#EBEBEB'", "borderColor: themeColors.border")
content = content.replace("borderColor: isDark ? '#2A2A2E' : '#EBEBEB'", "borderColor: themeColors.border")

# Fix texts
content = content.replace("color: isDark ? '#FFFFFF' : '#1A1A1C'", "color: themeColors.text")
content = content.replace("color: isDark ? '#FFFFFF' : '#000000'", "color: themeColors.text")
content = content.replace("color: isDark ? '#FFFFFF' : '#1C1C1E'", "color: themeColors.text")
content = content.replace("color: isDark ? '#8A8A93' : '#9E9EAE'", "color: themeColors.secondaryText")
content = content.replace("color: isDark ? '#D1D1D6' : '#4E4E54'", "color: themeColors.secondaryText")
content = content.replace("color: isDark ? '#000000' : '#FFFFFF'", "color: isDark ? '#000000' : '#FFFFFF'")
content = content.replace("tintColor={isDark ? '#FFFFFF' : '#000000'}", "tintColor={isDark ? colors.white : colors.black}")

with open(filepath, 'w') as f:
    f.write(content)
