import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'coffee.elixr.app',
  appName: 'Elixr',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor'
  },
  plugins: {
    StatusBar: {
      style: 'Light',
      backgroundColor: '#ffffff', // white
      overlaysWebView: false
    },
    Keyboard: {
      resize: 'native',
      resizeOnFullScreen: true
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    }
  }
};

export default config;
