import { Platform } from 'react-native';
import Purchases, { PurchasesPackage, CustomerInfo } from 'react-native-purchases';

const REVENUECAT_IOS_KEY = 'appl_frBDjrHKKZhHlPYwQdmeOgXzzFq';
const REVENUECAT_ANDROID_KEY = 'appl_frBDjrHKKZhHlPYwQdmeOgXzzFq';

const ENTITLEMENT_ID = 'premium';

let initialized = false;

export async function initPurchases(): Promise<void> {
  if (initialized) return;
  const key = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
  if (key.startsWith('YOUR_')) {
    console.warn('[Purchases] RevenueCat API Key が未設定です');
    return;
  }
  Purchases.configure({ apiKey: key });
  initialized = true;
}

export async function checkPremium(): Promise<boolean> {
  if (!initialized) return false;
  try {
    const info: CustomerInfo = await Purchases.getCustomerInfo();
    return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
}

export async function buyPremium(): Promise<{ success: boolean; error?: string }> {
  if (!initialized) {
    return { success: false, error: 'IAP未初期化' };
  }
  try {
    const offerings = await Purchases.getOfferings();
    const pkg: PurchasesPackage | undefined =
      offerings.current?.availablePackages[0];
    if (!pkg) {
      return { success: false, error: '購入可能なプランが見つかりません' };
    }
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const hasPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    return { success: hasPremium, error: hasPremium ? undefined : '購入処理に失敗しました' };
  } catch (e: any) {
    if (e.userCancelled) {
      return { success: false, error: 'cancelled' };
    }
    return { success: false, error: e.message ?? '購入エラー' };
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!initialized) return false;
  try {
    const info: CustomerInfo = await Purchases.restorePurchases();
    return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
}
