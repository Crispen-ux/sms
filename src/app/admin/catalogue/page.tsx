"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card, PageHeader, Button, Input, Select, Badge,
  Table, TableHeader, TableBody, TableRow, TableCell,
  EmptyState, LoadingState, ConfirmModal, useToast,
} from "@/components/ui";
import { Plus, Search, Package, Edit2, Trash2, X, AlertCircle, CheckCircle, Tag, ShoppingCart, AlertTriangle, Eye, EyeOff } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
  _count?: { orderItems: number };
}

const CATEGORIES = ["UNIFORM", "STATIONERY", "BOOKS", "SPORTS", "EXTRACURRICULAR", "OTHER"] as const;

const CATEGORY_LABELS: Record<string, string> = {
  UNIFORM: "Uniform",
  STATIONERY: "Stationery",
  BOOKS: "Books",
  SPORTS: "Sports",
  EXTRACURRICULAR: "Extracurricular",
  OTHER: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  UNIFORM: "bg-blue-50 text-blue-700",
  STATIONERY: "bg-green-50 text-green-700",
  BOOKS: "bg-purple-50 text-purple-700",
  SPORTS: "bg-orange-50 text-orange-700",
  EXTRACURRICULAR: "bg-pink-50 text-pink-700",
  OTHER: "bg-gray-50 text-gray-700",
};

function formatCurrency(amount: number) {
  return `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdminCataloguePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalCategories: 0,
    lowStock: 0,
    totalOrders: 0,
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(search && { search }),
        ...(filter !== "ALL" && { category: filter }),
      });
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setProducts(data.products);
      setTotalPages(data.totalPages);
      setTotal(data.total);

      const allProducts: Product[] = data.products;
      const categories = new Set(allProducts.map((p) => p.category));
      const lowStock = allProducts.filter((p) => p.stock < 5).length;
      const totalOrders = allProducts.reduce((acc, p) => acc + (p._count?.orderItems || 0), 0);
      setSummary({
        totalProducts: data.total,
        totalCategories: categories.size,
        lowStock,
        totalOrders,
      });
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSave = async (data: Partial<Product>) => {
    try {
      const method = editProduct ? "PATCH" : "POST";
      const url = editProduct ? `/api/products/${editProduct.id}` : "/api/products";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      setSuccess(editProduct ? "Product updated" : "Product created");
      setShowModal(false);
      setEditProduct(null);
      fetchProducts();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !product.active }),
      });
      setSuccess(product.active ? "Product deactivated" : "Product activated");
      fetchProducts();
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to update product");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/products/${confirmDelete}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast("Product deleted successfully");
      fetchProducts();
    } catch (e: any) {
      toast(e.message || "Failed to delete product", "error");
    }
    setConfirmDelete(null);
  };

  return (
    <div>
      <PageHeader
        title="Product Catalogue"
        description="Manage school products, uniforms, and supplies."
        action={
          <Button onClick={() => { setEditProduct(null); setShowModal(true); }} icon={<Plus className="w-4 h-4" />}>
            Add Product
          </Button>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-red/10 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-brand-red" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-dark">{summary.totalProducts}</p>
              <p className="text-xs text-brand-gray">Total Products</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Tag className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-dark">{summary.totalCategories}</p>
              <p className="text-xs text-brand-gray">Categories</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-dark">{summary.lowStock}</p>
              <p className="text-xs text-brand-gray">Low Stock</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-dark">{summary.totalOrders}</p>
              <p className="text-xs text-brand-gray">Total Orders</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              label="Search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search products..."
            />
          </div>
          <div className="w-48">
            <Select
              label="Category"
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(1); }}
              options={[
                { value: "ALL", label: "All Categories" },
                ...CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] })),
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => { setFilter("ALL"); setPage(1); }}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            filter === "ALL" ? "bg-brand-red text-white" : "bg-brand-light text-brand-dark hover:bg-brand-mid/20"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setFilter(cat); setPage(1); }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === cat ? "bg-brand-red text-white" : "bg-brand-light text-brand-dark hover:bg-brand-mid/20"
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Products Table */}
      <Card padding={false}>
        {loading ? (
          <LoadingState />
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Package className="w-6 h-6 text-brand-gray" />}
            title="No products found"
            description="Add your first product to get started."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="font-semibold text-brand-dark">Name</TableCell>
                <TableCell className="font-semibold text-brand-dark">Category</TableCell>
                <TableCell className="font-semibold text-brand-dark">Price</TableCell>
                <TableCell className="font-semibold text-brand-dark">Stock</TableCell>
                <TableCell className="font-semibold text-brand-dark">Status</TableCell>
                <TableCell className="font-semibold text-brand-dark text-right">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-brand-gray" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-brand-dark">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-brand-gray truncate max-w-[200px]">{product.description}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[product.category] || CATEGORY_COLORS.OTHER}`}>
                      {CATEGORY_LABELS[product.category] || product.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-brand-dark font-medium">{formatCurrency(product.price)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${product.stock < 5 ? "text-red-600" : "text-brand-dark"}`}>
                        {product.stock}
                      </span>
                      {product.stock < 5 && (
                        <Badge variant="danger">Low</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge>Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleActive(product)}
                        className="p-2 hover:bg-brand-light rounded-lg"
                        title={product.active ? "Deactivate" : "Activate"}
                      >
                        {product.active ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-brand-gray" />}
                      </button>
                      <button
                        onClick={() => { setEditProduct(product); setShowModal(true); }}
                        className="p-2 hover:bg-brand-light rounded-lg"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-brand-red" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(product.id)}
                        className="p-2 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-brand-mid/30">
            <span className="text-sm text-brand-gray">Page {page} of {totalPages} ({total} products)</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {showModal && (
        <ProductModal
          product={editProduct}
          onSubmit={handleSave}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
        />
      )}
      <ConfirmModal
        open={confirmDelete !== null}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function ProductModal({
  product,
  onSubmit,
  onClose,
}: {
  product: Product | null;
  onSubmit: (data: Partial<Product>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [category, setCategory] = useState(product?.category || "UNIFORM");
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [stock, setStock] = useState(product?.stock?.toString() || "0");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit({
      name,
      description: description || undefined,
      category,
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      imageUrl: imageUrl || undefined,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">
            {product ? "Edit Product" : "Add Product"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. School Blazer"
          />
          <div>
            <label className="text-sm font-medium text-brand-dark mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-brand-mid/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20"
              placeholder="Optional description"
            />
          </div>
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (R)"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <Input
              label="Stock"
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>
          <Input
            label="Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://... (optional)"
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              {product ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
