import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, ColorValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check, Camera, Repeat, Calendar, Wallet, CreditCard, ShoppingCart, Car, Gamepad2, Zap, Stethoscope, GraduationCap, Plane, ShoppingBag, Smartphone, FileText, Briefcase, Laptop, TrendingUp as Investment, Gift, Trophy, DollarSign, ArrowLeftRight, Utensils, Plus, Minus, Tag, Banknote, Coins, Gem } from 'lucide-react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useData } from '@/contexts/DataContext';
import CustomAlert from '@/components/CustomAlert';
import { Transaction } from '@/types/user';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import CreditCardUI from '@/components/CreditCardUI';
import React from 'react';

// Category icon mapping with lime/black icons
const categoryIconMap: { [key: string]: any } = {
  'Food & Dining': Utensils,
  'Transportation': Car,
  'Shopping': ShoppingCart,
  'Entertainment': Gamepad2,
  'Utilities': Zap,
  'Health & Medical': Stethoscope,
  'Education': GraduationCap,
  'Travel': Plane,
  'Groceries': ShoppingBag,
  'Subscriptions': Smartphone,
  'Bills': FileText,
  'Salary': Briefcase,
  'Freelance': Laptop,
  'Investment': Investment,
  'Gift': Gift,
  'Bonus': Trophy,
  'Other Income': DollarSign,
  'Transfer': ArrowLeftRight,
};

const TRANSACTION_TYPES = {
  EXPENSE: {
    title: 'Expense',
    colors: ['rgba(255, 82, 82, 0.3)', 'rgba(26, 26, 26, 0.95)'] as const,
    icon: Minus,
    tint: '#FF5252',
  },
  INCOME: {
    title: 'Income',
    colors: ['rgba(76, 175, 80, 0.3)', 'rgba(26, 26, 26, 0.95)'] as const,
    icon: Plus,
    tint: '#4CAF50',
  },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

function MiniCreditCard({ card, selected, onPress }: { card: any; selected: boolean; onPress: () => void }) {
  const CARD_TYPE_GRADIENTS: Record<string, [ColorValue, ColorValue]> = {
    platinum: ['#E5E4E2', '#BFC1C2'] as const,
    gold: ['#F7E7B4', '#E6C976'] as const,
    black: ['#181818', '#2A2A2A'] as const,
  };
  const gradient = CARD_TYPE_GRADIENTS[card.type?.toLowerCase?.() || 'black'] || CARD_TYPE_GRADIENTS.black;
  // If the gradient is the black tuple, force text to white
  const isBlackGradient = gradient[0] === '#181818' && gradient[1] === '#2A2A2A';
  const textColor = isBlackGradient ? '#fff' : '#181818';
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: 120,
        height: 64,
        marginRight: 14,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? '#B0FF30' : 'rgba(255,255,255,0.12)',
        backgroundColor: 'transparent',
      }}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, padding: 10, justifyContent: 'center' }}
      >
        <Text style={{ color: textColor, fontSize: 13, fontFamily: 'Inter-SemiBold', marginBottom: 2 }} numberOfLines={1}>{card.name}</Text>
        <Text style={{ color: textColor, fontSize: 15, fontFamily: 'Inter-Bold' }} numberOfLines={1}>{formatCurrency(card.balance)}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function AddExpenseScreen() {
  const { categories, funds, creditCards, addTransaction } = useData();
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isIncome, setIsIncome] = useState(false);
  const [selectedFundId, setSelectedFundId] = useState<string>('');
  const [selectedCreditCardId, setSelectedCreditCardId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'fund' | 'credit' | 'savings'>('fund');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>({});
  
  // Recurring transaction states
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPeriod, setRecurringPeriod] = useState<'weekly' | 'monthly'>('monthly');
  const [recurringEndDate, setRecurringEndDate] = useState<Date>(new Date());
  const [showRecurringEndDatePicker, setShowRecurringEndDatePicker] = useState(false);
  
  // Photo attachment state
  const [attachedPhotos, setAttachedPhotos] = useState<string[]>([]);

  const filteredCategories = categories.filter(cat => 
    isIncome ? cat.type === 'income' : cat.type === 'expense'
  );
  const quickAmounts = [25, 50, 100, 200];

  const showAlert = (title: string, message: string, type: any = 'info', buttons: any[] = [{ text: 'OK' }]) => {
    setAlertConfig({ title, message, type, buttons });
    setAlertVisible(true);
  };

  const handleSave = async () => {
    if (!amount || !selectedCategory || !title.trim()) {
      showAlert('Error', 'Please fill in title, amount, and category.', 'error');
      return;
    }

    if (isIncome && !selectedFundId && paymentMethod !== 'savings') {
      showAlert('Error', 'Please select where to add the income', 'error');
      return;
    }

    if (!isIncome && paymentMethod === 'fund' && !selectedFundId) {
      showAlert('Error', 'Please select a fund for the expense', 'error');
      return;
    }

    if (!isIncome && paymentMethod === 'credit' && !selectedCreditCardId) {
      showAlert('Error', 'Please select a credit card for the expense', 'error');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showAlert('Error', 'Please enter a valid amount', 'error');
      return;
    }

    const category = filteredCategories.find(cat => cat.id === selectedCategory);
    if (!category) return;

    try {
      const baseTransaction = {
        title: title.trim(),
        notes: notes.trim(),
        category: category.name,
        amount: isIncome ? numAmount : -numAmount,
        type: isIncome ? 'income' as 'income' : 'expense' as 'expense',
        date: new Date(),
        photos: attachedPhotos.length > 0 ? attachedPhotos : undefined,
        fundId: (isIncome && paymentMethod !== 'savings') || (!isIncome && paymentMethod === 'fund') ? selectedFundId : undefined,
        creditCardId: !isIncome && paymentMethod === 'credit' ? selectedCreditCardId : undefined,
      };

      const result = await addTransaction(baseTransaction);

      if (!result.success) {
        if (result.needsConfirmation) {
          showAlert(
            'Insufficient Funds',
            `This transaction exceeds the available balance by $${(result.overage || 0).toFixed(2)}. Would you like to use money from another source?`,
            'warning',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Choose Source', 
                onPress: () => {
                  // Show available sources
                  if (result.availableSources && result.availableSources.length > 0) {
                    const sourceOptions = result.availableSources.map(source => ({
                      text: `${source.name} ($${source.balance.toFixed(2)})`,
                      onPress: async () => {
                        // Handle partial payment from original source and remainder from selected source
                        // This would need more complex logic in the DataContext
                        showAlert('Info', 'This feature will be implemented in the next update', 'info');
                      }
                    }));
                    
                    showAlert(
                      'Choose Source',
                      'Select a source to cover the remaining amount:',
                      'info',
                      [...sourceOptions, { text: 'Cancel', style: 'cancel' }]
                    );
                  }
                }
              }
            ]
          );
        } else {
          showAlert(
            'Insufficient Funds',
            'You don\'t have enough money to complete this transaction.',
            'error'
          );
        }
        return;
      }

      // Handle recurring transactions
      if (isRecurring) {
        await createRecurringTransactions(baseTransaction);
      }

      showAlert(
        'Success',
        `${isIncome ? 'Income' : 'Expense'} of $${numAmount.toFixed(2)} has been added!`,
        'success'
      );
      resetForm();
    } catch (error) {
      showAlert('Error', 'Failed to save transaction', 'error');
    }
  };

  const createRecurringTransactions = async (baseTransaction: any) => {
    const transactions: any[] = [];
    const startDate = new Date(baseTransaction.date);
    const endDate = new Date(recurringEndDate);
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      if (recurringPeriod === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      if (currentDate <= endDate) {
        transactions.push({
          title: baseTransaction.title,
          category: baseTransaction.category,
          amount: baseTransaction.amount,
          type: baseTransaction.type,
          date: new Date(currentDate),
          photos: baseTransaction.photos,
          fundId: baseTransaction.fundId,
          creditCardId: baseTransaction.creditCardId,
        });
      }
    }
    
    // Add all recurring transactions
    for (const transaction of transactions) {
      await addTransaction(transaction);
    }
    
    showAlert('Success', `Created ${transactions.length} recurring transactions`, 'success');
  };

  const resetForm = () => {
    setAmount('');
    setTitle('');
    setNotes('');
    setSelectedCategory(null);
    setIsIncome(false);
    setSelectedFundId('');
    setSelectedCreditCardId('');
    setPaymentMethod('fund');
    setIsRecurring(false);
    setRecurringPeriod('monthly');
    setRecurringEndDate(new Date());
    setAttachedPhotos([]);
  };

  const handleAttachPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAttachedPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
        return;
      }
  
      Alert.alert(
        'Photo Options',
        'Do you want to crop the photo?',
        [
          {
            text: 'Keep',
            onPress: () => launchCamera(false),
          },
          {
            text: 'Crop',
            onPress: () => launchCamera(true),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to request camera permissions');
    }
  };
  
  const launchCamera = async (allowsEditing: boolean) => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing,
        aspect: allowsEditing ? [4, 3] : undefined,
        quality: 0.8,
      });
  
      if (!result.canceled && result.assets[0]) {
        setAttachedPhotos((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
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

  const getCategoryIcon = (categoryName: string) => {
    return categoryIconMap[categoryName] || ShoppingCart;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <X color="#ffffff" size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Add {isIncome ? 'Income' : 'Expense'}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Type Toggle */}
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, !isIncome && styles.toggleButtonActive]}
            onPress={() => {
              setIsIncome(false);
              setSelectedCategory(null);
              setPaymentMethod('fund');
            }}
          >
            <Text style={[styles.toggleText, !isIncome && styles.toggleTextActive]}>
              Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, isIncome && styles.toggleButtonActive]}
            onPress={() => {
              setIsIncome(true);
              setSelectedCategory(null);
              setPaymentMethod('fund');
            }}
          >
            <Text style={[styles.toggleText, isIncome && styles.toggleTextActive]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* Payment Method Selection */}
        {!isIncome && (
          <View style={styles.paymentMethodSection}>
            <Text style={styles.inputLabel}>Payment Method</Text>
            <View style={styles.paymentMethodToggle}>
              <TouchableOpacity
                style={[styles.paymentMethodButton, paymentMethod === 'fund' && styles.paymentMethodButtonActive]}
                onPress={() => setPaymentMethod('fund')}
              >
                <Wallet color={paymentMethod === 'fund' ? "#1a1a1a" : "#c4ff00"} size={16} />
                <Text style={[styles.paymentMethodText, paymentMethod === 'fund' && styles.paymentMethodTextActive]}>
                  Fund
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentMethodButton, paymentMethod === 'credit' && styles.paymentMethodButtonActive]}
                onPress={() => setPaymentMethod('credit')}
              >
                <CreditCard color={paymentMethod === 'credit' ? "#1a1a1a" : "#c4ff00"} size={16} />
                <Text style={[styles.paymentMethodText, paymentMethod === 'credit' && styles.paymentMethodTextActive]}>
                  Credit
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Fund/Credit Card Selection */}
        {((isIncome && paymentMethod !== 'savings') || (!isIncome && paymentMethod === 'fund')) && (
          <View style={styles.fundSelectionSection}>
            <Text style={styles.inputLabel}>Select Fund</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fundsScroll}>
              {funds.map((fund) => {
                const fundType = fund.name.toLowerCase().includes('saving') ? 'savings'
                  : fund.name.toLowerCase().includes('check') || fund.name.toLowerCase().includes('main') ? 'checking'
                  : fund.name.toLowerCase().includes('invest') ? 'investment'
                  : fund.name.toLowerCase().includes('crypto') || fund.name.toLowerCase().includes('bitcoin') ? 'crypto'
                  : 'checking';
                const FUND_COLORS = {
                  savings: ['rgba(96, 170, 255, 0.3)', 'rgba(26, 26, 26, 0.9)'],
                  checking: ['rgba(99, 102, 241, 0.3)', 'rgba(26, 26, 26, 0.9)'],
                  investment: ['rgba(251, 191, 36, 0.3)', 'rgba(26, 26, 26, 0.9)'],
                  crypto: ['rgba(20, 184, 166, 0.3)', 'rgba(26, 26, 26, 0.9)'],
                };
                const fundIcons = [
                  { icon: Wallet, emoji: '💰' },
                  { icon: Banknote, emoji: '🏦' },
                  { icon: Coins, emoji: '🪙' },
                  { icon: Gem, emoji: '💎' },
                ];
                const IconComponent = fundIcons.find(i => i.emoji === fund.emoji)?.icon || Wallet;
                return (
                  <TouchableOpacity
                    key={fund.id}
                    style={[
                      styles.fundOption,
                      { padding: 0, backgroundColor: 'transparent', borderWidth: 0, width: 150, marginRight: 16 },
                      selectedFundId === fund.id && { borderColor: '#c4ff00', borderWidth: 2 }
                    ]}
                    onPress={() => setSelectedFundId(fund.id)}
                    activeOpacity={0.85}
                  >
                    <BlurView intensity={60} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
                      <LinearGradient
                        colors={FUND_COLORS[fundType]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ borderRadius: 20, padding: 18, alignItems: 'center', width: 150 }}
                      >
                        <View style={{ width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                          <IconComponent color="#fff" size={28} />
                        </View>
                        <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Inter-SemiBold', marginBottom: 6, textAlign: 'center', letterSpacing: 0.5 }}>{fund.name}</Text>
                        <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'Inter-Bold', textAlign: 'center', letterSpacing: 0.5 }}>{formatCurrency(fund.balance)}</Text>
                      </LinearGradient>
                    </BlurView>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {!isIncome && paymentMethod === 'credit' && (
          <View style={styles.fundSelectionSection}>
            <Text style={styles.inputLabel}>Select Credit Card</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fundsScroll}>
              {creditCards.map((card) => (
                <MiniCreditCard
                  key={card.id}
                  card={card}
                  selected={selectedCreditCardId === card.id}
                  onPress={() => setSelectedCreditCardId(card.id)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Income Destination Selection */}
        {isIncome && (
          <View style={styles.incomeDestinationSection}>
            <Text style={styles.inputLabel}>Add Income To</Text>
            <View style={styles.destinationToggle}>
              <TouchableOpacity
                style={[styles.destinationButton, paymentMethod === 'fund' && styles.destinationButtonActive]}
                onPress={() => setPaymentMethod('fund')}
              >
                <Wallet color={paymentMethod === 'fund' ? "#1a1a1a" : "#c4ff00"} size={16} />
                <Text style={[styles.destinationText, paymentMethod === 'fund' && styles.destinationTextActive]}>
                  Fund
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.destinationButton, paymentMethod === 'savings' && styles.destinationButtonActive]}
                onPress={() => setPaymentMethod('savings')}
              >
                <Text style={[styles.destinationText, paymentMethod === 'savings' && styles.destinationTextActive]}>
                  Savings
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Amount Input */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount</Text>
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
          {/* Quick Amount Buttons */}
          <View style={styles.quickAmounts}>
            {quickAmounts.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={styles.quickAmountButton}
                onPress={() => setAmount(quickAmount.toString())}
              >
                <Text style={styles.quickAmountText}>${quickAmount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Title Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Title</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Grocery Shopping, Salary"
            placeholderTextColor="#666666"
            maxLength={30}
          />
        </View>

        {/* Category Selection */}
        <View style={styles.categorySection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[styles.inputLabel, { marginBottom: 0 }]}>Category</Text>
            {selectedCategory && (
              <Text style={styles.selectedCategoryName}>
                ({filteredCategories.find(c => c.id === selectedCategory)?.name})
              </Text>
            )}
          </View>
          <View style={styles.categoriesGrid}>
            {filteredCategories.map((category) => {
              const CategoryIcon = getCategoryIcon(category.name);
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id && styles.categoryButtonSelected,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <CategoryIcon color="#c4ff00" size={20} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notes Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Notes (Optional)</Text>
          <TextInput
            style={[styles.textInput, { height: 100 }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any notes for this transaction..."
            placeholderTextColor="#666666"
            multiline
          />
        </View>

        {/* Photo Attachment */}
        <View style={styles.photoSection}>
          <Text style={styles.inputLabel}>Photos (Optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 8 }}>
            {attachedPhotos.map((uri, idx) => (
              <View key={uri} style={{ marginRight: 8, position: 'relative' }}>
                <Image source={{ uri }} style={{ width: 60, height: 60, borderRadius: 8 }} />
                <TouchableOpacity
                  style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 2, zIndex: 2 }}
                  onPress={() => setAttachedPhotos((prev) => prev.filter((_, i) => i !== idx))}
                >
                  <X color="#fff" size={16} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={{ width: 60, height: 60, borderRadius: 8, backgroundColor: '#252525', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
              onPress={handleAttachPhoto}
            >
              <Camera color="#B0FF30" size={28} />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Recurring Options */}
        <View style={styles.recurringSection}>
          <View style={styles.recurringToggle}>
            <View style={styles.recurringInfo}>
              <Repeat color="#c4ff00" size={20} />
              <Text style={[styles.inputLabel, { marginLeft: 12, marginBottom: 0 }]}>Make Recurring</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.toggleSwitch,
                isRecurring && styles.toggleSwitchActive
              ]}
              onPress={() => setIsRecurring(!isRecurring)}
            >
              <View style={[
                styles.toggleThumb,
                isRecurring && styles.toggleThumbActive
              ]} />
            </TouchableOpacity>
          </View>

          {isRecurring && (
            <View style={styles.recurringOptions}>
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Frequency</Text>
                <View style={styles.frequencyToggle}>
                  <TouchableOpacity
                    style={[styles.frequencyButton, recurringPeriod === 'weekly' && styles.frequencyButtonActive]}
                    onPress={() => setRecurringPeriod('weekly')}
                  >
                    <Text style={[styles.frequencyText, recurringPeriod === 'weekly' && styles.frequencyTextActive]}>
                      Weekly
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.frequencyButton, recurringPeriod === 'monthly' && styles.frequencyButtonActive]}
                    onPress={() => setRecurringPeriod('monthly')}
                  >
                    <Text style={[styles.frequencyText, recurringPeriod === 'monthly' && styles.frequencyTextActive]}>
                      Monthly
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>End Date</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowRecurringEndDatePicker(true)}
                >
                  <Calendar color="#c4ff00" size={20} />
                  <Text style={styles.dateText}>{formatDate(recurringEndDate)}</Text>
                </TouchableOpacity>
                
                {showRecurringEndDatePicker && (
                  <DateTimePicker
                    value={recurringEndDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowRecurringEndDatePicker(false);
                      if (selectedDate) {
                        setRecurringEndDate(selectedDate);
                      }
                    }}
                  />
                )}
              </View>
            </View>
          )}
        </View>

        {/* Save Button */}
        <View style={styles.saveSection}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!amount || !selectedCategory || !title.trim()) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!amount || !selectedCategory || !title.trim()}
          >
            <Check color="#1a1a1a" size={20} />
            <Text style={styles.saveButtonText}>
              Save {isIncome ? 'Income' : 'Expense'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
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
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  placeholder: {
    width: 40,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#c4ff00',
  },
  toggleText: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  toggleTextActive: {
    color: '#1a1a1a',
  },
  paymentMethodSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  paymentMethodToggle: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 4,
  },
  paymentMethodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  paymentMethodButtonActive: {
    backgroundColor: '#c4ff00',
  },
  paymentMethodText: {
    color: '#c4ff00',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 6,
  },
  paymentMethodTextActive: {
    color: '#1a1a1a',
  },
  incomeDestinationSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  destinationToggle: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 4,
  },
  destinationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  destinationButtonActive: {
    backgroundColor: '#c4ff00',
  },
  destinationText: {
    color: '#c4ff00',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 6,
  },
  destinationTextActive: {
    color: '#1a1a1a',
  },
  fundSelectionSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  fundsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  fundOption: {
    width: 120,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  fundOptionSelected: {
    borderColor: '#ffffff',
  },
  fundOptionName: {
    color: '#1a1a1a',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  fundOptionBalance: {
    color: '#1a1a1a',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    opacity: 0.8,
  },
  amountSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  amountLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  currencySymbol: {
    color: '#c4ff00',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAmountButton: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickAmountText: {
    color: '#c4ff00',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  inputLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  categorySection: {
    paddingHorizontal: 20,
    marginBottom: 30,
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
  selectedCategoryName: {
    color: '#888888',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 10,
  },
  photoSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  attachedPhotoContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  attachedPhoto: {
    width: 120,
    height: 90,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#f87171',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
  },
  photoButtonText: {
    color: '#c4ff00',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  recurringSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  recurringToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  recurringInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
  recurringOptions: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginTop: -12,
  },
  frequencyToggle: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 4,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  frequencyButtonActive: {
    backgroundColor: '#c4ff00',
  },
  frequencyText: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  frequencyTextActive: {
    color: '#1a1a1a',
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
  saveSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  saveButton: {
    backgroundColor: '#c4ff00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
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
  bottomSpacing: {
    height: 100,
  },
});