"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { mockUsers } from "@/lib/mock-data";

export default function LoginPage() {
  const router = useRouter();
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setIsLoading(true);

    // 模拟登录验证
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = mockUsers.find((u) => u.phone === phone && u.status === "active");

    if (!user) {
      setError("手机号或密码错误");
      setIsLoading(false);
      return;
    }

    // 模拟密码验证（演示用，任意密码都可以）
    if (password.length < 1) {
      setError("请输入密码");
      setIsLoading(false);
      return;
    }

    setCurrentUser(user);
    
    // 根据角色跳转不同页面
    if (user.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/worker");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        {/* Logo 和标题 */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary">
            <Calculator className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">工计宝</h1>
          <p className="mt-2 text-lg text-muted-foreground">计时计件 轻松管理</p>
        </div>

        {/* 登录表单 */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <h2 className="text-center text-xl font-semibold">登录</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 手机号输入 */}
            <div className="space-y-2">
              <label className="text-base font-medium text-foreground">
                手机号
              </label>
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-14 text-lg"
                maxLength={11}
              />
            </div>

            {/* 密码输入 */}
            <div className="space-y-2">
              <label className="text-base font-medium text-foreground">
                密码
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 pr-14 text-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-6 w-6" />
                  ) : (
                    <Eye className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <p className="text-center text-base text-destructive">{error}</p>
            )}

            {/* 登录按钮 */}
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="h-14 w-full text-xl font-semibold"
            >
              {isLoading ? "登录中..." : "登录"}
            </Button>

            {/* 演示账号提示 */}
            <div className="rounded-lg bg-muted p-4">
              <p className="mb-2 text-center text-sm font-medium text-muted-foreground">
                演示账号
              </p>
              <div className="space-y-1 text-center text-sm text-muted-foreground">
                <p>员工：13800138001</p>
                <p>管理员：13800138003</p>
                <p className="text-xs">（任意密码即可登录）</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
