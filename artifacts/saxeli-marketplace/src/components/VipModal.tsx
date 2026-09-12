import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Zap, Crown, Check, AlertTriangle, ShieldCheck } from "lucide-react";
import {
  usePurchaseTestVip,
  getListItemsQueryKey,
  getGetItemQueryKey,
  getListMyItemsQueryKey,
} from "@workspace/api-client-react";
import type { MarketplaceItem } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

type VipModalProps = {
  item: MarketplaceItem | null;
  isOpen: boolean;
  onClose: () => void;
};

export function VipModal({ item, isOpen, onClose }: VipModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<'vip' | 'super_vip'>('vip');

  const purchaseMutation = usePurchaseTestVip({
    mutation: {
      onSuccess: (data) => {
        // Invalidate queries to refresh data
        if (item) {
          queryClient.invalidateQueries({ queryKey: getGetItemQueryKey(item.id) });
        }
        queryClient.invalidateQueries({ queryKey: getListMyItemsQueryKey() });
        // Since params might vary for list items, we invalidate all queries matching the base key
        queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });

        toast({
          title: "პრომოცია წარმატებით გააქტიურდა",
          description: `განცხადება "${data.item.title}" ახლა პრემიუმ სტატუსშია.`,
        });
        onClose();
      },
      onError: () => {
        toast({
          title: "შეცდომა გადახდისას",
          description: "პრომოციის გააქტიურება ვერ მოხერხდა. სცადეთ მოგვიანებით.",
          variant: "destructive",
        });
      },
    },
  });

  if (!item) return null;

  const handlePurchase = () => {
    purchaseMutation.mutate({
      id: item.id,
      data: { tier: selectedTier },
    });
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !purchaseMutation.isPending) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-[hsl(var(--background)/.8)] backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[101] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl"
          aria-describedby="vip-modal-description"
          onEscapeKeyDown={(event) => {
            if (purchaseMutation.isPending) event.preventDefault();
          }}
      >
        <Dialog.Close asChild>
          <button
            type="button"
            disabled={purchaseMutation.isPending}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--accent)/.1)] hover:text-[hsl(var(--foreground))] disabled:opacity-50"
            aria-label="დახურვა"
          >
            <X size={18} />
          </button>
        </Dialog.Close>

        <div className="p-6 sm:p-8">
          <div className="mb-6 text-center">
            <Dialog.Title id="vip-modal-title" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              განცხადების რეკლამირება
            </Dialog.Title>
            <Dialog.Description id="vip-modal-description" className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              გახადე შენი განცხადება შესამჩნევი და გაყიდე უფრო სწრაფად.
            </Dialog.Description>
          </div>

          <div className="mb-6 rounded-xl border border-[hsl(var(--accent)/.3)] bg-[hsl(var(--accent)/.05)] p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 shrink-0 text-[hsl(var(--accent))]" size={18} />
              <div>
                <h3 className="text-sm font-semibold text-[hsl(var(--accent))]">სატესტო გადახდა</h3>
                <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                  ეს არის სატესტო გარემო. რეალური თანხა არ ჩამოგეჭრებათ. პროცესი სრულდება მყისიერად.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* VIP Tier */}
            <label
              className={`relative flex cursor-pointer flex-col rounded-2xl border-2 p-4 transition-all ${
                selectedTier === 'vip'
                  ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent)/.05)]'
                  : 'border-[hsl(var(--border))] hover:border-[hsl(var(--accent)/.5)]'
              }`}
            >
              <input
                type="radio"
                name="vip_tier"
                value="vip"
                checked={selectedTier === 'vip'}
                onChange={() => setSelectedTier('vip')}
                className="sr-only"
              />
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-display text-lg font-semibold text-[hsl(var(--accent))]">
                  <Zap size={18} /> VIP
                </span>
                <span className="font-mono-ui font-bold">3 ₾</span>
              </div>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">7 დღით</p>
              <ul className="mt-4 space-y-2 text-xs text-[hsl(var(--foreground)/.8)]">
                <li className="flex items-center gap-2"><Check size={14} className="text-[hsl(var(--accent))]" /> იასამნისფერი ჩარჩო</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[hsl(var(--accent))]" /> VIP ნიშანი</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[hsl(var(--accent))]" /> პრიორიტეტი ძიებაში</li>
              </ul>
            </label>

            {/* Super VIP Tier */}
            <label
              className={`relative flex cursor-pointer flex-col rounded-2xl border-2 p-4 transition-all ${
                selectedTier === 'super_vip'
                  ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.05)]'
                  : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/.5)]'
              }`}
            >
              <input
                type="radio"
                name="vip_tier"
                value="super_vip"
                checked={selectedTier === 'super_vip'}
                onChange={() => setSelectedTier('super_vip')}
                className="sr-only"
              />
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-display text-lg font-semibold text-[hsl(var(--primary))]">
                  <Crown size={18} /> Super VIP
                </span>
                <span className="font-mono-ui font-bold">7 ₾</span>
              </div>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">7 დღით</p>
              <ul className="mt-4 space-y-2 text-xs text-[hsl(var(--foreground)/.8)]">
                <li className="flex items-center gap-2"><Check size={14} className="text-[hsl(var(--primary))]" /> ოქროსფერი ჩარჩო</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[hsl(var(--primary))]" /> Super VIP ნიშანი</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[hsl(var(--primary))]" /> ტოპ პოზიციები</li>
              </ul>
            </label>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={purchaseMutation.isPending}
              className="btn-ink flex-1 rounded-xl py-3.5 text-sm font-bold disabled:opacity-50"
            >
              გაუქმება
            </button>
            <button
              type="button"
              onClick={handlePurchase}
              disabled={purchaseMutation.isPending}
              className={`flex-1 rounded-xl py-3.5 text-sm font-bold text-[hsl(var(--primary-foreground))] shadow-md transition-all disabled:opacity-50 ${
                selectedTier === 'super_vip' ? 'bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/.9)]' : 'bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent)/.9)] text-[hsl(var(--accent-foreground))]'
              }`}
            >
              {purchaseMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <ShieldCheck size={18} className="animate-pulse" /> მუშავდება...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ShieldCheck size={18} /> გადახდა ({selectedTier === 'vip' ? '3' : '7'} ₾)
                </span>
              )}
            </button>
          </div>
        </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
