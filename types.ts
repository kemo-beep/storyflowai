
export interface StorySegment {
  id: string;
  narration: string;
  visualPrompt: string;
  imageData?: string; // Base64 data URI
  audioUrl?: string; // Base64 Data URI (WAV) or Blob URL
  duration?: number;
}

export enum AspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
  SQUARE = '1:1',
  CLASSIC = '4:3',
  PORTRAIT_ALT = '3:4'
}

export enum TransitionStyle {
  CINEMATIC = 'Cinematic Blur',
  ZOOM_WARP = 'Zoom Warp',
  SLIDE = 'Horizontal Slide',
  DISSOLVE = 'Classic Dissolve',
}

export enum Voice {
  KORE = 'Kore (Female, Soothing)',
  PUCK = 'Puck (Male, Energetic)',
  CHARON = 'Charon (Male, Deep)',
  FENRIR = 'Fenrir (Male, Intense)',
  ZEPHYR = 'Zephyr (Female, Calm)',
}

export enum CaptionPosition {
  BOTTOM = 'Bottom Overlay',
  CENTER = 'Centered',
  TOP = 'Top Overlay',
  BELOW = 'Below Image (Cinematic)'
}

export enum FontSize {
  SMALL = 'Small',
  MEDIUM = 'Medium',
  LARGE = 'Large',
  EXTRA_LARGE = 'Extra Large'
}

export enum WritingStyle {
  VIRAL = 'Viral & Clickbaity',
  INTENSE = 'Intense Thriller',
  FAIRY_TALE = 'Whimsical Fairy Tale',
  NOIR = 'Dark Noir',
  EDUCATIONAL = 'Educational & Clear',
  COMEDIC = 'Witty & Comedic',
}

export enum ArtStyle {
  CINEMATIC = 'Cinematic Realistic',
  ANIME = 'Anime/Manga',
  WATERCOLOR = 'Watercolor',
  CYBERPUNK = 'Cyberpunk Neon',
  PIXEL_ART = 'Pixel Art',
  OIL_PAINTING = 'Classic Oil Painting',
  THREE_D_RENDER = '3D Pixar Style',
}

export interface StoryData {
  title: string;
  scenes: StorySegment[];
  aspectRatio?: AspectRatio;
  transitionStyle?: TransitionStyle;
  voice?: Voice;
  captionPosition?: CaptionPosition;
  fontSize?: FontSize;
  writingStyle?: WritingStyle;
  artStyle?: ArtStyle;
  lastSaved?: number;
  originalPrompt?: string; // To restore the input
}

export type AppState = 'IDLE' | 'GENERATING_STORY' | 'GENERATING_IMAGES' | 'GENERATING_AUDIO' | 'REVIEW' | 'PLAYING';

export type Route = 'LANDING' | 'AUTH' | 'DASHBOARD' | 'EDITOR' | 'SHOWCASE';

export interface User {
  id: string;
  email: string;
}

export interface Project {
  id: string;
  title: string;
  content: StoryData;
  updated_at: string;
  user_id?: string;
}
