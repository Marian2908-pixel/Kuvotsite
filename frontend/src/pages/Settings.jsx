import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
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
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Package,
  DollarSign,
} from "lucide-react";
import {
  getPrices,
  createPrice,
  updatePrice,
  deletePrice,
  seedPrices,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../lib/api";
import { formatCurrency } from "../lib/utils";

const initialPriceForm = {
  size: "",
  cost_price: 0,
  sell_price: 0,
  lacquer_cost: 0,
  lacquer_price: 0,
  packaging_cost: 0,
  packaging_price: 0,
  frame_1_10_cost: 0,
  frame_1_10_price: 0,
  frame_11_14_cost: 0,
  frame_11_14_price: 0,
};

const initialProductForm = {
  name: "",
  cost_price: 0,
  sell_price: 0,
  category: "інше",
};

export function Settings() {
  const [prices, setPrices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [priceForm, setPriceForm] = useState(initialPriceForm);
  const [productForm, setProductForm] = useState(initialProductForm);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pricesRes, productsRes] = await Promise.all([
        getPrices(),
        getProducts(),
      ]);
      setPrices(pricesRes.data);
      setProducts(productsRes.data);
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
      loadData();
    } catch (error) {
      console.error("Error seeding prices:", error);
    } finally {
      setSeeding(false);
    }
  };

  // Price handlers
  const handlePriceSubmit = async () => {
    if (!priceForm.size) {
      alert("Введіть розмір");
      return;
    }

    try {
      if (editingPrice) {
        await updatePrice(editingPrice.id, priceForm);
      } else {
        await createPrice(priceForm);
      }
      setPriceDialogOpen(false);
      setEditingPrice(null);
      setPriceForm(initialPriceForm);
      loadData();
    } catch (error) {
      console.error("Error saving price:", error);
    }
  };

  const handlePriceEdit = (price) => {
    setEditingPrice(price);
    setPriceForm({
      size: price.size,
      cost_price: price.cost_price,
      sell_price: price.sell_price,
      lacquer_cost: price.lacquer_cost,
      lacquer_price: price.lacquer_price,
      packaging_cost: price.packaging_cost,
      packaging_price: price.packaging_price,
      frame_1_10_cost: price.frame_1_10_cost,
      frame_1_10_price: price.frame_1_10_price,
      frame_11_14_cost: price.frame_11_14_cost,
      frame_11_14_price: price.frame_11_14_price,
    });
    setPriceDialogOpen(true);
  };

  const handlePriceDelete = async (priceId) => {
    if (!window.confirm("Ви впевнені, що хочете видалити цей розмір?")) return;
    try {
      await deletePrice(priceId);
      loadData();
    } catch (error) {
      console.error("Error deleting price:", error);
    }
  };

  // Product handlers
  const handleProductSubmit = async () => {
    if (!productForm.name) {
      alert("Введіть назву товару");
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productForm);
      } else {
        await createProduct(productForm);
      }
      setProductDialogOpen(false);
      setEditingProduct(null);
      setProductForm(initialProductForm);
      loadData();
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleProductEdit = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      cost_price: product.cost_price,
      sell_price: product.sell_price,
      category: product.category,
    });
    setProductDialogOpen(true);
  };

  const handleProductDelete = async (productId) => {
    if (!window.confirm("Ви впевнені, що хочете видалити цей товар?")) return;
    try {
      await deleteProduct(productId);
      loadData();
    } catch (error) {
      console.error("Error deleting product:", error);
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
    <div className="space-y-6 animate-fade-in" data-testid="settings-page">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
          Налаштування
        </h1>
        <p className="text-muted-foreground mt-1">
          Керування цінами та товарами
        </p>
      </div>

      <Tabs defaultValue="prices" className="space-y-6">
        <TabsList data-testid="settings-tabs">
          <TabsTrigger value="prices" data-testid="tab-prices">
            <DollarSign className="h-4 w-4 mr-2" />
            Ціни на картини
          </TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products">
            <Package className="h-4 w-4 mr-2" />
            Інші товари
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prices" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {prices.length} розмірів у каталозі
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleSeedPrices}
                disabled={seeding}
                data-testid="seed-prices-settings-btn"
              >
                {seeding ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Заповнити стандартні ціни
              </Button>
              <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="rounded-full"
                    onClick={() => {
                      setEditingPrice(null);
                      setPriceForm(initialPriceForm);
                    }}
                    data-testid="add-price-btn"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Додати розмір
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">
                      {editingPrice ? "Редагування" : "Новий розмір"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Розмір (наприклад: 30х40)</Label>
                      <Input
                        value={priceForm.size}
                        onChange={(e) =>
                          setPriceForm((prev) => ({ ...prev, size: e.target.value }))
                        }
                        placeholder="30х40"
                        data-testid="price-size-input"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Собівартість картини</Label>
                        <Input
                          type="number"
                          value={priceForm.cost_price}
                          onChange={(e) =>
                            setPriceForm((prev) => ({
                              ...prev,
                              cost_price: parseFloat(e.target.value) || 0,
                            }))
                          }
                          data-testid="price-cost-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ціна продажу</Label>
                        <Input
                          type="number"
                          value={priceForm.sell_price}
                          onChange={(e) =>
                            setPriceForm((prev) => ({
                              ...prev,
                              sell_price: parseFloat(e.target.value) || 0,
                            }))
                          }
                          data-testid="price-sell-input"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Лак (собівартість)</Label>
                        <Input
                          type="number"
                          value={priceForm.lacquer_cost}
                          onChange={(e) =>
                            setPriceForm((prev) => ({
                              ...prev,
                              lacquer_cost: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Лак (ціна)</Label>
                        <Input
                          type="number"
                          value={priceForm.lacquer_price}
                          onChange={(e) =>
                            setPriceForm((prev) => ({
                              ...prev,
                              lacquer_price: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Пакування (собівартість)</Label>
                        <Input
                          type="number"
                          value={priceForm.packaging_cost}
                          onChange={(e) =>
                            setPriceForm((prev) => ({
                              ...prev,
                              packaging_cost: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Пакування (ціна)</Label>
                        <Input
                          type="number"
                          value={priceForm.packaging_price}
                          onChange={(e) =>
                            setPriceForm((prev) => ({
                              ...prev,
                              packaging_price: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Рамка 1-10 (собівартість)</Label>
                        <Input
                          type="number"
                          value={priceForm.frame_1_10_cost}
                          onChange={(e) =>
                            setPriceForm((prev) => ({
                              ...prev,
                              frame_1_10_cost: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Рамка 1-10 (ціна)</Label>
                        <Input
                          type="number"
                          value={priceForm.frame_1_10_price}
                          onChange={(e) =>
                            setPriceForm((prev) => ({
                              ...prev,
                              frame_1_10_price: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Рамка 11-14 (собівартість)</Label>
                        <Input
                          type="number"
                          value={priceForm.frame_11_14_cost}
                          onChange={(e) =>
                            setPriceForm((prev) => ({
                              ...prev,
                              frame_11_14_cost: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Рамка 11-14 (ціна)</Label>
                        <Input
                          type="number"
                          value={priceForm.frame_11_14_price}
                          onChange={(e) =>
                            setPriceForm((prev) => ({
                              ...prev,
                              frame_11_14_price: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <Button
                      className="w-full rounded-full"
                      onClick={handlePriceSubmit}
                      data-testid="save-price-btn"
                    >
                      {editingPrice ? "Зберегти зміни" : "Додати розмір"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card data-testid="prices-table-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Розмір</TableHead>
                      <TableHead className="text-right">Собівартість</TableHead>
                      <TableHead className="text-right">Ціна</TableHead>
                      <TableHead className="text-right">Прибуток</TableHead>
                      <TableHead className="text-right">Лак</TableHead>
                      <TableHead className="text-right">Пакування</TableHead>
                      <TableHead className="text-right">Рамка 1-10</TableHead>
                      <TableHead className="text-right">Рамка 11-14</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prices.map((price) => (
                      <TableRow key={price.id} data-testid={`price-row-${price.id}`}>
                        <TableCell className="font-medium">{price.size}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(price.cost_price)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(price.sell_price)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-green-600 dark:text-green-400">
                          {formatCurrency(price.sell_price - price.cost_price)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                          {formatCurrency(price.lacquer_cost)} / {formatCurrency(price.lacquer_price)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                          {formatCurrency(price.packaging_cost)} / {formatCurrency(price.packaging_price)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                          {formatCurrency(price.frame_1_10_cost)} / {formatCurrency(price.frame_1_10_price)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                          {formatCurrency(price.frame_11_14_cost)} / {formatCurrency(price.frame_11_14_price)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePriceEdit(price)}
                              data-testid={`edit-price-${price.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePriceDelete(price.id)}
                              data-testid={`delete-price-${price.id}`}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {products.length} товарів
            </p>
            <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="rounded-full"
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm(initialProductForm);
                  }}
                  data-testid="add-product-btn"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Додати товар
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">
                    {editingProduct ? "Редагування" : "Новий товар"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Назва товару</Label>
                    <Input
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Введіть назву"
                      data-testid="product-name-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Категорія</Label>
                    <Input
                      value={productForm.category}
                      onChange={(e) =>
                        setProductForm((prev) => ({ ...prev, category: e.target.value }))
                      }
                      placeholder="інше"
                      data-testid="product-category-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Собівартість</Label>
                      <Input
                        type="number"
                        value={productForm.cost_price}
                        onChange={(e) =>
                          setProductForm((prev) => ({
                            ...prev,
                            cost_price: parseFloat(e.target.value) || 0,
                          }))
                        }
                        data-testid="product-cost-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ціна продажу</Label>
                      <Input
                        type="number"
                        value={productForm.sell_price}
                        onChange={(e) =>
                          setProductForm((prev) => ({
                            ...prev,
                            sell_price: parseFloat(e.target.value) || 0,
                          }))
                        }
                        data-testid="product-sell-input"
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full rounded-full"
                    onClick={handleProductSubmit}
                    data-testid="save-product-btn"
                  >
                    {editingProduct ? "Зберегти зміни" : "Додати товар"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card data-testid="products-table-card">
            <CardContent className="p-0">
              {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Package className="h-12 w-12 mb-4 opacity-50" />
                  <p>Товарів ще немає</p>
                  <p className="text-sm">Додайте перший товар</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Назва</TableHead>
                        <TableHead>Категорія</TableHead>
                        <TableHead className="text-right">Собівартість</TableHead>
                        <TableHead className="text-right">Ціна</TableHead>
                        <TableHead className="text-right">Прибуток</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id} data-testid={`product-row-${product.id}`}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(product.cost_price)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(product.sell_price)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-green-600 dark:text-green-400">
                            {formatCurrency(product.sell_price - product.cost_price)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleProductEdit(product)}
                                data-testid={`edit-product-${product.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleProductDelete(product.id)}
                                data-testid={`delete-product-${product.id}`}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
