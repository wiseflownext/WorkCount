"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MobileLayout } from "@/components/mobile-layout";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function DailyReportPage() {
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);
  const pieceRecords = useAppStore((state) => state.pieceRecords);
  const timeRecords = useAppStore((state) => state.timeRecords);

  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!currentUser) {
      router.push("/");
    }
  }, [currentUser, router]);

  const dateStr = currentDate.toISOString().split("T")[0];

  // 获取当天数据
  const dayData = useMemo(() => {
    if (!currentUser) return { pieceRecords: [], timeRecords: [], pieceIncome: 0, timeIncome: 0, totalIncome: 0 };

    const dayPiece = pieceRecords.filter(
      (r) => r.userId === currentUser.id && r.workDate === dateStr
    );
    const dayTime = timeRecords.filter(
      (r) => r.userId === currentUser.id && r.workDate === dateStr && r.status === "completed"
    );

    const pieceIncome = dayPiece.reduce((sum, r) => sum + r.amount, 0);
    const timeIncome = dayTime.reduce((sum, r) => sum + (r.amount || 0), 0);

    return {
      pieceRecords: dayPiece,
      timeRecords: dayTime,
      pieceIncome,
      timeIncome,
      totalIncome: pieceIncome + timeIncome,
    };
  }, [currentUser, pieceRecords, timeRecords, dateStr]);

  if (!currentUser) return null;

  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    const weekday = weekdays[date.getDay()];
    return `${month}月${day}日 星期${weekday}`;
  };

  const changeDate = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + delta);
    // 不能选择未来的日期
    if (newDate <= new Date()) {
      setCurrentDate(newDate);
    }
  };

  const isToday = dateStr === new Date().toISOString().split("T")[0];

  return (
    <MobileLayout role="worker">
      <div className="space-y-4 p-4">
        {/* 标题 */}
        <h1 className="pt-2 text-2xl font-bold text-foreground">我的日报</h1>

        {/* 日期选择器 */}
        <div className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm">
          <button
            onClick={() => changeDate(-1)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-muted active:bg-muted/80"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="text-center">
            <p className="text-xl font-semibold text-foreground">
              {formatDate(currentDate)}
            </p>
            {isToday && (
              <span className="text-sm text-primary font-medium">今天</span>
            )}
          </div>
          <button
            onClick={() => changeDate(1)}
            disabled={isToday}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full",
              isToday
                ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
                : "bg-muted active:bg-muted/80"
            )}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* 收入汇总卡片 */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-primary/10 p-4 text-center">
                <p className="text-base text-muted-foreground">计件收入</p>
                <p className="mt-1 text-2xl font-bold text-primary">
                  ¥{dayData.pieceIncome.toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl bg-[hsl(var(--warning))]/10 p-4 text-center">
                <p className="text-base text-muted-foreground">计时收入</p>
                <p className="mt-1 text-2xl font-bold text-[hsl(var(--warning))]">
                  ¥{dayData.timeIncome.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-[hsl(var(--success))]/10 p-4 text-center">
              <p className="text-base text-muted-foreground">日合计</p>
              <p className="mt-1 text-3xl font-bold text-money">
                ¥{dayData.totalIncome.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 记录列表 */}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            详细记录
          </h2>

          {dayData.pieceRecords.length === 0 &&
          dayData.timeRecords.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg text-muted-foreground">
                  {formatDate(currentDate)} 暂无记录
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* 计件记录 */}
              {dayData.pieceRecords.map((record) => (
                <Card key={record.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 rounded-md bg-primary/10 px-2 py-1 text-sm font-medium text-primary">
                          计件
                        </span>
                        <div>
                          <p className="text-lg font-medium text-foreground">
                            {record.productName}
                          </p>
                          <p className="mt-1 text-base text-muted-foreground">
                            {record.quantity}件 × ¥{record.unitPriceSnapshot}/件
                          </p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-money">
                        +¥{record.amount.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* 计时记录 */}
              {dayData.timeRecords.map((record) => (
                <Card key={record.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 rounded-md bg-[hsl(var(--warning))]/10 px-2 py-1 text-sm font-medium text-[hsl(var(--warning))]">
                          计时
                        </span>
                        <div>
                          <p className="text-lg font-medium text-foreground">
                            {record.workContent}
                          </p>
                          <p className="mt-1 text-base text-muted-foreground">
                            {record.durationHalfHours}个半小时 × ¥
                            {record.hourlyRateSnapshot}/半小时
                          </p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-money">
                        +¥{(record.amount || 0).toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
