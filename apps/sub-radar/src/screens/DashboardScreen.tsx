import React from 'react';
import { DashboardVariantC } from './DashboardVariantC';
import type { Subscription } from '../types';

interface DashboardScreenProps {
  onAddPress?: () => void;
  onEditPress?: (s: Subscription) => void;
}

export function DashboardScreen({ onAddPress, onEditPress }: DashboardScreenProps) {
  return (
    <DashboardVariantC
      onAddPress={onAddPress ?? (() => {})}
      onEditPress={onEditPress ?? (() => {})}
    />
  );
}
