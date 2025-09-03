import { LineChart, Line, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MiniPriceChartProps {
  data: { price: number; time: string }[];
  currentPrice: number;
  previousClose: number;
  className?: string;
}

export function MiniPriceChart({ data, currentPrice, previousClose, className }: MiniPriceChartProps) {
  const isPositive = currentPrice > previousClose;
  const changePercent = ((currentPrice - previousClose) / previousClose) * 100;

  // Generate sample data if no data provided
  const chartData = data.length > 0 ? data : generateSampleData(currentPrice);

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center space-x-2">
        <div className={cn(
          "flex items-center space-x-1 text-sm",
          isPositive ? "text-tier-a" : "text-tier-c"
        )}>
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span className="font-medium">
            {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
          </span>
        </div>
      </div>
      
      <div className="w-16 h-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke={isPositive ? "hsl(var(--tier-a))" : "hsl(var(--tier-c))"}
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function generateSampleData(basePrice: number): { price: number; time: string }[] {
  const data = [];
  for (let i = 0; i < 10; i++) {
    const variation = (Math.random() - 0.5) * basePrice * 0.05;
    data.push({
      price: basePrice + variation,
      time: `${i}:00`
    });
  }
  return data;
}