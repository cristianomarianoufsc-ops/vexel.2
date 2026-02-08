import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Lore() {
  const { data: notes = [], isLoading, refetch } = trpc.lore.list.useQuery();
  const createMutation = trpc.lore.create.useMutation();
  const updateMutation = trpc.lore.update.useMutation();
  const deleteMutation = trpc.lore.delete.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleCreate = async () => {
    if (!title || !content) {
      toast.error("Preencha título e conteúdo");
      return;
    }
    try {
      await createMutation.mutateAsync({ title, content });
      resetForm();
      refetch();
      toast.success("Nota criada com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar nota");
    }
  };

  const handleUpdate = async () => {
    if (!title || !content || !editingId) return;
    try {
      await updateMutation.mutateAsync({ id: editingId, title, content });
      resetForm();
      refetch();
      toast.success("Nota atualizada com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar nota");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
      toast.success("Nota removida com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover nota");
    }
  };

  const handleEdit = (note: any) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setContent("");
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gradient retro-text mb-2">[LORE]</h1>
            <p className="text-muted-foreground">Notas e estratégias</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="btn-cyberpunk">
            <Plus className="w-4 h-4 mr-2" /> Nova Nota
          </Button>
        </div>

        {showForm && (
          <div className="cyberpunk-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-bold text-gradient retro-text">{editingId ? "[EDITAR NOTA]" : "[NOVA NOTA]"}</h2>
            <input type="text" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-input border-2 border-primary/30 text-foreground placeholder-muted-foreground p-3 rounded-sm focus:outline-none focus:border-primary" />
            <textarea placeholder="Conteúdo" value={content} onChange={(e) => setContent(e.target.value)} rows={6} className="w-full bg-input border-2 border-primary/30 text-foreground placeholder-muted-foreground p-3 rounded-sm focus:outline-none focus:border-primary" />
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
        ) : notes.length === 0 ? (
          <div className="cyberpunk-border bg-card p-6 text-center text-muted-foreground">
            <p>Nenhuma nota criada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note: any) => (
              <div key={note.id} className="cyberpunk-border bg-card p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-primary text-lg flex-1">{note.title}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(note)} className="text-accent hover:text-accent/80"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(note.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
