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
    recurrence_rule?: string;
    completed: boolean;
    subTasks?: SubTask[];
    goal_id?: string;
}

interface TaskState {
    tasks: Task[];
    upcomingReminders: Task[];
    isLoading: boolean;
    fetchTasks: (date: string) => Promise<void>;
    fetchUpcomingReminders: () => Promise<void>;
    addTask: (task: Omit<Task, 'id' | 'completed' | 'subTasks'> & { subtasks?: { title: string }[] }) => Promise<void>;
    toggleTask: (id: string) => Promise<void>;
    toggleSubTask: (taskId: string, subTaskId: string) => Promise<void>;
    setPriority: (id: string, priority: Task['priority']) => Promise<void>;
    setDueDate: (id: string, dueDate: string, dueTime?: string) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
    tasks: [],
    upcomingReminders: [],
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
                    reminder_time: d.reminder_time || '',
                    recurrence_rule: d.recurrence_rule || null,
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

    fetchUpcomingReminders: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const now = new Date().toISOString();
        const { data } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .eq('completed', false)
            .not('reminder_time', 'is', null)
            .gte('reminder_time', now)
            .order('reminder_time', { ascending: true });
            
        if (data) {
            set({
                upcomingReminders: data.map(d => ({
                    id: d.id,
                    title: d.title,
                    fullTitle: d.full_title || d.title,
                    description: d.description || '',
                    dueDate: d.due_date || '',
                    dueTime: d.due_time || '',
                    reminder_time: d.reminder_time || '',
                    subTasks: d.subtasks || [],
                    completed: d.completed || false,
                    priority: d.priority || 'none'
                }))
            });
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
            reminder_time: (taskData as any).reminder_time || null,
            recurrence_rule: (taskData as any).recurrenceRule || null,
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
                reminder_time: data.reminder_time || '',
                recurrence_rule: data.recurrence_rule || null,
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
            
            // Spawn next recurrence instance if applicable
            if (task.recurrence_rule) {
                const nextDate = new Date();
                if (task.recurrence_rule === 'daily') nextDate.setDate(nextDate.getDate() + 1);
                else if (task.recurrence_rule === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
                
                const nextReminderTime = task.reminder_time ? new Date(task.reminder_time) : null;
                if (nextReminderTime) {
                    if (task.recurrence_rule === 'daily') nextReminderTime.setDate(nextReminderTime.getDate() + 1);
                    else if (task.recurrence_rule === 'weekly') nextReminderTime.setDate(nextReminderTime.getDate() + 7);
                }

                await get().addTask({
                    title: task.title,
                    priority: task.priority,
                    category: task.category,
                    ...(nextReminderTime ? { reminder_time: nextReminderTime.toISOString() } as any : {}),
                    ...(task.due_date ? { due_date: nextDate.toLocaleDateString('en-CA') } as any : {}),
                    ...(task.due_time ? { due_time: task.due_time } as any : {}),
                    ...(task.recurrence_rule ? { recurrenceRule: task.recurrence_rule } as any : {})
                });
            }

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

