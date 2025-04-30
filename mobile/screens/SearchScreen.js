import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput,
  Button, ActivityIndicator, StyleSheet
} from 'react-native';
import axios from 'axios';
import api from '../utils/api';

export default function SearchScreen({ navigation, route }) {
  const [allItems,    setAllItems]    = useState([]);
  const [displayItems,setDisplayItems]= useState([]);
  const [searchRef,   setSearchRef]   = useState('');
  const [loading,     setLoading]     = useState(true);

  // 1) Fetch all items
  useEffect(() => {
    (async () => {
      try {
        const resp = await api.getItems();
        setAllItems(resp);
        setDisplayItems(resp);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2) Handle scannedPartRef param
  useEffect(() => {
    const scanned = route.params?.scannedPartRef;
    if (scanned) {
      setSearchRef(scanned.trim().toUpperCase());
      navigation.setParams({ scannedPartRef: undefined });
    }
  }, [route.params?.scannedPartRef]);

  // 3) Filter whenever searchRef or allItems change
  useEffect(() => {
    const term = searchRef.trim().toLowerCase();
    if (!term) {
      setDisplayItems(allItems);
    } else {
      setDisplayItems(
        allItems.filter(item =>
          item['Craig-Yr-Hesg Part Ref']
            .toLowerCase()
            .includes(term)
        )
      );
    }
  }, [searchRef, allItems]);

  if (loading) {
    return <ActivityIndicator style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Filter by Part Ref…"
          value={searchRef}
          onChangeText={setSearchRef}
          autoCapitalize="characters"
        />
        <Button
          title="Scan"
          onPress={() => navigation.navigate('Scan')}
        />
      </View>

      {displayItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No items match “{searchRef}”
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayItems}
          keyExtractor={item => item['Craig-Yr-Hesg Part Ref']}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <Text style={styles.title}>
                {item['Craig-Yr-Hesg Part Ref']} — {item['Item Description']}
              </Text>
              <Text>
                Qty: {item.QUANTITY} (Min: {item['Min Level']}, Max: {item['Max Level']})
              </Text>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <View style={styles.footer}>
        <Button
          title="View Low-Stock Alerts"
          onPress={() => navigation.navigate('Alerts')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loader:         { flex: 1, justifyContent: 'center' },
  container:      { flex: 1, padding: 16 },
  searchRow:      { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
  input:          { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 4, marginRight: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText:      { fontSize: 16, color: '#555' },
  itemRow:        { paddingVertical: 8 },
  title:          { fontWeight: 'bold' },
  separator:      { height: 1, backgroundColor: '#eee' },
  footer:         { paddingVertical: 12 }
});
