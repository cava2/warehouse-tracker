// mobile/screens/ScanScreen.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';

export default function ScanScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFillObject}    // full-screen camera preview
        cameraType={CameraType.Back}             // back-facing camera
        scanBarcode={true}                       // enable barcode/QRCODE scanning
        onReadCode={({ nativeEvent }) => {
          const code = nativeEvent.codeStringValue?.trim().toUpperCase();
          navigation.navigate('Search', { scannedPartRef: code });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});