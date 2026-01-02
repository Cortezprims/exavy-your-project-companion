import { useState } from 'react';

interface UseGeminiOptions {
  model?: 'gemini-2.0-flash' | 'gemini-1.5-pro' | 'gemini-1.5-flash';
  systemPrompt?: string;
  maxTokens?: number;
}

export const useGemini = (options: UseGeminiOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (prompt: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with Supabase edge function call when Cloud is enabled
      // const { data, error: fnError } = await supabase.functions.invoke('gemini', {
      //   body: {
      //     prompt,
      //     model: options.model || 'gemini-2.0-flash',
      //     systemPrompt: options.systemPrompt,
      //     maxTokens: options.maxTokens || 8192,
      //   },
      // });
      
      console.log('Gemini generate called with:', prompt);
      setError('Lovable Cloud requis pour utiliser Gemini AI');
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { generate, isLoading, error };
};
