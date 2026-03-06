"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MobileLayout } from "@/components/mobile-layout";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type ViewMode = "day" | "week" | "month";

export default function ReportsPage() {
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);
  const users = useAppStore((state) => state.users);
  const pieceRecords = useAppStore((state) => state.pieceRecords);
  const timeRecords = useAppStore((state) => state.timeRecords);

  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedUserId, setSelectedUserId] = useState<string>("all");

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      router.push("/");
    }
  }, [currentUser, router]);

  // 获取周的起止日期
  const getWeekRange = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  };

  // 获取月的起止日期
  const getMonthRange = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start, end };
  };

  // 计算报表数据
  const reportData = useMemo(() => {
    const workers = users.filter((u) => u.role === "worker");
    let dateRange: { start: Date; end: Date };

    if (viewMode === "day") {
      const dateStr = currentDate.toISOString().split("T")[0];
      dateRange = {
        start: new Date(dateStr),
        end: new Date(dateStr),
      };
    } else if (viewMode === "week") {
      dateRange = getWeekRange(currentDate);
    } else {
      dateRange = getMonthRange(currentDate);
    }

    const workerData = workers
      .filter((w) => selectedUserId === "all" || w.id === selectedUserId)
      .map((worker) => {
        let totalPiece = 0;
        let totalTime = 0;
        let pieceCount = 0;
        let timeHours = 0;

        // 遍历日期范围
        const current = new Date(dateRange.start);
        while (current <= dateRange.end) {
          const dateStr = current.toISOString().split("T")[0];

          const dayPiece = pieceRecords.filter(
            (r) => r.userId === worker.id && r.workDate === dateStr
          );
          const dayTime = timeRecords.filter(
            (r) =>
              r.userId === worker.id &&
              r.workDate === dateStr &&
              r.status === "completed"
          );

          totalPiece += dayPiece.reduce((sum, r) => sum + r.amount, 0);
          totalTime += dayTime.reduce((sum, r) => sum + (r.amount || 0), 0);
          pieceCount += dayPiece.reduce((sum, r) => sum + r.quantity, 0);
          timeHours += dayTime.reduce(
            (sum, r) => sum + (r.durationHalfHours || 0),
            0
          );

          current.setDate(current.getDate() + 1);
        }

        return {
          id: worker.id,
          name: worker.name,
          pieceCount,
          pieceIncome: totalPiece,
          timeHours,
          timeIncome: totalTime,
          total: totalPiece + totalTime,
        };
      });

    const grandTotal = {
      pieceCount: workerData.reduce((sum, w) => sum + w.pieceCount, 0),
      pieceIncome: workerData.reduce((sum, w) => sum + w.pieceIncome, 0),
      timeHours: workerData.reduce((sum, w) => sum + w.timeHours, 0),
      timeIncome: workerData.reduce((sum, w) => sum + w.timeIncome, 0),
      total: workerData.reduce((sum, w) => sum + w.total, 0),
    };

    return { workerData, grandTotal };
  }, [currentUser, users, pieceRecords, timeRecords, currentDate, viewMode, selectedUserId]);

  if (!currentUser || currentUser.role !== "admin") return null;

  const workers = users.filter((u) => u.role === "worker");

  const changePeriod = (delta: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + delta);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + delta * 7);
    } else {
      newDate.setMonth(newDate.getMonth() + delta);
    }
    if (newDate <= new Date()) {
      setCurrentDate(newDate);
    }
  };

  const getPeriodLabel = () => {
    if (viewMode === "day") {
      return `${currentDate.getMonth() + 1}月${currentDate.getDate()}日`;
    } else if (viewMode === "week") {
      const range = getWeekRange(currentDate);
      return `${range.start.getMonth() + 1}/${range.start.getDate()} - ${range.end.getMonth() + 1}/${range.end.getDate()}`;
    } else {
      return `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
    }
  };

  const isCurrentPeriod = () => {
    const today = new Date();
    if (viewMode === "day") {
      return currentDate.toDateString() === today.toDateString();
    } else if (viewMode === "week") {
      const currentRange = getWeekRange(currentDate);
      const todayRange = getWeekRange(today);
      return currentRange.start.getTime() === todayRange.start.getTime();
    } else {
      return (
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear()
      );
    }
  };

  return (
    <MobileLayout role="admin">
      <div className="space-y-4 p-4">
        <h1 className="pt-2 text-2xl font-bold text-foreground">数据报表</h1>

        {/* 视图切换 */}
        <div className="flex rounded-xl bg-muted p-1">
          {[
            { value: "day", label: "日报" },
            { value: "week", label: "周报" },
            { value: "month", label: "月报" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setViewMode(option.value as ViewMode)}
              className={cn(
                "flex-1 rounded-lg py-2 text-base font-medium transition-colors",
                viewMode === option.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* 员工筛选 */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedUserId("all")}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-base font-medium transition-colors",
              selectedUserId === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            )}
          >
            全部员工
          </button>
          {workers.map((worker) => (
            <button
              key={worker.id}
              onClick={() => setSelectedUserId(worker.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-base font-medium transition-colors",
                selectedUserId === worker.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              {worker.name}
            </button>
          ))}
        </div>

        {/* 周期选择器 */}
        <div className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm">
          <button
            onClick={() => changePeriod(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">
              {getPeriodLabel()}
            </p>
            {isCurrentPeriod() && (
              <span className="text-sm text-primary font-medium">
                {viewMode === "day" ? "今天" : viewMode === "week" ? "本周" : "本月"}
              </span>
            )}
          </div>
          <button
            onClick={() => changePeriod(1)}
            disabled={isCurrentPeriod()}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              isCurrentPeriod()
                ? "bg-muted/50 text-muted-foreground"
                : "bg-muted"
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* 汇总卡片 */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-0 bg-primary/10">
            <CardContent className="p-3 text-center">
              <p className="text-sm text-muted-foreground">计件总额</p>
              <p className="mt-1 text-xl font-bold text-primary">
                ¥{reportData.grandTotal.pieceIncome.toFixed(0)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-[hsl(var(--warning))]/10">
            <CardContent className="p-3 text-center">
              <p className="text-sm text-muted-foreground">计时总额</p>
              <p className="mt-1 text-xl font-bold text-[hsl(var(--warning))]">
                ¥{reportData.grandTotal.timeIncome.toFixed(0)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-[hsl(var(--success))]/10">
            <CardContent className="p-3 text-center">
              <p className="text-sm text-muted-foreground">合计</p>
              <p className="mt-1 text-xl font-bold text-money">
                ¥{reportData.grandTotal.total.toFixed(0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 数据表格 */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">
                      员工
                    </th>
                    <th className="px-3 py-3 text-right text-sm font-medium text-muted-foreground">
                      计件
                    </th>
                    <th className="px-3 py-3 text-right text-sm font-medium text-muted-foreground">
                      计时
                    </th>
                    <th className="px-3 py-3 text-right text-sm font-medium text-muted-foreground">
                      合计
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reportData.workerData.map((worker) => (
                    <tr key={worker.id}>
                      <td className="px-3 py-3 text-base font-medium text-foreground">
                        {worker.name}
                      </td>
                      <td className="px-3 py-3 text-right text-base text-foreground">
                        {worker.pieceIncome > 0
                          ? `¥${worker.pieceIncome.toFixed(0)}`
                          : "-"}
                      </td>
                      <td className="px-3 py-3 text-right text-base text-foreground">
                        {worker.timeIncome > 0
                          ? `¥${worker.timeIncome.toFixed(0)}`
                          : "-"}
                      </td>
                      <td className="px-3 py-3 text-right text-base font-semibold text-money">
                        {worker.total > 0 ? `¥${worker.total.toFixed(0)}` : "-"}
                      </td>
                    </tr>
                  ))}
                  {reportData.workerData.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-8 text-center text-base text-muted-foreground"
                      >
                        暂无数据
                      </td>
                    </tr>
                  )}
                </tbody>
                {reportData.workerData.length > 0 && (
                  <tfoot>
                    <tr className="bg-[hsl(var(--success))]/10">
                      <td className="px-3 py-3 text-base font-semibold text-foreground">
                        合计
                      </td>
                      <td className="px-3 py-3 text-right text-base font-semibold text-foreground">
                        ¥{reportData.grandTotal.pieceIncome.toFixed(0)}
                      </td>
                      <td className="px-3 py-3 text-right text-base font-semibold text-foreground">
                        ¥{reportData.grandTotal.timeIncome.toFixed(0)}
                      </td>
                      <td className="px-3 py-3 text-right text-base font-bold text-money">
                        ¥{reportData.grandTotal.total.toFixed(0)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
}
