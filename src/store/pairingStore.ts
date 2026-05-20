import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@flowz_pairings';

export async function loadPairings(): Promise<string[][]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[][];
  } catch {
    return [];
  }
}

export async function savePairings(pairings: string[][]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pairings));
}
