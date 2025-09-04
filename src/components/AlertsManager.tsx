import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TierBadge } from "@/components/TierBadge";
import { useToast } from "@/hooks/use-toast";
import { Bell, X, Check, TrendingUp, TrendingDown, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  trigger_type: string;
  tier: string;
  price: number;
  rationale: string;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  stock_id: string;
  stocks?: {
    ticker: string;
    company_name: string;
    current_price: number;
  };
}

export function AlertsManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
  }, [user]);

  const fetchAlerts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          stocks (ticker, company_name, current_price)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: "Error",
        description: "Failed to load alerts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_dismissed: true })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(alerts.filter(alert => alert.id !== alertId));
      toast({
        title: "Alert dismissed",
        description: "Alert has been removed from your list",
      });
    } catch (error) {
      console.error('Error dismissing alert:', error);
      toast({
        title: "Error",
        description: "Failed to dismiss alert",
        variant: "destructive",
      });
    }
  };

  const getAlertIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'volume_spike':
        return <Volume2 className="h-4 w-4" />;
      case 'price_breakout':
        return <TrendingUp className="h-4 w-4" />;
      case 'price_breakdown':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertTypeLabel = (triggerType: string) => {
    switch (triggerType) {
      case 'volume_spike':
        return 'Volume Spike';
      case 'price_breakout':
        return 'Price Breakout';
      case 'price_breakdown':
        return 'Price Breakdown';
      case 'tier_change':
        return 'Tier Change';
      default:
        return 'Alert';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Sign in for Alerts</h3>
          <p className="text-muted-foreground mb-4">
            Get real-time notifications for volume spikes, breakouts, and tier changes
          </p>
          <Button asChild>
            <a href="/auth">Sign In</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const unreadAlerts = alerts.filter(alert => !alert.is_read && !alert.is_dismissed);
  const recentAlerts = alerts.filter(alert => !alert.is_dismissed).slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Recent Alerts</span>
            {unreadAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadAlerts.length}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {recentAlerts.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No alerts yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              You'll receive notifications for significant market events
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start space-x-3 p-3 rounded-lg border",
                  !alert.is_read ? "bg-accent border-primary/20" : "bg-background"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 p-2 rounded-full",
                  alert.tier === 'A' ? "bg-tier-a/10 text-tier-a" :
                  alert.tier === 'B' ? "bg-tier-b/10 text-tier-b" :
                  "bg-tier-c/10 text-tier-c"
                )}>
                  {getAlertIcon(alert.trigger_type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {getAlertTypeLabel(alert.trigger_type)}
                    </Badge>
                    <TierBadge tier={alert.tier as 'A' | 'B' | 'C'} />
                    {!alert.is_read && (
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium">{alert.stocks?.ticker}</span>
                    <span className="text-sm text-muted-foreground">
                      {alert.stocks?.company_name}
                    </span>
                  </div>

                  {alert.price && (
                    <div className="text-sm text-muted-foreground mb-1">
                      Price: {formatCurrency(alert.price)}
                    </div>
                  )}

                  {alert.rationale && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {alert.rationale}
                    </p>
                  )}

                  <div className="text-xs text-muted-foreground mt-2">
                    {new Date(alert.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  {!alert.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(alert.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissAlert(alert.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}