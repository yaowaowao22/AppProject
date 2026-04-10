import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  PanResponder,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  unit?: string;
  isGold?: boolean;
  isIntensity?: boolean;
}

export default function AdjustmentSlider({
  label,
  value,
  min,
  max,
  onChange,
  unit = '',
  isGold = false,
  isIntensity = false,
}: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const startX = useRef(0);
  const startValue = useRef(value);

  const ratio = max > min ? (value - min) / (max - min) : 0;
  // Pixel positions derived from measured track width
  const fillWidth = trackWidth * ratio;
  // Thumb center = fillWidth, offset by -10 (half thumb) handled via marginLeft
  const thumbLeft = fillWidth;

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  }, []);

  // PanResponder created once; read latest value via ref on each grant
  const valueRef = useRef(value);
  valueRef.current = value;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gs) => {
        startX.current = gs.x0;
        startValue.current = valueRef.current;
      },
      onPanResponderMove: (_, gs) => {
        if (trackWidth <= 0) return;
        const delta = gs.moveX - startX.current;
        const deltaRatio = delta / trackWidth;
        const newValue = startValue.current + deltaRatio * (max - min);
        const clamped = Math.round(Math.max(min, Math.min(max, newValue)));
        onChange(clamped);
      },
    })
  ).current;

  const displayValue = isGold ? 'φ 最適' : `${value}${unit}`;
  const fillColor = isGold ? '#C8A96E' : '#111111';

  const trackSection = (
    <View onLayout={handleLayout} style={styles.trackWrap}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: fillWidth, backgroundColor: fillColor }]} />
      </View>
      <View
        style={[styles.thumb, { left: thumbLeft }]}
        {...pan.panHandlers}
      />
    </View>
  );

  if (isIntensity) {
    return (
      <View style={styles.intensityContainer}>
        <View style={styles.header}>
          <Text style={styles.intensityLabel}>{label}</Text>
          <Text style={styles.intensityPct}>{value}{unit}</Text>
        </View>
        {trackSection}
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Text style={styles.labelText}>{label}</Text>
        <Text style={[styles.valueText, isGold && styles.valueGold]}>
          {displayValue}
        </Text>
      </View>
      {trackSection}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'column',
    gap: 8,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 13,
    color: '#111111',
    letterSpacing: -0.1,
  },
  valueText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111111',
    letterSpacing: -0.3,
  },
  valueGold: {
    color: '#C8A96E',
  },
  trackWrap: {
    position: 'relative',
    height: 24,
    justifyContent: 'center',
  },
  track: {
    width: '100%',
    height: 3,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    top: '50%',
    marginTop: -10,
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D8D8D8',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  // intensity variant
  intensityContainer: {
    marginVertical: 13,
    padding: 13,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    gap: 10,
  },
  intensityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111111',
  },
  intensityPct: {
    fontSize: 20,
    fontWeight: '200',
    letterSpacing: -1,
    color: '#111111',
  },
});
