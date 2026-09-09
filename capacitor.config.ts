import { CapacitorConfig } from '@capacitor/cli';

// Store builds MUST bundle the web app (webDir) rather than load it from a
// remote URL: Apple rejects apps whose primary experience is a remote web page
// (App Review 4.2 / 2.5.2), Google flags remote-code loading, and a bundled
// app works offline and is not affected by a compromised host. Build it with
//
//   npm run build:native && npx cap sync
//
// (build:native emits relative asset paths so the bundle resolves from the
// capacitor:// or https://localhost scheme.)
//
// For local development you can still point the shell at a dev server:
//
//   CAP_SERVER_URL=http://192.168.1.10:3000 npx cap run android
const devServer = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.ironrealm.app',
  appName: 'Iron Realm',
  webDir: 'build',
  ...(devServer ? { server: { url: devServer, cleartext: devServer.startsWith('http:') } } : {}),
  android: {
    backgroundColor: '#000000',
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#000000',
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000',
      overlaysWebView: false
    },
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
