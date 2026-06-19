const fs = require('fs');
let code = fs.readFileSync('android/app/src/main/res/values/styles.xml', 'utf8');

// Insert windowOptOutEdgeToEdgeEnforcement
if (!code.includes('android:windowOptOutEdgeToEdgeEnforcement')) {
    code = code.replace(
        /<item name="android:autofilledHighlight">@android:color\/transparent<\/item>/,
        `<item name="android:autofilledHighlight">@android:color/transparent</item>\n        <item name="android:windowOptOutEdgeToEdgeEnforcement">true</item>`
    );
}

fs.writeFileSync('android/app/src/main/res/values/styles.xml', code);
console.log('Reverted styles.xml');
