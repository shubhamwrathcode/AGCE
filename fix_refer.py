import re

with open('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/earning/ReferAndEarn.tsx', 'r') as f:
    content = f.read()

# Update useTheme destructuring
content = content.replace('const { isDark } = useTheme();', 'const { colors: themeColors, isDark } = useTheme();')

# Main background
content = content.replace("backgroundColor: '#fff'", "backgroundColor: themeColors.background")
content = content.replace('backgroundColor: "#fff"', 'backgroundColor: themeColors.background')
content = content.replace("backgroundColor: 'white'", "backgroundColor: themeColors.background")

# Text colors
content = content.replace("color: isDark ? colors.white : colors.black", "color: themeColors.text")
content = content.replace("color: isDark ? '#FFFFFF' : '#000000'", "color: themeColors.text")
content = content.replace("textColor: isDark ? \"#FFFFFF\" : \"#000000\"", "textColor: themeColors.text")
content = content.replace("color: '#000'", "color: themeColors.text")

# Backgrounds
content = content.replace("backgroundColor: isDark ? '#161616' : colors.white", "backgroundColor: isDark ? colors.newThemeColor : colors.white")
content = content.replace("backgroundColor: isDark ? '#161616' : '#fff'", "backgroundColor: isDark ? colors.newThemeColor : colors.white")
content = content.replace("backgroundColor: isDark ? '#0F0F0F' : '#F9F9F9'", "backgroundColor: isDark ? '#0F0F0F' : '#F9F9F9'")
content = content.replace("backgroundColor: isDark ? '#111' : '#fff'", "backgroundColor: isDark ? colors.newThemeColor : colors.white")

# Borders
content = content.replace("borderColor: isDark ? '#222' : '#EEE'", "borderColor: isDark ? colors.themeElevationColor : '#EEE'")
content = content.replace("borderColor: isDark ? '#333' : '#E0E0E0'", "borderColor: isDark ? colors.themeElevationColor : '#E0E0E0'")
content = content.replace("borderColor: isDark ? '#333' : '#eee'", "borderColor: isDark ? colors.themeElevationColor : '#eee'")


with open('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/earning/ReferAndEarn.tsx', 'w') as f:
    f.write(content)
