import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [messager, setMessager] = useState("");
  const [mot_pass, setMotPass] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(messager, mot_pass);
      setLocation("/");
    } catch (err) {
      toast({
        title: "Erreur de connexion",
        description: err instanceof Error ? err.message : "Identifiant ou mot de passe incorrect",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#13151a] relative overflow-hidden font-sans">
      {/* Decorative blurred blobs for 'nexus morph/glassmorphism' aesthetic */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/30 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Left Logo */}
      <div className="absolute top-8 left-8 flex items-center gap-2 z-10 hover:scale-105 transition-transform duration-300">
        <div className="w-24 h-24 rounded-2xl bg-[#1a1d24] p-4 shadow-[6px_6px_15px_#0b0d10,-6px_-6px_15px_#252b36] border border-white/5 flex items-center justify-center">
          <img src="/dcim.png" alt="DCIM Logo" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Top Right Logo */}
      <div className="absolute top-8 right-8 flex items-center gap-2 z-10 hover:scale-105 transition-transform duration-300">
        <div className="w-24 h-24 rounded-2xl bg-[#1a1d24] p-4 shadow-[6px_6px_15px_#0b0d10,-6px_-6px_15px_#252b36] border border-white/5 flex items-center justify-center">
          <img src="/dcim.png" alt="DCIM Logo" className="w-full h-full object-contain" />
        </div>
      </div>

      <div className="w-full max-w-md px-6 z-10 mt-12">
        <div className="flex flex-col items-center mb-10">
          {/* Main Logo Fix: Neumorphic/Glassmorphic Frame */}
          <div className="relative group mb-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center justify-center w-40 h-40 rounded-3xl bg-[#1a1d24] shadow-[12px_12px_24px_#0b0d10,-12px_-12px_24px_#252b36] border border-white/10">
              <img src="/dcim.png" alt="Main App Logo" className="w-28 h-28 object-contain" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 tracking-tight">
            Système d'Archivage
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-medium">Gestion intelligente des projets</p>
        </div>

        {/* Login Card with Neumorphism + Glassmorphism hybrid */}
        <div className="rounded-3xl p-8 bg-[#1a1d24]/80 backdrop-blur-xl border border-white/10 shadow-[8px_8px_24px_#0b0d10,-8px_-8px_24px_#252b36]">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-bold text-white tracking-wide">Bienvenue</h2>
            <p className="text-slate-400 text-sm mt-1">Connectez-vous à votre espace</p>
          </div>
          
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="messager" className="text-slate-300 font-semibold text-xs uppercase tracking-wider ml-1">Identifiant</Label>
              <div className="relative">
                <Input
                  id="messager"
                  data-testid="input-messager"
                  type="text"
                  placeholder="votre.identifiant"
                  value={messager}
                  onChange={(e) => setMessager(e.target.value)}
                  className="h-12 w-full rounded-xl bg-[#13151a] border-transparent text-white placeholder:text-slate-600 px-4 shadow-[inset_4px_4px_8px_#0b0d10,inset_-4px_-4px_8px_#252b36] focus:ring-2 focus:ring-blue-500/50 transition-all"
                  autoComplete="username"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-3">
               <Label htmlFor="mot_pass" className="text-slate-300 font-semibold text-xs uppercase tracking-wider ml-1">Mot de passe</Label>
               <div className="relative">
                  <Input
                    id="mot_pass"
                    data-testid="input-password"
                    type="password"
                    placeholder="••••••••"
                    value={mot_pass}
                    onChange={(e) => setMotPass(e.target.value)}
                    className="h-12 w-full rounded-xl bg-[#13151a] border-transparent text-white placeholder:text-slate-600 px-4 shadow-[inset_4px_4px_8px_#0b0d10,inset_-4px_-4px_8px_#252b36] focus:ring-2 focus:ring-blue-500/50 transition-all text-lg"
                    autoComplete="current-password"
                    required
                  />
               </div>
            </div>

            <Button
              data-testid="button-submit"
              type="submit"
              className="mt-6 w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold tracking-wide shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
