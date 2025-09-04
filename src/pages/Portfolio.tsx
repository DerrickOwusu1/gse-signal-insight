import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TierBadge } from "@/components/TierBadge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface PortfolioPosition {
  id: string;
  shares: number;
  avg_cost: number;
  stock: {
    id: string;
    ticker: string;
    company_name: string;
    current_price: number;
    tier: string;
    sector: string;
  };
}

interface Trade {
  id: string;
  trade_type: string;
  shares: number;
  price: number;
  fees: number;
  executed_at: string;
  stock: {
    ticker: string;
    company_name: string;
  };
}

export default function Portfolio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchPortfolioData();
  }, [user, navigate]);

  const fetchPortfolioData = async () => {
    if (!user) return;
    
    try {
      // Fetch portfolio positions
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolios')
        .select(`
          *,
          stock:stocks(*)
        `)
        .eq('user_id', user.id);

      if (portfolioError) throw portfolioError;

      // Fetch recent trades
      const { data: tradesData, error: tradesError } = await supabase
        .from('trades')
        .select(`
          *,
          stock:stocks(ticker, company_name)
        `)
        .eq('user_id', user.id)
        .order('executed_at', { ascending: false })
        .limit(10);

      if (tradesError) throw tradesError;

      setPositions(portfolioData || []);
      setTrades(tradesData || []);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to load portfolio data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removePosition = async (positionId: string) => {
    try {
      const { error } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', positionId);

      if (error) throw error;

      setPositions(positions.filter(p => p.id !== positionId));
      toast({
        title: "Success",
        description: "Position removed from portfolio",
      });
    } catch (error) {
      console.error('Error removing position:', error);
      toast({
        title: "Error",
        description: "Failed to remove position",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const calculateMetrics = () => {
    const totalValue = positions.reduce((sum, pos) => sum + (pos.shares * pos.stock.current_price), 0);
    const totalCost = positions.reduce((sum, pos) => sum + (pos.shares * pos.avg_cost), 0);
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return { totalValue, totalCost, totalGainLoss, totalGainLossPercent };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <Button onClick={() => navigate('/dashboard')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Position
          </Button>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.totalCost)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Gain/Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold flex items-center",
                metrics.totalGainLoss >= 0 ? "text-tier-a" : "text-tier-c"
              )}>
                {metrics.totalGainLoss >= 0 ? (
                  <TrendingUp className="h-5 w-5 mr-1" />
                ) : (
                  <TrendingDown className="h-5 w-5 mr-1" />
                )}
                {formatCurrency(metrics.totalGainLoss)}
                <span className="text-sm ml-2">
                  ({metrics.totalGainLossPercent >= 0 ? '+' : ''}{metrics.totalGainLossPercent.toFixed(2)}%)
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Positions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Positions</CardTitle>
          </CardHeader>
          <CardContent>
            {positions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No positions yet</p>
                <Button onClick={() => navigate('/dashboard')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Position
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {positions.map((position) => {
                  const currentValue = position.shares * position.stock.current_price;
                  const costBasis = position.shares * position.avg_cost;
                  const gainLoss = currentValue - costBasis;
                  const gainLossPercent = (gainLoss / costBasis) * 100;

                  return (
                    <div key={position.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold">{position.stock.ticker}</h3>
                            <TierBadge tier={position.stock.tier as 'A' | 'B' | 'C'} />
                          </div>
                          <p className="text-sm text-muted-foreground">{position.stock.company_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {position.shares.toLocaleString()} shares @ {formatCurrency(position.avg_cost)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="font-semibold">{formatCurrency(currentValue)}</div>
                        <div className={cn(
                          "text-sm flex items-center justify-end",
                          gainLoss >= 0 ? "text-tier-a" : "text-tier-c"
                        )}>
                          {gainLoss >= 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {formatCurrency(gainLoss)} ({gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%)
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePosition(position.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Trades */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
          </CardHeader>
          <CardContent>
            {trades.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No trades yet</p>
            ) : (
              <div className="space-y-4">
                {trades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-4">
                      <Badge variant={trade.trade_type === 'buy' ? 'default' : 'destructive'}>
                        {trade.trade_type.toUpperCase()}
                      </Badge>
                      <div>
                        <div className="font-medium">{trade.stock.ticker}</div>
                        <div className="text-sm text-muted-foreground">
                          {trade.shares.toLocaleString()} shares
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(trade.price)}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(trade.executed_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}