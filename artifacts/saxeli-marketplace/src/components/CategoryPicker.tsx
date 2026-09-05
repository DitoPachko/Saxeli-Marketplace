import { useState } from 'react';
import { useCategoryTree, CategoryIcon, getCategoryPath, type CategoryNode } from '@/hooks/use-categories';
import { Check, ChevronRight } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';

export function CategoryPicker({ value, onChange }: { value: string, onChange: (slug: string) => void }) {
  const { tree, categories, isLoading, isError, refetch } = useCategoryTree();
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<CategoryNode[]>([]);

  const currentList = history.length > 0 ? history[history.length - 1].children : tree;
  const currentParent = history.length > 0 ? history[history.length - 1] : null;

  const path = value ? getCategoryPath(value, categories) : [];
  const displayLabel = path.length > 0 ? path.map(c => c.name).join(' / ') : 'აირჩიე კატეგორია';

  return (
    <Popover.Root open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setHistory([]); }}>
      <Popover.Trigger asChild>
        <button type="button" className={`flex w-full items-center justify-between rounded-xl border bg-transparent px-4 py-3.5 text-sm outline-none transition focus:border-[hsl(var(--primary))] ${value ? 'border-[hsl(var(--input))] text-[hsl(var(--foreground))]' : 'border-[hsl(var(--input))] text-[hsl(var(--muted-foreground))]'}`}>
          <span className="truncate">{displayLabel}</span>
          <ChevronRight size={16} className="shrink-0 opacity-50" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={8} className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[300px] overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-lg)]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-[hsl(var(--muted-foreground))]">იტვირთება...</div>
          ) : isError ? (
            <button type="button" onClick={() => refetch()} className="w-full p-4 text-center text-sm font-semibold text-[hsl(var(--primary))]">კატეგორიები ვერ ჩაიტვირთა — სცადე თავიდან</button>
          ) : (
            <div className="flex h-[340px] flex-col">
              {currentParent && (
                <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/.3)] p-2">
                  <button type="button" onClick={() => setHistory(h => h.slice(0, -1))} className="rounded-lg p-2 hover:bg-[hsl(var(--muted))]">
                    <ChevronRight size={16} className="rotate-180" />
                  </button>
                  <span className="font-semibold text-sm">{currentParent.name}</span>
                </div>
              )}
              
              <div className="flex-1 overflow-y-auto p-2">
                {currentParent && (
                  <button 
                    type="button" 
                    onClick={() => { onChange(currentParent.slug); setIsOpen(false); }}
                    className="mb-2 w-full rounded-lg bg-[hsl(var(--primary)/.1)] px-3 py-2.5 text-left text-sm font-bold text-[hsl(var(--primary))]"
                  >
                    აირჩიე: {currentParent.name}
                  </button>
                )}

                {currentList.map(node => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => {
                      if (node.children.length > 0) {
                        setHistory([...history, node]);
                      } else {
                        onChange(node.slug);
                        setIsOpen(false);
                      }
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition hover:bg-[hsl(var(--muted))] ${value === node.slug ? 'bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]' : 'text-[hsl(var(--foreground))]'}`}
                  >
                    <span className="flex items-center gap-2.5">
                      {!currentParent && <CategoryIcon name={node.icon} size={16} className={value === node.slug ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'} />}
                      {node.name}
                    </span>
                    {node.children.length > 0 ? (
                      <ChevronRight size={16} className="text-[hsl(var(--muted-foreground))]" />
                    ) : (
                      value === node.slug && <Check size={16} className="text-[hsl(var(--primary))]" />
                    )}
                  </button>
                ))}
                
                {currentList.length === 0 && (
                   <div className="p-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
                     ქვეკატეგორიები არ არის
                   </div>
                )}
              </div>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
