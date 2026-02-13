import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getBrewPreferences } from '../lib/database';

export function useUserType() {
  const { profile } = useAuth();
  const [userType, setUserType] = useState<'coffee' | 'caffeine'>('coffee');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserType() {
      if (!profile?.id) {
        setLoading(false);
        return;
      }

      const preferences = await getBrewPreferences(profile.id);
      if (preferences?.userType) {
        setUserType(preferences.userType);
      }
      setLoading(false);
    }

    loadUserType();
  }, [profile?.id]);

  return {
    userType,
    isCaffeineUser: userType === 'caffeine',
    isCoffeeUser: userType === 'coffee',
    loading,
  };
}
