import re
import os

def fix_acct(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r') as f:
        content = f.read()

    # Revert typo
    content = content.replace(
        "backgroundColor: googleConnected\n                    ? (isDark ? '#2A2A2E' : '#F5F5F7')\n                    : colors.black",
        "backgroundColor: appleConnected\n                    ? (isDark ? '#2A2A2E' : '#F5F5F7')\n                    : (isDark ? colors.white : colors.black)"
    )

    content = content.replace("backgroundColor: isDark ? '#1C1C1E' : colors.iconBgColor", "backgroundColor: themeColors.input")
    content = content.replace("backgroundColor: googleConnected\n                    ? (isDark ? '#2A2A2E' : '#F5F5F7')\n                    : colors.black", "backgroundColor: googleConnected\n                    ? (isDark ? '#2A2A2E' : '#F5F5F7')\n                    : (isDark ? colors.white : colors.black)")
    
    # Theme replacements
    content = content.replace("backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF'", "backgroundColor: themeColors.background")
    content = content.replace("backgroundColor: isDark ? '#121214' : '#FFFFFF'", "backgroundColor: themeColors.background")
    content = content.replace("backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7'", "backgroundColor: themeColors.input")
    content = content.replace("backgroundColor: isDark ? '#2A2A2E' : '#F5F5F7'", "backgroundColor: themeColors.input")
    content = content.replace("backgroundColor: isDark ? '#2A2A2E' : '#F7F7F7'", "backgroundColor: themeColors.input")
    
    content = content.replace("color: isDark ? '#FFFFFF' : '#1A1A1C'", "color: themeColors.text")
    content = content.replace("color: isDark ? '#FFFFFF' : '#000000'", "color: themeColors.text")
    content = content.replace("color: isDark ? '#FFFFFF' : '#1C1C1E'", "color: themeColors.text")
    content = content.replace("color: isDark ? '#8A8A93' : '#9E9EAE'", "color: themeColors.secondaryText")
    content = content.replace("color: isDark ? '#8A8A93' : '#8E8E93'", "color: themeColors.secondaryText")
    
    content = content.replace("borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F0F0'", "borderBottomColor: themeColors.border")
    content = content.replace("borderColor: isDark ? '#2C2C2E' : '#E5E5EA'", "borderColor: themeColors.border")
    
    content = content.replace("tintColor={isDark ? '#FFFFFF' : '#000000'}", "tintColor={isDark ? colors.white : colors.black}")
    content = content.replace("tintColor={'#000000'}", "tintColor={isDark ? colors.white : colors.black}")

    with open(filepath, 'w') as f:
        f.write(content)

fix_acct('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/Security/AccountConnections.jsx')

