"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export default function TeamManager({ teams, onTeamChange }: { teams: any[], onTeamChange: () => void }) {
    const [newTeamName, setNewTeamName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch("/api/admin/teams", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newTeamName }),
            });
            setNewTeamName("");
            setIsCreating(false);
            onTeamChange();
        } catch (error) {
            console.error("Failed to create team", error);
        }
    };

    const handleDeleteTeam = async (teamId: string) => {
        if (!confirm("Tem certeza? Isso pode afetar usuários vinculados.")) return;
        try {
            await fetch(`/api/admin/teams?id=${teamId}`, { method: "DELETE" });
            onTeamChange();
        } catch (error) {
            console.error("Failed to delete team", error);
        }
    };

    return (
        <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Equipes</h2>

            <div className="space-y-2 mb-4">
                {teams.map((team) => (
                    <div key={team.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                            <span className="font-medium">{team.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">({team._count.members} membros)</span>
                        </div>
                        <button
                            onClick={() => handleDeleteTeam(team.id)}
                            className="text-muted-foreground hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
                {teams.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma equipe criada.</p>}
            </div>

            {isCreating ? (
                <form onSubmit={handleCreateTeam} className="flex gap-2">
                    <input
                        type="text"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="Nome da Equipe"
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        autoFocus
                    />
                    <button type="submit" className="bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium">Salvar</button>
                    <button
                        type="button"
                        onClick={() => setIsCreating(false)}
                        className="bg-muted text-muted-foreground px-3 py-2 rounded-lg text-sm font-medium"
                    >
                        Cancelar
                    </button>
                </form>
            ) : (
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                >
                    <Plus size={16} /> Nova Equipe
                </button>
            )}
        </div>
    );
}
