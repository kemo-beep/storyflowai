import React, { useState, useRef, useEffect } from 'react';
import { StoryData, StorySegment, AspectRatio, CaptionPosition, FontSize, ArtStyle, TransitionStyle } from '../types';
import { STYLE_KEYWORDS, TRANSITION_STYLES } from '../constants';
import { 
  Play, RefreshCw, Image as ImageIcon, Mic, Edit3, 
  ChevronDown, ChevronUp, ArrowLeft, GripVertical, 
  Trash2, Plus, Clock, Save, Wand2, Film, Info, X, MoreHorizontal, Settings, Sparkles, Zap, Scissors, Check, Sliders
} from 'lucide-react';

interface StoryEditorProps {
  data: StoryData;
  onUpdateScene: (index: number, field: keyof StorySegment, value: string) => void;
  onUpdateStory: (field: keyof StoryData, value: any) => void;
  onRegenerateImage: (index: number) => Promise<void>;
  onRegenerateAudio: (index: number) => Promise<void>;
  onPlayMovie: () => void;
  onBack: () => void;
  onReorderScenes: (scenes: StorySegment[]) => void;
  onAddScene: () => void;
  onDeleteScene: (index: number) => void;
  onSplitScene: (index: number) => Promise<void>;
}

const StoryEditor: React.FC<StoryEditorProps> = ({
  data,
  onUpdateScene,
  onUpdateStory,
  onRegenerateImage,
  onRegenerateAudio,
  onPlayMovie,
  onBack,
  onReorderScenes,
  onAddScene,
  onDeleteScene,
  onSplitScene
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  const [loadingAudio, setLoadingAudio] = useState<Record<string, boolean>>({});
  const [isSplitting, setIsSplitting] = useState<Record<string, boolean>>({});
  const [showVisualEditor, setShowVisualEditor] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Auto-suggestion State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionPos, setSuggestionPos] = useState({ top: 0, left: 0 });

  // Refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const suggestionsListRef = useRef<HTMLUListElement>(null);

  const selectedScene = data.scenes[selectedIndex];

  // Helper: Estimate Duration
  const getDuration = (text: string) => Math.max(3, Math.round(text.split(' ').length / 2.5));

  const handleImageRegen = async () => {
    if (!selectedScene) return;
    setLoadingImages(prev => ({ ...prev, [selectedScene.id]: true }));
    try {
      await onRegenerateImage(selectedIndex);
      setShowVisualEditor(false); // Close editor on success
    } finally {
      setLoadingImages(prev => ({ ...prev, [selectedScene.id]: false }));
    }
  };

  const handleAudioRegen = async () => {
    if (!selectedScene) return;
    setLoadingAudio(prev => ({ ...prev, [selectedScene.id]: true }));
    try {
      await onRegenerateAudio(selectedIndex);
    } finally {
      setLoadingAudio(prev => ({ ...prev, [selectedScene.id]: false }));
    }
  };

  const handleSplit = async () => {
    if (!selectedScene) return;
    setIsSplitting(prev => ({ ...prev, [selectedScene.id]: true }));
    setNotification("AI is analyzing and splitting scene...");
    try {
        await onSplitScene(selectedIndex);
        setNotification("Scene split successfully");
        setTimeout(() => setNotification(null), 3000);
    } catch (e) {
        console.error(e);
        setNotification("Failed to split scene");
        setTimeout(() => setNotification(null), 3000);
    } finally {
        setIsSplitting(prev => {
            const next = { ...prev };
            delete next[selectedScene.id]; // Scene ID likely changed or removed
            return next;
        });
    }
  };

  const playAudio = () => {
    if (selectedScene?.audioUrl) {
      new Audio(selectedScene.audioUrl).play();
    }
  };

  // --- Prompt Editing & Auto-Suggestions ---
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onUpdateScene(selectedIndex, 'visualPrompt', val);

    const cursor = e.target.selectionStart;
    const textBefore = val.slice(0, cursor);
    // Find the current word fragment being typed (alphanumeric + underscore)
    const match = textBefore.match(/([a-zA-Z0-9_]+)$/);

    if (match && data.artStyle) {
       const word = match[0];
       // Only trigger if word length > 1 to reduce noise
       if (word.length < 2) {
         setShowSuggestions(false);
         return;
       }

       const keywords = STYLE_KEYWORDS[data.artStyle] || [];
       const matches = keywords.filter(k => 
         k.toLowerCase().startsWith(word.toLowerCase()) && 
         k.toLowerCase() !== word.toLowerCase()
       );

       if (matches.length > 0) {
          setSuggestions(matches);
          setActiveSuggestion(0);
          setShowSuggestions(true);
          
          // Calculate popup position using mirror div
          if (mirrorRef.current && textareaRef.current) {
             const preText = textBefore.slice(0, match.index);
             mirrorRef.current.textContent = preText;
             const span = document.createElement('span');
             span.textContent = word;
             mirrorRef.current.appendChild(span);
             
             // Offset logic: Top + Height - ScrollTop
             const scrollTop = textareaRef.current.scrollTop;
             setSuggestionPos({ 
                top: span.offsetTop + span.offsetHeight - scrollTop, 
                left: span.offsetLeft 
             });
          }
          return;
       }
    }
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
     if (showSuggestions) {
        if (e.key === 'ArrowDown') {
           e.preventDefault();
           setActiveSuggestion(prev => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
           e.preventDefault();
           setActiveSuggestion(prev => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
           e.preventDefault();
           applySuggestion(suggestions[activeSuggestion]);
        } else if (e.key === 'Escape') {
           e.preventDefault();
           setShowSuggestions(false);
        }
     }
  };

  const applySuggestion = (text: string) => {
     if (!selectedScene || !textareaRef.current) return;
     
     const cursor = textareaRef.current.selectionStart;
     const fullText = selectedScene.visualPrompt;
     const textBefore = fullText.slice(0, cursor);
     const match = textBefore.match(/([a-zA-Z0-9_]+)$/);
     
     if (match) {
        const wordStart = match.index!;
        const newText = fullText.slice(0, wordStart) + text + fullText.slice(cursor);
        onUpdateScene(selectedIndex, 'visualPrompt', newText);
        setShowSuggestions(false);
        
        // Restore focus
        setTimeout(() => {
           if (textareaRef.current) {
             textareaRef.current.focus();
             // Optionally move cursor to end of word
             const newCursorPos = wordStart + text.length;
             textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
           }
        }, 0);
     }
  };

  // Scroll Sync for Highlight/Mirror layers
  const handleScroll = () => {
    if (textareaRef.current) {
      const scrollTop = textareaRef.current.scrollTop;
      if (preRef.current) preRef.current.scrollTop = scrollTop;
      if (mirrorRef.current) mirrorRef.current.scrollTop = scrollTop;
      
      // Close suggestions on scroll to avoid misalignment (optional UX choice)
      setShowSuggestions(false);
    }
  };

  // Auto-scroll suggestions list
  useEffect(() => {
    if (showSuggestions && suggestionsListRef.current) {
       const activeEl = suggestionsListRef.current.children[activeSuggestion] as HTMLElement;
       if (activeEl) {
          activeEl.scrollIntoView({ block: 'nearest' });
       }
    }
  }, [activeSuggestion, showSuggestions]);

  // DnD Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
    // Set the drag image to the whole row
    const row = e.currentTarget.closest('.story-row');
    if (row) {
       e.dataTransfer.setDragImage(row, 0, 0);
       row.classList.add('opacity-40');
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragOverItem.current = position;
    
    if (dragItem.current !== null && dragItem.current !== position) {
      const copyListItems = [...data.scenes];
      const dragItemContent = copyListItems[dragItem.current];
      copyListItems.splice(dragItem.current, 1);
      copyListItems.splice(position, 0, dragItemContent);
      
      dragItem.current = position; 
      
      if (selectedIndex === dragItem.current) setSelectedIndex(position);
      else if (selectedIndex === position) setSelectedIndex(dragItem.current);

      onReorderScenes(copyListItems);
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if (listRef.current) {
       const rows = listRef.current.querySelectorAll('.story-row');
       rows.forEach(r => r.classList.remove('opacity-40'));
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDelete = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (data.scenes.length <= 1) return;
    onDeleteScene(index);
    if (selectedIndex >= index && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  // Styling helpers
  const getAspectClass = (ratio?: AspectRatio) => {
    switch (ratio) {
      case AspectRatio.PORTRAIT: return 'aspect-[9/16] h-[90%]';
      case AspectRatio.PORTRAIT_ALT: return 'aspect-[3/4] h-[90%]';
      case AspectRatio.SQUARE: return 'aspect-square h-[90%]';
      default: return 'aspect-video w-[90%] max-w-5xl';
    }
  };

  // Syntax Highlighting Helper
  const highlightPrompt = (text: string) => {
    // Basic HTML escape
    let highlighted = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // 1. Numbers (Tech/Specs)
    highlighted = highlighted.replace(/(\b\d+[a-zA-Z]*\b)/g, '<span class="text-purple-400 font-bold">$1</span>');
    
    // 2. Separators
    highlighted = highlighted.replace(/([,|])/g, '<span class="text-orange-500 font-bold">$1</span>');

    // 3. Environment & Setting Keywords
    const envKeywords = ['indoor', 'outdoor', 'night', 'day', 'morning', 'evening', 'city', 'nature', 'room', 'space', 'sky', 'background', 'view', 'scene', 'landscape', 'portrait', 'forest', 'street'];
    envKeywords.forEach(kw => {
       const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
       highlighted = highlighted.replace(regex, '<span class="text-teal-400 font-medium">$1</span>');
    });

    // 4. Lighting & Atmosphere
    const lightKeywords = ['light', 'shadow', 'sun', 'moon', 'neon', 'glow', 'ambient', 'volumetric', 'dark', 'bright', 'fog', 'mist', 'haze', 'cinematic', 'atmosphere', 'moody', 'vibrant', 'soft'];
    lightKeywords.forEach(kw => {
       const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
       highlighted = highlighted.replace(regex, '<span class="text-amber-400 font-medium">$1</span>');
    });

    // 5. Selected Art Style Keywords
    const styleKeywords = data.artStyle && STYLE_KEYWORDS[data.artStyle] ? STYLE_KEYWORDS[data.artStyle] : [];
    styleKeywords.forEach(kw => {
        // Prevent overlapping replacement if possible
        if (!lightKeywords.includes(kw.toLowerCase()) && !envKeywords.includes(kw.toLowerCase())) {
            const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
            highlighted = highlighted.replace(regex, '<span class="text-indigo-400 font-medium">$1</span>');
        }
    });

    // 6. Common Character Descriptors
    const charKeywords = ['wearing', 'standing', 'sitting', 'holding', 'looking', 'walking', 'running', 'hair', 'eyes', 'face', 'suit', 'dress', 'armor'];
    charKeywords.forEach(kw => {
       const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
       highlighted = highlighted.replace(regex, '<span class="text-rose-400 font-medium">$1</span>');
    });

    return { __html: highlighted };
  };

  const addKeyword = (kw: string) => {
     if (!selectedScene) return;
     let current = selectedScene.visualPrompt.trim();
     if (current.length > 0 && !current.endsWith(',')) current += ',';
     onUpdateScene(selectedIndex, 'visualPrompt', `${current} ${kw}`);
  };

  return (
    <div className="fixed inset-0 bg-[#09090b] flex flex-col z-50 animate-fade-in font-sans selection:bg-indigo-500/30">
      
      {/* Header Bar */}
      <div className="h-16 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-30">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="h-6 w-px bg-white/10"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Project Name</span>
              <span className="text-sm font-medium text-zinc-100 truncate max-w-xs">{data.title}</span>
            </div>
            {data.lastSaved && (
               <span className="text-[10px] text-zinc-600 font-mono border border-white/5 px-2 py-0.5 rounded-full flex items-center gap-1.5 ml-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></div>
                 Saved {new Date(data.lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </span>
            )}
         </div>
         <div className="flex items-center gap-3">
            <button
               onClick={() => setShowSettings(true)}
               className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
               title="Project Settings"
            >
               <Settings size={20} />
            </button>
            <button 
              onClick={onPlayMovie}
              className="bg-zinc-100 text-black hover:bg-white px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-white/5 hover:scale-[1.02]"
            >
               <Play size={14} fill="currentColor" /> Watch Movie
            </button>
         </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] bg-zinc-800/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full border border-white/10 shadow-2xl flex items-center gap-3 animate-fade-in">
           <Sparkles size={16} className="text-indigo-400" />
           <span className="text-xs font-medium tracking-wide">{notification}</span>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT: Timeline Panel */}
        <div className="w-[380px] lg:w-[420px] bg-[#09090b] border-r border-white/5 flex flex-col shrink-0 z-20 relative">
           <div className="h-12 px-4 border-b border-white/5 flex justify-between items-center bg-[#09090b]">
              <div className="flex items-center gap-2 text-zinc-500">
                <Film size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Timeline ({data.scenes.length})</span>
              </div>
              <div className="flex items-center gap-1">
                 <button 
                   onClick={handleSplit}
                   disabled={!selectedScene || isSplitting[selectedScene?.id]}
                   className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 rounded border border-white/5 transition-colors disabled:opacity-50"
                   title="Split scene with AI"
                 >
                    <Scissors size={12} className={isSplitting[selectedScene?.id] ? 'animate-spin' : ''} />
                    {isSplitting[selectedScene?.id] ? 'Splitting...' : 'Split'}
                 </button>
                 <button 
                   onClick={onAddScene} 
                   className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                   title="Add Scene"
                 >
                    <Plus size={16} />
                 </button>
              </div>
           </div>
           
           <div ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {data.scenes.map((scene, idx) => (
                <div 
                  key={scene.id}
                  data-index={idx}
                  onDragEnter={(e) => handleDragEnter(e, idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => setSelectedIndex(idx)}
                  className={`story-row group relative p-3 rounded-xl border transition-all duration-200 flex gap-4 cursor-pointer select-none ${
                     selectedIndex === idx 
                       ? 'bg-white/[0.03] border-white/10 shadow-inner' 
                       : 'bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/5'
                  }`}
                >
                   {/* Active Indicator Line */}
                   {selectedIndex === idx && (
                      <div className="absolute left-0 top-3 bottom-3 w-[3px] bg-indigo-500 rounded-r-full"></div>
                   )}

                   {/* Splitting Overlay */}
                   {isSplitting[scene.id] && (
                      <div className="absolute inset-0 z-20 bg-zinc-950/80 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center animate-fade-in border border-indigo-500/20">
                         <Scissors size={20} className="text-indigo-400 animate-spin mb-2" />
                         <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-wider">Processing</span>
                      </div>
                   )}

                   <div 
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragEnd={handleDragEnd}
                      className="w-4 flex items-center justify-center text-zinc-700 hover:text-zinc-500 cursor-grab active:cursor-grabbing"
                   >
                      <GripVertical size={14} />
                   </div>

                   <div className="w-24 aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-white/5 relative shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                      {scene.imageData ? (
                        <img src={scene.imageData} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700"><ImageIcon size={16} /></div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={(e) => handleDelete(e, idx)}
                            className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                      </div>
                   </div>

                   <div className="flex-1 min-w-0 flex flex-col py-0.5">
                      <div className="flex items-center justify-between mb-1.5">
                         <span className={`text-[10px] font-bold tracking-wider ${selectedIndex === idx ? 'text-indigo-400' : 'text-zinc-500'}`}>
                           SCENE {String(idx + 1).padStart(2, '0')}
                         </span>
                         <span className="text-[10px] text-zinc-600 font-mono flex items-center gap-1">
                           <Clock size={10} />
                           {getDuration(scene.narration)}s
                         </span>
                      </div>
                      <div className="relative group/text">
                        {/* Inline Text Edit */}
                        <textarea
                           className={`w-full bg-transparent border-none p-0 text-xs leading-relaxed resize-none focus:ring-0 overflow-hidden ${selectedIndex === idx ? 'text-zinc-200' : 'text-zinc-400'} cursor-pointer focus:cursor-text`}
                           value={scene.narration}
                           onChange={(e) => onUpdateScene(idx, 'narration', e.target.value)}
                           onClick={(e) => {
                             e.stopPropagation(); // prevent row select logic interference
                             setSelectedIndex(idx);
                           }}
                           rows={2}
                           spellCheck={false}
                        />
                         {!scene.audioUrl && (
                           <div className="absolute -right-1 -bottom-1 h-2 w-2 rounded-full bg-amber-500/80 ring-2 ring-black" title="Missing Audio"></div>
                         )}
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* CENTER: Preview Stage */}
        <div className="flex-1 bg-[#050505] flex flex-col relative overflow-hidden">
           {/* Grid Background */}
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
           </div>
           
           <div className="flex-1 relative flex items-center justify-center p-8">
                {selectedScene && (
                   <div className={`relative group transition-all duration-500 ${getAspectClass(data.aspectRatio)}`}>
                      
                      <div 
                         className="w-full h-full relative cursor-pointer group/image bg-zinc-900 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10"
                         onClick={() => setShowVisualEditor(true)}
                      >
                         <img 
                             src={selectedScene.imageData || `https://via.placeholder.com/800x450?text=No+Image`} 
                             className="w-full h-full object-cover"
                             alt="Preview"
                         />
                         
                         {loadingImages[selectedScene.id] && (
                             <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 backdrop-blur-sm">
                                 <RefreshCw size={24} className="text-white/50 animate-spin mb-3" />
                                 <span className="text-white/50 text-[10px] font-bold tracking-widest uppercase">Rendering</span>
                             </div>
                         )}

                         <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 text-white px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 opacity-0 group-hover/image:opacity-100 transition-all transform translate-y-[-8px] group-hover/image:translate-y-0 z-20 shadow-lg hover:bg-black/60">
                            <Wand2 size={12} className="text-indigo-400" /> Edit Visual
                         </div>
                      </div>
                      
                      {/* Caption Overlay Preview */}
                      {data.captionPosition !== CaptionPosition.BELOW && (
                         <div className="absolute inset-x-0 bottom-8 px-8 text-center pointer-events-none z-10">
                            <span className="inline-block bg-black/50 backdrop-blur-md px-6 py-3 rounded-2xl text-white/95 font-medium text-lg border border-white/10 shadow-xl">
                               {selectedScene.narration}
                            </span>
                         </div>
                      )}

                      {/* Visual Editor Popover */}
                      {showVisualEditor && (
                         <div 
                           className="absolute top-4 right-4 z-50 w-[440px] bg-[#09090b]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-fade-in origin-top-right overflow-hidden flex flex-col ring-1 ring-white/5"
                           onClick={(e) => e.stopPropagation()}
                         >
                            <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                               <h3 className="text-zinc-100 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                  <Sparkles size={14} className="text-indigo-400" /> Visual Prompt
                               </h3>
                               <button onClick={() => setShowVisualEditor(false)} className="text-zinc-500 hover:text-white transition-colors">
                                  <X size={16} />
                               </button>
                            </div>
                            
                            {/* Editor Area */}
                            <div className="relative h-56 bg-black/30 w-full group">
                               {/* Base Text (Syntax Highlighted) */}
                               <pre 
                                  ref={preRef}
                                  className="absolute inset-0 p-5 text-sm font-mono leading-relaxed whitespace-pre-wrap break-words text-zinc-500 pointer-events-none z-0 overflow-hidden"
                                  dangerouslySetInnerHTML={highlightPrompt(selectedScene.visualPrompt)}
                               />
                               {/* Input Layer (Transparent Text, Visible Caret) */}
                               <textarea 
                                  ref={textareaRef}
                                  value={selectedScene.visualPrompt}
                                  onChange={handlePromptChange}
                                  onKeyDown={handleKeyDown}
                                  onScroll={handleScroll}
                                  className="absolute inset-0 w-full h-full bg-transparent border-none text-sm text-transparent caret-indigo-400 font-mono leading-relaxed p-5 focus:ring-0 focus:outline-none resize-none z-10 selection:bg-indigo-500/20"
                                  placeholder="Describe the image..."
                                  spellCheck={false}
                                  autoFocus
                               />
                               {/* Measurement Mirror for Suggestions Position */}
                               <div ref={mirrorRef} className="absolute inset-0 p-5 text-sm font-mono leading-relaxed whitespace-pre-wrap break-words invisible pointer-events-none border-none outline-none z-0 overflow-hidden"></div>

                               {/* Suggestions Dropdown */}
                               {showSuggestions && (
                                  <ul 
                                     ref={suggestionsListRef}
                                     className="absolute bg-zinc-900 border border-white/10 rounded-lg shadow-2xl z-50 w-52 max-h-48 overflow-y-auto py-1 custom-scrollbar ring-1 ring-black"
                                     style={{ 
                                        top: Math.min(suggestionPos.top + 10, 180), 
                                        left: Math.min(suggestionPos.left, 200)
                                     }}
                                  >
                                     {suggestions.map((s, i) => (
                                        <li 
                                           key={s}
                                           onClick={() => applySuggestion(s)}
                                           className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between border-b border-white/[0.02] last:border-0 ${i === activeSuggestion ? 'bg-indigo-600 text-white' : 'text-zinc-300 hover:bg-white/5'}`}
                                        >
                                           {s}
                                           {i === activeSuggestion && <Check size={12} />}
                                        </li>
                                     ))}
                                  </ul>
                               )}
                            </div>

                            <div className="px-5 py-3 border-t border-white/5 bg-zinc-900/30">
                               <div className="flex items-center justify-between mb-2">
                                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <Zap size={12} /> Style Tags
                                 </label>
                                 <span className="text-[10px] text-zinc-600 px-2 py-0.5 rounded-full bg-white/5">{data.artStyle}</span>
                               </div>
                               <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                                 {(data.artStyle && STYLE_KEYWORDS[data.artStyle] ? STYLE_KEYWORDS[data.artStyle] : ['cinematic', 'detailed', '4k']).map((kw) => (
                                    <button
                                      key={kw}
                                      onClick={() => addKeyword(kw)}
                                      className="px-2.5 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-zinc-400 hover:bg-white/10 hover:text-white hover:border-white/10 transition-all"
                                    >
                                      + {kw}
                                    </button>
                                 ))}
                               </div>
                            </div>

                            <div className="p-4 bg-[#09090b] border-t border-white/5 flex gap-3">
                              <button 
                                onClick={() => setShowVisualEditor(false)}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-white/5 text-zinc-400 text-xs font-semibold hover:bg-white/5 hover:text-white transition-colors"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={handleImageRegen}
                                disabled={loadingImages[selectedScene.id]}
                                className="flex-[2] bg-white text-black hover:bg-zinc-200 py-2.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {loadingImages[selectedScene.id] ? (
                                  <>
                                    <RefreshCw size={14} className="animate-spin" /> Rendering...
                                  </>
                                ) : (
                                  <>
                                    <Wand2 size={14} /> Render Preview
                                  </>
                                )}
                              </button>
                            </div>
                         </div>
                      )}
                   </div>
                )}
           </div>

           {/* Inspector / Properties Panel */}
           <div className="h-56 border-t border-white/5 bg-[#09090b] p-6 lg:p-8 flex gap-10 shrink-0 z-20 relative">
               {selectedScene && (
                 <>
                    <div className="flex-1 flex flex-col h-full">
                       <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Edit3 size={12} /> Narration Script
                       </label>
                       <textarea
                          value={selectedScene.narration}
                          onChange={(e) => onUpdateScene(selectedIndex, 'narration', e.target.value)}
                          className="flex-1 bg-white/[0.03] border border-white/5 hover:border-white/10 focus:bg-white/[0.05] rounded-xl p-4 text-zinc-300 text-sm focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500/30 outline-none resize-none transition-all custom-scrollbar leading-relaxed"
                          placeholder="Enter narration text..."
                          spellCheck={false}
                       />
                    </div>
                    
                    <div className="w-80 flex flex-col h-full">
                       <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Mic size={12} /> Audio Track
                       </label>
                       
                       <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden group">
                          
                          {/* Fake Waveform */}
                          <div className="absolute inset-0 opacity-20 flex items-center justify-center gap-[3px] pointer-events-none px-6">
                             {[...Array(24)].map((_, i) => (
                                <div key={i} className="w-1.5 bg-zinc-400 rounded-full transition-all duration-300" 
                                     style={{ 
                                       height: selectedScene.audioUrl ? `${Math.random() * 60 + 20}%` : '4px',
                                       opacity: selectedScene.audioUrl ? 1 : 0.2
                                     }}>
                                </div>
                             ))}
                          </div>

                          <div className="flex items-center justify-between z-10">
                             <div className="flex items-center gap-2.5">
                                <div className={`h-2.5 w-2.5 rounded-full ring-2 ring-black ${selectedScene.audioUrl ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-amber-500'}`}></div>
                                <span className="text-xs text-zinc-300 font-medium tracking-wide">{selectedScene.audioUrl ? 'Ready to Play' : 'Needs Generation'}</span>
                             </div>
                             {selectedScene.audioUrl && (
                               <span className="text-[10px] text-zinc-600 font-mono border border-white/5 px-1.5 py-0.5 rounded">WAV 24kHz</span>
                             )}
                          </div>
                          
                          <div className="flex gap-3 mt-auto z-10">
                             <button 
                               onClick={playAudio}
                               disabled={!selectedScene.audioUrl}
                               className="flex-1 bg-white/5 hover:bg-white/10 text-zinc-200 py-2.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 border border-white/5 hover:border-white/10 group-hover:bg-white/10"
                             >
                                <Play size={12} fill="currentColor" /> Preview Audio
                             </button>
                             <button 
                                onClick={handleAudioRegen}
                                disabled={loadingAudio[selectedScene.id]}
                                className="px-4 bg-white/5 hover:bg-white/10 text-zinc-200 rounded-lg transition-all disabled:opacity-50 border border-white/5 hover:border-white/10"
                                title="Regenerate Voice"
                             >
                                <RefreshCw size={14} className={loadingAudio[selectedScene.id] ? 'animate-spin' : ''} />
                             </button>
                          </div>
                       </div>
                    </div>
                 </>
               )}
           </div>
        </div>
      </div>
      
      {/* Settings Modal */}
      {showSettings && (
         <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-6">
             <div className="bg-[#09090b] w-full max-w-2xl border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                 <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                       <Sliders size={18} /> Project Settings
                    </h2>
                    <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white transition-colors">
                       <X size={20} />
                    </button>
                 </div>
                 
                 <div className="p-8 overflow-y-auto custom-scrollbar">
                     <section>
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Visual Transition Style</h3>
                        <div className="grid grid-cols-2 gap-4">
                           {TRANSITION_STYLES.map((style) => (
                              <button 
                                key={style}
                                onClick={() => onUpdateStory('transitionStyle', style)}
                                className={`group relative h-28 rounded-xl border transition-all overflow-hidden text-left p-4 flex flex-col justify-end ${
                                   data.transitionStyle === style 
                                     ? 'border-indigo-500 bg-indigo-900/10 ring-1 ring-indigo-500/50' 
                                     : 'border-white/10 bg-zinc-900/50 hover:border-white/20 hover:bg-zinc-900'
                                }`}
                              >
                                 <div className="absolute inset-0 opacity-20 pointer-events-none">
                                    {/* Visual Representation of Transition */}
                                    {style === TransitionStyle.SLIDE && (
                                       <div className="relative w-full h-full overflow-hidden">
                                          <div className="absolute inset-0 bg-indigo-500 transition-transform duration-700 group-hover:translate-x-full" />
                                          <div className="absolute inset-0 bg-purple-500 -translate-x-full transition-transform duration-700 group-hover:translate-x-0" />
                                       </div>
                                    )}
                                    {style === TransitionStyle.ZOOM_WARP && (
                                       <div className="w-full h-full overflow-hidden bg-zinc-800">
                                          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 transition-transform duration-1000 group-hover:scale-150" />
                                       </div>
                                    )}
                                    {style === TransitionStyle.DISSOLVE && (
                                       <div className="relative w-full h-full bg-zinc-800">
                                          <div className="absolute inset-0 bg-indigo-500 transition-opacity duration-700 group-hover:opacity-0" />
                                          <div className="absolute inset-0 bg-purple-500 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                                       </div>
                                    )}
                                    {style === TransitionStyle.CINEMATIC && (
                                       <div className="w-full h-full overflow-hidden bg-zinc-800">
                                          <div className="w-full h-full bg-indigo-500 transition-all duration-1000 group-hover:scale-110 group-hover:blur-[2px]" />
                                       </div>
                                    )}
                                 </div>
                                 
                                 <div className="relative z-10 flex justify-between items-center w-full">
                                    <span className={`text-sm font-semibold ${data.transitionStyle === style ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                                       {style}
                                    </span>
                                    {data.transitionStyle === style && <Check size={16} className="text-indigo-400" />}
                                 </div>
                              </button>
                           ))}
                        </div>
                     </section>
                 </div>
                 
                 <div className="p-6 border-t border-white/5 bg-zinc-900/30 flex justify-end">
                    <button 
                       onClick={() => setShowSettings(false)}
                       className="bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg transition-all"
                    >
                       Done
                    </button>
                 </div>
             </div>
         </div>
      )}

    </div>
  );
};

export default StoryEditor;