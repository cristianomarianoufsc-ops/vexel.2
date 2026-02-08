import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Calendar() {
  const { data: events = [], isLoading, refetch } = trpc.calendar.list.useQuery();
  const createMutation = trpc.calendar.create.useMutation();
  const updateMutation = trpc.calendar.update.useMutation();
  const deleteMutation = trpc.calendar.delete.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [status, setStatus] = useState("planned");

  const handleCreate = async () => {
    if (!title || !startDate) {
      toast.error("Preencha título e data");
      return;
    }
    try {
      await createMutation.mutateAsync({ title, description, startDate: new Date(startDate), status: status as any });
      resetForm();
      refetch();
      toast.success("Evento criado com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar evento");
    }
  };

  const handleUpdate = async () => {
    if (!title || !startDate || !editingId) return;
    try {
      await updateMutation.mutateAsync({ id: editingId, title, description, startDate: new Date(startDate), status: status as any });
      resetForm();
      refetch();
      toast.success("Evento atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar evento");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
      toast.success("Evento removido com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover evento");
    }
  };

  const handleEdit = (event: any) => {
    setEditingId(event.id);
    setTitle(event.title);
    setDescription(event.description || "");
    setStartDate(event.startDate.split('T')[0]);
    setStatus(event.status);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setDescription("");
    setStartDate("");
    setStatus("planned");
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gradient retro-text mb-2">[CALENDÁRIO]</h1>
            <p className="text-muted-foreground">Planejamento de eventos e agendamentos</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="btn-cyberpunk">
            <Plus className="w-4 h-4 mr-2" /> Novo Evento
          </Button>
        </div>

        {showForm && (
          <div className="cyberpunk-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-bold text-gradient retro-text">
              {editingId ? "[EDITAR EVENTO]" : "[NOVO EVENTO]"}
            </h2>
            <input type="text" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-input border-2 border-primary/30 text-foreground placeholder-muted-foreground p-3 rounded-sm focus:outline-none focus:border-primary" />
            <textarea placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-input border-2 border-primary/30 text-foreground placeholder-muted-foreground p-3 rounded-sm focus:outline-none focus:border-primary" />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-input border-2 border-primary/30 text-foreground p-3 rounded-sm focus:outline-none focus:border-primary" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-input border-2 border-primary/30 text-foreground p-3 rounded-sm focus:outline-none focus:border-primary">
              <option value="planned">Planejado</option>
              <option value="scheduled">Agendado</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
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
        ) : events.length === 0 ? (
          <div className="cyberpunk-border bg-card p-6 text-center text-muted-foreground">
            <p>Nenhum evento agendado</p>
            <p className="text-sm mt-2">Clique em "Novo Evento" para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event: any) => (
              <div key={event.id} className="cyberpunk-border bg-card p-6 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-primary text-lg">{event.title}</h3>
                  {event.description && <p className="text-muted-foreground text-sm mt-1">{event.description}</p>}
                  <p className="text-accent text-sm mt-2">{new Date(event.startDate).toLocaleDateString('pt-BR')}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-primary/20 text-primary text-xs rounded-sm">{event.status}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(event)} className="text-accent hover:text-accent/80"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(event.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
