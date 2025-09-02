import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { StockTable } from "@/components/StockTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge } from "@/components/TierBadge";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, DollarSign, Activity, Clock } from "lucide-react";
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
  stock: {
    ticker: string;
    company_name: string;
  };
}

export default function Dashboard() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch top stocks
      const { data: stocksData, error: stocksError } = await supabase
        .from('stocks')
        .select('*')
        .eq('is_active', true)
        .order('score', { ascending: false })
        .limit(20);

      if (stocksError) throw stocksError;

      // Fetch recent alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('alerts')
        .select(`
          *,
          stock:stocks(ticker, company_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (alertsError) throw alertsError;

      setStocks((stocksData as Stock[]) || []);
      setAlerts((alertsData as Alert[]) || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalStocks = stocks.length;
  const alertsToday = alerts.filter(alert => 
    new Date(alert.created_at).toDateString() === new Date().toDateString()
  ).length;

  const gseCompositeIndex = 2847.32; // Mock GSE Composite Index
  const totalMarketCap = stocks.reduce((sum, stock) => sum + stock.market_cap, 0);

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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-6">
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">GSE Stocks Monitored</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStocks}</div>
              <p className="text-xs text-muted-foreground">
                Active stocks tracked
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alerts Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alertsToday}</div>
              <p className="text-xs text-muted-foreground">
                New alerts generated
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">GSE Composite Index</CardTitle>
              <TrendingUp className="h-4 w-4 text-tier-a" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{gseCompositeIndex.toFixed(2)}</div>
              <p className="text-xs text-tier-a">
                +1.2% from yesterday
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Market Cap</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatLargeNumber(totalMarketCap)}</div>
              <p className="text-xs text-muted-foreground">
                Combined market value
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Top Stocks */}
          <div className="lg:col-span-2">
            <StockTable 
              stocks={stocks.slice(0, 10)} 
              title="Top-Ranked Stocks"
            />
          </div>

          {/* Alerts Feed */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {alerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent alerts</p>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <TierBadge tier={alert.tier} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">
                            {alert.stock.ticker}
                          </p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimeAgo(alert.created_at)}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {alert.trigger_type} • {formatCurrency(alert.price)}
                        </p>
                        <p className="text-xs text-foreground">
                          {alert.rationale}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}