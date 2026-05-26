import { useState, useEffect, useMemo, useRef, type ChangeEvent, type Dispatch, type SetStateAction } from 'react';
import { Check, ChevronRight, ChevronLeft, Calendar, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { z } from 'zod';

type TaskCategory = 'content' | 'fitness' | 'study' | 'website' | 'organization' | 'appointments' | 'finances';

type TaskTag = string;

const AVAILABLE_TAGS: TaskTag[] = ['imprevistos', 'cozinhar', 'mercado'];

interface Task {
  id: string;
  label: string;
  category: TaskCategory;
  tags?: TaskTag[];
  completed: boolean;
  completedOnDay?: number; // Dia em que foi realmente feita (0-6)
  originalDay: number; // Dia original planejado
  time?: string;
}

interface DaySchedule {
  day: string;
  dayName: string;
  dayIndex: number;
  tasks: Task[];
}

interface WeekData {
  week: number;
  schedule: DaySchedule[];
  completedCount: number;
  totalTasks: number;
}

const TaskSchema = z.object({
  id: z.string(),
  label: z.string(),
  category: z.enum(['content', 'fitness', 'study', 'website', 'organization', 'appointments', 'finances']),
  tags: z.array(z.string()).optional(),
  completed: z.union([z.boolean(), z.string(), z.number()]),
  completedOnDay: z.union([z.number().int().min(0).max(6), z.string()]).optional(),
  originalDay: z.number().int().min(0).max(6).optional(),
  time: z.string().optional(),
});

const DayScheduleSchema = z.object({
  day: z.string(),
  dayName: z.string(),
  dayIndex: z.number().int().min(0).max(6),
  tasks: z.array(TaskSchema),
});

const WeekDataSchema = z.object({
  week: z.number().int().min(1),
  schedule: z.array(DayScheduleSchema),
  completedCount: z.number().int().min(0).optional(),
  totalTasks: z.number().int().min(0).optional(),
});

const WeekDataArraySchema = z.array(WeekDataSchema);

const DAYS_OF_WEEK = [
  { day: 'domingo', dayName: 'Domingo', index: 0 },
  { day: 'segunda', dayName: 'Segunda-feira', index: 1 },
  { day: 'terca', dayName: 'Terça-feira', index: 2 },
  { day: 'quarta', dayName: 'Quarta-feira', index: 3 },
  { day: 'quinta', dayName: 'Quinta-feira', index: 4 },
  { day: 'sexta', dayName: 'Sexta-feira', index: 5 },
  { day: 'sabado', dayName: 'Sábado', index: 6 },
];

const INITIAL_SCHEDULE: DaySchedule[] = [
  {
    day: 'domingo',
    dayName: 'Domingo',
    dayIndex: 0,
    tasks: [
      { id: 'dom-1', label: 'Cozinhar base da semana', category: 'organization', completed: false, originalDay: 0, time: '10:00 - 13:00' },
      { id: 'dom-2', label: 'Planejamento leve', category: 'organization', completed: false, originalDay: 0, time: '15:00 - 16:00' },
    ],
  },
  {
    day: 'segunda',
    dayName: 'Segunda-feira',
    dayIndex: 1,
    tasks: [
      { id: 'seg-1', label: 'Criar conteúdo (Post 1)', category: 'content', completed: false, originalDay: 1, time: '09:00 - 12:00' },
      { id: 'seg-2', label: 'Postar conteúdo + Stories', category: 'content', completed: false, originalDay: 1, time: '12:00 - 13:00' },
      { id: 'seg-3', label: 'Avanço no site', category: 'website', completed: false, originalDay: 1, time: '14:00 - 18:00' },
      { id: 'seg-4', label: 'Lavar e estender roupas', category: 'organization', completed: false, originalDay: 1, time: '19:00 - 20:00' },
    ],
  },
  {
    day: 'terca',
    dayName: 'Terça-feira',
    dayIndex: 2,
    tasks: [
      { id: 'ter-1', label: 'Trabalho', category: 'appointments', completed: false, originalDay: 2, time: '09:00 - 19:00' },
      { id: 'ter-2', label: 'Academia', category: 'fitness', completed: false, originalDay: 2, time: '19:00 - 20:00' },
    ],
  },
  {
    day: 'quarta',
    dayName: 'Quarta-feira',
    dayIndex: 3,
    tasks: [
      { id: 'qua-1', label: 'Trabalho', category: 'appointments', completed: false, originalDay: 3, time: '09:00 - 19:00' },
      { id: 'qua-2', label: 'Estudo leve (Mestrado/Jung)', category: 'study', completed: false, originalDay: 3, time: '20:00 - 21:00' },
    ],
  },
  {
    day: 'quinta',
    dayName: 'Quinta-feira',
    dayIndex: 4,
    tasks: [
      { id: 'qui-1', label: 'Trabalho', category: 'appointments', completed: false, originalDay: 4, time: '09:00 - 19:00' },
      { id: 'qui-2', label: 'Academia', category: 'fitness', completed: false, originalDay: 4, time: '19:00 - 20:00' },
    ],
  },
  {
    day: 'sexta',
    dayName: 'Sexta-feira',
    dayIndex: 5,
    tasks: [
      { id: 'sex-1', label: 'Trabalho', category: 'appointments', completed: false, originalDay: 5, time: '09:00 - 19:00' },
      { id: 'sex-2', label: 'Estudo (Mestrado/Jung)', category: 'study', completed: false, originalDay: 5, time: '20:00 - 21:00' },
    ],
  },
  {
    day: 'sabado',
    dayName: 'Sábado',
    dayIndex: 6,
    tasks: [
      { id: 'sab-1', label: 'Trabalho', category: 'appointments', completed: false, originalDay: 6, time: '09:00 - 19:00' },
      { id: 'sab-2', label: 'Descanso leve', category: 'organization', completed: false, originalDay: 6, time: '19:00 - 21:00' },
    ],
  },
];

const MINIMAL_GUIDE_SCHEDULE: DaySchedule[] = [
  {
    day: 'domingo',
    dayName: 'Domingo',
    dayIndex: 0,
    tasks: [
      { id: 'dom-1', label: 'Cozinhar base da semana', category: 'organization', completed: false, originalDay: 0, time: '10:00 - 13:00' },
      { id: 'dom-2', label: 'Planejamento leve', category: 'organization', completed: false, originalDay: 0, time: '15:00 - 16:00' },
    ],
  },
  {
    day: 'segunda',
    dayName: 'Segunda-feira',
    dayIndex: 1,
    tasks: [
      { id: 'seg-1', label: 'Stories Instagram', category: 'content', completed: false, originalDay: 1, time: '09:00 - 12:00' },
      { id: 'seg-2', label: 'Desenvolvimento do site', category: 'website', completed: false, originalDay: 1, time: '12:00 - 15:00' },
    ],
  },
  {
    day: 'terca',
    dayName: 'Terça-feira',
    dayIndex: 2,
    tasks: [
      { id: 'ter-1', label: 'Trabalho', category: 'appointments', completed: false, originalDay: 2, time: '09:00 - 19:00' },
      { id: 'ter-2', label: 'Academia', category: 'fitness', completed: false, originalDay: 2, time: '19:00 - 20:00' },
    ],
  },
  {
    day: 'quarta',
    dayName: 'Quarta-feira',
    dayIndex: 3,
    tasks: [
      { id: 'qua-1', label: 'Trabalho', category: 'appointments', completed: false, originalDay: 3, time: '09:00 - 19:00' },
      { id: 'qua-2', label: 'Leitura: Em Busca de Sentido (Viktor Frankl)', category: 'study', completed: false, originalDay: 3, time: '20:00 - 21:00' },
    ],
  },
  {
    day: 'quinta',
    dayName: 'Quinta-feira',
    dayIndex: 4,
    tasks: [
      { id: 'qui-1', label: 'Trabalho', category: 'appointments', completed: false, originalDay: 4, time: '09:00 - 19:00' },
      { id: 'qui-2', label: 'Academia', category: 'fitness', completed: false, originalDay: 4, time: '20:00 - 21:00' },
    ],
  },
  {
    day: 'sexta',
    dayName: 'Sexta-feira',
    dayIndex: 5,
    tasks: [
      { id: 'sex-1', label: 'Trabalho', category: 'appointments', completed: false, originalDay: 5, time: '09:00 - 19:00' },
      { id: 'sex-2', label: 'Leitura: Em Busca de Sentido (Viktor Frankl)', category: 'study', completed: false, originalDay: 5, time: '20:00 - 21:00' },
    ],
  },
  {
    day: 'sabado',
    dayName: 'Sábado',
    dayIndex: 6,
    tasks: [
      { id: 'sab-1', label: 'Trabalho', category: 'appointments', completed: false, originalDay: 6, time: '09:00 - 19:00' },
    ],
  },
];

const buildWeekSchedule = (week: number) => {
  return week >= 4
    ? MINIMAL_GUIDE_SCHEDULE.map(day => ({
        ...day,
        tasks: day.tasks.map(task => ({ ...task, completed: false, completedOnDay: undefined })),
      }))
    : INITIAL_SCHEDULE.map(day => ({
        ...day,
        tasks: day.tasks.map(task => ({ ...task, completed: false, completedOnDay: undefined })),
      }));
};

const normalizeWeekData = (week: any): WeekData => {
  const weekNumber = typeof week?.week === 'number' ? week.week : 1;

  const schedule = Array.isArray(week?.schedule) && week.schedule.length > 0
    ? week.schedule.map((day: any, index: number) => ({
        day: typeof day?.day === 'string' ? day.day : DAYS_OF_WEEK[index]?.day ?? `dia-${index}`,
        dayName: typeof day?.dayName === 'string' ? day.dayName : DAYS_OF_WEEK[index]?.dayName ?? 'Dia',
        dayIndex: typeof day?.dayIndex === 'number' ? day.dayIndex : index,
        tasks: Array.isArray(day?.tasks) ? day.tasks.map((task: any, taskIndex: number) => ({
          id: typeof task?.id === 'string' ? task.id : `task-${weekNumber}-${index}-${taskIndex}`,
          label: typeof task?.label === 'string' ? task.label : '',
          category: ['content','fitness','study','website','organization','appointments','finances'].includes(task?.category)
            ? task.category
            : 'organization',
          tags: Array.isArray(task?.tags) ? task.tags.filter((tag: any) => typeof tag === 'string') as TaskTag[] : [],
          completed: task?.completed === true || task?.completed === 'true' || task?.completed === 1 || task?.completed === '1',
          completedOnDay: typeof task?.completedOnDay === 'number'
            ? task.completedOnDay
            : (typeof task?.completedOnDay === 'string' && /^[0-6]$/.test(task.completedOnDay) ? Number(task.completedOnDay) : undefined),
          originalDay: typeof task?.originalDay === 'number'
            ? task.originalDay
            : (typeof day?.dayIndex === 'number' ? day.dayIndex : index),
          time: typeof task?.time === 'string' ? task.time : undefined,
        })) : [] } ))
    : buildWeekSchedule(weekNumber);

  const totalTasks = schedule.reduce((sum, day) => sum + day.tasks.length, 0);
  const completedCount = schedule.reduce((sum, day) => sum + day.tasks.filter(t => t.completed).length, 0);

  return {
    week: weekNumber,
    schedule,
    completedCount,
    totalTasks,
  };
};

function useWeekStorage(
  allWeeks: WeekData[],
  setAllWeeks: Dispatch<SetStateAction<WeekData[]>>,
  setWeekData: Dispatch<SetStateAction<WeekData>>,
  setCurrentWeek: Dispatch<SetStateAction<number>>
) {
  useEffect(() => {
    try {
      const saved = localStorage.getItem('weekTrackerData');
      if (!saved) return;

      const parsed = JSON.parse(saved);
      const validation = WeekDataArraySchema.safeParse(parsed);
      if (!validation.success) {
        console.warn('Dados de weekTrackerData inválidos no localStorage:', validation.error.format());
        return;
      }

      const cleanedData = validation.data.map(normalizeWeekData);
      if (cleanedData.length > 0) {
        const last = cleanedData[cleanedData.length - 1];
        setAllWeeks(cleanedData);
        setWeekData(last);
        setCurrentWeek(last.week);
      }
    } catch (err) {
      console.warn('Erro ao carregar dados do localStorage:', err);
    }
  }, [setAllWeeks, setWeekData, setCurrentWeek]);

  useEffect(() => {
    try {
      const key = 'weekTrackerData';
      const prev = localStorage.getItem(key);
      const newVal = JSON.stringify(allWeeks);
      if (prev && prev !== newVal) {
        try {
          const backupsKey = 'weekTrackerData_backups';
          const backupsRaw = localStorage.getItem(backupsKey);
          let backups: string[] = backupsRaw ? JSON.parse(backupsRaw) : [];
          const timestamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
          const backupKey = `${key}_backup_${timestamp}`;
          localStorage.setItem(backupKey, prev);
          backups.unshift(backupKey);
          backups = backups.slice(0, 5);
          localStorage.setItem(backupsKey, JSON.stringify(backups));
        } catch (e) {
          // ignore backup failures
        }
      }
      localStorage.setItem(key, newVal);
    } catch (e) {
      console.warn('Erro ao salvar dados no localStorage:', e);
    }
  }, [allWeeks]);
}

export default function Home() {
  const [currentWeek, setCurrentWeek] = useState(1);
  const [weekData, setWeekData] = useState<WeekData>({
    week: 1,
    schedule: INITIAL_SCHEDULE,
    completedCount: 0,
    totalTasks: INITIAL_SCHEDULE.reduce((sum, day) => sum + day.tasks.length, 0),
  });

  const [allWeeks, setAllWeeks] = useState<WeekData[]>([
    {
      week: 1,
      schedule: INITIAL_SCHEDULE,
      completedCount: 0,
      totalTasks: INITIAL_SCHEDULE.reduce((sum, day) => sum + day.tasks.length, 0),
    },
  ]);

  const [draggedTask, setDraggedTask] = useState<{ dayIndex: number; taskId: string } | null>(null);
  const [editingTask, setEditingTask] = useState<{ dayIndex: number; taskId: string } | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editTime, setEditTime] = useState('');
  const [addingTaskDay, setAddingTaskDay] = useState<number | null>(null);
  const [newTaskLabel, setNewTaskLabel] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('organization');
  const [selectingCompletionDay, setSelectingCompletionDay] = useState<{ dayIndex: number; taskId: string } | null>(null);
  const [selectedTagFilters, setSelectedTagFilters] = useState<TaskTag[]>([]);
  const [newTaskTags, setNewTaskTags] = useState<TaskTag[]>([]);
  const [editTags, setEditTags] = useState<TaskTag[]>([]);
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  // Carregar dados do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('weekTrackerData');
      if (!saved) return;

      const parsed = JSON.parse(saved);
      const validation = WeekDataArraySchema.safeParse(parsed);
      if (!validation.success) {
        console.warn('Dados de weekTrackerData inválidos no localStorage:', validation.error.format());
        return;
      }

      const cleanedData = validation.data.map(normalizeWeekData);
      if (cleanedData.length > 0) {
        const last = cleanedData[cleanedData.length - 1];
        setAllWeeks(cleanedData);
        setWeekData(last);
        setCurrentWeek(last.week);
      }
    } catch (err) {
      console.warn('Erro ao carregar dados do localStorage:', err);
    }
  }, []);

  // Salvar dados no localStorage
  useEffect(() => {
    try {
      const key = 'weekTrackerData';
      const prev = localStorage.getItem(key);
      const newVal = JSON.stringify(allWeeks);
      if (prev && prev !== newVal) {
        try {
          const backupsKey = 'weekTrackerData_backups';
          const backupsRaw = localStorage.getItem(backupsKey);
          let backups: string[] = backupsRaw ? JSON.parse(backupsRaw) : [];
          const timestamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
          const backupKey = `${key}_backup_${timestamp}`;
          localStorage.setItem(backupKey, prev);
          backups.unshift(backupKey);
          // keep last 5 backups
          backups = backups.slice(0, 5);
          localStorage.setItem(backupsKey, JSON.stringify(backups));
        } catch (e) {
          // ignore backup failures
        }
      }
      localStorage.setItem(key, newVal);
    } catch (e) {
      // ignore localStorage failures
    }
  }, [allWeeks]);

  const toggleTask = (dayIndex: number, taskId: string) => {
    const task = weekData.schedule[dayIndex].tasks.find(t => t.id === taskId);
    if (!task) return;

    if (!task.completed) {
      // Se vai marcar como completa no mesmo dia planejado, marca direto
      const updatedSchedule = weekData.schedule.map((day) => {
        if (day.dayIndex === dayIndex) {
          return {
            ...day,
            tasks: day.tasks.map(t =>
              t.id === taskId ? { ...t, completed: true, completedOnDay: dayIndex } : t
            ),
          };
        }
        return day;
      });

      const completedCount = updatedSchedule.reduce(
        (sum, day) => sum + day.tasks.filter(t => t.completed).length,
        0
      );

      const updated = { ...weekData, schedule: updatedSchedule, completedCount };
      setWeekData(updated);

      const newAllWeeks = allWeeks.map(w => w.week === currentWeek ? updated : w);
      setAllWeeks(newAllWeeks);
    } else {
      // Se vai desmarcar, apenas desmarcar
      const updatedSchedule = weekData.schedule.map((day) => {
        if (day.dayIndex === dayIndex) {
          return {
            ...day,
            tasks: day.tasks.map(t =>
              t.id === taskId ? { ...t, completed: false, completedOnDay: undefined } : t
            ),
          };
        }
        return day;
      });

      const completedCount = updatedSchedule.reduce(
        (sum, day) => sum + day.tasks.filter(t => t.completed).length,
        0
      );

      const updated = { ...weekData, schedule: updatedSchedule, completedCount };
      setWeekData(updated);

      const newAllWeeks = allWeeks.map(w => w.week === currentWeek ? updated : w);
      setAllWeeks(newAllWeeks);
    }
  };

  const completeTaskOnDay = (completionDayIndex: number) => {
    if (!selectingCompletionDay) return;

    const updatedSchedule = weekData.schedule.map((day) => {
      if (day.dayIndex === selectingCompletionDay.dayIndex) {
        return {
          ...day,
          tasks: day.tasks.map(t =>
            t.id === selectingCompletionDay.taskId
              ? { ...t, completed: true, completedOnDay: completionDayIndex }
              : t
          ),
        };
      }
      return day;
    });

    const completedCount = updatedSchedule.reduce(
      (sum, day) => sum + day.tasks.filter(t => t.completed).length,
      0
    );

    const updated = { ...weekData, schedule: updatedSchedule, completedCount };
    setWeekData(updated);

    const newAllWeeks = allWeeks.map(w => w.week === currentWeek ? updated : w);
    setAllWeeks(newAllWeeks);
    setSelectingCompletionDay(null);
  };

  const deleteTask = (dayIndex: number, taskId: string) => {
    const updatedSchedule = weekData.schedule.map((day) => {
      if (day.dayIndex === dayIndex) {
        return {
          ...day,
          tasks: day.tasks.filter(task => task.id !== taskId),
        };
      }
      return day;
    });

    const completedCount = updatedSchedule.reduce(
      (sum, day) => sum + day.tasks.filter(t => t.completed).length,
      0
    );

    const totalTasks = updatedSchedule.reduce((sum, day) => sum + day.tasks.length, 0);
    const updated = { ...weekData, schedule: updatedSchedule, completedCount, totalTasks };
    setWeekData(updated);

    const newAllWeeks = allWeeks.map(w => w.week === currentWeek ? updated : w);
    setAllWeeks(newAllWeeks);
  };

  const startEditTask = (dayIndex: number, taskId: string) => {
    const task = weekData.schedule[dayIndex].tasks.find(t => t.id === taskId);
    if (task) {
      setEditingTask({ dayIndex, taskId });
      setEditLabel(task.label);
      setEditTime(task.time || '');
      setEditTags(task.tags ?? []);
    }
  };

  const saveEditTask = () => {
    if (!editingTask) return;

    const updatedSchedule = weekData.schedule.map((day) => {
      if (day.dayIndex === editingTask.dayIndex) {
        return {
          ...day,
          tasks: day.tasks.map(task =>
            task.id === editingTask.taskId
              ? {
                  ...task,
                  label: editLabel,
                  time: editTime,
                  tags: editTags,
                }
              : task
          ),
        };
      }
      return day;
    });

    const updated = { ...weekData, schedule: updatedSchedule };
    setWeekData(updated);

    const newAllWeeks = allWeeks.map(w => w.week === currentWeek ? updated : w);
    setAllWeeks(newAllWeeks);
    setEditingTask(null);
  };

  const addTaskToDay = (dayIndex: number) => {
    if (!newTaskLabel.trim()) return;

    const updatedSchedule = weekData.schedule.map((day) => {
      if (day.dayIndex === dayIndex) {
        const newTask: Task = {
          id: `task-${Date.now()}`,
          label: newTaskLabel,
          category: newTaskCategory,
          tags: newTaskTags,
          completed: false,
          originalDay: dayIndex,
          time: newTaskTime || undefined,
        };
        return {
          ...day,
          tasks: [...day.tasks, newTask],
        };
      }
      return day;
    });

    const totalTasks = updatedSchedule.reduce((sum, day) => sum + day.tasks.length, 0);
    const updated = { ...weekData, schedule: updatedSchedule, totalTasks };
    setWeekData(updated);

    const newAllWeeks = allWeeks.map(w => w.week === currentWeek ? updated : w);
    setAllWeeks(newAllWeeks);

    setAddingTaskDay(null);
    setNewTaskLabel('');
    setNewTaskTime('');
    setNewTaskCategory('organization');
    setNewTaskTags([]);
  };

  const handleDragStart = (dayIndex: number, taskId: string) => {
    setDraggedTask({ dayIndex, taskId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetDayIndex: number, targetTaskId?: string, e?: React.DragEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!draggedTask) return;

    const sourceDay = weekData.schedule.find(day => day.dayIndex === draggedTask.dayIndex);
    const targetDay = weekData.schedule.find(day => day.dayIndex === targetDayIndex);
    if (!sourceDay || !targetDay) {
      setDraggedTask(null);
      return;
    }

    const task = sourceDay.tasks.find(t => t.id === draggedTask.taskId);
    if (!task) {
      setDraggedTask(null);
      return;
    }

    const sourceTasks = sourceDay.tasks.filter(t => t.id !== draggedTask.taskId);
    const targetTasks = targetDay.tasks.filter(t => t.id !== draggedTask.taskId);
    let newTargetTasks = [...targetTasks];

    if (targetTaskId) {
      const insertIndex = targetTasks.findIndex(t => t.id === targetTaskId);
      if (insertIndex >= 0) {
        newTargetTasks = [
          ...targetTasks.slice(0, insertIndex),
          task,
          ...targetTasks.slice(insertIndex),
        ];
      } else {
        newTargetTasks.push(task);
      }
    } else {
      newTargetTasks.push(task);
    }

    const updatedSchedule = weekData.schedule.map((day) => {
      if (day.dayIndex === draggedTask.dayIndex) {
        return { ...day, tasks: sourceTasks };
      }
      if (day.dayIndex === targetDayIndex) {
        return { ...day, tasks: newTargetTasks };
      }
      return day;
    });

    const completedCount = updatedSchedule.reduce(
      (sum, day) => sum + day.tasks.filter(t => t.completed).length,
      0
    );

    const updated = { ...weekData, schedule: updatedSchedule, completedCount };
    setWeekData(updated);

    const newAllWeeks = allWeeks.map(w => w.week === currentWeek ? updated : w);
    setAllWeeks(newAllWeeks);
    setDraggedTask(null);
  };

  const progressPercentage = weekData.totalTasks > 0 ? Math.round((weekData.completedCount / weekData.totalTasks) * 100) : 0;

  const getProgressColor = () => {
    if (progressPercentage >= 80) return 'from-[#C8A75B] to-[#2F5DA8]';
    if (progressPercentage >= 60) return 'from-[#2F5DA8] to-[#1E3A6D]';
    if (progressPercentage >= 40) return 'from-[#1E3A6D] to-[#0F1C2E]';
    return 'from-[#E8DCC8] to-[#1E3A6D]';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      content: 'bg-blue-100 text-[#1E3A6D]',
      fitness: 'bg-emerald-100 text-emerald-700',
      study: 'bg-purple-100 text-purple-700',
      website: 'bg-orange-100 text-orange-700',
      organization: 'bg-rose-100 text-rose-700',
      appointments: 'bg-indigo-100 text-indigo-700',
      finances: 'bg-teal-100 text-teal-700',
      imprevistos: 'bg-yellow-100 text-yellow-800',
      cozinhar: 'bg-pink-100 text-pink-700',
      mercado: 'bg-lime-100 text-lime-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      content: 'Conteúdo',
      fitness: 'Academia',
      study: 'Estudos',
      website: 'Site',
      organization: 'Organização',
      appointments: 'Trabalho',
      finances: 'Finanças',
      imprevistos: 'Imprevisto',
      cozinhar: 'Cozinhar',
      mercado: 'Mercado',
    };
    return labels[category] || category;
  };

  const allAvailableTags = useMemo(() => {
    const tags = new Set<TaskTag>(AVAILABLE_TAGS);
    allWeeks.forEach((week) =>
      week.schedule.forEach((day) =>
        day.tasks.forEach((task) => task.tags?.forEach((tag) => tags.add(tag)))
      )
    );
    return Array.from(tags).sort((a, b) => a.localeCompare(b, 'pt', { sensitivity: 'base' }));
  }, [allWeeks]);

  const nextWeek = () => {
    const newWeek = currentWeek + 1;
    const newSchedule = buildWeekSchedule(newWeek);
    const newWeekData: WeekData = {
      week: newWeek,
      schedule: newSchedule,
      completedCount: 0,
      totalTasks: newSchedule.reduce((sum, day) => sum + day.tasks.length, 0),
    };
    setAllWeeks([...allWeeks, newWeekData]);
    setWeekData(newWeekData);
    setCurrentWeek(newWeek);
  };

  const previousWeek = () => {
    if (currentWeek > 1) {
      const prev = allWeeks.find(w => w.week === currentWeek - 1);
      if (prev) {
        setWeekData(prev);
        setCurrentWeek(currentWeek - 1);
      }
    }
  };

  const toggleTagFilter = (tag: TaskTag) => {
    setSelectedTagFilters((prev) =>
      prev.includes(tag) ? prev.filter((selected) => selected !== tag) : [...prev, tag]
    );
  };

  const displayedSchedule = useMemo(
    () =>
      weekData.schedule.map((day) => ({
        ...day,
        tasks: day.tasks.filter((task) =>
          selectedTagFilters.length === 0 || task.tags?.some((tag) => selectedTagFilters.includes(tag))
        ),
      })),
    [weekData.schedule, selectedTagFilters]
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleFileImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    if (!target.files || target.files.length === 0) return;
    const file = target.files[0];

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const validation = WeekDataArraySchema.safeParse(parsed);
      if (!validation.success) {
        throw new Error('Formato inválido: ' + JSON.stringify(validation.error.format(), null, 2));
      }

      const normalized = validation.data.map(normalizeWeekData);
      if (normalized.length === 0) {
        throw new Error('Nenhuma semana encontrada no arquivo importado');
      }

      const last = normalized[normalized.length - 1];
      setAllWeeks(normalized);
      setWeekData(last);
      setCurrentWeek(last.week);
      localStorage.setItem('weekTrackerData', JSON.stringify(normalized));
      alert('Dados importados com sucesso');
    } catch (err) {
      alert('Erro ao importar: ' + String(err));
    } finally {
      target.value = '';
    }
  };


  return (
    <div className="min-h-screen bg-[#F5F1E8] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Modal de seleção de dia de conclusão */}
        {selectingCompletionDay && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-white p-6 max-w-md w-full">
              <h3 style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl font-semibold text-[#0F1C2E] mb-4">
                Em qual dia você fez essa tarefa?
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.index}
                    onClick={() => completeTaskOnDay(day.index)}
                    className="p-3 rounded-lg border-2 border-[#1E3A6D] text-[#1E3A6D] hover:bg-[#1E3A6D] hover:text-white transition-all"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  >
                    {day.dayName.split('-')[0]}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSelectingCompletionDay(null)}
                className="w-full mt-4 p-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                Cancelar
              </button>
            </Card>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-5xl font-bold text-[#0F1C2E]">
                Semana {currentWeek}
              </h1>

              <div className="mt-3 flex items-center gap-2">
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={handleFileImport}
                />

                <button
                  id="export-button"
                  onClick={() => {
                    try {
                      const dataStr = JSON.stringify(allWeeks, null, 2);
                      const blob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      const date = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
                      a.download = `weekTrackerData-${date}.json`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                    } catch (err) {
                      alert('Erro ao exportar dados: ' + String(err));
                    }
                  }}
                  style={{
                    fontFamily: "'Lato', sans-serif",
                    padding: '8px 12px',
                    border: '1px solid transparent',
                    borderRadius: 8,
                    background: '#1E3A6D',
                    color: '#FFFFFF',
                    fontSize: '0.95rem',
                    boxShadow: '0 1px 0 rgba(0,0,0,0.04)'
                  }}
                >
                  Exportar
                </button>

                <button
                  id="import-button"
                  onClick={() => {
                    importInputRef.current?.click();
                  }}
                  style={{
                    fontFamily: "'Lato', sans-serif",
                    padding: '6px 10px',
                    border: '1px solid transparent',
                    borderRadius: 8,
                    background: 'transparent',
                    color: '#1E3A6D',
                    fontSize: '0.9rem'
                  }}
                >
                  Importar
                </button>
              </div>

              <p style={{ fontFamily: "'Lato', sans-serif" }} className="text-lg text-[#6B7280] mt-2">
                Consistência sem sobrecarga
              </p>
              {isOffline ? (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-2 text-sm text-yellow-800">
                  Offline: edições são salvas localmente no navegador.
                </div>
              ) : (
                <div className="mt-3 text-sm text-[#4B5563]" style={{ fontFamily: "'Lato', sans-serif" }}>
                  Você está online; o histórico fica guardado no navegador.
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-[#6B7280]" style={{ fontFamily: "'Lato', sans-serif" }}>
                  Filtrar tags:
                </span>
                {allAvailableTags.map((tag) => {
                  const active = selectedTagFilters.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTagFilter(tag)}
                      className={`text-xs px-2 py-1 rounded-full border ${
                        active
                          ? 'bg-[#1E3A6D] text-white border-transparent'
                          : 'bg-white text-[#1E3A6D] border-[#E5DDD0] hover:bg-[#F5F1E8]'
                      }`}
                      style={{ fontFamily: "'Lato', sans-serif" }}
                    >
                      {getCategoryLabel(tag)}
                    </button>
                  );
                })}
                {selectedTagFilters.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTagFilters([])}
                    className="text-xs px-2 py-1 rounded-full border bg-white text-[#1E3A6D] border-[#E5DDD0] hover:bg-[#F5F1E8]"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  >
                    Limpar filtro
                  </button>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-start justify-end gap-3">
                <div className="text-right">
                  <p style={{ fontFamily: "'Playfair Display', serif" }} className="text-5xl font-bold text-[#1E3A6D]">
                    {progressPercentage}%
                  </p>
                  <p style={{ fontFamily: "'Lato', sans-serif" }} className="text-sm text-[#6B7280]">
                    {weekData.completedCount} de {weekData.totalTasks} tarefas
                  </p>
                </div>

                {/* buttons moved to left header under week number */}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-[#E8DCC8] rounded-full overflow-hidden shadow-sm">
            <div
              className={`h-full bg-gradient-to-r ${getProgressColor()} transition-all duration-500`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {displayedSchedule.map((daySchedule) => {
            const dayCompletedCount = daySchedule.tasks.filter(t => t.completed).length;
            const dayProgressPercentage = daySchedule.tasks.length > 0 ? Math.round((dayCompletedCount / daySchedule.tasks.length) * 100) : 0;

            return (
              <Card
                key={daySchedule.day}
                className="bg-white border-0 shadow-sm overflow-hidden"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(daySchedule.dayIndex, undefined, e)}
              >
                <div className="p-6">
                  {/* Day Header */}
                  <div className="mb-4">
                    <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-semibold text-[#0F1C2E]">
                      {daySchedule.dayName}
                    </h2>
                    <div className="mt-3 h-1 bg-[#E8DCC8] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#1E3A6D] to-[#2F5DA8] transition-all duration-300"
                        style={{ width: `${dayProgressPercentage}%` }}
                      />
                    </div>
                    <p style={{ fontFamily: "'Lato', sans-serif" }} className="text-xs text-[#6B7280] mt-2">
                      {dayCompletedCount} de {daySchedule.tasks.length} tarefas
                    </p>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2 mb-4">
                        {daySchedule.tasks.length === 0 ? (
                          <p style={{ fontFamily: "'Lato', sans-serif" }} className="text-sm text-[#6B7280]">
                            Nenhuma tarefa corresponde ao filtro de tags selecionado.
                          </p>
                        ) : (
                          daySchedule.tasks.map((task) => {
                            const wasDoneOnDifferentDay = task.completed && task.completedOnDay !== undefined && task.completedOnDay !== task.originalDay;
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(daySchedule.dayIndex, task.id)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(daySchedule.dayIndex, task.id, e)}
                          className={`flex items-start gap-3 p-3 rounded-lg cursor-move transition-all ${
                            task.completed
                              ? wasDoneOnDifferentDay
                                ? 'bg-yellow-50 border-l-4 border-yellow-500'
                                : 'bg-green-50 border-l-4 border-green-500'
                              : 'bg-white hover:bg-[#F9F7F3] border border-[#E5DDD0]'
                          } ${draggedTask?.taskId === task.id ? 'opacity-50' : ''}`}
                        >
                          {wasDoneOnDifferentDay && (
                            <div
                              className="flex-shrink-0 text-yellow-600 mt-1"
                              title={`Feita em ${DAYS_OF_WEEK[task.completedOnDay!].dayName}`}
                            >
                              <AlertCircle size={18} />
                            </div>
                          )}

                          {!wasDoneOnDifferentDay && (
                            <div
                              onClick={() => toggleTask(daySchedule.dayIndex, task.id)}
                              className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                                task.completed
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-[#1E3A6D] hover:border-[#C8A75B]'
                              }`}
                            >
                              {task.completed && <Check size={14} className="text-white" />}
                            </div>
                          )}
                          {wasDoneOnDifferentDay && (
                            <div
                              onClick={() => toggleTask(daySchedule.dayIndex, task.id)}
                              className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-yellow-500 bg-yellow-100 flex items-center justify-center transition-all cursor-pointer"
                            >
                              <Check size={14} className="text-yellow-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            {editingTask?.taskId === task.id ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editLabel}
                                  onChange={(e) => setEditLabel(e.target.value)}
                                  style={{ fontFamily: "'Lato', sans-serif" }}
                                  className="w-full text-sm font-medium border border-[#1E3A6D] rounded px-2 py-1"
                                />
                                <input
                                  type="text"
                                  value={editTime}
                                  onChange={(e) => setEditTime(e.target.value)}
                                  placeholder="HH:MM - HH:MM"
                                  style={{ fontFamily: "'Lato', sans-serif" }}
                                  className="w-full text-xs border border-[#1E3A6D] rounded px-2 py-1"
                                />
                                <div className="grid grid-cols-3 gap-2">
                                  {AVAILABLE_TAGS.map((tag) => (
                                    <label key={tag} className="flex items-center gap-2 text-xs text-[#1E3A6D]" style={{ fontFamily: "'Lato', sans-serif" }}>
                                      <input
                                        type="checkbox"
                                        checked={editTags.includes(tag)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setEditTags((prev) => [...prev, tag]);
                                          } else {
                                            setEditTags((prev) => prev.filter((selected) => selected !== tag));
                                          }
                                        }}
                                        className="form-checkbox h-4 w-4 text-yellow-500 border-[#1E3A6D]"
                                      />
                                      {getCategoryLabel(tag)}
                                    </label>
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={saveEditTask}
                                    className="text-xs bg-[#1E3A6D] text-white px-2 py-1 rounded hover:bg-[#0F1C2E]"
                                  >
                                    Salvar
                                  </button>
                                  <button
                                    onClick={() => setEditingTask(null)}
                                    className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p
                                  style={{ fontFamily: "'Lato', sans-serif" }}
                                  className={`text-sm font-medium transition-all ${
                                    task.completed
                                      ? 'text-[#6B7280] line-through'
                                      : 'text-[#0F1C2E]'
                                  }`}
                                >
                                  {task.label}
                                </p>
                                {task.time && (
                                  <p style={{ fontFamily: "'Lato', sans-serif" }} className="text-xs text-[#9CA3AF] mt-1">
                                    {task.time}
                                  </p>
                                )}
                                {wasDoneOnDifferentDay && (
                                  <p style={{ fontFamily: "'Lato', sans-serif" }} className="text-xs text-yellow-600 mt-1">
                                    ✓ Feita em {DAYS_OF_WEEK[task.completedOnDay!].dayName}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                          {!editingTask?.taskId && (
                            <div className="flex-shrink-0 flex gap-1">
                              {task.completed && (
                                <button
                                  onClick={() => setSelectingCompletionDay({ dayIndex: daySchedule.dayIndex, taskId: task.id })}
                                  className="p-1 hover:bg-[#F5F1E8] rounded"
                                  title="Marcar em outro dia"
                                >
                                  <Calendar size={14} className="text-[#1E3A6D]" />
                                </button>
                              )}
                              <button
                                onClick={() => startEditTask(daySchedule.dayIndex, task.id)}
                                className="p-1 hover:bg-[#F5F1E8] rounded"
                                title="Editar"
                              >
                                <Edit2 size={14} className="text-[#1E3A6D]" />
                              </button>
                              <button
                                onClick={() => deleteTask(daySchedule.dayIndex, task.id)}
                                className="p-1 hover:bg-[#F5F1E8] rounded"
                                title="Deletar"
                              >
                                <Trash2 size={14} className="text-red-500" />
                              </button>
                            </div>
                          )}
                          <div className="flex-shrink-0 flex flex-wrap gap-2">
                            <div className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(task.category)}`}>
                              {getCategoryLabel(task.category)}
                            </div>
                            {task.tags?.map((tag) => {
                              return (
                                <div key={tag} className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(tag)}`}>
                                  {getCategoryLabel(tag)}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }))}
                  </div>

                  {/* Add Task */}
                  {addingTaskDay === daySchedule.dayIndex ? (
                    <div className="bg-[#F5F1E8] p-3 rounded-lg space-y-2">
                      <input
                        type="text"
                        value={newTaskLabel}
                        onChange={(e) => setNewTaskLabel(e.target.value)}
                        placeholder="Descrição da tarefa"
                        style={{ fontFamily: "'Lato', sans-serif" }}
                        className="w-full text-sm border border-[#1E3A6D] rounded px-2 py-1"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={newTaskTime}
                        onChange={(e) => setNewTaskTime(e.target.value)}
                        placeholder="HH:MM - HH:MM (opcional)"
                        style={{ fontFamily: "'Lato', sans-serif" }}
                        className="w-full text-xs border border-[#1E3A6D] rounded px-2 py-1"
                      />
                      <select
                        value={newTaskCategory}
                        onChange={(e) => setNewTaskCategory(e.target.value as TaskCategory)}
                        style={{ fontFamily: "'Lato', sans-serif" }}
                        className="w-full text-xs border border-[#1E3A6D] rounded px-2 py-1"
                      >
                        <option value="content">Conteúdo</option>
                        <option value="fitness">Academia</option>
                        <option value="study">Estudos</option>
                        <option value="website">Site</option>
                        <option value="organization">Organização</option>
                        <option value="appointments">Trabalho</option>
                        <option value="finances">Finanças</option>
                      </select>
                      <div className="grid grid-cols-3 gap-2">
                {AVAILABLE_TAGS.map((tag) => (
                  <label key={tag} className="flex items-center gap-2 text-xs text-[#1E3A6D]" style={{ fontFamily: "'Lato', sans-serif" }}>
                    <input
                      type="checkbox"
                      checked={newTaskTags.includes(tag)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewTaskTags((prev) => [...prev, tag]);
                        } else {
                          setNewTaskTags((prev) => prev.filter((selected) => selected !== tag));
                        }
                      }}
                      className="form-checkbox h-4 w-4 text-yellow-500 border-[#1E3A6D]"
                    />
                    {getCategoryLabel(tag)}
                  </label>
                ))}
              </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => addTaskToDay(daySchedule.dayIndex)}
                          className="flex-1 text-xs bg-[#1E3A6D] text-white px-2 py-1 rounded hover:bg-[#0F1C2E]"
                        >
                          Adicionar
                        </button>
                        <button
                          onClick={() => {
                            setAddingTaskDay(null);
                            setNewTaskTags([]);
                          }}
                          className="flex-1 text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddingTaskDay(daySchedule.dayIndex);
                        setNewTaskTags([]);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 text-sm text-[#1E3A6D] hover:bg-[#F5F1E8] rounded transition-all"
                      style={{ fontFamily: "'Lato', sans-serif" }}
                    >
                      <Plus size={16} />
                      Adicionar tarefa
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            onClick={previousWeek}
            disabled={currentWeek === 1}
            variant="outline"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            <ChevronLeft size={18} className="mr-2" />
            Semana Anterior
          </Button>

          <div className="flex-1 flex justify-center gap-2">
            {allWeeks.map((week) => (
              <button
                key={week.week}
                onClick={() => {
                  setWeekData(week);
                  setCurrentWeek(week.week);
                }}
                style={{ fontFamily: "'Playfair Display', serif" }}
                className={`w-10 h-10 rounded-full font-semibold transition-all ${
                  currentWeek === week.week
                    ? 'bg-[#1E3A6D] text-white'
                    : 'bg-white text-[#1E3A6D] border border-[#E5DDD0] hover:bg-[#F5F1E8]'
                }`}
              >
                {week.week}
              </button>
            ))}
          </div>

          <Button
            onClick={nextWeek}
            className="bg-[#1E3A6D] hover:bg-[#0F1C2E] text-white"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            Próxima Semana
            <ChevronRight size={18} className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
