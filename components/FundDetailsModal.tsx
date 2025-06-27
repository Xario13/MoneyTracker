import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, CreditCard as Edit3, Trash2, Plus, Wallet, Banknote, Coins, Gem, TrendingUp, TrendingDown, Clock, ArrowLeftRight, Pencil } from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import AddMoneyModal from '@/components/AddMoneyModal';
import CustomAlert from '@/components/CustomAlert';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import EditFundModal from '@/components/EditFundModal';

const { width } = Dimensions.get('window');

const FUND_COLORS: Record<string, [string, string]> = {
  savings: ['rgba(96, 170, 255, 0.3)', 'rgba(26, 26, 26, 0.9)'], // Blue
  checking: ['rgba(168, 85, 247, 0.3)', 'rgba(26, 26, 26, 0.9)'], // Purple
  investment: ['rgba(251, 191, 36, 0.3)', 'rgba(26, 26, 26, 0.9)'], // Orange
  crypto: ['rgba(20, 184, 166, 0.3)', 'rgba(26, 26, 26, 0.9)'], // Teal
};

interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  title: string;
  date: Date;
  category?: string;
  fundId?: string;
}

interface FundDetailsModalProps {
  visible: boolean;
  fund: {
    id: string;
    name: string;
    balance: number;
    type?: 'savings' | 'checking' | 'investment' | 'crypto';
    emoji?: string;
  };
  onClose: () => void;
}

const fundIcons = [
  { icon: Wallet, name: 'Wallet', emoji: '💰' },
  { icon: Banknote, name: 'Bank', emoji: '🏦' },
  { icon: Coins, name: 'Coins', emoji: '🪙' },
  { icon: Gem, name: 'Gem', emoji: '💎' },
];

export default function FundDetailsModal({
  visible,
  fund,
  onClose,
}: FundDetailsModalProps) {
  const { updateFund, deleteFund, transactions: allTransactions, funds, financialData, addTransaction, updateFinancialData, /* @ts-ignore */ setFunds, /* @ts-ignore */ saveFunds } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [editedFund, setEditedFund] = useState(fund);
  const [addMoneyModalVisible, setAddMoneyModalVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>({});
  const [editFundModalVisible, setEditFundModalVisible] = useState(false);

  // Filter transactions for this fund
  const fundTransactions = allTransactions.filter(t => t.fundId === fund.id);

  useEffect(() => {
    if (visible) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [visible]);

  React.useEffect(() => {
    if (fund) {
      setEditedFund(fund);
    }
  }, [fund]);

  useEffect(() => {
    if (!visible || !fund) {
      setAlertVisible(false);
      setAlertConfig({});
    }
  }, [visible, fund]);

  if (!fund) return null;

  // Add null check for editedFund
  if (!editedFund) {
    return null;
  }

  const showAlert = (title: string, message: string, type: any = 'info', buttons: any[] = [{ text: 'OK' }]) => {
    setAlertConfig({ title, message, type, buttons });
    setAlertVisible(true);
  };

  const handleSave = async () => {
    try {
      await updateFund(fund.id, editedFund);
      setIsEditing(false);
      showAlert('Success', 'Fund updated successfully', 'success');
    } catch (error) {
      showAlert('Error', 'Failed to update fund', 'error');
    }
  };

  const handleDelete = () => {
    showAlert(
      'Delete Fund',
      'Are you sure you want to delete this fund? The balance will be transferred to your savings.',
      'warning',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertVisible(false) },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFund(fund.id);
              onClose();
              showAlert('Success', 'Fund deleted successfully', 'success');
            } catch (error) {
              showAlert('Error', 'Failed to delete fund', 'error');
            }
          },
        },
      ]
    );
  };

  const handleAddMoney = async (amount: number, source: 'income' | 'transfer', destinationId?: string, sourceId?: string) => {
    try {
      if (source === 'income') {
        // Add as income transaction to this fund
        await addTransaction({
          title: `Income added to ${fund.name}`,
          category: 'Other Income',
          amount: amount,
          type: 'income',
          date: new Date(),
          fundId: fund.id,
        });
        showAlert('Success', `$${amount.toFixed(2)} added as income to ${fund.name}`, 'success');
      } else {
        // Transfer logic
        if (sourceId && financialData) {
          let updatedFunds = [...funds];
          let newSavingBalance = financialData.savingBalance;

          if (sourceId === 'savings' && destinationId) {
            // Savings to Fund
            const destFundIdx = updatedFunds.findIndex(f => f.id === destinationId);
            if (destFundIdx !== -1 && newSavingBalance >= amount) {
              updatedFunds[destFundIdx] = {
                ...updatedFunds[destFundIdx],
                balance: updatedFunds[destFundIdx].balance + amount,
              };
              newSavingBalance -= amount;
            } else {
              showAlert('Error', 'Insufficient savings for transfer', 'error');
              return;
            }
          } else if (destinationId && sourceId !== 'savings') {
            // Fund to Fund or Fund to Savings
            const sourceFundIdx = updatedFunds.findIndex(f => f.id === sourceId);
            if (sourceFundIdx === -1 || updatedFunds[sourceFundIdx].balance < amount) {
              showAlert('Error', 'Insufficient funds for transfer', 'error');
              return;
            }
            updatedFunds[sourceFundIdx] = {
              ...updatedFunds[sourceFundIdx],
              balance: updatedFunds[sourceFundIdx].balance - amount,
            };
            if (destinationId === 'savings') {
              // Fund to Savings
              newSavingBalance += amount;
            } else {
              // Fund to Fund
              const destFundIdx = updatedFunds.findIndex(f => f.id === destinationId);
              if (destFundIdx !== -1) {
                updatedFunds[destFundIdx] = {
                  ...updatedFunds[destFundIdx],
                  balance: updatedFunds[destFundIdx].balance + amount,
                };
              } else {
                showAlert('Error', 'Destination fund not found', 'error');
                return;
              }
            }
          }

          setFunds(updatedFunds);
          await saveFunds(updatedFunds);
          await updateFinancialData({
            savingBalance: newSavingBalance,
          });

          showAlert('Success', `$${amount.toFixed(2)} transferred successfully`, 'success');
        }
      }
    } catch (error) {
      showAlert('Error', 'Failed to add money to fund', 'error');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Add formatDate function
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Update getFundColors function
  const getFundColors = (fundType?: string) => {
    if (!fundType) return FUND_COLORS.checking;
    const type = fundType.toLowerCase();
    if (type.includes('saving')) return FUND_COLORS.savings;
    if (type.includes('check') || type.includes('main')) return FUND_COLORS.checking;
    if (type.includes('invest')) return FUND_COLORS.investment;
    if (type.includes('crypto')) return FUND_COLORS.crypto;
    return FUND_COLORS.checking;
  };

  // Update getIconComponent function
  const getIconComponent = (emojiValue?: string) => {
    if (!emojiValue) return fundIcons[0].icon;
    const iconData = fundIcons.find(icon => icon.emoji === emojiValue);
    return iconData ? iconData.icon : fundIcons[0].icon;
  };

  const IconComponent = getIconComponent(editedFund.emoji);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <TrendingUp color="#4CAF50" size={20} />;
      case 'expense':
        return <TrendingDown color="#FF5252" size={20} />;
      default:
        return <ArrowLeftRight color="#c4ff00" size={20} />;
    }
  };

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible && !editFundModalVisible}
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <BlurView intensity={95} tint="dark" style={styles.modalContent}>
            <LinearGradient
              colors={getFundColors(fund.type)}
              style={styles.gradientBackground}
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X color="#ffffff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{fund.name}</Text>
                <TouchableOpacity onPress={() => setEditFundModalVisible(true)} style={styles.editIconButton}>
                  <Pencil color="#c4ff00" size={20} />
                </TouchableOpacity>
              </View>

              {/* Balance Card */}
              <View style={styles.balanceCard}>
                <BlurView intensity={70} tint="dark" style={[styles.balanceBlur, { borderRadius: 20 }]}>
                  <Text style={styles.balanceLabel}>Current Balance</Text>
                  <Text style={styles.balanceAmount}>{formatCurrency(fund.balance)}</Text>
                </BlurView>
              </View>

              {/* Transactions List */}
              <View style={styles.transactionsContainer}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <ScrollView style={styles.transactionsList}>
                  {fundTransactions.map((transaction) => (
                    <View key={transaction.id} style={styles.transactionItem}>
                      <BlurView intensity={60} tint="dark" style={[styles.transactionBlur, { borderRadius: 16 }]}>
                        <View style={styles.transactionContent}>
                          <View style={styles.transactionIcon}>
                            {getTransactionIcon(transaction.type)}
                          </View>
                          <View style={styles.transactionDetails}>
                            <Text style={styles.transactionTitle}>{transaction.title}</Text>
                            <Text style={styles.transactionCategory}>{transaction.category || 'Uncategorized'}</Text>
                          </View>
                          <View style={styles.transactionAmountContainer}>
                            <Text style={[
                              styles.transactionAmount,
                              { color: transaction.type === 'income' ? '#4CAF50' : '#FF5252' }
                            ]}>
                              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                            </Text>
                            <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
                          </View>
                        </View>
                      </BlurView>
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => setAddMoneyModalVisible(true)}
                >
                  <BlurView intensity={60} tint="dark" style={[styles.actionButtonContent, { borderRadius: 16 }]}>
                    <TrendingUp color="#c4ff00" size={24} />
                    <Text style={styles.actionButtonText}>Add Money</Text>
                  </BlurView>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => setAddMoneyModalVisible(true)}
                >
                  <BlurView intensity={60} tint="dark" style={[styles.actionButtonContent, { borderRadius: 16 }]}>
                    <ArrowLeftRight color="#c4ff00" size={24} />
                    <Text style={styles.actionButtonText}>Transfer</Text>
                  </BlurView>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </BlurView>
        </View>
        {/* Add Money Modal */}
        <AddMoneyModal
          visible={addMoneyModalVisible}
          onClose={() => setAddMoneyModalVisible(false)}
          onAdd={handleAddMoney}
          title={fund.name}
          currentAmount={fund.balance}
          type="fund"
        />
        {/* Custom Alert */}
        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          buttons={alertConfig.buttons}
          onClose={() => setAlertVisible(false)}
        />
      </Modal>
      <EditFundModal
        visible={editFundModalVisible}
        fund={fund}
        onClose={() => setEditFundModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    marginTop: 60,
  },
  gradientBackground: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  editIconButton: {
    padding: 4,
    marginLeft: 8,
  },
  balanceCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  balanceBlur: {
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  balanceLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#ffffff',
    fontSize: 36,
    fontFamily: 'Inter-Bold',
  },
  transactionsContainer: {
    flex: 1,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  transactionsList: {
    flex: 1,
  },
  transactionItem: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  transactionBlur: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  transactionIcon: {
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  transactionCategory: {
    color: '#999999',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  transactionDate: {
    color: '#999999',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonContent: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginTop: 8,
  },
});