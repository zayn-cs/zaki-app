import { useState } from "react";
import { apiUrl } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface HistoriqueEntry {
  id: number;
  action: string;
  date_action?: string;
  entite_type?: string;
  entite_id?: number;
  commentaire?: string;
  nom_utilisateur?: string;
  messager?: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATION: "bg-green-100 text-green-700",
  MODIFICATION: "bg-blue-100 text-blue-700",
  SUPPRESSION: "bg-red-100 text-red-700",
  CONNEXION: "bg-purple-100 text-purple-700",
  DECONNEXION: "bg-gray-100 text-gray-700",
  UPLOAD: "bg-orange-100 text-orange-700",
  ARCHIVAGE: "bg-yellow-100 text-yellow-700",
};

const ACTIONS = ["CREATION", "MODIFICATION", "SUPPRESSION", "CONNEXION", "DECONNEXION", "UPLOAD", "ARCHIVAGE"];
const ENTITES = ["projet", "lot", "phase", "document", "utilisateur", "departement"];

export default function HistoriquePage() {
  const [action, setAction] = useState("all");
  const [entiteType, setEntiteType] = useState("all");

  const params = new URLSearchParams();
  if (action !== "all") params.set("action", action);
  if (entiteType !== "all") params.set("entite_type", entiteType);
  params.set("limit", "100");

  const { data: historique = [], isLoading } = useQuery<HistoriqueEntry[]>({
    queryKey: ["historique", action, entiteType],
    queryFn: () => fetch(apiUrl(`/historique?${params}`), { credentials: "include" }).then(r => r.json()),
  });

  return (
    <div>
      <PageHeader
        title="Historique"
        description="Journal de toutes les actions effectuées"
      />

      <Card className="mb-4">
        <CardContent className="p-4 flex gap-4">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Action</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger data-testid="select-action-filter">
                <SelectValue placeholder="Toutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {ACTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Type d'entité</Label>
            <Select value={entiteType} onValueChange={setEntiteType}>
              <SelectTrigger data-testid="select-entite-filter">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {ENTITES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Entité</TableHead>
              <TableHead>Commentaire</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : historique.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucune action trouvée</TableCell></TableRow>
            ) : historique.map(h => (
              <TableRow key={h.id} data-testid={`row-historique-${h.id}`}>
                <TableCell>
                  <Badge className={`border-0 ${ACTION_COLORS[h.action] ?? "bg-gray-100 text-gray-700"}`}>
                    {h.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium">{h.nom_utilisateur ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{h.messager}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm capitalize">{h.entite_type ?? "—"} {h.entite_id ? `#${h.entite_id}` : ""}</span>
                </TableCell>
                <TableCell className="max-w-xs">
                  <span className="text-sm truncate block">{h.commentaire ?? "—"}</span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(h.date_action)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
