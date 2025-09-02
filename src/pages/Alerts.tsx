import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TierBadge } from "@/components/TierBadge";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Eye, Clock, Filter } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  trigger_type: string;
  tier: 'A' | 'B' | 'C';
  price: number;
  rationale: string;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  stock: {
    ticker: string;
    company_name: string;
  };
}

export default function Alerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [triggerFilter, setTriggerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          stock:stocks(ticker, company_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAlerts((data as Alert[]) || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
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
      
      toast({
        title: "Alert marked as read"
      });
    } catch (error) {
      console.error('Error marking alert as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark alert as read",
        variant: "destructive"
      });
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_dismissed: true })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, is_dismissed: true } : alert
      ));
      
      toast({
        title: "Alert dismissed"
      });
    } catch (error) {
      console.error('Error dismissing alert:', error);
      toast({
        title: "Error",
        description: "Failed to dismiss alert",
        variant: "destructive"
      });
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

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.stock.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.trigger_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === 'all' || alert.tier === tierFilter;
    const matchesTrigger = triggerFilter === 'all' || alert.trigger_type === triggerFilter;
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'unread' && !alert.is_read && !alert.is_dismissed) ||
                          (statusFilter === 'read' && alert.is_read) ||
                          (statusFilter === 'dismissed' && alert.is_dismissed);
    
    return matchesSearch && matchesTier && matchesTrigger && matchesStatus;
  });

  const triggerTypes = [...new Set(alerts.map(alert => alert.trigger_type))];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading alerts...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Alerts & Notifications</h1>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="A">Tier A</SelectItem>
                  <SelectItem value="B">Tier B</SelectItem>
                  <SelectItem value="C">Tier C</SelectItem>
                </SelectContent>
              </Select>
              <Select value={triggerFilter} onValueChange={setTriggerFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Trigger Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {triggerTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <Card>
          <CardHeader>
            <CardTitle>Alerts ({filteredAlerts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAlerts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No alerts found</p>
            ) : (
              <div className="space-y-3">
                {filteredAlerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={cn(
                      "flex items-start space-x-3 p-4 border rounded-lg transition-colors",
                      alert.is_dismissed && "opacity-50",
                      !alert.is_read && !alert.is_dismissed && "bg-muted/30 border-primary/20"
                    )}
                  >
                    <TierBadge tier={alert.tier} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-medium">{alert.stock.ticker}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {alert.stock.company_name}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeAgo(alert.created_at)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 mb-2">
                        <span className="text-sm font-medium">{alert.trigger_type}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(alert.price)}
                        </span>
                        {!alert.is_read && !alert.is_dismissed && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                            New
                          </span>
                        )}
                        {alert.is_dismissed && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                            Dismissed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground mb-3">
                        {alert.rationale}
                      </p>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                        >
                          <a href={`/stock/${alert.stock.ticker}`}>
                            <Eye className="h-3 w-3 mr-1" />
                            View Stock
                          </a>
                        </Button>
                        {!alert.is_read && !alert.is_dismissed && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => markAsRead(alert.id)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Mark Read
                          </Button>
                        )}
                        {!alert.is_dismissed && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => dismissAlert(alert.id)}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Dismiss
                          </Button>
                        )}
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