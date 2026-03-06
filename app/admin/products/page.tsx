"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Search, Edit2, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

export default function ProductsPage() {
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);
  const products = useAppStore((state) => state.products);
  const addProduct = useAppStore((state) => state.addProduct);
  const updateProduct = useAppStore((state) => state.updateProduct);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "product" | "process">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "process" as "product" | "process",
    unitPrice: "",
    unit: "件" as "件" | "个" | "组" | "套",
    remark: "",
    status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      router.push("/");
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== "admin") return null;

  // 过滤产品
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.includes(searchQuery) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === "all" || p.type === filterType;
    return matchesSearch && matchesType;
  });

  const openAddForm = () => {
    setEditingProduct(null);
    const nextCode = filterType === "product" ? `M00${products.filter(p => p.type === "product").length + 1}` : `P00${products.filter(p => p.type === "process").length + 1}`;
    setFormData({
      code: nextCode,
      name: "",
      type: filterType === "all" ? "process" : filterType,
      unitPrice: "",
      unit: "件",
      remark: "",
      status: "active",
    });
    setShowForm(true);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      type: product.type,
      unitPrice: product.unitPrice.toString(),
      unit: product.unit,
      remark: product.remark || "",
      status: product.status,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.code || !formData.name || !formData.unitPrice) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        code: formData.code,
        name: formData.name,
        type: formData.type,
        unitPrice: parseFloat(formData.unitPrice),
        unit: formData.unit,
        remark: formData.remark || undefined,
        status: formData.status,
      });
    } else {
      addProduct({
        id: `prod-${Date.now()}`,
        code: formData.code,
        name: formData.name,
        type: formData.type,
        unitPrice: parseFloat(formData.unitPrice),
        unit: formData.unit,
        remark: formData.remark || undefined,
        status: formData.status,
        createdAt: new Date(),
      });
    }

    setShowForm(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold">产品工序管理</h1>
        </div>
        <Button onClick={openAddForm} size="sm" className="h-10">
          <Plus className="mr-1 h-5 w-5" />
          添加
        </Button>
      </header>

      <div className="flex-1 p-4">
        {/* 筛选标签 */}
        <div className="mb-4 flex rounded-xl bg-muted p-1">
          {[
            { value: "all", label: "全部" },
            { value: "product", label: "产品" },
            { value: "process", label: "工序" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilterType(option.value as typeof filterType)}
              className={cn(
                "flex-1 rounded-lg py-2 text-base font-medium transition-colors",
                filterType === option.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* 搜索框 */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="搜索编号或名称"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-12 text-lg"
          />
        </div>

        {/* 产品列表 */}
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {product.code}
                      </span>
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-xs font-medium",
                          product.type === "product"
                            ? "bg-primary/10 text-primary"
                            : "bg-purple-100 text-purple-700"
                        )}
                      >
                        {product.type === "product" ? "产品" : "工序"}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          product.status === "active"
                            ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {product.status === "active" ? "启用" : "停用"}
                      </span>
                    </div>
                    <h3 className="mt-1 text-xl font-semibold text-foreground">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-lg text-primary font-medium">
                      单价: ¥{product.unitPrice}/{product.unit}
                    </p>
                    {product.remark && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {product.remark}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditForm(product)}
                    className="h-10 w-10 p-0"
                  >
                    <Edit2 className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredProducts.length === 0 && (
            <div className="py-10 text-center text-lg text-muted-foreground">
              {searchQuery ? "未找到相关产品" : "暂无产品"}
            </div>
          )}
        </div>
      </div>

      {/* 添加/编辑表单弹窗 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-t-2xl bg-card">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card p-4">
              <h2 className="text-xl font-semibold">
                {editingProduct ? "编辑产品" : "添加产品"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <label className="text-base font-medium">编号</label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="如 P001"
                  className="h-12 text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-base font-medium">名称</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="请输入产品/工序名称"
                  className="h-12 text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-base font-medium">类型</label>
                <div className="flex gap-4">
                  <button
                    onClick={() =>
                      setFormData({ ...formData, type: "process" })
                    }
                    className={cn(
                      "flex-1 rounded-lg border-2 py-3 text-lg font-medium transition-colors",
                      formData.type === "process"
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    工序
                  </button>
                  <button
                    onClick={() =>
                      setFormData({ ...formData, type: "product" })
                    }
                    className={cn(
                      "flex-1 rounded-lg border-2 py-3 text-lg font-medium transition-colors",
                      formData.type === "product"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    产品
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-base font-medium">单价（元）</label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={formData.unitPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, unitPrice: e.target.value })
                    }
                    placeholder="0.00"
                    className="h-12 text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-base font-medium">单位</label>
                  <div className="flex gap-2">
                    {(["件", "个", "组", "套"] as const).map((unit) => (
                      <button
                        key={unit}
                        onClick={() => setFormData({ ...formData, unit })}
                        className={cn(
                          "flex-1 rounded-lg border-2 py-3 text-base font-medium transition-colors",
                          formData.unit === unit
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground"
                        )}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-base font-medium">备注（可选）</label>
                <Input
                  value={formData.remark}
                  onChange={(e) =>
                    setFormData({ ...formData, remark: e.target.value })
                  }
                  placeholder="补充说明"
                  className="h-12 text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-base font-medium">状态</label>
                <div className="flex gap-4">
                  <button
                    onClick={() =>
                      setFormData({ ...formData, status: "active" })
                    }
                    className={cn(
                      "flex-1 rounded-lg border-2 py-3 text-lg font-medium transition-colors",
                      formData.status === "active"
                        ? "border-[hsl(var(--success))] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    启用
                  </button>
                  <button
                    onClick={() =>
                      setFormData({ ...formData, status: "inactive" })
                    }
                    className={cn(
                      "flex-1 rounded-lg border-2 py-3 text-lg font-medium transition-colors",
                      formData.status === "inactive"
                        ? "border-muted-foreground bg-muted text-foreground"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    停用
                  </button>
                </div>
              </div>

              {editingProduct && (
                <div className="flex items-start gap-2 rounded-lg bg-[hsl(var(--warning))]/10 p-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-[hsl(var(--warning))]" />
                  <p className="text-sm text-foreground">
                    单价变更仅对新记录生效，已有记录保留原单价
                  </p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="h-14 flex-1 text-lg"
                >
                  取消
                </Button>
                <Button onClick={handleSubmit} className="h-14 flex-1 text-lg">
                  保存
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
