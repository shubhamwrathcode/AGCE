const fs = require('fs');
let code = fs.readFileSync('src/screens/Futures/FuturesTrade.jsx', 'utf8');

const target = `{/* Current Price */}
          <View style={styles.currentPrice}>
            <AppText type={SIXTEEN} style={{ color: isPricePositive ? colors.green : colors.red }} weight={SEMI_BOLD}>{livePrice ? parseFloat(livePrice).toFixed(5) : "0.00000"}</AppText>
            <AppText type={TEN} style={{ color: themeColors.secondaryText }}>\${livePrice ? parseFloat(livePrice).toFixed(5) : "0.00000"}</AppText>
          </View>`;

const replacement = `{/* Current Price */}
          <View style={[styles.currentPrice, { alignItems: 'flex-start' }]}>
            <AppText style={{ color: isPricePositive ? colors.green : colors.red, fontWeight: "bold", fontSize: 19 }}>
              {livePrice || "0.00"}
            </AppText>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
              <AppText style={{ fontSize: 11, color: "#8E8E93", fontWeight: "500" }}>
                ≈ ${livePrice || "0.00"}
              </AppText>
            </View>
          </View>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/screens/Futures/FuturesTrade.jsx', code);
console.log('Fixed Future Price UI');
