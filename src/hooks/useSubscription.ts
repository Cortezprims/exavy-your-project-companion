import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';

export interface Subscription {
  id: string;
  plan: 'free' | 'monthly' | 'yearly';
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  started_at: string;
  expires_at: string | null;
}

export interface UsageTracking {
  documents_count: number;
  quizzes_count: number;
  flashcards_count: number;
  summaries_count: number;
  mind_maps_count: number;
  period_start: string;
}

export interface PlanLimits {
  documents_limit: number;
  quizzes_limit: number;
  flashcards_limit: number;
  summaries_limit: number;
  mind_maps_limit: number;
  has_planning: boolean;
  has_transcription: boolean;
  has_offline: boolean;
}

export interface UsageCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  plan: string;
  message?: string;
}

const FREE_LIMITS: PlanLimits = {
  documents_limit: 3,
  quizzes_limit: 10,
  flashcards_limit: 20,
  summaries_limit: 3,
  mind_maps_limit: 3,
  has_planning: false,
  has_transcription: false,
  has_offline: false,
};

const PREMIUM_LIMITS: PlanLimits = {
  documents_limit: -1,
  quizzes_limit: -1,
  flashcards_limit: -1,
  summaries_limit: -1,
  mind_maps_limit: -1,
  has_planning: true,
  has_transcription: true,
  has_offline: true,
};

export function useSubscription() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageTracking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // If admin, no need to fetch subscription — they have full access
      if (isAdmin) {
        setLoading(false);
        return;
      }
      fetchSubscriptionData();
    } else {
      setSubscription(null);
      setUsage(null);
      setLoading(false);
    }
  }, [user, isAdmin]);

  const fetchSubscriptionData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch subscription
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setSubscription(subData as Subscription | null);

      // Fetch usage
      const { data: usageData } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setUsage(usageData as UsageTracking | null);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPlan = (): 'free' | 'monthly' | 'yearly' | 'admin' => {
    // Admin users have unlimited access
    if (isAdmin) return 'admin';
    if (!subscription) return 'free';
    if (subscription.status !== 'active') return 'free';
    if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) return 'free';
    return subscription.plan;
  };

  const isPremium = (): boolean => {
    // Admin users are considered premium
    if (isAdmin) return true;
    const plan = getCurrentPlan();
    return plan === 'monthly' || plan === 'yearly' || plan === 'admin';
  };

  const getLimits = (): PlanLimits => {
    return isPremium() ? PREMIUM_LIMITS : FREE_LIMITS;
  };

  const checkLimit = async (resourceType: 'documents' | 'quizzes' | 'flashcards' | 'summaries' | 'mind_maps'): Promise<UsageCheckResult> => {
    if (!user) {
      return {
        allowed: false,
        current: 0,
        limit: 0,
        plan: 'free',
        message: 'Veuillez vous connecter.',
      };
    }

    // Admin users bypass all limits
    if (isAdmin) {
      return {
        allowed: true,
        current: 0,
        limit: -1,
        plan: 'admin',
      };
    }

    try {
      const { data, error } = await supabase.rpc('check_usage_limit', {
        p_user_id: user.id,
        p_resource_type: resourceType,
      });

      if (error) throw error;
      
      // Type assertion with validation
      const result = data as unknown as UsageCheckResult;
      return result;
    } catch (error) {
      console.error('Error checking limit:', error);
      // Default to allowed if there's an error
      return {
        allowed: true,
        current: 0,
        limit: -1,
        plan: getCurrentPlan(),
      };
    }
  };

  const incrementUsage = async (resourceType: 'documents' | 'quizzes' | 'flashcards' | 'summaries' | 'mind_maps'): Promise<void> => {
    if (!user) return;

    try {
      await supabase.rpc('increment_usage', {
        p_user_id: user.id,
        p_resource_type: resourceType,
      });
      // Refresh usage data
      await fetchSubscriptionData();
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  };

  const getUsagePercentage = (resourceType: 'documents' | 'quizzes' | 'flashcards' | 'summaries' | 'mind_maps'): number => {
    // Admin users have no usage limits
    if (isAdmin) return 0;
    if (!usage) return 0;
    const limits = getLimits();
    
    const countMap: Record<string, number> = {
      documents: usage.documents_count,
      quizzes: usage.quizzes_count,
      flashcards: usage.flashcards_count,
      summaries: usage.summaries_count,
      mind_maps: usage.mind_maps_count,
    };

    const limitMap: Record<string, number> = {
      documents: limits.documents_limit,
      quizzes: limits.quizzes_limit,
      flashcards: limits.flashcards_limit,
      summaries: limits.summaries_limit,
      mind_maps: limits.mind_maps_limit,
    };

    const current = countMap[resourceType] || 0;
    const limit = limitMap[resourceType] || 1;

    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  return {
    subscription,
    usage,
    loading,
    isAdmin,
    getCurrentPlan,
    isPremium,
    getLimits,
    checkLimit,
    incrementUsage,
    getUsagePercentage,
    refresh: fetchSubscriptionData,
  };
}
