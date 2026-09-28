package com.agcx.exchange

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.activity.OnBackPressedCallback
import androidx.core.view.WindowCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import org.devio.rn.splashscreen.SplashScreen

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "AGCX"

  override fun onCreate(savedInstanceState: Bundle?) {
    setTheme(R.style.AppTheme)
    try {
      SplashScreen.show(this, R.style.SplashScreenTheme, false)
      // JS hides the splash on mount; never leave the app stuck behind it if that call fails.
      Handler(Looper.getMainLooper()).postDelayed({ SplashScreen.hide(this) }, 10_000)
    } catch (_: Throwable) {
      /* splash is best-effort; do not crash launch */
    }
    super.onCreate(savedInstanceState)
    WindowCompat.setDecorFitsSystemWindows(window, true)
    try {
      onBackPressedDispatcher.addCallback(
        this,
        object : OnBackPressedCallback(true) {
          override fun handleOnBackPressed() {
            val handled = try {
              reactActivityDelegate.onBackPressed()
            } catch (_: Throwable) {
              false
            }
            if (!handled) {
              isEnabled = false
              try {
                onBackPressedDispatcher.onBackPressed()
              } finally {
                isEnabled = true
              }
            }
          }
        },
      )
    } catch (_: Throwable) {
      /* back callback is best-effort; do not crash launch */
    }
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  

}