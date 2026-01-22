"use client";

import { useState } from "react";
import { Edit2, Shield, User, Plus } from "lucide-react";

export default function UserList({ users, teams, onDataChange }: { users: any[], teams: any[], onDataChange: () => void }) {
    const [editingUser, setEditingUser] = useState<any>(null);
    const [role, setRole] = useState("");
    const [teamId, setTeamId] = useState("");

    const handleEditClick = (user: any) => {
        setEditingUser(user);
        setRole(user.role);
        setTeamId(user.teamId || "NONE");
    };

    const handleSave = async () => {
        try {
            await fetch("/api/admin/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: editingUser.id, role, teamId }),
            });
            setEditingUser(null);
            onDataChange();
        } catch (error) {
            console.error("Failed to update user", error);
        }
    };

    const [isCreating, setIsCreating] = useState(false);
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "COLLABORATOR", teamId: "NONE" });

    const handleCreate = async () => {
        if (!newUser.name || !newUser.email || !newUser.password) {
            alert("Preencha todos os campos obrigatórios");
            return;
        }

        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Erro ao criar usuário");
            }

            setNewUser({ name: "", email: "", password: "", role: "COLLABORATOR", teamId: "NONE" });
            setIsCreating(false);
            onDataChange();
        } catch (error: any) {
            console.error("Failed to create user", error);
            alert(error.message);
        }
    };

    return (
        <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden relative min-h-[500px]">
            <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-xl font-bold">Usuários</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="md:hidden bg-primary text-white p-2 rounded-full shadow-lg"
                >
                    <Plus size={20} />
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground font-medium">
                        <tr>
                            <th className="px-6 py-3">Nome</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Função</th>
                            <th className="px-6 py-3">Equipe</th>
                            <th className="px-6 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                                <td className="px-6 py-4 font-medium">{user.name}</td>
                                <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN'
                                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                        }`}>
                                        {user.role === 'ADMIN' ? <Shield size={12} /> : <User size={12} />}
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-muted-foreground">
                                    {user.teamName !== 'Sem Equipe' ? (
                                        <span className="bg-muted px-2 py-1 rounded-md text-xs">{user.teamName}</span>
                                    ) : (
                                        <span className="opacity-50">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleEditClick(user)}
                                        className="text-primary hover:text-primary/80 transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Floating Action Button (FAB) */}
            <div className="absolute bottom-6 right-6">
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 font-medium"
                >
                    <Plus size={20} />
                    <span className="hidden sm:inline">Novo Usuário</span>
                </button>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-md rounded-xl shadow-xl border border-border p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold mb-4">Editar Usuário</h3>
                        <p className="text-sm text-muted-foreground mb-6">Alterando permissões para <strong>{editingUser.name}</strong></p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Função</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                >
                                    <option value="COLLABORATOR">Colaborador</option>
                                    <option value="ADMIN">Administrador</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Equipe</label>
                                <select
                                    value={teamId}
                                    onChange={(e) => setTeamId(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                >
                                    <option value="NONE">Sem Equipe</option>
                                    {teams.map(team => (
                                        <option key={team.id} value={team.id}>{team.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
                            >
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-md rounded-xl shadow-xl border border-border p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold mb-4">Novo Usuário</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Nome</label>
                                <input
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                    placeholder="Nome completo"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Email</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                    placeholder="email@exemplo.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Senha</label>
                                <input
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                    placeholder="******"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Função</label>
                                    <select
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                    >
                                        <option value="COLLABORATOR">Colaborador</option>
                                        <option value="ADMIN">Administrador</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Equipe</label>
                                    <select
                                        value={newUser.teamId}
                                        onChange={(e) => setNewUser({ ...newUser, teamId: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                    >
                                        <option value="NONE">Sem Equipe</option>
                                        {teams.map(team => (
                                            <option key={team.id} value={team.id}>{team.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreate}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
                            >
                                Criar Usuário
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
