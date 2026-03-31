// ============================================================
// useSidebarFilter — サイドバーフィルター Context + Provider
// DrawerNavigator の外側（RootNavigator）でラップして使う
// ============================================================

import React, { createContext, useCallback, useContext, useState } from 'react';
import type { SidebarFilter } from '../types';

interface SidebarFilterContextValue {
  sidebarFilter: SidebarFilter | null;
  setSidebarFilter: (f: SidebarFilter | null) => void;
  clearFilter: () => void;
}

const SidebarFilterContext = createContext<SidebarFilterContextValue>({
  sidebarFilter: null,
  setSidebarFilter: () => {},
  clearFilter: () => {},
});

export function SidebarFilterProvider({ children }: { children: React.ReactNode }) {
  const [sidebarFilter, setSidebarFilter] = useState<SidebarFilter | null>(null);

  const clearFilter = useCallback(() => setSidebarFilter(null), []);

  return (
    <SidebarFilterContext.Provider value={{ sidebarFilter, setSidebarFilter, clearFilter }}>
      {children}
    </SidebarFilterContext.Provider>
  );
}

export function useSidebarFilter() {
  return useContext(SidebarFilterContext);
}
