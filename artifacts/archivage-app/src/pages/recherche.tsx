import { useState, useEffect } from "react";
import { apiUrl } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, FolderKanban, Files, FileText } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Link } from "wouter";

const REGIONS = ["1° RM", "2° RM", "3° RM", "4° RM", "5° RM", "6° RM"];

export default function RecherchePage() {
  const [tab, setTab] = useState("projets");
  const [q, setQ] = useState("");
  const [stade, setStade] = useState("all");
  const [priorite, setPriorite] = useState("all");
  const [idTag, setIdTag] = useState("all");
  const [nomRegion, setNomRegion] = useState("all");
  const [date, setDate] = useState("");
  const [montant, setMontant] = useState("");
  const [statut, setStatut] = useState("all");
  const [idType, setIdType] = useState("all");
  const [idUnite, setIdUnite] = useState("all");
  const [idCmd, setIdCmd] = useState("all");
  const [cmds, setCmds] = useState<any[]>([]);
  const [unites, setUnites] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<any[]>([]);
  const [resultatsProjets, setResultatsProjets] = useState<Record<string, unknown>[] | null>(null);
  const [resultatsDocuments, setResultatsDocuments] = useState<Record<string, unknown>[] | null>(null);

  useEffect(() => {
    fetch(apiUrl("/cmds"), { credentials: "include" })
      .then(res => res.json())
      .then(data => setCmds(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching cmds:", err));
    fetch(apiUrl("/unites"), { credentials: "include" })
      .then(res => res.json())
      .then(data => setUnites(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching unites:", err));
    fetch(apiUrl("/types"), { credentials: "include" })
      .then(res => res.json())
      .then(data => setTypes(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching types:", err));
    fetch(apiUrl("/tags"), { credentials: "include" })
      .then(res => res.json())
      .then(data => setTags(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching tags:", err));
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      if (tab === "projets") {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (stade !== "all") params.set("stade", stade);
        if (priorite !== "all") params.set("priorite", priorite);
        if (idTag !== "all") params.set("id_tag", idTag);
        if (nomRegion !== "all") params.set("nom_region", nomRegion);
        if (date) params.set("date", date);
        if (montant) params.set("montant", montant);
        if (idUnite !== "all") params.set("id_unite", idUnite);
        if (idCmd !== "all") params.set("id_cmd", idCmd);

        const res = await fetch(apiUrl(`/recherche/projets?${params}`), { credentials: "include" });
        setResultatsProjets(await res.json());
      } else {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (statut !== "all") params.set("statut", statut);
        if (idType !== "all") params.set("id_type", idType);
        const res = await fetch(apiUrl(`/recherche/documents?${params}`), { credentials: "include" });
        setResultatsDocuments(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recherche avancée"
        description="Recherchez dans les projets et documents"
      />

      <Card className="mb-6">
        <CardContent className="p-6">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="projets">
            <FolderKanban className="mr-2 h-4 w-4" /> Projets
          </TabsTrigger>
          <TabsTrigger value="documents">
            <Files className="mr-2 h-4 w-4" /> Documents
          </TabsTrigger>
        </TabsList>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Recherche globale</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    data-testid="input-search-query"
                    placeholder="Programme, PA, ou mot-clé..."
                    className="pl-9"
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && void handleSearch()}
                  />
                </div>
              </div>

              <TabsContent value="projets" className="mt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Stade du projet</Label>
                    <Select value={stade} onValueChange={setStade}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les stades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les stades</SelectItem>
                        {["en cours", "planification", "archivé", "achevé", "en procédure", "non lancé", "à lancer", "résilié", "à résilier"].map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Région</Label>
                    <Select value={nomRegion} onValueChange={setNomRegion}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les régions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les régions</SelectItem>
                        {REGIONS.map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tag / Étiquette</Label>
                    <Select value={idTag} onValueChange={setIdTag}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les tags" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les tags</SelectItem>
                        {tags.map(t => (
                          <SelectItem key={t.id} value={t.id.toString()}>{t.lib_tag}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Commandement (CMD)</Label>
                    <Select value={idCmd} onValueChange={setIdCmd}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les CMDs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les CMDs</SelectItem>
                        {cmds.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.nom_cmd} {c.nom_region ? `- ${c.nom_region}` : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Unité</Label>
                    <Select value={idUnite} onValueChange={setIdUnite}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les unités" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les unités</SelectItem>
                        {unites.map(u => (
                          <SelectItem key={u.id} value={u.id.toString()}>{u.nom_unite}{u.nom_cmd ? ` (${u.nom_cmd})` : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="text"
                      placeholder="Année (ex: 2024) ou date complète"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Montant minimum (MAD)</Label>
                    <Input
                      type="number"
                      placeholder="MAD..."
                      value={montant}
                      onChange={e => setMontant(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="mt-0">
                <div className="space-y-2">
                  <Label>Type de document</Label>
                  <Select value={idType} onValueChange={setIdType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      {types.map(t => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.lib_type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

               <div className="flex gap-2">
                 <Button 
                   onClick={() => void handleSearch()} 
                   className="flex-1" 
                   data-testid="button-search" 
                   disabled={loading}
                 >
                   {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                   Lancer la recherche
                 </Button>
                 <Button
                   variant="outline"
                   onClick={() => {
                     setQ(""); setStade("all"); setPriorite("all"); setIdTag("all"); setNomRegion("all"); setDate(""); setMontant(""); setStatut("all"); setIdType("all");
                     setIdUnite("all"); setIdCmd("all");
                     setResultatsProjets(null); setResultatsDocuments(null);
                   }}
                   title="Réinitialiser les filtres"
                 >
                   Réinitialiser
                 </Button>
               </div>
             </div>
           </Tabs>
         </CardContent>
       </Card>

      {tab === "projets" && resultatsProjets !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{resultatsProjets.length} projet(s) trouvé(s)</CardTitle>
          </CardHeader>
          <CardContent>
            {resultatsProjets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun résultat</p>
            ) : (
              <div className="space-y-2">
                {resultatsProjets.map((p) => (
                  <div key={p.id_projet as number} className="p-3 rounded-lg border bg-card" data-testid={`result-projet-${p.id_projet}`}>
                    <div className="flex items-start justify-between">
                       <div>
                         <p className="font-medium">{p.programme as string ?? "—"} <span className="text-xs font-normal text-muted-foreground ml-2">({p.numero as string ?? "N/A"})</span></p>
                         <p className="text-sm text-muted-foreground">
                           {p.pa as string} · {p.numero_op as string} ·
                           {p.nom_unite ? ` ${p.nom_unite}` : " —"} ·
                           {p.nom_cmd ? ` ${p.nom_cmd}` : ""}
                           {p.nom_region ? ` (${p.nom_region})` : ""} ·
                           {p.nom_chef_projet as string ?? "—"}
                         </p>
                       </div>

                        <div className="flex gap-2 items-center">
                          <Button size="icon" variant="ghost" asChild className="h-8 w-8 text-indigo-600 hover:bg-indigo-50" title="Voir les documents">
                            <Link href={`/documents?id_projet=${p.id_projet}`}>
                              <FileText className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Badge className={`border-0 capitalize ${
                            p.stade === "en cours" ? "bg-green-100 text-green-700" :
                            p.stade === "planification" ? "bg-blue-100 text-blue-700" :
                            p.stade === "archivé" ? "bg-orange-100 text-orange-700" :
                            p.stade === "achevé" ? "bg-gray-100 text-gray-700" :
                            p.stade === "en procédure" ? "bg-purple-100 text-purple-700" :
                            p.stade === "non lancé" ? "bg-slate-100 text-slate-700" :
                            p.stade === "à lancer" ? "bg-indigo-100 text-indigo-700" :
                            p.stade === "résilié" ? "bg-red-100 text-red-700" :
                            p.stade === "à résilier" ? "bg-rose-100 text-rose-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {p.stade as string ?? "—"}
                          </Badge>
                          <div className="flex flex-wrap gap-1 ml-2">
                            {(p.tags as any[])?.map((t: any) => (
                              <Badge key={t.id} variant="outline" className="text-[10px] bg-indigo-50 text-indigo-600 border-indigo-200">
                                {t.lib_tag}
                              </Badge>
                            ))}
                          </div>
                          <span className="text-sm font-medium ml-2">{formatCurrency(p.montant_delegue as number)}</span>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

       {tab === "documents" && resultatsDocuments !== null && (
         <Card>
           <CardHeader>
             <CardTitle className="text-base">{resultatsDocuments.length} document(s) trouvé(s)</CardTitle>
           </CardHeader>
           <CardContent>
             {resultatsDocuments.length === 0 ? (
               <p className="text-sm text-muted-foreground text-center py-4">Aucun résultat</p>
             ) : (
               <div className="space-y-2">
                 {resultatsDocuments.map((d) => (
                   <div key={d.id_document as number} className="p-3 rounded-lg border bg-card" data-testid={`result-document-${d.id_document}`}>
                     <div className="flex items-start justify-between">
                        <div>
                           <p className="font-medium">{d.nom_doc as string}</p>
                          <p className="text-sm text-muted-foreground">{d.nom_projet as string ?? "—"} · {d.nome_phase as string ?? "—"} · {d.nom_auteur as string ?? "—"}</p>
                        </div>
                         <div className="flex gap-2 items-center">
                          <Badge className={`border-0 capitalize ${
                            d.type_document?.toString().toLowerCase() === "administratif" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                          }`}>
                            {d.type_document as string ?? "—"}
                          </Badge>
                          <Badge className="border-0 bg-gray-100 text-gray-700 capitalize">{d.statut as string ?? "—"}</Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(d.date_creation as string)}</span>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
             )}
           </CardContent>
         </Card>
       )} 
    </div>
  );
}
