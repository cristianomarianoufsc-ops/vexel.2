import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Tasks() {
  const { data: tasks = [], isLoading, refetch } = trpc.tasks.list.useQuery();
  const createMutation = trpc.tasks.create.useMutation();
  const updateMutation = trpc.tasks.update.useMutation();
  const deleteMutation = trpc.tasks.delete.useMutation();
  const toggleMutation = trpc.tasks.toggle.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pending");
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
      toast.success("Tarefa criada com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar tarefa");
    }
  };

  const handleToggle = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "pending" ? "completed" : "pending";
      await toggleMutation.mutateAsync({ id, status: newStatus });
      refetch();
      toast.success("Tarefa atualizada!");
    } catch (error) {
      toast.error("Erro ao atualizar tarefa");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
      toast.success("Tarefa removida com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover tarefa");
    }
  };

  const handleEdit = (task: any) => {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status);
    setPriority(task.priority);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setDescription("");
    setStatus("pending");
    setPriority("medium");
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gradient retro-text mb-2">[TAREFAS]</h1>
            <p className="text-muted-foreground">Rastreamento de progresso</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="btn-cyberpunk">
            <Plus className="w-4 h-4 mr-2" /> Nova Tarefa
          </Button>
        </div>

        {showForm && (
          <div className="cyberpunk-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-bold text-gradient retro-text">{editingId ? "[EDITAR TAREFA]" : "[NOVA TAREFA]"}</h2>
            <input type="text" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-input border-2 border-primary/30 text-foreground placeholder-muted-foreground p-3 rounded-sm focus:outline-none focus:border-primary" />
            <textarea placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-input border-2 border-primary/30 text-foreground placeholder-muted-foreground p-3 rounded-sm focus:outline-none focus:border-primary" />
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full bg-input border-2 border-primary/30 text-foreground p-3 rounded-sm focus:outline-none focus:border-primary">
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
            <div className="flex gap-4">
              <Button onClick={handleCreate} className="btn-cyberpunk flex-1" disabled={createMutation.isPending}>
                Criar
              </Button>
              <Button onClick={resetForm} className="btn-cyberpunk-outline flex-1">Cancelar</Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center text-muted-foreground">Carregando...</div>
        ) : tasks.length === 0 ? (
          <div className="cyberpunk-border bg-card p-6 text-center text-muted-foreground">
            <p>Nenhuma tarefa criada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task: any) => (
              <div key={task.id} className="cyberpunk-border bg-card p-6 flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <button onClick={() => handleToggle(task.id, task.status)} className={`mt-1 ${task.status === 'completed' ? 'text-secondary' : 'text-muted-foreground'}`}>
                    <Check className="w-5 h-5" />
                  </button>
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-primary'}`}>{task.title}</h3>
                    {task.description && <p className="text-muted-foreground text-sm mt-1">{task.description}</p>}
                    <span className="inline-block mt-2 px-2 py-1 bg-accent/20 text-accent text-xs rounded-sm">{task.priority}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(task)} className="text-accent hover:text-accent/80"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(task.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
