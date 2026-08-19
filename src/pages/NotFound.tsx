import { Button } from "@/components/ui/button";
import { Zap, ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-5">
        <Zap className="h-6 w-6 text-white" />
      </div>
      <h1 className="text-3xl font-bold mb-1 tracking-tight">404</h1>
      <p className="text-sm text-muted-foreground mb-6">
        This page does not exist.
      </p>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
        >
          <ArrowLeft className="h-3 w-3" />
          Go Back
        </Button>
        <Button
          onClick={() => navigate("/")}
          size="sm"
          className="gap-1.5 text-xs"
        >
          <Home className="h-3 w-3" />
          Home
        </Button>
      </div>
    </div>
  );
}
