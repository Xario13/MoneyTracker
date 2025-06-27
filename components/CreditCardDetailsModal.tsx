import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, CreditCard, Trash2, DollarSign, Wallet, TrendingUp, TrendingDown, Clock, AlertCircle, Pencil } from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import CustomAlert from './CustomAlert';
import { useAuth } from '@/contexts/AuthContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import CreditCardUI from './CreditCardUI';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: Date;
  merchant?: string;
  creditCardId?: string;
  title?: string;
}

// Define a local UI card type
interface UICreditCard {
  id: string;
  name: string;
  type?: string;
  number?: string;
  last4?: string;
  color?: string;
  balance: number;
  limit?: number;
  billDate: Date;
  transactions?: Transaction[];
  recentTransaction?: Transaction;
}

interface CreditCardDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  creditCard: UICreditCard;
}

interface PaymentSource {
  id: string;
  name: string;
  balance: number;
  type: 'fund' | 'savings';
}

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertConfig {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttons?: AlertButton[];
}

const { width } = Dimensions.get('window');

const CARD_COLORS = {
  platinum: ['rgba(255,255,255,0.1)', 'rgba(27,27,27,0.8)'] as const,
  gold: ['rgba(191,255,0,0.2)', 'rgba(27,27,27,0.8)'] as const,
  black: ['rgba(27,27,27,0.9)', 'rgba(37,37,37,0.8)'] as const,
  lime: ['rgba(191,255,0,0.3)', 'rgba(27,27,27,0.8)'] as const,
  default: ['rgba(27,27,27,0.9)', 'rgba(37,37,37,0.8)'] as const,
};

type CardColorType = keyof typeof CARD_COLORS;

function getCardColors(cardType: string): readonly [string, string] {
  if (['platinum', 'gold', 'black', 'lime'].includes(cardType)) {
    return CARD_COLORS[cardType as CardColorType];
  }
  return CARD_COLORS.default;
}

export default function CreditCardDetailsModal({
  visible,
  onClose,
  creditCard,
}: CreditCardDetailsModalProps) {
  const { updateCreditCard, deleteCreditCard, transactions, funds, financialData, payCreditCardBill, creditCards } = useData();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedCard, setEditedCard] = useState<UICreditCard>(creditCard);
  const [showPayBill, setShowPayBill] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [sourceType, setSourceType] = useState<'fund' | 'savings'>('fund');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({ title: '', message: '', type: 'info', buttons: [{ text: 'OK' }] });
  const [pendingOnClose, setPendingOnClose] = useState<null | (() => void)>(null);

  // Validate credit card data in useEffect
  useEffect(() => {
    if (visible) {
      // Validate credit card data
      if (!creditCard || typeof creditCard !== 'object' || !('id' in creditCard)) {
        onClose();
        return;
      }

      // Find the latest credit card data from context
      const foundCard = creditCards.find(card => card && card.id === creditCard.id);
      const latestCard = foundCard || creditCard;

      // Defensive: if latestCard is null/undefined or missing required properties, close modal
      if (!latestCard || typeof latestCard !== 'object' || !('id' in latestCard)) {
        onClose();
        return;
      }

      setEditedCard(latestCard as UICreditCard);
      setIsEditing(false);
      setShowPayBill(false);
      setPaymentAmount('');
      setSelectedSourceId('');
    }
  }, [visible, creditCard, creditCards, onClose]);

  // If credit card is invalid, don't render anything
  if (!creditCard || typeof creditCard !== 'object' || !('id' in creditCard)) {
    return null;
  }

  // Filter transactions for this credit card
  const cardTransactions = transactions?.filter(t => t.creditCardId === creditCard.id) || [];
  
  // Calculate utilization percentage
  const utilizationPercentage = creditCard.limit ? (creditCard.balance / creditCard.limit) * 100 : 0;
  
  // Calculate days until due
  const daysUntilDue = creditCard.billDate ? Math.ceil((creditCard.billDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  // Find the latest credit card data from context
  const foundCard = creditCards.find(card => card && card.id === creditCard.id);
  const latestCard = foundCard || creditCard;

  // If latestCard is invalid, don't render anything
  if (!latestCard || typeof latestCard !== 'object' || !('id' in latestCard)) {
    return null;
  }

  const handleSave = async () => {
    try {
      // Map UICreditCard to backend type (cast type field if needed)
      const backendCard = {
        ...editedCard,
        type: [
          'platinum', 'gold', 'black', 'blue', 'green', 'purple', 'red', 'orange'
        ].includes(editedCard.type || '') ? (editedCard.type as any) : undefined,
      };
      await updateCreditCard(creditCard.id, backendCard);
      setIsEditing(false);
      Alert.alert('Success', 'Credit card updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update credit card');
    }
  };

  const handleDelete = () => {
    setAlertConfig({
      title: 'Delete Credit Card',
      message: 'Are you sure you want to delete this credit card?',
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertVisible(false) },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setAlertVisible(false);
            try {
              await deleteCreditCard(creditCard.id);
              setAlertConfig({
                title: 'Success',
                message: 'Credit card deleted successfully',
                type: 'success',
                buttons: [{ text: 'OK', onPress: () => {
                  setAlertVisible(false);
                  onClose();
                }}],
              });
              setTimeout(() => setAlertVisible(true), 100); // ensure state update
            } catch (error) {
              setAlertConfig({
                title: 'Error',
                message: 'Failed to delete credit card',
                type: 'error',
                buttons: [{ text: 'OK', onPress: () => setAlertVisible(false) }],
              });
              setTimeout(() => setAlertVisible(true), 100);
            }
          }
        }
      ]
    });
    setAlertVisible(true);
  };

  const handlePayBill = async () => {
    if (!paymentAmount.trim() || !selectedSourceId) {
      Alert.alert('Error', 'Please enter amount and select payment source');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (amount > creditCard.balance) {
      Alert.alert('Error', 'Payment amount cannot exceed outstanding balance');
      return;
    }

    // Check source balance
    let sourceBalance = 0;
    if (sourceType === 'savings') {
      sourceBalance = financialData?.savingBalance || 0;
    } else {
      const fund = funds.find(f => f.id === selectedSourceId);
      sourceBalance = fund?.balance || 0;
    }

    if (amount > sourceBalance) {
      setAlertConfig({
        title: 'Error',
        message: 'Insufficient balance in selected source',
        type: 'error',
        buttons: [{ text: 'OK', onPress: () => {
          setAlertVisible(false);
          if (pendingOnClose) {
            pendingOnClose();
            setPendingOnClose(null);
          }
        }}],
      });
      setAlertVisible(true);
      return;
    }

    try {
      await payCreditCardBill(creditCard.id, amount, selectedSourceId, sourceType);
      setAlertConfig({
        title: 'Success',
        message: `Payment of ${formatCurrency(amount)} processed successfully`,
        type: 'success',
        buttons: [{ text: 'OK', onPress: () => {
          setAlertVisible(false);
          setShowPayBill(false);
          setPaymentAmount('');
          setSelectedSourceId('');
        }}],
      });
      setAlertVisible(true);
      // Do not close modal here; wait for alert OK
    } catch (error) {
      Alert.alert('Error', 'Failed to process payment');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatAmount = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleanValue;
  };

  const getAvailableSources = (): PaymentSource[] => {
    const sources: PaymentSource[] = [];
    
    if (financialData && financialData.savingBalance > 0) {
      sources.push({
        id: 'savings',
        name: 'Savings',
        balance: financialData.savingBalance,
        type: 'savings'
      });
    }
    
    funds.forEach(fund => {
      if (fund.balance > 0) {
        sources.push({
          id: fund.id,
          name: fund.name,
          balance: fund.balance,
          type: 'fund'
        });
      }
    });
    
    return sources;
  };

  const availableSources: PaymentSource[] = getAvailableSources();

  const colors = getCardColors(creditCard.type ?? 'default');

  const formatCardNumber = (number: string | undefined) => {
    if (!number) return '•••• •••• •••• ••••';
    return `•••• •••• •••• ${number.slice(-4)}`;
  };

  const getCardGradient = () => {
    return getCardColors(creditCard.type ?? 'default');
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color="#ffffff" size={24} />
            </TouchableOpacity>
            <Text style={styles.title}>Credit Card Details</Text>
            <View style={styles.headerActions}>
              {!isEditing ? (
                <>
                  <TouchableOpacity
                    onPress={() => setIsEditing(true)}
                    style={styles.headerActionButton}
                  >
                    <Pencil color="#ffffff" size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleDelete}
                    style={styles.headerActionButton}
                  >
                    <Trash2 color="#f87171" size={20} />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView style={styles.content}>
            {/* Credit Card Preview */}
            <View style={styles.creditCardContainer}>
              <CreditCardUI card={latestCard} user={user} onPress={() => {}} />
            </View>

            {/* Card Details */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Card Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Name</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedCard.name || ''}
                    onChangeText={(text) => setEditedCard({ ...editedCard, name: text })}
                    placeholder="Enter card name"
                    placeholderTextColor="#666666"
                    maxLength={30}
                  />
                ) : (
                  <Text style={styles.inputValue}>{latestCard.name}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Credit Limit</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedCard.limit?.toString() || ''}
                    onChangeText={(text) => setEditedCard({ ...editedCard, limit: parseFloat(text) || 0 })}
                    placeholder="0.00"
                    placeholderTextColor="#666666"
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.inputValue}>
                    {latestCard.limit ? formatCurrency(latestCard.limit) : 'Not set'}
                  </Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bill Due Date</Text>
                <Text style={styles.inputValue}>
                  {creditCard.billDate.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            </View>

            {/* Pay Bill Section */}
            {!showPayBill ? (
              <TouchableOpacity 
                style={styles.payBillButton}
                onPress={() => setShowPayBill(true)}
                disabled={creditCard.balance <= 0}
              >
                <DollarSign color="#ffffff" size={20} />
                <Text style={styles.payBillButtonText}>Pay Bill</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.payBillSection}>
                <Text style={styles.sectionTitle}>Pay Credit Card Bill</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Payment Amount</Text>
                  <View style={styles.amountContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={paymentAmount}
                      onChangeText={(text) => setPaymentAmount(formatAmount(text))}
                      placeholder="0.00"
                      placeholderTextColor="#666666"
                      keyboardType="decimal-pad"
                    />
                    <TouchableOpacity
                      style={styles.maxButton}
                      onPress={() => setPaymentAmount(creditCard.balance.toString())}
                    >
                      <Text style={styles.maxButtonText}>Max</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.inputHint}>
                    Outstanding balance: {formatCurrency(creditCard.balance)}
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Payment Source</Text>
                  <View style={styles.sourceGrid}>
                    {availableSources.map((source) => (
                      <TouchableOpacity
                        key={source.id}
                        style={[
                          styles.sourceOption,
                          selectedSourceId === source.id && styles.sourceOptionSelected
                        ]}
                        onPress={() => {
                          setSelectedSourceId(source.id);
                          setSourceType(source.type);
                        }}
                      >
                        <View style={styles.sourceHeader}>
                          {source.type === 'fund' ? (
                            <Wallet color="#c4ff00" size={16} />
                          ) : (
                            <DollarSign color="#c4ff00" size={16} />
                          )}
                          <Text style={[
                            styles.sourceName,
                            selectedSourceId === source.id && styles.sourceNameSelected
                          ]}>
                            {source.name}
                          </Text>
                        </View>
                        <Text style={[
                          styles.sourceBalance,
                          selectedSourceId === source.id && styles.sourceBalanceSelected
                        ]}>
                          {formatCurrency(source.balance)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.payBillActions}>
                  <TouchableOpacity
                    style={styles.cancelPayButton}
                    onPress={() => {
                      setShowPayBill(false);
                      setPaymentAmount('');
                      setSelectedSourceId('');
                    }}
                  >
                    <Text style={styles.cancelPayButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmPayButton,
                      (!paymentAmount.trim() || !selectedSourceId) && styles.confirmPayButtonDisabled
                    ]}
                    onPress={handlePayBill}
                    disabled={!paymentAmount.trim() || !selectedSourceId}
                  >
                    <Text style={styles.confirmPayButtonText}>Pay Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Credit Utilization */}
            <View style={styles.utilizationContainer}>
              <BlurView intensity={40} tint="dark" style={styles.utilizationBlur}>
                <View style={styles.utilizationContent}>
                  <View style={styles.utilizationHeader}>
                    <Text style={styles.utilizationTitle}>Credit Utilization</Text>
                    <Text style={[
                      styles.utilizationPercentage,
                      { color: utilizationPercentage > 75 ? '#FF5252' : '#4CAF50' }
                    ]}>
                      {utilizationPercentage.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.utilizationBar}>
                    <View 
                      style={[
                        styles.utilizationFill,
                        { 
                          width: `${utilizationPercentage}%`,
                          backgroundColor: utilizationPercentage > 75 ? '#FF5252' : '#4CAF50'
                        }
                      ]} 
                    />
                  </View>
                </View>
              </BlurView>
            </View>

            {/* Due Date Alert */}
            {daysUntilDue <= 7 && (
              <View style={styles.dueAlert}>
                <BlurView intensity={40} tint="dark" style={styles.dueAlertBlur}>
                  <View style={styles.dueAlertContent}>
                    <AlertCircle color="#FF5252" size={20} />
                    <Text style={styles.dueAlertText}>
                      Payment due in {daysUntilDue} days ({creditCard.billDate.toLocaleDateString('en-US', { 
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })})
                    </Text>
                  </View>
                </BlurView>
              </View>
            )}

            {/* Recent Transactions */}
            {cardTransactions.length > 0 && (
              <View style={styles.transactionsSection}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                {cardTransactions.slice(0, 5).map((transaction) => (
                  <View key={transaction.id} style={styles.transactionItem}>
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionTitle}>{transaction.title}</Text>
                      <Text style={styles.transactionDate}>
                        {transaction.date.toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={[styles.transactionAmount, styles.expenseColor]}>
                      {formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type as any}
        buttons={alertConfig.buttons}
        onClose={() => {
          setAlertVisible(false);
          if (pendingOnClose) {
            pendingOnClose();
            setPendingOnClose(null);
          }
        }}
      />
    </>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButton: {
    backgroundColor: '#60aaff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  creditCardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  creditCardBlur: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    backgroundColor: 'rgba(27,27,27,0.6)',
  },
  creditCardGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  creditCardHeaderEnhanced: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardNameEnhanced: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  creditCardChipEnhanced: {
    width: 40,
    height: 30,
    backgroundColor: '#FFD700',
    borderRadius: 6,
  },
  creditCardNumberEnhanced: {
    marginBottom: 24,
  },
  creditCardNumberTextEnhanced: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    letterSpacing: 2,
  },
  creditCardFooterEnhanced: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  creditCardInfoEnhanced: {
    flex: 1,
  },
  creditCardLabelEnhanced: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  creditCardNameEnhanced: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  creditCardBalanceEnhanced: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  glassReflection: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  detailsSection: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  inputValue: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    paddingVertical: 12,
  },
  payBillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#BFFF00',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  payBillButtonText: {
    color: '#1B1B1B',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  payBillSection: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  currencySymbol: {
    color: '#BFFF00',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  inputHint: {
    color: '#666666',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  sourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  sourceOption: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 6,
    marginBottom: 8,
    minWidth: '45%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sourceOptionSelected: {
    borderColor: '#BFFF00',
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sourceName: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 6,
  },
  sourceNameSelected: {
    color: '#BFFF00',
  },
  sourceBalance: {
    color: '#999999',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  sourceBalanceSelected: {
    color: '#BFFF00',
  },
  payBillActions: {
    flexDirection: 'row',
    marginTop: 16,
  },
  cancelPayButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelPayButtonText: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  confirmPayButton: {
    flex: 1,
    backgroundColor: '#BFFF00',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  confirmPayButtonDisabled: {
    backgroundColor: '#404040',
    opacity: 0.5,
  },
  confirmPayButtonText: {
    color: '#1B1B1B',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  transactionsSection: {
    marginBottom: 24,
  },
  transactionItem: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  transactionDate: {
    color: '#999999',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  expenseColor: {
    color: '#f87171',
  },
  maxButton: {
    marginLeft: 8,
    backgroundColor: '#BFFF00',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maxButtonText: {
    color: '#1B1B1B',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  utilizationContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  utilizationBlur: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
  },
  utilizationContent: {
    padding: 16,
  },
  utilizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  utilizationTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  utilizationPercentage: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  utilizationBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  utilizationFill: {
    height: '100%',
    borderRadius: 3,
  },
  dueAlert: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  dueAlertBlur: {
    borderWidth: 1,
    borderColor: 'rgba(255,82,82,0.3)',
    borderRadius: 16,
  },
  dueAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  dueAlertText: {
    color: '#FF5252',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 12,
  },
  transactionsContainer: {
    flex: 1,
  },
  transactionsList: {
    flex: 1,
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
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  transactionDescription: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  merchantName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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