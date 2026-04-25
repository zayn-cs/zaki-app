import { useState, useCallback } from "react";
import { apiUrl } from "@/lib/api";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Upload, Archive, Eye, Download, Loader2, FileText, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Document {
  id_document: number;
  nom_doc: string;
  statut?: string;
  date_creation?: string;
  type_document?: string;
  nom_phase?: string;
  nom_projet?: string;
  nom_auteur?: string;
  numero_version?: number;
  commentaire?: string;
  id_projet?: number;
  id_phase?: number;
  id_type?: number;
  is_global?: boolean;
  id_utilisateur?: number;
}

interface Version {
  id_version: number;
  numero_version: number;
  date_modification?: string;
  fichier_path?: string;
  commentaire?: string;
}

interface Projet { id_projet: number; programme?: string; }
interface TypeDoc { id: number; lib_type: string; allowed_formats?: string | null; }
interface Phase { id_phase: number; nome_phase: string; id_lot?: number; }
interface Utilisateur { id: number; nom: string; prenom: string; }

const STATUT_COLORS: Record<string, string> = {
  actif: "bg-green-100 text-green-700",
  "archivé": "bg-gray-100 text-gray-700",
  brouillon: "bg-yellow-100 text-yellow-700",
};



export default function DocumentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const projectFilter = searchParams.get("id_projet");
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<Document | null>(null);
  const [form, setForm] = useState({ nom_doc: "", id_projet: "", id_lot: "", id_phase: "", nom_phase: "", id_type: "", type_name: "", commentaire: "", is_global: "false", id_utilisateur: "" });
  const [saving, setSaving] = useState(false);
  const [uploadDocId, setUploadDocId] = useState<number | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadComment, setUploadComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [versionsDocId, setVersionsDocId] = useState<number | null>(null);

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["documents", statutFilter, projectFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statutFilter !== "all") params.append("statut", statutFilter);
      if (projectFilter) params.append("id_projet", projectFilter);
      const qs = params.toString() ? `?${params.toString()}` : "";
      return fetch(apiUrl(`/documents${qs}`), { credentials: "include" }).then(r => r.json());
    },
  });

  const { data: projets = [] } = useQuery<Projet[]>({
    queryKey: ["projets"],
    queryFn: () => fetch(apiUrl("/projets"), { credentials: "include" }).then(r => r.json()),
  });

  const { data: types = [] } = useQuery<TypeDoc[]>({
    queryKey: ["types"],
    queryFn: () => fetch(apiUrl("/types"), { credentials: "include" }).then(r => r.json()),
  });

  const { data: phases = [] } = useQuery<Phase[]>({
    queryKey: ["phases"],
    queryFn: () => fetch(apiUrl("/phases"), { credentials: "include" }).then(r => r.json()),
  });

  const { data: lots = [] } = useQuery<any[]>({
    queryKey: ["lots"],
    queryFn: () => fetch(apiUrl("/lots"), { credentials: "include" }).then(r => r.json()),
  });

  const { data: utilisateurs = [] } = useQuery<Utilisateur[]>({
    queryKey: ["utilisateurs"],
    queryFn: () => fetch(apiUrl("/utilisateurs"), { credentials: "include" }).then(r => r.json()),
  });

  const { data: versions = [] } = useQuery<Version[]>({
    queryKey: ["versions", versionsDocId],
    queryFn: () => fetch(apiUrl(`/documents/${versionsDocId}/versions`), { credentials: "include" }).then(r => r.json()),
    enabled: !!versionsDocId,
  });

  const filtered = documents.filter(d =>
    !search || d.nom_doc?.toLowerCase().includes(search.toLowerCase()) || d.nom_projet?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditDoc(null);
    setForm({
      nom_doc: "",
      id_projet: "",
      id_lot: "",
      id_phase: "",
      nom_phase: "",
      id_type: "",
      type_name: "",
      commentaire: "",
      is_global: "false",
      id_utilisateur: ""
    });
    setDialogOpen(true);
  };

  const openEdit = (d: Document) => {
    setEditDoc(d);
    setForm({
      nom_doc: d.nom_doc,
      id_projet: d.id_projet?.toString() ?? "",
      id_lot: "", 
      id_phase: d.id_phase?.toString() ?? "",
      nom_phase: d.nom_phase ?? "",
      id_type: d.id_type?.toString() ?? "",
      type_name: d.type_document ?? "",
      commentaire: d.commentaire ?? "",
      is_global: d.is_global ? "true" : "false",
      id_utilisateur: d.id_utilisateur?.toString() ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = useCallback(async () => {
    if (!form.nom_doc) return;
    setSaving(true);
    try {
      const body = {
        nom_doc: form.nom_doc,
        id_projet: form.id_projet ? parseInt(form.id_projet) : null,
        id_lot: form.id_lot ? parseInt(form.id_lot) : null,
        nom_phase: form.nom_phase,
        id_phase: form.id_phase ? parseInt(form.id_phase) : null,
        id_type: form.id_type ? parseInt(form.id_type) : null,
        type_name: form.type_name,
        commentaire: form.commentaire,
        is_global: form.is_global === "true",
        id_utilisateur: form.id_utilisateur ? parseInt(form.id_utilisateur) : null,
      };

      const url = editDoc ? apiUrl(`/documents/${editDoc.id_document}`) : apiUrl("/documents");
      const method = editDoc ? "PATCH" : "POST";

      const res = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");

      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      setDialogOpen(false);
      toast({ title: editDoc ? "Document modifié" : "Document créé", description: form.nom_doc });
    } catch (err) {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : "Erreur", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [form, editDoc, queryClient, toast]);

  const handleDelete = async (d: Document) => {
    if (!confirm(`Supprimer "${d.nom_doc}" ?`)) return;
    const res = await fetch(apiUrl(`/documents/${d.id_document}`), { method: "DELETE", credentials: "include" });
    if (res.ok) {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Document supprimé" });
    } else {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleArchive = async (d: Document) => {
    const res = await fetch(apiUrl(`/documents/${d.id_document}/archiver`), {
      method: "POST", credentials: "include",
    });
    if (res.ok) {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Document archivé" });
    } else {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleUpload = useCallback(async () => {
    if (!uploadDocId || !uploadFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      if (uploadComment) fd.append("commentaire", uploadComment);

      const res = await fetch(apiUrl(`/documents/${uploadDocId}/upload`), {
        method: "POST", credentials: "include", body: fd,
      });

      if (!res.ok) throw new Error("Erreur lors de l'upload");

      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      setUploadDocId(null);
      setUploadFile(null);
      setUploadComment("");
      toast({ title: "Fichier uploadé", description: uploadFile.name });
    } catch (err) {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : "Erreur", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [uploadDocId, uploadFile, uploadComment, queryClient, toast]);

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Gestion documentaire avec versionnage"
        action={
          <Button onClick={openCreate} data-testid="button-create-document">
            <Plus className="mr-2 h-4 w-4" /> Nouveau document
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-testid="input-search-documents"
              placeholder="Rechercher un document..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {projectFilter && (
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 text-xs whitespace-nowrap">
              Filtré par projet
              <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full hover:bg-indigo-200" onClick={() => {
                setLocation("/documents");
              }}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
           <Select value={statutFilter} onValueChange={setStatutFilter}>
             <SelectTrigger className="w-48" data-testid="select-status-filter">
               <SelectValue placeholder="Statut" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Tous les statuts</SelectItem>
               <SelectItem value="actif">Actif</SelectItem>
               <SelectItem value="archivé">Archivé</SelectItem>
               <SelectItem value="brouillon">Brouillon</SelectItem>
             </SelectContent>
           </Select>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Projet</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucun document trouvé</TableCell></TableRow>
            ) : filtered.map(d => (
              <TableRow key={d.id_document} data-testid={`row-document-${d.id_document}`}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium truncate max-w-48">{d.nom_doc}</span>
                  </div>
                </TableCell>
                <TableCell>{d.nom_projet ?? "—"}</TableCell>
                <TableCell>
                  <Badge className={`border-0 capitalize ${
                    d.type_document?.toLowerCase() === "administratif" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                  }`}>
                    {d.type_document ?? "—"}
                  </Badge>
                </TableCell>
                <TableCell>v{d.numero_version ?? 0}</TableCell>
                <TableCell>{formatDate(d.date_creation)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" title="Versions" onClick={() => setVersionsDocId(d.id_document)} data-testid={`button-versions-${d.id_document}`}><Eye className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" title="Uploader un fichier" onClick={() => { setUploadDocId(d.id_document); setUploadFile(null); setUploadComment(""); }} data-testid={`button-upload-${d.id_document}`}><Upload className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(d)} data-testid={`button-edit-doc-${d.id_document}`}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="hover:text-destructive" onClick={() => void handleDelete(d)} data-testid={`button-delete-doc-${d.id_document}`}><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle>{editDoc ? "Modifier le document" : "Nouveau document"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom du document *</Label>
              <Input data-testid="input-nom-doc" value={form.nom_doc} onChange={e => setForm(f => ({ ...f, nom_doc: e.target.value }))} placeholder="Nom du document" />
            </div>
            <div className="space-y-2">
              <Label>Projet</Label>
              <Select value={form.id_projet} onValueChange={v => setForm(f => ({ ...f, id_projet: v }))}>
                <SelectTrigger><SelectValue placeholder="Choisir un projet" /></SelectTrigger>
                <SelectContent>
                  {projets.map(p => <SelectItem key={p.id_projet} value={p.id_projet.toString()}>{p.programme ?? `Projet #${p.id_projet}`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lot</Label>
              <Select value={form.id_lot} onValueChange={v => setForm(f => ({ ...f, id_lot: v, id_phase: "" }))}>
                <SelectTrigger><SelectValue placeholder="Choisir un lot" /></SelectTrigger>
                <SelectContent>
                  {lots.filter(l => !form.id_projet || l.id_projet?.toString() === form.id_projet).map(l => (
                    <SelectItem key={l.id_lot} value={l.id_lot.toString()}>{l.nom_lot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phase</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {["ETL", "ESC", "APD", "EXE"].map(pName => {
                  const isSelected = form.nom_phase === pName;
                  return (
                    <Button
                      key={pName}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="h-8 rounded-full"
                      onClick={() => setForm(f => ({ ...f, nom_phase: pName }))}
                    >
                      {pName}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Type de document</Label>
              <Select value={form.id_type} onValueChange={v => {
                const type = types.find(t => t.id.toString() === v);
                setForm(f => ({ ...f, id_type: v, type_name: type?.lib_type ?? "" }));
              }}>
                <SelectTrigger><SelectValue placeholder="Choisir un type" /></SelectTrigger>
                <SelectContent>
                  {types.map(t => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.lib_type}
                      {(() => {
                        try {
                          const formats = JSON.parse(t.allowed_formats || "[]");
                          return Array.isArray(formats) ? `(${formats.join("/")})` : "";
                        } catch { return ""; }
                      })()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Responsable</Label>
              <Select value={form.id_utilisateur} onValueChange={v => setForm(f => ({ ...f, id_utilisateur: v }))}>
                <SelectTrigger><SelectValue placeholder="Choisir un responsable" /></SelectTrigger>
                <SelectContent>
                  {utilisateurs.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.prenom} {u.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Commentaire</Label>
              <Textarea value={form.commentaire} onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))} placeholder="Commentaire" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={() => void handleSave()} disabled={saving || !form.nom_doc} data-testid="button-save-document">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editDoc ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!uploadDocId} onOpenChange={() => setUploadDocId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Uploader un fichier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fichier *</Label>
              <Input
                data-testid="input-upload-file"
                type="file"
                onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                className="cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <Label>Commentaire de version</Label>
              <Textarea
                value={uploadComment}
                onChange={e => setUploadComment(e.target.value)}
                placeholder="Description de cette version"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDocId(null)}>Annuler</Button>
            <Button onClick={() => void handleUpload()} disabled={!uploadFile || uploading} data-testid="button-confirm-upload">
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Upload className="mr-2 h-4 w-4" /> Uploader
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!versionsDocId} onOpenChange={() => setVersionsDocId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Versions du document</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune version disponible</p>
            ) : versions.map(v => (
              <div key={v.id_version} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium">Version {v.numero_version}</p>
                  <p className="text-sm text-muted-foreground">{v.commentaire}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(v.date_modification)}</p>
                </div>
                {v.fichier_path && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/uploads/${v.fichier_path}`} download>
                      <Download className="mr-2 h-4 w-4" /> Télécharger
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
