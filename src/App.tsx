import { useState, useMemo, useEffect } from 'react';
import { addMinutes, parse, format, differenceInMinutes } from 'date-fns';
import { Download, Plus, Trash2, ArrowUp, ArrowDown, Clock, Settings, Mic, Drama, Globe, Merge, Save, Loader2, FileJson } from 'lucide-react';
import { Activity, PREDEFINED_ACTIVITY_CATEGORIES } from './constants/activities';
import ActivityAccordion from './components/ActivityAccordion';
import { generateWeddingExcel, TimelineActivity, WeddingMetadata } from './utils/excelGenerator';
import { generateTimelineFromPrompt } from './services/geminiService';
import { translations, Language } from './constants/translations';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];

  const [startTime, setStartTime] = useState('18:00');
  const [totalTime, setTotalTime] = useState(150); // 2.5 hours = 150 mins
  const [selectedActivities, setSelectedActivities] = useState<Activity[]>([]);
  
  // Metadata state
  const [metadata, setMetadata] = useState<WeddingMetadata>({
    date: '2026-04-12',
    venue: 'East Gallery 5F',
    groomName: 'Man Zaw Nyein',
    groomFurigana: '',
    brideName: 'Chit Su Hlaing',
    brideFurigana: '',
    guestCount: 60,
    staffName: 'EI EI',
    mcName: 'Myo Nyunt',
    photographers: {
      postHairMakeup: false,
      commemorative: 'ファイブシーズン',
      snapshot: 'ファイブシーズン',
      vtr: 'ポイントゼロ'
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
            })
            .catch(err2 => {
              console.warn('Static file load failed, trying local storage:', err2);
              const localData = localStorage.getItem(`plan_${id}`);
              if (localData) {
                const data = JSON.parse(localData);
                if (data.activities) setSelectedActivities(data.activities);
                if (data.metadata) setMetadata(data.metadata);
                if (data.language) setLanguage(data.language);
              }
            });
        });
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const dataToSave = {
      activities: selectedActivities,
      metadata,
      language
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
      activities: selectedActivities,
      metadata,
      language
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

  // Calculate timeline
  const timeline: TimelineActivity[] = useMemo(() => {
    try {
      const mainStart = parse(startTime, 'HH:mm', new Date());
      
      // Separate prep and main activities
      const prepActivities = selectedActivities.filter(a => a.isPrep);
      const mainActivities = selectedActivities.filter(a => !a.isPrep);

      // Calculate Prep Activities (Backwards from start time)
      let currentPrep = mainStart;
      const calculatedPrep = prepActivities.slice().reverse().map(act => {
        const end = format(currentPrep, 'HH:mm');
        currentPrep = addMinutes(currentPrep, -act.duration);
        const start = format(currentPrep, 'HH:mm');
        return { ...act, startTime: start, endTime: end };
      }).reverse();

      // Calculate Main Activities (Forwards from start time)
      let currentMain = mainStart;
      const calculatedMain = mainActivities.map(act => {
        const start = format(currentMain, 'HH:mm');
        const actStart = currentMain; // Store for sub-activities
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

        return { ...act, startTime: start, endTime: end, subActivities };
      });

      return [...calculatedPrep, ...calculatedMain];
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

  const handleUpdateDuration = (id: string, newDuration: number) => {
    setSelectedActivities(selectedActivities.map(a => 
      a.id === id ? { ...a, duration: newDuration } : a
    ));
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
    <div className="min-h-screen bg-[#f5f5f0] text-[#1a1a1a] font-serif">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-black/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight font-serif-display">{t.title}</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-stone-100 rounded-full px-3 py-1">
              <Globe className="w-4 h-4 text-stone-500" />
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="text-sm border-none bg-transparent focus:ring-0 cursor-pointer font-sans-body text-stone-600 py-0 pl-0 pr-7"
              >
                <option value="en">English</option>
                <option value="ja">日本語</option>
                <option value="my">မြန်မာ</option>
              </select>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-stone-500">{t.used}:</span>
              <span className={`font-medium ${usedTime > totalTime ? 'text-red-600' : 'text-stone-900'}`}>
                {usedTime}m
              </span>
              <span className="text-stone-300">/</span>
              <span className="text-stone-500">{t.remaining}:</span>
              <span className={`font-medium ${remainingTime < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                {remainingTime}m
              </span>
            </div>
            <button
              onClick={handleExportJson}
              className="bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 px-5 py-2.5 rounded-full text-sm font-sans font-medium transition-colors flex items-center gap-2 mr-2"
            >
              <FileJson className="w-4 h-4" />
              Export JSON
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 px-5 py-2.5 rounded-full text-sm font-sans font-medium transition-colors flex items-center gap-2 mr-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleExport}
              disabled={selectedActivities.length === 0}
              className="bg-[#5A5A40] hover:bg-[#4a4a30] disabled:bg-stone-300 text-white px-5 py-2.5 rounded-full text-sm font-sans font-medium transition-colors"
            >
              <Download className="w-4 h-4 inline-block mr-2" />
              {t.exportPlan}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Sidebar - Configuration & Available Activities */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Settings Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-black/5 p-6">
              <div className="flex items-center gap-3 mb-5">
                <Settings className="w-5 h-5 text-stone-400" />
                <h2 className="font-medium font-sans-body text-lg">{t.configuration}</h2>
              </div>
              
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider font-sans-body">{t.startTime}</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full border-stone-300 rounded-lg shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] sm:text-sm font-sans-body"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider font-sans-body">{t.totalTime}</label>
                    <select
                      value={totalTime}
                      onChange={(e) => setTotalTime(Number(e.target.value))}
                      className="w-full border-stone-300 rounded-lg shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] sm:text-sm font-sans-body"
                    >
                      <option value={120}>2 Hours (120m)</option>
                      <option value={150}>2.5 Hours (150m)</option>
                      <option value={180}>3 Hours (180m)</option>
                      <option value={210}>3.5 Hours (210m)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-5 border-t border-black/5">
                  <h3 className="text-xs font-medium text-stone-500 mb-2 uppercase tracking-wider font-sans-body">{t.autoPlan}</h3>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., A modern 3-hour wedding with a focus on entertainment and guest interaction."
                    className="w-full text-sm border-stone-300 rounded-lg shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] font-sans-body"
                    rows={3}
                  />
                  <button
                    onClick={handleGenerateAiTimeline}
                    disabled={isGenerating || !aiPrompt}
                    className="w-full mt-2 bg-[#5A5A40] text-white px-4 py-2 text-sm rounded-lg hover:bg-opacity-90 disabled:opacity-60 font-sans-body transition-all flex items-center justify-center"
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t.generating}
                      </>
                    ) : t.generatePlan}
                  </button>
                  {aiError && <p className="text-xs text-red-600 mt-2">{aiError}</p>}
                </div>

                <div className="pt-5 border-t border-black/5">
                  <h3 className="text-xs font-medium text-stone-500 mb-4 uppercase tracking-wider font-sans-body">{t.eventDetails}</h3>
                  <div className="space-y-6">
                    
                    {/* Venue */}
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1.5">{t.venue}</label>
                      <input
                        type="text"
                        placeholder="e.g. East Gallery 5F"
                        value={metadata.venue}
                        onChange={e => setMetadata({...metadata, venue: e.target.value})}
                        className="w-full text-sm border-stone-300 rounded-lg shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] font-sans-body"
                      />
                    </div>

                    {/* Date & Guests */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1.5">{t.date}</label>
                        <input
                          type="date"
                          value={metadata.date}
                          onChange={e => setMetadata({...metadata, date: e.target.value})}
                          className="w-full text-sm border-stone-300 rounded-lg shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] font-sans-body"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1.5">{t.guestCount}</label>
                        <input
                          type="number"
                          value={metadata.guestCount}
                          onChange={e => setMetadata({...metadata, guestCount: Number(e.target.value)})}
                          className="w-full text-sm border-stone-300 rounded-lg shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] font-sans-body"
                        />
                      </div>
                    </div>
                    
                    {/* Couple */}
                    <div className="space-y-3 bg-stone-50 p-3 rounded-xl border border-stone-100">
                      <p className="text-xs font-semibold text-stone-500 uppercase">{t.theCouple}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-medium text-stone-500 mb-1">{t.groomName}</label>
                          <input
                            type="text"
                            value={metadata.groomName}
                            onChange={e => setMetadata({...metadata, groomName: e.target.value})}
                            className="w-full text-sm border-stone-300 rounded-lg shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] font-sans-body"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-stone-500 mb-1">Furigana</label>
                          <input
                            type="text"
                            value={metadata.groomFurigana || ''}
                            onChange={e => setMetadata({...metadata, groomFurigana: e.target.value})}
                            className="w-full text-sm border-stone-300 rounded-lg shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] font-sans-body"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-stone-500 mb-1">{t.brideName}</label>
                          <input
                            type="text"
                            value={metadata.brideName}
                            onChange={e => setMetadata({...metadata, brideName: e.target.value})}
                            className="w-full text-sm border-stone-300 rounded-lg shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] font-sans-body"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-stone-500 mb-1">Furigana</label>
                          <input
                            type="text"
                            value={metadata.brideFurigana || ''}
                            onChange={e => setMetadata({...metadata, brideFurigana: e.target.value})}
                            className="w-full text-sm border-stone-300 rounded-lg shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] font-sans-body"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Staff & Operations */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-stone-500 uppercase">Operations Team</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-stone-600 mb-1.5">Planner (Staff)</label>
                          <select
                            value={['May'].includes(metadata.staffName) ? metadata.staffName : 'Others'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMetadata({ ...metadata, staffName: val === 'Others' ? '' : val });
                            }}
                            className="w-full text-sm border-stone-300 rounded-lg shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] font-sans-body mb-2"
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
                              className="w-full text-sm border-stone-300 rounded-lg shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] font-sans-body animate-in fade-in slide-in-from-top-1"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone-600 mb-1.5">Master of Ceremonies</label>
                          <select
                            value={['Ye Ziel', 'Antt Minn', 'Myo Nyunt'].includes(metadata.mcName) ? metadata.mcName : 'Others'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMetadata({ ...metadata, mcName: val === 'Others' ? '' : val });
                            }}
                            className="w-full text-sm border-stone-300 rounded-lg shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] font-sans-body mb-2"
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
                              className="w-full text-sm border-stone-300 rounded-lg shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] font-sans-body animate-in fade-in slide-in-from-top-1"
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
            <div className="bg-white rounded-3xl shadow-sm border border-black/5 p-6">
              <h2 className="font-medium font-sans-body text-lg mb-4">{t.activityLibrary}</h2>
              <div className="overflow-y-auto -mr-2 pr-2 max-h-[45vh]">
                <ActivityAccordion categories={PREDEFINED_ACTIVITY_CATEGORIES} onAddActivity={handleAddPredefined} language={language} />
              </div>
            </div>

            {/* Add Custom Activity Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-black/5 p-6">
              <h2 className="font-medium font-sans-body text-lg mb-4">{t.addActivity}</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Activity name..."
                  value={customActivity.name}
                  onChange={(e) => setCustomActivity({ ...customActivity, name: e.target.value })}
                  className="flex-1 text-sm border-stone-300 rounded-lg shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] font-sans-body"
                />
                <input
                  type="number"
                  min="1"
                  title="Duration in minutes"
                  value={customActivity.duration}
                  onChange={(e) => setCustomActivity({ ...customActivity, duration: Number(e.target.value) })}
                  className="w-20 text-sm border-stone-300 rounded-lg shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] font-sans-body"
                />
                <button
                  onClick={handleAddCustom}
                  disabled={!customActivity.name}
                  className="bg-stone-900 text-white px-3 py-2 rounded-lg hover:bg-stone-800 disabled:opacity-50 font-sans-body"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Main Area - Timeline */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden">
              <div className="px-6 py-4 border-b border-black/5 bg-stone-50/50 flex items-center justify-between">
                <h2 className="font-medium font-sans-body text-lg">{t.timelineSection}</h2>
                <span className="text-sm text-stone-500 font-sans-body">{selectedActivities.length} items</span>
              </div>
              
              {timeline.length === 0 ? (
                <div className="p-12 text-center text-stone-400">
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-10" />
                  <p className="font-serif-display text-xl">Your timeline is empty</p>
                  <p className="text-sm mt-2 font-sans-body">Add activities from the left panel to build your wedding plan.</p>
                </div>
              ) : (
                <div className="divide-y divide-black/5">
                  {timeline.map((act, index) => (
                    <div key={act.id} className={`p-5 flex items-start gap-5 transition-colors group ${act.isPrep ? 'bg-stone-100/50 border-b border-dashed border-stone-300' : 'hover:bg-stone-50/50 border-b border-black/5'}`}>
                      {/* Time Column */}
                      <div className="w-16 shrink-0 text-center pt-1">
                        <div className={`text-lg font-bold font-sans-body ${act.isImportant ? 'text-red-600' : act.isPrep ? 'text-stone-500' : 'text-stone-900'}`}>
                          {act.startTime}
                        </div>
                        <div className="text-xs text-stone-400 mt-1 font-sans-body">{act.duration}m</div>
                      </div>

                      {/* Content Column */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="w-full">
                            <div className="flex items-center gap-3">
                                <h3 className={`text-base font-semibold ${act.isPrep ? 'text-stone-600 italic' : 'text-stone-900'}`}>
                                  {act.isPrep && <span className="text-xs bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded mr-2 not-italic">{t.prep}</span>}
                                  {language === 'ja' ? (act.nameJa || act.name) : language === 'my' ? (act.nameMy || act.name) : (act.nameEn || act.name)}
                                </h3>
                                {act.needsMic && <Mic className="w-4 h-4 text-blue-500" title="Microphone Needed" />}
                                {act.onStage && <Drama className="w-4 h-4 text-purple-500" title="On Stage" />}
                            </div>
                            <div className="mt-3 space-y-3 text-sm font-sans-body">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                                    <div className="flex items-center gap-2">
                                        <label className="text-stone-500 w-20 shrink-0">{t.duration}:</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={act.duration}
                                            onChange={(e) => handleUpdateDuration(act.id, Number(e.target.value))}
                                            className="w-20 text-xs border-stone-300 rounded-md shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] py-1"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-stone-500 w-20 shrink-0">{t.responsible}:</label>
                                        <input
                                            type="text"
                                            value={act.responsible || ''}
                                            onChange={(e) => setSelectedActivities(selectedActivities.map(a => a.id === act.id ? { ...a, responsible: e.target.value } : a))}
                                            className="flex-1 text-xs border-stone-300 rounded-md shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] py-1"
                                            placeholder="e.g. MC"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-stone-500 w-20 shrink-0">{t.location}:</label>
                                        <input
                                            type="text"
                                            list="location-suggestions"
                                            value={act.location || ''}
                                            onChange={(e) => setSelectedActivities(selectedActivities.map(a => a.id === act.id ? { ...a, location: e.target.value } : a))}
                                            className="flex-1 text-xs border-stone-300 rounded-md shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] py-1"
                                            placeholder="e.g. Garden"
                                        />
                                        <datalist id="location-suggestions">
                                          {t.locations && Object.values(t.locations).map(loc => (
                                            <option key={loc} value={loc} />
                                          ))}
                                        </datalist>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-stone-500 w-20 shrink-0">{t.style}:</label>
                                        <input
                                            type="text"
                                            value={act.style || ''}
                                            onChange={(e) => setSelectedActivities(selectedActivities.map(a => a.id === act.id ? { ...a, style: e.target.value } : a))}
                                            className="flex-1 text-xs border-stone-300 rounded-md shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] py-1"
                                            placeholder="e.g. Western"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 col-span-1 sm:col-span-2">
                                        <label className="text-stone-500 w-20 shrink-0">{t.bgm}:</label>
                                        <input
                                            type="text"
                                            value={act.bgm || ''}
                                            onChange={(e) => setSelectedActivities(selectedActivities.map(a => a.id === act.id ? { ...a, bgm: e.target.value } : a))}
                                            className="flex-1 text-xs border-stone-300 rounded-md shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] py-1"
                                            placeholder="Song Title"
                                        />
                                    </div>
                                    <div className="col-span-1 sm:col-span-2 flex gap-4 pt-1">
                                        <button
                                            onClick={() => setSelectedActivities(selectedActivities.map(a => a.id === act.id ? { ...a, needsMic: !a.needsMic } : a))}
                                            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs border transition-colors ${
                                                act.needsMic 
                                                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                                : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
                                            }`}
                                        >
                                            <Mic className="w-3 h-3" />
                                            {act.needsMic ? t.micNeeded : t.noMic}
                                        </button>
                                        <button
                                            onClick={() => setSelectedActivities(selectedActivities.map(a => a.id === act.id ? { ...a, onStage: !a.onStage } : a))}
                                            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs border transition-colors ${
                                                act.onStage 
                                                ? 'bg-purple-50 border-purple-200 text-purple-700' 
                                                : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
                                            }`}
                                        >
                                            <Drama className="w-3 h-3" />
                                            {act.onStage ? t.onStage : t.offStage}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-stone-500 w-20 shrink-0">{t.notes}:</label>
                                    <textarea
                                        value={act.coordinationNotes || ''}
                                        onChange={(e) => setSelectedActivities(selectedActivities.map(a => a.id === act.id ? { ...a, coordinationNotes: e.target.value } : a))}
                                        className="flex-1 text-xs border-stone-300 rounded-md shadow-sm focus:border-[#5A5A40] focus:ring-[#5A5A40] py-1"
                                        placeholder="Coordination notes for tech, venue, etc."
                                        rows={2}
                                    />
                                </div>
                            </div>

                            {/* Sub-Activities Section */}
                            {!act.isPrep && (
                                <div className="mt-4 pt-3 border-t border-stone-100">
                                    <div className="space-y-2">
                                        {act.subActivities?.map(sub => (
                                            <div key={sub.id} className="flex items-center gap-2 bg-stone-50 p-2 rounded border border-stone-200 text-xs">
                                                <div className="w-14 text-center font-mono text-stone-500 text-[10px] leading-tight">
                                                    <div>+{sub.startOffset}m</div>
                                                    <div>({sub.duration}m)</div>
                                                </div>
                                                <input 
                                                    type="text" 
                                                    value={sub.name}
                                                    onChange={(e) => handleUpdateSubActivity(act.id, sub.id, 'name', e.target.value)}
                                                    className="flex-1 border-stone-300 rounded px-2 py-1 text-xs focus:ring-[#5A5A40] focus:border-[#5A5A40]"
                                                />
                                                <div className="flex items-center gap-1">
                                                    <label className="text-[10px] text-stone-400">Start:</label>
                                                    <input 
                                                        type="number" 
                                                        value={sub.startOffset}
                                                        onChange={(e) => handleUpdateSubActivity(act.id, sub.id, 'startOffset', Number(e.target.value))}
                                                        className="w-12 border-stone-300 rounded px-1 py-1 text-xs focus:ring-[#5A5A40] focus:border-[#5A5A40]"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <label className="text-[10px] text-stone-400">Dur:</label>
                                                    <input 
                                                        type="number" 
                                                        value={sub.duration}
                                                        onChange={(e) => handleUpdateSubActivity(act.id, sub.id, 'duration', Number(e.target.value))}
                                                        className="w-12 border-stone-300 rounded px-1 py-1 text-xs focus:ring-[#5A5A40] focus:border-[#5A5A40]"
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => handleRemoveSubActivity(act.id, sub.id)}
                                                    className="p-1 text-stone-400 hover:text-red-500"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => handleAddSubActivity(act.id)}
                                        className="mt-2 text-xs text-[#5A5A40] hover:text-[#4a4a30] flex items-center gap-1 font-medium"
                                    >
                                        <Plus className="w-3 h-3" />
                                        {t.addConcurrent}
                                    </button>
                                </div>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {index > 0 && !act.isPrep && (
                              <button
                                onClick={() => handleMakeConcurrent(act.id, timeline[index - 1].id)}
                                title={t.makeConcurrent}
                                className="p-2 text-stone-400 hover:text-[#5A5A40] disabled:opacity-30 rounded-full hover:bg-[#5A5A40]/10"
                              >
                                <Merge className="w-4 h-4 rotate-90" />
                              </button>
                            )}
                            <button
                              onClick={() => handleMove(index, 'up')}
                              disabled={index === 0}
                              className="p-2 text-stone-400 hover:text-stone-900 disabled:opacity-30 rounded-full hover:bg-stone-200"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleMove(index, 'down')}
                              disabled={index === timeline.length - 1}
                              className="p-2 text-stone-400 hover:text-stone-900 disabled:opacity-30 rounded-full hover:bg-stone-200"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemove(act.id)}
                              className="p-2 text-stone-400 hover:text-red-600 rounded-full hover:bg-red-50 ml-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
