const fs = require('fs');
let code = fs.readFileSync('android/app/src/main/java/com/fip/MainActivity.kt', 'utf8');

// Insert WindowCompat
if (!code.includes('WindowCompat.setDecorFitsSystemWindows(window, true)')) {
    code = code.replace(
        /super\.onCreate\(savedInstanceState\)/,
        `super.onCreate(savedInstanceState)\n    WindowCompat.setDecorFitsSystemWindows(window, true)`
    );
}

fs.writeFileSync('android/app/src/main/java/com/fip/MainActivity.kt', code);
console.log('Reverted MainActivity.kt');
