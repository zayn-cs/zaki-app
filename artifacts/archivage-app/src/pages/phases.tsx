import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Layers } from "lucide-react";

interface Phase {
  id_phase: number;
  nome_phase: string;
  date_debut: string | null;
  date_fin: string | null;
  id_user: number | null;
  id_lot: number | null;
  nom_responsable: string | null;
  nom_lot: string | null;
}

interface Lot {
  id_lot: number;
  nom_lot: string;
  nom_projet: string | null;
}

interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
}

const PROJECT_ROLES = ["admin", "coordinateur", "chef_departement", "chef_projet"];
const MANAGER_ROLES = ["admin", "coordinateur", "chef_departement"];

export default function PhasesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Phase | null>(null);
  const [filterLot, setFilterLot] = useState<string>("");

  const canCreate = user ? PROJECT_ROLES.includes(user.role) : false;
  const canDelete = user ? MANAGER_ROLES.includes(user.role) : false;

  const [form, setForm] = useState({
    nome_phase: "",
    date_debut: "",
    date_fin: "",
    id_user: "",
    id_lot: "",
  });

  const params = new URLSearchParams();
  if (filterLot) params.set("id_lot", filterLot);

  const { data: phases = [], isLoading } = useQuery<Phase[]>({
    queryKey: ["phases", filterLot],
    queryFn: async () => {
      const url = filterLot ? `/phases?id_lot=${filterLot}` : "/phases";
      const r = await api(url);
      if (!r.ok) throw new Error("Erreur");
      return r.json();
    },
  });

  const { data: lots = [] } = useQuery<Lot[]>({
    queryKey: ["lots"],
    queryFn: async () => {
      const r = await api("/lots");
      if (!r.ok) throw new Error("Erreur");
      return r.json();
    },
  });

  const { data: utilisateurs = [] } = useQuery<Utilisateur[]>({
    queryKey: ["utilisateurs"],
    queryFn: async () => {
      const r = await api("/utilisateurs");
      if (!r.ok) throw new Error("Erreur");
      return r.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const r = await api("/phases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_phase: data.nome_phase,
          date_debut: data.date_debut || null,
          date_fin: data.date_fin || null,
          id_user: data.id_user ? parseInt(data.id_user) : null,
          id_lot: data.id_lot ? parseInt(data.id_lot) : null,
        }),
      });
      if (!r.ok) throw new Error("Erreur création");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phases"] });
      toast({ title: "Phase créée avec succès" });
      setIsOpen(false);
      resetForm();
    },
    onError: () => toast({ title: "Erreur lors de la création", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof form & { id: number }) => {
      const r = await api(`/phases/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_phase: data.nome_phase,
          date_debut: data.date_debut || null,
          date_fin: data.date_fin || null,
          id_user: data.id_user ? parseInt(data.id_user) : null,
          id_lot: data.id_lot ? parseInt(data.id_lot) : null,
        }),
      });
      if (!r.ok) throw new Error("Erreur modification");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phases"] });
      toast({ title: "Phase modifiée avec succès" });
      setIsOpen(false);
      setEditing(null);
      resetForm();
    },
    onError: () => toast({ title: "Erreur lors de la modification", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await api(`/phases/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Erreur suppression");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phases"] });
      toast({ title: "Phase supprimée" });
    },
    onError: () => toast({ title: "Erreur lors de la suppression", variant: "destructive" }),
  });

  function resetForm() {
    setForm({ nome_phase: "", date_debut: "", date_fin: "", id_user: "", id_lot: "" });
  }

  function openCreate() {
    setEditing(null);
    resetForm();
    setIsOpen(true);
  }

  function openEdit(phase: Phase) {
    setEditing(phase);
    setForm({
      nome_phase: phase.nome_phase,
      date_debut: phase.date_debut ? phase.date_debut.split("T")[0] : "",
      date_fin: phase.date_fin ? phase.date_fin.split("T")[0] : "",
      id_user: phase.id_user ? String(phase.id_user) : "",
      id_lot: phase.id_lot ? String(phase.id_lot) : "",
    });
    setIsOpen(true);
  }

  function handleSubmit() {
    if (!form.nome_phase.trim()) {
      toast({ title: "Nom de la phase requis", variant: "destructive" });
      return;
    }
    if (editing) {
      updateMutation.mutate({ ...form, id: editing.id_phase });
    } else {
      createMutation.mutate(form);
    }
  }

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            Phases
          </h1>
          <p className="text-muted-foreground mt-1">Gestion des phases de travaux</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle phase
          </Button>
        )}
      </div>

      <div className="flex gap-4 items-end">
        <div className="w-64">
          <Label className="text-sm text-muted-foreground mb-1">Filtrer par lot</Label>
          <Select value={filterLot || "all"} onValueChange={(v) => setFilterLot(v === "all" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Tous les lots" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les lots</SelectItem>
              {lots.map((l) => (
                <SelectItem key={l.id_lot} value={String(l.id_lot)}>
                  {l.nom_lot} {l.nom_projet ? `(${l.nom_projet})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom de la phase</TableHead>
              <TableHead>Lot</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Date début</TableHead>
              <TableHead>Date fin</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : phases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Aucune phase trouvée
                </TableCell>
              </TableRow>
            ) : (
              phases.map((phase) => (
                <TableRow key={phase.id_phase}>
                  <TableCell className="font-medium">{phase.nome_phase}</TableCell>
                  <TableCell>
                    {phase.nom_lot ? (
                      <Badge variant="outline">{phase.nom_lot}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{phase.nom_responsable || "—"}</TableCell>
                  <TableCell>{formatDate(phase.date_debut)}</TableCell>
                  <TableCell>{formatDate(phase.date_fin)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canCreate && (
                        <Button variant="ghost" size="icon" onClick={() => openEdit(phase)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("Supprimer cette phase ?")) {
                              deleteMutation.mutate(phase.id_phase);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) { setEditing(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la phase" : "Nouvelle phase"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nom de la phase *</Label>
              <Select value={form.nome_phase} onValueChange={(v) => setForm({ ...form, nome_phase: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une phase" />
                </SelectTrigger>
                <SelectContent>
                  {["ETL", "ESC", "APD", "EXE"].map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lot associé</Label>
              <Select value={form.id_lot || "none"} onValueChange={(v) => setForm({ ...form, id_lot: v === "none" ? "" : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un lot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun lot</SelectItem>
                  {lots.map((l) => (
                    <SelectItem key={l.id_lot} value={String(l.id_lot)}>
                      {l.nom_lot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Responsable</Label>
              <Select value={form.id_user || "none"} onValueChange={(v) => setForm({ ...form, id_user: v === "none" ? "" : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un responsable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {utilisateurs.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.prenom} {u.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date début</Label>
                <Input
                  type="date"
                  value={form.date_debut}
                  onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
                />
              </div>
              <div>
                <Label>Date fin</Label>
                <Input
                  type="date"
                  value={form.date_fin}
                  onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsOpen(false); setEditing(null); resetForm(); }}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
