import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ironrealm.app',
  appName: 'Iron Realm',
  webDir: 'build',
  server: {
    url: 'https://ammarmubarez.github.io/Iron-Realm',
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#03060f'
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#03060f',
      overlaysWebView: false
    },
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
