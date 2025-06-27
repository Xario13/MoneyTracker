import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { X, Check, DollarSign, TrendingUp, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { useData } from '@/contexts/DataContext';
import CustomAlert from '@/components/CustomAlert';

interface EditFinancialDataModalProps {
  visible: boolean;
  onClose: () => void;
  editType?: 'income' | 'limit' | 'both';
}

export default function EditFinancialDataModal({ 
  visible, 
  onClose, 
  editType = 'both' 
}: EditFinancialDataModalProps) {
  const { financialData, updateFinancialData } = useData();
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlySpendingLimit, setMonthlySpendingLimit] = useState('');
  const [incomeStartDate, setIncomeStartDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasRecurringIncome, setHasRecurringIncome] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>({});

  useEffect(() => {
    if (financialData) {
      setMonthlyIncome(financialData.monthlyIncome?.toString() || '');
      setMonthlySpendingLimit(financialData.monthlySpendingLimit.toString());
      setIncomeStartDate(financialData.incomeStartDate || new Date());
      setHasRecurringIncome(financialData.hasRecurringIncome);
    }
  }, [financialData]);

  useEffect(() => {
    if (visible) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    } else {
      // Reset alert state when modal is closed
      setAlertVisible(false);
      setAlertConfig({});
    }
  }, [visible]);

  const handleSave = async () => {
    const incomeAmount = parseFloat(monthlyIncome) || 0;
    const limitAmount = parseFloat(monthlySpendingLimit) || 0;

    if (editType !== 'income' && limitAmount <= 0) {
      showAlert('Error', 'Please enter a valid spending limit');
      return;
    }

    if (editType !== 'limit' && hasRecurringIncome && incomeAmount <= 0) {
      showAlert('Error', 'Please enter a valid income amount');
      return;
    }

    try {
      const updates: any = {};
      
      if (editType !== 'limit') {
        updates.monthlyIncome = hasRecurringIncome && incomeAmount > 0 ? incomeAmount : undefined;
        updates.hasRecurringIncome = hasRecurringIncome && incomeAmount > 0;
        updates.incomeStartDate = hasRecurringIncome && incomeAmount > 0 ? incomeStartDate : undefined;
      }
      
      if (editType !== 'income') {
        updates.monthlySpendingLimit = limitAmount;
      }

      await updateFinancialData(updates);

      showAlert(
        'Success', 
        'Financial settings updated successfully', 
        'success',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      showAlert('Error', 'Failed to update financial settings', 'error');
    }
  };

  const formatAmount = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleanValue;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTitle = () => {
    switch (editType) {
      case 'income':
        return 'Edit Monthly Income';
      case 'limit':
        return 'Edit Spending Limit';
      default:
        return 'Edit Financial Settings';
    }
  };

  const showAlert = (title: string, message: string, type: any = 'info', buttons: any[] = [{ text: 'OK' }]) => {
    setAlertConfig({ title, message, type, buttons });
    setAlertVisible(true);
  };

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
            <Text style={styles.modalTitle}>{getTitle()}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color="#ffffff" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView ref={scrollViewRef} style={styles.modalForm} showsVerticalScrollIndicator={false}>
            {editType !== 'limit' && (
              <>
                <View style={styles.toggleSection}>
                  <TouchableOpacity
                    style={styles.toggleItem}
                    onPress={() => setHasRecurringIncome(!hasRecurringIncome)}
                  >
                    <Text style={styles.toggleLabel}>I have recurring monthly income</Text>
                    <View style={[
                      styles.toggleSwitch,
                      hasRecurringIncome && styles.toggleSwitchActive
                    ]}>
                      <View style={[
                        styles.toggleThumb,
                        hasRecurringIncome && styles.toggleThumbActive
                      ]} />
                    </View>
                  </TouchableOpacity>
                </View>

                {hasRecurringIncome && (
                  <>
                    <View style={styles.inputSection}>
                      <View style={styles.labelContainer}>
                        <TrendingUp color="#c4ff00" size={20} />
                        <Text style={styles.inputLabel}>Monthly Income</Text>
                      </View>
                      <View style={styles.amountContainer}>
                        <Text style={styles.currencySymbol}>$</Text>
                        <TextInput
                          style={styles.amountInput}
                          value={monthlyIncome}
                          onChangeText={(text) => setMonthlyIncome(formatAmount(text))}
                          placeholder="0.00"
                          placeholderTextColor="#666666"
                          keyboardType="decimal-pad"
                          maxLength={10}
                        />
                      </View>
                    </View>

                    <View style={styles.inputSection}>
                      <View style={styles.labelContainer}>
                        <Calendar color="#c4ff00" size={20} />
                        <Text style={styles.inputLabel}>Income Start Date</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.dateInput}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <Calendar color="#c4ff00" size={20} />
                        <Text style={styles.dateText}>{formatDate(incomeStartDate)}</Text>
                      </TouchableOpacity>
                      
                      {showDatePicker && (
                        <DateTimePicker
                          value={incomeStartDate}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) {
                              setIncomeStartDate(selectedDate);
                            }
                          }}
                        />
                      )}
                      <Text style={styles.inputHint}>
                        Income will be automatically added on this date each month
                      </Text>
                    </View>
                  </>
                )}
              </>
            )}

            {editType !== 'income' && (
              <View style={styles.inputSection}>
                <View style={styles.labelContainer}>
                  <DollarSign color="#c4ff00" size={20} />
                  <Text style={styles.inputLabel}>Monthly Spending Limit</Text>
                </View>
                <View style={styles.amountContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={monthlySpendingLimit}
                    onChangeText={(text) => setMonthlySpendingLimit(formatAmount(text))}
                    placeholder="0.00"
                    placeholderTextColor="#666666"
                    keyboardType="decimal-pad"
                    maxLength={10}
                  />
                </View>
                <Text style={styles.inputHint}>
                  We'll notify you when approaching this limit
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.saveButton,
                (editType !== 'limit' && hasRecurringIncome && !monthlyIncome.trim()) ||
                (editType !== 'income' && !monthlySpendingLimit.trim()) ? styles.saveButtonDisabled : null
              ]}
              onPress={handleSave}
              disabled={
                (editType !== 'limit' && hasRecurringIncome && !monthlyIncome.trim()) ||
                (editType !== 'income' && !monthlySpendingLimit.trim())
              }
            >
              <Check color="#1a1a1a" size={20} />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
      />
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
    maxHeight: '80%',
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
  toggleSection: {
    marginBottom: 24,
  },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
  },
  toggleLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    backgroundColor: '#404040',
    borderRadius: 15,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#c4ff00',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    backgroundColor: '#ffffff',
    borderRadius: 13,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
    backgroundColor: '#1a1a1a',
  },
  inputSection: {
    marginBottom: 24,
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
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  dateText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 12,
  },
  inputHint: {
    color: '#666666',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
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
  saveButton: {
    flex: 1,
    backgroundColor: '#c4ff00',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginLeft: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#404040',
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
});