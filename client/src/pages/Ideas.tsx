import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Ideas() {
  const { data: ideas = [], isLoading, refetch } = trpc.ideas.list.useQuery();
  const createMutation = trpc.ideas.create.useMutation();
  const updateMutation = trpc.ideas.update.useMutation();
  const deleteMutation = trpc.ideas.delete.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("idea");
  const [priority, setPriority] = useState("medium");

  const handleCreate = async () => {
    if (!title) {
      toast.error("Preencha o título");
      return;
    }
    try {
      await createMutation.mutateAsync({ title, description, status: status as any, priority: priority as any });
      resetForm();
      refetch();
      toast.success("Ideia criada com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar ideia");
    }
  };

  const handleUpdate = async () => {
    if (!title || !editingId) return;
    try {
      await updateMutation.mutateAsync({ id: editingId, title, description, status: status as any, priority: priority as any });
      resetForm();
      refetch();
      toast.success("Ideia atualizada com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar ideia");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
      toast.success("Ideia removida com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover ideia");
    }
  };

  const handleEdit = (idea: any) => {
    setEditingId(idea.id);
    setTitle(idea.title);
    setDescription(idea.description || "");
    setStatus(idea.status);
    setPriority(idea.priority);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setDescription("");
    setStatus("idea");
    setPriority("medium");
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gradient retro-text mb-2">[IDEIAS]</h1>
            <p className="text-muted-foreground">Gerenciar ideias de conteúdo</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="btn-cyberpunk">
            <Plus className="w-4 h-4 mr-2" /> Nova Ideia
          </Button>
        </div>

        {showForm && (
          <div className="cyberpunk-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-bold text-gradient retro-text">{editingId ? "[EDITAR IDEIA]" : "[NOVA IDEIA]"}</h2>
            <input type="text" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-input border-2 border-primary/30 text-foreground placeholder-muted-foreground p-3 rounded-sm focus:outline-none focus:border-primary" />
            <textarea placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-input border-2 border-primary/30 text-foreground placeholder-muted-foreground p-3 rounded-sm focus:outline-none focus:border-primary" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-input border-2 border-primary/30 text-foreground p-3 rounded-sm focus:outline-none focus:border-primary">
              <option value="idea">Ideia</option>
              <option value="development">Em Desenvolvimento</option>
              <option value="review">Em Revisão</option>
              <option value="published">Publicado</option>
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full bg-input border-2 border-primary/30 text-foreground p-3 rounded-sm focus:outline-none focus:border-primary">
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
            <div className="flex gap-4">
              <Button onClick={editingId ? handleUpdate : handleCreate} className="btn-cyberpunk flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Atualizar" : "Criar"}
              </Button>
              <Button onClick={resetForm} className="btn-cyberpunk-outline flex-1">Cancelar</Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center text-muted-foreground">Carregando...</div>
        ) : ideas.length === 0 ? (
          <div className="cyberpunk-border bg-card p-6 text-center text-muted-foreground">
            <p>Nenhuma ideia criada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ideas.map((idea: any) => (
              <div key={idea.id} className="cyberpunk-border bg-card p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-primary text-lg flex-1">{idea.title}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(idea)} className="text-accent hover:text-accent/80"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(idea.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {idea.description && <p className="text-muted-foreground text-sm">{idea.description}</p>}
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-sm">{idea.status}</span>
                  <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded-sm">{idea.priority}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
