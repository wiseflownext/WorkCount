"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Package, BarChart3, Download, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MobileLayout } from "@/components/mobile-layout";
import { useAppStore } from "@/lib/store";

export default function AdminHomePage() {
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);
  const users = useAppStore((state) => state.users);
  const pieceRecords = useAppStore((state) => state.pieceRecords);
  const timeRecords = useAppStore((state) => state.timeRecords);

  useEffect(() => {
    if (!currentUser) {
      router.push("/");
    } else if (currentUser.role !== "admin") {
      router.push("/worker");
    }
  }, [currentUser, router]);

  const today = new Date().toISOString().split("T")[0];

  // 计算今日统计数据
  const todayStats = useMemo(() => {
    const todayPiece = pieceRecords.filter((r) => r.workDate === today);
    const todayTime = timeRecords.filter((r) => r.workDate === today);

    const activeWorkerIds = new Set([
      ...todayPiece.map((r) => r.userId),
      ...todayTime.map((r) => r.userId),
    ]);

    const workingCount = todayTime.filter((r) => r.status === "working").length;

    const totalPieceIncome = todayPiece.reduce((sum, r) => sum + r.amount, 0);
    const totalTimeIncome = todayTime
      .filter((r) => r.status === "completed")
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    return {
      activeWorkers: activeWorkerIds.size,
      workingCount,
      totalOutput: totalPieceIncome + totalTimeIncome,
      recentRecords: [...todayPiece, ...todayTime]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10),
    };
  }, [pieceRecords, timeRecords, today]);

  if (!currentUser || currentUser.role !== "admin") return null;

  // 格式化日期
  const dateStr = `${new Date().getMonth() + 1}月${new Date().getDate()}日 星期${
    ["日", "一", "二", "三", "四", "五", "六"][new Date().getDay()]
  }`;

  // 获取用户名
  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.name || "未知";
  };

  return (
    <MobileLayout role="admin">
      <div className="space-y-6 p-4">
        {/* 顶部 */}
        <div className="pt-2">
          <h1 className="text-2xl font-bold text-foreground">管理员面板</h1>
          <p className="mt-1 text-lg text-muted-foreground">{dateStr}</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 bg-primary text-primary-foreground shadow-lg">
            <CardContent className="p-4">
              <p className="text-base opacity-90">今日在岗</p>
              <p className="mt-1 text-3xl font-bold">
                {todayStats.activeWorkers}
                <span className="ml-1 text-lg font-normal">人</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-[hsl(var(--success))] text-white shadow-lg">
            <CardContent className="p-4">
              <p className="text-base opacity-90">今日产出</p>
              <p className="mt-1 text-2xl font-bold">
                ¥{todayStats.totalOutput.toFixed(0)}
              </p>
            </CardContent>
          </Card>

          {todayStats.workingCount > 0 && (
            <Card className="col-span-2 border-2 border-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10">
              <CardContent className="flex items-center gap-3 p-4">
                <Clock className="h-6 w-6 text-[hsl(var(--warning))]" />
                <span className="text-lg font-medium text-foreground">
                  正在计时: {todayStats.workingCount}人
                </span>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 快捷操作 */}
        <div className="grid grid-cols-4 gap-3">
          <Link href="/admin/employees">
            <Card className="card-touch cursor-pointer border transition-all hover:border-primary">
              <CardContent className="flex flex-col items-center justify-center p-4">
                <Users className="h-7 w-7 text-primary" />
                <span className="mt-2 text-sm font-medium text-foreground">
                  员工管理
                </span>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/products">
            <Card className="card-touch cursor-pointer border transition-all hover:border-primary">
              <CardContent className="flex flex-col items-center justify-center p-4">
                <Package className="h-7 w-7 text-primary" />
                <span className="mt-2 text-sm font-medium text-foreground">
                  产品管理
                </span>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/reports">
            <Card className="card-touch cursor-pointer border transition-all hover:border-primary">
              <CardContent className="flex flex-col items-center justify-center p-4">
                <BarChart3 className="h-7 w-7 text-primary" />
                <span className="mt-2 text-sm font-medium text-foreground">
                  数据报表
                </span>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/export">
            <Card className="card-touch cursor-pointer border transition-all hover:border-primary">
              <CardContent className="flex flex-col items-center justify-center p-4">
                <Download className="h-7 w-7 text-primary" />
                <span className="mt-2 text-sm font-medium text-foreground">
                  数据导出
                </span>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* 今日动态 */}
        <div>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            今日动态
          </h2>

          {todayStats.recentRecords.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="text-lg text-muted-foreground">今日暂无记录</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {todayStats.recentRecords.map((record) => {
                const isPiece = "quantity" in record;
                return (
                  <Card key={record.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-md px-2 py-1 text-sm font-medium ${
                            isPiece
                              ? "bg-primary/10 text-primary"
                              : "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]"
                          }`}
                        >
                          {isPiece ? "计件" : "计时"}
                        </span>
                        <div>
                          <p className="text-base font-medium text-foreground">
                            {getUserName(record.userId)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {isPiece
                              ? (record as typeof pieceRecords[0]).productName
                              : (record as typeof timeRecords[0]).workContent}
                          </p>
                        </div>
                      </div>
                      {(record as typeof pieceRecords[0]).amount !== undefined ? (
                        <p className="text-lg font-semibold text-money">
                          +¥{((record as typeof pieceRecords[0]).amount || 0).toFixed(2)}
                        </p>
                      ) : (
                        <span className="rounded-full bg-[hsl(var(--success))]/10 px-3 py-1 text-sm font-medium text-[hsl(var(--success))]">
                          进行中
                        </span>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
