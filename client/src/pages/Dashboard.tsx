import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Share2, Calendar, CheckSquare, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gradient retro-text mb-2">[DASHBOARD]</h1>
          <p className="text-muted-foreground">Bem-vindo de volta, {user?.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="cyberpunk-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-muted-foreground retro-text">Redes Sociais</h3>
              <Share2 className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold text-primary">
              {isLoading ? "-" : stats?.socialMediaCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Links de plataformas</p>
          </div>

          <div className="cyberpunk-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-muted-foreground retro-text">Eventos Planejados</h3>
              <Calendar className="w-5 h-5 text-accent" />
            </div>
            <div className="text-3xl font-bold text-accent">
              {isLoading ? "-" : stats?.eventsCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Agendamentos</p>
          </div>

          <div className="cyberpunk-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-muted-foreground retro-text">Tarefas Completadas</h3>
              <CheckSquare className="w-5 h-5 text-secondary" />
            </div>
            <div className="text-3xl font-bold text-secondary">
              {isLoading ? "-" : `${stats?.tasksCompleted || 0}/${stats?.tasksTotal || 0}`}
            </div>
            <p className="text-xs text-muted-foreground">Progresso</p>
          </div>

          <div className="cyberpunk-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-muted-foreground retro-text">Ideias de Conteúdo</h3>
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold text-primary">
              {isLoading ? "-" : stats?.ideasCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Conceitos</p>
          </div>
        </div>

        <div className="cyberpunk-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-gradient retro-text">[AÇÕES RÁPIDAS]</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button onClick={() => setLocation("/calendar")} className="btn-cyberpunk w-full">
              Agendar Conteúdo
            </Button>
            <Button onClick={() => setLocation("/tasks")} className="btn-cyberpunk w-full">
              Ver Tarefas
            </Button>
            <Button onClick={() => setLocation("/ideas")} className="btn-cyberpunk w-full">
              Adicionar Ideia
            </Button>
            <Button onClick={() => setLocation("/assets")} className="btn-cyberpunk w-full">
              Gerenciar Assets
            </Button>
          </div>
        </div>

        <div className="cyberpunk-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-gradient retro-text">[ATIVIDADES RECENTES]</h2>
          <div className="text-muted-foreground text-sm">
            <p>Últimas ações do sistema</p>
            <p className="mt-2 text-xs">Nenhuma atividade registrada ainda</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
