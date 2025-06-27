import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Platform,
  Image,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import { X, Check, Trash2, Plus, Camera, ChevronLeft, ChevronRight } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Transaction } from '@/types/user';
import { useData } from '@/contexts/DataContext';
import CustomAlert from '@/components/CustomAlert';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

interface EditTransactionModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
}

export default function EditTransactionModal({
  visible,
  transaction,
  onClose,
  onSave,
  onDelete
}: EditTransactionModalProps) {
  const { categories, funds, creditCards } = useData();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isIncome, setIsIncome] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedFundId, setSelectedFundId] = useState<string>('');
  const [selectedCreditCardId, setSelectedCreditCardId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'fund' | 'credit' | 'savings'>('fund');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [imagePopupVisible, setImagePopupVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const filteredCategories = categories.filter(cat =>
    isIncome ? cat.type === 'income' : cat.type === 'expense'
  );

  const showAlert = (title: string, message: string, type: any = 'info', buttons: any[] = [{ text: 'OK' }]) => {
    setAlertConfig({ title, message, type, buttons });
    setAlertVisible(true);
  };

  useEffect(() => {
    if (transaction) {
      setTitle(transaction.title);
      setNotes(transaction.notes || '');
      setAmount(Math.abs(transaction.amount).toString());
      setIsIncome(transaction.type === 'income');
      setDate(transaction.date);
      setSelectedFundId(transaction.fundId || '');
      setSelectedCreditCardId(transaction.creditCardId || '');
      
      // Initialize photos array
      if (transaction.photos && transaction.photos.length > 0) {
        setPhotos(transaction.photos);
      } else if (transaction.photo) {
        setPhotos([transaction.photo]);
      } else {
        setPhotos([]);
      }
      
      if (transaction.creditCardId) {
        setPaymentMethod('credit');
      } else if (transaction.fundId) {
        setPaymentMethod('fund');
      } else {
        setPaymentMethod('savings');
      }
      
      const category = categories.find(cat => cat.name === transaction.category);
      setSelectedCategory(category?.id || null);
    }
  }, [transaction, categories]);

  useEffect(() => {
    if (visible) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [visible]);

  const handleSave = () => {
    if (!transaction || !title.trim() || !amount.trim() || !selectedCategory) {
      showAlert('Error', 'Please fill in title, amount, and category.', 'error');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showAlert('Error', 'Please enter a valid amount', 'error');
      return;
    }

    const category = filteredCategories.find(cat => cat.id === selectedCategory);
    if (!category) return;

    if (!isIncome) {
      if (paymentMethod === 'fund' && !selectedFundId) {
        showAlert('Error', 'Please select a fund for the expense', 'error');
        return;
      }
      if (paymentMethod === 'credit' && !selectedCreditCardId) {
        showAlert('Error', 'Please select a credit card for the expense', 'error');
        return;
      }
    }

    const updatedTransaction: Transaction = {
      ...transaction,
      title: title.trim(),
      notes: notes.trim(),
      amount: isIncome ? numAmount : -numAmount,
      type: isIncome ? 'income' : 'expense',
      category: category.name,
      date: date,
      photo: photos.length > 0 ? photos[0] : undefined, // Keep first photo as main photo for compatibility
      photos: photos.length > 0 ? photos : undefined, // Save all photos in new array
      fundId: (isIncome && paymentMethod !== 'savings') || (!isIncome && paymentMethod === 'fund') ? selectedFundId : undefined,
      creditCardId: !isIncome && paymentMethod === 'credit' ? selectedCreditCardId : undefined,
      updatedAt: new Date(),
    };

    onSave(updatedTransaction);
    onClose();
  };

  const handleDelete = () => {
    if (!transaction) return;

    showAlert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      'warning',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(transaction.id);
            onClose();
          },
        },
      ]
    );
  };

  const addPhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        showAlert('Permission Required', 'Camera roll permission is required to add photos.', 'error');
        return;
      }
      Alert.alert(
        'Photo Options',
        'Do you want to crop the photo?',
        [
          {
            text: 'Keep',
            onPress: () => launchGallery(false),
          },
          {
            text: 'Crop',
            onPress: () => launchGallery(true),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      showAlert('Error', 'Failed to add photo. Please try again.', 'error');
    }
  };

  const launchGallery = async (allowsEditing: boolean) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        aspect: allowsEditing ? [4, 3] : undefined,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      showAlert('Error', 'Failed to pick image.', 'error');
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) {
        showAlert('Permission Required', 'Camera permission is required to take photos.', 'error');
        return;
      }
      Alert.alert(
        'Photo Options',
        'Do you want to crop the photo?',
        [
          {
            text: 'Keep',
            onPress: () => launchCamera(false),
          },
          {
            text: 'Crop',
            onPress: () => launchCamera(true),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      showAlert('Error', 'Failed to take photo. Please try again.', 'error');
    }
  };

  const launchCamera = async (allowsEditing: boolean) => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing,
        aspect: allowsEditing ? [4, 3] : undefined,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      showAlert('Error', 'Failed to take photo.', 'error');
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
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
    <View style={styles.photoItemContainer}>
      <TouchableOpacity onPress={() => openImagePopup(index)} activeOpacity={0.9}>
        <Image source={{ uri: item }} style={styles.photoItem} resizeMode="cover" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.removePhotoButton}
        onPress={() => removePhoto(index)}
      >
        <X color="#ffffff" size={16} />
      </TouchableOpacity>
    </View>
  );

  const formatAmount = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleanValue;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!transaction) return null;

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
              <Text style={styles.modalTitle}>Edit Transaction</Text>
              <TouchableOpacity onPress={onClose}>
                <X color="#ffffff" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView ref={scrollViewRef} contentContainerStyle={styles.modalBody}>
              <View style={styles.content}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Title</Text>
                  <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g., Coffee with friends"
                    placeholderTextColor="#666"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Notes (Optional)</Text>
                  <TextInput
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="e.g., Discussed the new project"
                    placeholderTextColor="#666"
                    multiline
                  />
                </View>

                {/* Photos Section */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Photos ({photos.length})</Text>
                  {photos.length > 0 && (
                    <FlatList
                      data={photos}
                      renderItem={renderPhotoItem}
                      keyExtractor={(item, index) => index.toString()}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.photoList}
                      ItemSeparatorComponent={() => <View style={styles.photoSeparator} />}
                    />
                  )}
                  <View style={styles.photoActions}>
                    <TouchableOpacity onPress={takePhoto} style={styles.photoActionButton}>
                      <Camera color="#c4ff00" size={20} />
                      <Text style={styles.photoActionText}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={addPhoto} style={styles.photoActionButton}>
                      <Plus color="#c4ff00" size={20} />
                      <Text style={styles.photoActionText}>Add Photo</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Amount</Text>
                    <TextInput
                      style={styles.input}
                      value={amount}
                      onChangeText={(text) => setAmount(formatAmount(text))}
                      placeholder="0.00"
                      placeholderTextColor="#666"
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Date</Text>
                    <TouchableOpacity
                      style={styles.input}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={{ color: '#fff' }}>{formatDate(date)}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setDate(selectedDate);
                      }
                    }}
                  />
                )}
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Type</Text>
                  <View style={styles.typeToggle}>
                    <TouchableOpacity
                      style={[styles.toggleButton, !isIncome && styles.toggleButtonActive]}
                      onPress={() => setIsIncome(false)}
                    >
                      <Text style={[styles.toggleText, !isIncome && styles.toggleTextActive]}>
                        Expense
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.toggleButton, isIncome && styles.toggleButtonActive]}
                      onPress={() => setIsIncome(true)}
                    >
                      <Text style={[styles.toggleText, isIncome && styles.toggleTextActive]}>
                        Income
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {!isIncome && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Payment Method</Text>
                    <View style={styles.typeToggle}>
                      <TouchableOpacity
                        style={[styles.toggleButton, paymentMethod === 'fund' && styles.toggleButtonActive]}
                        onPress={() => setPaymentMethod('fund')}
                      >
                        <Text style={[styles.toggleText, paymentMethod === 'fund' && styles.toggleTextActive]}>
                          Fund
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.toggleButton, paymentMethod === 'credit' && styles.toggleButtonActive]}
                        onPress={() => setPaymentMethod('credit')}
                      >
                        <Text style={[styles.toggleText, paymentMethod === 'credit' && styles.toggleTextActive]}>
                          Credit
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {((isIncome && paymentMethod !== 'savings') || (!isIncome && paymentMethod === 'fund')) && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Select Fund</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {funds.map((fund) => (
                        <TouchableOpacity
                          key={fund.id}
                          style={[
                            styles.fundOption,
                            { backgroundColor: fund.color },
                            selectedFundId === fund.id && styles.fundOptionSelected
                          ]}
                          onPress={() => setSelectedFundId(fund.id)}
                        >
                          <Text style={styles.fundOptionName}>{fund.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {!isIncome && paymentMethod === 'credit' && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Select Credit Card</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {creditCards.map((card) => (
                        <TouchableOpacity
                          key={card.id}
                          style={[
                            styles.fundOption,
                            { backgroundColor: card.color },
                            selectedCreditCardId === card.id && styles.fundOptionSelected
                          ]}
                          onPress={() => setSelectedCreditCardId(card.id)}
                        >
                          <Text style={styles.fundOptionName}>{card.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Category</Text>
                  <View style={styles.categoriesGrid}>
                    {filteredCategories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryButton,
                          selectedCategory === category.id && styles.categoryButtonSelected
                        ]}
                        onPress={() => setSelectedCategory(category.id)}
                      >
                        <Text style={styles.categoryText}>{category.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                <Trash2 color="#f87171" size={20} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                <Check color="#1a1a1a" size={20} />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
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
    maxHeight: '90%',
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
  },
  modalBody: {
    paddingHorizontal: 24,
  },
  content: {
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleButtonActive: {
    backgroundColor: '#c4ff00',
  },
  toggleText: {
    color: '#999999',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  toggleTextActive: {
    color: '#1a1a1a',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#404040',
  },
  categoryButtonSelected: {
    backgroundColor: '#c4ff00',
    borderColor: '#c4ff00',
  },
  categoryText: {
    color: '#ffffff',
    fontFamily: 'Inter-Medium',
  },
  fundOption: {
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  fundOptionSelected: {
    borderColor: '#c4ff00',
  },
  fundOptionName: {
    color: '#1a1a1a',
    fontFamily: 'Inter-SemiBold',
  },
  photoList: {
    paddingVertical: 8,
  },
  photoItemContainer: {
    position: 'relative',
  },
  photoItem: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  photoSeparator: {
    width: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#404040',
  },
  photoActionText: {
    color: '#c4ff00',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
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
    height: 400,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#404040',
  },
  deleteButton: {
    backgroundColor: '#444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#c4ff00',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 12,
  },
  saveButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginLeft: 8,
  },
});