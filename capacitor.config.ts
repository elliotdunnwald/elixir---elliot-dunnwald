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
      backgroundColor: '#f4f4f5', // zinc-100
      overlaysWebView: false
    },
    Keyboard: {
      resize: 'native',
      resizeOnFullScreen: true
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#f4f4f5',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    }
  }
};

export default config;
