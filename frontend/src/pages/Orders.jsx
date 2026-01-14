import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  Download,
  Filter,
  X,
  RefreshCw,
} from "lucide-react";
import {
  getOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  getPrices,
  getProducts,
  getAvailableMonths,
  exportToExcel,
} from "../lib/api";
import {
  formatCurrency,
  formatDate,
  ORDER_TYPES,
  SALES_CHANNELS,
  ORDER_STATUSES,
  FRAME_TYPES,
  STATUS_COLORS,
} from "../lib/utils";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

const initialOrderForm = {
  order_date: new Date().toISOString(),
  painting_name: "",
  order_type: "друк",
  items: [],
  sales_channel: "Instagram",
  status: "нове",
  comment: "",
  extra_income: 0,
  discounted_amount: null,
};

const initialItemForm = {
  size: "",
  quantity: 1,
  with_lacquer: false,
  with_packaging: false,
  frame_type: "none",
};

export function Orders() {
  const [orders, setOrders] = useState([]);
  const [prices, setPrices] = useState([]);
  const [products, setProducts] = useState([]);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [orderForm, setOrderForm] = useState(initialOrderForm);
  const [itemForm, setItemForm] = useState(initialItemForm);
  const [filters, setFilters] = useState({
    month: "",
    order_type: "",
    status: "",
    sales_channel: "",
    size: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v)
      );
      const [ordersRes, pricesRes, productsRes, monthsRes] = await Promise.all([
        getOrders(cleanFilters),
        getPrices(),
        getProducts(),
        getAvailableMonths(),
      ]);
      setOrders(ordersRes.data);
      setPrices(pricesRes.data);
      setProducts(productsRes.data);
      setMonths(monthsRes.data);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!itemForm.size) return;

    const priceData = prices.find((p) => p.size === itemForm.size);
    if (!priceData) return;

    const newItem = {
      size: itemForm.size,
      quantity: itemForm.quantity,
      unit_price: priceData.sell_price,
      unit_cost: priceData.cost_price,
      with_lacquer: itemForm.with_lacquer,
      with_packaging: itemForm.with_packaging,
      frame_type: itemForm.frame_type === "none" ? null : itemForm.frame_type,
      lacquer_price: itemForm.with_lacquer ? priceData.lacquer_price : 0,
      lacquer_cost: itemForm.with_lacquer ? priceData.lacquer_cost : 0,
      packaging_price: itemForm.with_packaging ? priceData.packaging_price : 0,
      packaging_cost: itemForm.with_packaging ? priceData.packaging_cost : 0,
      frame_price: itemForm.frame_type === "1-10"
        ? priceData.frame_1_10_price
        : itemForm.frame_type === "11-14"
        ? priceData.frame_11_14_price
        : 0,
      frame_cost: itemForm.frame_type === "1-10"
        ? priceData.frame_1_10_cost
        : itemForm.frame_type === "11-14"
        ? priceData.frame_11_14_cost
        : 0,
    };

    setOrderForm((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setItemForm(initialItemForm);
  };

  const handleRemoveItem = (index) => {
    setOrderForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const calculateItemTotal = (item) => {
    let total = item.unit_price * item.quantity;
    if (item.with_lacquer) total += item.lacquer_price * item.quantity;
    if (item.with_packaging) total += item.packaging_price * item.quantity;
    if (item.frame_type) total += item.frame_price * item.quantity;
    return total;
  };

  const calculateItemCost = (item) => {
    let cost = item.unit_cost * item.quantity;
    if (item.with_lacquer) cost += item.lacquer_cost * item.quantity;
    if (item.with_packaging) cost += item.packaging_cost * item.quantity;
    if (item.frame_type) cost += item.frame_cost * item.quantity;
    return cost;
  };

  const calculateOrderTotals = () => {
    const totalAmount = orderForm.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const totalCost = orderForm.items.reduce((sum, item) => sum + calculateItemCost(item), 0);
    const extraIncome = orderForm.extra_income || 0;
    const discountedAmount = orderForm.discounted_amount;
    
    // Use discounted amount if provided, otherwise use total amount
    const finalAmount = discountedAmount && discountedAmount > 0 ? discountedAmount : totalAmount;
    const discount = discountedAmount && discountedAmount > 0 ? totalAmount - discountedAmount : 0;
    const netIncome = finalAmount + extraIncome - totalCost;
    
    return { totalAmount, totalCost, finalAmount, discount, extraIncome, netIncome };
  };

  const handleSubmit = async () => {
    if (!orderForm.painting_name || orderForm.items.length === 0) {
      alert("Заповніть назву картини та додайте хоча б один товар");
      return;
    }

    try {
      if (editingOrder) {
        await updateOrder(editingOrder.id, orderForm);
      } else {
        await createOrder(orderForm);
      }
      setDialogOpen(false);
      setEditingOrder(null);
      setOrderForm(initialOrderForm);
      loadData();
    } catch (error) {
      console.error("Error saving order:", error);
    }
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setOrderForm({
      order_date: order.order_date,
      painting_name: order.painting_name,
      order_type: order.order_type,
      items: order.items,
      sales_channel: order.sales_channel,
      status: order.status,
      comment: order.comment || "",
      extra_income: order.extra_income || 0,
      discounted_amount: order.discounted_amount || null,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm("Ви впевнені, що хочете видалити це замовлення?")) return;
    try {
      await deleteOrder(orderId);
      loadData();
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  const handleExport = () => {
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v)
    );
    exportToExcel(cleanFilters);
  };

  const clearFilters = () => {
    setFilters({
      month: "",
      order_type: "",
      status: "",
      sales_channel: "",
      size: "",
    });
  };

  const uniqueSizes = [...new Set(prices.map((p) => p.size))];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="orders-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
            Замовлення
          </h1>
          <p className="text-muted-foreground mt-1">
            Керування вашими замовленнями
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="toggle-filters-btn"
          >
            <Filter className="h-4 w-4 mr-2" />
            Фільтри
          </Button>
          <Button variant="outline" onClick={handleExport} data-testid="export-btn">
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="rounded-full"
                onClick={() => {
                  setEditingOrder(null);
                  setOrderForm(initialOrderForm);
                }}
                data-testid="add-order-btn"
              >
                <Plus className="h-4 w-4 mr-2" />
                Нове замовлення
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">
                  {editingOrder ? "Редагування" : "Нове замовлення"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Дата замовлення</Label>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          data-testid="order-date-picker"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {orderForm.order_date
                            ? format(new Date(orderForm.order_date), "PPP", { locale: uk })
                            : "Оберіть дату"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={new Date(orderForm.order_date)}
                          onSelect={(date) => {
                            setOrderForm((prev) => ({
                              ...prev,
                              order_date: date?.toISOString() || new Date().toISOString(),
                            }));
                            setCalendarOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Тип картини</Label>
                    <Select
                      value={orderForm.order_type}
                      onValueChange={(value) =>
                        setOrderForm((prev) => ({ ...prev, order_type: value }))
                      }
                    >
                      <SelectTrigger data-testid="order-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Назва картини</Label>
                  <Input
                    value={orderForm.painting_name}
                    onChange={(e) =>
                      setOrderForm((prev) => ({
                        ...prev,
                        painting_name: e.target.value,
                      }))
                    }
                    placeholder="Введіть назву картини"
                    data-testid="painting-name-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Канал продажу</Label>
                    <Select
                      value={orderForm.sales_channel}
                      onValueChange={(value) =>
                        setOrderForm((prev) => ({ ...prev, sales_channel: value }))
                      }
                    >
                      <SelectTrigger data-testid="sales-channel-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SALES_CHANNELS.map((channel) => (
                          <SelectItem key={channel} value={channel}>
                            {channel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Статус</Label>
                    <Select
                      value={orderForm.status}
                      onValueChange={(value) =>
                        setOrderForm((prev) => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger data-testid="status-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Add Item Section */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Додати товар</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Розмір</Label>
                        <Select
                          value={itemForm.size}
                          onValueChange={(value) =>
                            setItemForm((prev) => ({ ...prev, size: value }))
                          }
                        >
                          <SelectTrigger data-testid="item-size-select">
                            <SelectValue placeholder="Оберіть розмір" />
                          </SelectTrigger>
                          <SelectContent>
                            {prices.map((p) => (
                              <SelectItem key={p.size} value={p.size}>
                                {p.size} — {formatCurrency(p.sell_price)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Кількість</Label>
                        <Input
                          type="number"
                          min="1"
                          value={itemForm.quantity}
                          onChange={(e) =>
                            setItemForm((prev) => ({
                              ...prev,
                              quantity: parseInt(e.target.value) || 1,
                            }))
                          }
                          data-testid="item-quantity-input"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="lacquer"
                          checked={itemForm.with_lacquer}
                          onCheckedChange={(checked) =>
                            setItemForm((prev) => ({ ...prev, with_lacquer: checked }))
                          }
                          data-testid="lacquer-checkbox"
                        />
                        <Label htmlFor="lacquer" className="cursor-pointer">
                          Лак
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="packaging"
                          checked={itemForm.with_packaging}
                          onCheckedChange={(checked) =>
                            setItemForm((prev) => ({ ...prev, with_packaging: checked }))
                          }
                          data-testid="packaging-checkbox"
                        />
                        <Label htmlFor="packaging" className="cursor-pointer">
                          Пакування
                        </Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Рамка</Label>
                      <Select
                        value={itemForm.frame_type}
                        onValueChange={(value) =>
                          setItemForm((prev) => ({ ...prev, frame_type: value }))
                        }
                      >
                        <SelectTrigger data-testid="frame-type-select">
                          <SelectValue placeholder="Без рамки" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Без рамки</SelectItem>
                          {FRAME_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              Рамка {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      onClick={handleAddItem}
                      disabled={!itemForm.size}
                      className="w-full"
                      data-testid="add-item-btn"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Додати товар
                    </Button>
                  </CardContent>
                </Card>

                {/* Items List */}
                {orderForm.items.length > 0 && (
                  <div className="space-y-2">
                    <Label>Товари в замовленні</Label>
                    <div className="space-y-2">
                      {orderForm.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.size}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} шт.
                              {item.with_lacquer && " · Лак"}
                              {item.with_packaging && " · Пакування"}
                              {item.frame_type && ` · Рамка ${item.frame_type}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">
                              {formatCurrency(calculateItemTotal(item))}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(index)}
                              data-testid={`remove-item-${index}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Discount and Extra Income Section */}
                {orderForm.items.length > 0 && (
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Знижка та додатковий дохід</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Чистий дохід рахується автоматично, враховуючи додатковий дохід та суму зі знижкою
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Сума зі знижкою (необов'язково)</Label>
                          <Input
                            type="number"
                            value={orderForm.discounted_amount || ""}
                            onChange={(e) =>
                              setOrderForm((prev) => ({
                                ...prev,
                                discounted_amount: e.target.value ? parseFloat(e.target.value) : null,
                              }))
                            }
                            placeholder="Залиште пустим, якщо без знижки"
                            data-testid="discounted-amount-input"
                          />
                          <p className="text-xs text-muted-foreground">
                            Заповніть для надання знижки клієнту
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Додатковий дохід (необов'язково)</Label>
                          <Input
                            type="number"
                            value={orderForm.extra_income || ""}
                            onChange={(e) =>
                              setOrderForm((prev) => ({
                                ...prev,
                                extra_income: parseFloat(e.target.value) || 0,
                              }))
                            }
                            placeholder="0"
                            data-testid="extra-income-input"
                          />
                          <p className="text-xs text-muted-foreground">
                            Додається до чистого доходу
                          </p>
                        </div>
                      </div>

                      {/* Calculated Summary */}
                      {(() => {
                        const totals = calculateOrderTotals();
                        return (
                          <div className="p-4 rounded-lg bg-primary/5 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Основна сума:</span>
                              <span className="font-medium">{formatCurrency(totals.totalAmount)}</span>
                            </div>
                            {totals.discount > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Знижка:</span>
                                <span className="font-medium text-destructive">-{formatCurrency(totals.discount)}</span>
                              </div>
                            )}
                            {totals.extraIncome > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Додатковий дохід:</span>
                                <span className="font-medium text-green-600">+{formatCurrency(totals.extraIncome)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Собівартість:</span>
                              <span className="font-medium text-orange-600">-{formatCurrency(totals.totalCost)}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between">
                              <span className="font-medium">Чистий дохід:</span>
                              <span className={`font-bold text-lg ${totals.netIncome >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                                {formatCurrency(totals.netIncome)}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  <Label>Коментар</Label>
                  <Textarea
                    value={orderForm.comment}
                    onChange={(e) =>
                      setOrderForm((prev) => ({ ...prev, comment: e.target.value }))
                    }
                    placeholder="Необов'язково"
                    data-testid="comment-textarea"
                  />
                </div>

                <Button
                  className="w-full rounded-full"
                  onClick={handleSubmit}
                  data-testid="save-order-btn"
                >
                  {editingOrder ? "Зберегти зміни" : "Створити замовлення"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="animate-slide-up" data-testid="filters-card">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <Select
                value={filters.month || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, month: value === "all" ? "" : value }))
                }
              >
                <SelectTrigger className="w-[180px]" data-testid="filter-month">
                  <SelectValue placeholder="Місяць" />
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

              <Select
                value={filters.order_type || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, order_type: value === "all" ? "" : value }))
                }
              >
                <SelectTrigger className="w-[150px]" data-testid="filter-type">
                  <SelectValue placeholder="Тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі типи</SelectItem>
                  {ORDER_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, status: value === "all" ? "" : value }))
                }
              >
                <SelectTrigger className="w-[150px]" data-testid="filter-status">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі статуси</SelectItem>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.sales_channel || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, sales_channel: value === "all" ? "" : value }))
                }
              >
                <SelectTrigger className="w-[150px]" data-testid="filter-channel">
                  <SelectValue placeholder="Канал" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі канали</SelectItem>
                  {SALES_CHANNELS.map((channel) => (
                    <SelectItem key={channel} value={channel}>
                      {channel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.size || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, size: value === "all" ? "" : value }))
                }
              >
                <SelectTrigger className="w-[150px]" data-testid="filter-size">
                  <SelectValue placeholder="Розмір" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі розміри</SelectItem>
                  {uniqueSizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="ghost" onClick={clearFilters} data-testid="clear-filters-btn">
                <X className="h-4 w-4 mr-2" />
                Очистити
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card data-testid="orders-table-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <p>Замовлень ще немає</p>
              <p className="text-sm">Створіть перше замовлення</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Картина</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Товари</TableHead>
                    <TableHead className="text-right">Сума</TableHead>
                    <TableHead className="text-right">Знижка</TableHead>
                    <TableHead className="text-right">Чистий дохід</TableHead>
                    <TableHead>Канал</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} data-testid={`order-row-${order.id}`}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatDate(order.order_date)}
                      </TableCell>
                      <TableCell>{order.painting_name}</TableCell>
                      <TableCell>{order.order_type}</TableCell>
                      <TableCell>
                        {order.items.map((item, i) => (
                          <div key={i} className="text-sm">
                            {item.size || item.product_name} × {item.quantity}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        <div>{formatCurrency(order.total_amount)}</div>
                        {order.discounted_amount && (
                          <div className="text-xs text-muted-foreground">
                            → {formatCurrency(order.discounted_amount)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {order.discount > 0 ? (
                          <span className="text-destructive">-{formatCurrency(order.discount)}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                        {order.extra_income > 0 && (
                          <div className="text-xs text-green-600">+{formatCurrency(order.extra_income)}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums text-green-600 dark:text-green-400">
                        {formatCurrency(order.net_income || order.profit)}
                      </TableCell>
                      <TableCell>{order.sales_channel}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[order.status]}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(order)}
                            data-testid={`edit-order-${order.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(order.id)}
                            data-testid={`delete-order-${order.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
