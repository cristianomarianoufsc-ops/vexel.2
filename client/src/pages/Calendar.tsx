import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function Page() {
  const [showForm, setShowForm] = useState(false);

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gradient retro-text mb-2">[PÁGINA]</h1>
          <p className="text-muted-foreground">Seção em desenvolvimento</p>
        </div>

        <div className="cyberpunk-border bg-card p-6">
          <p className="text-muted-foreground">Conteúdo em desenvolvimento</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
