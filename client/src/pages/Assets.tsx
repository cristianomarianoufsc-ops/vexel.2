import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Assets() {
  const { data: assets = [], isLoading, refetch } = trpc.assets.list.useQuery();
  const createMutation = trpc.assets.create.useMutation();
  const deleteMutation = trpc.assets.delete.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [filename, setFilename] = useState("");
  const [fileType, setFileType] = useState("image");
  const [fileUrl, setFileUrl] = useState("");

  const handleCreate = async () => {
    if (!filename || !fileUrl) {
      toast.error("Preencha nome e URL");
      return;
    }
    try {
      await createMutation.mutateAsync({ filename, fileType, fileUrl });
      setFilename("");
      setFileType("image");
      setFileUrl("");
      setShowForm(false);
      refetch();
      toast.success("Asset adicionado com sucesso!");
    } catch (error) {
      toast.error("Erro ao adicionar asset");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
      toast.success("Asset removido com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover asset");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gradient retro-text mb-2">[ASSETS]</h1>
            <p className="text-muted-foreground">Gerenciar arquivos de mídia</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="btn-cyberpunk">
            <Plus className="w-4 h-4 mr-2" /> Novo Asset
          </Button>
        </div>

        {showForm && (
          <div className="cyberpunk-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-bold text-gradient retro-text">[NOVO ASSET]</h2>
            <input type="text" placeholder="Nome do arquivo" value={filename} onChange={(e) => setFilename(e.target.value)} className="w-full bg-input border-2 border-primary/30 text-foreground placeholder-muted-foreground p-3 rounded-sm focus:outline-none focus:border-primary" />
            <input type="url" placeholder="URL do arquivo" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} className="w-full bg-input border-2 border-primary/30 text-foreground placeholder-muted-foreground p-3 rounded-sm focus:outline-none focus:border-primary" />
            <select value={fileType} onChange={(e) => setFileType(e.target.value)} className="w-full bg-input border-2 border-primary/30 text-foreground p-3 rounded-sm focus:outline-none focus:border-primary">
              <option value="image">Imagem</option>
              <option value="video">Vídeo</option>
              <option value="audio">Áudio</option>
              <option value="document">Documento</option>
            </select>
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
        ) : assets.length === 0 ? (
          <div className="cyberpunk-border bg-card p-6 text-center text-muted-foreground">
            <p>Nenhum asset adicionado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset: any) => (
              <div key={asset.id} className="cyberpunk-border bg-card p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-primary">{asset.filename}</h3>
                    <span className="inline-block mt-2 px-2 py-1 bg-primary/20 text-primary text-xs rounded-sm">{asset.fileType}</span>
                  </div>
                  <button onClick={() => handleDelete(asset.id)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <a href={asset.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-accent hover:underline text-sm">
                  <Download className="w-4 h-4" /> Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
