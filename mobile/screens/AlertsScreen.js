// mobile/screens/AlertsScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Button
} from 'react-native';
import api from '../utils/api';

export default function AlertsScreen({ navigation }) {
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const items = await api.getItems();
        // filter items where QUANTITY < Min Level
        const lowStock = items.filter(item => {
          const qty = Number(item.QUANTITY);
          const min = Number(item['Min Level']);
          return qty < min;
        });
        setAlerts(lowStock);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <ActivityIndicator style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      {alerts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            All stock levels are at or above minimum.
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={item => item['Craig-Yr-Hesg Part Ref']}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <Text style={styles.title}>
                {item['Craig-Yr-Hesg Part Ref']} — {item['Item Description']}
              </Text>
              <Text>
                Qty: {item.QUANTITY}  (Min: {item['Min Level']})
              </Text>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <View style={styles.footer}>
        <Button title="Back to Search" onPress={() => navigation.navigate('Search')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loader:         { flex: 1, justifyContent: 'center' },
  container:      { flex: 1, padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText:      { fontSize: 16, color: '#555' },
  itemRow:        { paddingVertical: 8 },
  title:          { fontWeight: 'bold' },
  separator:      { height: 1, backgroundColor: '#eee' },
  footer:         { paddingVertical: 12 }
});
