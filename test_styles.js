const fs = require('fs');
let code = fs.readFileSync('android/app/src/main/res/values/styles.xml', 'utf8');

if (!code.includes('android:windowTranslucentStatus')) {
    code = code.replace(
        /<item name="android:statusBarColor">#FFFFFF<\/item>/,
        `<item name="android:statusBarColor">@android:color/transparent</item>\n        <item name="android:windowTranslucentStatus">true</item>`
    );
}

fs.writeFileSync('android/app/src/main/res/values/styles.xml', code);
console.log('Fixed styles.xml with translucent status');
