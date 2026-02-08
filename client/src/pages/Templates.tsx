import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Templates() {
  const { data: templates = [], isLoading, refetch } = trpc.templates.list.useQuery();
  const createMutation = trpc.templates.create.useMutation();
  const deleteMutation = trpc.templates.delete.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  const handleCreate = async () => {
    if (!name || !content) {
      toast.error("Preencha nome e conteúdo");
      return;
    }
    try {
      await createMutation.mutateAsync({ name, content });
      setName("");
      setContent("");
      setShowForm(false);
      refetch();
      toast.success("Template criado com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar template");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
      toast.success("Template removido com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover template");
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copiado para a área de transferência!");
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gradient retro-text mb-2">[TEMPLATES]</h1>
            <p className="text-muted-foreground">Estratégias e modelos</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="btn-cyberpunk">
            <Plus className="w-4 h-4 mr-2" /> Novo Template
          </Button>
        </div>

        {showForm && (
          <div className="cyberpunk-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-bold text-gradient retro-text">[NOVO TEMPLATE]</h2>
            <input type="text" placeholder="Nome do template" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-input border-2 border-primary/30 text-foreground placeholder-muted-foreground p-3 rounded-sm focus:outline-none focus:border-primary" />
            <textarea placeholder="Conteúdo do template" value={content} onChange={(e) => setContent(e.target.value)} rows={6} className="w-full bg-input border-2 border-primary/30 text-foreground placeholder-muted-foreground p-3 rounded-sm focus:outline-none focus:border-primary" />
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
        ) : templates.length === 0 ? (
          <div className="cyberpunk-border bg-card p-6 text-center text-muted-foreground">
            <p>Nenhum template criado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template: any) => (
              <div key={template.id} className="cyberpunk-border bg-card p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-primary text-lg flex-1">{template.name}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => handleCopy(template.content)} className="text-accent hover:text-accent/80"><Copy className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(template.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap text-sm bg-input/50 p-4 rounded-sm">{template.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
