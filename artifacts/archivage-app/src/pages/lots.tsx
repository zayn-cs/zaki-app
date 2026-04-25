import { useState, useCallback } from "react";
import { apiUrl } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Loader2, Layers } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Lot {
  id_lot: number;
  nom_lot: string;
  id_projet?: number;
  nom_projet?: string;
  id_departement?: number;
  nom_departement?: string;
  nom_responsable?: string;
}

interface Projet { id_projet: number; programme?: string; }
interface Departement { id: number; nom: string; }
interface Utilisateur { id: number; nom: string; prenom: string; }

export default function LotsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editLot, setEditLot] = useState<Lot | null>(null);
   const [form, setForm] = useState({ nom_lot: "", id_projet: "", id_departement: "" });
  const [saving, setSaving] = useState(false);

  const { data: lots = [], isLoading } = useQuery<Lot[]>({
    queryKey: ["lots"],
    queryFn: () => fetch(apiUrl("/lots"), { credentials: "include" }).then(r => r.json()),
  });

  const { data: projets = [] } = useQuery<Projet[]>({
    queryKey: ["projets"],
    queryFn: () => fetch(apiUrl("/projets"), { credentials: "include" }).then(r => r.json()),
  });

  const { data: departements = [] } = useQuery<Departement[]>({
    queryKey: ["departements"],
    queryFn: () => fetch(apiUrl("/departements"), { credentials: "include" }).then(r => r.json()),
  });

  const { data: utilisateurs = [] } = useQuery<Utilisateur[]>({
    queryKey: ["utilisateurs"],
    queryFn: () => fetch(apiUrl("/utilisateurs"), { credentials: "include" }).then(r => r.json()),
  });

  const filtered = lots.filter(l =>
    !search || l.nom_lot?.toLowerCase().includes(search.toLowerCase()) || l.nom_projet?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditLot(null);
    setForm({ nom_lot: "", id_projet: "", id_departement: "" });
    setDialogOpen(true);
  };

  const openEdit = (l: Lot) => {
    setEditLot(l);
    setForm({
      nom_lot: l.nom_lot,
      id_projet: l.id_projet?.toString() ?? "",
      id_departement: l.id_departement?.toString() ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = useCallback(async () => {
    if (!form.nom_lot) return;
    setSaving(true);
    try {
      const body = {
        nom_lot: form.nom_lot,
        id_projet: form.id_projet ? parseInt(form.id_projet) : null,
        id_departement: form.id_departement ? parseInt(form.id_departement) : null,
      };

      const url = editLot ? apiUrl(`/lots/${editLot.id_lot}`) : apiUrl("/lots");
      const method = editLot ? "PATCH" : "POST";

      const res = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");

      const updatedLot = await res.json();

      // Optimistically update the lots cache
      if (editLot) {
        queryClient.setQueryData<Lot[]>(["lots"], (old) => {
          if (!old) return [updatedLot];
          return old.map((l) => (l.id_lot === updatedLot.id_lot ? updatedLot : l));
        });
      } else {
        queryClient.setQueryData<Lot[]>(["lots"], (old) => {
          if (!old) return [updatedLot];
          return [updatedLot, ...old];
        });
      }

      setDialogOpen(false);
      toast({ title: editLot ? "Lot modifié" : "Lot créé", description: form.nom_lot });
    } catch (err) {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : "Erreur", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [form, editLot, queryClient, toast]);

  const handleDelete = async (l: Lot) => {
    if (!confirm(`Supprimer le lot "${l.nom_lot}" ?`)) return;
    const res = await fetch(apiUrl(`/lots/${l.id_lot}`), { method: "DELETE", credentials: "include" });
    if (res.ok) {
      await queryClient.invalidateQueries({ queryKey: ["lots"] });
      toast({ title: "Lot supprimé" });
    } else {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Lots"
        description="Gestion des lots de projets"
        action={
          <Button onClick={openCreate} data-testid="button-create-lot">
            <Plus className="mr-2 h-4 w-4" /> Nouveau lot
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-testid="input-search-lots"
              placeholder="Rechercher un lot..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom du lot</TableHead>
              <TableHead>Projet</TableHead>
              <TableHead>Département</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucun lot trouvé</TableCell></TableRow>
            ) : filtered.map(l => (
              <TableRow key={l.id_lot} data-testid={`row-lot-${l.id_lot}`}>
                <TableCell className="font-medium">{l.nom_lot}</TableCell>
                <TableCell>{l.nom_projet ?? "—"}</TableCell>
                <TableCell>{l.nom_departement ?? "—"}</TableCell>
                <TableCell>{l.nom_responsable ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2 items-center">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(l)} data-testid={`button-edit-lot-${l.id_lot}`}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-destructive" onClick={() => void handleDelete(l)} data-testid={`button-delete-lot-${l.id_lot}`}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editLot ? "Modifier le lot" : "Nouveau lot"}</DialogTitle>
          </DialogHeader>
           <div className="space-y-4">
             <div className="space-y-2">
               <Label>Nom du lot *</Label>
               <Input data-testid="input-nom-lot" value={form.nom_lot} onChange={e => setForm(f => ({ ...f, nom_lot: e.target.value }))} placeholder="Nom du lot" />
             </div>
             <div className="space-y-2">
               <Label>Projet</Label>
               <Select value={form.id_projet} onValueChange={v => setForm(f => ({ ...f, id_projet: v }))}>
                 <SelectTrigger><SelectValue placeholder="Choisir un projet" /></SelectTrigger>
                 <SelectContent>
                   {projets.map(p => <SelectItem key={p.id_projet} value={p.id_projet.toString()}>{p.programme}</SelectItem>)}
                 </SelectContent>
               </Select>
             </div>
             <div className="space-y-2">
               <Label>Département</Label>
               <Select value={form.id_departement} onValueChange={v => setForm(f => ({ ...f, id_departement: v }))}>
                 <SelectTrigger><SelectValue placeholder="Choisir un département" /></SelectTrigger>
                 <SelectContent>
                   {departements.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.nom}</SelectItem>)}
                 </SelectContent>
               </Select>
             </div>
           </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={() => void handleSave()} disabled={saving || !form.nom_lot} data-testid="button-save-lot">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editLot ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
