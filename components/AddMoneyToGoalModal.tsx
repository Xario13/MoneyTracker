import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { X, Check, Plus } from 'lucide-react-native';
import { SavingsGoal } from '@/types/user';
import CustomAlert from '@/components/CustomAlert';

interface AddMoneyToGoalModalProps {
  visible: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  onAddMoney: (amount: number) => Promise<void>;
  availableAmount: number;
}

export default function AddMoneyToGoalModal({ 
  visible, 
  onClose, 
  goal, 
  onAddMoney,
  availableAmount 
}: AddMoneyToGoalModalProps) {
  const [amount, setAmount] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>({});
  const [pendingClose, setPendingClose] = useState(false);

  useEffect(() => {
    if (visible) {
      setAlertVisible(false);
      setAlertConfig({});
      setAmount('');
      setPendingClose(false);
    }
  }, [visible]);

  const showAlert = (title: string, message: string, type: any = 'info', buttons: any[] = [{ text: 'OK' }], closeAfter?: boolean) => {
    setAlertConfig({ title, message, type, buttons });
    setAlertVisible(true);
    if (closeAfter) {
      setPendingClose(true);
    }
  };

  const handleAddMoney = async () => {
    if (!amount.trim()) {
      showAlert('Error', 'Please enter an amount', 'error');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showAlert('Error', 'Please enter a valid amount', 'error');
      return;
    }

    if (numAmount > availableAmount) {
      showAlert('Error', `You only have $${availableAmount.toFixed(2)} available to allocate`, 'error');
      return;
    }

    try {
      await onAddMoney(numAmount);
      showAlert('Success', `$${numAmount.toFixed(2)} added to goal!`, 'success', [{ text: 'OK' }], true);
      setAmount('');
    } catch (error) {
      let errorMessage = 'Failed to add money to goal';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as any).message;
      }
      showAlert('Error', errorMessage, 'error');
    }
  };

  // When the alert is closed and pendingClose is true, close the modal
  useEffect(() => {
    if (!alertVisible && pendingClose) {
      setPendingClose(false);
      onClose();
    }
  }, [alertVisible, pendingClose, onClose]);

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

  if (!goal) return null;

  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const remainingAmount = goal.targetAmount - goal.currentAmount;

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Money to Goal</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X color="#ffffff" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              {/* Goal Info */}
              <View style={styles.goalInfoSection}>
                <View style={[styles.goalIcon, { backgroundColor: goal.color }]}>
                  <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                </View>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalProgress}>
                  {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: progress >= 100 ? '#4ade80' : goal.color
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(progress)}% complete
                </Text>
              </View>

              {/* Amount Input */}
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
                    autoFocus
                  />
                </View>
              </View>

              {/* Quick Amounts */}
              <View style={styles.quickAmounts}>
                {[25, 50, 100, 200].map((quickAmount) => {
                  const isDisabled = quickAmount > availableAmount;
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

              {/* Info Text */}
              <View style={styles.infoSection}>
                <Text style={styles.availableText}>
                  Available to allocate: {formatCurrency(availableAmount)}
                </Text>
                {remainingAmount > 0 && (
                  <Text style={styles.remainingText}>
                    Remaining to goal: {formatCurrency(remainingAmount)}
                  </Text>
                )}
              </View>
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
                  (!amount.trim() || parseFloat(amount) > availableAmount) && styles.addButtonDisabled
                ]}
                onPress={handleAddMoney}
                disabled={!amount.trim() || parseFloat(amount) > availableAmount}
              >
                <Check color="#1a1a1a" size={20} />
                <Text style={styles.addButtonText}>Add Money</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
      />
    </>
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
  goalInfoSection: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  goalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalEmoji: {
    fontSize: 24,
  },
  goalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  goalProgress: {
    color: '#c4ff00',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#404040',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
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
    marginBottom: 20,
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
  infoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  availableText: {
    color: '#c4ff00',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  remainingText: {
    color: '#999999',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
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