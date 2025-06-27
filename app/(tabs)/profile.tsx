import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Shield, CircleHelp as HelpCircle, LogOut, ChevronRight, User, Smartphone, Download, Target, Calendar, TrendingUp } from 'lucide-react-native';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import CustomAlert from '@/components/CustomAlert';
import HelpSupportModal from '@/components/HelpSupportModal';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { financialData, savingsGoals, transactions } = useData();
  const navigation = useNavigation();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>({});
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  const showAlert = (title: string, message: string, type: any = 'info', buttons: any[] = [{ text: 'OK' }]) => {
    setAlertConfig({ title, message, type, buttons });
    setAlertVisible(true);
  };

  const menuItems = [
    {
      id: '1',
      title: 'Account Settings',
      icon: User,
      hasArrow: true,
      color: '#c4ff00',
      onPress: () => router.push('/AccountSettings')
    },
    {
      id: '2',
      title: 'Security',
      icon: Shield,
      hasArrow: true,
      color: '#ff6b6b',
      onPress: () => showAlert('Coming Soon', 'Security settings will be available in the next update', 'info')
    },
    {
      id: '3',
      title: 'Export Data',
      icon: Download,
      hasArrow: true,
      color: '#96ceb4',
      onPress: handleExportData
    },
    {
      id: '4',
      title: 'Help & Support',
      icon: HelpCircle,
      hasArrow: true,
      color: '#ffeaa7',
      onPress: () => setHelpModalVisible(true)
    }
  ];

  const goalsAchieved = savingsGoals.filter(g => g.currentAmount >= g.targetAmount).length;
  const currentStreak = 7; // Days of consistent tracking
  const monthsActive = 3; // Months using the app

  const stats = [
    { label: 'Goals Achieved', value: goalsAchieved.toString(), color: '#4ade80', icon: Target },
    { label: 'Day Streak', value: currentStreak.toString(), color: '#c4ff00', icon: Calendar },
    { label: 'Months Active', value: monthsActive.toString(), color: '#45b7d1', icon: TrendingUp }
  ];

  function handleExportData() {
    try {
      const exportData = {
        user: {
          name: user?.name,
          email: user?.email,
          exportDate: new Date().toISOString()
        },
        financialData,
        transactions: transactions.map(t => ({
          ...t,
          date: t.date.toISOString(),
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString()
        })),
        savingsGoals: savingsGoals.map(g => ({
          ...g,
          deadline: g.deadline.toISOString(),
          createdAt: g.createdAt.toISOString(),
          updatedAt: g.updatedAt.toISOString()
        }))
      };

      // Create CSV content
      const csvContent = generateCSV(exportData);
      
      // In a real app, this would trigger a download
      showAlert(
        'Export Ready',
        'Your data has been prepared for export. In a production app, this would download a CSV file with all your financial data.',
        'success'
      );
    } catch (error) {
      showAlert('Export Failed', 'Failed to export data. Please try again.', 'error');
    }
  }

  function generateCSV(data: any): string {
    let csv = 'Type,Date,Title,Category,Amount,Description\n';
    
    data.transactions.forEach((transaction: any) => {
      csv += `${transaction.type},${transaction.date},${transaction.title},${transaction.category},${transaction.amount},Transaction\n`;
    });

    data.savingsGoals.forEach((goal: any) => {
      csv += `goal,${goal.deadline},${goal.title},Savings Goal,${goal.targetAmount},Target: ${goal.targetAmount} Current: ${goal.currentAmount}\n`;
    });

    return csv;
  }

  const handleLogout = () => {
    showAlert(
      'Sign Out',
      'Are you sure you want to sign out?',
      'warning',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <Image 
              source={{ uri: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop' }}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
              <View style={styles.memberBadge}>
                <Smartphone color="#1a1a1a" size={12} />
                <Text style={styles.memberText}>Premium Member</Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                  <stat.icon color={stat.color} size={16} />
                </View>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Quick Settings</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Bell color="#c4ff00" size={20} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Get notified about spending limits and goals
                </Text>
              </View>
              <View style={[
                styles.toggleSwitch,
                notificationsEnabled && styles.toggleSwitchActive
              ]}>
                <TouchableOpacity
                  style={[
                    styles.toggleThumb,
                    notificationsEnabled && styles.toggleThumbActive
                  ]}
                  onPress={() => setNotificationsEnabled(!notificationsEnabled)}
                />
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Shield color="#4ecdc4" size={20} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Biometric Authentication</Text>
                <Text style={styles.settingDescription}>
                  Use Face ID or fingerprint to secure your app
                </Text>
              </View>
              <View style={[
                styles.toggleSwitch,
                biometricEnabled && styles.toggleSwitchActive
              ]}>
                <TouchableOpacity
                  style={[
                    styles.toggleThumb,
                    biometricEnabled && styles.toggleThumbActive
                  ]}
                  onPress={() => setBiometricEnabled(!biometricEnabled)}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>More Options</Text>
          
          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <View key={item.id}>
                <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
                  <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                    <item.icon color={item.color} size={20} />
                  </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  {item.hasArrow && (
                    <ChevronRight color="#666666" size={20} />
                  )}
                </TouchableOpacity>
                {index < menuItems.length - 1 && <View style={styles.separator} />}
              </View>
            ))}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>SpendTracker v1.0.0</Text>
            <Text style={styles.infoDescription}>
              Your personal finance companion for smarter spending
            </Text>
            <View style={styles.infoLinks}>
              <TouchableOpacity style={styles.infoLink}>
                <Text style={styles.infoLinkText}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={styles.infoDivider}>•</Text>
              <TouchableOpacity style={styles.infoLink}>
                <Text style={styles.infoLinkText}>Terms of Service</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut color="#f87171" size={20} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <HelpSupportModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontFamily: 'Inter-Bold',
  },
  profileSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  profileCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  userEmail: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#c4ff00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  memberText: {
    color: '#1a1a1a',
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#999999',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  settingsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  settingCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  settingDescription: {
    color: '#999999',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
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
  separator: {
    height: 1,
    backgroundColor: '#404040',
    marginVertical: 16,
  },
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  menuCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  infoTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  infoDescription: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  infoLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLink: {
    paddingHorizontal: 8,
  },
  infoLinkText: {
    color: '#c4ff00',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  infoDivider: {
    color: '#666666',
    fontSize: 12,
    marginHorizontal: 8,
  },
  logoutSection: {
    paddingHorizontal: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f87171',
  },
  logoutText: {
    color: '#f87171',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 100,
  },
});