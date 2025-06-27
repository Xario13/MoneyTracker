export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserFinancialData {
  userId: string;
  totalBalance: number;
  savingBalance: number;
  monthlyIncome?: number;
  incomeStartDate?: Date;
  monthlySpendingLimit: number;
  hasRecurringIncome: boolean;
  updatedAt: Date;
  initialFunds?: Array<{
    name: string;
    balance: number;
    emoji: string;
  }>;
}

export interface Fund {
  id: string;
  userId: string;
  name: string;
  balance: number;
  color: string;
  emoji: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditCard {
  id: string;
  userId: string;
  name: string;
  balance: number; // Outstanding amount
  limit?: number;
  billDate: Date;
  color: string;
  type?: 'platinum' | 'gold' | 'black' | 'blue' | 'green' | 'purple' | 'red' | 'orange';
  emoji?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  emoji: string;
  color: string;
  deadline: Date;
  autoAllocate?: boolean;
  monthlyAllocation?: number;
  createdAt: Date;
  updatedAt: Date;
  completed?: boolean;
  icon?: string;
}

export interface CreditGoal {
  id: string;
  userId: string;
  creditCardId: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  title: string;
  notes?: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  fundId?: string; // For fund transactions
  creditCardId?: string; // For credit card transactions
  date: Date;
  photo?: string; // Legacy field for backward compatibility
  photos?: string[]; // New field for multiple photos
  createdAt: Date;
  updatedAt: Date;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  type: 'income' | 'expense';
}