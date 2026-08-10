import re

with open('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/earning/ReferAndEarn.tsx', 'r') as f:
    content = f.read()

# tintColor
content = content.replace("tintColor={isDark ? colors.white : colors.black}", "tintColor={themeColors.text}")

with open('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/earning/ReferAndEarn.tsx', 'w') as f:
    f.write(content)
