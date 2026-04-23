import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ChevronRight, User } from 'lucide-react';

const KANBAN_STAGES = [
  { id: 'applied',      label: 'Applied',       color: 'bg-blue-50 border-blue-200',   dot: 'bg-blue-400' },
  { id: 'under_review', label: 'Under Review',   color: 'bg-purple-50 border-purple-200', dot: 'bg-purple-400' },
  { id: 'phone_screen', label: 'Phone Screen',   color: 'bg-amber-50 border-amber-200',  dot: 'bg-amber-400' },
  { id: 'interview',    label: 'Interviewing',   color: 'bg-orange-50 border-orange-200', dot: 'bg-orange-400' },
  { id: 'offer',        label: 'Offer Sent',     color: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-400' },
  { id: 'hired',        label: 'Hired',          color: 'bg-green-50 border-green-200',  dot: 'bg-green-500' },
  { id: 'rejected',     label: 'Rejected',       color: 'bg-red-50 border-red-200',      dot: 'bg-red-400' },
];

function AppCard({ app, index }) {
  return (
    <Draggable draggableId={app.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg border border-[#e5e7eb] p-3 shadow-sm select-none transition-shadow ${
            snapshot.isDragging ? 'shadow-lg rotate-1 border-bronze/40' : 'hover:shadow-md'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-bronze-soft flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-bronze-dark">
                  {app.firstName?.[0]}{app.lastName?.[0]}
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-navy truncate">{app.firstName} {app.lastName}</div>
                <div className="text-[10px] text-[#9ca3af] truncate">{app.email}</div>
              </div>
            </div>
            <Link
              to={`/admin/applications/${app.id}`}
              onClick={e => e.stopPropagation()}
              className="text-[#d1d5db] hover:text-bronze transition-colors flex-shrink-0"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {(app.requisitionTitle || app.positionAppliedFor) && (
            <div className="mt-2 text-[10px] text-[#6b7280] bg-[#f9fafb] rounded px-2 py-1 truncate">
              {app.requisitionTitle || app.positionAppliedFor}
            </div>
          )}
          <div className="mt-1.5 text-[10px] text-[#9ca3af]">
            {app.submittedAt
              ? new Date(app.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : new Date(app.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function KanbanBoard({ apps, setApps, jobFilter }) {
  const [dragging, setDragging] = useState(false);

  const filtered = jobFilter === 'all' ? apps : apps.filter(a => a.requisitionId === jobFilter);

  const byStage = KANBAN_STAGES.reduce((acc, s) => {
    acc[s.id] = filtered.filter(a => a.stage === s.id);
    return acc;
  }, {});

  const onDragEnd = async (result) => {
    setDragging(false);
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const newStage = destination.droppableId;
    const now = new Date().toISOString();

    // Optimistic update
    setApps(prev => prev.map(a =>
      a.id === draggableId
        ? {
            ...a,
            stage: newStage,
            stageHistory: [...(a.stageHistory || []), { stage: newStage, changedAt: now, changedBy: 'admin', note: `Moved via Kanban` }],
          }
        : a
    ));

    await base44.entities.Application.update(draggableId, {
      stage: newStage,
      stageHistory: [
        ...(apps.find(a => a.id === draggableId)?.stageHistory || []),
        { stage: newStage, changedAt: now, changedBy: 'admin', note: 'Moved via Kanban board' },
      ],
    });
  };

  return (
    <DragDropContext onDragStart={() => setDragging(true)} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
        {KANBAN_STAGES.map(stage => {
          const cards = byStage[stage.id] || [];
          return (
            <div key={stage.id} className="flex-shrink-0 w-56">
              {/* Column header */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-t-lg border-t border-x ${stage.color}`}>
                <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
                <span className="text-[11px] font-semibold text-[#374151]">{stage.label}</span>
                <span className="ml-auto text-[10px] font-bold text-[#6b7280] bg-white/70 px-1.5 py-0.5 rounded-full">
                  {cards.length}
                </span>
              </div>

              {/* Droppable column */}
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] rounded-b-lg border border-t-0 p-2 space-y-2 transition-colors ${stage.color} ${
                      snapshot.isDraggingOver ? 'ring-2 ring-bronze/40 ring-inset' : ''
                    }`}
                  >
                    {cards.map((app, i) => (
                      <AppCard key={app.id} app={app} index={i} />
                    ))}
                    {provided.placeholder}
                    {cards.length === 0 && !snapshot.isDraggingOver && (
                      <div className="text-center py-6 text-[10px] text-[#9ca3af] italic">Drop here</div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}