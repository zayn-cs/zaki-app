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
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Unite {
  id: number;
  nom_unite: string;
  id_cmd?: number;
  nom_cmd?: string;
  nom_region?: string;
}

const REGIONS = ["1° RM", "2° RM", "3° RM", "4° RM", "5° RM", "6° RM"];

export default function UnitesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUnite, setEditUnite] = useState<Unite | null>(null);
  const [form, setForm] = useState({ nom_unite: "", nom_cmd: "", nom_region: "" });
  const [saving, setSaving] = useState(false);

  const { data: unites = [], isLoading } = useQuery<Unite[]>({
    queryKey: ["unites"],
    queryFn: () => fetch(apiUrl("/unites"), { credentials: "include" }).then(r => r.json()),
  });

  const filtered = unites.filter(u =>
    !search || u.nom_unite?.toLowerCase().includes(search.toLowerCase()) || 
    u.nom_cmd?.toLowerCase().includes(search.toLowerCase()) || 
    u.nom_region?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditUnite(null);
    setForm({ nom_unite: "", nom_cmd: "", nom_region: "" });
    setDialogOpen(true);
  };

  const openEdit = (u: Unite) => {
    setEditUnite(u);
    setForm({
      nom_unite: u.nom_unite,
      nom_cmd: u.nom_cmd ?? "",
      nom_region: u.nom_region ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = useCallback(async () => {
    if (!form.nom_unite) return;
    setSaving(true);
    try {
      const url = editUnite ? apiUrl(`/unites/${editUnite.id}`) : apiUrl("/unites");
      const method = editUnite ? "PATCH" : "POST";

      const res = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");

      await queryClient.invalidateQueries({ queryKey: ["unites"] });
      setDialogOpen(false);
      toast({ title: editUnite ? "Unité modifiée" : "Unité créée", description: form.nom_unite });
    } catch (err) {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : "Erreur", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [form, editUnite, queryClient, toast]);

  const handleDelete = async (u: Unite) => {
    if (!confirm(`Supprimer l'unité "${u.nom_unite}" ?`)) return;
    const res = await fetch(apiUrl(`/unites/${u.id}`), { method: "DELETE", credentials: "include" });
    if (res.ok) {
      await queryClient.invalidateQueries({ queryKey: ["unites"] });
      toast({ title: "Unité supprimée" });
    } else {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Unités"
        description="Gestion des unités, CMDs et Régions"
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle unité
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une unité, CMD ou région..."
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
              <TableHead>Nom de l'unité</TableHead>
              <TableHead>CMD</TableHead>
              <TableHead>Région</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucune unité trouvée</TableCell></TableRow>
            ) : filtered.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.nom_unite}</TableCell>
                <TableCell>{u.nom_cmd ?? "—"}</TableCell>
                <TableCell>{u.nom_region ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="hover:text-destructive" onClick={() => void handleDelete(u)}><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle>{editUnite ? "Modifier l'unité" : "Nouvelle unité"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de l'unité *</Label>
              <Input value={form.nom_unite} onChange={e => setForm(f => ({ ...f, nom_unite: e.target.value }))} placeholder="ex: Unité de Casablanca" />
            </div>
            <div className="space-y-2">
              <Label>Nom de la CMD</Label>
              <Input value={form.nom_cmd} onChange={e => setForm(f => ({ ...f, nom_cmd: e.target.value }))} placeholder="ex: CMD Centre" />
            </div>
            <div className="space-y-2">
              <Label>Région</Label>
              <Select value={form.nom_region} onValueChange={v => setForm(f => ({ ...f, nom_region: v }))}>
                <SelectTrigger><SelectValue placeholder="Choisir une région" /></SelectTrigger>
                <SelectContent>
                  {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={() => void handleSave()} disabled={saving || !form.nom_unite}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editUnite ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
