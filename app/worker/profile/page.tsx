"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, Clock, LogOut, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MobileLayout } from "@/components/mobile-layout";
import { useAppStore } from "@/lib/store";

export default function ProfilePage() {
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);

  useEffect(() => {
    if (!currentUser) {
      router.push("/");
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  const handleLogout = () => {
    setCurrentUser(null);
    router.push("/");
  };

  return (
    <MobileLayout role="worker">
      <div className="space-y-6 p-4">
        {/* 标题 */}
        <h1 className="pt-2 text-2xl font-bold text-foreground">我的</h1>

        {/* 用户信息卡片 */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {currentUser.name}
                </h2>
                <p className="mt-1 flex items-center gap-2 text-base text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {currentUser.phone}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 信息列表 */}
        <Card>
          <CardContent className="divide-y divide-border p-0">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg text-foreground">我的时薪</span>
              </div>
              <span className="text-xl font-semibold text-primary">
                ¥{currentUser.hourlyRate}/半小时
              </span>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg text-foreground">账号状态</span>
              </div>
              <span className="rounded-full bg-[hsl(var(--success))]/10 px-3 py-1 text-base font-medium text-[hsl(var(--success))]">
                {currentUser.status === "active" ? "在职" : "离职"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 操作列表 */}
        <Card>
          <CardContent className="divide-y divide-border p-0">
            <button className="flex w-full items-center justify-between p-4 text-left active:bg-muted/50">
              <span className="text-lg text-foreground">修改密码</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
            <button className="flex w-full items-center justify-between p-4 text-left active:bg-muted/50">
              <span className="text-lg text-foreground">帮助与反馈</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
            <button className="flex w-full items-center justify-between p-4 text-left active:bg-muted/50">
              <span className="text-lg text-foreground">关于工计宝</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        {/* 退出登录 */}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="h-14 w-full text-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="mr-2 h-5 w-5" />
          退出登录
        </Button>
      </div>
    </MobileLayout>
  );
}
