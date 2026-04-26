const fs = require('fs');
const path = require('path');

const SOURCE = 'public/icons/icon-512.png';

// All mipmap folders that need the launcher icon
const MIPMAP_FOLDERS = [
  'android/app/src/main/res/mipmap-mdpi',
  'android/app/src/main/res/mipmap-hdpi',
  'android/app/src/main/res/mipmap-xhdpi',
  'android/app/src/main/res/mipmap-xxhdpi',
  'android/app/src/main/res/mipmap-xxxhdpi',
];

// Check source exists
if (!fs.existsSync(SOURCE)) {
  console.error('ERROR: Could not find', SOURCE);
  console.error('Make sure you run this from inside the iron-realm folder');
  process.exit(1);
}

const iconData = fs.readFileSync(SOURCE);

MIPMAP_FOLDERS.forEach(folder => {
  // Create folder if it doesn't exist
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    console.log('Created folder:', folder);
  }

  // Copy icon as all three launcher icon filenames
  ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png'].forEach(name => {
    const dest = path.join(folder, name);
    fs.writeFileSync(dest, iconData);
    console.log('Copied to:', dest);
  });
});

// Also fix the XML files with BOM issues
const base = 'android/app/src/main/res';
const xmlFiles = {
  [`${base}/values/strings.xml`]:
`<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Iron Realm</string>
    <string name="title_activity_main">Iron Realm</string>
    <string name="package_name">com.ironrealm.app</string>
    <string name="custom_url_scheme">com.ironrealm.app</string>
</resources>`,

  [`${base}/values/ic_launcher_background.xml`]:
`<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#03060f</color>
</resources>`,

  [`${base}/drawable/ic_launcher_background.xml`]:
`<?xml version="1.0" encoding="utf-8"?>
<color xmlns:android="http://schemas.android.com/apk/res/android">#03060f</color>`,

  [`${base}/mipmap-anydpi-v26/ic_launcher.xml`]:
`<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`,

  [`${base}/mipmap-anydpi-v26/ic_launcher_round.xml`]:
`<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`,
};

Object.entries(xmlFiles).forEach(([filePath, content]) => {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content, { encoding: 'utf8' });
    console.log('Fixed XML:', filePath);
  } catch (e) {
    console.error('Error:', filePath, e.message);
  }
});

console.log('\nAll done! Now in Android Studio: Build → Build APK');
