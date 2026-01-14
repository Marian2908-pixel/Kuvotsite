import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  TrendingUp,
  ShoppingCart,
  Wallet,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";
import { getAnalyticsSummary, getDailyAnalytics, getAvailableMonths, seedPrices } from "../lib/api";
import { formatCurrency, formatNumber } from "../lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CHART_COLORS = [
  "hsl(16, 65%, 45%)",
  "hsl(45, 40%, 60%)",
  "hsl(25, 30%, 50%)",
  "hsl(180, 25%, 40%)",
  "hsl(30, 10%, 30%)",
];

export function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [dailyStats, setDailyStats] = useState(null);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, dailyRes, monthsRes] = await Promise.all([
        getAnalyticsSummary({ month: selectedMonth || undefined }),
        getDailyAnalytics(),
        getAvailableMonths(),
      ]);
      setAnalytics(analyticsRes.data);
      setDailyStats(dailyRes.data);
      setMonths(monthsRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedPrices = async () => {
    setSeeding(true);
    try {
      await seedPrices();
      alert("Каталог цін заповнено!");
    } catch (error) {
      console.error("Error seeding prices:", error);
    } finally {
      setSeeding(false);
    }
  };

  const prepareChartData = (dataObj) => {
    if (!dataObj) return [];
    return Object.entries(dataObj).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const revenueByTypeData = prepareChartData(analytics?.revenue_by_type);
  const revenueByChannelData = prepareChartData(analytics?.revenue_by_channel);
  const revenueByMonthData = prepareChartData(analytics?.revenue_by_month);
  const profitBySizeData = prepareChartData(analytics?.profit_by_size)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dashboard-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
            Дашборд
          </h1>
          <p className="text-muted-foreground mt-1">
            Огляд вашого бізнесу
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMonth || "all"} onValueChange={(v) => setSelectedMonth(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[200px]" data-testid="month-filter">
              <SelectValue placeholder="Всі місяці" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі місяці</SelectItem>
              {months.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleSeedPrices}
            disabled={seeding}
            data-testid="seed-prices-btn"
          >
            {seeding ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              "Заповнити ціни"
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card hover:shadow-lg transition-all duration-300" data-testid="card-revenue">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  Загальний дохід
                </p>
                <p className="text-2xl font-bold mt-2 tabular-nums">
                  {formatCurrency(analytics?.total_revenue || 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card hover:shadow-lg transition-all duration-300" data-testid="card-profit">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  Чистий прибуток
                </p>
                <p className="text-2xl font-bold mt-2 tabular-nums text-green-600 dark:text-green-400">
                  {formatCurrency(analytics?.total_profit || 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card hover:shadow-lg transition-all duration-300" data-testid="card-orders">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  Замовлень
                </p>
                <p className="text-2xl font-bold mt-2 tabular-nums">
                  {formatNumber(analytics?.order_count || 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-secondary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card hover:shadow-lg transition-all duration-300" data-testid="card-avg-check">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  Середній чек
                </p>
                <p className="text-2xl font-bold mt-2 tabular-nums">
                  {formatCurrency(analytics?.avg_check || 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Calculator className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today Stats */}
      {dailyStats && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10" data-testid="today-stats">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  Сьогодні ({dailyStats.date})
                </p>
                <p className="text-xl font-bold mt-1">
                  {formatCurrency(dailyStats.revenue)} дохід · {formatCurrency(dailyStats.profit)} прибуток
                </p>
              </div>
              <div className="text-muted-foreground">
                {dailyStats.order_count} замовлень
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Month */}
        <Card data-testid="chart-by-month">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Дохід по місяцях</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByMonthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickLine={false}
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [formatCurrency(value), 'Дохід']}
                  />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Profit by Size */}
        <Card data-testid="chart-by-size">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Топ-10 прибуткових розмірів</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitBySizeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickLine={false}
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [formatCurrency(value), 'Прибуток']}
                  />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Type */}
        <Card data-testid="chart-by-type">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Дохід по типах</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueByTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {revenueByTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [formatCurrency(value), 'Дохід']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Channel */}
        <Card data-testid="chart-by-channel">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Дохід по каналах</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueByChannelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {revenueByChannelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [formatCurrency(value), 'Дохід']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
