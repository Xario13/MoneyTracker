import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Check, DollarSign, Plus, TrendingUp, ArrowLeftRight } from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';

interface AddMoneyModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (amount: number, source: 'income' | 'transfer', destinationId?: string, sourceId?: string) => void;
  title: string;
  currentAmount: number;
  type: 'fund' | 'saving';
  fundId?: string;
}

export default function AddMoneyModal({ 
  visible, 
  onClose, 
  onAdd, 
  title, 
  currentAmount,
  type,
  fundId
}: AddMoneyModalProps) {
  const { funds, financialData } = useData();
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState<'income' | 'transfer'>('income');
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');

  const handleAdd = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (source === 'transfer') {
      if (!selectedSourceId) {
        Alert.alert('Error', 'Please select a source for transfer');
        return;
      }

      // Check if transfer amount exceeds available balance
      const sourceBalance = getSourceBalance(selectedSourceId);
      if (numAmount > sourceBalance) {
        Alert.alert(
          'Insufficient Funds',
          `You only have ${formatCurrency(sourceBalance)} available in the selected source.`
        );
        return;
      }
    }

    onAdd(numAmount, source, fundId, selectedSourceId);
    setAmount('');
    setSelectedSourceId('');
    onClose();
  };

  const getSourceBalance = (sourceId: string) => {
    if (sourceId === 'savings') {
      return financialData?.savingBalance || 0;
    }
    const fund = funds.find(f => f.id === sourceId);
    return fund?.balance || 0;
  };

  const getAvailableSources = () => {
    const sources = [];
    
    if (type === 'fund') {
      // For fund transfers, show savings and other funds
      if (financialData && financialData.savingBalance > 0) {
        sources.push({
          id: 'savings',
          name: 'Savings',
          balance: financialData.savingBalance,
        });
      }
      
      funds.forEach(fund => {
        if (fund.id !== fundId && fund.balance > 0) {
          sources.push({
            id: fund.id,
            name: fund.name,
            balance: fund.balance,
          });
        }
      });
    } else {
      // For savings transfers, show all funds with positive balance (exclude savings itself)
      funds.forEach(fund => {
        if (fund.balance > 0) {
          sources.push({
            id: fund.id,
            name: fund.name,
            balance: fund.balance,
          });
        }
      });
    }
    
    return sources;
  };

  const formatAmount = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleanValue;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTransferLabel = () => {
    return type === 'fund' ? 'From Other Sources' : 'From Funds';
  };

  const handleSourceChange = (newSource: 'income' | 'transfer') => {
    setSource(newSource);
    if (newSource === 'income') {
      setSelectedSourceId('');
    }
    if (newSource === 'transfer') {
    }
  };

  const availableSources = getAvailableSources();

  const addButtonDisabled = !amount.trim() || (source === 'transfer' && !selectedSourceId);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Money to {title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color="#ffffff" size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalForm}>
            <View style={styles.currentBalanceSection}>
              <Text style={styles.currentBalanceLabel}>Current Balance</Text>
              <Text style={styles.currentBalanceAmount}>
                {formatCurrency(currentAmount)}
              </Text>
            </View>

            {/* Source Selection */}
            <View style={styles.sourceSection}>
              <Text style={styles.inputLabel}>How are you adding this money?</Text>
              <View style={styles.sourceToggle}>
                <TouchableOpacity
                  style={[styles.sourceButton, source === 'income' && styles.sourceButtonActive]}
                  onPress={() => handleSourceChange('income')}
                >
                  <TrendingUp color={source === 'income' ? "#1a1a1a" : "#c4ff00"} size={20} />
                  <Text style={[styles.sourceText, source === 'income' && styles.sourceTextActive]}>
                    New Income
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sourceButton, source === 'transfer' && styles.sourceButtonActive]}
                  onPress={() => handleSourceChange('transfer')}
                >
                  <ArrowLeftRight color={source === 'transfer' ? "#1a1a1a" : "#c4ff00"} size={20} />
                  <Text style={[styles.sourceText, source === 'transfer' && styles.sourceTextActive]}>
                    {getTransferLabel()}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Transfer Source Selection */}
            {source === 'transfer' && availableSources.length > 0 && (
              <View style={styles.transferSourceSection}>
                <Text style={styles.inputLabel}>Transfer From</Text>
                <View style={styles.sourceGrid}>
                  {availableSources.map((sourceOption) => (
                    <TouchableOpacity
                      key={sourceOption.id}
                      style={[
                        styles.transferSourceButton,
                        selectedSourceId === sourceOption.id && styles.transferSourceButtonSelected
                      ]}
                      onPress={() => setSelectedSourceId(sourceOption.id)}
                    >
                      <Text style={[
                        styles.transferSourceName,
                        selectedSourceId === sourceOption.id && styles.transferSourceNameSelected
                      ]}>
                        {sourceOption.name}
                      </Text>
                      <Text style={[
                        styles.transferSourceBalance,
                        selectedSourceId === sourceOption.id && styles.transferSourceBalanceSelected
                      ]}>
                        {formatCurrency(sourceOption.balance)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {source === 'transfer' && availableSources.length === 0 && (
              <View style={styles.noSourcesSection}>
                <Text style={styles.noSourcesText}>
                  No sources available for transfer. Add money to other accounts first.
                </Text>
              </View>
            )}

            <View style={styles.inputSection}>
              <View style={styles.labelContainer}>
                <Plus color="#c4ff00" size={20} />
                <Text style={styles.inputLabel}>Amount to Add</Text>
              </View>
              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={(text) => setAmount(formatAmount(text))}
                  placeholder="0.00"
                  placeholderTextColor="#666666"
                  keyboardType="decimal-pad"
                  maxLength={10}
                />
              </View>
            </View>

            <View style={styles.quickAmounts}>
              {[25, 50, 100, 200].map((quickAmount) => {
                const isDisabled = !!(source === 'transfer' && selectedSourceId && quickAmount > getSourceBalance(selectedSourceId));
                return (
                  <TouchableOpacity
                    key={quickAmount}
                    style={[
                      styles.quickAmountButton,
                      isDisabled && styles.quickAmountButtonDisabled
                    ]}
                    onPress={() => setAmount(quickAmount.toString())}
                    disabled={isDisabled}
                  >
                    <Text style={[
                      styles.quickAmountText,
                      isDisabled && styles.quickAmountTextDisabled
                    ]}>
                      ${quickAmount}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputHint}>
              {source === 'income' 
                ? `Adding new income to your ${type === 'fund' ? 'fund' : 'savings'}`
                : `Transferring money ${type === 'fund' ? 'to this fund' : 'to savings'}`
              }
            </Text>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.addButton,
                addButtonDisabled && styles.addButtonDisabled
              ]}
              onPress={handleAdd}
              disabled={addButtonDisabled}
            >
              <Check color="#1a1a1a" size={20} />
              <Text style={styles.addButtonText}>Add Money</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  closeButton: {
    padding: 8,
  },
  modalForm: {
    padding: 20,
  },
  currentBalanceSection: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  currentBalanceLabel: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  currentBalanceAmount: {
    color: '#ffffff',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  sourceSection: {
    marginBottom: 20,
  },
  sourceToggle: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 4,
  },
  sourceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  sourceButtonActive: {
    backgroundColor: '#c4ff00',
  },
  sourceText: {
    color: '#c4ff00',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  sourceTextActive: {
    color: '#1a1a1a',
  },
  transferSourceSection: {
    marginBottom: 20,
  },
  sourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  transferSourceButton: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 6,
    marginBottom: 12,
    minWidth: '45%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  transferSourceButtonSelected: {
    borderColor: '#c4ff00',
    backgroundColor: '#1a1a1a',
  },
  transferSourceName: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  transferSourceNameSelected: {
    color: '#c4ff00',
  },
  transferSourceBalance: {
    color: '#999999',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  transferSourceBalanceSelected: {
    color: '#c4ff00',
  },
  noSourcesSection: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  noSourcesText: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  currencySymbol: {
    color: '#c4ff00',
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickAmountButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickAmountButtonDisabled: {
    opacity: 0.5,
  },
  quickAmountText: {
    color: '#c4ff00',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  quickAmountTextDisabled: {
    color: '#666666',
  },
  inputHint: {
    color: '#666666',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#404040',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#c4ff00',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginLeft: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#404040',
    opacity: 0.5,
  },
  addButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
});