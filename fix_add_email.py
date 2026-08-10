import re

with open('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/Security/AddEmailScreen.js', 'r') as f:
    content = f.read()

# Replace hardcoded input container backgrounds
content = content.replace(
    "backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7'",
    "backgroundColor: themeColors.input"
)
content = content.replace(
    "backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF'",
    "backgroundColor: themeColors.background"
)

# Replace field labels
content = content.replace(
    "color: isDark ? '#FFFFFF' : '#1C1C1E'",
    "color: themeColors.text"
)

# Replace input text colors
content = content.replace(
    "color: isDark ? colors.newThemeColor : '#1C1C1E'",
    "color: themeColors.text"
)
content = content.replace(
    "color: isDark ? '#FFFFFF' : '#1C1C1E'",
    "color: themeColors.text"
)

# Replace placeholders
content = content.replace(
    "placeholderTextColor={isDark ? '#8A8A93' : '#9E9EAE'}",
    "placeholderTextColor={themeColors.secondaryText}"
)

# Replace suggestion rows
content = content.replace(
    "color: isDark ? '#FFFFFF' : '#1A1A1C'",
    "color: themeColors.text"
)
content = content.replace(
    "borderColor: isDark ? '#2C2C2E' : '#E5E5EA'",
    "borderColor: themeColors.border"
)

# Confirm btn text
content = content.replace(
    "color: isDark ? '#000000' : '#FFFFFF'",
    "color: isDark ? '#000000' : '#FFFFFF'"
)
content = content.replace(
    "backgroundColor: isDark ? '#FFFFFF' : '#22252A'",
    "backgroundColor: isDark ? colors.white : '#22252A'"
)

with open('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/Security/AddEmailScreen.js', 'w') as f:
    f.write(content)
