"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calculator, Clock, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MobileLayout } from "@/components/mobile-layout";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function WorkerHomePage() {
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);
  const getTodayData = useAppStore((state) => state.getTodayData);
  const getActiveTimeRecord = useAppStore((state) => state.getActiveTimeRecord);

  useEffect(() => {
    if (!currentUser) {
      router.push("/");
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return null;
  }

  const todayData = getTodayData();
  const activeTimeRecord = getActiveTimeRecord();

  // 格式化日期
  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日 星期${
    ["日", "一", "二", "三", "四", "五", "六"][today.getDay()]
  }`;

  // 计算活跃计时的持续时间
  const getActiveDuration = () => {
    if (!activeTimeRecord) return "";
    const start = new Date(activeTimeRecord.startTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    return `${hours}小时${minutes}分钟`;
  };

  return (
    <MobileLayout role="worker">
      <div className="space-y-6 p-4">
        {/* 顶部问候 */}
        <div className="pt-2">
          <h1 className="text-2xl font-bold text-foreground">
            你好，{currentUser.name}
          </h1>
          <p className="mt-1 text-lg text-muted-foreground">{dateStr}</p>
        </div>

        {/* 计时中提示横幅 */}
        {activeTimeRecord && (
          <Link href="/worker/time-clock">
            <Card className="border-2 border-[hsl(var(--success))] bg-[hsl(var(--success))]/10 pulse-working">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--success))]">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      正在计时中...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activeTimeRecord.workContent} · {getActiveDuration()}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        )}

        {/* 今日收入卡片 */}
        <Card className="border-0 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
          <CardContent className="p-6">
            <p className="text-lg opacity-90">今日收入</p>
            <p className="mt-2 text-4xl font-bold">
              ¥{todayData.totalIncome.toFixed(2)}
            </p>
            <div className="mt-4 flex gap-6 text-base opacity-90">
              <span>计件 ¥{todayData.pieceIncome.toFixed(2)}</span>
              <span>计时 ¥{todayData.timeIncome.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* 快捷操作按钮 */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/worker/piece-entry">
            <Card
              className={cn(
                "card-touch cursor-pointer border-2 transition-all hover:border-primary hover:shadow-md",
                activeTimeRecord && "opacity-50 pointer-events-none"
              )}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Calculator className="h-8 w-8 text-primary" />
                </div>
                <span className="text-xl font-semibold text-foreground">
                  计件录入
                </span>
                {activeTimeRecord && (
                  <span className="mt-1 text-sm text-destructive">
                    计时中不可用
                  </span>
                )}
              </CardContent>
            </Card>
          </Link>

          <Link href="/worker/time-clock">
            <Card className="card-touch cursor-pointer border-2 transition-all hover:border-primary hover:shadow-md">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--warning))]/10">
                  <Clock className="h-8 w-8 text-[hsl(var(--warning))]" />
                </div>
                <span className="text-xl font-semibold text-foreground">
                  计时打卡
                </span>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* 今日记录列表 */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">今日记录</h2>
            <Link
              href="/worker/daily"
              className="text-base text-primary hover:underline"
            >
              查看全部
            </Link>
          </div>

          {todayData.pieceRecords.length === 0 &&
          todayData.timeRecords.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="text-lg text-muted-foreground">今日暂无记录</p>
                <p className="mt-1 text-base text-muted-foreground">
                  快去录入第一条数据吧
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* 计件记录 */}
              {todayData.pieceRecords.map((record) => (
                <Card key={record.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-primary/10 px-2 py-1 text-sm font-medium text-primary">
                        计件
                      </span>
                      <div>
                        <p className="text-base font-medium text-foreground">
                          {record.productName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {record.quantity}件 × ¥{record.unitPriceSnapshot}
                        </p>
                      </div>
                    </div>
                    <p className="text-lg font-semibold text-money">
                      +¥{record.amount.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              ))}

              {/* 计时记录 */}
              {todayData.timeRecords.map((record) => (
                <Card key={record.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-[hsl(var(--warning))]/10 px-2 py-1 text-sm font-medium text-[hsl(var(--warning))]">
                        计时
                      </span>
                      <div>
                        <p className="text-base font-medium text-foreground">
                          {record.workContent}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {record.durationHalfHours}个半小时 × ¥
                          {record.hourlyRateSnapshot}
                        </p>
                      </div>
                    </div>
                    <p className="text-lg font-semibold text-money">
                      +¥{(record.amount || 0).toFixed(2)}
                    </p>
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
