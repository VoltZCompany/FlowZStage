import { useCallback, useEffect, useState } from 'react';
import {
  CategoryInfo,
  addCategory,
  deleteCategory,
  loadCategories,
  updateCategory,
} from '../store/categoryStore';

export function useCategories() {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);

  const refresh = useCallback(async () => {
    const cats = await loadCategories();
    setCategories(cats);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (cat: CategoryInfo) => {
    const updated = await addCategory(cat);
    setCategories(updated);
  }, []);

  const update = useCallback(async (
    key: string,
    changes: Partial<Pick<CategoryInfo, 'label' | 'emoji' | 'color'>>,
  ) => {
    const updated = await updateCategory(key, changes);
    setCategories(updated);
  }, []);

  const remove = useCallback(async (key: string) => {
    const updated = await deleteCategory(key);
    setCategories(updated);
  }, []);

  return { categories, add, update, remove, refresh };
}
