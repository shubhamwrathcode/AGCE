import re

filepath = '/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/Security/AntiPhishing/AgceGoldCard.js'
with open(filepath, 'r') as f:
    content = f.read()

# Fix the incomplete syntax error first
content = content.replace("color: \n          }]}>", "color: isDark ? '#8A8A93' : '#4E4E54'\n          }]}>")

# Now apply theme logic correctly
content = content.replace("backgroundColor: isDark ? colors.inputBorder : '#FFFFFF'", "backgroundColor: isDark ? colors.inputBorder : '#FFFFFF'")
content = content.replace("borderColor: isDark ? '#2D2D30' : '#E5E5EA'", "borderColor: isDark ? '#2D2D30' : '#E5E5EA'")

with open(filepath, 'w') as f:
    f.write(content)

# Fix AntiPhishingStatus
ap_status = '/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/Security/AntiPhishing/AntiPhishingStatus.js'
with open(ap_status, 'r') as f:
    status_content = f.read()

status_content = status_content.replace("backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF'", "backgroundColor: themeColors.background")
status_content = status_content.replace("backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7'", "backgroundColor: themeColors.input")
status_content = status_content.replace("backgroundColor: isDark ? '#121214' : '#FFFFFF'", "backgroundColor: themeColors.background")

status_content = status_content.replace("color: isDark ? '#FFFFFF' : '#1A1A1C'", "color: themeColors.text")
status_content = status_content.replace("color: isDark ? '#FFFFFF' : '#000000'", "color: themeColors.text")
status_content = status_content.replace("color: isDark ? '#8A8A93' : '#9E9EAE'", "color: themeColors.secondaryText")
status_content = status_content.replace("color: isDark ? '#D1D1D6' : '#4E4E54'", "color: themeColors.secondaryText")
status_content = status_content.replace("borderBottomColor: isDark ? '#1E1E22' : '#F0F0F0'", "borderBottomColor: themeColors.border")

with open(ap_status, 'w') as f:
    f.write(status_content)
