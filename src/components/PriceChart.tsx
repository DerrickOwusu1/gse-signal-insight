import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceData {
  timestamp: string;
  price: number;
  volume: number;
  date: string;
  time: string;
}

interface PriceChartProps {
  stockId: string;
  ticker: string;
  currentPrice: number;
  previousClose: number;
  compact?: boolean;
}

export function PriceChart({ stockId, ticker, currentPrice, previousClose, compact = false }: PriceChartProps) {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [timeRange, setTimeRange] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1D');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPriceData();
  }, [stockId, timeRange]);

  const fetchPriceData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '1D':
          startDate.setDate(now.getDate() - 1);
          break;
        case '1W':
          startDate.setDate(now.getDate() - 7);
          break;
        case '1M':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '3M':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '1Y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const { data, error } = await supabase
        .from('stock_prices')
        .select('*')
        .eq('stock_id', stockId)
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      const formattedData = (data || []).map(item => ({
        ...item,
        date: new Date(item.timestamp).toLocaleDateString(),
        time: new Date(item.timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }));

      setPriceData(formattedData);
    } catch (error) {
      console.error('Error fetching price data:', error);
      // Generate mock data for demonstration
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    const data: PriceData[] = [];
    const now = new Date();
    const points = timeRange === '1D' ? 24 : timeRange === '1W' ? 7 : 30;
    
    for (let i = points; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * (timeRange === '1D' ? 3600000 : 86400000));
      const price = currentPrice + (Math.random() - 0.5) * currentPrice * 0.1;
      
      data.push({
        timestamp: timestamp.toISOString(),
        price: Math.max(price, 0.01),
        volume: Math.floor(Math.random() * 100000) + 10000,
        date: timestamp.toLocaleDateString(),
        time: timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      });
    }
    setPriceData(data);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatTooltipLabel = (label: string, payload: any[]) => {
    if (payload && payload.length > 0) {
      const data = payload[0].payload;
      return timeRange === '1D' ? data.time : data.date;
    }
    return label;
  };

  const isPositive = currentPrice > previousClose;
  const changePercent = ((currentPrice - previousClose) / previousClose) * 100;

  const chartHeight = compact ? 200 : 400;
  const showControls = !compact;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`bg-muted/20 rounded-lg flex items-center justify-center`} style={{ height: chartHeight }}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading chart...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{compact ? `${ticker}` : `${ticker} Price Chart`}</CardTitle>
            {!compact && (
              <div className={cn(
                "flex items-center space-x-2 text-sm mt-1",
                isPositive ? "text-tier-a" : "text-tier-c"
              )}>
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>
                  {isPositive ? '+' : ''}{changePercent.toFixed(2)}% 
                  ({isPositive ? '+' : ''}{formatCurrency(currentPrice - previousClose)})
                </span>
              </div>
            )}
          </div>
          {showControls && (
            <div className="flex space-x-1">
              {(['1D', '1W', '1M', '3M', '1Y'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className="h-8 px-3"
                >
                  {range}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={priceData}>
              <defs>
                <linearGradient id={`colorPrice-${stockId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? "hsl(var(--tier-a))" : "hsl(var(--tier-c))"} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isPositive ? "hsl(var(--tier-a))" : "hsl(var(--tier-c))"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey={timeRange === '1D' ? 'time' : 'date'}
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={['dataMin - 0.01', 'dataMax + 0.01']}
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `₵${value.toFixed(2)}`}
              />
              <Tooltip
                labelFormatter={formatTooltipLabel}
                formatter={(value: number) => [formatCurrency(value), 'Price']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? "hsl(var(--tier-a))" : "hsl(var(--tier-c))"}
                strokeWidth={2}
                fill={`url(#colorPrice-${stockId})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}