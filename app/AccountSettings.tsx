import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import CustomAlert from '@/components/CustomAlert';
import { useData } from '@/contexts/DataContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AccountSettings() {
  const router = useRouter();
  const { user, updateUserName } = useAuth();
  const dataContext = useData() as ReturnType<typeof useData> & { clearData: () => void };
  const { financialData, funds, creditCards, savingsGoals, creditGoals, transactions } = dataContext;
  const [name, setName] = useState(user?.name || '');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info', buttons: [{ text: 'OK' }] });
  const [resetConfirmVisible, setResetConfirmVisible] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      setAlertConfig({ title: 'Error', message: 'Name cannot be empty', type: 'error', buttons: [{ text: 'OK' }] });
      setAlertVisible(true);
      return;
    }
    await updateUserName(name);
    setAlertConfig({ title: 'Success', message: 'Name updated successfully', type: 'success', buttons: [{ text: 'OK' }] });
    setAlertVisible(true);
  };

  const handleResetAllData = async () => {
    if (!user) return;
    // Remove all relevant AsyncStorage keys for this user
    const keys = [
      `financialData_${user.id}`,
      `funds_${user.id}`,
      `creditCards_${user.id}`,
      `savingsGoals_${user.id}`,
      `creditGoals_${user.id}`,
      `transactions_${user.id}`
    ];
    await AsyncStorage.multiRemove(keys);
    // Also clear in-memory state
    dataContext.clearData();
    setAlertConfig({
      title: 'Reset Complete',
      message: 'All your budget and money data has been cleared. You can start fresh!',
      type: 'success',
      buttons: [{ text: 'OK' }]
    });
    setAlertVisible(true);
    setResetConfirmVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X color="#ffffff" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Account Settings</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>Your Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor="#666666"
          maxLength={30}
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resetButton} onPress={() => setResetConfirmVisible(true)}>
          <Text style={styles.resetButtonText}>Reset All Data</Text>
        </TouchableOpacity>
      </View>
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type as any}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
      />
      <CustomAlert
        visible={resetConfirmVisible}
        title="Reset All Data?"
        message="This will clear all your budget, funds, cards, and transaction data for this account. This cannot be undone. Are you sure?"
        type="warning"
        buttons={[
          { text: 'Cancel', style: 'cancel', onPress: () => setResetConfirmVisible(false) },
          { text: 'Reset', style: 'destructive', onPress: handleResetAllData }
        ]}
        onClose={() => setResetConfirmVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  label: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#232323',
    color: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: '#c4ff00',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  resetButton: {
    backgroundColor: '#f87171',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
}); 