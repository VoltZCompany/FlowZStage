import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@flowz_categories';

export interface CategoryInfo {
  key: string;
  label: string;
  emoji: string;
  color: string;
  isDefault: boolean;
}

const DEFAULT_CATEGORIES: CategoryInfo[] = [
  { key: 'show', label: 'Show', emoji: '🎤', color: '#FF453A', isDefault: true },
  { key: 'logistics', label: 'Logística', emoji: '✈️', color: '#007AFF', isDefault: true },
  { key: 'finance', label: 'Financeiro', emoji: '💰', color: '#30D158', isDefault: true },
  { key: 'team', label: 'Equipe', emoji: '🧍', color: '#FF9500', isDefault: true },
  { key: 'other', label: 'Outros', emoji: '📋', color: '#8E8E93', isDefault: true },
];

export async function loadCategories(): Promise<CategoryInfo[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    return JSON.parse(raw) as CategoryInfo[];
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

async function saveCategories(cats: CategoryInfo[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
}

export async function addCategory(cat: CategoryInfo): Promise<CategoryInfo[]> {
  const current = await loadCategories();
  const updated = [...current, cat];
  await saveCategories(updated);
  return updated;
}

export async function updateCategory(
  key: string,
  changes: Partial<Pick<CategoryInfo, 'label' | 'emoji' | 'color'>>,
): Promise<CategoryInfo[]> {
  const current = await loadCategories();
  const updated = current.map((c) => c.key === key ? { ...c, ...changes } : c);
  await saveCategories(updated);
  return updated;
}

export async function deleteCategory(key: string): Promise<CategoryInfo[]> {
  const current = await loadCategories();
  const updated = current.filter((c) => c.key !== key);
  await saveCategories(updated);
  return updated;
}
