"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Clock, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function TimeClockPage() {
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);
  const products = useAppStore((state) => state.products);
  const addTimeRecord = useAppStore((state) => state.addTimeRecord);
  const updateTimeRecord = useAppStore((state) => state.updateTimeRecord);
  const getActiveTimeRecord = useAppStore((state) => state.getActiveTimeRecord);

  const [workContent, setWorkContent] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [completedRecord, setCompletedRecord] = useState<{
    workContent: string;
    duration: number;
    amount: number;
  } | null>(null);

  const activeTimeRecord = getActiveTimeRecord();

  useEffect(() => {
    if (!currentUser) {
      router.push("/");
    }
  }, [currentUser, router]);

  // 计时器
  useEffect(() => {
    if (!activeTimeRecord) {
      setElapsedTime(0);
      return;
    }

    const updateElapsed = () => {
      const start = new Date(activeTimeRecord.startTime);
      const now = new Date();
      setElapsedTime(Math.floor((now.getTime() - start.getTime()) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeTimeRecord]);

  if (!currentUser) return null;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分钟`;
  };

  // 计算半小时数（向上取整）
  const calculateHalfHours = (seconds: number) => {
    const minutes = seconds / 60;
    return Math.ceil(minutes / 30);
  };

  const handleStartWork = () => {
    if (!workContent.trim()) return;

    const today = new Date().toISOString().split("T")[0];
    const selectedProduct = products.find((p) => p.id === selectedProductId);

    addTimeRecord({
      id: `tr-${Date.now()}`,
      userId: currentUser.id,
      productId: selectedProductId || undefined,
      workContent: workContent.trim(),
      startTime: new Date(),
      hourlyRateSnapshot: currentUser.hourlyRate,
      workDate: today,
      status: "working",
      createdAt: new Date(),
    });

    setWorkContent("");
    setSelectedProductId("");
  };

  const handleEndWork = () => {
    if (!activeTimeRecord) return;

    const endTime = new Date();
    const start = new Date(activeTimeRecord.startTime);
    const durationSeconds = Math.floor(
      (endTime.getTime() - start.getTime()) / 1000
    );
    const durationHalfHours = calculateHalfHours(durationSeconds);
    const amount = durationHalfHours * activeTimeRecord.hourlyRateSnapshot;

    updateTimeRecord(activeTimeRecord.id, {
      endTime,
      durationHalfHours,
      amount,
      status: "completed",
    });

    setCompletedRecord({
      workContent: activeTimeRecord.workContent,
      duration: durationHalfHours,
      amount,
    });
    setShowSuccess(true);
  };

  // 显示完成结果
  if (showSuccess && completedRecord) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-card px-4">
          <button onClick={() => router.back()} className="p-2">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold">计时打卡</h1>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--success))]/10">
              <Check className="h-10 w-10 text-[hsl(var(--success))]" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">计时完成</h2>

            <Card className="mt-6">
              <CardContent className="space-y-4 p-6">
                <div className="text-left">
                  <p className="text-sm text-muted-foreground">工作内容</p>
                  <p className="text-lg font-medium text-foreground">
                    {completedRecord.workContent}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-sm text-muted-foreground">工作时长</p>
                  <p className="text-lg font-medium text-foreground">
                    {completedRecord.duration}个半小时
                  </p>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">收入</p>
                  <p className="text-3xl font-bold text-money">
                    +¥{completedRecord.amount.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 space-y-3">
              <Button
                onClick={() => {
                  setShowSuccess(false);
                  setCompletedRecord(null);
                }}
                className="h-14 w-full text-xl"
              >
                继续计时
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/worker")}
                className="h-14 w-full text-xl"
              >
                返回首页
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 正在计时状态
  if (activeTimeRecord) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-card px-4">
          <button onClick={() => router.back()} className="p-2">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold">计时打卡</h1>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm">
            {/* 工作内容 */}
            <Card className="mb-8 border-2 border-[hsl(var(--success))]">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">当前工作</p>
                <p className="mt-1 text-xl font-semibold text-foreground">
                  {activeTimeRecord.workContent}
                </p>
              </CardContent>
            </Card>

            {/* 计时显示 */}
            <div className="relative mb-8">
              <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-full border-4 border-[hsl(var(--success))] pulse-working">
                <div className="text-center">
                  <p className="text-4xl font-bold text-foreground">
                    {formatTime(elapsedTime)}
                  </p>
                  <p className="mt-2 text-base text-muted-foreground">
                    已工作 {formatDuration(elapsedTime)}
                  </p>
                </div>
              </div>
            </div>

            {/* 预估收入 */}
            <Card className="mb-8 bg-muted/50">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  预估收入（{calculateHalfHours(elapsedTime)}个半小时 × ¥
                  {activeTimeRecord.hourlyRateSnapshot}）
                </p>
                <p className="mt-1 text-2xl font-bold text-money">
                  ¥
                  {(
                    calculateHalfHours(elapsedTime) *
                    activeTimeRecord.hourlyRateSnapshot
                  ).toFixed(2)}
                </p>
              </CardContent>
            </Card>

            {/* 结束按钮 */}
            <button
              onClick={handleEndWork}
              className="mx-auto flex h-32 w-32 flex-col items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg transition-transform active:scale-95"
            >
              <Square className="h-10 w-10" />
              <span className="mt-2 text-xl font-semibold">结束工作</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 未计时状态 - 开始新任务
  const activeProducts = products.filter((p) => p.status === "active");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-card px-4">
        <button onClick={() => router.back()} className="p-2">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold">计时打卡</h1>
      </header>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex-1 space-y-6">
          {/* 工作内容输入 */}
          <div className="space-y-3">
            <label className="text-lg font-semibold text-foreground">
              工作内容
            </label>
            <Input
              type="text"
              placeholder="请输入工作内容"
              value={workContent}
              onChange={(e) => setWorkContent(e.target.value)}
              className="h-14 text-lg"
            />
          </div>

          {/* 关联产品（可选） */}
          <div className="space-y-3">
            <label className="text-lg font-semibold text-foreground">
              关联产品/工序（可选）
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedProductId("")}
                className={cn(
                  "rounded-lg px-4 py-2 text-base font-medium transition-colors",
                  !selectedProductId
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                不关联
              </button>
              {activeProducts.slice(0, 5).map((product) => (
                <button
                  key={product.id}
                  onClick={() => setSelectedProductId(product.id)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-base font-medium transition-colors",
                    selectedProductId === product.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {product.name}
                </button>
              ))}
            </div>
          </div>

          {/* 时薪信息 */}
          <Card className="bg-muted/50">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-muted-foreground" />
                <span className="text-lg text-foreground">您的时薪</span>
              </div>
              <span className="text-xl font-bold text-primary">
                ¥{currentUser.hourlyRate}/半小时
              </span>
            </CardContent>
          </Card>
        </div>

        {/* 开始按钮 */}
        <div className="mt-8 flex flex-col items-center">
          <button
            onClick={handleStartWork}
            disabled={!workContent.trim()}
            className={cn(
              "flex h-36 w-36 flex-col items-center justify-center rounded-full shadow-lg transition-all",
              workContent.trim()
                ? "bg-[hsl(var(--success))] text-white active:scale-95"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Play className="h-12 w-12" />
            <span className="mt-2 text-xl font-semibold">开始工作</span>
          </button>
          {!workContent.trim() && (
            <p className="mt-4 text-base text-muted-foreground">
              请先输入工作内容
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
