import { useState } from "react";
import { Task } from "@/types";
import { Calendar, AlertCircle, Pencil, Trash2, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TaskCardProps {
    task: Task;
    onQuickAction?: (task: Task) => void;
    onEdit?: (task: Task) => void;
    onDelete?: (taskId: number) => void;
}

export default function TaskCard({ task, onQuickAction, onEdit, onDelete }: TaskCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const dueDate = new Date(task.dueDate);
    const isOverdue = isPast(dueDate) && !isToday(dueDate) && task.status !== 'DONE';

    return (
        <div
            onClick={() => onEdit?.(task)}
            className={`
        group relative p-4 rounded-xl bg-card border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer h-full flex flex-col
        ${isOverdue
                    ? "border-destructive/50 hover:border-destructive shadow-[0_0_0_1px_rgba(239,68,68,0.2)]"
                    : "border-border hover:border-primary/50"
                }
      `}
        >
            {/* Overdue Glow/Indicator */}
            {isOverdue && (
                <div className="absolute top-3 right-3 animate-pulse text-destructive">
                    <AlertCircle size={18} />
                </div>
            )}

            {/* Task ID Indicator */}
            <div className="absolute top-3 left-3 text-[10px] font-mono text-muted-foreground/50">
                #{task.id}
            </div>

            <h3 className="font-semibold text-foreground pr-6 mt-4 mb-2 line-clamp-2">
                {task.title}
            </h3>

            {task.description && (
                <div className="mb-4 flex-1">
                    <p className="text-sm text-gray-400 leading-relaxed max-w-full break-words line-clamp-3">
                        {task.description}
                    </p>
                </div>
            )}

            <div className="mt-auto pt-2 flex items-center gap-1.5 flex-wrap w-full">
                {/* Date Tag */}
                <div
                    className={`
                        flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
                        ${isOverdue ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors"}
                    `}
                >
                    <Calendar size={14} />
                    <span>
                        {format(dueDate, "d 'de' MMM", { locale: ptBR })}
                    </span>
                </div>

                {/* Time Tag */}
                {task.estimatedTime && (
                    <div className={`
                        flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border
                        ${task.estimatedTime === 'Rápido' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}
                        ${task.estimatedTime === 'Mediano' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : ''}
                        ${task.estimatedTime === 'Demorado' ? 'bg-red-500/10 text-red-500 border-red-500/20' : ''}
                        ${!['Rápido', 'Mediano', 'Demorado'].includes(task.estimatedTime) ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ''}
                    `}>
                        <Clock size={12} />
                        {task.estimatedTime}
                    </div>
                )}

                {/* Responsible User Indicator */}
                {task.user && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/50 border border-border/50 text-xs text-muted-foreground max-w-[120px]" title={`Responsável: ${task.user.name || "Usuário"}`}>
                        <div className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[8px] font-bold border border-purple-500/30 shrink-0">
                            {task.user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <span className="truncate">{task.user.name?.split(' ')[0] || "Usuário"}</span>
                    </div>
                )}
            </div>

            {/* Quick Actions - Always visible on mobile (touch), hover on desktop */}
            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity ml-auto mt-3">
                {/* Edit */}
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit?.(task); }}
                    className="p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-md transition-colors"
                    title="Editar"
                >
                    <Pencil size={14} />
                </button>

                {/* Delete */}
                {onDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                        className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-colors"
                        title="Excluir"
                    >
                        <Trash2 size={14} />
                    </button>
                )}

                <div className="w-px h-3 bg-border mx-1" />

                {task.status !== 'DONE' && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onQuickAction?.(task); }}
                        title="Concluir"
                        className="p-1.5 hover:bg-green-500/10 text-muted-foreground hover:text-green-500 rounded-md transition-colors"
                    >
                        <div className="w-4 h-4 rounded-full border border-current" />
                    </button>
                )}
                {task.status === 'DONE' && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onQuickAction?.(task); }}
                        title="Reativar"
                        className="p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-md transition-colors"
                    >
                        <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center">
                            <div className="w-2 h-2 bg-current rounded-full" />
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
}
