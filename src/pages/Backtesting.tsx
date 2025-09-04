import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Play, Save, Trash2, BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface Stock {
  id: string;
  ticker: string;
  company_name: string;
  tier: 'A' | 'B' | 'C';
  sector: string;
}

interface BacktestParams {
  name: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  strategy: string;
  stocks: string[];
  riskManagement: {
    stopLoss: number;
    takeProfit: number;
    maxPositionSize: number;
  };
  rebalanceFrequency: string;
}

interface BacktestResult {
  id: string;
  name: string;
  status: string;
  parameters: any;
  results: any;
  created_at: string;
  completed_at: string;
}

const strategies = [
  { value: 'buy_and_hold', label: 'Buy and Hold' },
  { value: 'momentum', label: 'Momentum Strategy' },
  { value: 'mean_reversion', label: 'Mean Reversion' },
  { value: 'tier_based', label: 'Tier-Based Investment' },
  { value: 'volume_breakout', label: 'Volume Breakout' },
];

const rebalanceFrequencies = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
];

export default function Backtesting() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [backtests, setBacktests] = useState<BacktestResult[]>([]);
  const [selectedBacktest, setSelectedBacktest] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<BacktestParams>({
    name: '',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    initialCapital: 100000,
    strategy: 'buy_and_hold',
    stocks: [],
    riskManagement: {
      stopLoss: 10,
      takeProfit: 20,
      maxPositionSize: 20,
    },
    rebalanceFrequency: 'monthly',
  });

  useEffect(() => {
    if (user) {
      fetchStocks();
      fetchBacktests();
    }
  }, [user]);

  const fetchStocks = async () => {
    try {
      const { data, error } = await supabase
        .from('stocks')
        .select('id, ticker, company_name, tier, sector')
        .eq('is_active', true)
        .order('ticker');

      if (error) throw error;
      setStocks((data || []) as Stock[]);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    }
  };

  const fetchBacktests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('backtests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBacktests(data || []);
    } catch (error) {
      console.error('Error fetching backtests:', error);
    }
  };

  const runBacktest = async () => {
    if (!user || !params.name) {
      toast({
        title: "Error",
        description: "Please provide a name for your backtest",
        variant: "destructive",
      });
      return;
    }

    if (params.stocks.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one stock",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create backtest record
      const { data: backtestData, error: backtestError } = await supabase
        .from('backtests')
        .insert({
          user_id: user.id,
          name: params.name,
          parameters: params as any,
          status: 'running'
        })
        .select()
        .single();

      if (backtestError) throw backtestError;

      // Simulate backtest execution (in real app, this would trigger an edge function)
      setTimeout(async () => {
        const mockResults = generateMockBacktestResults(params);
        
        const { error: updateError } = await supabase
          .from('backtests')
          .update({
            status: 'completed',
            results: mockResults,
            completed_at: new Date().toISOString()
          })
          .eq('id', backtestData.id);

        if (updateError) throw updateError;

        toast({
          title: "Backtest Complete",
          description: `${params.name} has finished running`,
        });

        fetchBacktests();
        setLoading(false);
      }, 3000);

      toast({
        title: "Backtest Started",
        description: `Running backtest: ${params.name}`,
      });

    } catch (error) {
      console.error('Error running backtest:', error);
      toast({
        title: "Error",
        description: "Failed to start backtest",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const generateMockBacktestResults = (params: BacktestParams) => {
    const days = Math.floor((new Date(params.endDate).getTime() - new Date(params.startDate).getTime()) / (1000 * 60 * 60 * 24));
    const performanceData = [];
    let portfolioValue = params.initialCapital;
    
    for (let i = 0; i <= days; i += 7) { // Weekly data points
      const date = new Date(new Date(params.startDate).getTime() + i * 24 * 60 * 60 * 1000);
      const randomReturn = (Math.random() - 0.5) * 0.04; // ±2% weekly return
      portfolioValue *= (1 + randomReturn);
      
      performanceData.push({
        date: date.toISOString().split('T')[0],
        portfolioValue: Math.round(portfolioValue),
        benchmark: Math.round(params.initialCapital * Math.pow(1.08, i / 365)), // 8% annual benchmark
      });
    }

    const finalValue = performanceData[performanceData.length - 1].portfolioValue;
    const totalReturn = ((finalValue - params.initialCapital) / params.initialCapital) * 100;
    const annualizedReturn = (Math.pow(finalValue / params.initialCapital, 365 / days) - 1) * 100;
    
    return {
      performanceData,
      metrics: {
        totalReturn: totalReturn.toFixed(2),
        annualizedReturn: annualizedReturn.toFixed(2),
        sharpeRatio: (1.2 + Math.random() * 0.8).toFixed(2),
        maxDrawdown: (Math.random() * 15 + 5).toFixed(2),
        winRate: (55 + Math.random() * 20).toFixed(1),
        totalTrades: Math.floor(Math.random() * 50) + 20,
        finalValue: Math.round(finalValue),
      }
    };
  };

  const deleteBacktest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('backtests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBacktests(backtests.filter(b => b.id !== id));
      if (selectedBacktest?.id === id) {
        setSelectedBacktest(null);
      }

      toast({
        title: "Backtest Deleted",
        description: "Backtest has been removed",
      });
    } catch (error) {
      console.error('Error deleting backtest:', error);
      toast({
        title: "Error",
        description: "Failed to delete backtest",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
              <p className="text-muted-foreground mb-6">
                Please sign in to access backtesting features
              </p>
              <Button asChild>
                <a href="/auth">Sign In</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Strategy Backtesting</h1>
          <p className="text-muted-foreground">Test your trading strategies against historical GSE data</p>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">Create Backtest</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Configuration Panel */}
              <Card>
                <CardHeader>
                  <CardTitle>Backtest Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Backtest Name</Label>
                    <Input
                      id="name"
                      value={params.name}
                      onChange={(e) => setParams({ ...params, name: e.target.value })}
                      placeholder="My Strategy"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={params.startDate}
                        onChange={(e) => setParams({ ...params, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={params.endDate}
                        onChange={(e) => setParams({ ...params, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="capital">Initial Capital (GHS)</Label>
                    <Input
                      id="capital"
                      type="number"
                      value={params.initialCapital}
                      onChange={(e) => setParams({ ...params, initialCapital: Number(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="strategy">Strategy</Label>
                    <Select value={params.strategy} onValueChange={(value) => setParams({ ...params, strategy: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {strategies.map(strategy => (
                          <SelectItem key={strategy.value} value={strategy.value}>
                            {strategy.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="rebalance">Rebalance Frequency</Label>
                    <Select value={params.rebalanceFrequency} onValueChange={(value) => setParams({ ...params, rebalanceFrequency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {rebalanceFrequencies.map(freq => (
                          <SelectItem key={freq.value} value={freq.value}>
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="stopLoss">Stop Loss (%)</Label>
                    <Input
                      id="stopLoss"
                      type="number"
                      value={params.riskManagement.stopLoss}
                      onChange={(e) => setParams({
                        ...params,
                        riskManagement: { ...params.riskManagement, stopLoss: Number(e.target.value) }
                      })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="takeProfit">Take Profit (%)</Label>
                    <Input
                      id="takeProfit"
                      type="number"
                      value={params.riskManagement.takeProfit}
                      onChange={(e) => setParams({
                        ...params,
                        riskManagement: { ...params.riskManagement, takeProfit: Number(e.target.value) }
                      })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxPosition">Max Position Size (%)</Label>
                    <Input
                      id="maxPosition"
                      type="number"
                      value={params.riskManagement.maxPositionSize}
                      onChange={(e) => setParams({
                        ...params,
                        riskManagement: { ...params.riskManagement, maxPositionSize: Number(e.target.value) }
                      })}
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={runBacktest}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Running Backtest...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Run Backtest
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stock Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Stocks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {stocks.map(stock => (
                    <label key={stock.id} className="flex items-center space-x-2 p-2 rounded border hover:bg-accent cursor-pointer">
                      <input
                        type="checkbox"
                        checked={params.stocks.includes(stock.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setParams({ ...params, stocks: [...params.stocks, stock.id] });
                          } else {
                            setParams({ ...params, stocks: params.stocks.filter(id => id !== stock.id) });
                          }
                        }}
                      />
                      <span className="text-sm font-medium">{stock.ticker}</span>
                      <Badge variant="outline" className="text-xs">
                        {stock.tier}
                      </Badge>
                    </label>
                  ))}
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  Selected: {params.stocks.length} stocks
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            {selectedBacktest && selectedBacktest.results ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{selectedBacktest.name} Results</span>
                      <Badge variant={selectedBacktest.status === 'completed' ? 'default' : 'secondary'}>
                        {selectedBacktest.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-tier-a" />
                            <span className="text-sm font-medium">Total Return</span>
                          </div>
                          <div className="text-2xl font-bold text-tier-a">
                            +{selectedBacktest.results.metrics.totalReturn}%
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Annualized Return</span>
                          </div>
                          <div className="text-2xl font-bold">
                            {selectedBacktest.results.metrics.annualizedReturn}%
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Sharpe Ratio</span>
                          </div>
                          <div className="text-2xl font-bold">
                            {selectedBacktest.results.metrics.sharpeRatio}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Final Value</span>
                          </div>
                          <div className="text-2xl font-bold">
                            {formatCurrency(selectedBacktest.results.metrics.finalValue)}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Portfolio Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div style={{ height: 400 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={selectedBacktest.results.performanceData}>
                              <defs>
                                <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(var(--tier-a))" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="hsl(var(--tier-a))" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                              <XAxis dataKey="date" />
                              <YAxis tickFormatter={(value) => formatCurrency(value)} />
                              <Tooltip
                                formatter={(value: number, name: string) => [
                                  formatCurrency(value),
                                  name === 'portfolioValue' ? 'Portfolio' : 'Benchmark'
                                ]}
                              />
                              <Area
                                type="monotone"
                                dataKey="portfolioValue"
                                stroke="hsl(var(--tier-a))"
                                strokeWidth={2}
                                fill="url(#colorPortfolio)"
                              />
                              <Line
                                type="monotone"
                                dataKey="benchmark"
                                stroke="hsl(var(--muted-foreground))"
                                strokeWidth={1}
                                strokeDasharray="5 5"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Results Selected</h3>
                  <p className="text-muted-foreground">
                    Select a completed backtest from the history tab to view results
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Backtest History</CardTitle>
              </CardHeader>
              <CardContent>
                {backtests.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No backtests yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Create your first backtest to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {backtests.map(backtest => (
                      <div key={backtest.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold">{backtest.name}</h3>
                            <Badge variant={backtest.status === 'completed' ? 'default' : 
                                          backtest.status === 'running' ? 'secondary' : 'destructive'}>
                              {backtest.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Created: {new Date(backtest.created_at).toLocaleDateString()}
                            {backtest.completed_at && (
                              <span> • Completed: {new Date(backtest.completed_at).toLocaleDateString()}</span>
                            )}
                          </div>
                          {backtest.results && (
                            <div className="text-sm mt-1">
                              <span className={cn(
                                "font-medium",
                                Number(backtest.results.metrics.totalReturn) >= 0 ? "text-tier-a" : "text-tier-c"
                              )}>
                                {Number(backtest.results.metrics.totalReturn) >= 0 ? '+' : ''}
                                {backtest.results.metrics.totalReturn}% return
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {backtest.status === 'completed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedBacktest(backtest)}
                            >
                              View Results
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteBacktest(backtest.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}