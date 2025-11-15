import packageJson from '../../package.json';

export const APP_VERSION = {
  web: packageJson.version,
  android: '0.9.4.1'
};

export const getVersionString = () => `Version: ${APP_VERSION.web} | Android: ${APP_VERSION.android}`;