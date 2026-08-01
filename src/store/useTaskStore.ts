import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';
import { Task, SubTask } from '@/app/planner/page';

interface TaskState {
    tasks: Task[];
    isLoading: boolean;
    fetchTasks: (date: string) => Promise<void>;
    addTask: (task: Omit<Task, 'id' | 'completed' | 'subTasks'> & { subtasks?: { title: string }[] }) => Promise<void>;
    toggleTask: (id: string) => Promise<void>;
    toggleSubTask: (taskId: string, subTaskId: string) => Promise<void>;
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
                    description: d.description || '',
                    dueDate: d.due_date || '',
                    subTasks: d.subtasks || [],
                    completed: d.completed || false
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

        const newTaskObj = {
            user_id: user.id,
            date: new Date().toISOString().split('T')[0],
            title: taskData.title,
            description: taskData.description,
            due_date: taskData.dueDate,
            subtasks: taskData.subtasks?.map(st => ({ id: Date.now().toString() + Math.random().toString(), title: st.title, completed: false })) || [],
            completed: false
        };

        const { data } = await supabase.from('tasks').insert(newTaskObj).select().single();
        if (data) {
            const newTask: Task = {
                id: data.id,
                title: data.title,
                description: data.description || '',
                dueDate: data.due_date || '',
                subTasks: data.subtasks || [],
                completed: data.completed
            };
            set(state => ({ tasks: [newTask, ...state.tasks] }));
        }
    },

    toggleTask: async (id: string) => {
        const { tasks } = get();
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        // Optimistic update
        set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
        }));

        await supabase.from('tasks').update({ completed: !task.completed }).eq('id', id);
    },

    toggleSubTask: async (taskId: string, subTaskId: string) => {
        const { tasks } = get();
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const updatedSubTasks = task.subTasks.map(st => st.id === subTaskId ? { ...st, completed: !st.completed } : st);
        
        // Optimistic update
        set(state => ({
            tasks: state.tasks.map(t => t.id === taskId ? { ...t, subTasks: updatedSubTasks } : t)
        }));
        
        await supabase.from('tasks').update({ subtasks: updatedSubTasks }).eq('id', taskId);
    },

    deleteTask: async (id: string) => {
        // Optimistic update
        set(state => ({
            tasks: state.tasks.filter(t => t.id !== id)
        }));
        await supabase.from('tasks').delete().eq('id', id);
    }
}));
