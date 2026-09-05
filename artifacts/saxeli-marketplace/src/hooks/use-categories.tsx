import { useMemo } from 'react';
import { useListCategories, type Category } from '@workspace/api-client-react';
import * as Icons from 'lucide-react';

export type CategoryNode = Category & {
  children: CategoryNode[];
};

export function useCategoryTree() {
  const { data: categories = [], isLoading, isError, refetch } = useListCategories();

  const { tree, flatMap } = useMemo(() => {
    const map = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];
    const flatMap = new Map<string, Category>();

    categories.forEach(c => {
      map.set(c.id, { ...c, children: [] });
      flatMap.set(c.slug, c);
    });

    categories.forEach(c => {
      const node = map.get(c.id)!;
      if (c.parentId) {
        const parent = map.get(c.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    const sortChildren = (node: CategoryNode) => {
      node.children.sort((a, b) => a.sortOrder - b.sortOrder);
      node.children.forEach(sortChildren);
    };
    
    roots.sort((a, b) => a.sortOrder - b.sortOrder);
    roots.forEach(sortChildren);

    return { tree: roots, flatMap };
  }, [categories]);

  return { categories, tree, flatMap, isLoading, isError, refetch };
}

export function CategoryIcon({ name, className = '', size = 20 }: { name?: string | null, className?: string, size?: number }) {
  if (!name) return <Icons.Folder className={className} size={size} />;
  
  const formattedName = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  const IconComponent = (Icons as any)[formattedName] || (Icons as any)[name];
  
  if (!IconComponent) return <Icons.Folder className={className} size={size} />;
  return <IconComponent className={className} size={size} />;
}

export function getCategoryPath(slug: string, categories: Category[]): Category[] {
  const path: Category[] = [];
  let current = categories.find(c => c.slug === slug);
  while (current) {
    path.unshift(current);
    if (current.parentId) {
      current = categories.find(c => c.id === current!.parentId);
    } else {
      break;
    }
  }
  return path;
}
