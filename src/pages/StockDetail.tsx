import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/TierBadge";
import { supabase } from "@/integrations/supabase/client";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stock {
  id: string;
  ticker: string;
  company_name: string;
  sector: string;
  current_price: number;
  previous_close: number;
  volume: number;
  market_cap: number;
  pe_ratio: number;
  pb_ratio: number;
  roe: number;
  dividend_yield: number;
  score: number;
  tier: 'A' | 'B' | 'C';
}

interface Alert {
  id: string;
  trigger_type: string;
  tier: 'A' | 'B' | 'C';
  price: number;
  rationale: string;
  created_at: string;
}

export default function StockDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const [stock, setStock] = useState<Stock | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ticker) {
      fetchStockData();
    }
  }, [ticker]);

  const fetchStockData = async () => {
    try {
      // Fetch stock data
      const { data: stockData, error: stockError } = await supabase
        .from('stocks')
        .select('*')
        .eq('ticker', ticker)
        .single();

      if (stockError) throw stockError;

      // Fetch alerts for this stock
      const { data: alertsData, error: alertsError } = await supabase
        .from('alerts')
        .select('*')
        .eq('stock_id', stockData.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (alertsError) throw alertsError;

      setStock(stockData as Stock);
      setAlerts((alertsData as Alert[]) || []);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatLargeNumber = (value: number) => {
    if (value >= 1e9) {
      return `₵${(value / 1e9).toFixed(1)}B`;
    } else if (value >= 1e6) {
      return `₵${(value / 1e6).toFixed(1)}M`;
    }
    return formatCurrency(value);
  };

  const getChangePercentage = (current: number, previous: number) => {
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading stock details...</div>
        </div>
      </Layout>
    );
  }

  if (!stock) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Stock not found</div>
        </div>
      </Layout>
    );
  }

  const changePercent = getChangePercentage(stock.current_price, stock.previous_close);
  const isPositive = changePercent > 0;

  return (
    <Layout>
      <div className="space-y-6 p-6">
        {/* Stock Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <TierBadge tier={stock.tier} className="w-8 h-8 text-sm" />
            <div>
              <h1 className="text-3xl font-bold">{stock.ticker}</h1>
              <p className="text-lg text-muted-foreground">{stock.company_name}</p>
              <p className="text-sm text-muted-foreground">{stock.sector}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{formatCurrency(stock.current_price)}</div>
            <div className={cn(
              "flex items-center justify-end space-x-1 text-sm",
              isPositive ? "text-tier-a" : "text-tier-c"
            )}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>
                {isPositive ? '+' : ''}{changePercent.toFixed(2)}% 
                ({isPositive ? '+' : ''}{formatCurrency(stock.current_price - stock.previous_close)})
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add to Watchlist
          </Button>
          <Button variant="outline">
            Set Alert
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Price Chart Placeholder */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Price Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Price chart will be implemented here</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fundamental Metrics */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Fundamental Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Score</span>
                  <span className="font-medium">{stock.score}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">P/E Ratio</span>
                  <span className="font-medium">{stock.pe_ratio?.toFixed(1) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">P/B Ratio</span>
                  <span className="font-medium">{stock.pb_ratio?.toFixed(1) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ROE</span>
                  <span className="font-medium">{stock.roe?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dividend Yield</span>
                  <span className="font-medium">{stock.dividend_yield?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market Cap</span>
                  <span className="font-medium">{formatLargeNumber(stock.market_cap)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="font-medium">{stock.volume.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Alert History */}
        <Card>
          <CardHeader>
            <CardTitle>Alert History</CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-muted-foreground">No alerts for this stock</p>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                    <TierBadge tier={alert.tier} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{alert.trigger_type}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(alert.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Price: {formatCurrency(alert.price)}
                      </p>
                      <p className="text-sm">{alert.rationale}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* News Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Latest News</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-muted/20 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">News feed will be implemented here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}