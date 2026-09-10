import { Category, Stock } from '../types';

export interface CategoryTreeItem extends Category {
  level: number;
  children: CategoryTreeItem[];
}

/**
 * ルートから指定したカテゴリーまでの階層パス（パンくずリスト用）を取得
 */
export function getCategoryPath(categoryId: string | null, categories: Category[]): Category[] {
  if (!categoryId || categoryId === 'UNASSIGNED') return [];
  const path: Category[] = [];
  let current = categories.find(c => c.id === categoryId);
  const visited = new Set<string>();

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    path.unshift(current);
    if (!current.parentId) break;
    current = categories.find(c => c.id === current?.parentId);
  }
  return path;
}

/**
 * 指定した親ID直下の子カテゴリー一覧を取得
 */
export function getChildCategories(parentId: string | null, categories: Category[]): Category[] {
  if (!parentId) {
    // ルートカテゴリー（parentId が null, undefined, または空文字）
    return categories.filter(c => !c.parentId);
  }
  return categories.filter(c => c.parentId === parentId);
}

/**
 * 指定したカテゴリー配下のすべての子孫カテゴリーIDを再帰的に取得
 */
export function getAllDescendantCategoryIds(categoryId: string, categories: Category[]): string[] {
  const result: string[] = [];
  const collect = (pId: string) => {
    const children = categories.filter(c => c.parentId === pId);
    for (const child of children) {
      result.push(child.id);
      collect(child.id);
    }
  };
  collect(categoryId);
  return result;
}

/**
 * セレクトボックスやモーダルでの選択用に、階層構造をインデント付きフラットリストに整形
 */
export function getFlattenedCategoryTree(
  categories: Category[]
): { id: string; name: string; level: number; displayName: string; parentId?: string | null }[] {
  const result: { id: string; name: string; level: number; displayName: string; parentId?: string | null }[] = [];
  
  const buildTree = (parentId: string | null, level: number) => {
    const children = getChildCategories(parentId, categories);
    for (const cat of children) {
      const indent = level === 0 ? '' : '　'.repeat(level) + '└ ';
      result.push({
        id: cat.id,
        name: cat.name,
        level,
        displayName: `${indent}${cat.name}`,
        parentId: cat.parentId
      });
      buildTree(cat.id, level + 1);
    }
  };

  buildTree(null, 0);

  // もし親子関係の不整合で漏れたカテゴリーがあれば末尾に追加
  const addedIds = new Set(result.map(r => r.id));
  for (const cat of categories) {
    if (!addedIds.has(cat.id)) {
      result.push({
        id: cat.id,
        name: cat.name,
        level: 0,
        displayName: cat.name,
        parentId: cat.parentId
      });
    }
  }

  return result;
}

/**
 * 指定カテゴリーに属する銘柄数を再帰的に集計（子カテゴリーの銘柄も含む）
 */
export function countStocksInCategory(
  categoryId: string,
  categories: Category[],
  stocks: Stock[]
): { directCount: number; totalCount: number } {
  const directCount = stocks.filter(s => s.categoryId === categoryId).length;
  const descendantIds = getAllDescendantCategoryIds(categoryId, categories);
  const totalCount = directCount + stocks.filter(s => descendantIds.includes(s.categoryId)).length;
  return { directCount, totalCount };
}
