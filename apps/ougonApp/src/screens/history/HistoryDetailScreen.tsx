import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { HistoryStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<HistoryStackParamList, 'HistoryDetail'>;
  route: RouteProp<HistoryStackParamList, 'HistoryDetail'>;
};

export default function HistoryDetailScreen({ navigation, route }: Props) {
  const { record } = route.params;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="chevron-left" size={22} color="#111111" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>加工詳細</Text>
        <View style={styles.navBtnEmpty} />
      </View>

      <View style={styles.center}>
        <Text style={styles.scoreLabel}>φスコア</Text>
        <Text style={styles.scoreValue}>{record.score}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 21,
    paddingHorizontal: 34,
    paddingBottom: 13,
  },
  navBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnEmpty: { width: 34, height: 34, opacity: 0 },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: '#111111',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scoreLabel: {
    fontSize: 13,
    color: '#AAAAAA',
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
    color: '#C8A96E',
  },
});
