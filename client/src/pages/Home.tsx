import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && !loading) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-2xl">
        <h1 className="text-6xl font-bold text-gradient retro-text">[VEXEL HUB]</h1>
        <p className="text-2xl text-muted-foreground">Central de Gerenciamento de Conteúdo</p>
        <p className="text-lg text-foreground">Gerencie suas redes sociais, calendário, ideias e assets em um único lugar</p>
        
        <div className="cyberpunk-border bg-card p-8 space-y-6">
          <h2 className="text-xl font-bold text-gradient">Funcionalidades</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-sm">
            <div>Redes Sociais</div>
            <div>Calendário e Agendamento</div>
            <div>Ideias de Conteúdo</div>
            <div>Gerenciamento de Assets</div>
            <div>Rastreamento de Tarefas</div>
            <div>Chaves de API</div>
          </div>
        </div>

        <a href={getLoginUrl()}>
          <Button className="btn-cyberpunk text-lg px-8 py-6">
            Começar Agora
          </Button>
        </a>
      </div>
    </div>
  );
}
