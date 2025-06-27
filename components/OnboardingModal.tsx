import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { X, Check, DollarSign, Target, TrendingUp, Calendar, Wallet, Banknote, Coins, Gem } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface OnboardingModalProps {
  visible: boolean;
  onComplete: (data: OnboardingData) => void;
}

export interface OnboardingData {
  totalBalance: number;
  savingBalance: number;
  hasRecurringIncome: boolean;
  monthlyIncome?: number;
  incomeStartDate?: Date;
  monthlySpendingLimit: number;
  initialFunds: Array<{
    name: string;
    balance: number;
    emoji: string;
  }>;
  savingsGoal?: {
    title: string;
    amount: number;
    deadline: Date;
  };
}

const fundIcons = [
  { icon: Wallet, name: 'Wallet', emoji: '💰' },
  { icon: Banknote, name: 'Bank', emoji: '🏦' },
  { icon: Coins, name: 'Coins', emoji: '🪙' },
  { icon: Gem, name: 'Gem', emoji: '💎' },
];

export default function OnboardingModal({ visible, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<OnboardingData>>({
    hasRecurringIncome: false,
    initialFunds: [{ name: 'Main Wallet', balance: 0, emoji: '💰' }],
  });

  const [totalBalance, setTotalBalance] = useState('');
  const [savingBalance, setSavingBalance] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [incomeStartDate, setIncomeStartDate] = useState<Date>(new Date());
  const [showIncomeDatePicker, setShowIncomeDatePicker] = useState(false);
  const [monthlySpendingLimit, setMonthlySpendingLimit] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalDeadline, setGoalDeadline] = useState<Date>(new Date());
  const [showGoalDatePicker, setShowGoalDatePicker] = useState(false);
  const [funds, setFunds] = useState([{ name: 'Main Wallet', balance: '', emoji: '💰', iconIndex: 0 }]);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      const totalFundsBalance = funds.reduce((sum, fund) => sum + (parseFloat(fund.balance) || 0), 0);
      const savingsAmount = parseFloat(savingBalance) || 0;
      
      const onboardingData: OnboardingData = {
        totalBalance: totalFundsBalance + savingsAmount,
        savingBalance: savingsAmount,
        hasRecurringIncome: data.hasRecurringIncome || false,
        monthlyIncome: data.hasRecurringIncome ? parseFloat(monthlyIncome) : undefined,
        incomeStartDate: data.hasRecurringIncome ? incomeStartDate : undefined,
        monthlySpendingLimit: parseFloat(monthlySpendingLimit) || 0,
        initialFunds: funds.map(fund => ({
          name: fund.name,
          balance: parseFloat(fund.balance) || 0,
          emoji: fund.emoji,
        })),
        savingsGoal: goalTitle && goalAmount ? {
          title: goalTitle,
          amount: parseFloat(goalAmount),
          deadline: goalDeadline,
        } : undefined,
      };
      onComplete(onboardingData);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return funds.every(fund => fund.name.trim() && fund.balance.trim()) && savingBalance.trim();
      case 2:
        return !data.hasRecurringIncome || (monthlyIncome.trim() && incomeStartDate);
      case 3:
        return monthlySpendingLimit;
      case 4:
        return true; // Optional step
      default:
        return false;
    }
  };

  const addFund = () => {
    setFunds([...funds, { name: '', balance: '', emoji: '💰', iconIndex: 0 }]);
  };

  const removeFund = (index: number) => {
    if (funds.length > 1) {
      setFunds(funds.filter((_, i) => i !== index));
    }
  };

  const updateFund = (index: number, field: 'name' | 'balance' | 'iconIndex', value: string | number) => {
    const updatedFunds = [...funds];
    if (field === 'iconIndex') {
      updatedFunds[index].iconIndex = value as number;
      updatedFunds[index].emoji = fundIcons[value as number].emoji;
    } else {
      updatedFunds[index][field] = value as string;
    }
    setFunds(updatedFunds);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleMonthlyIncomeChange = (text: string) => {
    setMonthlyIncome(text);
    setData(prev => ({ ...prev, monthlyIncome: parseFloat(text) || 0 }));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Wallet color="#c4ff00" size={32} />
              <Text style={styles.stepTitle}>Set Up Your Funds</Text>
              <Text style={styles.stepDescription}>
                Create your funds and set your savings balance
              </Text>
            </View>

            <View style={styles.fundsSection}>
              <Text style={styles.sectionTitle}>Your Funds</Text>
              {funds.map((fund, index) => (
                <View key={index}>
                  <BlurView intensity={60} tint="dark" style={styles.fundItem}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.fundItemGradient}
                    >
                      <View style={styles.fundHeader}>
                        <Text style={styles.fundLabel}>Fund {index + 1}</Text>
                        {funds.length > 1 && (
                          <TouchableOpacity
                            style={styles.removeFundButton}
                            onPress={() => removeFund(index)}
                          >
                            <X color="#f87171" size={20} />
                          </TouchableOpacity>
                        )}
                      </View>
                      
                      <View style={styles.iconSelection}>
                        <Text style={styles.iconLabel}>Choose Icon</Text>
                        <View style={styles.iconGrid}>
                          {fundIcons.map((iconData, iconIndex) => {
                            const IconComponent = iconData.icon;
                            return (
                              <TouchableOpacity
                                key={iconIndex}
                                style={[
                                  styles.iconButton,
                                  fund.iconIndex === iconIndex && styles.iconButtonSelected
                                ]}
                                onPress={() => updateFund(index, 'iconIndex', iconIndex)}
                              >
                                <IconComponent 
                                  color={fund.iconIndex === iconIndex ? "#1a1a1a" : "#60aaff"} 
                                  size={20} 
                                />
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      <View style={styles.fundInputs}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Fund Name</Text>
                          <TextInput
                            style={styles.fundNameInput}
                            value={fund.name}
                            onChangeText={(text) => updateFund(index, 'name', text)}
                            placeholder="e.g., Main Wallet, Bank Account"
                            placeholderTextColor="#666666"
                          />
                        </View>
                        
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Initial Balance</Text>
                          <View style={styles.amountInput}>
                            <Text style={styles.currencySymbol}>$</Text>
                            <TextInput
                              style={styles.textInput}
                              value={fund.balance}
                              onChangeText={(text) => updateFund(index, 'balance', text)}
                              placeholder="0.00"
                              placeholderTextColor="#666666"
                              keyboardType="decimal-pad"
                            />
                          </View>
                        </View>
                      </View>
                      <View style={styles.glassReflection} />
                    </LinearGradient>
                  </BlurView>
                </View>
              ))}
              
              <TouchableOpacity style={styles.addFundButton} onPress={addFund}>
                <Text style={styles.addFundText}>+ Add Another Fund</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Savings Balance</Text>
              <View style={styles.amountInput}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.textInput}
                  value={savingBalance}
                  onChangeText={setSavingBalance}
                  placeholder="0.00"
                  placeholderTextColor="#666666"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <TrendingUp color="#c4ff00" size={32} />
              <Text style={styles.stepTitle}>Monthly Income</Text>
              <Text style={styles.stepDescription}>
                Do you have a recurring monthly income we should track?
              </Text>
            </View>

            <View style={styles.toggleSection}>
              <View style={styles.toggleItem}>
                <Text style={styles.toggleLabel}>I have recurring income</Text>
                <Switch
                  value={data.hasRecurringIncome}
                  onValueChange={(value) => setData({ ...data, hasRecurringIncome: value })}
                  trackColor={{ false: '#404040', true: '#60aaff' }}
                  thumbColor={data.hasRecurringIncome ? '#1a1a1a' : '#999999'}
                />
              </View>
            </View>

            {data.hasRecurringIncome && (
              <View style={styles.incomeSection}>
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Monthly Income Amount</Text>
                  <View style={styles.amountInput}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={styles.textInput}
                      value={monthlyIncome}
                      onChangeText={handleMonthlyIncomeChange}
                      placeholder="e.g., 3000"
                      placeholderTextColor="#666666"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Start Date</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowIncomeDatePicker(true)}
                  >
                    <Calendar color="#c4ff00" size={20} />
                    <Text style={styles.dateText}>{formatDate(incomeStartDate)}</Text>
                  </TouchableOpacity>
                  
                  {showIncomeDatePicker && (
                    <DateTimePicker
                      value={incomeStartDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, selectedDate) => {
                        setShowIncomeDatePicker(false);
                        if (selectedDate) {
                          setIncomeStartDate(selectedDate);
                        }
                      }}
                    />
                  )}
                </View>
              </View>
            )}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Target color="#c4ff00" size={32} />
              <Text style={styles.stepTitle}>Monthly Spending Limit</Text>
              <Text style={styles.stepDescription}>
                Set a monthly limit to help control your spending
              </Text>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Monthly Spending Limit</Text>
              <View style={styles.amountInput}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.textInput}
                  value={monthlySpendingLimit}
                  onChangeText={setMonthlySpendingLimit}
                  placeholder="0.00"
                  placeholderTextColor="#666666"
                  keyboardType="decimal-pad"
                />
              </View>
              <Text style={styles.inputHint}>
                We'll notify you when you're approaching this limit
              </Text>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Calendar color="#c4ff00" size={32} />
              <Text style={styles.stepTitle}>Savings Goal (Optional)</Text>
              <Text style={styles.stepDescription}>
                Do you have something specific you're saving for?
              </Text>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>What are you saving for?</Text>
              <TextInput
                style={styles.regularInput}
                value={goalTitle}
                onChangeText={setGoalTitle}
                placeholder="e.g., Vacation, Emergency Fund, New Car"
                placeholderTextColor="#666666"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Target Amount</Text>
              <View style={styles.amountInput}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.textInput}
                  value={goalAmount}
                  onChangeText={setGoalAmount}
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
                onPress={() => setShowGoalDatePicker(true)}
              >
                <Calendar color="#c4ff00" size={20} />
                <Text style={styles.dateText}>{formatDate(goalDeadline)}</Text>
              </TouchableOpacity>
              
              {showGoalDatePicker && (
                <DateTimePicker
                  value={goalDeadline}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowGoalDatePicker(false);
                    if (selectedDate) {
                      setGoalDeadline(selectedDate);
                    }
                  }}
                />
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      animationType="slide"
      presentationStyle="fullScreen"
      visible={visible}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>Step {step} of 4</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderStep()}
        </ScrollView>

        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <Text style={styles.nextButtonText}>
              {step === 4 ? 'Complete Setup' : 'Continue'}
            </Text>
            <Check color="#1a1a1a" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#404040',
    borderRadius: 2,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#60aaff',
    borderRadius: 2,
  },
  progressText: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    paddingVertical: 20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  stepTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  stepDescription: {
    color: '#999999',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  fundsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  fundItem: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(27,27,27,0.6)',
  },
  fundItemGradient: {
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  fundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  fundLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  removeFundButton: {
    padding: 8,
  },
  iconSelection: {
    marginBottom: 16,
  },
  iconLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  iconGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(27,27,27,0.8)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconButtonSelected: {
    backgroundColor: '#BFFF00',
    borderColor: '#BFFF00',
  },
  fundInputs: {
    gap: 16,
  },
  inputGroup: {
    flex: 1,
  },
  fundNameInput: {
    backgroundColor: 'rgba(26,26,26,0.8)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  addFundButton: {
    alignItems: 'center',
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#252525',
    borderStyle: 'dashed',
    borderRadius: 12,
    marginTop: 8,
    backgroundColor: 'rgba(27,27,27,0.6)',
  },
  addFundText: {
    color: '#BFFF00',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
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
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26,26,26,0.8)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  currencySymbol: {
    color: '#BFFF00',
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  regularInput: {
    backgroundColor: 'rgba(26,26,26,0.8)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26,26,26,0.8)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
  toggleSection: {
    marginBottom: 24,
  },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(26,26,26,0.8)',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  toggleLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  incomeSection: {
    marginTop: 20,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#404040',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#BFFF00',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#404040',
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#1B1B1B',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginRight: 8,
  },
  glassReflection: {
    position: 'absolute',
    top: -150,
    left: -100,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.05)',
    transform: [{ rotate: '45deg' }],
    zIndex: 0,
  },
});