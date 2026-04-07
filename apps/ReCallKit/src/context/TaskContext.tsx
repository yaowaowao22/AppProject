// ============================================================
// TaskContext
// URL解析タスクのバックグラウンド実行・状態管理
// ============================================================

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { analyzeUrlPipeline } from '../services/urlAnalysisPipeline';

export interface AnalysisTask {
  id: string;
  url: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: {
    url: string;
    title: string;
    summary: string;
    qa_pairs: { question: string; answer: string }[];
    category: string;
  };
  error?: string;
  createdAt: string;
  completedAt?: string;
}

interface TaskContextValue {
  tasks: AnalysisTask[];
  addTask: (url: string) => Promise<{ success: boolean; error?: string }>;
  retryTask: (taskId: string) => void;
  removeTask: (taskId: string) => void;
  runningCount: number;
}

const TaskContext = createContext<TaskContextValue | null>(null);

export function useTask(): TaskContextValue {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTask must be used within TaskProvider');
  return ctx;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<AnalysisTask[]>([]);

  const runTask = useCallback(async (taskId: string, url: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: 'running' as const } : t)),
    );

    try {
      const result = await analyzeUrlPipeline(url);
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? {
                ...t,
                status: 'completed' as const,
                result: {
                  url: result.sourceUrl,
                  title: result.title,
                  summary: result.summary,
                  qa_pairs: result.qa_pairs,
                  category: result.category,
                },
                completedAt: new Date().toISOString(),
              }
            : t,
        ),
      );
    } catch (err) {
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? {
                ...t,
                status: 'error' as const,
                error: err instanceof Error ? err.message : 'URL解析に失敗しました',
                completedAt: new Date().toISOString(),
              }
            : t,
        ),
      );
    }
  }, []);

  const addTask = useCallback(
    async (url: string): Promise<{ success: boolean; error?: string }> => {
      const id = generateId();
      const task: AnalysisTask = {
        id,
        url,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      setTasks(prev => [task, ...prev]);

      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }

      // バックグラウンド実行（fire and forget）
      runTask(id, url);

      return { success: true };
    },
    [runTask],
  );

  const retryTask = useCallback(
    (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      runTask(taskId, task.url);
    },
    [tasks, runTask],
  );

  const removeTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const runningCount = tasks.filter(
    t => t.status === 'running' || t.status === 'pending',
  ).length;

  return (
    <TaskContext.Provider value={{ tasks, addTask, retryTask, removeTask, runningCount }}>
      {children}
    </TaskContext.Provider>
  );
}
