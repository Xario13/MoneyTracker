import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Calendar,
  DollarSign,
  ShoppingCart,
  Car,
  Gamepad2,
  Zap,
  Stethoscope,
  GraduationCap,
  Plane,
  ShoppingBag,
  Smartphone,
  FileText,
  Briefcase,
  Laptop,
  TrendingUp as Investment,
  Gift,
  Trophy,
  ArrowLeftRight,
  Utensils,
  X,
  Check
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useData } from '@/contexts/DataContext';
import { Transaction } from '@/types/user';
import TransactionDetailModal from '@/components/TransactionDetailModal';
import EditTransactionModal from '@/components/EditTransactionModal';
import CustomAlert from '@/components/CustomAlert';

// Category icon mapping
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
  'Investment': Investment,
  'Gift': Gift,
  'Bonus': Trophy,
  'Other Income': DollarSign,
  'Transfer': ArrowLeftRight,
};

const timePeriods = [
  { label: 'All Time', value: 'all' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'This Week', value: 'thisWeek' },
  { label: 'Last Week', value: 'lastWeek' },
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
];

const sortOptions = [
  { label: 'Date (Newest)', value: 'dateDesc' },
  { label: 'Date (Oldest)', value: 'dateAsc' },
  { label: 'Amount (High to Low)', value: 'amountDesc' },
  { label: 'Amount (Low to High)', value: 'amountAsc' },
  { label: 'Category (A-Z)', value: 'categoryAsc' },
  { label: 'Category (Z-A)', value: 'categoryDesc' },
];

export default function TransactionsScreen() {
  const { transactions, updateTransaction, deleteTransaction } = useData();
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isTransactionDetailVisible, setTransactionDetailVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>({});
  
  // Filter states
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState('dateDesc');
  
  // Modal states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  const showAlert = (title: string, message: string, type: any = 'info', buttons: any[] = [{ text: 'OK' }]) => {
    setAlertConfig({ title, message, type, buttons });
    setAlertVisible(true);
  };

  const getCategoryIcon = (categoryName: string) => {
    return categoryIconMap[categoryName] || DollarSign;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFilteredAndSortedTransactions = () => {
    let filtered = [...transactions];

    // Filter by transaction type (income/expense)
    if (selectedType !== 'all') {
      filtered = filtered.filter(t => t.type === selectedType);
    }

    // Filter by time period
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (selectedPeriod) {
      case 'today':
        filtered = filtered.filter(t => t.date >= startOfDay);
        break;
      case 'yesterday':
        const yesterday = new Date(startOfDay);
        yesterday.setDate(yesterday.getDate() - 1);
        const endOfYesterday = new Date(yesterday);
        endOfYesterday.setDate(endOfYesterday.getDate() + 1);
        filtered = filtered.filter(t => t.date >= yesterday && t.date < endOfYesterday);
        break;
      case 'thisWeek':
        filtered = filtered.filter(t => t.date >= startOfWeek);
        break;
      case 'lastWeek':
        const lastWeekStart = new Date(startOfWeek);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(startOfWeek);
        filtered = filtered.filter(t => t.date >= lastWeekStart && t.date < lastWeekEnd);
        break;
      case 'thisMonth':
        filtered = filtered.filter(t => t.date >= startOfMonth);
        break;
      case 'lastMonth':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = filtered.filter(t => t.date >= lastMonthStart && t.date < lastMonthEnd);
        break;
    }

    // Filter by categories (multiple selection)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(t => selectedCategories.includes(t.category));
    }

    // Filter by amount range
    if (minAmount) {
      const min = parseFloat(minAmount);
      if (!isNaN(min)) {
        filtered = filtered.filter(t => Math.abs(t.amount) >= min);
      }
    }
    if (maxAmount) {
      const max = parseFloat(maxAmount);
      if (!isNaN(max)) {
        filtered = filtered.filter(t => Math.abs(t.amount) <= max);
      }
    }

    // Sort transactions
    switch (sortBy) {
      case 'dateDesc':
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'dateAsc':
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'amountDesc':
        filtered.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
        break;
      case 'amountAsc':
        filtered.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
        break;
      case 'categoryAsc':
        filtered.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'categoryDesc':
        filtered.sort((a, b) => b.category.localeCompare(a.category));
        break;
    }

    return filtered;
  };

  useEffect(() => {
    setFilteredTransactions(getFilteredAndSortedTransactions());
  }, [selectedPeriod, selectedCategories, selectedType, minAmount, maxAmount, sortBy, transactions]);

  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setTransactionDetailVisible(true);
  };

  const handleTransactionSave = async (updatedTransaction: Transaction) => {
    try {
      await updateTransaction(updatedTransaction.id, updatedTransaction);
      showAlert('Success', 'Transaction updated successfully', 'success');
    } catch (error) {
      showAlert('Error', 'Failed to update transaction', 'error');
    }
  };

  const handleTransactionDelete = async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId);
      showAlert('Success', 'Transaction deleted successfully', 'success');
    } catch (error) {
      showAlert('Error', 'Failed to delete transaction', 'error');
    }
  };

  const clearFilters = () => {
    setSelectedPeriod('all');
    setSelectedCategories([]);
    setSelectedType('all');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('dateDesc');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedPeriod !== 'all') count++;
    if (selectedCategories.length > 0) count++;
    if (selectedType !== 'all') count++;
    if (minAmount) count++;
    if (maxAmount) count++;
    return count;
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const clearCategories = () => {
    setSelectedCategories([]);
  };

  const categories = Array.from(new Set(transactions.map(t => t.category))).sort();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#ffffff" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>All Transactions</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.filterButton, getActiveFiltersCount() > 0 && styles.filterButtonActive]}
            onPress={() => setShowFilterModal(true)}
          >
            <Filter color={getActiveFiltersCount() > 0 ? "#1a1a1a" : "#c4ff00"} size={20} />
            {getActiveFiltersCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => setShowSortModal(true)}
          >
            <SortDesc color="#c4ff00" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Filters Summary */}
      {getActiveFiltersCount() > 0 && (
        <View style={styles.activeFilters}>
          <Text style={styles.activeFiltersText}>
            {filteredTransactions.length} of {transactions.length} transactions
          </Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Transactions List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const CategoryIcon = getCategoryIcon(item.category);
          return (
            <TouchableOpacity 
              style={styles.transactionItem} 
              onPress={() => handleTransactionPress(item)}
            >
              <View style={styles.transactionIcon}>
                <CategoryIcon color="#c4ff00" size={20} />
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>{item.title}</Text>
                <Text style={styles.transactionCategory}>{item.category}</Text>
                <Text style={styles.transactionDate}>{formatDate(new Date(item.date))}</Text>
              </View>
              <View style={styles.transactionAmount}>
                <Text style={[
                  styles.amountText,
                  { color: item.type === 'income' ? '#4ade80' : '#f87171' }
                ]}>
                  {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        style={styles.transactionsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No transactions found</Text>
            <Text style={styles.emptyStateSubtext}>Try adjusting your filters</Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Transactions</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X color="#ffffff" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Transaction Type */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Transaction Type</Text>
                <View style={styles.typeToggle}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      selectedType === 'all' && styles.typeButtonSelected
                    ]}
                    onPress={() => setSelectedType('all')}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      selectedType === 'all' && styles.typeButtonTextSelected
                    ]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      selectedType === 'income' && styles.typeButtonSelected
                    ]}
                    onPress={() => setSelectedType('income')}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      selectedType === 'income' && styles.typeButtonTextSelected
                    ]}>
                      Income
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      selectedType === 'expense' && styles.typeButtonSelected
                    ]}
                    onPress={() => setSelectedType('expense')}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      selectedType === 'expense' && styles.typeButtonTextSelected
                    ]}>
                      Expense
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Time Period */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Time Period</Text>
                <View style={styles.optionsGrid}>
                  {timePeriods.map((period) => (
                    <TouchableOpacity
                      key={period.value}
                      style={[
                        styles.optionButton,
                        selectedPeriod === period.value && styles.optionButtonSelected
                      ]}
                      onPress={() => setSelectedPeriod(period.value)}
                    >
                      <Text style={[
                        styles.optionText,
                        selectedPeriod === period.value && styles.optionTextSelected
                      ]}>
                        {period.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Category */}
              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Text style={styles.filterSectionTitle}>Category</Text>
                  {selectedCategories.length > 0 && (
                    <TouchableOpacity onPress={clearCategories}>
                      <Text style={styles.clearCategoriesText}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.optionsGrid}>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      selectedCategories.length === 0 && styles.optionButtonSelected
                    ]}
                    onPress={clearCategories}
                  >
                    <Text style={[
                      styles.optionText,
                      selectedCategories.length === 0 && styles.optionTextSelected
                    ]}>
                      All Categories
                    </Text>
                  </TouchableOpacity>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.optionButton,
                        selectedCategories.includes(category) && styles.optionButtonSelected
                      ]}
                      onPress={() => toggleCategory(category)}
                    >
                      <Text style={[
                        styles.optionText,
                        selectedCategories.includes(category) && styles.optionTextSelected
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {selectedCategories.length > 0 && (
                  <Text style={styles.selectedCategoriesText}>
                    {selectedCategories.length} category{selectedCategories.length !== 1 ? 'ies' : 'y'} selected
                  </Text>
                )}
              </View>

              {/* Amount Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Amount Range</Text>
                <View style={styles.amountInputs}>
                  <View style={styles.amountInputContainer}>
                    <Text style={styles.amountLabel}>Min Amount</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={minAmount}
                      onChangeText={setMinAmount}
                      placeholder="0"
                      placeholderTextColor="#666666"
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.amountInputContainer}>
                    <Text style={styles.amountLabel}>Max Amount</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={maxAmount}
                      onChangeText={setMaxAmount}
                      placeholder="∞"
                      placeholderTextColor="#666666"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={clearFilters}
              >
                <Text style={styles.cancelButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort Transactions</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <X color="#ffffff" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    sortBy === option.value && styles.sortOptionSelected
                  ]}
                  onPress={() => {
                    setSortBy(option.value);
                    setShowSortModal(false);
                  }}
                >
                  <Text style={[
                    styles.sortOptionText,
                    sortBy === option.value && styles.sortOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {sortBy === option.value && (
                    <Check color="#1a1a1a" size={20} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <TransactionDetailModal
        visible={isTransactionDetailVisible}
        onClose={() => setTransactionDetailVisible(false)}
        transaction={selectedTransaction}
        onEdit={handleTransactionSave}
        onDelete={handleTransactionDelete}
      />

      <EditTransactionModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        transaction={selectedTransaction}
        onSave={handleTransactionSave}
        onDelete={handleTransactionDelete}
      />

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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    padding: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    backgroundColor: '#2a2a2a',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#c4ff00',
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#f87171',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  sortButton: {
    backgroundColor: '#2a2a2a',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#2a2a2a',
  },
  activeFiltersText: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  clearFiltersText: {
    color: '#c4ff00',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  transactionsList: {
    flex: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  transactionDate: {
    color: '#666666',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
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
    paddingVertical: 20,
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
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  optionButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginHorizontal: 6,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: '#c4ff00',
    borderColor: '#c4ff00',
  },
  optionText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  optionTextSelected: {
    color: '#1a1a1a',
    fontFamily: 'Inter-SemiBold',
  },
  amountInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  amountInputContainer: {
    flex: 1,
  },
  amountLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  amountInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 16,
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
  applyButton: {
    flex: 1,
    backgroundColor: '#c4ff00',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  applyButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  sortOptionSelected: {
    backgroundColor: '#c4ff00',
  },
  sortOptionText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  sortOptionTextSelected: {
    color: '#1a1a1a',
    fontFamily: 'Inter-SemiBold',
  },
  clearCategoriesText: {
    color: '#c4ff00',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  selectedCategoriesText: {
    color: '#999999',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
  },
  typeToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginHorizontal: 6,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonSelected: {
    backgroundColor: '#c4ff00',
    borderColor: '#c4ff00',
  },
  typeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  typeButtonTextSelected: {
    color: '#1a1a1a',
    fontFamily: 'Inter-SemiBold',
  },
}); 