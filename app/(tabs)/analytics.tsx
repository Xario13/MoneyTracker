import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  TrendingUp, 
  Calendar, 
  Filter, 
  ChartBar as BarChart3, 
  DollarSign, 
  X, 
  ChevronRight, 
  ChevronDown, 
  Wallet, 
  CreditCard,
  ShoppingCart,
  Car,
  ShoppingBag,
  Gamepad2,
  Zap,
  Stethoscope,
  GraduationCap,
  Plane,
  Smartphone,
  FileText,
  Briefcase,
  Laptop,
  Gift,
  Trophy,
  ArrowLeftRight,
  Utensils
} from 'lucide-react-native';
import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import CustomAlert from '@/components/CustomAlert';

interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

interface MonthlyData {
  month: string;
  year: number;
  income: number;
  expenses: number;
  savings: number;
  date: Date;
}

interface PeriodFilter {
  label: string;
  value: 'current' | '3months' | '6months' | '1year';
  months: number;
}

const { width } = Dimensions.get('window');

const periodFilters: PeriodFilter[] = [
  { label: 'This Month', value: 'current', months: 1 },
  { label: 'Last 3 Months', value: '3months', months: 3 },
  { label: 'Last 6 Months', value: '6months', months: 6 },
  { label: 'Last Year', value: '1year', months: 12 },
];

// Category icon mapping to match the rest of the app
const categoryIconMap: { [key: string]: any } = {
  'Food & Dining': Utensils,
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
  'Investment': TrendingUp,
  'Gift': Gift,
  'Bonus': Trophy,
  'Other Income': DollarSign,
  'Transfer': ArrowLeftRight,
};

export default function AnalyticsScreen() {
  const { transactions, financialData, categories, funds, creditCards } = useData();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>(periodFilters[0]);
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailType, setDetailType] = useState<'income' | 'expenses' | 'savings'>('income');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>({});
  const [selectedSource, setSelectedSource] = useState<'overall' | string>('overall');
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const showAlert = (title: string, message: string, type: any = 'info', buttons: any[] = [{ text: 'OK' }]) => {
    setAlertConfig({ title, message, type, buttons });
    setAlertVisible(true);
  };

  const getCategoryIcon = (categoryName: string) => {
    return categoryIconMap[categoryName] || DollarSign;
  };

  // Filtered transactions by selected source
  const filteredTransactions = useMemo(() => {
    if (selectedSource === 'overall') return transactions;
    // Check if selectedSource is a fund or credit card
    if (funds.some(f => f.id === selectedSource)) {
      return transactions.filter(t => t.fundId === selectedSource);
    }
    if (creditCards.some(c => c.id === selectedSource)) {
      return transactions.filter(t => t.creditCardId === selectedSource);
    }
    return transactions;
  }, [transactions, selectedSource, funds, creditCards]);

  // Calculate period data based on selected filter and source
  const periodData = useMemo(() => {
    const now = new Date();
    const startDate = new Date();
    if (selectedPeriod.value === 'current') {
      startDate.setDate(1); // Start of current month
    } else {
      startDate.setMonth(now.getMonth() - selectedPeriod.months + 1);
      startDate.setDate(1);
    }
    const periodTransactions = filteredTransactions.filter(t => t.date >= startDate);
    const totalIncome = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = Math.abs(periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0));
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    return {
      totalIncome,
      totalExpenses,
      savingsRate,
      transactions: periodTransactions,
      startDate,
    };
  }, [filteredTransactions, selectedPeriod]);

  // Calculate monthly trend data (filtered)
  const monthlyTrendData = useMemo(() => {
    const months: MonthlyData[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      const monthTransactions = filteredTransactions.filter(t => 
        t.date >= date && t.date < nextMonth
      );
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = Math.abs(monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0));
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        year: date.getFullYear(),
        income,
        expenses,
        savings: income - expenses,
        date,
      });
    }
    return months;
  }, [filteredTransactions]);

  // Calculate category spending data
  const categorySpendingData = useMemo(() => {
    const expenseTransactions = periodData.transactions.filter(
      t => t.type === 'expense' && !(t.category === 'Bills' && t.title === 'Credit Card Payment')
    );
    const totalSpent = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const categoryTotals = expenseTransactions.reduce((acc, txn) => {
      const category = txn.category;
      acc[category] = (acc[category] || 0) + Math.abs(txn.amount);
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(categoryTotals)
      .map(([categoryName, amount]) => {
        const category = categories.find(cat => cat.name === categoryName);
        return {
          name: categoryName,
          amount,
          percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
          color: category?.color || '#666666',
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [periodData.transactions, categories]);

  // Calculate weekly spending pattern
  const weeklySpendingData = useMemo(() => {
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyTotals = new Array(7).fill(0);
    periodData.transactions
      .filter(t => t.type === 'expense' && !(t.category === 'Bills' && t.title === 'Credit Card Payment'))
      .forEach(t => {
        const dayOfWeek = (t.date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
        weeklyTotals[dayOfWeek] += Math.abs(t.amount);
      });
    return { weekDays, weeklyTotals };
  }, [periodData.transactions]);

  // Calculate comparison data for previous periods
  const comparisonData = useMemo(() => {
    const currentPeriodStart = periodData.startDate;
    const periodLength = selectedPeriod.months;
    
    // Calculate previous period
    const prevPeriodEnd = new Date(currentPeriodStart);
    prevPeriodEnd.setDate(prevPeriodEnd.getDate() - 1);
    const prevPeriodStart = new Date(prevPeriodEnd);
    prevPeriodStart.setMonth(prevPeriodStart.getMonth() - periodLength + 1);
    prevPeriodStart.setDate(1);
    
    const prevTransactions = transactions.filter(t => 
      t.date >= prevPeriodStart && t.date <= prevPeriodEnd
    );
    
    const prevIncome = prevTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const prevExpenses = Math.abs(prevTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0));
    
    const prevSavingsRate = prevIncome > 0 ? ((prevIncome - prevExpenses) / prevIncome) * 100 : 0;
    
    return {
      income: {
        current: periodData.totalIncome,
        previous: prevIncome,
        change: prevIncome > 0 ? ((periodData.totalIncome - prevIncome) / prevIncome) * 100 : 0,
      },
      expenses: {
        current: periodData.totalExpenses,
        previous: prevExpenses,
        change: prevExpenses > 0 ? ((periodData.totalExpenses - prevExpenses) / prevExpenses) * 100 : 0,
      },
      savings: {
        current: periodData.savingsRate,
        previous: prevSavingsRate,
        change: periodData.savingsRate - prevSavingsRate,
      },
    };
  }, [periodData, selectedPeriod, transactions]);

  // Transactions for selected category, period, and source
  const categoryTransactions = useMemo(() => {
    if (!selectedCategory) return [];
    return periodData.transactions.filter(
      t => t.category === selectedCategory && t.type === 'expense' && !(t.category === 'Bills' && t.title === 'Credit Card Payment')
    );
  }, [periodData.transactions, selectedCategory]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentageChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const handleCardPress = (type: 'income' | 'expenses' | 'savings') => {
    setDetailType(type);
    setDetailModalVisible(true);
  };

  const renderBarChart = (data: number[], labels: string[], maxValue: number, color: string) => {
    const chartMaxValue = Math.max(maxValue, Math.max(...data));
    
    return (
      <View style={styles.barChart}>
        <View style={styles.barChartBars}>
          {data.map((value, index) => {
            const height = chartMaxValue > 0 ? (value / chartMaxValue) * 100 : 0;
            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barBackground}>
                  <View 
                    style={[
                      styles.bar,
                      { 
                        height: `${height}%`,
                        backgroundColor: color
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.barLabel}>{labels[index]}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderDetailModal = () => {
    let title = '';
    let content = null;

    switch (detailType) {
      case 'income':
        title = 'Income Comparison';
        content = (
          <View style={styles.detailContent}>
            <View style={styles.comparisonCard}>
              <Text style={styles.comparisonTitle}>Current Period</Text>
              <Text style={[styles.comparisonAmount, styles.incomeColor]}>
                {formatCurrency(comparisonData.income.current)}
              </Text>
            </View>
            <View style={styles.comparisonCard}>
              <Text style={styles.comparisonTitle}>Previous Period</Text>
              <Text style={[styles.comparisonAmount, styles.incomeColor]}>
                {formatCurrency(comparisonData.income.previous)}
              </Text>
            </View>
            <View style={styles.comparisonCard}>
              <Text style={styles.comparisonTitle}>Change</Text>
              <Text style={[
                styles.comparisonAmount,
                comparisonData.income.change >= 0 ? styles.positiveChange : styles.negativeChange
              ]}>
                {formatPercentageChange(comparisonData.income.change)}
              </Text>
            </View>
          </View>
        );
        break;
      case 'expenses':
        title = 'Expense Comparison';
        content = (
          <View style={styles.detailContent}>
            <View style={styles.comparisonCard}>
              <Text style={styles.comparisonTitle}>Current Period</Text>
              <Text style={[styles.comparisonAmount, styles.expenseColor]}>
                {formatCurrency(comparisonData.expenses.current)}
              </Text>
            </View>
            <View style={styles.comparisonCard}>
              <Text style={styles.comparisonTitle}>Previous Period</Text>
              <Text style={[styles.comparisonAmount, styles.expenseColor]}>
                {formatCurrency(comparisonData.expenses.previous)}
              </Text>
            </View>
            <View style={styles.comparisonCard}>
              <Text style={styles.comparisonTitle}>Change</Text>
              <Text style={[
                styles.comparisonAmount,
                comparisonData.expenses.change <= 0 ? styles.positiveChange : styles.negativeChange
              ]}>
                {formatPercentageChange(comparisonData.expenses.change)}
              </Text>
            </View>
          </View>
        );
        break;
      case 'savings':
        title = 'Savings Rate Comparison';
        content = (
          <View style={styles.detailContent}>
            <View style={styles.comparisonCard}>
              <Text style={styles.comparisonTitle}>Current Period</Text>
              <Text style={[styles.comparisonAmount, styles.savingsColor]}>
                {comparisonData.savings.current.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.comparisonCard}>
              <Text style={styles.comparisonTitle}>Previous Period</Text>
              <Text style={[styles.comparisonAmount, styles.savingsColor]}>
                {comparisonData.savings.previous.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.comparisonCard}>
              <Text style={styles.comparisonTitle}>Change</Text>
              <Text style={[
                styles.comparisonAmount,
                comparisonData.savings.change >= 0 ? styles.positiveChange : styles.negativeChange
              ]}>
                {comparisonData.savings.change >= 0 ? '+' : ''}{comparisonData.savings.change.toFixed(1)}%
              </Text>
            </View>
          </View>
        );
        break;
    }

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <X color="#ffffff" size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {content}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderPeriodPicker = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showPeriodPicker}
      onRequestClose={() => setShowPeriodPicker(false)}
    >
      <TouchableOpacity 
        style={styles.pickerOverlay}
        activeOpacity={1}
        onPress={() => setShowPeriodPicker(false)}
      >
        <View style={styles.pickerContent}>
          {periodFilters.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.pickerItem,
                selectedPeriod.value === filter.value && styles.pickerItemSelected
              ]}
              onPress={() => {
                setSelectedPeriod(filter);
                setShowPeriodPicker(false);
              }}
            >
              <Text style={[
                styles.pickerItemText,
                selectedPeriod.value === filter.value && styles.pickerItemTextSelected
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Source filter options
  const sourceOptions = [
    { type: 'overall', label: 'Overall', id: 'overall' },
    ...funds.map(fund => ({ type: 'fund', label: fund.name, id: fund.id })),
    ...creditCards.map(card => ({ type: 'card', label: card.name, id: card.id })),
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.periodButton}
              onPress={() => setShowPeriodPicker(true)}
            >
              <Calendar color="#c4ff00" size={20} />
              <Text style={styles.periodText}>{selectedPeriod.label}</Text>
              <ChevronDown color="#c4ff00" size={16} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterButton}>
              <Filter color="#ffffff" size={20} />
            </TouchableOpacity>
          </View>
        </View>
        {/* Source Filter Dropdown */}
        <View style={{ paddingHorizontal: 16, marginVertical: 10 }}>
          <TouchableOpacity
            style={styles.sourceDropdownButton}
            onPress={() => setShowSourcePicker(true)}
          >
            {selectedSource === 'overall' && <Text style={styles.sourceDropdownText}>Overall</Text>}
            {funds.some(f => f.id === selectedSource) && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Wallet color="#c4ff00" size={16} style={{ marginRight: 4 }} />
                <Text style={styles.sourceDropdownText}>{funds.find(f => f.id === selectedSource)?.name}</Text>
              </View>
            )}
            {creditCards.some(c => c.id === selectedSource) && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <CreditCard color="#c4ff00" size={16} style={{ marginRight: 4 }} />
                <Text style={styles.sourceDropdownText}>{creditCards.find(c => c.id === selectedSource)?.name}</Text>
              </View>
            )}
            <ChevronDown color="#c4ff00" size={16} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
        {/* Source Picker Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showSourcePicker}
          onRequestClose={() => setShowSourcePicker(false)}
        >
          <TouchableOpacity 
            style={styles.pickerOverlay}
            activeOpacity={1}
            onPress={() => setShowSourcePicker(false)}
          >
            <View style={styles.pickerContent}>
              <Text style={styles.pickerSectionLabel}>Overall</Text>
              <TouchableOpacity
                style={[styles.pickerItem, selectedSource === 'overall' && styles.pickerItemSelected]}
                onPress={() => { setSelectedSource('overall'); setShowSourcePicker(false); }}
              >
                <Text style={[styles.pickerItemText, selectedSource === 'overall' && styles.pickerItemTextSelected]}>Overall</Text>
              </TouchableOpacity>
              {funds.length > 0 && <Text style={styles.pickerSectionLabel}>Funds</Text>}
              {funds.map(fund => (
                <TouchableOpacity
                  key={fund.id}
                  style={[styles.pickerItem, selectedSource === fund.id && styles.pickerItemSelected, { flexDirection: 'row', alignItems: 'center' }]}
                  onPress={() => { setSelectedSource(fund.id); setShowSourcePicker(false); }}
                >
                  <Wallet color="#c4ff00" size={16} style={{ marginRight: 8 }} />
                  <Text style={[styles.pickerItemText, selectedSource === fund.id && styles.pickerItemTextSelected]}>{fund.name}</Text>
                </TouchableOpacity>
              ))}
              {creditCards.length > 0 && <Text style={styles.pickerSectionLabel}>Credit Cards</Text>}
              {creditCards.map(card => (
                <TouchableOpacity
                  key={card.id}
                  style={[styles.pickerItem, selectedSource === card.id && styles.pickerItemSelected, { flexDirection: 'row', alignItems: 'center' }]}
                  onPress={() => { setSelectedSource(card.id); setShowSourcePicker(false); }}
                >
                  <CreditCard color="#c4ff00" size={16} style={{ marginRight: 8 }} />
                  <Text style={[styles.pickerItemText, selectedSource === card.id && styles.pickerItemTextSelected]}>{card.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Key Metrics */}
        <View style={styles.metricsSection}>
          <View style={styles.metricsGrid}>
            <TouchableOpacity 
              style={styles.metricCard}
              onPress={() => handleCardPress('income')}
            >
              <View style={styles.metricIcon}>
                <DollarSign color="#4ade80" size={20} />
              </View>
              <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(periodData.totalIncome)}
              </Text>
              <Text style={styles.metricLabel}>Total Income</Text>
              <Text style={[
                styles.metricChange,
                comparisonData.income.change >= 0 ? styles.positiveChange : styles.negativeChange
              ]}>
                {formatPercentageChange(comparisonData.income.change)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.metricCard}
              onPress={() => handleCardPress('expenses')}
            >
              <View style={styles.metricIcon}>
                <TrendingUp color="#f87171" size={20} />
              </View>
              <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(periodData.totalExpenses)}
              </Text>
              <Text style={styles.metricLabel}>Total Expenses</Text>
              <Text style={[
                styles.metricChange,
                comparisonData.expenses.change <= 0 ? styles.positiveChange : styles.negativeChange
              ]}>
                {formatPercentageChange(comparisonData.expenses.change)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.metricCard}
              onPress={() => handleCardPress('savings')}
            >
              <View style={styles.metricIcon}>
                <BarChart3 color="#c4ff00" size={20} />
              </View>
              <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
                {periodData.savingsRate.toFixed(1)}%
              </Text>
              <Text style={styles.metricLabel}>Savings Rate</Text>
              <Text style={[
                styles.metricChange,
                comparisonData.savings.change >= 0 ? styles.positiveChange : styles.negativeChange
              ]}>
                {comparisonData.savings.change >= 0 ? '+' : ''}{comparisonData.savings.change.toFixed(1)}%
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Spending by Category */}
        {categorySpendingData.length > 0 && (
          <View style={styles.categorySection}>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            <View style={styles.chartCard}>
              <View style={styles.categoryVisualization}>
                <View style={styles.categoryChart}>
                  {categorySpendingData.slice(0, 6).map((category, index) => {
                    const CategoryIcon = getCategoryIcon(category.name);
                    return (
                      <TouchableOpacity
                        key={index}
                        style={styles.categoryBar}
                        onPress={() => {
                          setSelectedCategory(category.name);
                          setShowCategoryModal(true);
                        }}
                      >
                        <View style={styles.categoryInfo}>
                          <View style={styles.categoryIconContainer}>
                            <CategoryIcon color="#c4ff00" size={20} />
                          </View>
                          <Text style={styles.categoryName}>{category.name}</Text>
                        </View>
                        <View style={styles.categoryProgressContainer}>
                          <View style={styles.categoryProgressBar}>
                            <View 
                              style={[
                                styles.categoryProgressFill,
                                { 
                                  width: `${category.percentage}%`,
                                  backgroundColor: category.color
                                }
                              ]} 
                            />
                          </View>
                          <Text style={styles.categoryAmount}>{formatCurrency(category.amount)}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Monthly Trend */}
        <View style={styles.trendSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Monthly Trend</Text>
          </View>
          <View style={styles.chartContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthlyChartScroll}>
              <View style={styles.monthlyChart}>
                {monthlyTrendData.map((data, index) => {
                  const maxValue = Math.max(...monthlyTrendData.map(d => Math.max(d.income, d.expenses)));
                  const incomeHeight = maxValue > 0 ? (data.income / maxValue) * 100 : 0;
                  const expenseHeight = maxValue > 0 ? (data.expenses / maxValue) * 100 : 0;
                  return (
                    <View key={index} style={styles.monthlyBar}>
                      <View style={styles.monthlyBarContainer}>
                        <View 
                          style={[
                            styles.monthlyBarSegment,
                            { 
                              height: `${incomeHeight}%`,
                              backgroundColor: '#4ade80',
                              borderTopLeftRadius: 6,
                              borderTopRightRadius: 6,
                              borderBottomLeftRadius: expenseHeight > 0 ? 0 : 6,
                              borderBottomRightRadius: expenseHeight > 0 ? 0 : 6,
                            }
                          ]} 
                        />
                        <View 
                          style={[
                            styles.monthlyBarSegment,
                            { 
                              height: `${expenseHeight}%`,
                              backgroundColor: '#f87171',
                              borderTopLeftRadius: 0,
                              borderTopRightRadius: 0,
                              borderBottomLeftRadius: 6,
                              borderBottomRightRadius: 6,
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.monthLabel}>{data.month}</Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#4ade80' }]} />
                <Text style={styles.legendText}>Income</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#f87171' }]} />
                <Text style={styles.legendText}>Expenses</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Weekly Spending Pattern */}
        {weeklySpendingData.weeklyTotals.some(total => total > 0) && (
          <View style={styles.weeklySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Weekly Spending Pattern</Text>
            </View>
            <View style={styles.chartContainer}>
              {renderBarChart(
                weeklySpendingData.weeklyTotals, 
                weeklySpendingData.weekDays, 
                Math.max(...weeklySpendingData.weeklyTotals), 
                '#c4ff00'
              )}
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {renderDetailModal()}
      {renderPeriodPicker()}

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
      />

      {/* Category Transactions Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCategoryModal}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedCategory} Transactions</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <X color="#ffffff" size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {categoryTransactions.length === 0 ? (
                <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>No transactions found for this category.</Text>
              ) : (
                categoryTransactions.map((txn, idx) => (
                  <View key={txn.id || idx} style={{ marginBottom: 16, backgroundColor: '#232323', borderRadius: 10, padding: 12 }}>
                    <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'Inter-SemiBold' }}>{txn.title}</Text>
                    <Text style={{ color: '#c4ff00', fontSize: 14, marginTop: 2 }}>{formatCurrency(Math.abs(txn.amount))}</Text>
                    <Text style={{ color: '#aaa', fontSize: 13, marginTop: 2 }}>{txn.date.toLocaleDateString()}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 12,
  },
  periodText: {
    color: '#c4ff00',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
    marginRight: 4,
  },
  filterButton: {
    backgroundColor: '#2a2a2a',
    padding: 10,
    borderRadius: 12,
  },
  metricsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    minHeight: 120,
  },
  metricIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  metricLabel: {
    color: '#999999',
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 12,
  },
  metricChange: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
  },
  positiveChange: {
    color: '#4ade80',
  },
  negativeChange: {
    color: '#f87171',
  },
  categorySection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
  },
  categoryVisualization: {
    alignItems: 'center',
  },
  categoryChart: {
    width: '100%',
  },
  categoryBar: {
    marginBottom: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  categoryProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#404040',
    borderRadius: 4,
    marginRight: 12,
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryAmount: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    minWidth: 80,
    textAlign: 'right',
  },
  trendSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  chartContainer: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 16,
  },
  monthlyChartScroll: {
    marginBottom: 16,
  },
  monthlyChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    paddingHorizontal: 10,
    minWidth: width - 80,
  },
  monthlyBar: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: 40,
  },
  monthlyBarContainer: {
    height: 80,
    width: 20,
    backgroundColor: '#404040',
    borderRadius: 6,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  monthlyBarSegment: {
    width: '100%',
    borderRadius: 0,
  },
  monthLabel: {
    color: '#999999',
    fontSize: 10,
    fontFamily: 'Inter-Regular',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    color: '#999999',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  weeklySection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  barChart: {
    height: 120,
  },
  barChartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
    justifyContent: 'space-between',
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barBackground: {
    height: 80,
    width: 20,
    backgroundColor: '#404040',
    borderRadius: 2,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 2,
  },
  barLabel: {
    color: '#999999',
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  bottomSpacing: {
    height: 100,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  modalBody: {
    padding: 20,
  },
  detailContent: {
    gap: 16,
  },
  comparisonCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  comparisonTitle: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  comparisonAmount: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  incomeColor: {
    color: '#4ade80',
  },
  expenseColor: {
    color: '#f87171',
  },
  savingsColor: {
    color: '#c4ff00',
  },
  // Period picker styles
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pickerContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 8,
    minWidth: 200,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  pickerItemSelected: {
    backgroundColor: '#c4ff00',
  },
  pickerItemText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  pickerItemTextSelected: {
    color: '#1a1a1a',
    fontFamily: 'Inter-SemiBold',
  },
  sourceDropdownButton: {
    backgroundColor: '#232323',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#444',
  },
  sourceDropdownText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    marginRight: 4,
  },
  pickerSectionLabel: {
    color: '#888',
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    marginTop: 10,
    marginBottom: 2,
    marginLeft: 4,
  },
});