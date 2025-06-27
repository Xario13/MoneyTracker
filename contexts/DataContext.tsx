import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserFinancialData, SavingsGoal, CreditGoal, Transaction, Category, Fund, CreditCard } from '@/types/user';
import { useAuth } from './AuthContext';

interface DataContextType {
  financialData: UserFinancialData | null;
  funds: Fund[];
  creditCards: CreditCard[];
  savingsGoals: SavingsGoal[];
  creditGoals: CreditGoal[];
  transactions: Transaction[];
  categories: Category[];
  isLoading: boolean;
  
  // Financial data methods
  updateFinancialData: (data: Partial<UserFinancialData>) => Promise<void>;
  
  // Fund methods
  addFund: (fund: Omit<Fund, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFund: (fundId: string, updates: Partial<Fund>) => Promise<void>;
  deleteFund: (fundId: string) => Promise<void>;
  
  // Credit card methods
  addCreditCard: (card: Omit<CreditCard, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCreditCard: (cardId: string, updates: Partial<CreditCard>) => Promise<void>;
  deleteCreditCard: (cardId: string) => Promise<void>;
  payCreditCardBill: (cardId: string, amount: number, sourceId: string, sourceType: 'fund' | 'savings') => Promise<void>;
  
  // Goals methods
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSavingsGoal: (goalId: string, updates: Partial<SavingsGoal>) => Promise<void>;
  deleteSavingsGoal: (goalId: string) => Promise<void>;
  addMoneyToGoal: (goalId: string, amount: number) => Promise<void>;
  markGoalCompleted: (goalId: string) => Promise<void>;
  deallocateFromGoal: (goalId: string, amount: number) => Promise<void>;
  
  // Credit goals methods
  addCreditGoal: (goal: Omit<CreditGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCreditGoal: (goalId: string, updates: Partial<CreditGoal>) => Promise<void>;
  deleteCreditGoal: (goalId: string) => Promise<void>;
  
  // Transaction methods
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; needsConfirmation?: boolean; overage?: number; availableSources?: Array<{id: string, name: string, balance: number, type: 'fund' | 'savings'}> }>;
  updateTransaction: (transactionId: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  
  // Analytics methods
  getMonthlySpending: (fundId?: string) => number;
  getCategorySpending: (fundId?: string) => { category: string; amount: number; percentage: number }[];
  getSavingsRate: () => number;
  getTotalBalance: () => number;
  getTotalMonthlyIncome: () => number;
  getTotalMonthlySpending: () => number;
  setFunds: React.Dispatch<React.SetStateAction<Fund[]>>;
  saveFunds: (fundsData: Fund[]) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

interface DataProviderProps {
  children: ReactNode;
}

const defaultCategories: Category[] = [
  // Expense categories
  { id: '1', name: 'Food & Dining', emoji: '🍽️', color: '#ff6b6b', type: 'expense' },
  { id: '2', name: 'Transportation', emoji: '🚗', color: '#4ecdc4', type: 'expense' },
  { id: '3', name: 'Shopping', emoji: '🛒', color: '#45b7d1', type: 'expense' },
  { id: '4', name: 'Entertainment', emoji: '🎬', color: '#96ceb4', type: 'expense' },
  { id: '5', name: 'Utilities', emoji: '⚡', color: '#ffeaa7', type: 'expense' },
  { id: '6', name: 'Health & Medical', emoji: '🏥', color: '#dda0dd', type: 'expense' },
  { id: '7', name: 'Education', emoji: '📚', color: '#fab1a0', type: 'expense' },
  { id: '8', name: 'Travel', emoji: '✈️', color: '#74b9ff', type: 'expense' },
  { id: '9', name: 'Groceries', emoji: '🛍️', color: '#fd79a8', type: 'expense' },
  { id: '10', name: 'Subscriptions', emoji: '📱', color: '#fdcb6e', type: 'expense' },
  { id: '11', name: 'Bills', emoji: '🧾', color: '#636e72', type: 'expense' },
  
  // Income categories
  { id: '12', name: 'Salary', emoji: '💼', color: '#00b894', type: 'income' },
  { id: '13', name: 'Freelance', emoji: '💻', color: '#0984e3', type: 'income' },
  { id: '14', name: 'Investment', emoji: '📈', color: '#6c5ce7', type: 'income' },
  { id: '15', name: 'Gift', emoji: '🎁', color: '#fd79a8', type: 'income' },
  { id: '16', name: 'Bonus', emoji: '🏆', color: '#fdcb6e', type: 'income' },
  { id: '17', name: 'Other Income', emoji: '💰', color: '#00cec9', type: 'income' },
  { id: '18', name: 'Transfer', emoji: '🔄', color: '#74b9ff', type: 'income' },
];

const fundColors = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', 
  '#dda0dd', '#fab1a0', '#74b9ff', '#fd79a8', '#fdcb6e',
  '#00b894', '#0984e3', '#6c5ce7', '#00cec9', '#e17055',
];

export function DataProvider({ children }: DataProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [financialData, setFinancialData] = useState<UserFinancialData | null>(null);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [creditGoals, setCreditGoals] = useState<CreditGoal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories] = useState<Category[]>(defaultCategories);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData();
    } else {
      clearData();
    }
  }, [isAuthenticated, user]);

  const loadUserData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load financial data
      const financialDataKey = `financialData_${user.id}`;
      const storedFinancialData = await AsyncStorage.getItem(financialDataKey);
      if (storedFinancialData) {
        const data = JSON.parse(storedFinancialData);
        setFinancialData({
          ...data,
          incomeStartDate: data.incomeStartDate ? new Date(data.incomeStartDate) : undefined,
          updatedAt: new Date(data.updatedAt),
        });
      }

      // Load funds
      const fundsKey = `funds_${user.id}`;
      const storedFunds = await AsyncStorage.getItem(fundsKey);
      if (storedFunds) {
        const fundsData = JSON.parse(storedFunds);
        setFunds(fundsData.map((fund: any) => ({
          ...fund,
          createdAt: new Date(fund.createdAt),
          updatedAt: new Date(fund.updatedAt),
        })));
      }

      // Load credit cards
      const creditCardsKey = `creditCards_${user.id}`;
      const storedCreditCards = await AsyncStorage.getItem(creditCardsKey);
      if (storedCreditCards) {
        const cardsData = JSON.parse(storedCreditCards);
        setCreditCards(cardsData.map((card: any) => ({
          ...card,
          billDate: new Date(card.billDate),
          createdAt: new Date(card.createdAt),
          updatedAt: new Date(card.updatedAt),
        })));
      }

      // Load savings goals
      const goalsKey = `savingsGoals_${user.id}`;
      const storedGoals = await AsyncStorage.getItem(goalsKey);
      if (storedGoals) {
        const goals = JSON.parse(storedGoals);
        setSavingsGoals(goals.map((goal: any) => ({
          ...goal,
          deadline: new Date(goal.deadline),
          createdAt: new Date(goal.createdAt),
          updatedAt: new Date(goal.updatedAt),
        })));
      }

      // Load credit goals
      const creditGoalsKey = `creditGoals_${user.id}`;
      const storedCreditGoals = await AsyncStorage.getItem(creditGoalsKey);
      if (storedCreditGoals) {
        const goals = JSON.parse(storedCreditGoals);
        setCreditGoals(goals.map((goal: any) => ({
          ...goal,
          deadline: new Date(goal.deadline),
          createdAt: new Date(goal.createdAt),
          updatedAt: new Date(goal.updatedAt),
        })));
      }

      // Load transactions
      const transactionsKey = `transactions_${user.id}`;
      const storedTransactions = await AsyncStorage.getItem(transactionsKey);
      if (storedTransactions) {
        const txns = JSON.parse(storedTransactions);
        setTransactions(txns.map((txn: any) => ({
          ...txn,
          date: new Date(txn.date),
          createdAt: new Date(txn.createdAt),
          updatedAt: new Date(txn.updatedAt),
        })));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearData = () => {
    setFinancialData(null);
    setFunds([]);
    setCreditCards([]);
    setSavingsGoals([]);
    setCreditGoals([]);
    setTransactions([]);
  };

  const saveFinancialData = async (data: UserFinancialData) => {
    if (!user) return;
    const key = `financialData_${user.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(data));
  };

  const saveFunds = async (fundsData: Fund[]) => {
    if (!user) return;
    const key = `funds_${user.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(fundsData));
  };

  const saveCreditCards = async (cardsData: CreditCard[]) => {
    if (!user) return;
    const key = `creditCards_${user.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(cardsData));
  };

  const saveSavingsGoals = async (goals: SavingsGoal[]) => {
    if (!user) return;
    const key = `savingsGoals_${user.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(goals));
  };

  const saveCreditGoals = async (goals: CreditGoal[]) => {
    if (!user) return;
    const key = `creditGoals_${user.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(goals));
  };

  const saveTransactions = async (txns: Transaction[]) => {
    if (!user) return;
    const key = `transactions_${user.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(txns));
  };

  // Rebalance savings goals if total allocated exceeds savingBalance
  const rebalanceSavingsGoals = async (newSavingBalance?: number) => {
    const balance = typeof newSavingBalance === 'number' ? newSavingBalance : financialData?.savingBalance || 0;
    const totalAllocated = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    if (totalAllocated <= balance) return;
    if (savingsGoals.length === 0) return;
    // Proportionally reduce each goal's allocation
    const ratio = balance / totalAllocated;
    const updatedGoals = savingsGoals.map(goal => ({
      ...goal,
      currentAmount: Math.floor(goal.currentAmount * ratio),
      updatedAt: new Date(),
    }));
    setSavingsGoals(updatedGoals);
    await saveSavingsGoals(updatedGoals);
  };

  const updateFinancialData = async (updates: Partial<UserFinancialData>) => {
    if (!user) return;
    
    const updatedData: UserFinancialData = {
      userId: user.id,
      totalBalance: 0,
      savingBalance: 0,
      monthlySpendingLimit: 0,
      hasRecurringIncome: false,
      updatedAt: new Date(),
      ...financialData,
      ...updates,
    };
    
    setFinancialData(updatedData);
    await saveFinancialData(updatedData);

    // If this is initial setup with funds, create them
    if (updates.initialFunds) {
      for (const fundData of updates.initialFunds) {
        await addFund({
          name: fundData.name,
          balance: fundData.balance,
          emoji: fundData.emoji,
          color: getNextColor(funds),
        });
      }
    }

    // Rebalance savings goals if savingBalance is updated
    if (typeof updates.savingBalance === 'number') {
      await rebalanceSavingsGoals(updates.savingBalance);
    }
  };

  const getNextColor = (existingItems: Array<{color: string}>) => {
    const usedColors = existingItems.map(item => item.color);
    const availableColors = fundColors.filter(color => !usedColors.includes(color));
    return availableColors.length > 0 ? availableColors[0] : fundColors[existingItems.length % fundColors.length];
  };

  // Fund methods
  const addFund = async (fundData: Omit<Fund, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    const newFund: Fund = {
      ...fundData,
      id: Date.now().toString(),
      userId: user.id,
      color: getNextColor(funds),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedFunds = [...funds, newFund];
    setFunds(updatedFunds);
    await saveFunds(updatedFunds);
  };

  const updateFund = async (fundId: string, updates: Partial<Fund>) => {
    const updatedFunds = funds.map(fund =>
      fund.id === fundId
        ? { ...fund, ...updates, updatedAt: new Date() }
        : fund
    );
    setFunds(updatedFunds);
    await saveFunds(updatedFunds);
  };

  const deleteFund = async (fundId: string) => {
    const fundToDelete = funds.find(f => f.id === fundId);
    if (!fundToDelete || !financialData) return;

    // Transfer fund balance to savings
    if (fundToDelete.balance > 0) {
      await updateFinancialData({
        savingBalance: financialData.savingBalance + fundToDelete.balance,
      });
    }

    const updatedFunds = funds.filter(fund => fund.id !== fundId);
    setFunds(updatedFunds);
    await saveFunds(updatedFunds);
  };

  // Credit card methods
  const addCreditCard = async (cardData: Omit<CreditCard, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    const newCard: CreditCard = {
      ...cardData,
      id: Date.now().toString(),
      userId: user.id,
      color: getNextColor(creditCards),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedCards = [...creditCards, newCard];
    setCreditCards(updatedCards);
    await saveCreditCards(updatedCards);

    // Auto-create credit goal
    const creditGoal: CreditGoal = {
      id: `credit-goal-${newCard.id}`,
      userId: user.id,
      creditCardId: newCard.id,
      targetAmount: newCard.balance,
      currentAmount: 0,
      deadline: new Date(newCard.billDate),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedCreditGoals = [...creditGoals, creditGoal];
    setCreditGoals(updatedCreditGoals);
    await saveCreditGoals(updatedCreditGoals);
  };

  const updateCreditCard = async (cardId: string, updates: Partial<CreditCard>) => {
    const updatedCards = creditCards.map(card =>
      card.id === cardId
        ? { ...card, ...updates, updatedAt: new Date() }
        : card
    );
    setCreditCards(updatedCards);
    await saveCreditCards(updatedCards);

    // Update corresponding credit goal
    const updatedCard = updatedCards.find(c => c.id === cardId);
    if (updatedCard) {
      const updatedCreditGoals = creditGoals.map(goal =>
        goal.creditCardId === cardId
          ? { ...goal, targetAmount: updatedCard.balance, deadline: new Date(updatedCard.billDate), updatedAt: new Date() }
          : goal
      );
      setCreditGoals(updatedCreditGoals);
      await saveCreditGoals(updatedCreditGoals);
    }
  };

  const deleteCreditCard = async (cardId: string) => {
    const updatedCards = creditCards.filter(card => card.id !== cardId);
    setCreditCards(updatedCards);
    await saveCreditCards(updatedCards);

    // Delete corresponding credit goal
    const updatedCreditGoals = creditGoals.filter(goal => goal.creditCardId !== cardId);
    setCreditGoals(updatedCreditGoals);
    await saveCreditGoals(updatedCreditGoals);
  };

  const payCreditCardBill = async (cardId: string, amount: number, sourceId: string, sourceType: 'fund' | 'savings') => {
    if (!user) return;

    // Update credit card balance
    const updatedCards = creditCards.map(card =>
      card.id === cardId
        ? { ...card, balance: Math.max(0, card.balance - amount), updatedAt: new Date() }
        : card
    );
    setCreditCards(updatedCards);
    await saveCreditCards(updatedCards);

    // Update source balance
    if (sourceType === 'fund') {
      const updatedFunds = funds.map(fund =>
        fund.id === sourceId
          ? { ...fund, balance: fund.balance - amount, updatedAt: new Date() }
          : fund
      );
      setFunds(updatedFunds);
      await saveFunds(updatedFunds);
    } else {
      if (financialData) {
        await updateFinancialData({
          savingBalance: financialData.savingBalance - amount,
        });
      }
    }

    // Add transaction
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      userId: user.id,
      title: `Credit Card Payment`,
      category: 'Bills',
      amount: -amount,
      type: 'expense',
      fundId: sourceType === 'fund' ? sourceId : undefined,
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions);
    await saveTransactions(updatedTransactions);

    // Update credit goal
    const updatedCreditGoals = creditGoals.map(goal =>
      goal.creditCardId === cardId
        ? { ...goal, currentAmount: goal.currentAmount + amount, updatedAt: new Date() }
        : goal
    );
    setCreditGoals(updatedCreditGoals);
    await saveCreditGoals(updatedCreditGoals);
  };

  // Goals methods (existing)
  const addSavingsGoal = async (goalData: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    const newGoal: SavingsGoal = {
      ...goalData,
      id: Date.now().toString(),
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedGoals = [...savingsGoals, newGoal];
    setSavingsGoals(updatedGoals);
    await saveSavingsGoals(updatedGoals);
  };

  const updateSavingsGoal = async (goalId: string, updates: Partial<SavingsGoal>) => {
    const updatedGoals = savingsGoals.map(goal =>
      goal.id === goalId
        ? { ...goal, ...updates, updatedAt: new Date() }
        : goal
    );
    setSavingsGoals(updatedGoals);
    await saveSavingsGoals(updatedGoals);
  };

  const deleteSavingsGoal = async (goalId: string) => {
    const goalToDelete = savingsGoals.find(g => g.id === goalId);
    if (!goalToDelete || !financialData) return;

    // Do NOT add back to savingBalance; just remove the goal
    const updatedGoals = savingsGoals.filter(goal => goal.id !== goalId);
    setSavingsGoals(updatedGoals);
    await saveSavingsGoals(updatedGoals);
  };

  const addMoneyToGoal = async (goalId: string, amount: number) => {
    const goal = savingsGoals.find(g => g.id === goalId);
    if (!goal || !financialData) return;

    const totalAllocated = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const unallocatedSavings = financialData.savingBalance - totalAllocated;
    const remainingToGoal = goal.targetAmount - goal.currentAmount;
    if (remainingToGoal <= 0) {
      throw new Error('Goal already reached');
    }
    const cappedAmount = Math.min(amount, remainingToGoal);
    if (cappedAmount > unallocatedSavings) {
      throw new Error('Insufficient unallocated savings');
    }
    await updateSavingsGoal(goalId, {
      currentAmount: goal.currentAmount + cappedAmount
    });
  };

  const markGoalCompleted = async (goalId: string) => {
    await updateSavingsGoal(goalId, { completed: true });
  };

  const deallocateFromGoal = async (goalId: string, amount: number) => {
    const goal = savingsGoals.find(g => g.id === goalId);
    if (!goal || !financialData) return;
    if (amount <= 0 || amount > goal.currentAmount) {
      throw new Error('Invalid deallocation amount');
    }
    await updateSavingsGoal(goalId, {
      currentAmount: goal.currentAmount - amount
    });
    // Do NOT add back to savingBalance
  };

  // Credit goals methods
  const addCreditGoal = async (goalData: Omit<CreditGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    const newGoal: CreditGoal = {
      ...goalData,
      id: Date.now().toString(),
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedGoals = [...creditGoals, newGoal];
    setCreditGoals(updatedGoals);
    await saveCreditGoals(updatedGoals);
  };

  const updateCreditGoal = async (goalId: string, updates: Partial<CreditGoal>) => {
    const updatedGoals = creditGoals.map(goal =>
      goal.id === goalId
        ? { ...goal, ...updates, updatedAt: new Date() }
        : goal
    );
    setCreditGoals(updatedGoals);
    await saveCreditGoals(updatedGoals);
  };

  const deleteCreditGoal = async (goalId: string) => {
    const updatedGoals = creditGoals.filter(goal => goal.id !== goalId);
    setCreditGoals(updatedGoals);
    await saveCreditGoals(updatedGoals);
  };

  // Transaction methods
  const addTransaction = async (
    transactionData: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; needsConfirmation?: boolean; overage?: number; availableSources?: Array<{id: string, name: string, balance: number, type: 'fund' | 'savings'}> }> => {
    if (!user) return { success: false };
    
    const amount = Math.abs(transactionData.amount);
    
    if (transactionData.type === 'expense') {
      if (transactionData.fundId) {
        // Fund transaction
        const fund = funds.find(f => f.id === transactionData.fundId);
        if (!fund) return { success: false };
        
        if (amount > fund.balance) {
          // Get available sources for overage
          const availableSources = [
            ...funds.filter(f => f.id !== transactionData.fundId && f.balance > 0).map(f => ({
              id: f.id,
              name: f.name,
              balance: f.balance,
              type: 'fund' as const
            })),
            ...(financialData && financialData.savingBalance > 0 ? [{
              id: 'savings',
              name: 'Savings',
              balance: financialData.savingBalance,
              type: 'savings' as const
            }] : [])
          ];
          
          const overage = amount - fund.balance;
          return { success: false, needsConfirmation: true, overage, availableSources };
        }
      } else if (transactionData.creditCardId) {
        // Credit card transaction - always allowed, just increases balance
      }
    }
    
    return await processTransaction(transactionData);
  };

  const processTransaction = async (
    transactionData: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean }> => {
    if (!user) return { success: false };

    const newTransaction: Transaction = {
      ...transactionData,
      id: Date.now().toString(),
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions);
    await saveTransactions(updatedTransactions);

    const amount = Math.abs(newTransaction.amount);

    // Update balances based on transaction
    if (newTransaction.type === 'expense') {
      if (newTransaction.fundId) {
        // Deduct from fund
        const updatedFunds = funds.map(fund =>
          fund.id === newTransaction.fundId
            ? { ...fund, balance: fund.balance - amount, updatedAt: new Date() }
            : fund
        );
        setFunds(updatedFunds);
        await saveFunds(updatedFunds);
      } else if (newTransaction.creditCardId) {
        // Add to credit card balance
        const updatedCards = creditCards.map(card =>
          card.id === newTransaction.creditCardId
            ? { ...card, balance: card.balance + amount, updatedAt: new Date() }
            : card
        );
        setCreditCards(updatedCards);
        await saveCreditCards(updatedCards);

        // Update credit goal
        const updatedCreditGoals = creditGoals.map(goal =>
          goal.creditCardId === newTransaction.creditCardId
            ? { ...goal, targetAmount: goal.targetAmount + amount, updatedAt: new Date() }
            : goal
        );
        setCreditGoals(updatedCreditGoals);
        await saveCreditGoals(updatedCreditGoals);
      }
    } else {
      // Income transaction
      if (newTransaction.fundId) {
        // Add to fund
        const updatedFunds = funds.map(fund =>
          fund.id === newTransaction.fundId
            ? { ...fund, balance: fund.balance + amount, updatedAt: new Date() }
            : fund
        );
        setFunds(updatedFunds);
        await saveFunds(updatedFunds);
      } else if (!newTransaction.fundId && !newTransaction.creditCardId) {
        // Add to savings
        if (financialData) {
          await updateFinancialData({
            savingBalance: financialData.savingBalance + amount,
          });
        }
      }
    }

    return { success: true };
  };

  const updateTransaction = async (transactionId: string, updates: Partial<Transaction>) => {
    const originalTransaction = transactions.find(t => t.id === transactionId);
    if (!originalTransaction) return;

    // Reverse original transaction effects
    const originalAmount = Math.abs(originalTransaction.amount);
    if (originalTransaction.type === 'expense') {
      if (originalTransaction.fundId) {
        const updatedFunds = funds.map(fund =>
          fund.id === originalTransaction.fundId
            ? { ...fund, balance: fund.balance + originalAmount, updatedAt: new Date() }
            : fund
        );
        setFunds(updatedFunds);
        await saveFunds(updatedFunds);
      } else if (originalTransaction.creditCardId) {
        const updatedCards = creditCards.map(card =>
          card.id === originalTransaction.creditCardId
            ? { ...card, balance: card.balance - originalAmount, updatedAt: new Date() }
            : card
        );
        setCreditCards(updatedCards);
        await saveCreditCards(updatedCards);
      }
    } else {
      if (originalTransaction.fundId) {
        const updatedFunds = funds.map(fund =>
          fund.id === originalTransaction.fundId
            ? { ...fund, balance: fund.balance - originalAmount, updatedAt: new Date() }
            : fund
        );
        setFunds(updatedFunds);
        await saveFunds(updatedFunds);
      } else if (!originalTransaction.fundId && !originalTransaction.creditCardId && financialData) {
        await updateFinancialData({
          savingBalance: financialData.savingBalance - originalAmount,
        });
      }
    }

    // Update transaction
    const updatedTransactions = transactions.map(txn =>
      txn.id === transactionId
        ? { ...txn, ...updates, updatedAt: new Date() }
        : txn
    );
    setTransactions(updatedTransactions);
    await saveTransactions(updatedTransactions);

    // Apply new transaction effects
    const updatedTransaction = updatedTransactions.find(t => t.id === transactionId);
    if (updatedTransaction) {
      const newAmount = Math.abs(updatedTransaction.amount);
      
      if (updatedTransaction.type === 'expense') {
        if (updatedTransaction.fundId) {
          const updatedFunds = funds.map(fund =>
            fund.id === updatedTransaction.fundId
              ? { ...fund, balance: fund.balance - newAmount, updatedAt: new Date() }
              : fund
          );
          setFunds(updatedFunds);
          await saveFunds(updatedFunds);
        } else if (updatedTransaction.creditCardId) {
          const updatedCards = creditCards.map(card =>
            card.id === updatedTransaction.creditCardId
              ? { ...card, balance: card.balance + newAmount, updatedAt: new Date() }
              : card
          );
          setCreditCards(updatedCards);
          await saveCreditCards(updatedCards);
        }
      } else {
        if (updatedTransaction.fundId) {
          const updatedFunds = funds.map(fund =>
            fund.id === updatedTransaction.fundId
              ? { ...fund, balance: fund.balance + newAmount, updatedAt: new Date() }
              : fund
          );
          setFunds(updatedFunds);
          await saveFunds(updatedFunds);
        } else if (!updatedTransaction.fundId && !updatedTransaction.creditCardId && financialData) {
          await updateFinancialData({
            savingBalance: financialData.savingBalance + newAmount,
          });
        }
      }
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    const updatedTransactions = transactions.filter(txn => txn.id !== transactionId);
    setTransactions(updatedTransactions);
    await saveTransactions(updatedTransactions);

    // Reverse the transaction's effect on balances
    const amount = Math.abs(transaction.amount);
    if (transaction.type === 'expense') {
      if (transaction.fundId) {
        const updatedFunds = funds.map(fund =>
          fund.id === transaction.fundId
            ? { ...fund, balance: fund.balance + amount, updatedAt: new Date() }
            : fund
        );
        setFunds(updatedFunds);
        await saveFunds(updatedFunds);
      } else if (transaction.creditCardId) {
        const updatedCards = creditCards.map(card =>
          card.id === transaction.creditCardId
            ? { ...card, balance: card.balance - amount, updatedAt: new Date() }
            : card
        );
        setCreditCards(updatedCards);
        await saveCreditCards(updatedCards);
      }
    } else {
      if (transaction.fundId) {
        const updatedFunds = funds.map(fund =>
          fund.id === transaction.fundId
            ? { ...fund, balance: fund.balance - amount, updatedAt: new Date() }
            : fund
        );
        setFunds(updatedFunds);
        await saveFunds(updatedFunds);
      } else if (!transaction.fundId && !transaction.creditCardId && financialData) {
        await updateFinancialData({
          savingBalance: financialData.savingBalance - amount,
        });
      }
    }
  };

  // Analytics methods
  const getMonthlySpending = (fundId?: string) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return transactions
      .filter(txn => 
        txn.type === 'expense' && 
        txn.date >= startOfMonth &&
        (!fundId || txn.fundId === fundId) &&
        !(txn.category === 'Bills' && txn.title === 'Credit Card Payment')
      )
      .reduce((total, txn) => total + Math.abs(txn.amount), 0);
  };

  const getCategorySpending = (fundId?: string) => {
    const expenseTransactions = transactions.filter(txn => 
      txn.type === 'expense' && 
      (!fundId || txn.fundId === fundId) &&
      !(txn.category === 'Bills' && txn.title === 'Credit Card Payment')
    );
    const totalSpent = expenseTransactions.reduce((total, txn) => total + Math.abs(txn.amount), 0);
    const categoryTotals = expenseTransactions.reduce((acc, txn) => {
      const category = txn.category;
      acc[category] = (acc[category] || 0) + Math.abs(txn.amount);
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
    }));
  };

  const getSavingsRate = () => {
    if (!financialData?.monthlyIncome) return 0;
    const monthlySpending = getMonthlySpending();
    const monthlySavings = financialData.monthlyIncome - monthlySpending;
    return (monthlySavings / financialData.monthlyIncome) * 100;
  };

  const getTotalBalance = () => {
    const fundsTotal = funds.reduce((sum, fund) => sum + fund.balance, 0);
    const savingsTotal = financialData?.savingBalance || 0;
    return fundsTotal + savingsTotal;
  };

  const getTotalMonthlyIncome = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return transactions
      .filter(txn => txn.type === 'income' && txn.date >= startOfMonth)
      .reduce((total, txn) => total + txn.amount, 0);
  };

  const getTotalMonthlySpending = () => {
    return getMonthlySpending();
  };

  const value: DataContextType & { clearData: () => void } = {
    financialData,
    funds,
    creditCards,
    savingsGoals,
    creditGoals,
    transactions,
    categories,
    isLoading,
    updateFinancialData,
    addFund,
    updateFund,
    deleteFund,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    payCreditCardBill,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addMoneyToGoal,
    markGoalCompleted,
    deallocateFromGoal,
    addCreditGoal,
    updateCreditGoal,
    deleteCreditGoal,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getMonthlySpending,
    getCategorySpending,
    getSavingsRate,
    getTotalBalance,
    getTotalMonthlyIncome,
    getTotalMonthlySpending,
    setFunds,
    saveFunds,
    clearData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}