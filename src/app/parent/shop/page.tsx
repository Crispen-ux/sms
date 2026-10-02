"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card, PageHeader, Button, Input, Badge,
  EmptyState, LoadingState,
} from "@/components/ui";
import { ShoppingCart, Package, X, Plus, Minus, Trash2, CheckCircle, AlertCircle, ShoppingBag, Clock } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  active: boolean;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product: Product;
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

const CATEGORIES = ["ALL", "UNIFORM", "STATIONERY", "BOOKS", "SPORTS", "EXTRACURRICULAR", "OTHER"] as const;

const CATEGORY_LABELS: Record<string, string> = {
  ALL: "All",
  UNIFORM: "Uniform",
  STATIONERY: "Stationery",
  BOOKS: "Books",
  SPORTS: "Sports",
  EXTRACURRICULAR: "Extracurricular",
  OTHER: "Other",
};

const CATEGORY_CARD_COLORS: Record<string, string> = {
  UNIFORM: "border-blue-200",
  STATIONERY: "border-green-200",
  BOOKS: "border-purple-200",
  SPORTS: "border-orange-200",
  EXTRACURRICULAR: "border-pink-200",
  OTHER: "border-gray-200",
};

const ORDER_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  SHIPPED: "bg-purple-50 text-purple-700",
  DELIVERED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

function formatCurrency(amount: number) {
  return `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ParentShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [ordering, setOrdering] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "100",
        active: "true",
        ...(filter !== "ALL" && { category: filter }),
      });
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setProducts(data.products.filter((p: Product) => p.active));
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/product-orders?page=1&limit=20");
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      setOrders(data.orders);
    } catch {
      setError("Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, stock: product.stock }];
    });
    setCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.stock) return item;
          return { ...item, quantity: newQty };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setOrdering(true);
    setError("");
    try {
      const res = await fetch("/api/product-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      setSuccess("Order placed successfully!");
      setCart([]);
      setCartOpen(false);
      fetchProducts();
      setTimeout(() => setSuccess(""), 5000);
    } catch (e: any) {
      setError(e.message);
      setTimeout(() => setError(""), 3000);
    } finally {
      setOrdering(false);
    }
  };

  const handleShowOrders = () => {
    setShowOrders(true);
    fetchOrders();
  };

  return (
    <div>
      <PageHeader
        title="School Shop"
        description="Browse and order school supplies, uniforms, and more."
        action={
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleShowOrders} icon={<Clock className="w-4 h-4" />}>
              My Orders
            </Button>
            <Button onClick={() => setCartOpen(true)} icon={<ShoppingCart className="w-4 h-4" />}>
              Cart ({cartCount})
            </Button>
          </div>
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === cat
                ? "bg-brand-red text-white"
                : "bg-brand-light text-brand-dark hover:bg-brand-mid/20"
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {loading ? (
        <LoadingState />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="w-6 h-6 text-brand-gray" />}
          title="No products available"
          description="Check back later for new items."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const inCart = cart.find((item) => item.productId === product.id);
            const outOfStock = product.stock === 0;
            const lowStock = product.stock > 0 && product.stock < 5;

            return (
              <Card key={product.id} className={`flex flex-col ${CATEGORY_CARD_COLORS[product.category] || ""}`}>
                <div className="aspect-[4/3] bg-brand-light rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-12 h-12 text-brand-gray/40" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-brand-dark">{product.name}</h3>
                    <span className="text-lg font-bold text-brand-red whitespace-nowrap">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                  {product.description && (
                    <p className="text-sm text-brand-gray mb-3 line-clamp-2">{product.description}</p>
                  )}
                  <div className="flex items-center gap-2 mb-4">
                    {outOfStock ? (
                      <Badge variant="danger">Out of Stock</Badge>
                    ) : lowStock ? (
                      <Badge variant="warning">Only {product.stock} left</Badge>
                    ) : (
                      <Badge variant="success">In Stock ({product.stock})</Badge>
                    )}
                  </div>
                </div>
                {outOfStock ? (
                  <Button disabled className="w-full" variant="outline">
                    Out of Stock
                  </Button>
                ) : inCart ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-brand-light rounded-xl flex-1">
                      <button
                        onClick={() => updateQuantity(product.id, -1)}
                        className="p-2 hover:bg-brand-mid/20 rounded-l-xl"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-medium text-sm min-w-[2rem] text-center">{inCart.quantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id, 1)}
                        className="p-2 hover:bg-brand-mid/20 rounded-r-xl"
                        disabled={inCart.quantity >= product.stock}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <Button onClick={() => addToCart(product)} className="w-full" icon={<ShoppingCart className="w-4 h-4" />}>
                    Add to Cart
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Cart Sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="relative bg-white w-full max-w-md h-full shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-brand-mid/30">
              <h2 className="text-lg font-semibold text-brand-dark">Your Cart ({cartCount})</h2>
              <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-brand-light rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <EmptyState
                  icon={<ShoppingBag className="w-6 h-6 text-brand-gray" />}
                  title="Cart is empty"
                  description="Add some products to get started."
                />
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center gap-4 p-4 bg-brand-light rounded-xl">
                      <div className="flex-1">
                        <p className="font-medium text-brand-dark text-sm">{item.name}</p>
                        <p className="text-xs text-brand-gray">{formatCurrency(item.price)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="p-1 hover:bg-brand-mid/20 rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="p-1 hover:bg-brand-mid/20 rounded"
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="font-semibold text-brand-dark text-sm min-w-[80px] text-right">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-brand-mid/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-brand-gray">Total</span>
                  <span className="text-xl font-bold text-brand-dark">{formatCurrency(cartTotal)}</span>
                </div>
                <Button onClick={handlePlaceOrder} loading={ordering} className="w-full" size="lg">
                  Place Order
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Orders Modal */}
      {showOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowOrders(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-brand-mid/30">
              <h2 className="text-lg font-semibold text-brand-dark">My Orders</h2>
              <button onClick={() => setShowOrders(false)} className="p-2 hover:bg-brand-light rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {ordersLoading ? (
                <LoadingState />
              ) : orders.length === 0 ? (
                <EmptyState
                  icon={<ShoppingBag className="w-6 h-6 text-brand-gray" />}
                  title="No orders yet"
                  description="Place your first order from the shop."
                />
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-xs text-brand-gray">
                            {new Date(order.createdAt).toLocaleDateString("en-ZA", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-brand-gray mt-1">Order #{order.id.slice(0, 8)}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_STYLES[order.status] || ORDER_STATUS_STYLES.PENDING}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="space-y-2 mb-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span className="text-brand-dark">
                              {item.product.name} × {item.quantity}
                            </span>
                            <span className="text-brand-gray">
                              {formatCurrency(Number(item.unitPrice) * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-brand-mid/30">
                        <span className="text-sm text-brand-gray">Total</span>
                        <span className="font-semibold text-brand-dark">{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
