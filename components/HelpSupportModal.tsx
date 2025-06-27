import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { X, Send, MessageCircle } from 'lucide-react-native';
import CustomAlert from '@/components/CustomAlert';

interface HelpSupportModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function HelpSupportModal({ visible, onClose }: HelpSupportModalProps) {
  const [query, setQuery] = useState('');
  const [email, setEmail] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>({});

  const showAlert = (title: string, message: string, type: any = 'info', buttons: any[] = [{ text: 'OK' }]) => {
    setAlertConfig({ title, message, type, buttons });
    setAlertVisible(true);
  };

  const handleSubmit = () => {
    if (!query.trim() || !email.trim()) {
      showAlert('Error', 'Please fill in all fields', 'error');
      return;
    }

    if (!email.includes('@')) {
      showAlert('Error', 'Please enter a valid email address', 'error');
      return;
    }

    // In a real app, this would send the query to support
    showAlert(
      'Query Submitted',
      'Thank you for contacting us! We\'ll get back to you within 24 hours.',
      'success',
      [
        {
          text: 'OK',
          onPress: () => {
            setQuery('');
            setEmail('');
            onClose();
          }
        }
      ]
    );
  };

  console.log('HelpSupportModal visible type:', typeof visible, visible);
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
              <Text style={styles.modalTitle}>Help & Support</Text>
              <TouchableOpacity onPress={onClose}>
                <X color="#ffffff" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Contact Form */}
              <View style={styles.contactSection}>
                <View style={styles.contactHeader}>
                  <MessageCircle color="#c4ff00" size={20} style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 0 }]}>Contact Support</Text>
                </View>
                
                <Text style={styles.contactDescription}>
                  Can't find what you're looking for? Send us a message and we'll help you out!
                </Text>

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Your Email</Text>
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your.email@example.com"
                    placeholderTextColor="#666666"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Your Question</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Describe your question or issue..."
                    placeholderTextColor="#666666"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!query.trim() || !email.trim()) && styles.submitButtonDisabled
                  ]}
                  onPress={handleSubmit}
                  disabled={!query.trim() || !email.trim()}
                >
                  <Send color="#1a1a1a" size={20} />
                  <Text style={styles.submitButtonText}>Send Message</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
    marginLeft: 8,
  },
  contactSection: {
    marginBottom: 20,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactDescription: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: '#c4ff00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#404040',
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
});