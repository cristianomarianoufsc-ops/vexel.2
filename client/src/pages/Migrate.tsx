import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Migrate() {
  const migrateMutation = trpc.system.runMigration.useMutation();

  const handleMigrate = async () => {
    try {
      const result = await migrateMutation.mutateAsync();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error("Erro ao executar migração: " + error.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <h1 className="text-4xl font-bold text-gradient retro-text mb-2">[MIGRAÇÃO]</h1>
        <p className="text-muted-foreground">Executar migração manual para adicionar link do YouTube</p>
        <Button onClick={handleMigrate} className="btn-cyberpunk" disabled={migrateMutation.isPending}>
          {migrateMutation.isPending ? "Executando..." : "Executar Migração"}
        </Button>
      </div>
    </DashboardLayout>
  );
}
