"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Download, Check, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MobileLayout } from "@/components/mobile-layout";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type DataType = "piece" | "time" | "summary";

export default function ExportPage() {
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);
  const users = useAppStore((state) => state.users);
  const pieceRecords = useAppStore((state) => state.pieceRecords);
  const timeRecords = useAppStore((state) => state.timeRecords);

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // 本月第一天
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [selectedTypes, setSelectedTypes] = useState<DataType[]>(["piece", "time", "summary"]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      router.push("/");
    }
  }, [currentUser, router]);

  // 计算将导出的记录数
  const recordCount = useMemo(() => {
    let count = 0;
    
    const filteredPiece = pieceRecords.filter((r) => {
      const matchUser = selectedUserId === "all" || r.userId === selectedUserId;
      const matchDate = r.workDate >= startDate && r.workDate <= endDate;
      return matchUser && matchDate;
    });

    const filteredTime = timeRecords.filter((r) => {
      const matchUser = selectedUserId === "all" || r.userId === selectedUserId;
      const matchDate = r.workDate >= startDate && r.workDate <= endDate;
      return matchUser && matchDate && r.status === "completed";
    });

    if (selectedTypes.includes("piece")) {
      count += filteredPiece.length;
    }
    if (selectedTypes.includes("time")) {
      count += filteredTime.length;
    }

    return count;
  }, [pieceRecords, timeRecords, startDate, endDate, selectedUserId, selectedTypes]);

  if (!currentUser || currentUser.role !== "admin") return null;

  const workers = users.filter((u) => u.role === "worker");

  const toggleType = (type: DataType) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter((t) => t !== type));
      }
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    // 模拟导出过程
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsExporting(false);
    setExportSuccess(true);

    // 3秒后重置
    setTimeout(() => {
      setExportSuccess(false);
    }, 3000);
  };

  return (
    <MobileLayout role="admin">
      <div className="space-y-6 p-4">
        <h1 className="pt-2 text-2xl font-bold text-foreground">数据导出</h1>

        {/* 日期范围 */}
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center gap-2 text-base font-medium text-foreground">
              <Calendar className="h-5 w-5" />
              日期范围
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">开始日期</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-12 w-full rounded-lg border border-border bg-background px-3 text-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">结束日期</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="h-12 w-full rounded-lg border border-border bg-background px-3 text-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 员工筛选 */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-base font-medium text-foreground">选择员工</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedUserId("all")}
                className={cn(
                  "rounded-full px-4 py-2 text-base font-medium transition-colors",
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
                    "rounded-full px-4 py-2 text-base font-medium transition-colors",
                    selectedUserId === worker.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {worker.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 数据类型 */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-base font-medium text-foreground">导出内容</p>
            <div className="space-y-2">
              {[
                { value: "piece" as DataType, label: "计件明细" },
                { value: "time" as DataType, label: "计时明细" },
                { value: "summary" as DataType, label: "薪资汇总" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleType(option.value)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border-2 p-4 transition-colors",
                    selectedTypes.includes(option.value)
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <span className="text-lg text-foreground">{option.label}</span>
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-md",
                      selectedTypes.includes(option.value)
                        ? "bg-primary text-primary-foreground"
                        : "border-2 border-muted-foreground"
                    )}
                  >
                    {selectedTypes.includes(option.value) && (
                      <Check className="h-4 w-4" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 导出预览 */}
        <Card className="bg-muted/50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-6 w-6 text-[hsl(var(--success))]" />
              <span className="text-lg text-foreground">预计导出</span>
            </div>
            <span className="text-xl font-bold text-primary">
              {recordCount} 条记录
            </span>
          </CardContent>
        </Card>

        {/* 导出按钮 */}
        <Button
          onClick={handleExport}
          disabled={isExporting || recordCount === 0}
          className={cn(
            "h-16 w-full text-xl font-semibold transition-all",
            exportSuccess && "bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90"
          )}
        >
          {isExporting ? (
            "正在导出..."
          ) : exportSuccess ? (
            <>
              <Check className="mr-2 h-6 w-6" />
              导出成功
            </>
          ) : (
            <>
              <Download className="mr-2 h-6 w-6" />
              导出 Excel
            </>
          )}
        </Button>

        {/* 导出历史 */}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            导出历史
          </h2>
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {[
                { date: "2024-03-05 14:30", range: "2024-02", count: 156 },
                { date: "2024-02-28 10:15", range: "2024-01", count: 203 },
                { date: "2024-01-31 16:45", range: "2024-01", count: 189 },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4"
                >
                  <div>
                    <p className="text-base font-medium text-foreground">
                      {item.range} 数据
                    </p>
                    <p className="text-sm text-muted-foreground">{item.date}</p>
                  </div>
                  <span className="text-base text-muted-foreground">
                    {item.count}条
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
}
