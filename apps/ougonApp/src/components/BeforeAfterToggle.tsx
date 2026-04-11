import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';

type ToggleValue = 'before' | 'after';

interface Props {
  value: ToggleValue;
  onChange: (value: ToggleValue) => void;
}

export default function BeforeAfterToggle({ value, onChange }: Props) {
  const animX = useRef(new Animated.Value(value === 'before' ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(animX, {
      toValue: value === 'before' ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, animX]);

  // thumbWidth = (containerWidth - 6px padding - 2px gap) / 2
  // We use percentage-based translation via interpolation on a fixed-width container
  const thumbTranslate = animX.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '50%'],
  });

  return (
    <View style={styles.container}>
      {/* sliding active background */}
      <Animated.View
        style={[
          styles.activeThumb,
          { left: thumbTranslate },
        ]}
      />

      <TouchableOpacity
        style={styles.btn}
        onPress={() => onChange('before')}
        activeOpacity={0.8}
      >
        <Text style={[styles.btnText, value === 'before' && styles.btnTextActive]}>
          Before
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => onChange('after')}
        activeOpacity={0.8}
      >
        <Text style={[styles.btnText, value === 'after' && styles.btnTextActive]}>
          After
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 34,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 3,
    gap: 2,
    height: 38, // 32px buttons + 3px padding top + 3px padding bottom
    position: 'relative',
  },
  activeThumb: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    width: '50%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    // shadow
    shadowColor: 'rgba(0,0,0,1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  btn: {
    flex: 1,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    zIndex: 1,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#AAAAAA',
  },
  btnTextActive: {
    fontWeight: '600',
    color: '#111111',
  },
});
