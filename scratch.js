const fs = require('fs');
const file = 'c:\\Users\\DESKTOP\\Desktop\\AGCE\\src\\screens\\spotScreen\\SpotChartScreen.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<AppText\s+type=\{TEN\}\s+style=\{\[\s*styles\.mtCell,\s*\{\s*color:\s*item\?\.side === "BUY"\s*\?\s*themeColors\.green \|\| "#00c076"\s*:\s*themeColors\.red \|\| "#ff3b30",\s*textAlign:\s*"left",\s*fontWeight:\s*"600",\s*\},/g, 
'<AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.mtCell, { color: item?.side === "BUY" ? themeColors.green || "#00c076" : themeColors.red || "#ff3b30", textAlign: "left" },');

content = content.replace(/<AppText\s+type=\{TEN\}\s+style=\{\[\s*styles\.mtCell,\s*\{\s*color:\s*item\?\.side === "BUY"\s*\?\s*themeColors\.green \|\| "#00c076"\s*:\s*themeColors\.red \|\| "#ff3b30",\s*textAlign:\s*"left",\s*fontWeight:\s*"600",\s*\}\s*\]\}\s*>/g, 
'<AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.mtCell, { color: item?.side === "BUY" ? themeColors.green || "#00c076" : themeColors.red || "#ff3b30", textAlign: "left" }]}>');

content = content.replace(/<AppText\s+type=\{TEN\}\s+style=\{\[\s*styles\.mtCell,\s*\{\s*color:\s*themeColors\.text\s*\|\|\s*"#000",\s*textAlign:\s*"center"\s*\}\]\}\s*>/g, 
'<AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.mtCell, { color: themeColors.text || "#000", textAlign: "center" }]}>');

content = content.replace(/<AppText type=\{TEN\} style=\{\[styles\.mtCell, \{ color: themeColors\.text \|\| "#000", textAlign: "center" \}\]\}>/g, 
'<AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.mtCell, { color: themeColors.text || "#000", textAlign: "center" }]}>');

content = content.replace(/<AppText\s+type=\{TEN\}\s+style=\{\[\s*styles\.mtCell,\s*\{\s*color:\s*themeColors\.secondaryText\s*\|\|\s*"#888",\s*textAlign:\s*"right"\s*\},/g, 
'<AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.mtCell, { color: themeColors.secondaryText || "#888", textAlign: "right" },');

content = content.replace(/<AppText\s+type=\{TEN\}\s+style=\{\[\s*styles\.mtCell,\s*\{\s*color:\s*themeColors\.secondaryText\s*\|\|\s*"#888",\s*textAlign:\s*"right"\s*\}\]\}/g, 
'<AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.mtCell, { color: themeColors.secondaryText || "#888", textAlign: "right" }]}');

fs.writeFileSync(file, content);
console.log("Replaced fonts!");
