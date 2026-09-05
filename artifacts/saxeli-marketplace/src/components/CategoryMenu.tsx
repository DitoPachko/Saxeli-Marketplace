import { useState, useRef, useEffect } from 'react';
import { useCategoryTree, CategoryIcon, type CategoryNode } from '@/hooks/use-categories';
import { useFilters } from '@/hooks/use-filters';
import { ChevronRight, Grid2X2, X, ArrowLeft } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

export function CategoryMenuDesktop() {
  const { tree, isLoading, isError, refetch } = useCategoryTree();
  const [isOpen, setIsOpen] = useState(false);
  const [activeRoot, setActiveRoot] = useState<CategoryNode | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { setCategorySlug } = useFilters();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && tree.length > 0 && !activeRoot) {
      setActiveRoot(tree[0]);
    }
  }, [isOpen, tree, activeRoot]);

  const handleSelect = (slug: string) => {
    setCategorySlug(slug);
    setIsOpen(false);
  };

  if (isLoading) return <div className="skeleton h-10 w-32 rounded-full hidden md:block" />;

  return (
    <div className="hidden md:block" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-full px-4 py-2 font-medium transition ${isOpen ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--muted)/.5)] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'}`}
      >
        {isOpen ? <X size={18} /> : <Grid2X2 size={18} />}
        კატეგორიები
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-40 mt-0 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-xl)] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="mx-auto flex h-[480px] max-w-[1320px]">
            {/* Left Rail */}
            <div className="w-[300px] shrink-0 overflow-y-auto border-r border-[hsl(var(--border))] bg-[hsl(var(--muted)/.2)] py-4">
              {tree.map(root => (
                <button
                  key={root.id}
                  onMouseEnter={() => setActiveRoot(root)}
                  onClick={() => setActiveRoot(root)}
                  className={`flex w-full items-center gap-3 border-y px-6 py-3.5 text-left text-sm transition ${activeRoot?.id === root.id ? 'border-[hsl(var(--border))] bg-[hsl(var(--background))] font-semibold text-[hsl(var(--primary))] shadow-sm' : 'border-transparent font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted)/.5)] hover:text-[hsl(var(--foreground))]'}`}
                >
                  <CategoryIcon name={root.icon} size={20} className={activeRoot?.id === root.id ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'} />
                  {root.name}
                  <ChevronRight size={16} className="ml-auto opacity-40" />
                </button>
              ))}
            </div>
            
            {/* Right Content */}
            <div className="flex-1 overflow-y-auto bg-[hsl(var(--background))] p-10">
              {isError ? <div className="flex h-full items-center justify-center"><button type="button" onClick={() => refetch()} className="btn-ink rounded-xl px-4 py-2 text-sm font-semibold">კატეგორიები ვერ ჩაიტვირთა — სცადე თავიდან</button></div> : null}
              {!isError && (activeRoot ? (
                <div>
                  <div className="mb-8 flex items-center justify-between border-b border-[hsl(var(--border))] pb-5">
                    <h2 className="font-display flex items-center gap-3 text-3xl font-bold">
                      <CategoryIcon name={activeRoot.icon} size={32} className="text-[hsl(var(--primary))]" />
                      {activeRoot.name}
                    </h2>
                    <button onClick={() => handleSelect(activeRoot.slug)} className="text-sm font-semibold text-[hsl(var(--primary))] hover:underline">
                      ყველას ნახვა →
                    </button>
                  </div>
                  
                  {activeRoot.children.length > 0 ? (
                    <div className="grid grid-cols-3 gap-x-10 gap-y-12">
                      {activeRoot.children.map(sub => (
                        <div key={sub.id}>
                          <button onClick={() => handleSelect(sub.slug)} className="group mb-4 flex items-center gap-2 text-base font-bold text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]">
                            {sub.name}
                            <ChevronRight size={16} className="opacity-0 transition-opacity group-hover:opacity-100" />
                          </button>
                          {sub.children.length > 0 && (
                            <ul className="space-y-3">
                              {sub.children.slice(0, 6).map(child => (
                                <li key={child.id}>
                                  <button onClick={() => handleSelect(child.slug)} className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:underline">
                                    {child.name}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                          <button onClick={() => handleSelect(sub.slug)} className="mt-4 text-sm font-semibold text-[hsl(var(--primary))] hover:underline">
                            მეტის ნახვა
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-40 items-center justify-center text-[hsl(var(--muted-foreground))]">
                      ქვეკატეგორიები არ მოიძებნა
                    </div>
                  )}
                </div>
              ) : null)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CategoryMenuMobile() {
  const { tree, isLoading, isError, refetch } = useCategoryTree();
  const [isOpen, setIsOpen] = useState(false);
  const { setCategorySlug } = useFilters();
  const [history, setHistory] = useState<CategoryNode[]>([]);

  const handleSelect = (slug: string) => {
    setCategorySlug(slug);
    setIsOpen(false);
  };

  const currentList = history.length > 0 ? history[history.length - 1].children : tree;
  const currentParent = history.length > 0 ? history[history.length - 1] : null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setHistory([]); }}>
      <Dialog.Trigger asChild>
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--muted)/.5)] px-4 py-2.5 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))]">
          {isLoading ? <div className="skeleton h-5 w-5 rounded-full" /> : <Grid2X2 size={18} />}
          კატეგორიები
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-50 flex flex-col bg-[hsl(var(--background))] animate-in slide-in-from-bottom-full md:hidden">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5">
            {currentParent ? (
              <button onClick={() => setHistory(h => h.slice(0, -1))} className="flex items-center gap-1.5 text-sm font-bold text-[hsl(var(--foreground))]">
                <ArrowLeft size={18} /> უკან
              </button>
            ) : (
              <span className="font-display text-xl font-bold">კატეგორიები</span>
            )}
            <Dialog.Close asChild>
              <button className="rounded-full bg-[hsl(var(--muted)/.5)] p-2 hover:bg-[hsl(var(--muted))]"><X size={20} /></button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto bg-[hsl(var(--background))] p-5">
            {isError ? <button type="button" onClick={() => refetch()} className="btn-ink w-full rounded-xl px-4 py-3 text-sm font-semibold">კატეგორიები ვერ ჩაიტვირთა — სცადე თავიდან</button> : null}
            {!isError && (
            <>
            {currentParent && (
              <button 
                onClick={() => handleSelect(currentParent.slug)}
                className="mb-5 w-full rounded-2xl bg-[hsl(var(--primary)/.1)] px-5 py-4 text-left font-bold text-[hsl(var(--primary))] shadow-sm"
              >
                ყველა: {currentParent.name}
              </button>
            )}
            
            <div className="grid gap-3">
              {currentList.map(node => (
                <button
                  key={node.id}
                  onClick={() => {
                    if (node.children.length > 0) {
                      setHistory([...history, node]);
                    } else {
                      handleSelect(node.slug);
                    }
                  }}
                  className="flex items-center justify-between rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 text-left font-semibold shadow-[var(--shadow-xs)] transition hover:border-[hsl(var(--primary)/.5)] active:scale-[0.98]"
                >
                  <span className="flex items-center gap-4 text-[15px]">
                    {!currentParent && <CategoryIcon name={node.icon} size={22} className="text-[hsl(var(--primary))]" />}
                    {node.name}
                  </span>
                  {node.children.length > 0 && <ChevronRight size={20} className="text-[hsl(var(--muted-foreground))]" />}
                </button>
              ))}
              {currentList.length === 0 && (
                <div className="py-10 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  ქვეკატეგორიები არ არის
                </div>
              )}
            </div>
            </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
