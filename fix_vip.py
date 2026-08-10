import re

with open('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/account/VipServices.jsx', 'r') as f:
    content = f.read()

# Remove the static constants
content = re.sub(r'const DARK_BG = "#000000";\n', '', content)
content = re.sub(r'const CARD_BG = "#111111";\n', '', content)
content = re.sub(r'const BORDER = "#222222";\n', '', content)
content = re.sub(r'const TEXT_WHITE = "#FFFFFF";\n', '', content)
content = re.sub(r'const TEXT_GRAY = "rgba\(255, 255, 255, 0\.6\)";\n', '', content)

# Add useTheme import
content = content.replace('import { fontFamilySemiBold } from "../../theme/typography";',
                          'import { fontFamilySemiBold } from "../../theme/typography";\nimport { useTheme } from "../../hooks/useTheme";\nimport { colors } from "../../theme/colors";')

# Inject hook into components
content = content.replace('const SectionTitle = ({ title }) => (', 'const SectionTitle = ({ title, themeColors }) => (')
content = content.replace('<SectionTitle title="VIP Tier Structure" />', '<SectionTitle title="VIP Tier Structure" themeColors={themeColors} />')
content = content.replace('<SectionTitle title="VIP Features" />', '<SectionTitle title="VIP Features" themeColors={themeColors} />')
content = content.replace('<SectionTitle title="Coming Soon" />', '<SectionTitle title="Coming Soon" themeColors={themeColors} />')

content = content.replace('const DetailRow = ({ label, value }) => (', 'const DetailRow = ({ label, value, themeColors }) => (')
content = content.replace('label="Tier"', 'label="Tier" themeColors={themeColors}')
content = content.replace('label="30d Volume (USD)"', 'label="30d Volume (USD)" themeColors={themeColors}')
content = content.replace('label="Maker Fee"', 'label="Maker Fee" themeColors={themeColors}')
content = content.replace('label="Taker Fee"', 'label="Taker Fee" themeColors={themeColors}')
content = content.replace('label="Benefits"', 'label="Benefits" themeColors={themeColors}')

# Inject useTheme in VipServices
content = content.replace('const VipServices = () => {\n  const [selectedTier, setSelectedTier] = useState(null);',
                          'const VipServices = () => {\n  const [selectedTier, setSelectedTier] = useState(null);\n  const { themeColors, isDark } = useTheme();\n  \n  const DARK_BG = isDark ? themeColors.background : colors.white;\n  const CARD_BG = isDark ? "#111111" : colors.white;\n  const BORDER = themeColors.border;\n  const TEXT_WHITE = themeColors.text;\n  const TEXT_GRAY = themeColors.secondaryText;')

# Modify inline TEXT_WHITE and others inside SectionTitle and DetailRow
content = content.replace('color: TEXT_WHITE', 'color: themeColors.text')
content = content.replace('color: TEXT_GRAY', 'color: themeColors.secondaryText')
content = content.replace('tintColor={TEXT_WHITE}', 'tintColor={themeColors.text}')
content = content.replace('backgroundColor: DARK_BG', 'backgroundColor: DARK_BG') # In VipServices it's defined! Wait, in StyleSheet it's not defined anymore!

with open('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/account/VipServices.jsx', 'w') as f:
    f.write(content)
