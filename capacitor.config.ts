import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.spurana.app',
  appName: 'Spurana',
  webDir: 'www',
  backgroundColor: '#060409',
  android: { allowMixedContent: false },
  plugins: {
    SplashScreen: {
      backgroundColor: '#060409',
      launchShowDuration: 900,
      launchAutoHide: true,
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: { style: 'DARK', backgroundColor: '#060409', overlaysWebView: false },
  },
};

export default config;
