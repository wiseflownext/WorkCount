"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Search, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

export default function EmployeesPage() {
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);
  const users = useAppStore((state) => state.users);
  const addUser = useAppStore((state) => state.addUser);
  const updateUser = useAppStore((state) => state.updateUser);

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    hourlyRate: "",
    status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      router.push("/");
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== "admin") return null;

  // 过滤员工（不包括管理员）
  const workers = users.filter((u) => u.role === "worker");
  const filteredWorkers = workers.filter(
    (u) =>
      u.name.includes(searchQuery) ||
      u.phone.includes(searchQuery)
  );

  const openAddForm = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      phone: "",
      password: "",
      hourlyRate: "15",
      status: "active",
    });
    setShowForm(true);
  };

  const openEditForm = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      phone: user.phone,
      password: "",
      hourlyRate: user.hourlyRate.toString(),
      status: user.status,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.phone || !formData.hourlyRate) return;

    if (editingUser) {
      // 编辑
      updateUser(editingUser.id, {
        name: formData.name,
        phone: formData.phone,
        hourlyRate: parseFloat(formData.hourlyRate),
        status: formData.status,
      });
    } else {
      // 新增
      if (!formData.password) return;
      addUser({
        id: `user-${Date.now()}`,
        phone: formData.phone,
        name: formData.name,
        role: "worker",
        hourlyRate: parseFloat(formData.hourlyRate),
        status: formData.status,
        createdAt: new Date(),
      });
    }

    setShowForm(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold">员工管理</h1>
        </div>
        <Button onClick={openAddForm} size="sm" className="h-10">
          <Plus className="mr-1 h-5 w-5" />
          添加
        </Button>
      </header>

      <div className="flex-1 p-4">
        {/* 搜索框 */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="搜索姓名或手机号"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-12 text-lg"
          />
        </div>

        {/* 员工列表 */}
        <div className="space-y-3">
          {filteredWorkers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-foreground">
                        {user.name}
                      </h3>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          user.status === "active"
                            ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {user.status === "active" ? "在职" : "离职"}
                      </span>
                    </div>
                    <p className="mt-1 text-base text-muted-foreground">
                      {user.phone}
                    </p>
                    <p className="mt-1 text-base text-primary font-medium">
                      时薪: ¥{user.hourlyRate}/半小时
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditForm(user)}
                    className="h-10 w-10 p-0"
                  >
                    <Edit2 className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredWorkers.length === 0 && (
            <div className="py-10 text-center text-lg text-muted-foreground">
              {searchQuery ? "未找到相关员工" : "暂无员工"}
            </div>
          )}
        </div>
      </div>

      {/* 添加/编辑表单弹窗 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md rounded-t-2xl bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-xl font-semibold">
                {editingUser ? "编辑员工" : "添加员工"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <label className="text-base font-medium">姓名</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="请输入姓名"
                  className="h-12 text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-base font-medium">手机号</label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="请输入手机号"
                  className="h-12 text-lg"
                  maxLength={11}
                />
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <label className="text-base font-medium">初始密码</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="请设置初始密码"
                    className="h-12 text-lg"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-base font-medium">时薪（元/半小时）</label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={formData.hourlyRate}
                  onChange={(e) =>
                    setFormData({ ...formData, hourlyRate: e.target.value })
                  }
                  placeholder="请输入时薪"
                  className="h-12 text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-base font-medium">状态</label>
                <div className="flex gap-4">
                  <button
                    onClick={() =>
                      setFormData({ ...formData, status: "active" })
                    }
                    className={cn(
                      "flex-1 rounded-lg border-2 py-3 text-lg font-medium transition-colors",
                      formData.status === "active"
                        ? "border-[hsl(var(--success))] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    在职
                  </button>
                  <button
                    onClick={() =>
                      setFormData({ ...formData, status: "inactive" })
                    }
                    className={cn(
                      "flex-1 rounded-lg border-2 py-3 text-lg font-medium transition-colors",
                      formData.status === "inactive"
                        ? "border-muted-foreground bg-muted text-foreground"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    离职
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="h-14 flex-1 text-lg"
                >
                  取消
                </Button>
                <Button onClick={handleSubmit} className="h-14 flex-1 text-lg">
                  保存
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
