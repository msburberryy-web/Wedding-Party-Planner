import React, { useState } from 'react';
import { Clock, MapPin, User, Mic, Trash2, ArrowUp, ArrowDown, Star, MessageSquare, Layers, GripVertical } from 'lucide-react';
import { TimelineActivity } from '../utils/excelGenerator';
import { Language, translations } from '../constants/translations';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TimelineItemProps {
  activity: TimelineActivity;
  index: number;
  language: Language;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onUpdateDuration: (id: string, duration: number) => void;
  onUpdateStartTime?: (newStartTime: string, id: string) => void;
  onUpdateActivity?: (id: string, updates: Partial<TimelineActivity>) => void;
  onUpdateSubActivity?: (parentId: string, subId: string, field: string, value: any) => void;
  onMakeConcurrent?: (id: string, parentId: string) => void;
  onRemoveSubActivity?: (parentId: string, subId: string) => void;
  previousActivityId?: string;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  activity,
  index,
  language,
  onRemove,
  onMove,
  onUpdateDuration,
  onUpdateStartTime,
  onUpdateActivity,
  onUpdateSubActivity,
  onMakeConcurrent,
  onRemoveSubActivity,
  previousActivityId
}) => {
  const t = translations[language];
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingResponsible, setIsEditingResponsible] = useState(false);
  const [isEditingStartTime, setIsEditingStartTime] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const currentName = language === 'ja' ? activity.nameJa || activity.name : language === 'my' ? activity.nameMy || activity.name : activity.nameEn || activity.name;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative pl-12 pr-4 py-6 group transition-all ${
        activity.isImportant ? 'bg-wedding-olive/5' : 'hover:bg-white/50'
      } ${isDragging ? 'shadow-2xl ring-2 ring-wedding-olive/20 rounded-2xl bg-white' : ''}`}
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-stone-300 hover:text-stone-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      {/* Timeline Connector */}
      <div className="timeline-line" />
      <div className={`timeline-dot ${activity.isImportant ? 'scale-150 ring-4 ring-wedding-olive/20' : ''}`} />

      <div className="flex flex-col md:flex-row md:items-start gap-4">
        {/* Time and Duration */}
        <div className="flex flex-col min-w-[100px]">
          {isEditingStartTime ? (
            <input
              autoFocus
              type="time"
              value={activity.startTime}
              onBlur={() => setIsEditingStartTime(false)}
              onChange={(e) => {
                if (onUpdateStartTime) {
                  onUpdateStartTime(e.target.value, activity.id);
                }
              }}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingStartTime(false)}
              className="text-lg font-mono font-medium text-wedding-olive bg-white border-wedding-olive/30 rounded px-1 focus:ring-wedding-olive focus:border-wedding-olive w-24"
            />
          ) : (
            <span 
              onClick={() => setIsEditingStartTime(true)}
              className="text-lg font-mono font-medium text-wedding-olive cursor-text hover:underline decoration-wedding-olive/30"
            >
              {activity.startTime}
            </span>
          )}
          <div className="flex items-center gap-1 text-xs text-stone-400 mt-1">
            <Clock className="w-3 h-3" />
            <input
              type="number"
              value={activity.duration}
              onChange={(e) => onUpdateDuration(activity.id, Number(e.target.value))}
              className="w-10 bg-transparent border-none p-0 focus:ring-0 font-mono"
            />
            <span>min</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isEditingName ? (
              <input
                autoFocus
                type="text"
                value={currentName}
                onBlur={() => setIsEditingName(false)}
                onChange={(e) => onUpdateActivity?.(activity.id, language === 'ja' ? { nameJa: e.target.value } : language === 'my' ? { nameMy: e.target.value } : { nameEn: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                className="text-lg font-serif font-semibold bg-white border-wedding-olive/30 rounded px-1 focus:ring-wedding-olive focus:border-wedding-olive"
              />
            ) : (
              <h3 
                onClick={() => setIsEditingName(true)}
                className={`text-lg font-serif font-semibold cursor-text hover:underline decoration-wedding-olive/30 ${activity.isImportant ? 'text-wedding-olive' : 'text-wedding-ink'}`}
              >
                {currentName}
              </h3>
            )}
            {activity.isImportant && (
              <Star className="w-4 h-4 fill-wedding-gold text-wedding-gold" />
            )}
            {activity.needsMic && (
              <Mic className="w-3.5 h-3.5 text-wedding-gold" title={t.micNeeded} />
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <User className="w-3.5 h-3.5" />
              {isEditingResponsible ? (
                <input
                  autoFocus
                  type="text"
                  value={activity.responsible || ''}
                  onBlur={() => setIsEditingResponsible(false)}
                  onChange={(e) => onUpdateActivity?.(activity.id, { responsible: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingResponsible(false)}
                  className="bg-white border-wedding-olive/30 rounded px-1 focus:ring-wedding-olive focus:border-wedding-olive font-medium uppercase tracking-wider"
                />
              ) : (
                <span 
                  onClick={() => setIsEditingResponsible(true)}
                  className="font-medium uppercase tracking-wider cursor-text hover:underline decoration-wedding-olive/30"
                >
                  {activity.responsible || 'No PIC'}
                </span>
              )}
            </div>
            {activity.location && (
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <MapPin className="w-3.5 h-3.5" />
                <span>{activity.location}</span>
              </div>
            )}
            {activity.details && (
              <div className="flex items-center gap-1.5 text-xs text-stone-400 italic">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{activity.details}</span>
              </div>
            )}
          </div>

          {/* Sub Activities */}
          {activity.subActivities && activity.subActivities.length > 0 && (
            <div className="mt-4 space-y-2 pl-4 border-l-2 border-wedding-gold/30">
              {activity.subActivities.map((sub) => (
                <div key={sub.id} className="text-sm text-stone-600 flex items-center justify-between group/sub hover:bg-stone-50 p-1 rounded-lg transition-colors">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-wedding-gold" />
                    {editingSubId === sub.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          autoFocus
                          type="text"
                          value={language === 'ja' ? sub.nameJa || sub.name : language === 'my' ? sub.nameMy || sub.name : sub.nameEn || sub.name}
                          onBlur={() => setEditingSubId(null)}
                          onChange={(e) => onUpdateSubActivity?.(activity.id, sub.id, language === 'ja' ? 'nameJa' : language === 'my' ? 'nameMy' : 'nameEn', e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingSubId(null)}
                          className="text-sm font-medium bg-white border-wedding-olive/30 rounded px-1 focus:ring-wedding-olive focus:border-wedding-olive flex-1"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={sub.duration}
                            onChange={(e) => onUpdateSubActivity?.(activity.id, sub.id, 'duration', Number(e.target.value))}
                            className="w-12 text-xs font-mono bg-white border-wedding-olive/30 rounded px-1 focus:ring-wedding-olive focus:border-wedding-olive"
                          />
                          <span className="text-[10px] text-stone-400">m</span>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => setEditingSubId(sub.id)}
                        className="flex items-center gap-2 cursor-text hover:underline decoration-wedding-gold/30 flex-1"
                      >
                        <span className="font-medium">{language === 'ja' ? sub.nameJa || sub.name : language === 'my' ? sub.nameMy || sub.name : sub.nameEn || sub.name}</span>
                        <span className="text-xs text-stone-400 font-mono">({sub.duration}m)</span>
                      </div>
                    )}
                  </div>
                  {onRemoveSubActivity && (
                    <button 
                      onClick={() => onRemoveSubActivity(activity.id, sub.id)}
                      className="p-1 text-stone-300 hover:text-red-400 opacity-0 group-hover/sub:opacity-100 transition-all"
                      title="Remove sub-activity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onMove(index, 'up')}
            className="p-2 text-stone-400 hover:text-wedding-olive hover:bg-white rounded-full transition-colors"
            title="Move Up"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMove(index, 'down')}
            className="p-2 text-stone-400 hover:text-wedding-olive hover:bg-white rounded-full transition-colors"
            title="Move Down"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          {onMakeConcurrent && previousActivityId && (
            <button
              onClick={() => onMakeConcurrent(activity.id, previousActivityId)}
              className="p-2 text-stone-400 hover:text-wedding-gold hover:bg-white rounded-full transition-colors"
              title="Make Sub-activity"
            >
              <Layers className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onRemove(activity.id)}
            className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimelineItem;
