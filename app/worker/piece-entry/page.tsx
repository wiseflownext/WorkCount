"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Minus, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

export default function PieceEntryPage() {
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);
  const products = useAppStore((state) => state.products);
  const addPieceRecord = useAppStore((state) => state.addPieceRecord);
  const getActiveTimeRecord = useAppStore((state) => state.getActiveTimeRecord);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const activeTimeRecord = getActiveTimeRecord();

  useEffect(() => {
    if (!currentUser) {
      router.push("/");
    }
  }, [currentUser, router]);

  // 如果正在计时，显示提示
  if (activeTimeRecord) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-card px-4">
          <button onClick={() => router.back()} className="p-2">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold">计件录入</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <span className="text-4xl">!</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">计时进行中</h2>
            <p className="mt-2 text-lg text-muted-foreground">
              请先结束当前计时任务后再录入计件
            </p>
            <Button
              onClick={() => router.push("/worker/time-clock")}
              className="mt-6 h-14 w-full text-xl"
            >
              前往计时页面
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const activeProducts = products.filter((p) => p.status === "active");
  const filteredProducts = activeProducts.filter(
    (p) =>
      p.name.includes(searchQuery) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const amount = selectedProduct ? quantity * selectedProduct.unitPrice : 0;

  const handleSubmit = async () => {
    if (!selectedProduct || !currentUser || quantity <= 0) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const today = new Date().toISOString().split("T")[0];
    addPieceRecord({
      id: `pr-${Date.now()}`,
      userId: currentUser.id,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      unitPriceSnapshot: selectedProduct.unitPrice,
      amount,
      workDate: today,
      createdAt: new Date(),
    });

    setIsSubmitting(false);
    setShowSuccess(true);

    setTimeout(() => {
      router.push("/worker");
    }, 1500);
  };

  if (showSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--success))]/10">
            <Check className="h-10 w-10 text-[hsl(var(--success))]" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">提交成功</h2>
          <p className="mt-4 text-3xl font-bold text-money">
            +¥{amount.toFixed(2)}
          </p>
          <p className="mt-2 text-lg text-muted-foreground">
            {selectedProduct?.name} × {quantity}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-card px-4">
        <button onClick={() => router.back()} className="p-2">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold">计件录入</h1>
      </header>

      <div className="flex-1 p-4">
        {!selectedProduct ? (
          /* 步骤1：选择产品 */
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              选择产品/工序
            </h2>

            {/* 搜索框 */}
            <div className="relative">
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
                <Card
                  key={product.id}
                  className="card-touch cursor-pointer border-2 transition-colors hover:border-primary"
                  onClick={() => setSelectedProduct(product)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
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
                      </div>
                      <p className="mt-1 text-xl font-semibold text-foreground">
                        {product.name}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-primary">
                      ¥{product.unitPrice.toFixed(2)}/{product.unit}
                    </p>
                  </CardContent>
                </Card>
              ))}

              {filteredProducts.length === 0 && (
                <div className="py-10 text-center text-lg text-muted-foreground">
                  未找到相关产品
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 步骤2：输入数量 */
          <div className="space-y-6">
            {/* 已选产品信息 */}
            <Card className="border-2 border-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {selectedProduct.code}
                    </p>
                    <p className="text-xl font-semibold text-foreground">
                      {selectedProduct.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="text-base text-primary"
                  >
                    重新选择
                  </button>
                </div>
                <p className="mt-2 text-lg text-muted-foreground">
                  单价: ¥{selectedProduct.unitPrice.toFixed(2)}/
                  {selectedProduct.unit}
                </p>
              </CardContent>
            </Card>

            {/* 数量输入 */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                输入数量
              </h2>
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl font-bold active:bg-muted/80"
                >
                  <Minus className="h-8 w-8" />
                </button>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="h-20 w-32 text-center text-4xl font-bold"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground active:bg-primary/80"
                >
                  <Plus className="h-8 w-8" />
                </button>
              </div>
              {/* 快捷数量按钮 */}
              <div className="flex justify-center gap-3">
                {[10, 20, 50, 100].map((num) => (
                  <button
                    key={num}
                    onClick={() => setQuantity(num)}
                    className={cn(
                      "rounded-lg px-4 py-2 text-lg font-medium transition-colors",
                      quantity === num
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* 合计金额 */}
            <Card className="bg-[hsl(var(--success))]/10">
              <CardContent className="p-6 text-center">
                <p className="text-lg text-foreground">合计</p>
                <p className="mt-2 text-4xl font-bold text-money">
                  ¥{amount.toFixed(2)}
                </p>
                <p className="mt-2 text-base text-muted-foreground">
                  {quantity} {selectedProduct.unit} × ¥
                  {selectedProduct.unitPrice.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            {/* 提交按钮 */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || quantity <= 0}
              className="h-16 w-full text-2xl font-semibold"
            >
              {isSubmitting ? "提交中..." : "提交"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
