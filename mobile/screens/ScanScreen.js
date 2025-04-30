// mobile/screens/ScanScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, PermissionsAndroid, Platform } from 'react-native';
import { CameraScreen } from 'react-native-camera-kit';

export default function ScanScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    async function request() {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'We need camera to scan barcodes',
            buttonPositive: 'OK',
          }
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        setHasPermission(true);
      }
    }
    request();
  }, []);

  if (hasPermission === null) return <Text>Requesting camera…</Text>;
  if (hasPermission === false) return <Text>No access to camera</Text>;

  return (
    <View style={styles.container}>
      <CameraScreen
        scanBarcode={true}
        laserColor="red"
        frameColor="white"
        onReadCode={e => {
          const data = e.nativeEvent.codeStringValue;
          Alert.alert('Scanned!', data, [
            {
              text: 'OK',
              onPress: () =>
                navigation.navigate('Search', { scannedPartRef: data.trim().toUpperCase(), merge: true })
            }
          ]);
        }}
      />
      <View style={styles.footer}>
        <Button title="Cancel" onPress={() => navigation.goBack()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  footer:    { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },
});
