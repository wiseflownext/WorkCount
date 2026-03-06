"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MobileLayout } from "@/components/mobile-layout";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type ViewMode = "week" | "month";

export default function PayslipPage() {
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);
  const pieceRecords = useAppStore((state) => state.pieceRecords);
  const timeRecords = useAppStore((state) => state.timeRecords);

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!currentUser) {
      router.push("/");
    }
  }, [currentUser, router]);

  // 获取周的起止日期
  const getWeekRange = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 调整到周一
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

  // 计算指定日期范围内的数据
  const periodData = useMemo(() => {
    if (!currentUser) {
      return { dailyData: [], totalPiece: 0, totalTime: 0, total: 0 };
    }

    const range =
      viewMode === "week"
        ? getWeekRange(currentDate)
        : getMonthRange(currentDate);

    const dailyData: {
      date: string;
      dateLabel: string;
      pieceIncome: number;
      timeIncome: number;
      total: number;
    }[] = [];

    const current = new Date(range.start);
    while (current <= range.end) {
      const dateStr = current.toISOString().split("T")[0];

      const dayPiece = pieceRecords.filter(
        (r) => r.userId === currentUser.id && r.workDate === dateStr
      );
      const dayTime = timeRecords.filter(
        (r) =>
          r.userId === currentUser.id &&
          r.workDate === dateStr &&
          r.status === "completed"
      );

      const pieceIncome = dayPiece.reduce((sum, r) => sum + r.amount, 0);
      const timeIncome = dayTime.reduce((sum, r) => sum + (r.amount || 0), 0);

      dailyData.push({
        date: dateStr,
        dateLabel: `${current.getMonth() + 1}/${current.getDate()}`,
        pieceIncome,
        timeIncome,
        total: pieceIncome + timeIncome,
      });

      current.setDate(current.getDate() + 1);
    }

    const totalPiece = dailyData.reduce((sum, d) => sum + d.pieceIncome, 0);
    const totalTime = dailyData.reduce((sum, d) => sum + d.timeIncome, 0);

    return {
      dailyData,
      totalPiece,
      totalTime,
      total: totalPiece + totalTime,
    };
  }, [currentUser, pieceRecords, timeRecords, currentDate, viewMode]);

  if (!currentUser) return null;

  const changePeriod = (delta: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + delta * 7);
    } else {
      newDate.setMonth(newDate.getMonth() + delta);
    }
    // 不能选择未来
    const today = new Date();
    if (viewMode === "week") {
      const range = getWeekRange(newDate);
      if (range.start <= today) {
        setCurrentDate(newDate);
      }
    } else {
      const range = getMonthRange(newDate);
      if (range.start <= today) {
        setCurrentDate(newDate);
      }
    }
  };

  const getPeriodLabel = () => {
    if (viewMode === "week") {
      const range = getWeekRange(currentDate);
      return `${range.start.getMonth() + 1}/${range.start.getDate()} - ${range.end.getMonth() + 1}/${range.end.getDate()}`;
    } else {
      return `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
    }
  };

  const isCurrentPeriod = () => {
    const today = new Date();
    if (viewMode === "week") {
      const currentRange = getWeekRange(currentDate);
      const todayRange = getWeekRange(today);
      return (
        currentRange.start.getTime() === todayRange.start.getTime()
      );
    } else {
      return (
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear()
      );
    }
  };

  // 计算最大日收入（用于柱状图）
  const maxDayIncome = Math.max(...periodData.dailyData.map((d) => d.total), 1);

  return (
    <MobileLayout role="worker">
      <div className="space-y-4 p-4">
        {/* 标题 */}
        <h1 className="pt-2 text-2xl font-bold text-foreground">我的工资条</h1>

        {/* 周/月切换 */}
        <div className="flex rounded-xl bg-muted p-1">
          <button
            onClick={() => setViewMode("week")}
            className={cn(
              "flex-1 rounded-lg py-3 text-lg font-medium transition-colors",
              viewMode === "week"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            周报
          </button>
          <button
            onClick={() => setViewMode("month")}
            className={cn(
              "flex-1 rounded-lg py-3 text-lg font-medium transition-colors",
              viewMode === "month"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            月报
          </button>
        </div>

        {/* 周期选择器 */}
        <div className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm">
          <button
            onClick={() => changePeriod(-1)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-muted active:bg-muted/80"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="text-center">
            <p className="text-xl font-semibold text-foreground">
              {getPeriodLabel()}
            </p>
            {isCurrentPeriod() && (
              <span className="text-sm text-primary font-medium">
                {viewMode === "week" ? "本周" : "本月"}
              </span>
            )}
          </div>
          <button
            onClick={() => changePeriod(1)}
            disabled={isCurrentPeriod()}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full",
              isCurrentPeriod()
                ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
                : "bg-muted active:bg-muted/80"
            )}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* 汇总卡片 */}
        <Card className="border-0 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
          <CardContent className="p-6">
            <p className="text-lg opacity-90">
              {viewMode === "week" ? "本周合计" : "本月合计"}
            </p>
            <p className="mt-2 text-4xl font-bold">
              ¥{periodData.total.toFixed(2)}
            </p>
            <div className="mt-4 flex gap-6 text-base opacity-90">
              <span>计件 ¥{periodData.totalPiece.toFixed(2)}</span>
              <span>计时 ¥{periodData.totalTime.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* 柱状图（简化版） */}
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-4 text-base font-semibold text-foreground">
              每日收入
            </h3>
            <div className="flex items-end justify-between gap-1">
              {periodData.dailyData.slice(0, viewMode === "week" ? 7 : 15).map((day, index) => (
                <div key={index} className="flex flex-1 flex-col items-center">
                  <div
                    className="w-full rounded-t-sm bg-primary"
                    style={{
                      height: `${Math.max((day.total / maxDayIncome) * 100, 4)}px`,
                      minHeight: day.total > 0 ? "4px" : "2px",
                      backgroundColor:
                        day.total > 0
                          ? "hsl(var(--primary))"
                          : "hsl(var(--muted))",
                    }}
                  />
                  <span className="mt-2 text-xs text-muted-foreground">
                    {day.dateLabel.split("/")[1]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 明细表格 */}
        <Card>
          <CardContent className="p-0">
            <div className="border-b border-border p-4">
              <h3 className="text-base font-semibold text-foreground">
                收入明细
              </h3>
            </div>
            <div className="divide-y divide-border">
              {/* 表头 */}
              <div className="grid grid-cols-4 gap-2 bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
                <span>日期</span>
                <span className="text-right">计件</span>
                <span className="text-right">计时</span>
                <span className="text-right">合计</span>
              </div>
              {/* 数据行 */}
              {periodData.dailyData.map((day, index) => (
                <div
                  key={index}
                  className={cn(
                    "grid grid-cols-4 gap-2 px-4 py-3 text-base",
                    day.total > 0 ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <span>{day.dateLabel}</span>
                  <span className="text-right">
                    {day.pieceIncome > 0 ? `¥${day.pieceIncome.toFixed(0)}` : "-"}
                  </span>
                  <span className="text-right">
                    {day.timeIncome > 0 ? `¥${day.timeIncome.toFixed(0)}` : "-"}
                  </span>
                  <span
                    className={cn(
                      "text-right font-medium",
                      day.total > 0 && "text-money"
                    )}
                  >
                    {day.total > 0 ? `¥${day.total.toFixed(0)}` : "-"}
                  </span>
                </div>
              ))}
              {/* 合计行 */}
              <div className="grid grid-cols-4 gap-2 bg-[hsl(var(--success))]/10 px-4 py-3 text-base font-semibold">
                <span>合计</span>
                <span className="text-right">
                  ¥{periodData.totalPiece.toFixed(0)}
                </span>
                <span className="text-right">
                  ¥{periodData.totalTime.toFixed(0)}
                </span>
                <span className="text-right text-money">
                  ¥{periodData.total.toFixed(0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
}
