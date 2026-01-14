import { useState, useEffect, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import {
  Truck,
  Package,
  Settings,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  FileText,
  ExternalLink,
  Search,
  Save,
  Check,
  Copy,
} from "lucide-react";
import axios from "axios";
import { formatCurrency, formatDate } from "../lib/utils";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export function Delivery() {
  const [settings, setSettings] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [ttns, setTtns] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [apiKey, setApiKey] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  
  // TTN creation form
  const [ttnForm, setTtnForm] = useState({
    order_id: "",
    recipient_name: "",
    recipient_phone: "",
    recipient_city_ref: "",
    recipient_city_name: "",
    recipient_warehouse_ref: "",
    recipient_warehouse_name: "",
    weight: 1,
    length: 40,
    width: 30,
    height: 5,
    description: "Картина",
    cost: 0,
    payment_method: "Cash",
    payer_type: "Recipient",
    cod_amount: 0,
    template_id: "",
  });
  
  // Search state
  const [citySearch, setCitySearch] = useState("");
  const [cities, setCities] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  
  // Template dialog
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    length: 0,
    width: 0,
    height: 0,
    weight: 0,
  });
  
  // TTN dialog
  const [ttnDialogOpen, setTtnDialogOpen] = useState(false);
  const [creatingTtn, setCreatingTtn] = useState(false);
  const [createdTtn, setCreatedTtn] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsRes, templatesRes, ttnsRes, ordersRes] = await Promise.all([
        axios.get(`${API}/nova-poshta/settings`),
        axios.get(`${API}/dimension-templates`),
        axios.get(`${API}/nova-poshta/ttns`),
        axios.get(`${API}/orders`),
      ]);
      setSettings(settingsRes.data);
      setTemplates(templatesRes.data);
      setTtns(ttnsRes.data);
      setOrders(ordersRes.data.filter(o => o.status !== "скасовано"));
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/nova-poshta/settings`, null, {
        params: { api_key: apiKey, sender_phone: senderPhone }
      });
      await loadData();
      alert("Налаштування збережено!");
    } catch (error) {
      alert("Помилка збереження: " + (error.response?.data?.detail || error.message));
    } finally {
      setSaving(false);
    }
  };

  const searchCities = useCallback(async (search) => {
    if (search.length < 2) return;
    setCitiesLoading(true);
    try {
      const res = await axios.get(`${API}/nova-poshta/cities`, { params: { search } });
      setCities(res.data);
    } catch (error) {
      console.error("Error searching cities:", error);
    } finally {
      setCitiesLoading(false);
    }
  }, []);

  const loadWarehouses = async (cityRef) => {
    setWarehousesLoading(true);
    try {
      const res = await axios.get(`${API}/nova-poshta/warehouses`, { params: { city_ref: cityRef } });
      setWarehouses(res.data);
    } catch (error) {
      console.error("Error loading warehouses:", error);
    } finally {
      setWarehousesLoading(false);
    }
  };

  const handleCitySelect = (city) => {
    setTtnForm(prev => ({
      ...prev,
      recipient_city_ref: city.ref,
      recipient_city_name: city.name,
      recipient_warehouse_ref: "",
      recipient_warehouse_name: "",
    }));
    setCitySearch(city.name);
    setCities([]);
    loadWarehouses(city.ref);
  };

  const handleWarehouseSelect = (warehouse) => {
    setTtnForm(prev => ({
      ...prev,
      recipient_warehouse_ref: warehouse.ref,
      recipient_warehouse_name: warehouse.name,
    }));
  };

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setTtnForm(prev => ({
        ...prev,
        template_id: templateId,
        length: template.length,
        width: template.width,
        height: template.height,
        weight: template.weight,
      }));
    }
  };

  const handleOrderSelect = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const desc = order.items.map(i => i.size || i.product_name).join(", ");
      setTtnForm(prev => ({
        ...prev,
        order_id: orderId,
        description: `Картина: ${order.painting_name} (${desc})`,
        cost: order.total_amount,
        cod_amount: order.status === "нове" ? order.total_amount : 0,
      }));
    }
  };

  const createTtn = async () => {
    if (!ttnForm.recipient_name || !ttnForm.recipient_phone || !ttnForm.recipient_city_ref || !ttnForm.recipient_warehouse_ref) {
      alert("Заповніть всі обов'язкові поля");
      return;
    }
    
    setCreatingTtn(true);
    try {
      const res = await axios.post(`${API}/nova-poshta/ttn`, ttnForm);
      setCreatedTtn(res.data);
      await loadData();
    } catch (error) {
      alert("Помилка створення ТТН: " + (error.response?.data?.detail || error.message));
    } finally {
      setCreatingTtn(false);
    }
  };

  const trackTtn = async (ttnNumber) => {
    try {
      const res = await axios.get(`${API}/nova-poshta/track/${ttnNumber}`);
      alert(`Статус: ${res.data.Status}\nМісто: ${res.data.CityRecipient}`);
    } catch (error) {
      alert("Помилка відстеження: " + (error.response?.data?.detail || error.message));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Template handlers
  const saveTemplate = async () => {
    try {
      if (editingTemplate) {
        await axios.put(`${API}/dimension-templates/${editingTemplate.id}`, templateForm);
      } else {
        await axios.post(`${API}/dimension-templates`, templateForm);
      }
      setTemplateDialogOpen(false);
      setEditingTemplate(null);
      setTemplateForm({ name: "", length: 0, width: 0, height: 0, weight: 0 });
      await loadData();
    } catch (error) {
      alert("Помилка збереження: " + (error.response?.data?.detail || error.message));
    }
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm("Видалити шаблон?")) return;
    try {
      await axios.delete(`${API}/dimension-templates/${id}`);
      await loadData();
    } catch (error) {
      alert("Помилка видалення: " + (error.response?.data?.detail || error.message));
    }
  };

  const seedTemplates = async () => {
    try {
      await axios.post(`${API}/dimension-templates/seed`);
      await loadData();
    } catch (error) {
      console.error("Error seeding templates:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="delivery-page">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
          Доставка
        </h1>
        <p className="text-muted-foreground mt-1">
          Інтеграція з Новою Поштою
        </p>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList data-testid="delivery-tabs">
          <TabsTrigger value="create" data-testid="tab-create-ttn">
            <Truck className="h-4 w-4 mr-2" />
            Створити ТТН
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-ttn-history">
            <FileText className="h-4 w-4 mr-2" />
            Історія ТТН
          </TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">
            <Package className="h-4 w-4 mr-2" />
            Шаблони габаритів
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-np-settings">
            <Settings className="h-4 w-4 mr-2" />
            Налаштування
          </TabsTrigger>
        </TabsList>

        {/* CREATE TTN */}
        <TabsContent value="create" className="space-y-6">
          {!settings?.configured ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Налаштуйте API ключ Нової Пошти</p>
                <p className="text-muted-foreground mb-4">
                  Перейдіть у вкладку "Налаштування" та введіть ваш API ключ
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card data-testid="ttn-form-card">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Нова накладна (ТТН)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {createdTtn ? (
                  <div className="space-y-4 text-center py-6">
                    <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                      <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium">ТТН успішно створено!</p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <code className="bg-muted px-3 py-1 rounded text-xl font-bold">
                          {createdTtn.ttn_number}
                        </code>
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(createdTtn.ttn_number)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {createdTtn.estimated_delivery && (
                      <p className="text-muted-foreground">
                        Очікувана доставка: {createdTtn.estimated_delivery}
                      </p>
                    )}
                    <div className="flex justify-center gap-3">
                      <Button variant="outline" onClick={() => window.open(createdTtn.print_url, '_blank')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Друк ТТН
                      </Button>
                      <Button onClick={() => setCreatedTtn(null)}>
                        Створити ще
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Order selection */}
                    <div className="space-y-2">
                      <Label>Замовлення (необов'язково)</Label>
                      <Select onValueChange={handleOrderSelect}>
                        <SelectTrigger data-testid="order-select">
                          <SelectValue placeholder="Оберіть замовлення для автозаповнення" />
                        </SelectTrigger>
                        <SelectContent>
                          {orders.map(order => (
                            <SelectItem key={order.id} value={order.id}>
                              {formatDate(order.order_date)} — {order.painting_name} — {formatCurrency(order.total_amount)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Recipient info */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-lg">Отримувач</h3>
                        
                        <div className="space-y-2">
                          <Label>ПІБ отримувача *</Label>
                          <Input
                            value={ttnForm.recipient_name}
                            onChange={(e) => setTtnForm(prev => ({ ...prev, recipient_name: e.target.value }))}
                            placeholder="Прізвище Ім'я По-батькові"
                            data-testid="recipient-name-input"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Телефон *</Label>
                          <Input
                            value={ttnForm.recipient_phone}
                            onChange={(e) => setTtnForm(prev => ({ ...prev, recipient_phone: e.target.value }))}
                            placeholder="380XXXXXXXXX"
                            data-testid="recipient-phone-input"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Місто *</Label>
                          <div className="relative">
                            <Input
                              value={citySearch}
                              onChange={(e) => {
                                setCitySearch(e.target.value);
                                searchCities(e.target.value);
                              }}
                              placeholder="Почніть вводити назву міста..."
                              data-testid="city-search-input"
                            />
                            {citiesLoading && (
                              <RefreshCw className="absolute right-3 top-3 h-4 w-4 animate-spin" />
                            )}
                            {cities.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                                {cities.map(city => (
                                  <div
                                    key={city.ref}
                                    className="px-3 py-2 hover:bg-muted cursor-pointer"
                                    onClick={() => handleCitySelect(city)}
                                  >
                                    {city.name}, {city.area}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Відділення *</Label>
                          <Select 
                            value={ttnForm.recipient_warehouse_ref}
                            onValueChange={(val) => {
                              const w = warehouses.find(w => w.ref === val);
                              handleWarehouseSelect(w);
                            }}
                            disabled={!ttnForm.recipient_city_ref}
                          >
                            <SelectTrigger data-testid="warehouse-select">
                              <SelectValue placeholder={warehousesLoading ? "Завантаження..." : "Оберіть відділення"} />
                            </SelectTrigger>
                            <SelectContent>
                              {warehouses.map(w => (
                                <SelectItem key={w.ref} value={w.ref}>
                                  {w.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Package info */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-lg">Посилка</h3>

                        <div className="space-y-2">
                          <Label>Шаблон габаритів</Label>
                          <div className="flex gap-2">
                            <Select onValueChange={handleTemplateSelect}>
                              <SelectTrigger data-testid="template-select">
                                <SelectValue placeholder="Оберіть шаблон" />
                              </SelectTrigger>
                              <SelectContent>
                                {templates.map(t => (
                                  <SelectItem key={t.id} value={t.id}>
                                    {t.name} ({t.length}x{t.width}x{t.height} см, {t.weight} кг)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {templates.length === 0 && (
                              <Button variant="outline" onClick={seedTemplates}>
                                Заповнити
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Довжина (см)</Label>
                            <Input
                              type="number"
                              value={ttnForm.length}
                              onChange={(e) => setTtnForm(prev => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Ширина (см)</Label>
                            <Input
                              type="number"
                              value={ttnForm.width}
                              onChange={(e) => setTtnForm(prev => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Висота (см)</Label>
                            <Input
                              type="number"
                              value={ttnForm.height}
                              onChange={(e) => setTtnForm(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Вага (кг)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={ttnForm.weight}
                              onChange={(e) => setTtnForm(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Опис вмісту</Label>
                          <Textarea
                            value={ttnForm.description}
                            onChange={(e) => setTtnForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Картина 40x60 см"
                            data-testid="description-textarea"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Оголошена вартість (грн)</Label>
                            <Input
                              type="number"
                              value={ttnForm.cost}
                              onChange={(e) => setTtnForm(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                              data-testid="cost-input"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Накладений платіж (грн)</Label>
                            <Input
                              type="number"
                              value={ttnForm.cod_amount}
                              onChange={(e) => setTtnForm(prev => ({ ...prev, cod_amount: parseFloat(e.target.value) || 0 }))}
                              placeholder="0 = без накладеного"
                              data-testid="cod-input"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Платник доставки</Label>
                            <Select
                              value={ttnForm.payer_type}
                              onValueChange={(val) => setTtnForm(prev => ({ ...prev, payer_type: val }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Sender">Відправник</SelectItem>
                                <SelectItem value="Recipient">Отримувач</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Форма оплати</Label>
                            <Select
                              value={ttnForm.payment_method}
                              onValueChange={(val) => setTtnForm(prev => ({ ...prev, payment_method: val }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Cash">Готівка</SelectItem>
                                <SelectItem value="NonCash">Безготівка</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button 
                      className="w-full rounded-full" 
                      size="lg"
                      onClick={createTtn}
                      disabled={creatingTtn}
                      data-testid="create-ttn-btn"
                    >
                      {creatingTtn ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Створення ТТН...
                        </>
                      ) : (
                        <>
                          <Truck className="h-4 w-4 mr-2" />
                          Створити ТТН
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TTN HISTORY */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">Історія накладних</CardTitle>
            </CardHeader>
            <CardContent>
              {ttns.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ТТН ще не створювались</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Номер ТТН</TableHead>
                        <TableHead>Отримувач</TableHead>
                        <TableHead>Місто</TableHead>
                        <TableHead>Відділення</TableHead>
                        <TableHead className="text-right">Вартість</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ttns.map(ttn => (
                        <TableRow key={ttn.id}>
                          <TableCell className="font-mono font-medium">
                            <div className="flex items-center gap-2">
                              {ttn.ttn_number}
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(ttn.ttn_number)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{ttn.recipient_name}</TableCell>
                          <TableCell>{ttn.recipient_city}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{ttn.recipient_warehouse}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(ttn.cost)}
                            {ttn.cod_amount > 0 && (
                              <div className="text-xs text-muted-foreground">
                                НП: {formatCurrency(ttn.cod_amount)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{ttn.status}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(ttn.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => trackTtn(ttn.ttn_number)}>
                                <Search className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => window.open(ttn.print_url, '_blank')}>
                                <FileText className="h-4 w-4" />
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
        </TabsContent>

        {/* TEMPLATES */}
        <TabsContent value="templates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-serif text-xl">Шаблони габаритів</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={seedTemplates}>
                  Заповнити стандартні
                </Button>
                <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingTemplate(null);
                      setTemplateForm({ name: "", length: 0, width: 0, height: 0, weight: 0 });
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Додати шаблон
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingTemplate ? "Редагування" : "Новий шаблон"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Назва шаблону</Label>
                        <Input
                          value={templateForm.name}
                          onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="40x60 см"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Довжина (см)</Label>
                          <Input
                            type="number"
                            value={templateForm.length}
                            onChange={(e) => setTemplateForm(prev => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ширина (см)</Label>
                          <Input
                            type="number"
                            value={templateForm.width}
                            onChange={(e) => setTemplateForm(prev => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Висота (см)</Label>
                          <Input
                            type="number"
                            value={templateForm.height}
                            onChange={(e) => setTemplateForm(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Вага (кг)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={templateForm.weight}
                            onChange={(e) => setTemplateForm(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                      </div>
                      <Button className="w-full" onClick={saveTemplate}>
                        <Save className="h-4 w-4 mr-2" />
                        Зберегти
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Шаблонів ще немає</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Назва</TableHead>
                        <TableHead className="text-right">Довжина</TableHead>
                        <TableHead className="text-right">Ширина</TableHead>
                        <TableHead className="text-right">Висота</TableHead>
                        <TableHead className="text-right">Вага</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.map(t => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.name}</TableCell>
                          <TableCell className="text-right">{t.length} см</TableCell>
                          <TableCell className="text-right">{t.width} см</TableCell>
                          <TableCell className="text-right">{t.height} см</TableCell>
                          <TableCell className="text-right">{t.weight} кг</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingTemplate(t);
                                  setTemplateForm({
                                    name: t.name,
                                    length: t.length,
                                    width: t.width,
                                    height: t.height,
                                    weight: t.weight,
                                  });
                                  setTemplateDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteTemplate(t.id)}>
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
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">Налаштування Нової Пошти</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>API ключ</Label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={settings?.configured ? "Ключ налаштовано (****)" : "Введіть API ключ"}
                  data-testid="api-key-input"
                />
                <p className="text-xs text-muted-foreground">
                  Отримати ключ: особистий кабінет Нової Пошти → Налаштування → Безпека → API ключі
                </p>
              </div>

              <div className="space-y-2">
                <Label>Телефон відправника</Label>
                <Input
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="380XXXXXXXXX"
                  data-testid="sender-phone-input"
                />
              </div>

              {settings?.sender_name && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Дані відправника:</p>
                  <p className="text-sm text-muted-foreground">{settings.sender_name}</p>
                </div>
              )}

              <Button onClick={saveSettings} disabled={saving} className="w-full">
                {saving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Зберегти налаштування
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
