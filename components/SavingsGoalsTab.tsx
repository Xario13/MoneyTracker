import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Plus, Target, Trash2, CreditCard as Edit3, Pencil, X as LucideX, Home, Car, Plane, Gem, GraduationCap, Wallet, ShoppingBag, Gamepad2, Smartphone } from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import PieChartComponent from '@/components/PieChart';
import GoalCompletionModal from '@/components/GoalCompletionModal';
import AddSavingsGoalModal from '@/components/AddSavingsGoalModal';
import AddMoneyToGoalModal from '@/components/AddMoneyToGoalModal';
import CustomAlert from '@/components/CustomAlert';

// Add a mapping from icon name to component
const goalIconMap: { [key: string]: any } = {
  Target,
  Home,
  Car,
  Plane,
  Gem,
  GraduationCap,
  Wallet,
  ShoppingBag,
  Gamepad2,
  Smartphone,
};

export default function SavingsGoalsTab() {
  const { savingsGoals, financialData, addMoneyToGoal, deleteSavingsGoal, markGoalCompleted, deallocateFromGoal } = useData();
  const [addGoalModalVisible, setAddGoalModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [addMoneyModalVisible, setAddMoneyModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [deallocateModalVisible, setDeallocateModalVisible] = useState(false);
  const [deallocateGoal, setDeallocateGoal] = useState<any>(null);
  const [deallocateAmount, setDeallocateAmount] = useState('');
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [completedGoal, setCompletedGoal] = useState<any>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>({});
  const [achievedGoalId, setAchievedGoalId] = useState<string | null>(null);

  const showAlert = (title: string, message: string, type: any = 'info', buttons: any[] = [{ text: 'OK' }]) => {
    setAlertConfig({ title, message, type, buttons });
    setAlertVisible(true);
  };

  const handleAddMoney = async (amount: number) => {
    if (!selectedGoal) return;
    try {
      await addMoneyToGoal(selectedGoal.id, amount);
      setSelectedGoal(null);
      setAddMoneyModalVisible(false);
    } catch (error) {
      throw error;
    }
  };

  const handleOpenAddMoneyModal = (goal: any) => {
    setSelectedGoal(goal);
    setAddMoneyModalVisible(true);
  };

  const handleDeleteGoal = (goalId: string) => {
    const goal = savingsGoals.find(g => g.id === goalId);
    if (!goal) return;

    showAlert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.title}"? Any allocated money will be returned to your savings.`,
      'warning',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSavingsGoal(goalId);
              showAlert('Success', 'Goal deleted successfully', 'success');
            } catch (error) {
              showAlert('Error', 'Failed to delete goal', 'error');
            }
          },
        },
      ]
    );
  };

  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setAddGoalModalVisible(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalSaved = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTarget = savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalSavings = financialData?.savingBalance || 0;
  const unallocatedSavings = totalSavings - totalSaved;

  // Prepare pie chart data
  const pieChartData = [
    ...savingsGoals.filter(g => !g.completed).map((goal, index) => ({
      id: goal.id,
      value: goal.currentAmount,
      color: goal.color,
      label: goal.title,
    })),
    ...(unallocatedSavings > 0 ? [{
      id: 'unallocated',
      value: unallocatedSavings,
      color: '#666666',
      label: 'Unallocated',
    }] : [])
  ].filter(item => item.value > 0);

  const getDaysRemaining = (deadline: Date) => {
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
  };

  const handleMarkAchieved = async (goal: any) => {
    await markGoalCompleted(goal.id);
    setCompletedGoal(goal);
    setCompletionModalVisible(true);
    setAchievedGoalId(goal.id);
  };

  const handleOpenDeallocateModal = (goal: any) => {
    setDeallocateGoal(goal);
    setDeallocateAmount('');
    setDeallocateModalVisible(true);
  };

  const handleDeallocate = async () => {
    if (!deallocateGoal) return;
    const amount = parseFloat(deallocateAmount);
    if (isNaN(amount) || amount <= 0) {
      showAlert('Error', 'Please enter a valid amount', 'error');
      return;
    }
    if (amount > deallocateGoal.currentAmount) {
      showAlert('Error', 'Cannot deallocate more than allocated', 'error');
      return;
    }
    try {
      await deallocateFromGoal(deallocateGoal.id, amount);
      showAlert('Success', `Deallocated $${amount.toFixed(2)} from goal`, 'success');
      setDeallocateModalVisible(false);
      setDeallocateGoal(null);
      setDeallocateAmount('');
    } catch (error) {
      showAlert('Error', 'Failed to deallocate funds', 'error');
    }
  };

  // Only filter out completed goals from the visible list
  const visibleGoals = savingsGoals.filter(g => !g.completed);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Savings Goals</Text>
        <Text style={styles.subtitle}>Track and manage your financial goals</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Saved</Text>
          <Text style={styles.summaryAmount} numberOfLines={1} ellipsizeMode="middle" adjustsFontSizeToFit allowFontScaling>{formatCurrency(totalSaved)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Target</Text>
          <Text style={styles.summaryAmount} numberOfLines={1} ellipsizeMode="middle" adjustsFontSizeToFit allowFontScaling>{formatCurrency(totalTarget)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Unallocated</Text>
          <Text style={styles.summaryAmount} numberOfLines={1} ellipsizeMode="middle" adjustsFontSizeToFit allowFontScaling>{formatCurrency(unallocatedSavings)}</Text>
        </View>
      </View>

      {/* Pie Chart with Legend Side by Side */}
      {pieChartData.length > 0 && (
        <View style={styles.chartRow}>
          <View style={styles.pieChartWrapper}>
            <PieChartComponent data={pieChartData} />
          </View>
          <View style={styles.verticalLegend}>
            <Text style={styles.chartTitle}>Savings Distribution</Text>
            {pieChartData.map((item) => (
              <View key={item.id} style={styles.legendItemVertical}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendTextVertical} numberOfLines={1}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Add Goal Button */}
      <TouchableOpacity
        style={styles.addGoalCategoryIcon}
        onPress={() => {
          setEditingGoal(null);
          setAddGoalModalVisible(true);
        }}
      >
        <View style={styles.categoryIconCircle}>
          <Plus color="#c4ff00" size={22} />
        </View>
        <Text style={styles.addGoalCategoryText}>Add Savings Goal</Text>
      </TouchableOpacity>

      {/* Goals List */}
      {visibleGoals.length > 0 ? (
        <View style={styles.goalsSection}>
          <Text style={styles.sectionTitle}>Your Goals</Text>
          {visibleGoals.map((goal) => {
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const daysRemaining = getDaysRemaining(new Date(goal.deadline));
            const isGoalReached = goal.currentAmount >= goal.targetAmount;
            const isCompleted = !!goal.completed;
            const remainingToGoal = Math.max(goal.targetAmount - goal.currentAmount, 0);

            return (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={styles.goalInfo}>
                    <View style={[styles.goalIcon, { backgroundColor: goal.color }]}>
                      {goal.icon && goalIconMap[goal.icon] ? (
                        React.createElement(goalIconMap[goal.icon], { color: '#fff', size: 22 })
                      ) : (
                        <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                      )}
                    </View>
                    <View style={styles.goalDetails}>
                      <Text style={styles.goalTitle}>{goal.title}</Text>
                      <Text style={styles.goalAmount}>
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.goalActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditGoal(goal)}
                    >
                      <Pencil color="#c4ff00" size={16} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteGoal(goal.id)}
                    >
                      <Trash2 color="#f87171" size={16} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.goalProgress}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${Math.min(progress, 100)}%`,
                          backgroundColor: isCompleted ? '#4ade80' : goal.color
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {Math.round(progress)}% complete
                  </Text>
                </View>

                <View style={styles.goalFooter}>
                  {!isGoalReached && (
                    <Text style={styles.daysRemaining}>
                      {`${daysRemaining} days remaining`}
                    </Text>
                  )}
                  {isGoalReached && !isCompleted && (
                    <TouchableOpacity
                      style={styles.achieveButton}
                      onPress={() => handleMarkAchieved(goal)}
                    >
                      <Text style={styles.achieveButtonText}>Achieve</Text>
                    </TouchableOpacity>
                  )}
                  {isCompleted && (
                    <Text style={styles.completedText}>✅ Achieved</Text>
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {!isGoalReached && (
                      <TouchableOpacity
                        style={styles.addMoneyButton}
                        onPress={() => handleOpenAddMoneyModal(goal)}
                      >
                        <Plus color="#c4ff00" size={16} />
                        <Text style={styles.addMoneyText}>Add Money</Text>
                      </TouchableOpacity>
                    )}
                    {goal.currentAmount > 0 && (
                      <TouchableOpacity
                        style={styles.deallocateButton}
                        onPress={() => handleOpenDeallocateModal(goal)}
                      >
                        <Text style={styles.deallocateText}>Deallocate</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Target color="#666666" size={48} />
          <Text style={styles.emptyTitle}>No Savings Goals Yet</Text>
          <Text style={styles.emptyText}>
            Create your first savings goal to start organizing your money
          </Text>
        </View>
      )}

      <View style={styles.bottomSpacing} />

      <AddSavingsGoalModal
        visible={addGoalModalVisible}
        onClose={() => {
          setAddGoalModalVisible(false);
          setEditingGoal(null);
        }}
        editingGoal={editingGoal}
      />

      <AddMoneyToGoalModal
        visible={addMoneyModalVisible}
        onClose={() => {
          setAddMoneyModalVisible(false);
          setSelectedGoal(null);
        }}
        goal={selectedGoal}
        onAddMoney={handleAddMoney}
        availableAmount={Math.min(unallocatedSavings, selectedGoal ? selectedGoal.targetAmount - selectedGoal.currentAmount : unallocatedSavings)}
      />

      <GoalCompletionModal
        visible={completionModalVisible}
        goalTitle={completedGoal?.title || ''}
        goalAmount={completedGoal?.targetAmount || 0}
        onClose={() => {
          setCompletionModalVisible(false);
          setCompletedGoal(null);
          setAchievedGoalId(null);
        }}
      />

      {/* Deallocate Modal - match AddMoneyToGoalModal UI */}
      {deallocateModalVisible && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={deallocateModalVisible}
          onRequestClose={() => setDeallocateModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Deallocate Funds</Text>
                <TouchableOpacity onPress={() => setDeallocateModalVisible(false)} style={styles.closeButton}>
                  <LucideX color="#fff" size={24} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalForm}>
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Amount to Deallocate</Text>
                  <View style={styles.amountContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={deallocateAmount}
                      onChangeText={setDeallocateAmount}
                      placeholder="0.00"
                      placeholderTextColor="#666666"
                      keyboardType="decimal-pad"
                      autoFocus
                    />
                  </View>
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setDeallocateModalVisible(false)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleDeallocate}>
                    <Text style={styles.saveButtonText}>Deallocate</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.availableText}>Allocated: {formatCurrency(deallocateGoal?.currentAmount || 0)}</Text>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#999999',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    flex: 1,
  },
  summaryLabel: {
    color: '#999999',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  summaryAmount: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 16,
  },
  pieChartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  verticalLegend: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 12,
  },
  legendItemVertical: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  legendTextVertical: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
    flexShrink: 1,
  },
  addGoalCategoryIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  categoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#232323',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c4ff00',
  },
  addGoalCategoryText: {
    color: '#c4ff00',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 12,
  },
  goalsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  goalCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalEmoji: {
    fontSize: 20,
  },
  goalDetails: {
    flex: 1,
  },
  goalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  goalAmount: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  goalActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  goalProgress: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#404040',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    color: '#999999',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  daysRemaining: {
    color: '#c4ff00',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  addMoneyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addMoneyText: {
    color: '#c4ff00',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  deallocateButton: {
    backgroundColor: '#f87171',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  deallocateText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#999999',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 40,
  },
  bottomSpacing: {
    height: 100,
  },
  chartTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  achieveButton: {
    backgroundColor: '#c4ff00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  achieveButtonText: {
    color: '#1a1a1a',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  completedText: {
    color: '#4ade80',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  deallocateModalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  deallocateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deallocateInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  deallocateActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cancelButton: {
    backgroundColor: '#f87171',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  saveButton: {
    backgroundColor: '#4ade80',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  availableText: {
    color: '#999999',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  modalSubtitle: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  currencySymbol: {
    color: '#999999',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginRight: 8,
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 8,
  },
  modalForm: {
    width: '100%',
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#999999',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
});