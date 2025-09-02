-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  location TEXT,
  email_alerts BOOLEAN DEFAULT true,
  sms_alerts BOOLEAN DEFAULT false,
  telegram_alerts BOOLEAN DEFAULT false,
  telegram_chat_id TEXT,
  api_key TEXT DEFAULT encode(gen_random_bytes(32), 'hex'),
  data_refresh_interval TEXT DEFAULT '5m' CHECK (data_refresh_interval IN ('1m', '5m', '15m', '30m', '1h')),
  two_factor_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create stocks table for GSE stocks
CREATE TABLE public.stocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  sector TEXT,
  current_price DECIMAL(10,2),
  previous_close DECIMAL(10,2),
  volume BIGINT DEFAULT 0,
  market_cap BIGINT,
  pe_ratio DECIMAL(8,2),
  pb_ratio DECIMAL(8,2),
  roe DECIMAL(8,2),
  dividend_yield DECIMAL(8,2),
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  tier TEXT DEFAULT 'C' CHECK (tier IN ('A', 'B', 'C')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on stocks (publicly readable)
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stocks are publicly readable" 
ON public.stocks 
FOR SELECT 
USING (true);

-- Create stock prices history table
CREATE TABLE public.stock_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  volume BIGINT DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on stock prices
ALTER TABLE public.stock_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stock prices are publicly readable" 
ON public.stock_prices 
FOR SELECT 
USING (true);

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('Volume Spike', 'Price Breakout', 'RSI Reversal', 'MA Cross', 'Earnings Beat', 'Support/Resistance')),
  tier TEXT NOT NULL CHECK (tier IN ('A', 'B', 'C')),
  price DECIMAL(10,2),
  rationale TEXT,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on alerts
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all alerts or their own alerts" 
ON public.alerts 
FOR SELECT 
USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" 
ON public.alerts 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create watchlists table
CREATE TABLE public.watchlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, stock_id)
);

-- Enable RLS on watchlists
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own watchlist" 
ON public.watchlists 
FOR ALL 
USING (auth.uid() = user_id);

-- Create portfolio table
CREATE TABLE public.portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  shares DECIMAL(10,2) NOT NULL,
  avg_cost DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, stock_id)
);

-- Enable RLS on portfolios
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own portfolio" 
ON public.portfolios 
FOR ALL 
USING (auth.uid() = user_id);

-- Create trades table
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('BUY', 'SELL')),
  shares DECIMAL(10,2) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  fees DECIMAL(10,2) DEFAULT 0,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on trades
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own trades" 
ON public.trades 
FOR ALL 
USING (auth.uid() = user_id);

-- Create backtests table
CREATE TABLE public.backtests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parameters JSONB NOT NULL,
  results JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on backtests
ALTER TABLE public.backtests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own backtests" 
ON public.backtests 
FOR ALL 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stocks_updated_at
BEFORE UPDATE ON public.stocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at
BEFORE UPDATE ON public.portfolios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Insert sample GSE stocks
INSERT INTO public.stocks (ticker, company_name, sector, current_price, previous_close, volume, market_cap, pe_ratio, pb_ratio, roe, dividend_yield, score, tier) VALUES
('EGL', 'Ecobank Ghana Limited', 'Banking', 5.25, 5.10, 125000, 2100000000, 8.5, 1.2, 15.2, 4.5, 85, 'A'),
('GCB', 'GCB Bank Limited', 'Banking', 4.80, 4.75, 89000, 1800000000, 7.8, 1.1, 14.8, 5.2, 78, 'B'),
('GOIL', 'Ghana Oil Company Limited', 'Oil & Gas', 2.15, 2.05, 156000, 950000000, 12.3, 0.8, 8.9, 3.1, 72, 'B'),
('TLW', 'Tullow Oil Plc', 'Oil & Gas', 12.50, 12.30, 45000, 3200000000, 15.2, 2.1, 6.5, 2.8, 68, 'C'),
('TOTAL', 'Total Petroleum Ghana Limited', 'Oil & Gas', 3.45, 3.40, 78000, 1200000000, 10.8, 1.5, 11.2, 4.0, 75, 'B'),
('GWEB', 'Golden Web Limited', 'Technology', 0.85, 0.82, 234000, 180000000, 18.5, 3.2, 12.8, 1.5, 82, 'A'),
('SCB', 'Standard Chartered Bank Ghana Limited', 'Banking', 18.75, 18.50, 32000, 4200000000, 9.2, 1.8, 18.5, 6.8, 88, 'A'),
('CAL', 'CAL Bank Limited', 'Banking', 0.95, 0.92, 187000, 320000000, 6.5, 0.9, 13.5, 4.2, 79, 'B'),
('GGBL', 'Ghana Gasoline and Bitumen Limited', 'Oil & Gas', 0.55, 0.53, 298000, 95000000, 22.1, 1.1, 4.8, 1.2, 58, 'C'),
('SOGEGH', 'Societe Generale Ghana Limited', 'Banking', 1.25, 1.22, 145000, 450000000, 8.9, 1.3, 12.1, 3.8, 74, 'B');

-- Insert sample alerts
INSERT INTO public.alerts (stock_id, trigger_type, tier, price, rationale) 
SELECT 
  s.id,
  'Volume Spike',
  s.tier,
  s.current_price,
  'Volume increased by 150% above 20-day average'
FROM public.stocks s WHERE s.ticker = 'GWEB';

INSERT INTO public.alerts (stock_id, trigger_type, tier, price, rationale) 
SELECT 
  s.id,
  'Price Breakout',
  s.tier,
  s.current_price,
  'Price broke above 50-day moving average resistance'
FROM public.stocks s WHERE s.ticker = 'EGL';

INSERT INTO public.alerts (stock_id, trigger_type, tier, price, rationale) 
SELECT 
  s.id,
  'RSI Reversal',
  s.tier,
  s.current_price,
  'RSI moved from oversold to neutral territory'
FROM public.stocks s WHERE s.ticker = 'SCB';