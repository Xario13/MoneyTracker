import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Trophy, Sparkles, X } from 'lucide-react-native';

interface GoalCompletionModalProps {
  visible: boolean;
  goalTitle: string;
  goalAmount: number;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export default function GoalCompletionModal({
  visible,
  goalTitle,
  goalAmount,
  onClose
}: GoalCompletionModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start animations
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.loop(
          Animated.sequence([
            Animated.timing(sparkleAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(sparkleAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      sparkleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View 
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Sparkle effects */}
          <Animated.View 
            style={[
              styles.sparkle,
              styles.sparkle1,
              {
                opacity: sparkleAnim,
                transform: [
                  {
                    rotate: sparkleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    })
                  }
                ]
              }
            ]}
          >
            <Sparkles color="#c4ff00" size={20} />
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.sparkle,
              styles.sparkle2,
              {
                opacity: sparkleAnim,
                transform: [
                  {
                    rotate: sparkleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['360deg', '0deg'],
                    })
                  }
                ]
              }
            ]}
          >
            <Sparkles color="#4ade80" size={16} />
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.sparkle,
              styles.sparkle3,
              {
                opacity: sparkleAnim,
                transform: [
                  {
                    scale: sparkleAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.5, 1.2, 0.8],
                    })
                  }
                ]
              }
            ]}
          >
            <Sparkles color="#fbbf24" size={18} />
          </Animated.View>

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X color="#666666" size={24} />
          </TouchableOpacity>

          {/* Trophy icon */}
          <View style={styles.trophyContainer}>
            <Trophy color="#c4ff00" size={64} />
          </View>

          {/* Congratulations text */}
          <Text style={styles.congratsTitle}>Congratulations!</Text>
          <Text style={styles.congratsSubtitle}>You've completed your goal</Text>

          {/* Goal details */}
          <View style={styles.goalDetails}>
            <Text style={styles.goalTitle}>{goalTitle}</Text>
            <Text style={styles.goalAmount}>{formatCurrency(goalAmount)}</Text>
          </View>

          {/* Success message */}
          <Text style={styles.successMessage}>
            Amazing work! You've successfully saved {formatCurrency(goalAmount)} for your {goalTitle.toLowerCase()}. 
            Keep up the great momentum with your next financial goal!
          </Text>

          {/* Action button */}
          <TouchableOpacity style={styles.actionButton} onPress={handleClose}>
            <Text style={styles.actionButtonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: '#2a2a2a',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
    position: 'relative',
  },
  sparkle: {
    position: 'absolute',
  },
  sparkle1: {
    top: 20,
    right: 30,
  },
  sparkle2: {
    top: 60,
    left: 20,
  },
  sparkle3: {
    bottom: 80,
    right: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  trophyContainer: {
    backgroundColor: '#1a1a1a',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#c4ff00',
  },
  congratsTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  congratsSubtitle: {
    color: '#999999',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  goalDetails: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    width: '100%',
  },
  goalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  goalAmount: {
    color: '#c4ff00',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  successMessage: {
    color: '#cccccc',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  actionButton: {
    backgroundColor: '#c4ff00',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});