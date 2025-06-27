import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';

interface PieChartData {
  id: string;
  value: number;
  color: string;
  label: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  strokeWidth?: number;
}

const { width } = Dimensions.get('window');

export default function PieChart({ 
  data, 
  size = Math.min(width - 80, 200), 
  strokeWidth = 20
}: PieChartProps) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  
  // Calculate total value
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <View style={[styles.emptyChart, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={styles.emptyText}>No Data</Text>
        </View>
      </View>
    );
  }

  // Calculate angles for each segment
  let currentAngle = -90; // Start from top
  const segments = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    currentAngle += angle;
    
    return {
      ...item,
      percentage,
      startAngle,
      endAngle,
      angle,
    };
  });

  // Create SVG path for each segment
  const createPath = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(center, center, radius, endAngle);
    const end = polarToCartesian(center, center, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", center, center,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {segments.map((segment, index) => (
          <G key={segment.id}>
            <Path
              d={createPath(segment.startAngle, segment.endAngle)}
              fill={segment.color}
              stroke="#1a1a1a"
              strokeWidth={2}
            />
          </G>
        ))}
        
        {/* Center circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius * 0.4}
          fill="#1a1a1a"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emptyChart: {
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666666',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
});