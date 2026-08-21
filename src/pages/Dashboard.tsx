import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Search,
  Zap,
  Brain,
  Shield,
  ArrowRight,
  Key,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useNavigate, Link } from "react-router";
import { CATALOG_ITEMS } from "@/data/catalog";
import { MODE_CONFIG } from "@/types/quantum";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const recentCatalogItems = CATALOG_ITEMS.slice(0, 4);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/30 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold tracking-tight">
                Quantum AI
              </span>
            </Link>
            <span className="text-[10px] text-muted-foreground/50 border-l border-border/30 pl-3 ml-1">
              Dashboard
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/app")}
              className="gap-1.5 text-xs text-muted-foreground"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Chat
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/app")}
              className="gap-1.5 text-xs text-muted-foreground"
            >
              <Search className="h-3.5 w-3.5" />
              Catalog
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-8 w-8 text-muted-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold tracking-tight">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}
            {user?.name ? `, ${user.name}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here&apos;s an overview of your Quantum AI workspace.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
        >
          {[
            {
              label: "Conversations",
              value: "—",
              icon: MessageSquare,
              color: "text-cyan-400",
            },
            {
              label: "Messages Sent",
              value: "—",
              icon: Zap,
              color: "text-blue-400",
            },
            {
              label: "API Keys Active",
              value: "—",
              icon: Key,
              color: "text-purple-400",
            },
            {
              label: "Uptime",
              value: "—",
              icon: Clock,
              color: "text-emerald-400",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border/30 bg-card/40 p-4"
            >
              <stat.icon className={`h-4 w-4 ${stat.color} mb-2`} />
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-1"
          >
            <Card className="border-border/30 bg-card/40 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-cyan-400" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  {
                    icon: MessageSquare,
                    label: "Start a Conversation",
                    desc: "Chat with General or Hacking mode",
                    action: () => navigate("/app"),
                    color: "text-cyan-400",
                  },
                  {
                    icon: Search,
                    label: "Browse Catalog",
                    desc: "Tools, templates, and integrations",
                    action: () => navigate("/app"),
                    color: "text-blue-400",
                  },
                  {
                    icon: Key,
                    label: "Configure API Keys",
                    desc: "Add or rotate your Gemini/Groq keys",
                    action: () => navigate("/app"),
                    color: "text-purple-400",
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center gap-3 rounded-lg border border-border/20 bg-muted/20 p-3 text-left hover:bg-muted/40 transition-colors group"
                  >
                    <item.icon
                      className={`h-4 w-4 ${item.color} shrink-0`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Active Modes */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="md:col-span-1"
          >
            <Card className="border-border/30 bg-card/40 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4 text-cyan-400" />
                  Active Modes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(["general", "hacking"] as const).map((mode) => {
                  const config = MODE_CONFIG[mode];
                  return (
                    <div
                      key={mode}
                      className={`rounded-lg border ${config.borderClass} ${config.bgClass} p-3`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {mode === "general" ? (
                          <Brain className="h-3.5 w-3.5 text-cyan-400" />
                        ) : (
                          <Shield className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                        <span
                          className={`text-xs font-medium ${config.textClass}`}
                        >
                          {config.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {config.description}
                      </p>
                    </div>
                  );
                })}
                <p className="text-[10px] text-muted-foreground/60 text-center pt-1">
                  Configure keys in Settings
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent from Catalog */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-1"
          >
            <Card className="border-border/30 bg-card/40 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Search className="h-4 w-4 text-blue-400" />
                  Catalog Highlights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentCatalogItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate("/app")}
                    className="w-full flex items-center gap-2.5 rounded-lg border border-border/20 bg-muted/10 p-2.5 text-left hover:bg-muted/30 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {item.provider} · {item.category}
                      </p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}
                <button
                  onClick={() => navigate("/app")}
                  className="w-full text-center text-[10px] text-cyan-400/70 hover:text-cyan-400 transition-colors pt-1"
                >
                  View full catalog →
                </button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Footer credit */}
      <footer className="border-t border-border/20 py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-center text-[11px] text-muted-foreground/50">
          <span>Made by <span className="text-cyan-400/50 font-medium">RAGIB</span></span>
        </div>
      </footer>
    </main>
  );
}
