import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { CreditCard, Calendar, TrendingDown } from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import CreditCardUI from './CreditCardUI';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function CreditGoalsTab() {
  const { creditCards, creditGoals } = useData();
  const { user } = useAuth();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getDaysUntilDue = (billDate: Date) => {
    const now = new Date();
    const nextBillDate = new Date(billDate);
    
    // If the bill date has passed this month, move to next month
    if (nextBillDate.getDate() < now.getDate()) {
      nextBillDate.setMonth(nextBillDate.getMonth() + 1);
    }
    
    const diffTime = nextBillDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
  };

  const getPaymentStatus = (balance: number, daysUntilDue: number) => {
    if (balance === 0) return { text: 'Paid', color: '#4ade80' };
    if (daysUntilDue <= 3) return { text: 'Due Soon', color: '#f87171' };
    if (daysUntilDue <= 7) return { text: 'Due This Week', color: '#fbbf24' };
    return { text: `${daysUntilDue} days left`, color: '#4ade80' };
  };

  if (creditCards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <CreditCard color="#666666" size={48} />
        <Text style={styles.emptyTitle}>No Credit Cards</Text>
        <Text style={styles.emptyText}>
          Add credit cards to track payment due dates and balances
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Credit Card Due Dates</Text>
      
      {creditCards.map((card) => {
        const daysUntilDue = getDaysUntilDue(card.billDate);
        const paymentStatus = getPaymentStatus(card.balance, daysUntilDue);
        const utilizationRate = card.limit ? (card.balance / card.limit) * 100 : 0;
        
        return (
          <View key={card.id} style={[styles.cardContainer, { alignItems: 'center' }]}>
            <CreditCardUI card={card} user={user} onPress={() => {}} />
            <View style={[styles.cardDetails, { width: width - 60 }]}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Calendar color="#c4ff00" size={16} />
                  <Text style={styles.detailLabel}>Due Date</Text>
                </View>
                <Text style={styles.detailValue}>
                  {card.billDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <TrendingDown color="#c4ff00" size={16} />
                  <Text style={styles.detailLabel}>Payment Status</Text>
                </View>
                <Text style={[styles.detailValue, { color: paymentStatus.color }]}> 
                  {paymentStatus.text}
                </Text>
              </View>
              {card.balance > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Minimum Payment</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(Math.max(25, card.balance * 0.02))}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
      
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#999999',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 20,
  },
  cardContainer: {
    marginBottom: 20,
  },
  creditCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardEmoji: {
    fontSize: 24,
  },
  cardName: {
    color: '#1a1a1a',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  cardBalance: {
    color: '#1a1a1a',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  utilizationContainer: {
    marginTop: 8,
  },
  utilizationBar: {
    height: 6,
    backgroundColor: 'rgba(26,26,26,0.3)',
    borderRadius: 3,
    marginBottom: 4,
  },
  utilizationFill: {
    height: '100%',
    borderRadius: 3,
  },
  utilizationText: {
    color: '#1a1a1a',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    opacity: 0.8,
  },
  cardDetails: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
  },
  detailValue: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  bottomSpacing: {
    height: 100,
  },
  goldenChip: {
    width: 40,
    height: 30,
    backgroundColor: '#FFD700',
    borderRadius: 6,
  },
});