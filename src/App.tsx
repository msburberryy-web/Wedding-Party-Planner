import { useState, useMemo, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { addMinutes, parse, format, differenceInMinutes } from 'date-fns';
import { Download, Plus, Trash2, ArrowUp, ArrowDown, Clock, Settings, Mic, Drama, Globe, Merge, Save, Loader2, FileJson, Heart, Calendar, MapPin, Users, Sparkles } from 'lucide-react';
import { Activity, PREDEFINED_ACTIVITY_CATEGORIES } from './constants/activities';
import ActivityAccordion from './components/ActivityAccordion';
import TimelineItem from './components/TimelineItem';
import { generateWeddingExcel, TimelineActivity, WeddingMetadata } from './utils/excelGenerator';
import { generateTimelineFromPrompt } from './services/geminiService';
import { translations, Language } from './constants/translations';
import venuesList from './constants/venues.json';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];

  const [startTime, setStartTime] = useState('18:00');
  const [totalTime, setTotalTime] = useState(150); // 2.5 hours = 150 mins
  const [selectedActivities, setSelectedActivities] = useState<Activity[]>([]);
  
  // Metadata state
  const [metadata, setMetadata] = useState<WeddingMetadata>({
    date: '2026-04-12',
    venue: 'Wedding Gallery Test',
    groomName: 'Groom Name',
    groomFurigana: '',
    brideName: 'Bride Name',
    brideFurigana: '',
    guestCount: 60,
    staffName: 'May',
    mcName: 'Ko Ye',
    photographers: {
      postHairMakeup: false,
      commemorative: 'Amore Wedding Tokyo',
      snapshot: 'Amore Wedding Tokyo',
      vtr: 'Amore Wedding Tokyo'
    }
  });

  const [customActivity, setCustomActivity] = useState({ name: '', duration: 5 });

  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Persistence state
  const [planId, setPlanId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('planId');
    if (id) {
      setPlanId(id);
      // Try API first
      fetch(`/api/plans/${id}`)
        .then(res => {
            if (!res.ok) throw new Error('Plan not found in API');
            return res.json();
        })
        .then(data => {
          if (data.data) {
            if (data.data.activities) setSelectedActivities(data.data.activities);
            if (data.data.metadata) setMetadata(data.data.metadata);
            if (data.data.language) setLanguage(data.data.language);
            if (data.data.startTime) setStartTime(data.data.startTime);
            if (data.data.totalTime) setTotalTime(data.data.totalTime);
          }
        })
        .catch(err => {
          console.warn('API load failed, trying client plans folder:', err);
          // Try fetching from "client plans" folder (static hosting fallback)
          return fetch(`./client plans/${id}.json`)
            .then(res => {
              if (!res.ok) throw new Error('Plan not found in client plans folder');
              return res.json();
            })
            .then(data => {
              if (data.activities) setSelectedActivities(data.activities);
              if (data.metadata) setMetadata(data.metadata);
              if (data.language) setLanguage(data.language);
              if (data.startTime) setStartTime(data.startTime);
              if (data.totalTime) setTotalTime(data.totalTime);
            })
            .catch(err2 => {
              console.warn('Static file load failed, trying local storage:', err2);
              const localData = localStorage.getItem(`plan_${id}`);
              if (localData) {
                const data = JSON.parse(localData);
                if (data.activities) setSelectedActivities(data.activities);
                if (data.metadata) setMetadata(data.metadata);
                if (data.language) setLanguage(data.language);
                if (data.startTime) setStartTime(data.startTime);
                if (data.totalTime) setTotalTime(data.totalTime);
              }
            });
        });
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const dataToSave = {
      activities: timeline,
      metadata,
      language,
      startTime,
      totalTime
    };

    const generatedId = planId || `${metadata.date}-${metadata.groomName?.trim().charAt(0).toUpperCase() || 'X'}-${metadata.brideName?.trim().charAt(0).toUpperCase() || 'Y'}`;

    try {
      // Always try to save to local storage as a fallback
      localStorage.setItem(`plan_${generatedId}`, JSON.stringify(dataToSave));

      if (planId) {
        await fetch(`/api/plans/${planId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: dataToSave })
        });
      } else {
        const res = await fetch('/api/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: dataToSave, id: generatedId })
        });
        const result = await res.json();
        if (result.id) {
          setPlanId(result.id);
          const newUrl = `${window.location.pathname}?planId=${result.id}`;
          window.history.pushState({ path: newUrl }, '', newUrl);
        }
      }
      setLastSaved(new Date());
    } catch (error) {
      console.warn('Backend save failed, saved to local storage only:', error);
      if (!planId) {
        setPlanId(generatedId);
        const newUrl = `${window.location.pathname}?planId=${generatedId}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
      }
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportJson = () => {
    const dataToSave = {
      activities: timeline,
      metadata,
      language,
      startTime,
      totalTime
    };
    const fileName = planId || `${metadata.date}-${metadata.groomName?.trim().charAt(0).toUpperCase() || 'X'}-${metadata.brideName?.trim().charAt(0).toUpperCase() || 'Y'}`;
    const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (data.activities) setSelectedActivities(data.activities);
        if (data.metadata) setMetadata(data.metadata);
        if (data.language) setLanguage(data.language);
        if (data.startTime) setStartTime(data.startTime);
        if (data.totalTime) setTotalTime(data.totalTime);
        
        // Reset file input
        event.target.value = '';
      } catch (err) {
        console.error('Failed to parse JSON:', err);
        alert('Invalid plan file.');
      }
    };
    reader.readAsText(file);
  };

  // Calculate timeline
  const timeline: TimelineActivity[] = useMemo(() => {
    try {
      const mainStart = parse(startTime, 'HH:mm', new Date());
      
      if (selectedActivities.length === 0) return [];

      const calculated: TimelineActivity[] = new Array(selectedActivities.length);
      
      // Find the anchor: the first activity that is NOT prep.
      // If all are prep, or all are main, anchor is 0.
      let anchorIndex = selectedActivities.findIndex(a => !a.isPrep);
      if (anchorIndex === -1) anchorIndex = 0;

      // Calculate forwards from anchor
      let currentMain = mainStart;
      for (let i = anchorIndex; i < selectedActivities.length; i++) {
        const act = selectedActivities[i];
        const start = format(currentMain, 'HH:mm');
        const actStart = currentMain;
        currentMain = addMinutes(currentMain, act.duration);
        const end = format(currentMain, 'HH:mm');

        // Calculate Sub-activities
        const subActivities = act.subActivities?.map(sub => {
            const subStart = addMinutes(actStart, sub.startOffset || 0);
            const subEnd = addMinutes(subStart, sub.duration);
            return {
                ...sub,
                startTime: format(subStart, 'HH:mm'),
                endTime: format(subEnd, 'HH:mm')
            };
        });

        calculated[i] = { ...act, startTime: start, endTime: end, subActivities };
      }

      // Calculate backwards from anchor
      let currentPrep = mainStart;
      for (let i = anchorIndex - 1; i >= 0; i--) {
        const act = selectedActivities[i];
        const end = format(currentPrep, 'HH:mm');
        currentPrep = addMinutes(currentPrep, -act.duration);
        const start = format(currentPrep, 'HH:mm');
        const actStart = currentPrep;

        // Calculate Sub-activities
        const subActivities = act.subActivities?.map(sub => {
            const subStart = addMinutes(actStart, sub.startOffset || 0);
            const subEnd = addMinutes(subStart, sub.duration);
            return {
                ...sub,
                startTime: format(subStart, 'HH:mm'),
                endTime: format(subEnd, 'HH:mm')
            };
        });

        calculated[i] = { ...act, startTime: start, endTime: end, subActivities };
      }

      return calculated;
    } catch (e) {
      return [];
    }
  }, [startTime, selectedActivities]);

  const usedTime = selectedActivities
    .filter(a => !a.isPrep)
    .reduce((acc, curr) => acc + curr.duration, 0);
  const remainingTime = totalTime - usedTime;

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const handleAddPredefined = (activity: Activity) => {
    setSelectedActivities([...selectedActivities, { ...activity, id: generateId() }]);
  };

  const handleAddCustom = () => {
    if (!customActivity.name) return;
    setSelectedActivities([
      ...selectedActivities,
      {
        id: generateId(),
        name: customActivity.name,
        duration: customActivity.duration,
        isOptional: false,
      }
    ]);
    setCustomActivity({ name: '', duration: 5 });
  };

  const handleAddSubActivity = (parentId: string) => {
      setSelectedActivities(selectedActivities.map(act => {
          if (act.id === parentId) {
              return {
                  ...act,
                  subActivities: [
                      ...(act.subActivities || []),
                      {
                          id: generateId(),
                          name: 'New Activity',
                          duration: 10,
                          startOffset: 0,
                          isOptional: false
                      }
                  ]
              };
          }
          return act;
      }));
  };

  const handleUpdateSubActivity = (parentId: string, subId: string, field: string, value: any) => {
      setSelectedActivities(selectedActivities.map(act => {
          if (act.id === parentId && act.subActivities) {
              return {
                  ...act,
                  subActivities: act.subActivities.map(sub => 
                      sub.id === subId ? { ...sub, [field]: value } : sub
                  )
              };
          }
          return act;
      }));
  };

  const handleMakeConcurrent = (activityId: string, parentId: string) => {
    const activityIndex = selectedActivities.findIndex(a => a.id === activityId);
    const parentIndex = selectedActivities.findIndex(a => a.id === parentId);
    
    if (activityIndex === -1 || parentIndex === -1) return;
    
    const activity = selectedActivities[activityIndex];
    
    // Calculate offset based on timeline positions
    const timelineActivity = timeline.find(a => a.id === activityId);
    const timelineParent = timeline.find(a => a.id === parentId);
    
    if (!timelineActivity || !timelineParent) return;
    
    const start = parse(timelineActivity.startTime, 'HH:mm', new Date());
    const parentStart = parse(timelineParent.startTime, 'HH:mm', new Date());
    const offset = differenceInMinutes(start, parentStart);
    
    const newSubActivity = {
      ...activity,
      startOffset: Math.max(0, offset),
      subActivities: undefined // Flatten nested subs
    };
    
    const newActivities = [...selectedActivities];
    newActivities.splice(activityIndex, 1);
    
    const newParentIndex = newActivities.findIndex(a => a.id === parentId);
    if (newParentIndex !== -1) {
        const updatedParent = {
            ...newActivities[newParentIndex],
            subActivities: [...(newActivities[newParentIndex].subActivities || []), newSubActivity]
        };
        newActivities[newParentIndex] = updatedParent;
        setSelectedActivities(newActivities);
    }
  };

  const handleRemoveSubActivity = (parentId: string, subId: string) => {
      setSelectedActivities(selectedActivities.map(act => {
          if (act.id === parentId && act.subActivities) {
              return {
                  ...act,
                  subActivities: act.subActivities.filter(sub => sub.id !== subId)
              };
          }
          return act;
      }));
  };

  const handleRemove = (id: string) => {
    setSelectedActivities(selectedActivities.filter(a => a.id !== id));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === selectedActivities.length - 1)
    ) return;

    const newActivities = [...selectedActivities];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newActivities[index], newActivities[targetIndex]] = [newActivities[targetIndex], newActivities[index]];
    setSelectedActivities(newActivities);
  };

  const handleUpdateStartTime = (newStartTime: string, activityId: string) => {
    const actIndex = timeline.findIndex(a => a.id === activityId);
    if (actIndex === -1) return;

    try {
      const newStart = parse(newStartTime, 'HH:mm', new Date());
      
      // Calculate how many minutes from the global startTime this activity currently starts
      const currentStart = parse(timeline[actIndex].startTime, 'HH:mm', new Date());
      const globalStart = parse(startTime, 'HH:mm', new Date());
      const offsetMinutes = differenceInMinutes(currentStart, globalStart);
      
      // The new global start time should be newStart - offsetMinutes
      const newGlobalStart = addMinutes(newStart, -offsetMinutes);
      setStartTime(format(newGlobalStart, 'HH:mm'));
    } catch (e) {
      console.error('Invalid time format', e);
    }
  };

  const handleUpdateDuration = (id: string, newDuration: number) => {
    setSelectedActivities(selectedActivities.map(a => 
      a.id === id ? { ...a, duration: newDuration } : a
    ));
  };

  const handleUpdateActivity = (id: string, updates: Partial<Activity>) => {
    setSelectedActivities(selectedActivities.map(a => 
      a.id === id ? { ...a, ...updates } : a
    ));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedActivities((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleExport = () => {
    if (!timeline) return;
    
    // Create a copy of metadata for export
    const exportMetadata = {
      ...metadata,
      staffName: metadata.staffName === 'Others' ? 'その他' : metadata.staffName,
      mcName: metadata.mcName === 'Others' ? 'その他' : metadata.mcName,
    };

    // Create a copy of timeline with Japanese names for export
    const exportTimeline = timeline.map(act => ({
      ...act,
      name: act.nameJa || act.name, // Prefer Japanese name
      subActivities: act.subActivities?.map(sub => ({
        ...sub,
        name: sub.nameJa || sub.name
      }))
    }));
    generateWeddingExcel(exportMetadata, exportTimeline);
  };

  const handleGenerateAiTimeline = async () => {
    setAiError(null);
    setIsGenerating(true);
    try {
      const activityIds = await generateTimelineFromPrompt(aiPrompt, totalTime);

      const allActivities = PREDEFINED_ACTIVITY_CATEGORIES.flatMap(c => c.activities);
      const newActivities = activityIds
        .map(id => allActivities.find(a => a.id === id))
        .filter((a): a is Activity => !!a)
        .map(a => ({ ...a, id: generateId() }));

      setSelectedActivities(newActivities);
      setAiPrompt('');
    } catch (error: any) {
      setAiError(error.message || 'An unknown error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-wedding-stone text-wedding-ink font-sans">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-lg border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-wedding-gold fill-wedding-gold" />
              <h1 className="text-3xl font-serif font-bold tracking-tight text-wedding-olive">{t.title}</h1>
              <div className="h-4 w-px bg-stone-200 mx-2 hidden sm:block" />
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest hidden sm:block">By Amore Wedding Tokyo</span>
            </div>
            {metadata.groomName && metadata.brideName && (
              <p className="text-xs text-stone-400 uppercase tracking-widest mt-1 ml-7 font-medium">
                {metadata.groomName} & {metadata.brideName}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Language & Stats */}
            <div className="hidden md:flex items-center gap-6 mr-4">
              <div className="flex items-center gap-2 bg-stone-100 rounded-full px-4 py-1.5">
                <Globe className="w-4 h-4 text-stone-400" />
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="text-xs border-none bg-transparent focus:ring-0 cursor-pointer font-medium text-stone-600 py-0 pl-0 pr-6"
                >
                  <option value="en">EN</option>
                  <option value="ja">JP</option>
                  <option value="my">MY</option>
                </select>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-stone-400 uppercase tracking-tighter">{t.used}</span>
                  <span className={`font-bold ${usedTime > totalTime ? 'text-red-500' : 'text-wedding-olive'}`}>{usedTime}m</span>
                </div>
                <div className="w-px h-6 bg-stone-200" />
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-stone-400 uppercase tracking-tighter">{t.remaining}</span>
                  <span className={`font-bold ${remainingTime < 0 ? 'text-red-500' : 'text-emerald-600'}`}>{remainingTime}m</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                id="import-json"
                className="hidden"
                accept=".json"
                onChange={handleImportJson}
              />
              <button
                onClick={() => document.getElementById('import-json')?.click()}
                className="p-2.5 text-stone-500 hover:text-wedding-olive hover:bg-white rounded-full transition-all border border-transparent hover:border-stone-200"
                title="Import JSON"
              >
                <Plus className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleExportJson}
                className="p-2.5 text-stone-500 hover:text-wedding-olive hover:bg-white rounded-full transition-all border border-transparent hover:border-stone-200"
                title="Export JSON"
              >
                <FileJson className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-wedding-olive text-white rounded-full text-sm font-medium hover:bg-opacity-90 transition-all shadow-sm disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>

              <button
                onClick={handleExport}
                disabled={selectedActivities.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-wedding-gold text-white rounded-full text-sm font-medium hover:bg-opacity-90 transition-all shadow-sm disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Excel</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Sidebar - Configuration & Available Activities */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Settings Card */}
            <div className="glass-card rounded-[2rem] p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-wedding-olive/10 rounded-lg">
                  <Settings className="w-5 h-5 text-wedding-olive" />
                </div>
                <h2 className="font-serif font-bold text-xl">{t.configuration}</h2>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 mb-2 uppercase tracking-widest">
                      <Clock className="w-3 h-3" />
                      {t.startTime}
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-white/50 border-stone-200 rounded-xl shadow-sm focus:border-wedding-olive focus:ring-wedding-olive text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 mb-2 uppercase tracking-widest">
                      <Sparkles className="w-3 h-3" />
                      {t.totalTime}
                    </label>
                    <select
                      value={totalTime}
                      onChange={(e) => setTotalTime(Number(e.target.value))}
                      className="w-full bg-white/50 border-stone-200 rounded-xl shadow-sm focus:border-wedding-olive focus:ring-wedding-olive text-sm font-medium"
                    >
                      <option value={120}>2 Hours</option>
                      <option value={150}>2.5 Hours</option>
                      <option value={180}>3 Hours</option>
                      <option value={210}>3.5 Hours</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 border-t border-stone-100">
                  <h3 className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 mb-3 uppercase tracking-widest">
                    <Sparkles className="w-3 h-3 text-wedding-gold" />
                    {t.autoPlan}
                  </h3>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., A modern 3-hour wedding with a focus on entertainment and guest interaction."
                    className="w-full text-sm bg-white/50 border-stone-200 rounded-xl shadow-sm focus:border-wedding-olive focus:ring-wedding-olive placeholder:text-stone-300"
                    rows={3}
                  />
                  <button
                    onClick={handleGenerateAiTimeline}
                    disabled={isGenerating || !aiPrompt}
                    className="w-full mt-3 bg-wedding-olive text-white px-4 py-3 text-sm rounded-xl hover:bg-opacity-90 disabled:opacity-50 transition-all flex items-center justify-center font-medium shadow-sm"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : <Sparkles className="w-4 h-4 mr-2" />}
                    {isGenerating ? t.generating : t.generatePlan}
                  </button>
                  {aiError && <p className="text-xs text-red-500 mt-2 text-center">{aiError}</p>}
                </div>

                <div className="pt-6 border-t border-stone-100">
                  <h3 className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 mb-4 uppercase tracking-widest">
                    <Calendar className="w-3 h-3" />
                    {t.eventDetails}
                  </h3>
                  <div className="space-y-6">
                    
                    {/* Venue */}
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 mb-2 uppercase tracking-widest">{t.venue}</label>
                      <div className="relative mb-2">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                        <select
                          value={venuesList.includes(metadata.venue) ? metadata.venue : 'Others'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMetadata({ ...metadata, venue: val === 'Others' ? '' : val });
                          }}
                          className="w-full pl-10 bg-white/50 border-stone-200 rounded-xl shadow-sm focus:border-wedding-olive focus:ring-wedding-olive text-sm font-medium appearance-none"
                        >
                          <option value="" disabled>Select a venue...</option>
                          {venuesList.map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                          <option value="Others">{t.others || 'Others'}</option>
                        </select>
                      </div>
                      {(!venuesList.includes(metadata.venue)) && (
                        <input
                          type="text"
                          placeholder="Enter Custom Venue"
                          value={metadata.venue}
                          onChange={e => setMetadata({...metadata, venue: e.target.value})}
                          className="w-full bg-white/50 border-stone-200 rounded-xl shadow-sm focus:border-wedding-olive focus:ring-wedding-olive text-sm font-medium animate-in fade-in slide-in-from-top-1"
                        />
                      )}
                    </div>

                    {/* Date & Guests */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 mb-2 uppercase tracking-widest">{t.date}</label>
                        <input
                          type="date"
                          value={metadata.date}
                          onChange={e => setMetadata({...metadata, date: e.target.value})}
                          className="w-full bg-white/50 border-stone-200 rounded-xl shadow-sm focus:border-wedding-olive focus:ring-wedding-olive text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 mb-2 uppercase tracking-widest">{t.guestCount}</label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                          <input
                            type="number"
                            value={metadata.guestCount}
                            onChange={e => setMetadata({...metadata, guestCount: Number(e.target.value)})}
                            className="w-full pl-10 bg-white/50 border-stone-200 rounded-xl shadow-sm focus:border-wedding-olive focus:ring-wedding-olive text-sm font-medium"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Couple */}
                    <div className="space-y-4 bg-white/40 p-5 rounded-2xl border border-stone-100">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        <Heart className="w-3 h-3 text-wedding-gold" />
                        {t.theCouple}
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-medium text-stone-400 mb-1">{t.groomName}</label>
                          <input
                            type="text"
                            value={metadata.groomName}
                            onChange={e => setMetadata({...metadata, groomName: e.target.value})}
                            className="w-full bg-white/50 border-stone-200 rounded-xl shadow-sm focus:border-wedding-olive focus:ring-wedding-olive text-sm font-medium"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-medium text-stone-400 mb-1">Furigana</label>
                          <input
                            type="text"
                            value={metadata.groomFurigana || ''}
                            onChange={e => setMetadata({...metadata, groomFurigana: e.target.value})}
                            className="w-full bg-white/50 border-stone-200 rounded-xl shadow-sm focus:border-wedding-olive focus:ring-wedding-olive text-sm font-medium"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-medium text-stone-400 mb-1">{t.brideName}</label>
                          <input
                            type="text"
                            value={metadata.brideName}
                            onChange={e => setMetadata({...metadata, brideName: e.target.value})}
                            className="w-full bg-white/50 border-stone-200 rounded-xl shadow-sm focus:border-wedding-olive focus:ring-wedding-olive text-sm font-medium"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-medium text-stone-400 mb-1">Furigana</label>
                          <input
                            type="text"
                            value={metadata.brideFurigana || ''}
                            onChange={e => setMetadata({...metadata, brideFurigana: e.target.value})}
                            className="w-full bg-white/50 border-stone-200 rounded-xl shadow-sm focus:border-wedding-olive focus:ring-wedding-olive text-sm font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Staff & Operations */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Operations Team</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-medium text-stone-400 mb-1.5">Planner (Staff)</label>
                          <select
                            value={['May'].includes(metadata.staffName) ? metadata.staffName : 'Others'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMetadata({ ...metadata, staffName: val === 'Others' ? '' : val });
                            }}
                            className="w-full bg-white/50 border-stone-200 rounded-xl shadow-sm focus:border-wedding-olive focus:ring-wedding-olive text-sm font-medium mb-2"
                          >
                            <option value="May">{t.may}</option>
                            <option value="Others">{t.others}</option>
                          </select>
                          {(!['May'].includes(metadata.staffName)) && (
                            <input
                              type="text"
                              placeholder="Enter Staff Name"
                              value={metadata.staffName}
                              onChange={e => setMetadata({...metadata, staffName: e.target.value})}
                              className="w-full bg-white/50 border-stone-200 rounded-xl shadow-sm focus:border-wedding-olive focus:ring-wedding-olive text-sm font-medium animate-in fade-in slide-in-from-top-1"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-stone-400 mb-1.5">Master of Ceremonies</label>
                          <select
                            value={['Ye Ziel', 'Antt Minn', 'Myo Nyunt'].includes(metadata.mcName) ? metadata.mcName : 'Others'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMetadata({ ...metadata, mcName: val === 'Others' ? '' : val });
                            }}
                            className="w-full bg-white/50 border-stone-200 rounded-xl shadow-sm focus:border-wedding-olive focus:ring-wedding-olive text-sm font-medium mb-2"
                          >
                            <option value="Ye Ziel">Ye Ziel</option>
                            <option value="Antt Minn">Antt Minn</option>
                            <option value="Myo Nyunt">Myo Nyunt</option>
                            <option value="Others">{t.others}</option>
                          </select>
                          {(!['Ye Ziel', 'Antt Minn', 'Myo Nyunt'].includes(metadata.mcName)) && (
                            <input
                              type="text"
                              placeholder="Enter MC Name"
                              value={metadata.mcName}
                              onChange={e => setMetadata({...metadata, mcName: e.target.value})}
                              className="w-full bg-white/50 border-stone-200 rounded-xl shadow-sm focus:border-wedding-olive focus:ring-wedding-olive text-sm font-medium animate-in fade-in slide-in-from-top-1"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Photographers */}
                    <div className="pt-3 border-t border-black/5">
                        <h4 className="text-xs font-medium text-stone-500 mb-3 uppercase tracking-wider font-sans-body">{t.mediaPhotos}</h4>
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm text-stone-700 bg-stone-50 p-2 rounded-lg border border-stone-200 cursor-pointer hover:bg-stone-100 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={metadata.photographers?.postHairMakeup || false}
                                    onChange={e => setMetadata({
                                        ...metadata,
                                        photographers: { ...metadata.photographers!, postHairMakeup: e.target.checked }
                                    })}
                                    className="rounded border-stone-300 text-[#5A5A40] focus:ring-[#5A5A40]"
                                />
                                <span className="font-medium">{t.postHairMakeup}</span>
                            </label>
                            
                            <div className="grid grid-cols-1 gap-3">
                              <div>
                                <label className="block text-[10px] font-medium text-stone-500 mb-1">{t.commemorativePhoto}</label>
                                <input
                                    type="text"
                                    value={metadata.photographers?.commemorative || ''}
                                    onChange={e => setMetadata({
                                        ...metadata,
                                        photographers: { ...metadata.photographers!, commemorative: e.target.value }
                                    })}
                                    className="w-full text-sm border-stone-300 rounded-lg shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] font-sans-body"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-medium text-stone-500 mb-1">{t.snapshot}</label>
                                <input
                                    type="text"
                                    value={metadata.photographers?.snapshot || ''}
                                    onChange={e => setMetadata({
                                        ...metadata,
                                        photographers: { ...metadata.photographers!, snapshot: e.target.value }
                                    })}
                                    className="w-full text-sm border-stone-300 rounded-lg shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] font-sans-body"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-medium text-stone-500 mb-1">{t.vtr}</label>
                                <input
                                    type="text"
                                    value={metadata.photographers?.vtr || ''}
                                    onChange={e => setMetadata({
                                        ...metadata,
                                        photographers: { ...metadata.photographers!, vtr: e.target.value }
                                    })}
                                    className="w-full text-sm border-stone-300 rounded-lg shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] font-sans-body"
                                />
                              </div>
                            </div>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Library Card */}
            <div className="glass-card rounded-[2rem] p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-wedding-olive/10 rounded-lg">
                  <Plus className="w-5 h-5 text-wedding-olive" />
                </div>
                <h2 className="font-serif font-bold text-xl">{t.activityLibrary}</h2>
              </div>
              <div className="overflow-y-auto -mr-2 pr-2 max-h-[45vh]">
                <ActivityAccordion categories={PREDEFINED_ACTIVITY_CATEGORIES} onAddActivity={handleAddPredefined} language={language} />
              </div>
            </div>

            {/* Add Custom Activity Card */}
            <div className="glass-card rounded-[2rem] p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-wedding-olive/10 rounded-lg">
                  <Plus className="w-5 h-5 text-wedding-olive" />
                </div>
                <h2 className="font-serif font-bold text-xl">{t.addActivity}</h2>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Activity name..."
                  value={customActivity.name}
                  onChange={(e) => setCustomActivity({ ...customActivity, name: e.target.value })}
                  className="flex-1 bg-white/50 border-stone-200 rounded-xl shadow-sm focus:border-wedding-olive focus:ring-wedding-olive text-sm font-medium"
                />
                <div className="relative w-24">
                  <input
                    type="number"
                    min="1"
                    value={customActivity.duration}
                    onChange={(e) => setCustomActivity({ ...customActivity, duration: Number(e.target.value) })}
                    className="w-full bg-white/50 border-stone-200 rounded-xl shadow-sm focus:border-wedding-olive focus:ring-wedding-olive text-sm font-medium pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 font-mono">m</span>
                </div>
                <button
                  onClick={handleAddCustom}
                  disabled={!customActivity.name}
                  className="bg-wedding-olive text-white p-3 rounded-xl hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Main Area - Timeline */}
          <div className="lg:col-span-8">
            <div className="glass-card rounded-[2.5rem] overflow-hidden min-h-[600px] flex flex-col">
              <div className="px-8 py-6 border-b border-stone-100 bg-white/30 backdrop-blur-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-wedding-olive text-white rounded-lg shadow-sm">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h2 className="font-serif font-bold text-2xl text-wedding-olive">{t.timelineSection}</h2>
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-stone-100 rounded-full text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                  <Sparkles className="w-3 h-3 text-wedding-gold" />
                  {selectedActivities.length} {selectedActivities.length === 1 ? 'Activity' : 'Activities'}
                </div>
              </div>
              
              <div className="flex-1 p-4 sm:p-8">
                {timeline.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative mb-8"
                    >
                      <div className="absolute inset-0 bg-wedding-gold/20 blur-3xl rounded-full" />
                      <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-xl text-wedding-gold">
                        <Heart className="w-12 h-12 fill-wedding-gold/10" />
                      </div>
                    </motion.div>
                    <h3 className="font-serif text-3xl text-wedding-ink mb-4">Your timeline is a blank canvas</h3>
                    <p className="text-stone-400 max-w-sm mx-auto leading-relaxed">
                      Every great wedding starts with a plan. Add activities from the library or use our AI generator to begin your journey.
                    </p>
                  </div>
                ) : (
                  <div className="relative space-y-4">
                    <DndContext 
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext 
                        items={timeline.map(a => a.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <AnimatePresence mode="popLayout">
                          {timeline.map((act, index) => (
                            <TimelineItem
                              key={act.id}
                              activity={act}
                              index={index}
                              language={language}
                              onRemove={handleRemove}
                              onMove={handleMove}
                              onUpdateDuration={handleUpdateDuration}
                              onUpdateStartTime={handleUpdateStartTime}
                              onUpdateActivity={handleUpdateActivity}
                              onUpdateSubActivity={handleUpdateSubActivity}
                              onMakeConcurrent={handleMakeConcurrent}
                              onRemoveSubActivity={handleRemoveSubActivity}
                              previousActivityId={index > 0 ? timeline[index - 1].id : undefined}
                            />
                          ))}
                        </AnimatePresence>
                      </SortableContext>
                    </DndContext>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-stone-200">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-stone-400">
            <Sparkles className="w-4 h-4 text-wedding-gold" />
            <span className="text-xs font-medium uppercase tracking-[0.2em]">Created by</span>
            <span className="text-sm font-serif font-bold text-wedding-olive tracking-wide">Amore Wedding Tokyo</span>
          </div>
          <p className="text-[10px] text-stone-300 uppercase tracking-widest font-medium">
            &copy; {new Date().getFullYear()} All Rights Reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
