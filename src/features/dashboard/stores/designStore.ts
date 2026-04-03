import { create } from 'zustand';

interface DesignToken {
  name: string;
  value: string;
  category: 'color' | 'typography' | 'spacing';
}

interface GeneratedComponent {
  name: string;
  code: string;
  path: string;
}

interface DesignState {
  figmaUrl: string | null;
  designTokens: DesignToken[];
  generatedComponents: GeneratedComponent[];
  isGenerating: boolean;
  setFigmaUrl: (url: string) => void;
  setDesignTokens: (tokens: DesignToken[]) => void;
  addGeneratedComponent: (component: GeneratedComponent) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  reset: () => void;
}

export const useDesignStore = create<DesignState>((set) => ({
  figmaUrl: null,
  designTokens: [],
  generatedComponents: [],
  isGenerating: false,
  setFigmaUrl: (url) => set({ figmaUrl: url }),
  setDesignTokens: (tokens) => set({ designTokens: tokens }),
  addGeneratedComponent: (component) =>
    set((state) => ({
      generatedComponents: [...state.generatedComponents, component],
    })),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  reset: () =>
    set({
      figmaUrl: null,
      designTokens: [],
      generatedComponents: [],
      isGenerating: false,
    }),
}));
