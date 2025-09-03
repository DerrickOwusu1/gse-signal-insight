import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TierBadge } from "@/components/TierBadge";
import { MiniPriceChart } from "@/components/MiniPriceChart";
import { ArrowUpDown, TrendingUp, TrendingDown, Plus, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

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

interface StockTableProps {
  stocks: Stock[];
  title?: string;
  showAddToWatchlist?: boolean;
}

export function StockTable({ stocks, title = "Stocks", showAddToWatchlist = true }: StockTableProps) {
  const [sortField, setSortField] = useState<keyof Stock>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  const handleSort = (field: keyof Stock) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedStocks = stocks
    .filter(stock => {
      const matchesSearch = stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           stock.company_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSector = sectorFilter === 'all' || stock.sector === sectorFilter;
      const matchesTier = tierFilter === 'all' || stock.tier === tierFilter;
      return matchesSearch && matchesSector && matchesTier;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });

  const sectors = [...new Set(stocks.map(stock => stock.sector))].filter(Boolean);

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
    } else if (value >= 1e3) {
      return `₵${(value / 1e3).toFixed(1)}K`;
    }
    return `₵${value}`;
  };

  const formatVolume = (value: number) => {
    if (value >= 1e6) {
      return `${(value / 1e6).toFixed(1)}M`;
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  const getChangePercentage = (current: number, previous: number) => {
    return ((current - previous) / previous) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Search stocks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Select value={sectorFilter} onValueChange={setSectorFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sectors</SelectItem>
              {sectors.map(sector => (
                <SelectItem key={sector} value={sector}>{sector}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">
                  <Button variant="ghost" onClick={() => handleSort('tier')} className="h-8 p-0">
                    Tier
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('ticker')} className="h-8 p-0">
                    Ticker
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Company</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('score')} className="h-8 p-0">
                    Score
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort('current_price')} className="h-8 p-0">
                    Price
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort('volume')} className="h-8 p-0">
                    Volume
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Market Cap</TableHead>
                <TableHead className="text-right">P/E</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedStocks.map((stock) => {
                const changePercent = getChangePercentage(stock.current_price, stock.previous_close);
                const isPositive = changePercent > 0;
                
                return (
                  <TableRow key={stock.id} className="hover:bg-muted/50">
                    <TableCell>
                      <TierBadge tier={stock.tier} />
                    </TableCell>
                    <TableCell className="font-medium">{stock.ticker}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{stock.company_name}</div>
                        <div className="text-xs text-muted-foreground">{stock.sector}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{stock.score}</div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(stock.current_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <MiniPriceChart 
                        data={[]}
                        currentPrice={stock.current_price}
                        previousClose={stock.previous_close}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatVolume(stock.volume)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatLargeNumber(stock.market_cap)}
                    </TableCell>
                    <TableCell className="text-right">
                      {stock.pe_ratio?.toFixed(1) || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/stock/${stock.ticker}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {showAddToWatchlist && (
                          <Button variant="ghost" size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}