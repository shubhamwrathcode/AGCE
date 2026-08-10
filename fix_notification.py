import re

with open('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/account/NotificationSettings.tsx', 'r') as f:
    content = f.read()

# Replace RadioGroup selected styles
content = content.replace(
    'isSelected && styles.radioOuterCircleSelected]',
    'isSelected && { borderColor: themeColors.text }]'
)

content = content.replace(
    '{isSelected && <View style={styles.radioInnerCircle} />}',
    '{isSelected && <View style={[styles.radioInnerCircle, { backgroundColor: themeColors.text }]} />}'
)

# Fix View style={styles.card}
# It appears multiple times: <View style={styles.card}>
content = content.replace(
    '<View style={styles.card}>',
    '<View style={[styles.card, { backgroundColor: isDark ? colors.newThemeColor : colors.white, borderColor: isDark ? colors.themeElevationColor : colors.iconBgColor }]}>'
)

# Remove the broken styles from StyleSheet to avoid confusion (they are overridden anyway)
# styles.card: backgroundColor: colors.white,
content = content.replace('backgroundColor: colors.white,', '')

# radioOuterCircleSelected and radioInnerCircle properties that we inline
content = content.replace('borderColor: colors.black, // Theme primary/gold color for active states', '')
content = content.replace('backgroundColor: colors.black,', '')

with open('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/account/NotificationSettings.tsx', 'w') as f:
    f.write(content)
