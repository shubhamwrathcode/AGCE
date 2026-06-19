const fs = require('fs');

// 1. Revert MainActivity.kt
let mainActivity = fs.readFileSync('android/app/src/main/java/com/fip/MainActivity.kt', 'utf8');

mainActivity = mainActivity.replace(
  /override fun onWindowFocusChanged\(hasFocus: Boolean\) \{[\s\S]*?super\.onWindowFocusChanged\(hasFocus\)[\s\S]*?if \(hasFocus\) \{[\s\S]*?WindowCompat\.setDecorFitsSystemWindows\(window, true\)[\s\S]*?\}[\s\S]*?\}/,
  ""
);

if (!mainActivity.includes('WindowCompat.setDecorFitsSystemWindows(window, true)')) {
    mainActivity = mainActivity.replace(
        /super\.onCreate\(savedInstanceState\)/,
        `super.onCreate(savedInstanceState)\n    WindowCompat.setDecorFitsSystemWindows(window, true)`
    );
}

fs.writeFileSync('android/app/src/main/java/com/fip/MainActivity.kt', mainActivity);

// 2. Revert styles.xml
let styles = fs.readFileSync('android/app/src/main/res/values/styles.xml', 'utf8');

styles = styles.replace(
    /<item name="android:statusBarColor">@android:color\/transparent<\/item>\n        <item name="android:windowTranslucentStatus">true<\/item>/,
    `<item name="android:statusBarColor">#FFFFFF</item>`
);

if (!styles.includes('android:windowOptOutEdgeToEdgeEnforcement')) {
    styles = styles.replace(
        /<item name="android:autofilledHighlight">@android:color\/transparent<\/item>/,
        `<item name="android:autofilledHighlight">@android:color/transparent</item>\n        <item name="android:windowOptOutEdgeToEdgeEnforcement">true</item>`
    );
}

fs.writeFileSync('android/app/src/main/res/values/styles.xml', styles);
console.log('Reverted splash screen changes');
