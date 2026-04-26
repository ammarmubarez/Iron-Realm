const fs = require('fs');

const base = 'android/app/src/main/res';

const files = {
  [`${base}/drawable/ic_launcher_background.xml`]:
`<?xml version="1.0" encoding="utf-8"?>
<color xmlns:android="http://schemas.android.com/apk/res/android">#03060f</color>`,

  // Android Studio sometimes generates this in values folder instead
  [`${base}/values/ic_launcher_background.xml`]:
`<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#03060f</color>
</resources>`,

  [`${base}/mipmap-anydpi-v26/ic_launcher.xml`]:
`<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>`,

  [`${base}/mipmap-anydpi-v26/ic_launcher_round.xml`]:
`<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>`,

  [`${base}/values/strings.xml`]:
`<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Iron Realm</string>
    <string name="title_activity_main">Iron Realm</string>
    <string name="package_name">com.ironrealm.app</string>
    <string name="custom_url_scheme">com.ironrealm.app</string>
</resources>`,
};

Object.entries(files).forEach(([filePath, content]) => {
  try {
    fs.writeFileSync(filePath, content, { encoding: 'utf8' });
    console.log('Fixed:', filePath);
  } catch (e) {
    console.error('Error fixing', filePath, e.message);
  }
});

console.log('Done! Now rebuild in Android Studio.');
