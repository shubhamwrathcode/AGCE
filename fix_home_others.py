import re
import os

def replace_in_file(filepath, replacements):
    if not os.path.exists(filepath):
        print(f"Skipping {filepath}, does not exist.")
        return
    with open(filepath, 'r') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, 'w') as f:
        f.write(content)

# Fix CoinSlider.js
replace_in_file('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/home/CoinSlider.js', [
    ("backgroundColor: '#F7F7F7'", "backgroundColor: isDark ? '#2A2A2E' : '#F7F7F7'"),
    ("backgroundColor: '#2C2C2E'", "backgroundColor: themeColors.input"),
    ("color: '#9ca3af'", "color: isDark ? '#8A8A93' : '#9ca3af'"),
])

# Fix HomeMenuBar.tsx
replace_in_file('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/home/HomeMenuBar.tsx', [
    ("backgroundColor: colors.iconBgColor", "backgroundColor: isDark ? themeColors.input : colors.iconBgColor"),
])

# Fix HomeCoinList.js
replace_in_file('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/home/HomeCoinList.js', [
    ("backgroundColor: \"#EFEFEF\"", "backgroundColor: isDark ? '#2A2A2E' : '#EFEFEF'"),
])

print("Other Home components fixed.")
