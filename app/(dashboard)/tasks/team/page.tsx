"use client";

import { useState, useEffect } from "react";
import TaskBoard from "@/components/TaskBoard";
import CreateTaskModal from "@/components/CreateTaskModal";
import { Task } from "@/types";
import { Users } from "lucide-react";

export default function TeamTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // Fetch Team Tasks
    const fetchTasks = async () => {
        try {
            const res = await fetch("/api/tasks?filter=team");
            const data = await res.json();
            setTasks(data);
        } catch (error) {
            console.error("Error fetching team tasks:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleSaveTask = async (taskData: any) => {
        // Only updates allowed here for now (since creation is usually personal, but maybe admin can create for team?)
        // Assuming update for existing tasks:
        const method = editingTask ? "PUT" : "POST";
        const body = editingTask ? { ...taskData, id: editingTask.id } : taskData;

        try {
            const res = await fetch("/api/tasks", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                fetchTasks(); // Refresh list
                setIsModalOpen(false);
                setEditingTask(null);
            }
        } catch (error) {
            console.error("Error saving task:", error);
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!confirm("Tem certeza? Esta tarefa pertence à equipe.")) return;
        // Optimistic delete
        setTasks(tasks.filter(t => t.id !== taskId));

        try {
            await fetch(`/api/tasks?id=${taskId}`, { method: "DELETE" });
        } catch (error) {
            console.error("Error deleting task:", error);
            fetchTasks();
        }
    };

    const handleTaskMove = async (taskId: number, newStatus: any) => {
        // Optimistic
        const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
        setTasks(updatedTasks);

        try {
            await fetch("/api/tasks", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: taskId, status: newStatus }),
            });
        } catch (error) {
            console.error("Failed to move task:", error);
            fetchTasks();
        }
    };

    const handleQuickAction = async (task: Task) => {
        const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
        handleTaskMove(task.id, newStatus);
    };


    const [selectedUser, setSelectedUser] = useState<string>("ALL");

    // Extract unique users from tasks
    const uniqueUsers = Array.from(new Set(tasks.map(t => t.user?.id).filter(Boolean))).map(id => {
        return tasks.find(t => t.user?.id === id)?.user;
    }).filter(Boolean);

    // Filtered Tasks
    const filteredTasks = selectedUser === "ALL"
        ? tasks
        : tasks.filter(t => t.user?.id === selectedUser);

    return (
        <div className="h-full flex flex-col">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <Users size={20} />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                            Tarefas da Equipe
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm md:text-base">
                        Visualize o que sua equipe está trabalhando.
                    </p>
                </div>

                {/* Filter Dropdown */}
                <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground hidden md:inline">Filtrar por:</span>
                    <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="bg-card border border-border text-foreground text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 min-w-[200px]"
                    >
                        <option value="ALL">Todos da Equipe</option>
                        {uniqueUsers.map(user => (
                            <option key={user?.id} value={user?.id}>
                                {user?.name || "Usuário"}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <TaskBoard
                tasks={filteredTasks}
                onTaskMove={handleTaskMove}
                onQuickAction={handleQuickAction}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
            />

            {/* Edit/Create Modal */}
            <CreateTaskModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
                onSave={handleSaveTask}
                taskToEdit={editingTask}
                startWithMagic={false}
            />
        </div>
    );
}
