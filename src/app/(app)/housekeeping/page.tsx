'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Sparkles, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  User, 
  CheckCircle2, 
  PlayCircle, 
  SkipForward, 
  UserPlus,
  Building2,
  Tent,
  AlertTriangle,
  Zap,
  CheckCircle,
  Strikethrough,
  Home,
  MoreHorizontal
} from 'lucide-react';
import Select from '@/components/ui/Select';
import { 
  getStoredTasks, 
  addTask, 
  updateTaskStatus, 
  reassignTask,
  getEnrichedRooms,
  getSelectedProperty,
  getStoredProperties
} from '@/lib/store';
import { 
  HousekeepingTask, 
  Room, 
  TaskType, 
  TaskPriority 
} from '@/types';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import RoomCard from '@/components/rooms/RoomCard';
import { format } from 'date-fns';
import { useRealtime } from '@/hooks/useRealtime';

const TASK_STATUSES: { label: string; value: HousekeepingTask['status'] }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Done', value: 'done' }
];

export default function HousekeepingPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filterProperty, setFilterProperty] = useState<string | null>(null);
  const [availableProperties, setAvailableProperties] = useState<{id: string, name: string}[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'rooms'>('tasks');
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('stayboard_user_role'));
    }
    
    const loadStore = async () => {
      setIsLoading(true);
      try {
        const currentProperty = getSelectedProperty();
        setFilterProperty(currentProperty);

        const [fetchedTasks, fetchedRooms, fetchedProperties] = await Promise.all([
          getStoredTasks(),
          getEnrichedRooms(),
          getStoredProperties()
        ]);
        setTasks(fetchedTasks);
        setRooms(fetchedRooms);
        setAvailableProperties(fetchedProperties.map(p => ({ id: p.id, name: p.name })));

        // Sync form default if needed
        if (currentProperty && currentProperty !== 'all') {
           setNewTask(prev => ({ ...prev, property_id: currentProperty }));
        }
      } catch (error) {
        console.error("Error loading housekeeping data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStore();
    window.addEventListener('storage', loadStore);
    return () => window.removeEventListener('storage', loadStore);
  }, []);

  // Supabase Realtime Sync
  useRealtime(loadStore, ['housekeeping_tasks', 'rooms']);

  const isOwnerRole = userRole === 'owner';

  const [newTask, setNewTask] = useState({
    property_id: '010',
    room_id: '',
    task_type: 'checkout_clean' as TaskType,
    assigned_to: '',
    due_by: '11:00',
    priority: 'normal' as TaskPriority,
    notes: ''
  });


  const handleCreateTask = async () => {
    if (!newTask.room_id) {
      toast("Please select a room", "warning");
      return;
    }

    const today = new Date();
    const [hours, minutes] = newTask.due_by.split(':');
    today.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    setIsLoading(true);
    await addTask({
      ...newTask,
      owner_id: '001',
      status: 'pending',
      due_by: today.toISOString()
    });

    const fetchedTasks = await getStoredTasks();
    setTasks(fetchedTasks);
    setIsLoading(false);
    setShowCreateModal(false);
    toast(`Task created for Room ${rooms.find(r => r.id === newTask.room_id)?.room_number}`, "success");
  };

  const handleStatusChange = async (taskId: string, status: HousekeepingTask['status']) => {
    const now = new Date().toISOString();
    await updateTaskStatus(
      taskId, 
      status, 
      status === 'in_progress' ? now : undefined,
      status === 'done' ? now : undefined
    );
    
    const fetchedTasks = await getStoredTasks();
    setTasks(fetchedTasks);
    
    if (status === 'done') {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        toast(`Room ${rooms.find(r => r.id === task.room_id)?.room_number} cleaned and ready`, "success");
      }
    }
  };

  const filteredTasks = tasks.filter(t => {
    const isPropertyMatch = !filterProperty || filterProperty === 'all' || t.property_id === filterProperty;
    if (!isPropertyMatch) return false;

    // FEATURE 1: Hide checkout_clean tasks until checkout date
    if (t.task_type === 'checkout_clean' && t.status === 'pending') {
      const dueDate = new Date(t.due_by);
      const today = new Date();
      // Only show if due today or earlier
      return dueDate.toDateString() === today.toDateString() || dueDate < today;
    }
    return true;
  });

  const filteredRooms = rooms.filter(r => 
    (!filterProperty || filterProperty === 'all' || r.property_id === filterProperty) &&
    ['cleaning', 'maintenance', 'vacant'].includes(r.status)
  );

  const pendingTasks = filteredTasks.filter(t => t.status === 'pending');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
  const completedTasks = filteredTasks.filter(t => t.status === 'done');

  const renderTaskCard = (task: HousekeepingTask) => {
    const room = rooms.find(r => r.id === task.room_id);
    const isOverdue = new Date(task.due_by) < new Date() && task.status !== 'done';

    return (
      <div 
        key={task.id} 
        className="group bg-white border border-border-subtle rounded-xl p-4 shadow-xs hover:shadow-md transition-all duration-220 flex flex-col gap-3 relative overflow-hidden"
      >
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.priority === 'urgent' ? 'bg-danger' : task.priority === 'high' ? 'bg-warning' : 'bg-ink-muted/20'}`} />
        
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h4 className="font-display text-lg text-ink-primary leading-tight font-medium">Room {room?.room_number || '??'}</h4>
            {(filterProperty === 'all' || !filterProperty) && (
              <span className="text-[9px] font-medium text-accent font-sans uppercase tracking-[0.1em] -mt-0.5 opacity-80 decoration-accent/50 underline-offset-2">
                {availableProperties.find(p => p.id === task.property_id)?.name}
              </span>
            )}
            <span className="text-[10px] font-normal text-ink-muted uppercase tracking-wider mt-1">{task.task_type.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${task.priority === 'urgent' ? 'bg-danger animate-pulse' : task.priority === 'high' ? 'bg-warning' : 'bg-ink-muted/20'}`} />
            <button className="text-ink-muted hover:text-ink-primary p-1 rounded-full hover:bg-bg-sunken">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs text-ink-secondary">
            <User size={14} className="text-ink-muted" />
            <span>{task.assigned_to || 'Unassigned'}</span>
          </div>
          <div className={`flex items-center gap-2 text-xs ${isOverdue ? 'text-danger font-medium' : 'text-ink-muted'}`}>
            <Clock size={14} />
            <span>Due by {format(new Date(task.due_by), 'h:mm a')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border-subtle/50">
          {task.status === 'pending' && (
            <button 
              onClick={() => handleStatusChange(task.id, 'in_progress')}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-full bg-accent/5 text-accent text-[11px] font-medium uppercase tracking-wider hover:bg-accent hover:text-white transition-all"
            >
              <PlayCircle size={14} />
              <span>Start</span>
            </button>
          )}
          {task.status === 'in_progress' && (
            <button 
              onClick={() => handleStatusChange(task.id, 'done')}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-full bg-success/5 text-success text-[11px] font-medium uppercase tracking-wider hover:bg-success hover:text-white transition-all"
            >
              <CheckCircle2 size={14} />
              <span>Done</span>
            </button>
          )}
          <button className="px-3 py-2 rounded-full text-ink-muted hover:bg-bg-sunken hover:text-ink-primary transition-all">
            <SkipForward size={14} />
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) return (
    <div className="p-6 md:p-10 flex flex-col gap-6 animate-pulse bg-bg-canvas min-h-full">
      <div className="flex flex-col gap-3">
        <div className="h-3 w-40 bg-bg-sunken rounded" />
        <div className="h-10 w-56 bg-bg-sunken rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 bg-bg-sunken rounded-xl" />)}
        </div>
        <div className="md:col-span-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-bg-sunken rounded-xl" />)}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-10 flex flex-col gap-10 bg-bg-canvas min-h-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-medium text-accent uppercase tracking-[0.3em] font-sans">{format(new Date(), 'EEEE, dd MMM yyyy')}</span>
          <h1 className="text-4xl md:text-5xl font-display text-ink-primary tracking-tighter font-medium text-balance">Housekeeping</h1>
        </div>
        {!isOwnerRole && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-accent flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
          >
            <Plus size={20} />
            <span>Create Task</span>
          </button>
        )}
      </header>


      <div className="flex flex-col md:flex-row justify-end items-center gap-4 mb-4 border-b border-border-subtle pb-4">
        <div className="flex w-full md:w-auto items-center p-1 bg-bg-sunken rounded-xl border border-border-subtle">
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'tasks' ? 'bg-white text-ink-primary shadow-sm' : 'text-ink-muted'}`}
          >
            Tasks
          </button>
          <button 
            onClick={() => setActiveTab('rooms')}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'rooms' ? 'bg-white text-ink-primary shadow-sm' : 'text-ink-muted'}`}
          >
            Rooms
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Left Column: Task List */}
        <div className={`md:col-span-4 flex flex-col gap-10 ${activeTab === 'rooms' ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-ink-muted uppercase tracking-widest">In Progress — {inProgressTasks.length}</h3>
            </div>
            <div className="flex flex-col gap-4">
              {inProgressTasks.map(renderTaskCard)}
              {inProgressTasks.length === 0 && (
                <p className="text-sm text-ink-muted text-center py-6 border border-dashed border-border-subtle rounded-xl bg-bg-sunken/50">No tasks in progress</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-ink-muted uppercase tracking-widest">Pending — {pendingTasks.length}</h3>
            </div>
            <div className="flex flex-col gap-4">
              {pendingTasks.map(renderTaskCard)}
              {pendingTasks.length === 0 && (
                <p className="text-sm text-ink-muted text-center py-8 border border-dashed border-border-subtle rounded-xl bg-bg-sunken/50">All caught up!</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-ink-muted uppercase tracking-widest">Completed — {completedTasks.length}</h3>
              <button className="text-[10px] font-medium text-accent uppercase tracking-wider hover:underline">Clear all</button>
            </div>
            <div className="flex flex-col gap-4 opacity-70 grayscale-[0.3]">
              {completedTasks.map(renderTaskCard)}
            </div>
          </div>
        </div>

        {/* Right Column: Room Status Grid */}
        <div className={`md:col-span-8 flex flex-col gap-6 ${activeTab === 'tasks' ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-ink-muted uppercase tracking-widest">Room Inventory</h3>
            <div className="flex items-center gap-6">
              <span className="text-[10px] flex items-center gap-2 font-medium text-ink-muted uppercase tracking-widest leading-none">
                <div className="w-2.5 h-2.5 rounded-full bg-status-cleaning-fg shadow-sm" /> 
                Cleaning
              </span>
              <span className="text-[10px] flex items-center gap-2 font-medium text-ink-muted uppercase tracking-widest leading-none">
                <div className="w-2.5 h-2.5 rounded-full bg-status-maintenance-fg shadow-sm" /> 
                Maintenance
              </span>
              <span className="text-[10px] flex items-center gap-2 font-medium text-ink-muted uppercase tracking-widest leading-none">
                <div className="w-2.5 h-2.5 rounded-full bg-status-vacant-fg shadow-sm" /> 
                Vacant
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredRooms.map(room => {
              const propName = availableProperties.find(p => p.id === room.property_id)?.name;
              return (
                <RoomCard 
                  key={room.id} 
                  room={room} 
                  propertyName={filterProperty === 'all' ? propName : undefined}
                  onClick={() => {
                    setNewTask({ ...newTask, room_id: room.id, property_id: room.property_id });
                    setShowCreateModal(true);
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal: Create Task */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Cleaning Task"
        footer={
          <div className="flex gap-3 w-full">
            <button className="btn btn-secondary flex-1 font-medium" onClick={() => setShowCreateModal(false)}>Cancel</button>
            <button className="btn btn-accent flex-1 font-medium px-10" onClick={handleCreateTask}>Create Task</button>
          </div>
        }
      >
        <div className="flex flex-col gap-6">
          <Select 
            options={availableProperties.map(p => ({ id: p.id, label: p.name, icon: Building2 }))}
            value={newTask.property_id}
            onChange={(val) => setNewTask({ ...newTask, property_id: val, room_id: '' })}
            label="Property"
          />

          <Select 
            options={[
              { id: '', label: 'Select a room', icon: Home },
              ...rooms.filter(r => r.property_id === newTask.property_id).map(r => ({
                id: r.id,
                label: `Room ${r.room_number}`,
                description: r.status,
                icon: Home
              }))
            ]}
            value={newTask.room_id}
            onChange={(val) => setNewTask({ ...newTask, room_id: val })}
            label="Room"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select 
              options={[
                { id: 'checkout_clean', label: 'Checkout Clean', icon: Sparkles, description: 'Post-departure' },
                { id: 'daily_clean', label: 'Daily Clean', icon: PlayCircle, description: 'Stay-over' },
                { id: 'deep_clean', label: 'Deep Clean', icon: Zap, description: 'Monthly/Seasonal' },
                { id: 'inspection', label: 'Inspection', icon: CheckCircle2, description: 'Quality check' },
                { id: 'turndown', label: 'Turndown', icon: Clock, description: 'Evening prep' }
              ]}
              value={newTask.task_type}
              onChange={(val) => setNewTask({ ...newTask, task_type: val as TaskType })}
              label="Task Type"
            />
            <Select 
              options={[
                { id: 'low', label: 'Low Priority', icon: CheckCircle, description: 'When free' },
                { id: 'normal', label: 'Normal', icon: PlayCircle, description: 'Standard queue' },
                { id: 'high', label: 'High PR', icon: AlertTriangle, description: 'Prioritize' },
                { id: 'urgent', label: 'Urgent!', icon: Zap, description: 'Immediate action' }
              ]}
              value={newTask.priority}
              onChange={(val) => setNewTask({ ...newTask, priority: val as TaskPriority })}
              label="Priority"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="field">
              <label className="label">Assign To</label>
              <div className="relative">
                 <UserPlus size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                 <input 
                  type="text" 
                  className="input pl-10" 
                  placeholder={newTask.assigned_to ? "" : "Staff name"} 
                  value={newTask.assigned_to}
                  onChange={e => setNewTask({ ...newTask, assigned_to: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label className="label">Due By</label>
              <input 
                type="time" 
                className="input" 
                value={newTask.due_by} 
                onChange={e => setNewTask({ ...newTask, due_by: e.target.value })} 
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Notes (Optional)</label>
            <textarea 
              className="input min-h-[80px] py-3" 
              placeholder={newTask.notes ? "" : "e.g. Check AC remote battery"}
              value={newTask.notes}
              onChange={e => setNewTask({ ...newTask, notes: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
