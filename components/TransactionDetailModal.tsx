import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
} from 'react-native';
import { X, Edit2, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Transaction } from '@/types/user';
import EditTransactionModal from './EditTransactionModal';
import CustomAlert from './CustomAlert';

const { width, height } = Dimensions.get('window');

interface TransactionDetailModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
}

export default function TransactionDetailModal({
  visible,
  transaction,
  onClose,
  onEdit,
  onDelete,
}: TransactionDetailModalProps) {
  const [isPhotoExpanded, setIsPhotoExpanded] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>({});
  const [imagePopupVisible, setImagePopupVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!transaction) return null;

  // Convert single photo to array for consistency, supporting both legacy and new formats
  const photos = transaction.photos || (transaction.photo ? [transaction.photo] : []);

  const showAlert = (title: string, message: string, type: any = 'info', buttons: any[] = [{ text: 'OK' }]) => {
    setAlertConfig({ title, message, type, buttons });
    setAlertVisible(true);
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
      month: 'long',
      day: 'numeric',
    });
  };

  const handleEdit = () => {
    setEditModalVisible(true);
  };

  const handleTransactionSave = async (updatedTransaction: Transaction) => {
    try {
      if (onEdit) {
        await onEdit(updatedTransaction);
        showAlert('Success', 'Transaction updated successfully', 'success');
        setEditModalVisible(false);
      }
    } catch (error) {
      showAlert('Error', 'Failed to update transaction', 'error');
    }
  };

  const handleTransactionDelete = async (transactionId: string) => {
    try {
      if (onDelete) {
        await onDelete(transactionId);
        showAlert('Success', 'Transaction deleted successfully', 'success');
        setEditModalVisible(false);
        onClose();
      }
    } catch (error) {
      showAlert('Error', 'Failed to delete transaction', 'error');
    }
  };

  const openImagePopup = (index: number) => {
    setSelectedImageIndex(index);
    setImagePopupVisible(true);
  };

  const closeImagePopup = () => {
    setImagePopupVisible(false);
  };

  const nextImage = () => {
    if (selectedImageIndex < photos.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const previousImage = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const renderPhotoItem = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity onPress={() => openImagePopup(index)} activeOpacity={0.9}>
      <Image source={{ uri: item }} style={styles.photoItem} resizeMode="cover" />
    </TouchableOpacity>
  );

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
                  <Edit2 color="#c4ff00" size={20} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X color="#ffffff" size={24} />
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Transaction Type Badge */}
              <View style={[styles.typeBadge, { backgroundColor: transaction.type === 'income' ? '#4ade80' : '#f87171' }]}>
                <Text style={styles.typeText}>{transaction.type === 'income' ? 'Income' : 'Expense'}</Text>
              </View>

              {/* Amount */}
              <View style={styles.amountSection}>
                <Text style={styles.amountLabel}>Amount</Text>
                <Text style={[styles.amountValue, { color: transaction.type === 'income' ? '#4ade80' : '#f87171' }]}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </Text>
              </View>

              {/* Title */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>Title</Text>
                <Text style={styles.sectionValue}>{transaction.title}</Text>
              </View>

              {/* Category */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>Category</Text>
                <Text style={styles.sectionValue}>{transaction.category}</Text>
              </View>

              {/* Date */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>Date</Text>
                <Text style={styles.sectionValue}>{formatDate(new Date(transaction.date))}</Text>
              </View>

              {/* Notes */}
              {transaction.notes && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Notes</Text>
                  <Text style={styles.notesValue}>{transaction.notes}</Text>
                </View>
              )}

              {/* Photos */}
              {photos.length > 0 && (
                <View style={styles.photoSection}>
                  <Text style={styles.sectionLabel}>Photos ({photos.length})</Text>
                  <FlatList
                    data={photos}
                    renderItem={renderPhotoItem}
                    keyExtractor={(item, index) => index.toString()}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.photoList}
                    ItemSeparatorComponent={() => <View style={styles.photoSeparator} />}
                  />
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Image Popup Modal */}
      <Modal
        visible={imagePopupVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImagePopup}
      >
        <View style={styles.imagePopupOverlay}>
          <View style={styles.imagePopupHeader}>
            <Text style={styles.imagePopupTitle}>
              {selectedImageIndex + 1} of {photos.length}
            </Text>
            <TouchableOpacity onPress={closeImagePopup} style={styles.imagePopupCloseButton}>
              <X color="#ffffff" size={24} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.imagePopupContent}>
            {selectedImageIndex > 0 && (
              <TouchableOpacity onPress={previousImage} style={styles.imageNavButton}>
                <ChevronLeft color="#ffffff" size={30} />
              </TouchableOpacity>
            )}
            
            <Image 
              source={{ uri: photos[selectedImageIndex] }} 
              style={styles.expandedImage}
              resizeMode="contain"
            />
            
            {selectedImageIndex < photos.length - 1 && (
              <TouchableOpacity onPress={nextImage} style={styles.imageNavButton}>
                <ChevronRight color="#ffffff" size={30} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <EditTransactionModal
        visible={editModalVisible}
        transaction={transaction}
        onClose={() => setEditModalVisible(false)}
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
    </>
  );
}

const styles = StyleSheet.create({
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#1a1a1a',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 24,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 20,
  },
  typeText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountSection: {
    marginBottom: 24,
  },
  amountLabel: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  sectionValue: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  notesValue: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
  },
  photoSection: {
    marginTop: 10,
  },
  photoList: {
    paddingVertical: 8,
  },
  photoItem: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  photoSeparator: {
    width: 12,
  },
  imagePopupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  imagePopupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  imagePopupTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  imagePopupCloseButton: {
    padding: 8,
  },
  imagePopupContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  expandedImage: {
    flex: 1,
    height: height * 0.6,
    borderRadius: 12,
  },
  imageNavButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
}); 