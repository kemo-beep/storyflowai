import { ArtStyle, WritingStyle, AspectRatio, TransitionStyle, Voice, CaptionPosition, FontSize } from "./types";

export const WRITING_STYLES = Object.values(WritingStyle);
export const ART_STYLES = Object.values(ArtStyle);
export const ASPECT_RATIOS = Object.values(AspectRatio);
export const TRANSITION_STYLES = Object.values(TransitionStyle);
export const VOICES = Object.values(Voice);
export const CAPTION_POSITIONS = Object.values(CaptionPosition);
export const FONT_SIZES = Object.values(FontSize);

export const DEFAULT_STORY_PROMPT = `Once upon a time in a bustling city, a small robot named Chip discovered a mysterious glowing seed in the cracks of the pavement. Unlike the other robots who were busy with their tasks, Chip was curious. He planted it in a tin can...`;

export const STYLE_KEYWORDS: Record<string, string[]> = {
  [ArtStyle.CINEMATIC]: ['4k', 'highly detailed', 'dramatic lighting', 'shallow depth of field', 'bokeh', 'anamorphic lens', 'color graded', 'photorealistic', 'ray tracing'],
  [ArtStyle.ANIME]: ['studio ghibli style', 'vibrant colors', 'cel shaded', 'clean lines', 'anime key visual', 'detailed background', 'soft lighting', 'kawaii', 'expressive'],
  [ArtStyle.WATERCOLOR]: ['soft edges', 'pastel colors', 'ink bleed', 'wet on wet', 'artistic', 'textured paper', 'dreamy', 'ethereal', 'brush strokes'],
  [ArtStyle.CYBERPUNK]: ['neon lights', 'fog', 'high tech', 'futuristic', 'cybernetics', 'rain slicked streets', 'glowing accents', 'night city', 'dystopian'],
  [ArtStyle.PIXEL_ART]: ['16-bit', 'retro', 'dithering', 'pixelated', 'sprite art', 'isometric', 'vibrant', 'arcade style', 'blocky'],
  [ArtStyle.OIL_PAINTING]: ['impasto', 'canvas texture', 'classic art', 'visible brushstrokes', 'renaissance lighting', 'rich colors', 'masterpiece', 'oil on canvas'],
  [ArtStyle.THREE_D_RENDER]: ['pixar style', 'octane render', 'unreal engine 5', 'volumetric lighting', '3d cartoon', 'smooth textures', 'ambient occlusion', 'character design'],
};