import { useState } from "react";

interface UseNetworkStatusResult {
  isConnected: boolean;
}

/**
 * Simple network status hook.
 *
 * Returns `{ isConnected: true }` by default.
 * This is a placeholder implementation. To get real network status
 * monitoring, integrate `@react-native-community/netinfo` and replace
 * this hook's internals accordingly.
 */
export function useNetworkStatus(): UseNetworkStatusResult {
  const [isConnected] = useState<boolean>(true);

  return { isConnected };
}
