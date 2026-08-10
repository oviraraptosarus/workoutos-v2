/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { XPService } from '@/lib/xpService';
export interface SubTask {
    id: string;
    title: string;
    completed: boolean;
}

export interface Task {
    id: string;
    title: string;
    full_title?: string;
    priority: 'low' | 'medium' | 'high' | 'none';
    category?: string;
    due_date?: string;
    due_time?: string;
    reminder_time?: string;
    completed: boolean;
    subTasks?: SubTask[];
    goal_id?: string;
}

interface TaskState {
    tasks: Task[];
    isLoading: boolean;
    fetchTasks: (date: string) => Promise<void>;
    addTask: (task: Omit<Task, 'id' | 'completed' | 'subTasks'> & { subtasks?: { title: string }[] }) => Promise<void>;
    toggleTask: (id: string) => Promise<void>;
    toggleSubTask: (taskId: string, subTaskId: string) => Promise<void>;
    setPriority: (id: string, priority: Task['priority']) => Promise<void>;
    setDueDate: (id: string, dueDate: string, dueTime?: string) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
    tasks: [],
    isLoading: false,

    fetchTasks: async (date: string) => {
        set({ isLoading: true });
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            set({ isLoading: false });
            return;
        }

        const { data } = await supabase.from('tasks').select('*').eq('user_id', user.id).eq('date', date);
        if (data) {
            set({
                tasks: data.map(d => ({
                    id: d.id,
                    title: d.title,
                    fullTitle: d.full_title || d.title,
                    description: d.description || '',
                    dueDate: d.due_date || '',
                    dueTime: d.due_time || '',
                    subTasks: d.subtasks || [],
                    completed: d.completed || false,
                    priority: d.priority || 'none'
                })),
                isLoading: false
            });
        } else {
            set({ isLoading: false });
        }
    },

    addTask: async (taskData) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const base = {
            user_id: user.id,
            date: new Date().toLocaleDateString('en-CA'),
            title: taskData.title,
            full_title: (taskData as any).full_title || taskData.title,
            due_date: (taskData as any).due_date,
            due_time: (taskData as any).due_time || null,
            subtasks: taskData.subtasks?.map(st => ({ id: Date.now().toString() + Math.random().toString(), title: st.title, completed: false })) || [],
            completed: false,
            priority: taskData.priority || 'none'
        };

        // Insert with priority; if the column isn't migrated yet (400), retry without it.
        let { data } = await supabase.from('tasks').insert(base).select().single();
        if (!data) {
            const fallbackBase = { ...base };
            delete (fallbackBase as any).priority;
            ({ data } = await supabase.from('tasks').insert(fallbackBase).select().single());
        }
        if (data) {
            const newTask: Task = {
                id: data.id,
                title: data.title,
                full_title: data.full_title || data.title,
                due_date: data.due_date || '',
                due_time: data.due_time || '',
                subTasks: data.subtasks || [],
                completed: data.completed,
                priority: data.priority || 'none'
            };
            set(state => ({ tasks: [newTask, ...state.tasks] }));
        }
    },

    toggleTask: async (id: string) => {
        const { tasks } = get();
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        // Optimistic update
        const previousTasks = tasks;
        set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
        }));

        const { error } = await supabase.from('tasks').update({ completed: !task.completed }).eq('id', id);
        if (error) {
            console.error("Failed to toggle task:", error);
            alert("Error updating task: " + error.message);
            set({ tasks: previousTasks }); // Rollback
        } else if (!task.completed) {
            // Task just completed! Award XP
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const isHighPriority = task.priority === 'high';
                await XPService.awardXP(
                    user.id,
                    'task_completed',
                    isHighPriority ? 10 : 5,
                    `task_complete_${id}`,
                    { taskId: id, priority: task.priority }
                );
            }
        }
    },

    toggleSubTask: async (taskId: string, subTaskId: string) => {
        const { tasks } = get();
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const updatedSubTasks = (task.subTasks || []).map((st: SubTask) => st.id === subTaskId ? { ...st, completed: !st.completed } : st);
        
        // Optimistic update
        const previousTasks = tasks;
        set(state => ({
            tasks: state.tasks.map(t => t.id === taskId ? { ...t, subTasks: updatedSubTasks } : t)
        }));
        
        const { error } = await supabase.from('tasks').update({ subtasks: updatedSubTasks }).eq('id', taskId);
        if (error) {
            console.error("Failed to toggle subtask:", error);
            alert("Error updating subtask: " + error.message);
            set({ tasks: previousTasks }); // Rollback
        }
    },

    setPriority: async (id: string, priority: Task['priority']) => {
        const previousTasks = get().tasks;
        set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, priority } : t)
        }));
        
        const { error } = await supabase.from('tasks').update({ priority }).eq('id', id);
        if (error) {
            console.error("Failed to update priority:", error);
            alert("Error updating priority: " + error.message);
            set({ tasks: previousTasks }); // Rollback
        } else {
            window.dispatchEvent(new Event('workout_os_tasks_updated'));
        }
    },

    setDueDate: async (id: string, dueDate: string, dueTime?: string) => {
        const previousTasks = get().tasks;
        set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, due_date: dueDate, due_time: dueTime || t.due_time } : t)
        }));
        
        const updateData: any = { due_date: dueDate };
        if (dueTime !== undefined) {
            updateData.due_time = dueTime;
        }
        
        const { error } = await supabase.from('tasks').update(updateData).eq('id', id);
        if (error) {
            console.error("Failed to update due date:", error);
            alert("Error updating due date: " + error.message);
            set({ tasks: previousTasks }); // Rollback
        } else {
            window.dispatchEvent(new Event('workout_os_tasks_updated'));
        }
    },

    deleteTask: async (id: string) => {
        const previousTasks = get().tasks;
        // Optimistic update
        set(state => ({
            tasks: state.tasks.filter(t => t.id !== id)
        }));
        
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) {
            console.error("Failed to delete task:", error);
            alert("Error deleting task: " + error.message);
            set({ tasks: previousTasks }); // Rollback
        }
    }
}));

