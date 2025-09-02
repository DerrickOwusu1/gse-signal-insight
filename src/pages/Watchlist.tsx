import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { StockTable } from "@/components/StockTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

interface Portfolio {
  id: string;
  shares: number;
  avg_cost: number;
  stock: Stock;
}

export default function Watchlist() {
  const { user } = useAuth();
  const [watchlistStocks, setWatchlistStocks] = useState<Stock[]>([]);
  const [portfolioStocks, setPortfolioStocks] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch watchlist
      const { data: watchlistData, error: watchlistError } = await supabase
        .from('watchlists')
        .select(`
          stock:stocks(*)
        `)
        .eq('user_id', user.id);

      if (watchlistError) throw watchlistError;

      // Fetch portfolio
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolios')
        .select(`
          *,
          stock:stocks(*)
        `)
        .eq('user_id', user.id);

      if (portfolioError) throw portfolioError;

      const watchlistStocks = watchlistData?.map(item => item.stock).filter(Boolean) || [];
      setWatchlistStocks(watchlistStocks as Stock[]);
      setPortfolioStocks((portfolioData as Portfolio[]) || []);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const calculatePortfolioValue = () => {
    return portfolioStocks.reduce((total, position) => {
      return total + (position.shares * position.stock.current_price);
    }, 0);
  };

  const calculatePortfolioCost = () => {
    return portfolioStocks.reduce((total, position) => {
      return total + (position.shares * position.avg_cost);
    }, 0);
  };

  const portfolioValue = calculatePortfolioValue();
  const portfolioCost = calculatePortfolioCost();
  const portfolioPnL = portfolioValue - portfolioCost;
  const portfolioReturn = portfolioCost > 0 ? (portfolioPnL / portfolioCost) * 100 : 0;

  const winners = portfolioStocks.filter(p => p.stock.current_price > p.avg_cost).length;
  const losers = portfolioStocks.filter(p => p.stock.current_price < p.avg_cost).length;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading watchlist...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Watchlist & Portfolio</h1>
        </div>

        {/* Portfolio Summary */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(portfolioValue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Return</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {portfolioReturn >= 0 ? '+' : ''}{portfolioReturn.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {portfolioPnL >= 0 ? '+' : ''}{formatCurrency(portfolioPnL)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Winners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-tier-a">{winners}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Losers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-tier-c">{losers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Holdings */}
        {portfolioStocks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Stock</th>
                      <th className="text-right p-2">Shares</th>
                      <th className="text-right p-2">Avg Cost</th>
                      <th className="text-right p-2">Current Price</th>
                      <th className="text-right p-2">Market Value</th>
                      <th className="text-right p-2">P&L</th>
                      <th className="text-right p-2">Return %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioStocks.map((position) => {
                      const marketValue = position.shares * position.stock.current_price;
                      const costBasis = position.shares * position.avg_cost;
                      const pnl = marketValue - costBasis;
                      const returnPercent = (pnl / costBasis) * 100;
                      
                      return (
                        <tr key={position.id} className="border-b hover:bg-muted/50">
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{position.stock.ticker}</div>
                              <div className="text-xs text-muted-foreground">{position.stock.company_name}</div>
                            </div>
                          </td>
                          <td className="text-right p-2">{position.shares.toLocaleString()}</td>
                          <td className="text-right p-2">{formatCurrency(position.avg_cost)}</td>
                          <td className="text-right p-2">{formatCurrency(position.stock.current_price)}</td>
                          <td className="text-right p-2">{formatCurrency(marketValue)}</td>
                          <td className={`text-right p-2 ${pnl >= 0 ? 'text-tier-a' : 'text-tier-c'}`}>
                            {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                          </td>
                          <td className={`text-right p-2 ${returnPercent >= 0 ? 'text-tier-a' : 'text-tier-c'}`}>
                            {returnPercent >= 0 ? '+' : ''}{returnPercent.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Watchlist */}
        {watchlistStocks.length > 0 ? (
          <StockTable 
            stocks={watchlistStocks} 
            title="Watchlist"
            showAddToWatchlist={false}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Watchlist</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Your watchlist is empty. Add stocks from the dashboard to start tracking them.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}