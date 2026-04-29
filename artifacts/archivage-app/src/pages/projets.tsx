import { useState, useCallback } from "react";
import { apiUrl } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Eye, Loader2, FolderKanban, Sparkles, FileText } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Link } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import { Tag as TagIcon } from "lucide-react";

const STADES = ["en cours", "planification", "archivé", "achevé", "en procédure", "non lancé", "à lancer", "résilié", "à résilier"];
const PRIORITES = ["MD_CEM/ANP", "DCIM/MDN", "DG/CMIDI", "Directive de comba"];

interface Projet {
  id_projet: number;
  numero?: number;
  pa?: string;
  numero_op?: string;
  programme?: string;
  programme_a_realiser?: string;
  stade?: string;
  situation_objectif?: string;
  contrainte?: string;
  codification_cc?: string;
  priorite?: string;
  type?: string;
  reference_priorite?: string;
  zone?: string;
  block?: string;
  montant_delegue?: number;
  montant_engagement?: number;
  montant_paiement?: number;
  delais?: number;
  debut_etude?: string;
  fin_etude?: string;
  essais?: string;
  fin_prev?: string;
  date_achevement?: string;
  observation?: string;
  interne?: string;
  nom_bet?: string;
  nom_unite?: string;
  nom_chef_projet?: string;
  id_unite?: number;
  id_bet?: number;
  chef_projet?: number;
  tags?: { id: number; lib_tag: string }[];
}

function StadeBadge({ stade }: { stade?: string }) {
  const colors: Record<string, string> = {
    "en cours": "bg-green-100 text-green-700",
    "planification": "bg-blue-100 text-blue-700",
    "archivé": "bg-orange-100 text-orange-700",
    "achevé": "bg-gray-100 text-gray-700",
    "en procédure": "bg-purple-100 text-purple-700",
    "non lancé": "bg-slate-100 text-slate-700",
    "à lancer": "bg-indigo-100 text-indigo-700",
    "résilié": "bg-red-100 text-red-700",
    "à résilier": "bg-rose-100 text-rose-700",
  };
  return (
    <Badge className={`border-0 capitalize ${colors[stade ?? ""] ?? "bg-gray-100 text-gray-700"}`}>
      {stade ?? "—"}
    </Badge>
  );
}

interface ProjetFormData {
  numero: string;
  id_unite: string;
  pa: string;
  numero_op: string;
  montant_delegue: string;
  montant_engagement: string;
  montant_paiement: string;
  programme: string;
  programme_a_realiser: string;
  stade: string;
  situation_objectif: string;
  contrainte: string;
  codification_cc: string;
  id_bet: string;
  delais: string;
  debut_etude: string;
  fin_etude: string;
  essais: string;
  fin_prev: string;
  observation: string;
  interne: string;
  priorite: string;
  type: string;
  reference_priorite: string;
  zone: string;
  block: string;
  date_achevement: string;
  chef_projet: string;
  ids_tags: number[];
}

const EMPTY_FORM: ProjetFormData = {
  numero: "", id_unite: "", pa: "", numero_op: "", montant_delegue: "0", montant_engagement: "0", montant_paiement: "0",
  programme: "", programme_a_realiser: "", stade: "en cours", situation_objectif: "", contrainte: "", codification_cc: "",
  id_bet: "", delais: "0", debut_etude: "", fin_etude: "", essais: "", fin_prev: "",
  observation: "", interne: "", priorite: "MD_CEM/ANP", type: "", reference_priorite: "", date_achevement: "", chef_projet: "",
  zone: "", block: "",
  ids_tags: [],
};

export default function ProjetsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProjet, setEditProjet] = useState<Projet | null>(null);
  const [form, setForm] = useState<ProjetFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [detailProjet, setDetailProjet] = useState<Projet | null>(null);

  const { data: projets = [], isLoading } = useQuery<Projet[]>({
    queryKey: ["projets"],
    queryFn: () => fetch(apiUrl("/projets"), { credentials: "include" }).then(r => r.json()),
  });

  const { data: unites = [] } = useQuery<any[]>({
    queryKey: ["unites"],
    queryFn: () => fetch(apiUrl("/unites"), { credentials: "include" }).then(r => r.json()),
  });

  const { data: bets = [] } = useQuery<any[]>({
    queryKey: ["bets"],
    queryFn: () => fetch(apiUrl("/bet"), { credentials: "include" }).then(r => r.json()),
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["users"],
    queryFn: () => fetch(apiUrl("/users"), { credentials: "include" }).then(r => r.json()),
  });
  
  const { data: tags = [] } = useQuery<any[]>({
    queryKey: ["tags"],
    queryFn: () => fetch(apiUrl("/tags"), { credentials: "include" }).then(r => r.json()),
  });

  const filtered = projets.filter(p =>
    !search ||
    (p.programme?.toLowerCase().includes(search.toLowerCase())) ||
    (p.pa?.toLowerCase().includes(search.toLowerCase())) ||
    (p.stade?.toLowerCase().includes(search.toLowerCase()))
  );

  const openCreate = () => {
    setEditProjet(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (p: Projet) => {
    setEditProjet(p);
    setForm({
      numero: p.numero?.toString() ?? "",
      id_unite: p.id_unite?.toString() ?? "",
      pa: p.pa ?? "",
      numero_op: p.numero_op ?? "",
      montant_delegue: p.montant_delegue?.toString() ?? "0",
      montant_engagement: p.montant_engagement?.toString() ?? "0",
      montant_paiement: p.montant_paiement?.toString() ?? "0",
      programme: p.programme ?? "",
      programme_a_realiser: p.programme_a_realiser ?? "",
      stade: p.stade ?? "",
      situation_objectif: p.situation_objectif ?? "",
      contrainte: p.contrainte ?? "",
      codification_cc: p.codification_cc ?? "",
      id_bet: p.id_bet?.toString() ?? "",
      delais: p.delais?.toString() ?? "0",
      debut_etude: p.debut_etude ? p.debut_etude.substring(0, 16) : "",
      fin_etude: p.fin_etude ? p.fin_etude.substring(0, 16) : "",
      essais: p.essais ?? "",
      fin_prev: p.fin_prev ? p.fin_prev.substring(0, 16) : "",
      observation: p.observation ?? "",
      interne: p.interne ?? "",
      priorite: p.priorite ?? "",
      type: p.type ?? "",
      reference_priorite: p.reference_priorite ?? "",
      zone: p.zone ?? "",
      block: p.block ?? "",
      date_achevement: p.date_achevement ? p.date_achevement.substring(0, 16) : "",
      chef_projet: p.chef_projet?.toString() ?? "",
      ids_tags: p.tags?.map(t => t.id) ?? [],
    });
    setDialogOpen(true);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const body = {
        ...form,
        montant_delegue: parseFloat(form.montant_delegue) || 0,
        montant_engagement: parseFloat(form.montant_engagement) || 0,
        montant_paiement: parseFloat(form.montant_paiement) || 0,
        delais: parseInt(form.delais) || 0,
        id_unite: form.id_unite ? parseInt(form.id_unite) : null,
        id_bet: form.id_bet ? parseInt(form.id_bet) : null,
        chef_projet: form.chef_projet ? parseInt(form.chef_projet) : null,
        debut_etude: form.debut_etude || null,
        fin_etude: form.fin_etude || null,
        fin_prev: form.fin_prev || null,
        date_achevement: form.date_achevement || null,
      };

      const url = editProjet ? apiUrl(`/projets/${editProjet.id_projet}`) : apiUrl("/projets");
      const method = editProjet ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erreur lors de la sauvegarde");
      }

      const updatedProjet = await res.json();

      // Optimistically update the projets cache for immediate UI feedback
      if (editProjet) {
        queryClient.setQueryData<Projet[]>(["projets"], (old) => {
          if (!old) return [updatedProjet];
          return old.map((p) =>
            p.id_projet === updatedProjet.id_projet ? updatedProjet : p
          );
        });
      } else {
        queryClient.setQueryData<Projet[]>(["projets"], (old) => {
          if (!old) return [updatedProjet];
          return [updatedProjet, ...old];
        });
      }

      // Also invalidate to ensure fresh data from server
      await queryClient.invalidateQueries({ queryKey: ["projets"] });

      setDialogOpen(false);
      toast({ title: editProjet ? "Projet modifié" : "Projet créé", description: form.programme });
    } catch (err) {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : "Erreur", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [form, editProjet, queryClient, toast]);

  const handleDelete = async (p: Projet) => {
    if (!confirm(`Supprimer le projet "${p.programme}" ?`)) return;
    const res = await fetch(apiUrl(`/projets/${p.id_projet}`), {
      method: "DELETE", credentials: "include",
    });
    if (res.ok) {
      await queryClient.invalidateQueries({ queryKey: ["projets"] });
      toast({ title: "Projet supprimé" });
    } else {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Archives"
        description="Administration complète des archives et dossiers techniques"
        action={
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Nouvelle Archive
          </Button>
        }
      />

      <Card className="border-none shadow-sm ring-1 ring-slate-200">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par programme, PA ou stade..."
              className="pl-9 bg-slate-50 border-none ring-1 ring-slate-200 focus-visible:ring-blue-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md overflow-hidden ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold">Programme</TableHead>
                <TableHead className="font-bold">N° / Opération</TableHead>
                <TableHead className="font-bold">Stade</TableHead>
                <TableHead className="font-bold">Budget</TableHead>
                <TableHead className="font-bold">Chef de Projet</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                    <p className="mt-2 text-sm text-muted-foreground">Chargement des données...</p>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">
                    Aucune archive répertoriée
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id_projet} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-semibold text-slate-900 max-w-xs">
                      <div className="truncate">{p.programme}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.tags?.map(t => (
                          <Badge key={t.id} variant="outline" className="text-[9px] py-0 px-1 bg-indigo-50 text-indigo-600 border-indigo-200">
                            {t.lib_tag}
                          </Badge>
                        ))}
                      </div>
                      {p.pa && <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-normal mt-1">PA: {p.pa}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{p.numero ?? "—"}</div>
                      <div className="text-[10px] text-muted-foreground italic">{p.numero_op ?? "Sans N°OP"}</div>
                    </TableCell>
                    <TableCell><StadeBadge stade={p.stade} /></TableCell>
                    <TableCell>
                      <div className="text-sm font-bold text-emerald-600">{formatCurrency(p.montant_delegue)}</div>
                      <div className="text-[10px] text-muted-foreground">Délégué</div>
                    </TableCell>
                    <TableCell className="text-sm">{p.nom_chef_projet ?? "Non affecté"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" asChild className="h-8 w-8 text-indigo-600 hover:bg-indigo-50" title="Voir les documents">
                          <Link href={`/documents?id_projet=${p.id_projet}`}>
                            <FileText className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDetailProjet(p)} className="h-8 w-8 text-blue-600 hover:bg-blue-50" title="Détails">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(p)} className="h-8 w-8 text-amber-600 hover:bg-amber-50" title="Modifier">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => void handleDelete(p)} className="h-8 w-8 text-rose-600 hover:bg-rose-50" title="Supprimer">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4 mb-4">
            <DialogTitle className="text-2xl font-bold text-slate-900 leading-none">
              {editProjet ? "Modification du Projet" : "Nouveau Dossier Projet"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Identification */}
            <div className="md:col-span-3 bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-200">
              <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                <FolderKanban className="h-4 w-4" /> Identification du Programme
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nom du Programme *</Label>
                  <Input value={form.programme} onChange={e => setForm(f => ({ ...f, programme: e.target.value }))} placeholder="ex: Construction Lycée..." className="bg-white border-slate-300 shadow-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Programme à réaliser</Label>
                  <Input value={form.programme_a_realiser} onChange={e => setForm(f => ({ ...f, programme_a_realiser: e.target.value }))} className="bg-white border-slate-300 shadow-sm" />
                </div>
              </div>
            </div>

            {/* Technical Identifiers */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">N° Projet</Label>
              <Input value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} placeholder="000" className="border-slate-300" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">N° OP (Opération)</Label>
              <Input value={form.numero_op} onChange={e => setForm(f => ({ ...f, numero_op: e.target.value }))} placeholder="OP/..." className="border-slate-300" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">PA (PorteurAction)</Label>
              <Input value={form.pa} onChange={e => setForm(f => ({ ...f, pa: e.target.value }))} placeholder="Code PA" className="border-slate-300" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Unité / Localisation</Label>
              <Select value={form.id_unite} onValueChange={v => setForm(f => ({ ...f, id_unite: v }))}>
                <SelectTrigger className="border-slate-300"><SelectValue placeholder="Sél. une unité" /></SelectTrigger>
                <SelectContent>
                  {unites.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.nom_unite}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">BET (Bureau d'étude)</Label>
              <Select value={form.id_bet} onValueChange={v => setForm(f => ({ ...f, id_bet: v }))}>
                <SelectTrigger className="border-slate-300"><SelectValue placeholder="Sél. un BET" /></SelectTrigger>
                <SelectContent>
                  {bets.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.nom_bet}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Chef de Projet</Label>
              <Select value={form.chef_projet} onValueChange={v => setForm(f => ({ ...f, chef_projet: v }))}>
                <SelectTrigger className="border-slate-300"><SelectValue placeholder="Responsable" /></SelectTrigger>
                <SelectContent>
                  {users.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.prenom} {u.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Financials */}
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-b py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-blue-600">Montant Délégué</Label>
                <Input type="number" step="0.01" value={form.montant_delegue} onChange={e => setForm(f => ({ ...f, montant_delegue: e.target.value }))} className="border-blue-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-emerald-600">Montant Engagement</Label>
                <Input type="number" step="0.01" value={form.montant_engagement} onChange={e => setForm(f => ({ ...f, montant_engagement: e.target.value }))} className="border-emerald-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-orange-600">Montant Paiement</Label>
                <Input type="number" step="0.01" value={form.montant_paiement} onChange={e => setForm(f => ({ ...f, montant_paiement: e.target.value }))} className="border-orange-200" />
              </div>
            </div>

            {/* Status & Planning */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Stade actuel</Label>
              <Select value={form.stade} onValueChange={v => setForm(f => ({ ...f, stade: v }))}>
                <SelectTrigger className="border-slate-300 uppercase"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STADES.map(s => <SelectItem key={s} value={s} className="uppercase">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Priorité</Label>
              <Select value={form.priorite} onValueChange={v => setForm(f => ({ ...f, priorite: v }))}>
                <SelectTrigger className="border-slate-300"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Type de Projet</Label>
              <Input value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} placeholder="ex: Route, Bâtiment..." className="border-slate-300" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Zone</Label>
              <Input value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))} placeholder="Zone..." className="border-slate-300" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Block</Label>
              <Input value={form.block} onChange={e => setForm(f => ({ ...f, block: e.target.value }))} placeholder="Block..." className="border-slate-300" />
            </div>

            {/* Dates */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Début étude</Label>
              <Input type="datetime-local" value={form.debut_etude} onChange={e => setForm(f => ({ ...f, debut_etude: e.target.value }))} className="border-slate-300" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Fin étude</Label>
              <Input type="datetime-local" value={form.fin_etude} onChange={e => setForm(f => ({ ...f, fin_etude: e.target.value }))} className="border-slate-300" />
            </div>
            <div className="space-y-1.5">
               <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Fin prévue</Label>
               <Input type="datetime-local" value={form.fin_prev} onChange={e => setForm(f => ({ ...f, fin_prev: e.target.value }))} className="border-slate-300" />
            </div>

            {/* Additional Technical */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Codification CC</Label>
              <Input value={form.codification_cc} onChange={e => setForm(f => ({ ...f, codification_cc: e.target.value }))} className="border-slate-300" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Essais</Label>
              <Input value={form.essais} onChange={e => setForm(f => ({ ...f, essais: e.target.value }))} className="border-slate-300" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Délai (mois)</Label>
              <Input type="number" value={form.delais} onChange={e => setForm(f => ({ ...f, delais: e.target.value }))} className="border-slate-300" />
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Situation de l'objectif</Label>
              <Input value={form.situation_objectif} onChange={e => setForm(f => ({ ...f, situation_objectif: e.target.value }))} className="border-slate-300" />
            </div>

            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Contraintes</Label>
                <Textarea value={form.contrainte} onChange={e => setForm(f => ({ ...f, contrainte: e.target.value }))} rows={2} className="border-slate-300" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Reference priorité</Label>
                <Textarea value={form.reference_priorite} onChange={e => setForm(f => ({ ...f, reference_priorite: e.target.value }))} rows={2} className="border-slate-300" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Observations</Label>
                <Textarea value={form.observation} onChange={e => setForm(f => ({ ...f, observation: e.target.value }))} rows={2} className="border-slate-300" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Interne (Données sensibles)</Label>
                <Textarea value={form.interne} onChange={e => setForm(f => ({ ...f, interne: e.target.value }))} rows={2} className="border-slate-300 border-dashed" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date achèvement réelle</Label>
              <Input type="datetime-local" value={form.date_achevement} onChange={e => setForm(f => ({ ...f, date_achevement: e.target.value }))} className="border-slate-300" />
            </div>
            
            <div className="md:col-span-3 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                <TagIcon className="h-4 w-4" /> Étiquettes / Tags
              </h3>
              <div className="flex flex-wrap gap-4">
                {tags.map(t => (
                  <div key={t.id} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                    <Checkbox 
                      id={`tag-${t.id}`} 
                      checked={form.ids_tags.includes(t.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setForm(f => ({ ...f, ids_tags: [...f.ids_tags, t.id] }));
                        } else {
                          setForm(f => ({ ...f, ids_tags: f.ids_tags.filter(id => id !== t.id) }));
                        }
                      }}
                    />
                    <label htmlFor={`tag-${t.id}`} className="text-sm font-medium leading-none cursor-pointer">
                      {t.lib_tag}
                    </label>
                  </div>
                ))}
                {tags.length === 0 && <p className="text-xs text-muted-foreground italic">Aucun tag défini. Allez dans Paramètres &gt; Tags pour en créer.</p>}
              </div>
            </div>
          </div>

          <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 mt-6 border-t rounded-b-lg">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-300">Annuler</Button>
            <Button onClick={() => void handleSave()} disabled={saving} className="bg-blue-600 hover:bg-blue-700 min-w-[140px]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {editProjet ? "Enregistrer" : "Créer le Dossier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailProjet} onOpenChange={() => setDetailProjet(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Eye className="h-6 w-6 text-blue-500" />
              Informations Détaillées du Projet
            </DialogTitle>
          </DialogHeader>
          {detailProjet && (
            <div className="space-y-8 mt-4">
              <section>
                <h3 className="text-lg font-bold border-l-4 border-blue-500 pl-3 mb-4 bg-slate-50 py-2">Identification Générale</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                   <div><Label className="text-slate-400 block mb-1">Programme</Label> <span className="font-bold">{detailProjet.programme}</span></div>
                   <div><Label className="text-slate-400 block mb-1">Programme à réaliser</Label> <span className="font-medium">{detailProjet.programme_a_realiser ?? "—"}</span></div>
                   <div><Label className="text-slate-400 block mb-1">Numéro</Label> <span className="font-bold">{detailProjet.numero ?? "—"}</span></div>
                   <div><Label className="text-slate-400 block mb-1">PA / Operation</Label> <span className="font-medium">{detailProjet.pa} / {detailProjet.numero_op ?? "—"}</span></div>
                   <div><Label className="text-slate-400 block mb-1">Unité</Label> <span className="font-medium">{detailProjet.nom_unite ?? "—"}</span></div>
                   <div><Label className="text-slate-400 block mb-1">BET</Label> <span className="font-medium font-bold text-blue-700">{detailProjet.nom_bet ?? "—"}</span></div>
                   <div><Label className="text-slate-400 block mb-1">Zone</Label> <span className="font-medium">{detailProjet.zone ?? "—"}</span></div>
                   <div><Label className="text-slate-400 block mb-1">Block</Label> <span className="font-medium">{detailProjet.block ?? "—"}</span></div>
                   <div className="lg:col-span-3">
                     <Label className="text-slate-400 block mb-1">Étiquettes / Tags</Label>
                     <div className="flex flex-wrap gap-2 mt-1">
                       {detailProjet.tags?.map(t => (
                         <Badge key={t.id} variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                           <TagIcon className="h-3 w-3 mr-1" />
                           {t.lib_tag}
                         </Badge>
                       ))}
                       {(detailProjet.tags?.length === 0 || !detailProjet.tags) && <span className="text-muted-foreground italic text-xs">Aucun tag</span>}
                     </div>
                   </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold border-l-4 border-emerald-500 pl-3 mb-4 bg-slate-50 py-2">Situation Financière (DA)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <Label className="text-blue-600 block mb-1 text-xs font-bold uppercase tracking-wider">Délégué</Label>
                    <span className="text-lg font-black text-blue-900">{formatCurrency(detailProjet.montant_delegue)}</span>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <Label className="text-emerald-600 block mb-1 text-xs font-bold uppercase tracking-wider">Engagement</Label>
                    <span className="text-lg font-black text-emerald-900">{formatCurrency(detailProjet.montant_engagement)}</span>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <Label className="text-orange-600 block mb-1 text-xs font-bold uppercase tracking-wider">Paiement</Label>
                    <span className="text-lg font-black text-orange-900">{formatCurrency(detailProjet.montant_paiement)}</span>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold border-l-4 border-slate-500 pl-3 mb-4 bg-slate-50 py-2">Suivi Technique & Planning</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                   <div><Label className="text-slate-400 block mb-1">Stade</Label> <StadeBadge stade={detailProjet.stade} /></div>
                   <div><Label className="text-slate-400 block mb-1">Priorité</Label> <Badge variant="outline" className="capitalize">{detailProjet.priorite}</Badge></div>
                   <div><Label className="text-slate-400 block mb-1">Délai</Label> <span className="font-bold">{detailProjet.delais} mois</span></div>
                   <div><Label className="text-slate-400 block mb-1">Début étude</Label> <span className="font-medium">{formatDate(detailProjet.debut_etude)}</span></div>
                   <div><Label className="text-slate-400 block mb-1">Fin étude</Label> <span className="font-medium">{formatDate(detailProjet.fin_etude)}</span></div>
                   <div><Label className="text-slate-400 block mb-1">Fin prévue</Label> <span className="font-bold text-rose-600">{formatDate(detailProjet.fin_prev)}</span></div>
                   <div><Label className="text-slate-400 block mb-1">Situation Objectif</Label> <span className="font-medium">{detailProjet.situation_objectif ?? "—"}</span></div>
                   <div><Label className="text-slate-400 block mb-1">Codification CC</Label> <span className="font-medium">{detailProjet.codification_cc ?? "—"}</span></div>
                   <div><Label className="text-slate-400 block mb-1">Chef de projet</Label> <span className="font-bold">{detailProjet.nom_chef_projet ?? "—"}</span></div>
                </div>
              </section>

              {(detailProjet.observation || detailProjet.contrainte || detailProjet.interne) && (
                <section>
                  <h3 className="text-lg font-bold border-l-4 border-amber-500 pl-3 mb-4 bg-slate-50 py-2">Notes & Observations</h3>
                  <div className="space-y-4 text-sm">
                    {detailProjet.observation && <div className="bg-slate-50 p-4 rounded-lg"><Label className="font-bold block mb-2 underline">Observation:</Label>{detailProjet.observation}</div>}
                    {detailProjet.contrainte && <div className="bg-rose-50 p-4 rounded-lg border border-rose-100"><Label className="font-bold text-rose-700 block mb-2 underline">Contraintes:</Label>{detailProjet.contrainte}</div>}
                    {detailProjet.interne && <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 border-dashed"><Label className="font-bold text-blue-700 block mb-2 underline">Notes Internes:</Label>{detailProjet.interne}</div>}
                  </div>
                </section>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
