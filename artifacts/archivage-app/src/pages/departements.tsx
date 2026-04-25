import { useState, useCallback } from "react";
import { apiUrl } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Loader2, Building2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Departement { id: number; nom: string; }

export default function DepartementsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDept, setEditDept] = useState<Departement | null>(null);
  const [nom, setNom] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: departements = [], isLoading } = useQuery<Departement[]>({
    queryKey: ["departements"],
    queryFn: () => fetch(apiUrl("/departements"), { credentials: "include" }).then(r => r.json()),
  });

  const filtered = departements.filter(d =>
    !search || d.nom?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditDept(null); setNom(""); setDialogOpen(true); };
  const openEdit = (d: Departement) => { setEditDept(d); setNom(d.nom); setDialogOpen(true); };

  const handleSave = useCallback(async () => {
    if (!nom.trim()) return;
    setSaving(true);
    try {
      const url = editDept ? apiUrl(`/departements/${editDept.id}`) : apiUrl("/departements");
      const method = editDept ? "PATCH" : "POST";
      const res = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom }),
      });
      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");
      await queryClient.invalidateQueries({ queryKey: ["departements"] });
      setDialogOpen(false);
      toast({ title: editDept ? "Département modifié" : "Département créé", description: nom });
    } catch (err) {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : "Erreur", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [nom, editDept, queryClient, toast]);

  const handleDelete = async (d: Departement) => {
    if (!confirm(`Supprimer le département "${d.nom}" ?`)) return;
    const res = await fetch(apiUrl(`/departements/${d.id}`), { method: "DELETE", credentials: "include" });
    if (res.ok) {
      await queryClient.invalidateQueries({ queryKey: ["departements"] });
      toast({ title: "Département supprimé" });
    } else {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Départements"
        description="Gestion des départements"
        action={
          <Button onClick={openCreate} data-testid="button-create-dept">
            <Plus className="mr-2 h-4 w-4" /> Nouveau département
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-testid="input-search-depts"
              placeholder="Rechercher un département..."
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
              <TableHead>Nom du département</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={2} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">Aucun département trouvé</TableCell></TableRow>
            ) : filtered.map(d => (
              <TableRow key={d.id} data-testid={`row-dept-${d.id}`}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{d.nom}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(d)} data-testid={`button-edit-dept-${d.id}`}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="hover:text-destructive" onClick={() => void handleDelete(d)} data-testid={`button-delete-dept-${d.id}`}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editDept ? "Modifier le département" : "Nouveau département"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nom *</Label>
            <Input
              data-testid="input-nom-dept"
              value={nom}
              onChange={e => setNom(e.target.value)}
              placeholder="Nom du département"
              onKeyDown={e => e.key === "Enter" && void handleSave()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={() => void handleSave()} disabled={saving || !nom.trim()} data-testid="button-save-dept">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editDept ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
