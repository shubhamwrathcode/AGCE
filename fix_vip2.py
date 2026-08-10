import re

with open('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/account/VipServices.jsx', 'r') as f:
    content = f.read()

# Fix styles object
content = content.replace('backgroundColor: DARK_BG,', '')
content = content.replace('backgroundColor: CARD_BG,', '')
content = content.replace('borderColor: BORDER,', '')

# Ensure the inline styles are correct in JSX
content = content.replace('<View style={styles.customHeader}>', '<View style={[styles.customHeader, { backgroundColor: DARK_BG }]}>')
content = content.replace('style={styles.tierCard}', 'style={[styles.tierCard, { borderColor: BORDER }]}')
content = content.replace('style={styles.featureCard}', 'style={[styles.featureCard, { backgroundColor: CARD_BG }]}')
content = content.replace('style={styles.modalContent}', 'style={[styles.modalContent, { backgroundColor: CARD_BG, borderColor: BORDER }]}')
content = content.replace('style={styles.benefitBadge}', "style={[styles.benefitBadge, { backgroundColor: isDark ? '#1A1A1A' : '#F3F4F6', borderColor: isDark ? '#333333' : '#E5E7EB' }]}")
content = content.replace("backgroundColor: '#1A1A1A',", '')
content = content.replace("borderColor: '#333333',", '')

with open('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/account/VipServices.jsx', 'w') as f:
    f.write(content)
