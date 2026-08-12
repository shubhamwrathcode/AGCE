import re
import os

filepath = '/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/Security/SecurityLogsScreen.jsx'
with open(filepath, 'r') as f:
    content = f.read()

# The target JSX for the time row
old_jsx = """<View style={[styles.cardRow, { borderBottomColor: borderCol }]}>
                      <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: labelCol }}>Time</AppText>
                      <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: valCol }}>{row.time}</AppText>
                    </View>"""

new_jsx = """<View style={[styles.cardRow, { borderBottomColor: borderCol }]}>
                      <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: labelCol }}>Time</AppText>
                      <View style={{ alignItems: 'flex-end' }}>
                        <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: valCol }}>{row.absTime}</AppText>
                        {!!row.relTime && (
                          <AppText type={TWELVE} weight={MEDIUM} style={{ color: labelCol, marginTop: 2 }}>{row.relTime}</AppText>
                        )}
                      </View>
                    </View>"""

content = content.replace(old_jsx, new_jsx)

with open(filepath, 'w') as f:
    f.write(content)

