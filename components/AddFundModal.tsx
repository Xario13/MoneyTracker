import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { X, Check, Wallet, Banknote, Coins, Gem } from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import CustomAlert from '@/components/CustomAlert';

interface AddFundModalProps {
  visible: boolean;
  onClose: () => void;
}

const fundIcons = [
  { icon: Wallet, name: 'Wallet', emoji: '💰' },
  { icon: Banknote, name: 'Bank', emoji: '🏦' },
  { icon: Coins, name: 'Coins', emoji: '🪙' },
  { icon: Gem, name: 'Gem', emoji: '💎' },
];

export default function AddFundModal({ visible, onClose }: AddFundModalProps) {
  const { addFund } = useData();
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(0);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>({});

  const showAlert = (title: string, message: string, type: any = 'info', buttons: any[] = [{ text: 'OK' }]) => {
    setAlertConfig({ title, message, type, buttons });
    setAlertVisible(true);
  };

  const handleAdd = async () => {
    console.log('handleAdd called, name:', name, 'name.trim():', name.trim());
    if (!name.trim()) {
      showAlert('Error', 'Please enter a fund name', 'error');
      return;
    }

    const numBalance = parseFloat(balance) || 0;
    console.log('Adding fund with name:', name.trim(), 'balance:', numBalance);

    try {
      await addFund({
        name: name.trim(),
        balance: numBalance,
        emoji: fundIcons[selectedIcon].emoji, // Fix: use emoji instead of name
        color: '#4ecdc4', // Will be overridden by the context
      });

      showAlert('Success', 'Fund added successfully!', 'success', [
        { 
          text: 'OK', 
          onPress: () => {
            setName('');
            setBalance('');
            setSelectedIcon(0);
            onClose();
          }
        }
      ]);
    } catch (error) {
      console.error('Error adding fund:', error);
      showAlert('Error', 'Failed to add fund', 'error');
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
              <Text style={styles.modalTitle}>Add New Fund</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X color="#ffffff" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              {/* Icon Selection */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Choose an icon</Text>
                <View style={styles.iconGrid}>
                  {fundIcons.map((iconData, index) => {
                    const IconComponent = iconData.icon;
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.iconButton,
                          selectedIcon === index && styles.iconButtonSelected
                        ]}
                        onPress={() => setSelectedIcon(index)}
                      >
                        <IconComponent 
                          color={selectedIcon === index ? "#1a1a1a" : "#c4ff00"} 
                          size={24} 
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Fund Name */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Fund Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Main Wallet, Bank Account"
                  placeholderTextColor="#666666"
                  maxLength={30}
                />
              </View>

              {/* Initial Balance */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Initial Balance (Optional)</Text>
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
                  !name.trim() && styles.addButtonDisabled
                ]}
                onPress={handleAdd}
                disabled={!name.trim()}
              >
                <Check color="#1a1a1a" size={20} />
                <Text style={styles.addButtonText}>Add Fund</Text>
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
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  iconGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 60,
    height: 60,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconButtonSelected: {
    backgroundColor: '#c4ff00',
    borderColor: '#c4ff00',
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#ffffff',
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