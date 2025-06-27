import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export interface CreditCardUIProps {
  card: {
    id: string;
    name: string;
    type?: string;
    number?: string;
    last4?: string;
    color?: string;
    balance: number;
    limit?: number;
    billDate: Date;
    transactions?: any[];
    recentTransaction?: any;
  };
  user: any;
  onPress: () => void;
}

const CARD_TYPE_GRADIENTS: { [key: string]: [string, string] } = {
  platinum: ['#E5E4E2', '#BFC1C2'],
  gold: ['#F7E7B4', '#E6C976'],
  black: ['#181818', '#2A2A2A'],
};

const NEON_GREEN = '#B0FF30';
const PRIMARY_TEXT = '#EAEAEA';
const CARD_RADIUS = 20;
const BORDER_COLOR = 'rgba(255,255,255,0.10)';
const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 6,
};

const CARD_WIDTH = width - 60;

const CreditCardUI = ({ card, user, onPress }: CreditCardUIProps) => {
  const getCardGradient = () => CARD_TYPE_GRADIENTS[card.type?.toLowerCase?.() || 'black'] || CARD_TYPE_GRADIENTS.black;
  const isPlatinum = card.type?.toLowerCase?.() === 'platinum';
  const isGold = card.type?.toLowerCase?.() === 'gold';
  const isLightCard = isPlatinum || isGold;
  const textColor = isLightCard ? '#181818' : PRIMARY_TEXT;
  let chipColor;
  let chipIsGradient = false;
  let chipGradient: [string, string] = ['#F7E7B4', '#E6C976']; // default value
  if (isPlatinum) {
    chipIsGradient = true;
    chipGradient = ['#F7E7B4', '#E6C976']; // subtle gold gradient
  } else if (isGold) {
    chipColor = '#C0C0C0'; // silver for gold cards
  } else {
    chipColor = NEON_GREEN; // lime green for black cards
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.creditCardContainer}
    >
      <LinearGradient
        colors={getCardGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.creditCardGradient, { borderColor: BORDER_COLOR, borderWidth: 1, borderRadius: CARD_RADIUS, ...CARD_SHADOW }]}
      >
        <View style={styles.creditCardHeaderEnhanced}>
          <Text style={[styles.cardNameEnhanced, { color: textColor, fontFamily: 'Inter-SemiBold' }]}>{card.name}</Text>
          {chipIsGradient ? (
            <LinearGradient
              colors={chipGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.creditCardChipEnhanced}
            />
          ) : (
            <View style={[styles.creditCardChipEnhanced, { backgroundColor: chipColor }]} />
          )}
        </View>
        <View style={styles.creditCardNumberEnhanced}>
          <Text style={[styles.creditCardNumberTextEnhanced, { color: textColor }]}>•••• •••• •••• ••••</Text>
        </View>
        <View style={styles.creditCardFooterEnhanced}>
          <View style={styles.creditCardInfoEnhanced}>
            <Text style={[styles.creditCardLabelEnhanced, { color: textColor }]}>CARDHOLDER</Text>
            <Text style={[styles.creditCardNameEnhanced, { color: textColor }]}>{user?.name || ''}</Text>
          </View>
          <View style={styles.creditCardInfoEnhanced}>
            <Text style={[styles.creditCardLabelEnhanced, { color: textColor }]}>DUES</Text>
            <Text style={[styles.creditCardBalanceEnhanced, { color: textColor }]}>{formatCurrency(card.balance)}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  creditCardContainer: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  creditCardGradient: {
    width: CARD_WIDTH,
    padding: 28,
    minHeight: 210,
    position: 'relative',
    overflow: 'hidden',
  },
  creditCardHeaderEnhanced: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 36,
    zIndex: 1,
  },
  creditCardChipEnhanced: {
    width: 44,
    height: 32,
    backgroundColor: 'rgba(255, 215, 0, 0.8)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  creditCardNumberEnhanced: {
    marginBottom: 36,
    zIndex: 1,
  },
  creditCardNumberTextEnhanced: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    letterSpacing: 2.5,
  },
  creditCardFooterEnhanced: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  creditCardInfoEnhanced: {
    flex: 1,
  },
  creditCardLabelEnhanced: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  creditCardNameEnhanced: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  creditCardBalanceEnhanced: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
});

export default CreditCardUI; 