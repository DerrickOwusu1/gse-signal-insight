import { useState, useEffect } from "react";
import { StockTable } from "@/components/StockTable";
import { DashboardCharts } from "@/components/DashboardCharts";
import { AlertsManager } from "@/components/AlertsManager";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

export default function Dashboard() {
  const { user } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      const { data, error } = await supabase
        .from('stocks')
        .select('*')
        .eq('is_active', true)
        .order('score', { ascending: false });

      if (error) throw error;
      setStocks((data || []) as Stock[]);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading market data...</p>
        </div>
      </div>
    );
  }

  // Show simplified layout for non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="flex h-16 items-center px-6">
            <div className="flex items-center space-x-4">
              <a href="/" className="flex items-center space-x-2">
                <BarChart3 className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold">VolumeSignal</span>
              </a>
            </div>
            <div className="ml-auto">
              <Button asChild>
                <a href="/auth">Sign In</a>
              </Button>
            </div>
          </div>
        </header>
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">GSE Market Overview</h1>
            <p className="text-muted-foreground">Live Ghana Stock Exchange data</p>
          </div>
          
          <DashboardCharts stocks={stocks} />
          
          <div className="mt-8">
            <StockTable stocks={stocks} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Monitor Ghana Stock Exchange activity</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <DashboardCharts stocks={stocks} />
          </div>
          <div className="lg:col-span-1">
            <AlertsManager />
          </div>
        </div>
        
        <div className="mt-8">
          <StockTable stocks={stocks} />
        </div>
      </div>
    </Layout>
  );
}