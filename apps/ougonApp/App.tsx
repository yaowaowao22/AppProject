import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

// TODO: replace with RootNavigator after navigation setup
export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        <Text>Ratio — 黄金比フェイスエディター</Text>
        <StatusBar style="auto" />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
