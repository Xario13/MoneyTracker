import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Target, Plus, CreditCard } from 'lucide-react-native';
import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import SavingsGoalsTab from '@/components/SavingsGoalsTab';
import CreditGoalsTab from '@/components/CreditGoalsTab';

export default function GoalsScreen() {
  const [activeTab, setActiveTab] = useState<'savings' | 'credit'>('savings');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Goals</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'savings' && styles.tabButtonActive]}
          onPress={() => setActiveTab('savings')}
        >
          <Target color={activeTab === 'savings' ? "#1a1a1a" : "#c4ff00"} size={20} />
          <Text style={[styles.tabText, activeTab === 'savings' && styles.tabTextActive]}>
            Savings Goals
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'credit' && styles.tabButtonActive]}
          onPress={() => setActiveTab('credit')}
        >
          <CreditCard color={activeTab === 'credit' ? "#1a1a1a" : "#c4ff00"} size={20} />
          <Text style={[styles.tabText, activeTab === 'credit' && styles.tabTextActive]}>
            Credit Goals
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'savings' ? <SavingsGoalsTab /> : <CreditGoalsTab />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontFamily: 'Inter-Bold',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#c4ff00',
  },
  tabText: {
    color: '#c4ff00',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  tabTextActive: {
    color: '#1a1a1a',
  },
});