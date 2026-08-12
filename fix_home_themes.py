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

# Fix Home.js
replace_in_file('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/home/Home.js', [
    ("backgroundColor: '#F7F7F7'", "backgroundColor: themeColors.input"),
    ("backgroundColor: '#303236'", "backgroundColor: isDark ? colors.white : '#303236'"),
    ("color: colors.white", "color: isDark ? colors.black : colors.white"),
    ("backgroundColor: colors.iconBgColor", "backgroundColor: themeColors.input"),
    ("borderColor: lightTheme.input", "borderColor: themeColors.border"),
])

# Fix HomeSlider.js
replace_in_file('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/home/HomeSlider.js', [
    ("backgroundColor: '#F7F7F7'", "backgroundColor: isDark ? '#2A2A2E' : '#F7F7F7'"),
    ("color: '#9ca3af'", "color: isDark ? '#8A8A93' : '#9ca3af'"),
    ("backgroundColor: lightTheme.input", "backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0'"),
    ("backgroundColor: \"#E5E7EB\"", "backgroundColor: isDark ? '#3A3A3C' : '#E5E7EB'"),
])

# Fix CoinList.js
replace_in_file('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/home/CoinList.js', [
    ("backgroundColor: \"#F3F4F6\"", "backgroundColor: themeColors.input"),
    ("color: \"#111827\"", "color: themeColors.text"),
    ("color: \"#9CA3AF\"", "color: themeColors.secondaryText"),
])

# Fix MoreMenu.js (Since it popped up with #F0F3F6)
replace_in_file('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/home/MoreMenu.js', [
    ("backgroundColor: isDark ? themeColors.themeSelection : \"#F0F3F6\"", "backgroundColor: isDark ? themeColors.input : \"#F0F3F6\""),
])

print("Home theme replacement done.")
