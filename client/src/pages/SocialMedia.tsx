import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SocialMedia() {
  const { data: links = [], isLoading, refetch } = trpc.socialMedia.list.useQuery();
  const createMutation = trpc.socialMedia.create.useMutation();
  const updateMutation = trpc.socialMedia.update.useMutation();
  const deleteMutation = trpc.socialMedia.delete.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [platform, setPlatform] = useState("");
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");

  const handleCreate = async () => {
    if (!platform || !url) {
      toast.error("Preencha plataforma e URL");
      return;
    }
    try {
      await createMutation.mutateAsync({ platform, url, username });
      setPlatform("");
      setUrl("");
      setUsername("");
      setShowForm(false);
      refetch();
      toast.success("Link adicionado com sucesso!");
    } catch (error) {
      toast.error("Erro ao adicionar link");
    }
  };

  const handleUpdate = async () => {
    if (!platform || !url || !editingId) return;
    try {
      await updateMutation.mutateAsync({ id: editingId, platform, url, username });
      setPlatform("");
      setUrl("");
      setUsername("");
      setEditingId(null);
      setShowForm(false);
      refetch();
      toast.success("Link atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar link");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
      toast.success("Link removido com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover link");
    }
  };

  const handleEdit = (link: any) => {
    setEditingId(link.id);
    setPlatform(link.platform);
    setUrl(link.url);
    setUsername(link.username || "");
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setPlatform("");
    setUrl("");
    setUsername("");
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gradient retro-text mb-2">[REDES SOCIAIS]</h1>
            <p className="text-muted-foreground">Gerenciar links de plataformas</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="btn-cyberpunk">
            <Plus className="w-4 h-4 mr-2" /> Adicionar Link
          </Button>
        </div>

        {showForm && (
          <div className="cyberpunk-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-bold text-gradient retro-text">
              {editingId ? "[EDITAR LINK]" : "[NOVO LINK]"}
            </h2>
            <input
              type="text"
              placeholder="Plataforma (ex: Instagram)"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-input border-2 border-primary/30 text-foreground placeholder-muted-foreground p-3 rounded-sm focus:outline-none focus:border-primary"
            />
            <input
              type="url"
              placeholder="URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-input border-2 border-primary/30 text-foreground placeholder-muted-foreground p-3 rounded-sm focus:outline-none focus:border-primary"
            />
            <input
              type="text"
              placeholder="Usuário (opcional)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-input border-2 border-primary/30 text-foreground placeholder-muted-foreground p-3 rounded-sm focus:outline-none focus:border-primary"
            />
            <div className="flex gap-4">
              <Button 
                onClick={editingId ? handleUpdate : handleCreate} 
                className="btn-cyberpunk flex-1"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingId ? "Atualizar" : "Salvar"}
              </Button>
              <Button onClick={handleCancel} className="btn-cyberpunk-outline flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center text-muted-foreground">Carregando...</div>
        ) : links.length === 0 ? (
          <div className="cyberpunk-border bg-card p-6 text-center text-muted-foreground">
            <p>Nenhum link adicionado ainda</p>
            <p className="text-sm mt-2">Clique em "Adicionar Link" para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {links.map((link: any) => (
              <div key={link.id} className="cyberpunk-border bg-card p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-primary">{link.platform}</h3>
                    {link.username && <p className="text-sm text-muted-foreground">@{link.username}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(link)}
                      className="text-accent hover:text-accent/80 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="text-destructive hover:text-destructive/80 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <a 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-accent text-sm break-all hover:underline flex items-center gap-2"
                >
                  {link.url}
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
