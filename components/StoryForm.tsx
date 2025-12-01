import React from 'react';
import { ART_STYLES, WRITING_STYLES, ASPECT_RATIOS, TRANSITION_STYLES, VOICES, CAPTION_POSITIONS, FONT_SIZES, DEFAULT_STORY_PROMPT } from '../constants';
import { ArtStyle, WritingStyle, AspectRatio, TransitionStyle, Voice, CaptionPosition, FontSize } from '../types';
import { Sparkles, PenTool, Palette, Layout, Mic, Type, MonitorPlay, Film, Aperture, Text } from 'lucide-react';

interface StoryFormProps {
  story: string;
  setStory: (s: string) => void;
  writingStyle: WritingStyle;
  setWritingStyle: (s: WritingStyle) => void;
  artStyle: ArtStyle;
  setArtStyle: (s: ArtStyle) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (a: AspectRatio) => void;
  transitionStyle: TransitionStyle;
  setTransitionStyle: (t: TransitionStyle) => void;
  voice: Voice;
  setVoice: (v: Voice) => void;
  captionPosition: CaptionPosition;
  setCaptionPosition: (c: CaptionPosition) => void;
  fontSize: FontSize;
  setFontSize: (f: FontSize) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const StoryForm: React.FC<StoryFormProps> = ({
  story,
  setStory,
  writingStyle,
  setWritingStyle,
  artStyle,
  setArtStyle,
  aspectRatio,
  setAspectRatio,
  transitionStyle,
  setTransitionStyle,
  voice,
  setVoice,
  captionPosition,
  setCaptionPosition,
  fontSize,
  setFontSize,
  onGenerate,
  isGenerating
}) => {
  return (
    <div className="flex h-full w-full overflow-hidden animate-fade-in">
      
      {/* LEFT: Script Studio */}
      <div className="flex-1 flex flex-col p-8 lg:p-12 relative overflow-hidden">
         <div className="max-w-3xl w-full mx-auto h-full flex flex-col">
            <header className="mb-8 shrink-0">
               <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">StoryFlow</span>
                  <span className="text-zinc-600 font-light px-2">|</span>
                  <span className="text-zinc-400 font-normal text-lg">Studio</span>
               </h1>
            </header>

            <div className="flex-1 flex flex-col relative group min-h-0">
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2 shrink-0">
                  <PenTool size={14} /> The Script
               </label>
               <textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  className="flex-1 w-full bg-transparent border-none outline-none text-zinc-200 placeholder-zinc-700 resize-none text-lg leading-relaxed font-light custom-scrollbar focus:ring-0"
                  placeholder="Enter your story idea here..."
                  spellCheck={false}
               />
               <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 opacity-50 group-focus-within:opacity-100 transition-opacity"></div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-900 shrink-0">
               <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                     <Sparkles size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                     <p className="text-sm text-zinc-400 font-medium">Ready to visualize?</p>
                     <p className="text-xs text-zinc-600">AI will split scenes, generate visuals, and clone voices.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* RIGHT: Configuration Panel */}
      <div className="w-[400px] bg-zinc-950 border-l border-zinc-900 flex flex-col shadow-2xl z-20">
         {/* Scrollable Configs */}
         <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
            
            {/* Section: Direction */}
            <section className="space-y-5">
               <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-900 pb-2">
                  <Aperture size={14} /> Direction
               </h3>
               
               <div className="space-y-6">
                  <ConfigField label="Writing Style" value={writingStyle} onChange={(v) => setWritingStyle(v as WritingStyle)} options={WRITING_STYLES} />
                  <ConfigField label="Visual Art Style" value={artStyle} onChange={(v) => setArtStyle(v as ArtStyle)} options={ART_STYLES} />
                  <ConfigField label="Transition Effect" value={transitionStyle} onChange={(v) => setTransitionStyle(v as TransitionStyle)} options={TRANSITION_STYLES} />
               </div>
            </section>

            {/* Section: Audio */}
            <section className="space-y-5">
               <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-900 pb-2">
                  <Mic size={14} /> Audio
               </h3>
               <ConfigField label="Narrator Voice" value={voice} onChange={(v) => setVoice(v as Voice)} options={VOICES} />
            </section>

             {/* Section: Format */}
             <section className="space-y-5">
               <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-900 pb-2">
                  <Layout size={14} /> Format
               </h3>
               <div className="space-y-6">
                  <ConfigField label="Aspect Ratio" value={aspectRatio} onChange={(v) => setAspectRatio(v as AspectRatio)} options={ASPECT_RATIOS} />
                  <ConfigField label="Caption Pos" value={captionPosition} onChange={(v) => setCaptionPosition(v as CaptionPosition)} options={CAPTION_POSITIONS} />
                  <ConfigField label="Font Size" value={fontSize} onChange={(v) => setFontSize(v as FontSize)} options={FONT_SIZES} />
               </div>
            </section>
         </div>

         {/* Fixed Bottom Action */}
         <div className="p-8 bg-zinc-950 border-t border-zinc-900 shrink-0">
            <button
              onClick={onGenerate}
              disabled={!story.trim() || isGenerating}
              className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-xl border border-white/10 relative overflow-hidden group
                ${!story.trim() || isGenerating 
                  ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed' 
                  : 'bg-white text-black hover:scale-[1.02] active:scale-[0.98]'
                }`}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  <span className="text-base">Producing...</span>
                </>
              ) : (
                <>
                  <span className="relative z-10 flex items-center gap-2">
                     <MonitorPlay size={20} /> Generate
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity z-0"></div>
                </>
              )}
            </button>
         </div>
      </div>
    </div>
  );
};

const ConfigField = ({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: string[] }) => (
   <div className="group">
      <div className="flex items-center justify-between mb-2.5">
         <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider group-hover:text-zinc-400 transition-colors">{label}</label>
         <div className="flex gap-1">
             <span className="h-1 w-1 rounded-full bg-zinc-800 group-hover:bg-zinc-700"></span>
             <span className="h-1 w-1 rounded-full bg-zinc-800 group-hover:bg-zinc-700"></span>
             <span className="h-1 w-1 rounded-full bg-zinc-800 group-hover:bg-zinc-700"></span>
         </div>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-2 px-2 custom-scrollbar snap-x scroll-smooth">
         {options.map((opt) => (
            <button
               key={opt}
               onClick={() => onChange(opt)}
               className={`
                  snap-start whitespace-nowrap px-3.5 py-2 rounded-lg text-xs font-medium border transition-all duration-200 flex-shrink-0
                  ${value === opt 
                    ? 'bg-white text-black border-white shadow-[0_0_15px_-3px_rgba(255,255,255,0.2)] transform scale-[1.02]' 
                    : 'bg-zinc-900/40 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                  }
               `}
            >
               {opt}
            </button>
         ))}
      </div>
   </div>
);

export default StoryForm;