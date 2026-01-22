"use client";

import { useState, useEffect } from "react";
import TeamManager from "@/components/admin/TeamManager";
import UserList from "@/components/admin/UserList";
import { Users } from "lucide-react";

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [usersRes, teamsRes] = await Promise.all([
                fetch("/api/admin/users"),
                fetch("/api/admin/teams")
            ]);

            if (usersRes.status === 401 || teamsRes.status === 401) {
                window.location.href = "/"; // Redirect non-admins
                return;
            }

            if (usersRes.ok && teamsRes.ok) {
                const usersData = await usersRes.json();
                const teamsData = await teamsRes.json();
                setUsers(usersData);
                setTeams(teamsData);
            }
        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Carregando dados...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto py-8 space-y-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <Users size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Gestão de Equipe</h1>
                    <p className="text-muted-foreground">Gerencie usuários, funções e equipes do sistema.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Team Manager - Sidebar style on large screens */}
                <div className="lg:col-span-1">
                    <TeamManager teams={teams} onTeamChange={fetchData} />
                </div>

                {/* User List - Main content area */}
                <div className="lg:col-span-2">
                    <UserList users={users} teams={teams} onDataChange={fetchData} />
                </div>
            </div>
        </div>
    );
}
