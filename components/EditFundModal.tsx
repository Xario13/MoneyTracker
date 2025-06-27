import React, { useState, useEffect } from 'react';
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
import { X, Wallet, Banknote, Coins, Gem, Trash2 } from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface EditFundModalProps {
  visible: boolean;
  fund: {
    id: string;
    name: string;
    balance: number;
    emoji?: string;
  } | null;
  onClose: () => void;
}

const fundIcons = [
  { icon: Wallet, name: 'Wallet', emoji: '💰' },
  { icon: Banknote, name: 'Bank', emoji: '🏦' },
  { icon: Coins, name: 'Coins', emoji: '🪙' },
  { icon: Gem, name: 'Gem', emoji: '💎' },
];

export default function EditFundModal({ visible, fund, onClose }: EditFundModalProps) {
  const { updateFund, deleteFund } = useData();
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fund) {
      setName(fund.name);
      const iconIndex = fundIcons.findIndex(icon => icon.emoji === fund.emoji);
      setSelectedIcon(iconIndex >= 0 ? iconIndex : 0);
    }
  }, [fund]);

  if (!fund) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a fund name');
      return;
    }
    setLoading(true);
    try {
      await updateFund(fund.id, {
        ...fund,
        name: name.trim(),
        emoji: fundIcons[selectedIcon].emoji,
      });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to update fund');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Fund',
      'Are you sure you want to delete this fund? The balance will be transferred to your savings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteFund(fund.id);
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete fund');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#232323', borderRadius: 16, padding: 24, width: 320, maxWidth: '90%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'Inter-SemiBold' }}>Edit Fund</Text>
            <TouchableOpacity onPress={onClose}>
              <X color="#ffffff" size={24} />
            </TouchableOpacity>
          </View>
          <Text style={{ color: '#aaa', fontSize: 14, marginBottom: 8 }}>Fund Name</Text>
          <TextInput
            style={{ backgroundColor: '#181818', color: '#fff', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20 }}
            value={name}
            onChangeText={setName}
            placeholder="Enter fund name"
            placeholderTextColor="#666"
            maxLength={30}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 }}>
            <TouchableOpacity
              onPress={onClose}
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: '#181818',
                borderRadius: 8,
                paddingVertical: 12,
                marginRight: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#333',
              }}
            >
              <Text style={{ color: '#aaa', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: '#c4ff00',
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#181818', fontSize: 16, fontFamily: 'Inter-SemiBold' }}>Save</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleDelete} disabled={loading} style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginTop: 8 }}>
            <Trash2 color="#ff4d4f" size={20} />
            <Text style={{ color: '#ff4d4f', fontSize: 16, marginLeft: 8 }}>Delete Fund</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  gradientBackground: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    padding: 4,
  },
  modalForm: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
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
  iconGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  iconButton: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(26,26,26,0.8)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  iconButtonSelected: {
    backgroundColor: '#c4ff00',
    borderColor: '#c4ff00',
  },
  textInput: {
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
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#404040',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
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
  },
  saveButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff4d4f',
    backgroundColor: 'rgba(255,77,79,0.08)',
  },
  deleteButtonText: {
    color: '#ff4d4f',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
}); 