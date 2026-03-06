"use client";

import { ReactNode } from "react";
import { Home, FileText, Receipt, User, BarChart3, Download, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: ReactNode;
  role?: "worker" | "admin";
}

const workerTabs = [
  { href: "/worker", icon: Home, label: "首页" },
  { href: "/worker/daily", icon: FileText, label: "日报" },
  { href: "/worker/payslip", icon: Receipt, label: "工资条" },
  { href: "/worker/profile", icon: User, label: "我的" },
];

const adminTabs = [
  { href: "/admin", icon: Home, label: "首页" },
  { href: "/admin/reports", icon: BarChart3, label: "报表" },
  { href: "/admin/export", icon: Download, label: "导出" },
  { href: "/admin/settings", icon: Settings, label: "设置" },
];

export function MobileLayout({ children, role = "worker" }: MobileLayoutProps) {
  const pathname = usePathname();
  const tabs = role === "admin" ? adminTabs : workerTabs;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 主内容区域 */}
      <main className="flex-1 overflow-auto pb-20">{children}</main>

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card">
        <div className="mx-auto flex max-w-md items-center justify-around">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 text-base transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-6 w-6" />
                <span className="text-sm font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
