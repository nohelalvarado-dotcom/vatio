export const config = {
  appId: 'com.vatio.energy',
  appName: 'VATIO',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#111C2C',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#111C2C',
    },
  },
};

export default config;
