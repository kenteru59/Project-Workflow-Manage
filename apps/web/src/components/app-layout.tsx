import { Link, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  GitBranch,
  Kanban,
  CheckCircle,
  Users,
  Menu,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMembers } from "@/hooks/use-members";
import { useState } from "react";

const navItems = [
  { path: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { path: "/templates", label: "テンプレート", icon: FileText },
  { path: "/workflows", label: "ワークフロー", icon: GitBranch },
  { path: "/kanban", label: "カンバンボード", icon: Kanban },
  { path: "/approvals", label: "承認キュー", icon: CheckCircle },
  { path: "/members", label: "メンバーマスタ", icon: Users },
];

export function AppLayout() {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar, currentUser, setCurrentUser } = useUIStore();
  const { data: members = [] } = useMembers();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="flex items-center gap-3 p-4 border-b border-sidebar-border h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {sidebarOpen && (
            <h1 className="font-bold text-lg text-sidebar-foreground truncate">
              ワークフロー管理
            </h1>
          )}
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        
        {/* User selection */}
        <div className="p-4 border-t border-sidebar-border">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className={cn(
                "flex items-center gap-3 w-full hover:bg-sidebar-accent/50 p-1 rounded-lg transition-colors text-left",
                !sidebarOpen && "justify-center"
              )}>
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium shrink-0">
                  {currentUser ? currentUser.name[0] : <User className="h-4 w-4" />}
                </div>
                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {currentUser ? currentUser.name : "ユーザー未選択"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {currentUser ? currentUser.role : "クリックして選択"}
                    </p>
                  </div>
                )}
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>ユーザー切り替え</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2 max-h-[60vh] overflow-auto py-2">
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    メンバーが登録されていません。
                  </p>
                ) : (
                  members.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setCurrentUser(m);
                        setDialogOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                        currentUser?.id === m.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {m.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.role}</p>
                      </div>
                      {currentUser?.id === m.id && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))
                )}
                <div className="border-t mt-2 pt-2">
                  <Link
                    to="/members"
                    onClick={() => setDialogOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-sm text-primary"
                  >
                    <Users className="h-5 w-5" />
                    <span>メンバーマスタを管理する</span>
                  </Link>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
