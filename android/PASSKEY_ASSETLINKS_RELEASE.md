Passkey — debug APK, release APK, aur Play Store — teeno pe chalna chahiye
==============================================================================

Rule
----
Android Credential Manager sirf tab trust karta hai jab app ke signing cert ka
SHA-256 is file mein ho:

  https://arabglobal.ae/.well-known/assetlinks.json

Different installs = different certificates:

| Install type              | Certificate              | SHA (must be in assetlinks) |
|---------------------------|--------------------------|-----------------------------|
| Metro / debug APK         | debug.keystore           | 0A:78:CC:…                  |
| Local release APK / AAB   | agcx-upload-key.keystore | 31:F1:EF:…                  |
| Play Store download       | Play App Signing (same as upload in your case) | 31:F1:EF:… |

Note: Play Console se jo SHA aaya (`31:F1:…`) wahi upload key hai.
Purana `C5:D1:…` bhi list mein rakho (older / alternate signing).

-----------------------------------------------------------------------------
FINAL assetlinks.json  (ye exact body CDN pe lagao)
-----------------------------------------------------------------------------

[
  {
    "relation": [
      "delegate_permission/common.handle_all_urls",
      "delegate_permission/common.get_login_creds"
    ],
    "target": {
      "namespace": "android_app",
      "package_name": "com.agcx.exchange",
      "sha256_cert_fingerprints": [
        "0A:78:CC:CF:CF:AE:29:1B:FF:02:00:CE:3B:A4:25:7A:18:A2:54:EC:DD:56:3B:76:FE:99:06:25:44:90:22:C7",
        "31:F1:EF:07:E5:97:07:67:8F:1F:B9:05:78:8B:0F:69:3B:23:E3:69:6C:81:4A:B2:AD:39:08:7C:83:D5:34:D7",
        "C5:D1:E4:67:C3:4B:A7:79:56:27:7E:84:B4:C2:A0:FD:71:06:A4:BC:14:89:60:22:0C:17:AD:9C:F1:92:10:EA"
      ]
    }
  }
]

URL:
  https://arabglobal.ae/.well-known/assetlinks.json

-----------------------------------------------------------------------------
App side (already done)
-----------------------------------------------------------------------------
android/app/src/main/res/values/strings.xml → asset_statements points to
https://arabglobal.ae/.well-known/assetlinks.json

-----------------------------------------------------------------------------
Checklist after CDN update
-----------------------------------------------------------------------------
1. Browser / curl se open karo — 3 SHA dikhne chahiye (especially 31:F1:…)
2. Purani release APK uninstall → naya release APK install → Add Passkey
3. Play Store se install (ya internal testing) → Add Passkey
4. Debug build → Add Passkey (already worked)

Agar Play Console → App integrity → "App signing key certificate" SHA
`31:F1:…` se alag dikhe, woh extra SHA bhi list mein add karna.
