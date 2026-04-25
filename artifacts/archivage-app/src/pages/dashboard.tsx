import { useState } from "react";
import { apiUrl } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderKanban, Files, Layers, TrendingUp, Sparkles, PieChart as PieChartIcon, BarChart as BarChartIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";

interface DashboardData {
  total_projets: number;
  total_documents: number;
  total_lots: number;
  projets_en_cours: number;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#f97316', '#10b981', '#ef4444', '#f59e0b', '#64748b'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["projets"]);

  const { data, isLoading: loadingStats } = useQuery<DashboardData>({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetch(apiUrl("/dashboard"), { credentials: "include" }).then(r => r.json()),
    refetchInterval: 5000,
  });

  const { data: rawHistData, isLoading: loadingHist } = useQuery<any>({
    queryKey: ["dashboard-hist"],
    queryFn: () => fetch(apiUrl("/dashboard/histogrammes"), { credentials: "include" }).then(r => r.json()),
    refetchInterval: 5000,
  });

  const { data: analysisData, isLoading: loadingAnalyse } = useQuery<any>({
    queryKey: ["dashboard-analysis"],
    queryFn: () => fetch(apiUrl("/dashboard/analyse"), { credentials: "include" }).then(r => r.json()),
    refetchInterval: 5000,
  });

  const loading = loadingStats || loadingHist || loadingAnalyse;

  const getProcessedHistData = () => {
    const full = {
      projets: [] as any[],
      documents: [] as any[],
      lots: [] as any[]
    };
    if (!rawHistData) return full;

    ["projets", "documents", "lots"].forEach(key => {
      const raw = rawHistData[key] || [];
      full[key as any] = raw.map((d: any) => {
        const parts = d.jour.split("-");
        const label = `${parts[2]}/${parts[1]}`;
        return { ...d, label };
      });
    });
    return full;
  };

  const histData = getProcessedHistData();

  const toggleMetric = (key: string) => {
    setSelectedMetrics(prev => 
      prev.includes(key) 
        ? (prev.length > 1 ? prev.filter(k => k !== key) : prev) 
        : [...prev, key]
    );
  };

  const selectAll = () => {
    if (selectedMetrics.length === 3) {
      setSelectedMetrics(["projets"]);
    } else {
      setSelectedMetrics(["projets", "lots", "documents"]);
    }
  };

  const stats = [
    { key: "projets", label: "Total Projets", value: data?.total_projets ?? 0, icon: FolderKanban, color: "text-blue-600", stroke: "#3b82f6", bg: "bg-blue-50", active: "ring-2 ring-blue-500 shadow-lg scale-105" },
    { key: "lots", label: "Total Lots", value: data?.total_lots ?? 0, icon: Layers, color: "text-purple-600", stroke: "#8b5cf6", bg: "bg-purple-50", active: "ring-2 ring-purple-500 shadow-lg scale-105" },
    { key: "documents", label: "Documents", value: data?.total_documents ?? 0, icon: Files, color: "text-orange-600", stroke: "#f97316", bg: "bg-orange-50", active: "ring-2 ring-orange-500 shadow-lg scale-105" },
  ];

  const combinedChartData = histData.projets.map((p, i) => ({
    label: p.label,
    projets: p.total,
    lots: histData.lots[i]?.total || 0,
    documents: histData.documents[i]?.total || 0
  }));

  return (
    <div className="space-y-8 pb-10">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#020617] p-8 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-300 text-xs font-medium backdrop-blur-md">
              <Sparkles className="h-3 w-3" />
              Analyse Graphique Performance
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Tableau de bord <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Analytique</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl">
              Bienvenue, <span className="text-white font-medium">{user?.prenom}</span>. 
              Visualisation complète de l'existence et de l'état d'avancement des projets.
            </p>
          </div>
          <div className="hidden lg:block w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-xl border border-white/10 p-6">
            <BarChartIcon className="w-full h-full text-blue-400" />
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500 rounded-full blur-[120px] opacity-20" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-500 rounded-full blur-[120px] opacity-20" />
      </div>

      <div className="flex items-center justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const isSelected = selectedMetrics.includes(stat.key);
            return (
              <Card 
                key={stat.label} 
                className={`border-none cursor-pointer transition-all duration-300 overflow-hidden group ${isSelected ? stat.active : "hover:shadow-md opacity-60"}`}
                onClick={() => toggleMetric(stat.key)}
              >
                <CardContent className="p-0">
                  <div className="flex items-center p-6 gap-4">
                    <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold tracking-tight">
                        {loading ? "—" : stat.value}
                      </p>
                    </div>
                  </div>
                  <div className={`h-1 w-full transition-all duration-500 ${isSelected ? stat.color.replace('text-', 'bg-') : "bg-transparent"}`} />
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="ml-6">
           <Button 
            variant="outline" 
            onClick={selectAll} 
            className={`rounded-xl border-slate-200 transition-all ${selectedMetrics.length === 3 ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-slate-50'}`}
           >
             {selectedMetrics.length === 3 ? "Désélectionner tout" : "Tout sélectionner"}
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-8 border-b bg-slate-50/50">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold capitalize flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Courbe de Croissance des Entités
              </CardTitle>
              <p className="text-sm text-muted-foreground">Evolution cumulative de l'existence totale dans le système</p>
            </div>
            <div className="flex gap-2">
              {selectedMetrics.map(m => (
                <Badge key={m} variant="outline" className={`capitalize ${stats.find(s => s.key === m)?.color} border-current`}>
                  {m}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-8 px-2 md:px-6">
            <div className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProjets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLots" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDocuments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  {selectedMetrics.includes("projets") && (
                    <Area 
                      type="monotone" 
                      dataKey="projets" 
                      stroke="#3b82f6" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorProjets)" 
                      name="Projets"
                    />
                  )}
                  {selectedMetrics.includes("lots") && (
                    <Area 
                      type="monotone" 
                      dataKey="lots" 
                      stroke="#8b5cf6" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorLots)" 
                      name="Lots"
                    />
                  )}
                  {selectedMetrics.includes("documents") && (
                    <Area 
                      type="monotone" 
                      dataKey="documents" 
                      stroke="#f97316" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorDocuments)" 
                      name="Documents"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
