import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, MoreVertical, RotateCw } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  customer_id: string;
  priority: string;
  status: 'open' | 'in_progress' | 'completed';
  recurrence_type?: string;
  due_date: string;
  assignees: string[];
}

export default function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/api/v1/tasks/all');
      setTasks(response.data.tasks);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      setLoading(false);
    }
  };

  const openTasks = tasks.filter((t) => t.status === 'open');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const TaskCard = ({ task }: { task: Task }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-3 cursor-move hover:shadow-md transition">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 flex-1">{task.title}</h4>
        <button className="p-1 hover:bg-gray-100 rounded">
          <MoreVertical size={16} className="text-gray-400" />
        </button>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
      )}

      <div className="flex items-center gap-2 mb-3">
        {task.recurrence_type && (
          <span className="inline-flex items-center gap-1 text-xs text-blue-600">
            <RotateCw size={12} />
            {task.recurrence_type}
          </span>
        )}
        <span
          className={`text-xs font-semibold px-2 py-1 rounded ${
            task.priority === 'high'
              ? 'bg-red-100 text-red-700'
              : task.priority === 'medium'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {task.priority}
        </span>
        {task.due_date && (
          <span className="text-xs text-gray-600">Due {new Date(task.due_date).toLocaleDateString()}</span>
        )}
      </div>

      <div className="flex gap-1">
        {task.assignees.slice(0, 3).map((assignee) => (
          <div key={assignee} className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center">
            {assignee.substring(0, 1)}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex-1 p-8 bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Plus size={20} />
            New Task
          </button>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-3 gap-6">
          {/* Open Column */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                Open
                <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-1 rounded">
                  {openTasks.length}
                </span>
              </h2>
            </div>
            <div className="space-y-3 min-h-96 max-h-96 overflow-y-auto">
              {openTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                In Progress
                <span className="bg-blue-200 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                  {inProgressTasks.length}
                </span>
              </h2>
            </div>
            <div className="space-y-3 min-h-96 max-h-96 overflow-y-auto">
              {inProgressTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>

          {/* Completed Column */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                Completed
                <span className="bg-green-200 text-green-700 text-xs font-semibold px-2 py-1 rounded">
                  {completedTasks.length}
                </span>
              </h2>
            </div>
            <div className="space-y-3 min-h-96 max-h-96 overflow-y-auto">
              {completedTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
