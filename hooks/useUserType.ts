import { useAuth } from './useAuth';

export function useUserType() {
  const { userType, loading } = useAuth();

  return {
    userType,
    isCaffeineUser: userType === 'caffeine',
    isCoffeeUser: userType === 'coffee',
    loading,
  };
}
