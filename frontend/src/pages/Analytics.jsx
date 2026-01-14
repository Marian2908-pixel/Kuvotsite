import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { RefreshCw } from "lucide-react";
import { getAnalyticsSummary, getAvailableMonths } from "../lib/api";
import { formatCurrency } from "../lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  Area,
} from "recharts";

const CHART_COLORS = [
  "hsl(16, 65%, 45%)",
  "hsl(45, 40%, 60%)",
  "hsl(25, 30%, 50%)",
  "hsl(180, 25%, 40%)",
  "hsl(30, 10%, 30%)",
  "hsl(16, 65%, 65%)",
  "hsl(45, 40%, 75%)",
];

export function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [compareMonth, setCompareMonth] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, monthsRes] = await Promise.all([
        getAnalyticsSummary({ month: selectedMonth || undefined }),
        getAvailableMonths(),
      ]);
      setAnalytics(analyticsRes.data);
      setMonths(monthsRes.data);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (dataObj) => {
    if (!dataObj) return [];
    return Object.entries(dataObj).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const revenueByMonthData = prepareChartData(analytics?.revenue_by_month);
  const profitByMonthData = prepareChartData(analytics?.profit_by_month);
  
  // Combined revenue and profit by month
  const monthlyData = revenueByMonthData.map((item) => ({
    name: item.name,
    revenue: item.value,
    profit: analytics?.profit_by_month?.[item.name] || 0,
  }));

  const revenueByTypeData = prepareChartData(analytics?.revenue_by_type);
  const profitByTypeData = prepareChartData(analytics?.profit_by_type);
  
  const typeComparisonData = revenueByTypeData.map((item) => ({
    name: item.name,
    revenue: item.value,
    profit: analytics?.profit_by_type?.[item.name] || 0,
    margin: item.value > 0 
      ? Math.round((analytics?.profit_by_type?.[item.name] || 0) / item.value * 100) 
      : 0,
  }));

  const revenueByChannelData = prepareChartData(analytics?.revenue_by_channel);

  const profitBySizeData = prepareChartData(analytics?.profit_by_size)
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);

  const revenueBySizeData = prepareChartData(analytics?.revenue_by_size)
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);

  const sizeComparisonData = profitBySizeData.map((item) => ({
    name: item.name,
    profit: item.value,
    revenue: analytics?.revenue_by_size?.[item.name] || 0,
  }));

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="analytics-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
            Аналітика
          </h1>
          <p className="text-muted-foreground mt-1">
            Детальний аналіз вашого бізнесу
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMonth || "all"} onValueChange={(v) => setSelectedMonth(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[200px]" data-testid="analytics-month-filter">
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
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card data-testid="analytics-revenue">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              Дохід
            </p>
            <p className="text-xl font-bold mt-1 tabular-nums">
              {formatCurrency(analytics?.total_revenue || 0)}
            </p>
          </CardContent>
        </Card>
        <Card data-testid="analytics-cost">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              Собівартість
            </p>
            <p className="text-xl font-bold mt-1 tabular-nums text-orange-600 dark:text-orange-400">
              {formatCurrency(analytics?.total_cost || 0)}
            </p>
          </CardContent>
        </Card>
        <Card data-testid="analytics-profit">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              Прибуток
            </p>
            <p className="text-xl font-bold mt-1 tabular-nums text-green-600 dark:text-green-400">
              {formatCurrency(analytics?.total_profit || 0)}
            </p>
          </CardContent>
        </Card>
        <Card data-testid="analytics-margin">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              Маржа
            </p>
            <p className="text-xl font-bold mt-1 tabular-nums">
              {analytics?.total_revenue > 0
                ? Math.round((analytics.total_profit / analytics.total_revenue) * 100)
                : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Profit by Month */}
        <Card className="lg:col-span-2" data-testid="monthly-chart">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Дохід та прибуток по місяцях</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyData}>
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
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Дохід"
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.2}
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                  />
                  <Bar
                    dataKey="profit"
                    name="Прибуток"
                    fill="hsl(var(--chart-2))"
                    radius={[4, 4, 0, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Type */}
        <Card data-testid="type-comparison-chart">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Порівняння по типах</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeComparisonData}>
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
                    formatter={(value, name) => [
                      name === 'margin' ? `${value}%` : formatCurrency(value),
                      name === 'revenue' ? 'Дохід' : name === 'profit' ? 'Прибуток' : 'Маржа'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Дохід" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Прибуток" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Channel */}
        <Card data-testid="channel-chart">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Дохід по каналах продажу</CardTitle>
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
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {revenueByChannelData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
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

        {/* Top Profitable Sizes */}
        <Card className="lg:col-span-2" data-testid="size-chart">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Найприбутковіші розміри</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sizeComparisonData} layout="vertical">
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
                    formatter={(value, name) => [
                      formatCurrency(value),
                      name === 'revenue' ? 'Дохід' : 'Прибуток'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Дохід" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="profit" name="Прибуток" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
