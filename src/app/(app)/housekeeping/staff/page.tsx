'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  ChevronRight, 
  Play, 
  AlertCircle,
  Smartphone,
  Filter,
  User,
  Coffee
} from 'lucide-react';
import { 
  getStoredTasks, 
  updateTaskStatus, 
  getEnrichedRooms,
  getSelectedProperty
} from '@/lib/store';
import { HousekeepingTask, Room } from '@/types';
import { format } from 'date-fns';
import { useRealtime } from '@/hooks/useRealtime';
import { useToast } from '@/components/ui/Toast';

export default function HousekeepingStaffPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeTab, setActiveTab] = useState<'my-tasks' | 'all-rooms'>('my-tasks');
  const [isLoading, setIsLoading] = useState(true);
  const propertyId = getSelectedProperty();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedTasks, fetchedRooms] = await Promise.all([
        getStoredTasks(),
        getEnrichedRooms()
      ]);
      
      const propTasks = propertyId === 'all' ? fetchedTasks : fetchedTasks.filter(t => t.property_id === propertyId);
      const propRooms = propertyId === 'all' ? fetchedRooms : fetchedRooms.filter(r => r.property_id === propertyId);
      
      setTasks(propTasks);
      setRooms(propRooms);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useRealtime(loadData, ['housekeeping_tasks', 'rooms']);

  const handleStartTask = async (taskId: string) => {
    await updateTaskStatus(taskId, 'in_progress');
    toast('Started cleaning...', 'info');
    loadData();
  };

  const handleFinishTask = async (taskId: string) => {
    await updateTaskStatus(taskId, 'done');
    toast('Room marked as READY!', 'success');
    loadData();
  };

  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const completedToday = tasks.filter(t => t.status === 'done');

  return (
    <div className="flex flex-col min-h-screen bg-bg-canvas pb-20">
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-border-subtle px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold">
            HK
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-ink-primary">Staff Portal</h1>
            <span className="text-[10px] text-ink-muted uppercase tracking-widest font-bold">Housekeeping</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="px-3 py-1 bg-bg-sunken rounded-full text-[10px] font-bold text-ink-primary border border-border-subtle">
              {format(new Date(), 'dd MMM')}
           </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="px-6 py-4 flex gap-3 overflow-x-auto no-scrollbar bg-white mt-1 border-b border-border-subtle">
        <div className="flex-shrink-0 bg-accent/5 border border-accent/10 px-4 py-3 rounded-2xl flex flex-col gap-1 min-w-[120px]">
           <span className="text-[9px] uppercase font-bold text-accent tracking-widest">Pending</span>
           <span className="text-xl font-display font-bold text-ink-primary">{pendingTasks.length} Rooms</span>
        </div>
        <div className="flex-shrink-0 bg-success/5 border border-success/20 px-4 py-3 rounded-2xl flex flex-col gap-1 min-w-[120px]">
           <span className="text-[9px] uppercase font-bold text-success tracking-widest">Completed Today</span>
           <span className="text-xl font-display font-bold text-ink-primary">{completedToday.length}</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-6 py-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold text-ink-primary">Assigned Tasks</h2>
            <button className="text-ink-muted hover:text-accent transition-colors">
              <Filter size={18} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {pendingTasks.map(task => {
              const room = rooms.find(r => r.id === task.room_id);
              const isUrgent = task.priority === 'urgent' || task.priority === 'high';
              
              return (
                <div key={task.id} className="bg-white rounded-3xl border border-border-subtle shadow-sm overflow-hidden flex flex-col">
                   <div className="p-6 flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-2">
                           <span className="text-2xl font-display font-black text-ink-primary">Room {room?.room_number}</span>
                           {isUrgent && (
                             <span className="bg-danger/10 text-danger text-[9px] px-2 py-0.5 rounded-full font-black uppercase">Urgent</span>
                           )}
                         </div>
                         <div className="flex items-center gap-2 text-xs font-medium text-ink-muted">
                           <MapPin size={12} className="text-accent" />
                           <span>{task.task_type.replace('_', ' ').toUpperCase()}</span>
                         </div>
                      </div>
                      <div className={`p-4 rounded-2xl ${task.status === 'in_progress' ? 'bg-warning/10 text-warning' : 'bg-bg-sunken text-ink-muted'}`}>
                         {task.status === 'in_progress' ? <Clock size={20} className="animate-spin-slow" /> : <Smartphone size={20} />}
                      </div>
                   </div>

                   {task.notes && (
                     <div className="px-6 pb-4">
                        <div className="bg-bg-sunken/50 p-4 rounded-2xl flex items-start gap-3">
                           <Coffee size={14} className="text-accent mt-0.5" />
                           <p className="text-xs text-ink-secondary leading-normal">{task.notes}</p>
                        </div>
                     </div>
                   )}

                   <div className="px-6 pb-6 pt-2 border-t border-border-subtle/50 mt-2 flex gap-3">
                      {task.status === 'pending' ? (
                        <button 
                          onClick={() => handleStartTask(task.id)}
                          className="flex-1 bg-ink-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-ink-primary/20"
                        >
                          <Play size={18} fill="currentColor" />
                          Start Cleaning
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleFinishTask(task.id)}
                          className="flex-1 bg-success text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-success/20"
                        >
                          <CheckCircle2 size={18} />
                          Finish & Set Ready
                        </button>
                      )}
                   </div>
                </div>
              );
            })}

            {pendingTasks.length === 0 && !isLoading && (
              <div className="py-20 flex flex-col items-center justify-center text-center gap-4">
                 <div className="w-20 h-20 rounded-full bg-success/10 text-success flex items-center justify-center">
                    <CheckCircle2 size={40} />
                 </div>
                 <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-bold text-ink-primary">All Clear!</h3>
                    <p className="text-xs text-ink-muted">No pending cleaning tasks for you.</p>
                 </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Mobile Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-border-subtle px-8 flex items-center justify-around z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('my-tasks')}
          className={`flex flex-col items-center gap-1.5 ${activeTab === 'my-tasks' ? 'text-accent' : 'text-ink-muted'}`}
        >
          <Sparkles size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Tasks</span>
        </button>
        <button 
          onClick={() => setActiveTab('all-rooms')}
          className={`flex flex-col items-center gap-1.5 ${activeTab === 'all-rooms' ? 'text-accent' : 'text-ink-muted'}`}
        >
          <MapPin size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Rooms</span>
        </button>
        <button 
          className="flex flex-col items-center gap-1.5 text-ink-muted"
        >
          <User size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Account</span>
        </button>
      </nav>
    </div>
  );
}
