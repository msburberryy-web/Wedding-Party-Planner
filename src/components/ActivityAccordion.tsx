import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Plus, Mic, Drama, Star } from 'lucide-react';
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
    <div className="space-y-3">
      {categories.map((category) => (
        <div key={category.name} className="overflow-hidden">
          <button
            onClick={() => toggleCategory(category.name)}
            className={`w-full flex items-center justify-between py-3 px-4 text-left font-serif font-medium text-lg transition-colors rounded-xl ${
              openCategory === category.name ? 'bg-wedding-olive text-white' : 'hover:bg-wedding-olive/5 text-wedding-ink'
            }`}
          >
            <span>{category.name}</span>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${openCategory === category.name ? 'rotate-180' : 'opacity-50'}`}
            />
          </button>
          
          <AnimatePresence>
            {openCategory === category.name && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="py-3 space-y-2 px-1">
                  {category.activities.map((act) => (
                    <div key={act.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-stone-100 hover:border-wedding-olive/30 hover:shadow-sm transition-all group">
                      <div className="pr-4">
                        <p className="text-sm font-medium text-wedding-ink">
                          {language === 'ja' ? (act.nameJa || act.name) : language === 'my' ? (act.nameMy || act.name) : (act.nameEn || act.name)}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">{act.duration} min</span>
                          {act.isImportant && <Star className="w-3 h-3 fill-wedding-gold text-wedding-gold" />}
                          {act.needsMic && <Mic className="w-3 h-3 text-wedding-gold" />}
                          {act.onStage && <Drama className="w-3 h-3 text-wedding-olive" />}
                        </div>
                      </div>
                      <button
                        onClick={() => onAddActivity(act)}
                        className="p-2 text-stone-400 hover:text-wedding-olive hover:bg-wedding-olive/10 rounded-full transition-colors shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

