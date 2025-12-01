
import React, { useState, useEffect } from 'react';
import StoryForm from './components/StoryForm';
import StoryPlayer from './components/StoryPlayer';
import ProcessingState from './components/ProcessingState';
import StoryEditor from './components/StoryEditor';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import ShowcasePage from './components/ShowcasePage';

import { AppState, ArtStyle, StoryData, StorySegment, WritingStyle, AspectRatio, TransitionStyle, Voice, CaptionPosition, FontSize, Route, User, Project } from './types';
import { generateImageForScene, generateStorySegments, generateSpeech, splitSceneWithAI } from './services/geminiService';
import { saveProjectToCloud, getCurrentUser, supabase } from './services/supabaseClient';
import { ArtStyle as EnumArtStyle, WritingStyle as EnumWritingStyle, AspectRatio as EnumAspectRatio, TransitionStyle as EnumTransitionStyle, Voice as EnumVoice, CaptionPosition as EnumCaptionPosition, FontSize as EnumFontSize } from './types';
import { DEFAULT_STORY_PROMPT } from './constants';

function App() {
  // --- Global Router State ---
  const [route, setRoute] = useState<Route>('LANDING');
  const [user, setUser] = useState<User | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // --- Story Engine State ---
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [storyInput, setStoryInput] = useState(DEFAULT_STORY_PROMPT);
  
  // Settings
  const [writingStyle, setWritingStyle] = useState<WritingStyle>(EnumWritingStyle.VIRAL);
  const [artStyle, setArtStyle] = useState<ArtStyle>(EnumArtStyle.CINEMATIC);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(EnumAspectRatio.LANDSCAPE);
  const [transitionStyle, setTransitionStyle] = useState<TransitionStyle>(EnumTransitionStyle.CINEMATIC);
  const [voice, setVoice] = useState<Voice>(EnumVoice.KORE);
  const [captionPosition, setCaptionPosition] = useState<CaptionPosition>(EnumCaptionPosition.BOTTOM);
  const [fontSize, setFontSize] = useState<FontSize>(EnumFontSize.MEDIUM);
  
  const [processingStatus, setProcessingStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [saving, setSaving] = useState(false);

  // --- Auth & Session Init ---
  useEffect(() => {
    checkSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
            setUser({ id: session.user.id, email: session.user.email || '' });
            if (route === 'LANDING' || route === 'AUTH') {
                setRoute('DASHBOARD');
            }
        } else {
            setUser(null);
            if (route !== 'SHOWCASE') {
               setRoute('LANDING');
            }
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
      const u = await getCurrentUser();
      if (u) {
          setUser({ id: u.id, email: u.email || '' });
          setRoute('DASHBOARD');
      }
  };

  // --- Cloud Saving ---
  // Debounce save to Supabase when storyData changes
  useEffect(() => {
      if (storyData && currentProjectId && user) {
          const timer = setTimeout(() => {
              handleCloudSave();
          }, 2000);
          return () => clearTimeout(timer);
      }
  }, [storyData]);

  const handleCloudSave = async () => {
     if (!storyData || !currentProjectId) return;
     setSaving(true);
     await saveProjectToCloud(currentProjectId, storyData.title || 'Untitled', storyData);
     setStoryData(prev => prev ? { ...prev, lastSaved: Date.now() } : null);
     setSaving(false);
  };

  // --- Project Management ---
  const handleCreateNew = () => {
     // Reset all engine state
     setStoryData(null);
     setStoryInput(DEFAULT_STORY_PROMPT);
     setAppState('IDLE');
     setCurrentProjectId(crypto.randomUUID()); // Generate new ID
     setRoute('EDITOR');
  };

  const handleOpenProject = (project: Project) => {
      setCurrentProjectId(project.id);
      setStoryData(project.content);
      // Restore inputs from content if available
      if (project.content.originalPrompt) setStoryInput(project.content.originalPrompt);
      if (project.content.artStyle) setArtStyle(project.content.artStyle);
      // ... restore other settings if needed
      
      setAppState('REVIEW');
      setRoute('EDITOR');
  };

  const handleBackToDashboard = () => {
      setRoute('DASHBOARD');
      setAppState('IDLE');
      setStoryData(null);
  };

  // --- Story Engine Handlers ---

  const handleGenerate = async () => {
    try {
      if (!storyInput.trim()) {
        alert("Please enter a story to generate.");
        return;
      }

      setAppState('GENERATING_STORY');
      setProcessingStatus('Drafting script and storyboard...');
      setProgress(5);

      // 1. Generate Text Segments
      const generatedStory = await generateStorySegments(storyInput, writingStyle, artStyle);
      
      const currentStoryData: StoryData = { 
        ...generatedStory, 
        aspectRatio,
        transitionStyle,
        voice,
        captionPosition,
        fontSize,
        writingStyle,
        artStyle,
        lastSaved: Date.now(),
        originalPrompt: storyInput
      };
      setStoryData(currentStoryData);
      
      // 2. Parallel Generation (Images & Audio)
      setAppState('GENERATING_IMAGES'); 
      const totalScenes = generatedStory.scenes.length;
      const scenesWithMedia: StorySegment[] = [];

      for (let i = 0; i < totalScenes; i++) {
        const scene = generatedStory.scenes[i];
        setProcessingStatus(`Production in progress: Scene ${i + 1} of ${totalScenes}...`);
        
        if (i > 0) await new Promise(resolve => setTimeout(resolve, 1500));

        try {
          const [base64Image, audioUrl] = await Promise.all([
            generateImageForScene(scene.visualPrompt, aspectRatio),
            generateSpeech(scene.narration, voice)
          ]);
          
          scenesWithMedia.push({
            ...scene,
            imageData: base64Image,
            audioUrl: audioUrl
          });

        } catch (err) {
            console.error(`Failed media generation for scene ${i}:`, err);
            scenesWithMedia.push({
                ...scene,
                imageData: `https://picsum.photos/seed/${scene.id}/1280/720`,
            });
        }
        
        const currentProgress = 5 + ((i + 1) / totalScenes) * 90;
        setProgress(currentProgress);
      }

      setStoryData({ ...currentStoryData, scenes: scenesWithMedia, lastSaved: Date.now() });
      setAppState('REVIEW');
      setProcessingStatus('Finalizing production...');
      setProgress(100);

    } catch (error) {
      console.error("Error generating story:", error);
      alert("Something went wrong while creating your story. Please check your API key and try again.");
      setAppState('IDLE');
    }
  };

  const handleUpdateScene = (index: number, field: keyof StorySegment, value: string) => {
    if (!storyData) return;
    const newScenes = [...storyData.scenes];
    const updatedScene = { ...newScenes[index], [field]: value };
    if (field === 'narration' && value !== newScenes[index].narration) {
       updatedScene.audioUrl = undefined;
    }
    newScenes[index] = updatedScene;
    setStoryData({ ...storyData, scenes: newScenes });
  };

  const handleUpdateStory = (field: keyof StoryData, value: any) => {
    if (!storyData) return;
    setStoryData({ ...storyData, [field]: value });
  };

  const handleRegenerateImage = async (index: number) => {
     if (!storyData) return;
     const scene = storyData.scenes[index];
     const newImage = await generateImageForScene(scene.visualPrompt, storyData.aspectRatio || AspectRatio.LANDSCAPE);
     const newScenes = [...storyData.scenes];
     newScenes[index] = { ...scene, imageData: newImage };
     setStoryData({ ...storyData, scenes: newScenes });
  };

  const handleRegenerateAudio = async (index: number) => {
    if (!storyData) return;
    const scene = storyData.scenes[index];
    const newAudio = await generateSpeech(scene.narration, storyData.voice || Voice.KORE);
    const newScenes = [...storyData.scenes];
    newScenes[index] = { ...scene, audioUrl: newAudio };
    setStoryData({ ...storyData, scenes: newScenes });
 };

 const handleReorderScenes = (newScenes: StorySegment[]) => {
    if (!storyData) return;
    setStoryData({ ...storyData, scenes: newScenes });
  };

  const handleAddScene = () => {
    if (!storyData) return;
    const newId = `scene-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newScene: StorySegment = {
      id: newId,
      narration: "New scene narration...",
      visualPrompt: "Describe the visual for this scene...",
    };
    setStoryData({ ...storyData, scenes: [...storyData.scenes, newScene] });
  };

  const handleDeleteScene = (index: number) => {
    if (!storyData) return;
    const newScenes = [...storyData.scenes];
    newScenes.splice(index, 1);
    setStoryData({ ...storyData, scenes: newScenes });
  };
  
  const handleSplitScene = async (index: number) => {
    if (!storyData) return;
    const sceneToSplit = storyData.scenes[index];
    
    const splitParts = await splitSceneWithAI(
      sceneToSplit.narration, 
      sceneToSplit.visualPrompt, 
      storyData.artStyle || EnumArtStyle.CINEMATIC
    );

    const newScenes: StorySegment[] = [];
    
    for (let i = 0; i < splitParts.length; i++) {
      const part = splitParts[i];
      const imageData = await generateImageForScene(part.visualPrompt, storyData.aspectRatio || AspectRatio.LANDSCAPE);
      const audioUrl = await generateSpeech(part.narration, storyData.voice || Voice.KORE);
      newScenes.push({
        id: `${sceneToSplit.id}-split-${i}`,
        narration: part.narration,
        visualPrompt: part.visualPrompt,
        imageData,
        audioUrl
      });
      await new Promise(r => setTimeout(r, 500));
    }

    const allScenes = [...storyData.scenes];
    allScenes.splice(index, 1, ...newScenes);
    setStoryData({ ...storyData, scenes: allScenes });
  };


  // --- Render Routing ---
  
  if (route === 'LANDING') {
      return (
        <LandingPage 
          onLogin={() => setRoute('AUTH')} 
          onGetStarted={() => setRoute('AUTH')} 
          onShowcase={() => setRoute('SHOWCASE')}
        />
      );
  }

  if (route === 'AUTH') {
      return <AuthPage onSuccess={() => setRoute('DASHBOARD')} onBack={() => setRoute('LANDING')} />;
  }

  if (route === 'SHOWCASE') {
      return <ShowcasePage onBack={() => setRoute('LANDING')} />;
  }

  if (route === 'DASHBOARD') {
      return (
        <Dashboard 
          user={user} 
          onLogout={() => setRoute('LANDING')}
          onCreateNew={handleCreateNew}
          onEditProject={handleOpenProject}
        />
      );
  }

  // --- EDITOR ROUTE (Story Engine) ---
  return (
    <div className="relative w-full h-screen bg-black text-zinc-100 overflow-hidden font-sans">
      <div className="absolute inset-0 bg-noise pointer-events-none z-0"></div>
      
      <div className="relative z-10 w-full h-full flex flex-col">
        {appState === 'IDLE' && (
          <>
             {/* Simple Back Nav */}
             <div className="absolute top-6 left-6 z-50">
                <button onClick={handleBackToDashboard} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors bg-black/50 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                   &larr; Back to Dashboard
                </button>
             </div>
             
             <StoryForm 
                story={storyInput}
                setStory={setStoryInput}
                writingStyle={writingStyle}
                setWritingStyle={setWritingStyle}
                artStyle={artStyle}
                setArtStyle={setArtStyle}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                transitionStyle={transitionStyle}
                setTransitionStyle={setTransitionStyle}
                voice={voice}
                setVoice={setVoice}
                captionPosition={captionPosition}
                setCaptionPosition={setCaptionPosition}
                fontSize={fontSize}
                setFontSize={setFontSize}
                onGenerate={handleGenerate}
                isGenerating={false}
             />
          </>
        )}

        {(appState === 'GENERATING_STORY' || appState === 'GENERATING_IMAGES' || appState === 'GENERATING_AUDIO') && (
          <ProcessingState status={processingStatus} progress={progress} />
        )}

        {appState === 'REVIEW' && storyData && (
          <StoryEditor 
             data={storyData}
             onUpdateScene={handleUpdateScene}
             onUpdateStory={handleUpdateStory}
             onRegenerateImage={handleRegenerateImage}
             onRegenerateAudio={handleRegenerateAudio}
             onPlayMovie={() => setAppState('PLAYING')}
             onBack={handleBackToDashboard}
             onReorderScenes={handleReorderScenes}
             onAddScene={handleAddScene}
             onDeleteScene={handleDeleteScene}
             onSplitScene={handleSplitScene}
          />
        )}

        {appState === 'PLAYING' && storyData && (
          <StoryPlayer data={storyData} onReset={() => setAppState('REVIEW')} />
        )}
      </div>
    </div>
  );
}

export default App;
