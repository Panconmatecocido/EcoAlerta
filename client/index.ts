import { registerRootComponent } from 'expo';
import { Alert } from 'react-native';
import App from './App';

if (typeof (global as any).ErrorUtils !== 'undefined') {
  const prevHandler = (global as any).ErrorUtils.getGlobalHandler();
  (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
    console.error('Global Error caught:', error);
    try {
      Alert.alert(
        'Diagnóstico EcoAlerta',
        `${error?.name || 'Error'}: ${error?.message || String(error)}\n\n${error?.stack ? String(error.stack).slice(0, 300) : ''}`,
        [{ text: 'OK' }]
      );
    } catch (_) {}
    if (prevHandler) {
      prevHandler(error, isFatal);
    }
  });
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
