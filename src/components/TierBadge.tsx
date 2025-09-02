import { cn } from "@/lib/utils";

interface TierBadgeProps {
  tier: 'A' | 'B' | 'C';
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  const variants = {
    A: "bg-tier-a text-tier-a-foreground",
    B: "bg-tier-b text-tier-b-foreground", 
    C: "bg-tier-c text-tier-c-foreground"
  };

  return (
    <span className={cn(
      "inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full",
      variants[tier],
      className
    )}>
      {tier}
    </span>
  );
}