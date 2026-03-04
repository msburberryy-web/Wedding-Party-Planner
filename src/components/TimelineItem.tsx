import React from 'react';
import { motion } from 'motion/react';
import { Clock, MapPin, User, Mic, Trash2, ArrowUp, ArrowDown, Star, MessageSquare } from 'lucide-react';
import { TimelineActivity } from '../utils/excelGenerator';
import { Language, translations } from '../constants/translations';

interface TimelineItemProps {
  activity: TimelineActivity;
  index: number;
  language: Language;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onUpdateDuration: (id: string, duration: number) => void;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  activity,
  index,
  language,
  onRemove,
  onMove,
  onUpdateDuration
}) => {
  const t = translations[language];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`relative pl-12 pr-4 py-6 group transition-all ${
        activity.isImportant ? 'bg-wedding-olive/5' : 'hover:bg-white/50'
      }`}
    >
      {/* Timeline Connector */}
      <div className="timeline-line" />
      <div className={`timeline-dot ${activity.isImportant ? 'scale-150 ring-4 ring-wedding-olive/20' : ''}`} />

      <div className="flex flex-col md:flex-row md:items-start gap-4">
        {/* Time and Duration */}
        <div className="flex flex-col min-w-[100px]">
          <span className="text-lg font-mono font-medium text-wedding-olive">
            {activity.startTime}
          </span>
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
            <h3 className={`text-lg font-serif font-semibold ${activity.isImportant ? 'text-wedding-olive' : 'text-wedding-ink'}`}>
              {language === 'ja' ? activity.nameJa || activity.name : language === 'my' ? activity.nameMy || activity.name : activity.nameEn || activity.name}
            </h3>
            {activity.isImportant && (
              <Star className="w-4 h-4 fill-wedding-gold text-wedding-gold" />
            )}
            {activity.needsMic && (
              <Mic className="w-3.5 h-3.5 text-wedding-gold" title={t.micNeeded} />
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
            {activity.responsible && (
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <User className="w-3.5 h-3.5" />
                <span className="font-medium uppercase tracking-wider">{activity.responsible}</span>
              </div>
            )}
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
            <div className="mt-4 space-y-2 pl-4 border-l-2 border-stone-100">
              {activity.subActivities.map((sub) => (
                <div key={sub.id} className="text-sm text-stone-600 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                  <span>{language === 'ja' ? sub.nameJa || sub.name : language === 'my' ? sub.nameMy || sub.name : sub.nameEn || sub.name}</span>
                  <span className="text-xs text-stone-400 font-mono">({sub.duration}m)</span>
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
          <button
            onClick={() => onRemove(activity.id)}
            className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TimelineItem;
