import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, ChevronRight, Plus, ChartBar as BarChart3, Target, Wallet, Banknote, DollarSign, ShoppingCart, Car, Gamepad2, Zap, Stethoscope, GraduationCap, Plane, ShoppingBag, Smartphone, FileText, Briefcase, Laptop, TrendingUp as Investment, Gift, Trophy, ArrowLeftRight, CreditCard as CreditCardIcon, CreditCard as Edit, Coins, Gem, PiggyBank, Edit as EditIcon } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import AuthScreen from '@/components/AuthScreen';
import OnboardingModal, { OnboardingData } from '@/components/OnboardingModal';
import EditTransactionModal from '@/components/EditTransactionModal';
import EditFinancialDataModal from '@/components/EditFinancialDataModal';
import AddFundModal from '@/components/AddFundModal';
import AddCreditCardModal from '@/components/AddCreditCardModal';
import FundDetailsModal from '@/components/FundDetailsModal';
import CreditCardDetailsModal from '@/components/CreditCardDetailsModal';
import AddMoneyModal from '@/components/AddMoneyModal';
import CustomAlert from '@/components/CustomAlert';
import TransactionDetailModal from '@/components/TransactionDetailModal';
import EditFundModal from '@/components/EditFundModal';
import { Transaction, Fund } from '@/types/user';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import CreditCardUI from '@/components/CreditCardUI';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 60;

const fundIcons = [
  { icon: Wallet, name: 'Wallet', emoji: '💰' },
  { icon: Banknote, name: 'Bank', emoji: '🏦' },
  { icon: Coins, name: 'Coins', emoji: '🪙' },
  { icon: Gem, name: 'Gem', emoji: '💎' },
];

// Category icon mapping with lime/black icons
const categoryIconMap: { [key: string]: any } = {
  'Food & Dining': ShoppingCart,
  'Transportation': Car,
  'Shopping': ShoppingBag,
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

const categoryEmojiMap: { [key: string]: string } = {
  'Food & Dining': '🍔',
  'Transportation': '🚗',
  'Shopping': '🛍️',
  'Entertainment': '🎮',
  'Utilities': '💡',
  'Health & Medical': '🩺',
  'Education': '🎓',
  'Travel': '✈️',
  'Groceries': '🛒',
  'Subscriptions': '📱',
  'Bills': '🧾',
  'Salary': '💼',
  'Freelance': '💻',
  'Investment': '📈',
  'Gift': '🎁',
  'Bonus': '🏆',
  'Other Income': '💵',
  'Transfer': '🔄',
};

// THEME CONSTANTS
const BASE_BG_GRADIENT: [string, string] = ['#121212', '#1A1A1A'];
const CARD_BG = '#1E1E1E';
const CREDIT_CARD_GRADIENT: [string, string] = ['#181818', '#2A2A2A'];
const NEON_GREEN = '#B0FF30';
const PRIMARY_TEXT = '#EAEAEA';
const SECONDARY_TEXT = '#A0A0A0';
const TERTIARY_TEXT = '#707070';
const BORDER_COLOR = 'rgba(255,255,255,0.10)';
const INCOME_COLOR = '#58D68D';
const EXPENSE_COLOR = '#E74C3C';
const CARD_RADIUS = 20;
const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 6,
};

// Update FUND_COLORS to use new card background and neon accent
const FUND_COLORS: { [key: string]: [string, string] } = {
  savings: [CARD_BG, NEON_GREEN],
  checking: [CARD_BG, NEON_GREEN],
  investment: [CARD_BG, NEON_GREEN],
  crypto: [CARD_BG, NEON_GREEN],
};

const TRANSACTION_COLORS = {
  income: {
    text: INCOME_COLOR,
    bg: 'rgba(88, 214, 141, 0.15)',
  },
  expense: {
    text: EXPENSE_COLOR,
    bg: 'rgba(231, 76, 60, 0.15)',
  },
};

// Define the same card gradients as in AddCreditCardModal
const CARD_TYPE_GRADIENTS: { [key: string]: [string, string] } = {
  platinum: ['#E5E4E2', '#BFC1C2'],
  gold: ['#F7E7B4', '#E6C976'],
  black: ['#181818', '#2A2A2A'],
};

// FundCard props type
interface FundCardProps {
  fund: any;
  onPress: () => void;
  onEdit: () => void;
  IconComponent: React.ComponentType<any>;
}

// Move formatCurrency above FundCard and CreditCardUI
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Fund Card with glassmorphism effect
const FundCard = ({ fund, onPress, onEdit, IconComponent }: FundCardProps) => {
  const scale = useState(new Animated.Value(1))[0];
  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  // Determine fund color based on name or type
  const getFundColors = (fundName: string) => {
    const name = fundName.toLowerCase();
    if (name.includes('saving')) return FUND_COLORS.savings;
    if (name.includes('check') || name.includes('main')) return FUND_COLORS.checking;
    if (name.includes('invest')) return FUND_COLORS.investment;
    if (name.includes('crypto') || name.includes('bitcoin')) return FUND_COLORS.crypto;
    return FUND_COLORS.checking; // default
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, styles.fundCardContainer]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <LinearGradient
          colors={getFundColors(fund.name)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.fundCardGradient, { borderColor: BORDER_COLOR, borderWidth: 1, borderRadius: CARD_RADIUS, ...CARD_SHADOW }]}
        >
          <View style={[styles.fundIconContainerEnhanced, { borderColor: BORDER_COLOR, backgroundColor: 'rgba(255,255,255,0.05)' }]}>
            <IconComponent color={NEON_GREEN} size={28} />
          </View>
          <Text style={[styles.cardNameEnhanced, { color: PRIMARY_TEXT, fontFamily: 'Inter-SemiBold' }]}>{fund.name}</Text>
          <Text style={[styles.cardAmountEnhanced, { color: PRIMARY_TEXT, fontFamily: 'Inter-Bold' }]}>{formatCurrency(fund.balance)}</Text>
          
          {fund.recentTransaction && (
            <View style={[
              styles.transactionIndicator,
              { backgroundColor: fund.recentTransaction.type === 'income' 
                ? TRANSACTION_COLORS.income.bg 
                : TRANSACTION_COLORS.expense.bg 
              }
            ]}>
              <Text style={[
                styles.transactionText,
                { color: fund.recentTransaction.type === 'income' 
                  ? TRANSACTION_COLORS.income.text 
                  : TRANSACTION_COLORS.expense.text 
                }
              ]}>
                {fund.recentTransaction.type === 'income' ? '+' : '-'}
                {formatCurrency(fund.recentTransaction.amount)}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

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

// Add a function to interpolate color based on spending ratio
function getSpendingColor(amount: number, limit: number) {
  if (!limit || amount <= 0) return '#FFF9C4'; // light yellow
  const ratio = Math.min(amount / limit, 1);
  if (ratio < 0.5) {
    // Light yellow to yellow
    return '#FFF9C4';
  } else if (ratio < 0.8) {
    // Yellow to orange
    return '#FFD600';
  } else {
    // Orange to red
    return '#E74C3C';
  }
}

export default function HomeScreen() {
  const { isAuthenticated, user } = useAuth();
  const { 
    financialData, 
    funds,
    creditCards,
    transactions, 
    updateFinancialData, 
    updateTransaction, 
    deleteTransaction,
    addTransaction,
    addSavingsGoal,
    getTotalBalance,
    getTotalMonthlyIncome,
    getTotalMonthlySpending,
    // @ts-ignore
    setFunds,
    // @ts-ignore
    saveFunds
  } = useData();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFinancialModalVisible, setEditFinancialModalVisible] = useState(false);
  const [addFundModalVisible, setAddFundModalVisible] = useState(false);
  const [editFundModalVisible, setEditFundModalVisible] = useState(false);
  const [addCreditCardModalVisible, setAddCreditCardModalVisible] = useState(false);
  const [fundDetailsModalVisible, setFundDetailsModalVisible] = useState(false);
  const [creditCardDetailsModalVisible, setCreditCardDetailsModalVisible] = useState(false);
  const [addMoneyModalVisible, setAddMoneyModalVisible] = useState(false);
  const [addMoneyFundId, setAddMoneyFundId] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedFund, setSelectedFund] = useState<{
    id: string;
    name: string;
    balance: number;
    type?: 'savings' | 'checking' | 'investment' | 'crypto';
    emoji?: string;
  } | null>(null);
  const [selectedCreditCard, setSelectedCreditCard] = useState<{
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
  } | null>(null);
  const [editType, setEditType] = useState<'income' | 'limit' | 'both'>('both');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>({});
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isCreditCardModalVisible, setCreditCardModalVisible] = useState(false);
  const [isAddExpenseModalVisible, setAddExpenseModalVisible] = useState(false);
  const [isTransactionDetailVisible, setTransactionDetailVisible] = useState(false);

  const showAlert = (title: string, message: string, type: any = 'info', buttons: any[] = [{ text: 'OK' }]) => {
    setAlertConfig({ title, message, type, buttons });
    setAlertVisible(true);
  };

  useEffect(() => {
    // if (isAuthenticated && !financialData) {
    //   setShowOnboarding(true);
    // }
  }, [isAuthenticated, financialData]);

  useEffect(() => {
    if (financialData?.hasRecurringIncome && financialData.monthlyIncome && financialData.incomeStartDate) {
      checkAndAddMonthlyIncome();
    }
  }, [financialData]);

  const checkAndAddMonthlyIncome = async () => {
    if (!financialData?.incomeStartDate || !financialData.monthlyIncome) return;

    const now = new Date();
    const incomeDate = new Date(financialData.incomeStartDate);
    
    const shouldAddIncome = now.getDate() === incomeDate.getDate() && 
                           now.getMonth() !== incomeDate.getMonth();

    const thisMonthIncomes = transactions.filter(t => 
      t.type === 'income' && 
      t.category === 'Salary' &&
      t.date.getMonth() === now.getMonth() &&
      t.date.getFullYear() === now.getFullYear()
    );

    if (shouldAddIncome && thisMonthIncomes.length === 0) {
      await addTransaction({
        title: 'Monthly Salary',
        category: 'Salary',
        amount: financialData.monthlyIncome,
        type: 'income',
        date: now,
      });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleOnboardingComplete = async (data: OnboardingData) => {
    try {
      await updateFinancialData({
        totalBalance: data.totalBalance,
        savingBalance: data.savingBalance,
        hasRecurringIncome: data.hasRecurringIncome,
        monthlyIncome: data.monthlyIncome,
        incomeStartDate: data.incomeStartDate,
        monthlySpendingLimit: data.monthlySpendingLimit,
        initialFunds: data.initialFunds,
      });
      
      // Add savings goal if one was created during onboarding
      if (data.savingsGoal && data.savingsGoal.title && data.savingsGoal.amount > 0) {
        await addSavingsGoal({
          title: data.savingsGoal.title,
          targetAmount: data.savingsGoal.amount,
          currentAmount: 0,
          deadline: data.savingsGoal.deadline,
          emoji: '🎯',
          color: '#ff6b6b',
        });
      }

      setShowOnboarding(false);
    } catch (error) {
      showAlert('Onboarding Error', 'There was a problem completing setup. Please check your input and try again.', 'error');
    }
  };

  const handleAddExpense = () => {
    router.push('/add-expense');
  };

  const handleViewAnalytics = () => {
    router.push('/analytics');
  };

  const handleProfilePress = () => {
    router.push('/profile');
  };

  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setTransactionDetailVisible(true);
  };

  const handleTransactionSave = async (updatedTransaction: any) => {
    try {
      await updateTransaction(updatedTransaction.id, updatedTransaction);
      showAlert('Success', 'Transaction updated successfully', 'success');
    } catch (error) {
      showAlert('Error', 'Failed to update transaction', 'error');
    }
  };

  const handleTransactionDelete = async (transactionId: any) => {
    try {
      await deleteTransaction(transactionId);
      showAlert('Success', 'Transaction deleted successfully', 'success');
    } catch (error) {
      showAlert('Error', 'Failed to delete transaction', 'error');
    }
  };

  const handleEditIncome = () => {
    setEditType('income');
    setEditFinancialModalVisible(true);
  };

  const handleEditLimit = () => {
    setEditType('limit');
    setEditFinancialModalVisible(true);
  };

  const handleFundPress = (fund: any) => {
    setAddMoneyFundId(fund.id);
    setAddMoneyModalVisible(true);
  };

  const handleEditFund = (fund: any) => {
    setSelectedFund(fund);
    setEditFundModalVisible(true);
  };

  const handleCreditCardPress = (card: any) => {
    setSelectedCreditCard(card);
    setCreditCardDetailsModalVisible(true);
  };

  const handleSavingsPress = () => {
    setAddMoneyFundId(null);
    setAddMoneyModalVisible(true);
  };

  const handleAddMoneyToSavings = async (amount: number, source: 'income' | 'transfer', destinationId?: string, sourceId?: string) => {
    try {
      if (source === 'income') {
        // Add as income transaction to savings
        await addTransaction({
          title: 'Income added to Savings',
          category: 'Other Income',
          amount: amount,
          type: 'income',
          date: new Date(),
        });
        showAlert('Success', `$${amount.toFixed(2)} added as income to savings`, 'success');
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
      showAlert('Error', 'Failed to add money to savings', 'error');
    }
  };

  // Fix getIconComponent to search by emoji property
  const getIconComponent = (emojiValue: string) => {
    const iconData = fundIcons.find(icon => icon.emoji === emojiValue);
    return iconData ? iconData.icon : Wallet;
  };

  const getCategoryIcon = (categoryName: string) => {
    return categoryIconMap[categoryName] || DollarSign;
  };

  const handleCreditCardScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const cardWidth = width - 60; // Full width minus padding
    const index = Math.round(contentOffset / cardWidth);
    setCurrentCardIndex(index);
  };

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // if (showOnboarding) {
  //   return (
  //     <OnboardingModal
  //       visible={showOnboarding}
  //       onComplete={handleOnboardingComplete}
  //     />
  //   );
  // }

  const recentTransactions = transactions.slice(0, 5);
  const totalBalance = getTotalBalance();
  const totalMonthlyIncome = getTotalMonthlyIncome();
  const totalMonthlySpending = getTotalMonthlySpending();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <TouchableOpacity onPress={handleProfilePress}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop' }}
                style={styles.avatar}
              />
            </TouchableOpacity>
            <View style={styles.welcomeText}>
              <Text style={styles.welcomeLabel}>Welcome back!</Text>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
            </View>
          </View>
        </View>

        {/* Monthly Overview */}
        <View style={styles.monthlyOverview}>
          <View style={styles.overviewCard}>
            <TouchableOpacity 
              style={styles.overviewItem}
              onPress={handleEditIncome}
            >
              <Text style={styles.overviewLabel}>Monthly Income</Text>
              <Text style={[styles.overviewAmount, styles.incomeColor]}>
                {formatCurrency(totalMonthlyIncome)}
              </Text>
            </TouchableOpacity>
            <View style={styles.overviewDivider} />
            <TouchableOpacity 
              style={styles.overviewItem}
              onPress={handleEditLimit}
            >
              <Text style={styles.overviewLabel}>Monthly Spending</Text>
              <Text style={[styles.overviewAmount, { color: getSpendingColor(totalMonthlySpending, financialData?.monthlySpendingLimit || 0) }]}>
                {formatCurrency(totalMonthlySpending)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Total Balance */}
        <View style={styles.totalBalanceSection}>
          <Text style={styles.totalBalanceLabel}>Total Balance</Text>
          <Text style={styles.totalBalanceAmount}>{formatCurrency(totalBalance)}</Text>
        </View>

        {/* Funds Section */}
        <View style={styles.fundsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Funds</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setAddFundModalVisible(true)}
            >
              <Plus color="#c4ff00" size={20} />
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardsScroll}>
            {funds.map((fund) => {
              const IconComponent = getIconComponent(fund.emoji);
              return (
                <FundCard
                  key={fund.id}
                  fund={fund}
                  onPress={() => {
                    setSelectedFund(fund);
                    setFundDetailsModalVisible(true);
                  }}
                  onEdit={() => handleEditFund(fund)}
                  IconComponent={IconComponent}
                />
              );
            })}
          </ScrollView>
        </View>

        {/* Savings Card */}
        <View style={styles.savingsSection}>
          <TouchableOpacity style={styles.savingCard} onPress={handleSavingsPress}>
            <View style={styles.cardHeader}>
              <View style={styles.fundIconContainerEnhanced}>
                <PiggyBank color="#c4ff00" size={32} />
              </View>
            </View>
            <Text style={styles.savingLabel}>Savings</Text>
            <Text style={styles.savingAmount}>
              {formatCurrency(financialData?.savingBalance || 0)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Credit Cards Section */}
        {creditCards.length > 0 && (
          <View style={styles.creditCardsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Credit Cards</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setAddCreditCardModalVisible(true)}
              >
                <Plus color="#c4ff00" size={20} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              ref={scrollViewRef}
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.creditCardsScroll}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingRight: 20 + (width - CARD_WIDTH) / 2
              }}
              onScroll={handleCreditCardScroll}
              scrollEventThrottle={16}
              pagingEnabled={false}
              snapToInterval={CARD_WIDTH + 20}
              decelerationRate="fast"
            >
              {creditCards
                .filter(card => card && typeof card === 'object' && 'id' in card && 'name' in card && 'balance' in card && 'billDate' in card)
                .map((card, idx, arr) => {
                  const cardTransactions = transactions.filter(t => t.creditCardId === card.id);
                  const recentTransaction = cardTransactions.length > 0 
                    ? cardTransactions.sort((a, b) => b.date.getTime() - a.date.getTime())[0]
                    : undefined;
                  return (
                    <View key={card.id} style={{ width: CARD_WIDTH, marginRight: idx !== arr.length - 1 ? 20 : 0 }}>
                      <CreditCardUI
                        card={card as any}
                        user={user}
                        onPress={() => handleCreditCardPress({
                          id: card.id,
                          name: card.name,
                          type: card.type || 'purple',
                          number: '••••',
                          last4: '••••',
                          color: card.color,
                          balance: card.balance,
                          limit: card.limit || 0,
                          billDate: card.billDate,
                          transactions: cardTransactions
                        })}
                      />
                    </View>
                  );
                })}
            </ScrollView>
            
            {/* Credit Card Indicators */}
            {creditCards.length > 1 && (
              <View style={styles.cardIndicators}>
                {creditCards
                  .filter(card => card && typeof card === 'object' && 'id' in card && 'name' in card && 'balance' in card && 'billDate' in card)
                  .map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.indicator,
                        currentCardIndex === index && styles.activeIndicator
                      ]}
                    />
                  ))}
              </View>
            )}

            {/* Add Credit Card Button */}
            {creditCards.filter(card => card && typeof card === 'object' && 'id' in card && 'name' in card && 'balance' in card && 'billDate' in card).length === 0 && (
              <View style={styles.addCreditCardSection}>
                <TouchableOpacity 
                  style={styles.addCreditCardButton}
                  onPress={() => setAddCreditCardModalVisible(true)}
                >
                  <CreditCardIcon color="#c4ff00" size={20} />
                  <Text style={styles.addCreditCardText}>Add Credit Card</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleAddExpense}>
            <View style={styles.actionIcon}>
              <Plus color="#c4ff00" size={20} />
            </View>
            <Text style={styles.actionText}>Add Expense</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleViewAnalytics}>
            <View style={styles.actionIcon}>
              <BarChart3 color="#c4ff00" size={20} />
            </View>
            <Text style={styles.actionText}>View Analytics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/goals')}>
            <View style={styles.actionIcon}>
              <Target color="#c4ff00" size={20} />
            </View>
            <Text style={styles.actionText}>My Goals</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <View style={styles.transactionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => router.push('/transactions')}>
                <ChevronRight color="#666666" size={20} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.transactionsList}>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((item) => {
                  const CategoryIcon = getCategoryIcon(item.category);
                  return (
                    <TouchableOpacity key={item.id} style={styles.transactionItem} onPress={() => handleTransactionPress(item)}>
                      <View style={styles.transactionIcon}>
                        <CategoryIcon color="#c4ff00" size={20} />
                      </View>
                      <View style={styles.transactionDetails}>
                        <Text style={styles.transactionTitle}>{item.title}</Text>
                        <Text style={styles.transactionCategory}>{item.category}</Text>
                      </View>
                      <View style={styles.transactionAmountContainer}>
                        <Text
                          style={[
                            styles.transactionAmount,
                            { color: item.type === 'income' ? '#4ade80' : '#f87171' },
                          ]}
                        >
                          {item.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(item.amount))}
                        </Text>
                        <Text style={styles.transactionDate}>{formatDate(new Date(item.date))}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.noTransactions}>No recent transactions.</Text>
              )}
            </View>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <EditTransactionModal
        visible={editModalVisible}
        transaction={selectedTransaction}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedTransaction(null);
        }}
        onSave={handleTransactionSave}
        onDelete={handleTransactionDelete}
      />

      <EditFinancialDataModal
        visible={editFinancialModalVisible}
        onClose={() => setEditFinancialModalVisible(false)}
        editType={editType}
      />

      <AddFundModal
        visible={addFundModalVisible}
        onClose={() => setAddFundModalVisible(false)}
      />

      <AddCreditCardModal
        visible={addCreditCardModalVisible}
        onClose={() => setAddCreditCardModalVisible(false)}
      />

      {selectedFund && (
        <FundDetailsModal
          visible={fundDetailsModalVisible}
          fund={selectedFund}
          onClose={() => {
            setFundDetailsModalVisible(false);
            setSelectedFund(null);
          }}
        />
      )}

      {selectedCreditCard && (
        <CreditCardDetailsModal
          visible={creditCardDetailsModalVisible}
          creditCard={selectedCreditCard}
          onClose={() => {
            setCreditCardDetailsModalVisible(false);
            setSelectedCreditCard(null);
          }}
        />
      )}

      <AddMoneyModal
        visible={!!addMoneyModalVisible}
        onClose={() => setAddMoneyModalVisible(false)}
        onAdd={(amount, source, destinationId, sourceId) => {
          if (addMoneyFundId) {
            // Adding to a fund
            handleAddMoneyToSavings(amount, source, addMoneyFundId, sourceId);
          } else {
            // Adding to savings
            handleAddMoneyToSavings(amount, source, 'savings', sourceId);
          }
        }}
        title={addMoneyFundId ? (funds.find(f => f.id === addMoneyFundId)?.name || 'Fund') : 'Savings'}
        currentAmount={addMoneyFundId ? (funds.find(f => f.id === addMoneyFundId)?.balance || 0) : (financialData?.savingBalance || 0)}
        type={addMoneyFundId ? 'fund' : 'saving'}
        fundId={addMoneyFundId || undefined}
      />

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
      />

      <TransactionDetailModal
        visible={isTransactionDetailVisible}
        onClose={() => setTransactionDetailVisible(false)}
        transaction={selectedTransaction}
        onEdit={handleTransactionSave}
        onDelete={handleTransactionDelete}
      />

      {/* Edit Fund Modal */}
      <EditFundModal
        visible={editFundModalVisible}
        fund={selectedFund}
        onClose={() => setEditFundModalVisible(false)}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeLabel: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  userName: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  monthlyOverview: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  overviewCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    position: 'relative',
  },
  overviewItem: {
    flex: 1,
  },
  overviewLabel: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  overviewAmount: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  overviewDivider: {
    width: 1,
    backgroundColor: '#404040',
    marginHorizontal: 20,
  },
  incomeColor: {
    color: '#4ade80',
  },
  expenseColor: {
    color: '#f87171',
  },
  totalBalanceSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  totalBalanceLabel: {
    color: '#999999',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  totalBalanceAmount: {
    color: '#ffffff',
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    textShadowColor: '#B0FF30',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  fundsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  savingsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  creditCardsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  addCreditCardSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  addButton: {
    backgroundColor: '#2a2a2a',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  creditCardsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  fundCardContainer: {
    marginRight: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  fundCardGradient: {
    width: 150,
    padding: 18,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  fundIconContainerEnhanced: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardNameEnhanced: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  cardAmountEnhanced: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  creditCardContainer: {
    marginRight: 20,
    borderRadius: 22,
    overflow: 'hidden',
  },
  creditCardGradient: {
    width: width - 60,
    padding: 28,
    minHeight: 210,
    position: 'relative',
    overflow: 'hidden',
  },
  creditCardHeaderEnhanced: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 36,
    zIndex: 1,
  },
  creditCardChipEnhanced: {
    width: 44,
    height: 32,
    backgroundColor: 'rgba(255, 215, 0, 0.8)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  creditCardNumberEnhanced: {
    marginBottom: 36,
    zIndex: 1,
  },
  creditCardNumberTextEnhanced: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    letterSpacing: 2.5,
  },
  creditCardFooterEnhanced: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  creditCardInfoEnhanced: {
    flex: 1,
  },
  creditCardLabelEnhanced: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  creditCardNameEnhanced: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  creditCardBalanceEnhanced: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
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
  savingCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardName: {
    color: '#1a1a1a',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardAmount: {
    color: '#1a1a1a',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  cardIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#404040',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#c4ff00',
  },
  addCreditCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#404040',
    borderStyle: 'dashed',
  },
  addCreditCardText: {
    color: '#c4ff00',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#2a2a2a',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  transactionsSection: {
    paddingHorizontal: 20,
  },
  transactionsList: {
    padding: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  transactionIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#2a2a2a',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  transactionCategory: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  transactionDate: {
    color: '#666666',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  noTransactions: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 100,
  },
  savingLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  savingAmount: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  transactionIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'center',
  },
  transactionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  cardTransactionIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 16,
    zIndex: 1,
  },
  cardTransactionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  editButtonInside: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});