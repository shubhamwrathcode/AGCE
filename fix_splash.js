const fs = require('fs');

// 1. Fix MainActivity.kt
let mainActivity = fs.readFileSync('android/app/src/main/java/com/fip/MainActivity.kt', 'utf8');

// Remove WindowCompat from onCreate
mainActivity = mainActivity.replace(
    /\s*WindowCompat\.setDecorFitsSystemWindows\(window, true\)/,
    ""
);

// Add onWindowFocusChanged
if (!mainActivity.includes('onWindowFocusChanged')) {
    const onWindowFocusChangedCode = `
  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    if (hasFocus) {
      WindowCompat.setDecorFitsSystemWindows(window, true)
    }
  }
`;
    mainActivity = mainActivity.replace(
        /}\s*$/,
        onWindowFocusChangedCode + "\n}"
    );
}

fs.writeFileSync('android/app/src/main/java/com/fip/MainActivity.kt', mainActivity);

// 2. Fix styles.xml
let styles = fs.readFileSync('android/app/src/main/res/values/styles.xml', 'utf8');

// Ensure we have transparent status bar and translucent status for splash
if (!styles.includes('android:windowTranslucentStatus')) {
    styles = styles.replace(
        /<item name="android:statusBarColor">#FFFFFF<\/item>/,
        `<item name="android:statusBarColor">@android:color/transparent</item>\n        <item name="android:windowTranslucentStatus">true</item>`
    );
}
// Remove OptOutEdgeToEdgeEnforcement so Android 15 allows edge-to-edge initially
styles = styles.replace(/\s*<item name="android:windowOptOutEdgeToEdgeEnforcement">true<\/item>/, "");

fs.writeFileSync('android/app/src/main/res/values/styles.xml', styles);
console.log('Fixed Splash Screen natively');
