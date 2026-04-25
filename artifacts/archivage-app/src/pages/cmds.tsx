import { useState, useCallback } from "react";
import { apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Plus, Pencil, Trash2, Search, Network } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Cmd { id: number; nom_cmd: string; id_region: number | null; nom_region: string | null; }
interface Region { id: number; nom_region: string; }

const MANAGER_ROLES = ["admin", "coordinateur", "chef_departement"];
const ADMIN_ROLES = ["admin", "coordinateur"];
const emptyForm = { nom_cmd: "", id_region: "" };

export default function CMDsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Cmd | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const canCreate = user ? MANAGER_ROLES.includes(user.role) : false;
  const canDelete = user ? ADMIN_ROLES.includes(user.role) : false;

  const { data: cmds = [], isLoading } = useQuery<Cmd[]>({
    queryKey: ["cmds"],
    queryFn: () => fetch(apiUrl("/cmds"), { credentials: "include" }).then(r => r.json()),
  });

  const { data: regions = [] } = useQuery<Region[]>({
    queryKey: ["regions"],
    queryFn: () => fetch(apiUrl("/regions"), { credentials: "include" }).then(r => r.json()),
  });

  const filtered = cmds.filter(c =>
    !search || c.nom_cmd?.toLowerCase().includes(search.toLowerCase()) ||
    c.nom_region?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: Cmd) => {
    setEditItem(c);
    setForm({ nom_cmd: c.nom_cmd, id_region: c.id_region != null ? String(c.id_region) : "" });
    setDialogOpen(true);
  };

  const handleSave = useCallback(async () => {
    if (!form.nom_cmd.trim()) { toast({ title: "Nom CMD requis", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload = { nom_cmd: form.nom_cmd, id_region: form.id_region ? parseInt(form.id_region, 10) : null };
      const url = editItem ? apiUrl(`/cmds/${editItem.id}`) : apiUrl("/cmds");
      const method = editItem ? "PATCH" : "POST";
      const res = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erreur");
      await queryClient.invalidateQueries({ queryKey: ["cmds"] });
      setDialogOpen(false);
      toast({ title: editItem ? "CMD modifiée" : "CMD créée" });
    } catch {
      toast({ title: "Erreur lors de la sauvegarde", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [form, editItem, queryClient, toast]);

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette CMD ?")) return;
    const res = await fetch(apiUrl(`/cmds/${id}`), { method: "DELETE", credentials: "include" });
    if (res.ok) {
      await queryClient.invalidateQueries({ queryKey: ["cmds"] });
      toast({ title: "CMD supprimée" });
    } else {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Network className="h-6 w-6 text-primary" />
            CMDs
          </h1>
          <p className="text-muted-foreground mt-1">Gestion des centres de maîtrise d'ouvrage délégués</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle CMD
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom CMD</TableHead>
              <TableHead>Région</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Aucune CMD enregistrée</TableCell></TableRow>
            ) : filtered.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nom_cmd}</TableCell>
                <TableCell>{c.nom_region || "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {canCreate && (
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) { setEditItem(null); setForm(emptyForm); } }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{editItem ? "Modifier la CMD" : "Nouvelle CMD"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nom de la CMD *</Label>
              <Input value={form.nom_cmd} onChange={e => setForm({ ...form, nom_cmd: e.target.value })} placeholder="ex: CMD Alger Centre" />
            </div>
            <div>
              <Label>Région</Label>
              <Select value={form.id_region} onValueChange={v => setForm({ ...form, id_region: v === "none" ? "" : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une région" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {regions.map(r => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.nom_region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>{editItem ? "Modifier" : "Créer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
