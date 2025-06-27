import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { X, Check, Calendar, CreditCard } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { useData } from '@/contexts/DataContext';
import CustomAlert from './CustomAlert';
import { LinearGradient } from 'expo-linear-gradient';

interface AddCreditCardModalProps {
  visible: boolean;
  onClose: () => void;
}

const CARD_TYPES = [
  {
    id: 'platinum',
    name: 'Platinum',
    gradient: ['#E5E4E2', '#BFC1C2'] as [string, string],
  },
  {
    id: 'gold',
    name: 'Gold',
    gradient: ['#F7E7B4', '#E6C976'] as [string, string],
  },
  {
    id: 'black',
    name: 'Black',
    gradient: ['#181818', '#2A2A2A'] as [string, string],
  },
];

export default function AddCreditCardModal({ visible, onClose }: AddCreditCardModalProps) {
  const { addCreditCard } = useData();
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [limit, setLimit] = useState('');
  const [billDate, setBillDate] = useState(new Date());
  const [selectedCardType, setSelectedCardType] = useState('purple');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>({});

  useEffect(() => {
    if (visible) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [visible]);

  const showAlert = (title: string, message: string, type: any = 'info', buttons: any[] = [{ text: 'OK' }], onCloseAlert?: () => void) => {
    setAlertConfig({ title, message, type, buttons: buttons.map(btn => ({...btn, onPress: () => { btn.onPress?.(); setAlertVisible(false); onCloseAlert?.(); } })) });
    setAlertVisible(true);
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      showAlert('Error', 'Please enter a card name', 'error');
      return;
    }

    const numBalance = parseFloat(balance) || 0;
    const numLimit = parseFloat(limit) || undefined;

    try {
      const cardTypeObj = CARD_TYPES.find(t => t.id === selectedCardType);
      await addCreditCard({
        name: name.trim(),
        balance: numBalance,
        limit: numLimit,
        billDate: billDate,
        type: selectedCardType as any,
        color: cardTypeObj ? cardTypeObj.gradient[0] : '#181818',
      });

      setName('');
      setBalance('');
      setLimit('');
      setBillDate(new Date());
      setSelectedCardType('purple');
      showAlert('Success', 'Credit card added successfully!', 'success', [{ text: 'OK' }], onClose);
    } catch (error) {
      showAlert('Error', 'Failed to add credit card', 'error');
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
            <Text style={styles.modalTitle}>Add Credit Card</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color="#ffffff" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView ref={scrollViewRef} style={styles.modalForm} showsVerticalScrollIndicator={false}>
            {/* Card Name */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Card Name</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Chase Sapphire, Amex Gold"
                placeholderTextColor="#666666"
                maxLength={30}
              />
            </View>

            {/* Card Type Selection */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Card Type & Color</Text>
              <View style={styles.cardTypeGrid}>
                {CARD_TYPES.map((cardType) => (
                  <TouchableOpacity
                    key={cardType.id}
                    style={[
                      styles.cardTypeOption,
                      selectedCardType === cardType.id && styles.cardTypeOptionSelected
                    ]}
                    onPress={() => setSelectedCardType(cardType.id)}
                  >
                    <LinearGradient
                      colors={cardType.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cardTypePreview}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Current Balance */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Current Outstanding Balance</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={balance}
                  onChangeText={(text) => setBalance(formatAmount(text))}
                  placeholder="0.00"
                  placeholderTextColor="#666666"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Credit Limit */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Credit Limit (Optional)</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={limit}
                  onChangeText={(text) => setLimit(formatAmount(text))}
                  placeholder="0.00"
                  placeholderTextColor="#666666"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Bill Date */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Bill Payment Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar color="#c4ff00" size={20} />
                <Text style={styles.dateText}>{formatDate(billDate)}</Text>
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={billDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setBillDate(selectedDate);
                    }
                  }}
                />
              )}
            </View>
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
                styles.addButton,
                !name.trim() && styles.addButtonDisabled
              ]}
              onPress={handleAdd}
              disabled={!name.trim()}
            >
              <Check color="#1a1a1a" size={20} />
              <Text style={styles.addButtonText}>Add Card</Text>
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
    maxHeight: 400,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#b3b3b3',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
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
    color: '#BFFF00',
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
  },
  dateText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 12,
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
    backgroundColor: '#BFFF00',
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
    color: '#1B1B1B',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  cardTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardTypeOption: {
    width: '33.33%',
    padding: 8,
  },
  cardTypeOptionSelected: {
    backgroundColor: '#252525',
    borderColor: '#BFFF00',
    borderWidth: 2,
  },
  cardTypePreview: {
    width: '100%',
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardTypeName: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
  },
  cardTypeNameSelected: {
    fontFamily: 'Inter-SemiBold',
  },
});