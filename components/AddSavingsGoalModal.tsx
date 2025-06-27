import React, { useState, useRef, useEffect } from 'react';
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
import { X, Check, Calendar, Wallet, Banknote, Coins, Gem, ShoppingCart, Car, Gamepad2, Zap, Stethoscope, GraduationCap, Plane, ShoppingBag, Smartphone, FileText, Briefcase, Laptop, TrendingUp, Gift, Trophy, DollarSign, ArrowLeftRight, Target, Home } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { useData } from '@/contexts/DataContext';
import CustomAlert from '@/components/CustomAlert';

interface AddSavingsGoalModalProps {
  visible: boolean;
  onClose: () => void;
  editingGoal?: any;
}

const goalEmojis = ['🎯', '🏠', '🚗', '✈️', '💍', '🎓', '💰', '🏖️', '🎮', '📱'];

const goalIcons = [
  { icon: Target, name: 'Target' },
  { icon: Home, name: 'Home' },
  { icon: Car, name: 'Car' },
  { icon: Plane, name: 'Plane' },
  { icon: Gem, name: 'Gem' },
  { icon: GraduationCap, name: 'GraduationCap' },
  { icon: Wallet, name: 'Wallet' },
  { icon: ShoppingBag, name: 'ShoppingBag' },
  { icon: Gamepad2, name: 'Gamepad2' },
  { icon: Smartphone, name: 'Smartphone' },
];

const goalColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#fab1a0', '#74b9ff', '#fd79a8', '#fdcb6e'];

export default function AddSavingsGoalModal({ visible, onClose, editingGoal }: AddSavingsGoalModalProps) {
  const { addSavingsGoal, updateSavingsGoal } = useData();
  const [goalTitle, setGoalTitle] = useState(editingGoal?.title || '');
  const [goalAmount, setGoalAmount] = useState(editingGoal?.targetAmount?.toString() || '');
  const [goalDeadline, setGoalDeadline] = useState(editingGoal ? new Date(editingGoal.deadline) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(editingGoal?.emoji || goalEmojis[0]);
  const [selectedIcon, setSelectedIcon] = useState(editingGoal?.icon || goalIcons[0].name);
  const [selectedColor, setSelectedColor] = useState(editingGoal?.color || goalColors[0]);
  const scrollViewRef = useRef<ScrollView>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>({});

  useEffect(() => {
    if (visible) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      setAlertVisible(false);
      setAlertConfig({});
    }
  }, [visible]);

  React.useEffect(() => {
    if (editingGoal) {
      setGoalTitle(editingGoal.title);
      setGoalAmount(editingGoal.targetAmount.toString());
      setGoalDeadline(new Date(editingGoal.deadline));
      setSelectedIcon(editingGoal.icon || goalIcons[0].name);
      setSelectedColor(editingGoal.color || goalColors[0]);
    } else {
      resetForm();
    }
  }, [editingGoal, visible]);

  const showAlert = (title: string, message: string, type: any = 'info', buttons: any[] = [{ text: 'OK' }]) => {
    setAlertConfig({ title, message, type, buttons });
    setAlertVisible(true);
  };

  const resetForm = () => {
    setGoalTitle('');
    setGoalAmount('');
    setGoalDeadline(new Date());
    setSelectedIcon(goalIcons[0].name);
    setSelectedColor(goalColors[0]);
  };

  const handleSave = async () => {
    if (!goalTitle.trim() || !goalAmount.trim()) {
      showAlert('Error', 'Please fill in all fields', 'error');
      return;
    }

    const amount = parseFloat(goalAmount);
    if (isNaN(amount) || amount <= 0) {
      showAlert('Error', 'Please enter a valid amount', 'error');
      return;
    }

    try {
      if (editingGoal) {
        await updateSavingsGoal(editingGoal.id, {
          title: goalTitle.trim(),
          targetAmount: amount,
          deadline: goalDeadline,
          icon: selectedIcon,
          emoji: '',
          color: selectedColor,
        });
        showAlert('Success', 'Goal updated successfully!', 'success');
      } else {
        await addSavingsGoal({
          title: goalTitle.trim(),
          targetAmount: amount,
          currentAmount: 0,
          deadline: goalDeadline,
          icon: selectedIcon,
          emoji: '',
          color: selectedColor,
        });
        showAlert('Success', 'Goal created successfully!', 'success');
      }

      resetForm();
      setTimeout(() => {
        setAlertVisible(false);
        setAlertConfig({});
        onClose();
      }, 1200);
    } catch (error) {
      showAlert('Error', 'Failed to save goal', 'error');
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
              <Text style={styles.modalTitle}>
                {editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X color="#ffffff" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView ref={scrollViewRef} style={styles.modalForm} showsVerticalScrollIndicator={false}>
              {/* Emoji Selection */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Choose Icon</Text>
                <View style={styles.categoriesGrid}>
                  {goalIcons.map((iconData) => {
                    const IconComponent = iconData.icon;
                    return (
                      <TouchableOpacity
                        key={iconData.name}
                        style={[
                          styles.categoryButton,
                          selectedIcon === iconData.name && styles.categoryButtonSelected,
                          { backgroundColor: '#2a2a2a' }
                        ]}
                        onPress={() => setSelectedIcon(iconData.name)}
                      >
                        <IconComponent color="#c4ff00" size={28} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Choose Color</Text>
                <View style={styles.colorGrid}>
                  {goalColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorButton,
                        { backgroundColor: color },
                        selectedColor === color && styles.colorButtonSelected
                      ]}
                      onPress={() => setSelectedColor(color)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Goal Title</Text>
                <TextInput
                  style={styles.input}
                  value={goalTitle}
                  onChangeText={setGoalTitle}
                  placeholder="e.g., Emergency Fund, Vacation, New Car"
                  placeholderTextColor="#666666"
                  maxLength={30}
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Target Amount</Text>
                <View style={styles.amountContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={goalAmount}
                    onChangeText={(text) => setGoalAmount(formatAmount(text))}
                    placeholder="0.00"
                    placeholderTextColor="#666666"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Target Date</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Calendar color="#c4ff00" size={20} />
                  <Text style={styles.dateText}>{formatDate(goalDeadline)}</Text>
                </TouchableOpacity>
                
                {showDatePicker && (
                  <DateTimePicker
                    value={goalDeadline}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setGoalDeadline(selectedDate);
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
                  styles.saveButton,
                  (!goalTitle.trim() || !goalAmount.trim()) && styles.saveButtonDisabled
                ]}
                onPress={handleSave}
                disabled={!goalTitle.trim() || !goalAmount.trim()}
              >
                <Check color="#1a1a1a" size={20} />
                <Text style={styles.saveButtonText}>
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </Text>
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
    maxHeight: '85%',
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
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  categoryButton: {
    width: 50,
    height: 50,
    backgroundColor: '#2a2a2a',
    marginHorizontal: 6,
    marginBottom: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryButtonSelected: {
    borderColor: '#c4ff00',
    backgroundColor: '#2a2a2a',
  },
  categoryEmoji: {
    fontSize: 24,
  },
  input: {
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 4,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonSelected: {
    borderColor: '#ffffff',
  },
});