import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold text-gradient retro-text">[404]</h1>
        <p className="text-2xl text-muted-foreground">Página não encontrada</p>
        <p className="text-lg text-foreground">A página que você procura não existe</p>
        
        <Button 
          onClick={() => setLocation("/dashboard")}
          className="btn-cyberpunk text-lg px-8 py-6"
        >
          Voltar ao Dashboard
        </Button>
      </div>
    </div>
  );
}
