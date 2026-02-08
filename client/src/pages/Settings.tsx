import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { data: apiKeys = [], isLoading, refetch } = trpc.apiKeys.list.useQuery();
  const createMutation = trpc.apiKeys.create.useMutation();
  const deleteMutation = trpc.apiKeys.delete.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const handleCreate = async () => {
    if (!name || !key) {
      toast.error("Preencha nome e chave");
      return;
    }
    try {
      await createMutation.mutateAsync({ name, key });
      setName("");
      setKey("");
      setShowForm(false);
      refetch();
      toast.success("Chave de API adicionada com sucesso!");
    } catch (error) {
      toast.error("Erro ao adicionar chave");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
      toast.success("Chave removida com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover chave");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gradient retro-text mb-2">[CONFIGURAÇÕES]</h1>
          <p className="text-muted-foreground">Gerenciar chaves de API</p>
        </div>

        <div className="cyberpunk-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gradient retro-text">[CHAVES DE API]</h2>
            <Button onClick={() => setShowForm(!showForm)} className="btn-cyberpunk">
              <Plus className="w-4 h-4 mr-2" /> Nova Chave
            </Button>
          </div>

          {showForm && (
            <div className="space-y-4 border-t border-primary/20 pt-4">
              <input type="text" placeholder="Nome da chave" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-input border-2 border-primary/30 text-foreground placeholder-muted-foreground p-3 rounded-sm focus:outline-none focus:border-primary" />
              <input type="password" placeholder="Chave de API" value={key} onChange={(e) => setKey(e.target.value)} className="w-full bg-input border-2 border-primary/30 text-foreground placeholder-muted-foreground p-3 rounded-sm focus:outline-none focus:border-primary" />
              <div className="flex gap-4">
                <Button onClick={handleCreate} className="btn-cyberpunk flex-1" disabled={createMutation.isPending}>
                  Salvar
                </Button>
                <Button onClick={() => setShowForm(false)} className="btn-cyberpunk-outline flex-1">Cancelar</Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center text-muted-foreground">Carregando...</div>
          ) : apiKeys.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma chave de API configurada</p>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey: any) => (
                <div key={apiKey.id} className="flex items-center justify-between p-4 bg-input/50 rounded-sm border border-primary/20">
                  <div>
                    <p className="font-bold text-primary">{apiKey.name}</p>
                    <p className="text-muted-foreground text-sm">••••••••{apiKey.key.slice(-4)}</p>
                  </div>
                  <button onClick={() => handleDelete(apiKey.id)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
