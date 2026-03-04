import { useState } from 'react';
import { ChevronDown, Plus, Mic, Drama } from 'lucide-react';
import { Activity, ActivityCategory } from '../constants/activities';
import { Language } from '../constants/translations';

interface ActivityAccordionProps {
  categories: ActivityCategory[];
  onAddActivity: (activity: Activity) => void;
  language: Language;
}

export default function ActivityAccordion({ categories, onAddActivity, language }: ActivityAccordionProps) {
  const [openCategory, setOpenCategory] = useState<string | null>(categories[0]?.name || null);

  const toggleCategory = (name: string) => {
    setOpenCategory(openCategory === name ? null : name);
  };

  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <div key={category.name} className="border-b border-black/5 last:border-b-0">
          <button
            onClick={() => toggleCategory(category.name)}
            className="w-full flex items-center justify-between py-3 text-left font-sans-body font-medium"
          >
            <span>{category.name}</span>
            <ChevronDown
              className={`w-5 h-5 text-stone-400 transition-transform ${openCategory === category.name ? 'rotate-180' : ''}`}
            />
          </button>
          {openCategory === category.name && (
            <div className="pb-2 space-y-2">
              {category.activities.map((act) => (
                <div key={act.id} className="flex items-center justify-between p-3 bg-stone-50/80 rounded-xl border border-stone-100 hover:border-[#5A5A40]/30 transition-colors group">
                  <div className="pr-4">
                    <p className="text-sm font-medium text-stone-800 line-clamp-2">
                      {language === 'ja' ? (act.nameJa || act.name) : language === 'my' ? (act.nameMy || act.name) : (act.nameEn || act.name)}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-stone-500 font-sans-body">{act.duration} min</span>
                      {act.isOptional && (
                        <span className="text-[10px] uppercase tracking-wider bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded font-sans-body">Optional</span>
                      )}
                      {act.needsMic && <Mic className="w-3.5 h-3.5 text-blue-500" title="Microphone Needed" />}
                      {act.onStage && <Drama className="w-3.5 h-3.5 text-purple-500" title="On Stage" />}
                    </div>
                  </div>
                  <button
                    onClick={() => onAddActivity(act)}
                    className="p-2 text-stone-400 hover:text-[#5A5A40] hover:bg-[#5A5A40]/10 rounded-full transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
