import React, { createContext, useContext } from 'react';
import type { UsageInfo } from './types';
import { getCurrentMonthKey } from './utils/apiKey';

interface UsageContextValue {
  usage: UsageInfo;
  isPremium: boolean;
}

const UsageContext = createContext<UsageContextValue>({
  usage: { monthKey: getCurrentMonthKey(), count: 0 },
  isPremium: false,
});

export const UsageProvider = UsageContext.Provider;

export function useUsage(): UsageContextValue {
  return useContext(UsageContext);
}
