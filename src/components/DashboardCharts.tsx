import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceChart } from "@/components/PriceChart";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";

interface Stock {
  id: string;
  ticker: string;
  company_name: string;
  current_price: number;
  previous_close: number;
  volume: number;
  market_cap: number;
  tier: 'A' | 'B' | 'C';
}

interface DashboardChartsProps {
  stocks: Stock[];
}

export function DashboardCharts({ stocks }: DashboardChartsProps) {
  // Market overview data
  const marketData = stocks.slice(0, 5).map(stock => ({
    ticker: stock.ticker,
    price: stock.current_price,
    change: ((stock.current_price - stock.previous_close) / stock.previous_close) * 100,
    volume: stock.volume,
    marketCap: stock.market_cap
  }));

  // Volume analysis
  const volumeData = stocks
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 8)
    .map(stock => ({
      ticker: stock.ticker,
      volume: stock.volume,
      price: stock.current_price
    }));

  // Tier distribution
  const tierData = [
    { 
      tier: 'A', 
      count: stocks.filter(s => s.tier === 'A').length,
      color: 'hsl(var(--tier-a))'
    },
    { 
      tier: 'B', 
      count: stocks.filter(s => s.tier === 'B').length,
      color: 'hsl(var(--tier-b))'
    },
    { 
      tier: 'C', 
      count: stocks.filter(s => s.tier === 'C').length,
      color: 'hsl(var(--tier-c))'
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatVolume = (value: number) => {
    if (value >= 1e6) {
      return `${(value / 1e6).toFixed(1)}M`;
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(0)}K`;
    }
    return value.toString();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Top Stock Chart */}
      {stocks.length > 0 && (
        <div className="lg:col-span-2">
          <PriceChart 
            stockId={stocks[0].id}
            ticker={stocks[0].ticker}
            currentPrice={stocks[0].current_price}
            previousClose={stocks[0].previous_close}
            compact
          />
        </div>
      )}

      {/* Market Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Top Performers</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={marketData}>
                <defs>
                  <linearGradient id="colorChange" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--tier-a))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--tier-a))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="ticker" 
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Change']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="change"
                  stroke="hsl(var(--tier-a))"
                  strokeWidth={2}
                  fill="url(#colorChange)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Volume Leaders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Volume Leaders</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  type="number"
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickFormatter={formatVolume}
                />
                <YAxis 
                  type="category"
                  dataKey="ticker"
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  width={60}
                />
                <Tooltip
                  formatter={(value: number) => [formatVolume(value), 'Volume']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="volume" 
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tier Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Stock Tier Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tierData.map((tier) => (
              <div key={tier.tier} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: tier.color }}
                  />
                  <span className="font-medium">Tier {tier.tier}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">{tier.count}</span>
                  <span className="text-sm text-muted-foreground">stocks</span>
                </div>
              </div>
            ))}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-3 gap-2">
                {tierData.map((tier) => (
                  <div 
                    key={tier.tier}
                    className="h-2 rounded-full"
                    style={{ 
                      backgroundColor: tier.color,
                      opacity: tier.count > 0 ? 1 : 0.2,
                      flex: tier.count || 1
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}