import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Remove auto-redirect to dashboard to allow browsing without auth

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background"></div>
        <div className="relative">
          <div className="container mx-auto px-4 py-24">
            <div className="text-center max-w-4xl mx-auto">
              <div className="flex justify-center mb-8">
                <BarChart3 className="h-16 w-16 text-primary" />
              </div>
              <h1 className="text-5xl font-bold tracking-tight mb-6">
                VolumeSignal
              </h1>
              <h2 className="text-2xl text-muted-foreground mb-8">
                Ghana Stock Exchange Monitoring Platform
              </h2>
              <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
                Track GSE stocks with intelligent scoring, real-time alerts, portfolio management, 
                and advanced backtesting capabilities. Make informed investment decisions with 
                professional-grade analytics.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <a href="/dashboard">Explore Dashboard</a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="/auth">Sign In</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Professional GSE Analytics</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to monitor and analyze Ghana Stock Exchange investments
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-tier-a/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-6 w-6 text-tier-a" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Intelligent Scoring</h3>
            <p className="text-muted-foreground">
              AI-powered tier classification (A/B/C) with comprehensive scoring metrics
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-tier-b/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-6 w-6 text-tier-b" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Alerts</h3>
            <p className="text-muted-foreground">
              Get notified of volume spikes, breakouts, and other market signals
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-tier-c/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-6 w-6 text-tier-c" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Portfolio Management</h3>
            <p className="text-muted-foreground">
              Track your holdings, P&L, and performance with detailed analytics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
