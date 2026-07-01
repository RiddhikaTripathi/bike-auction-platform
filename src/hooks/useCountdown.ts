import { useState, useEffect, useCallback } from 'react';
import { getTimeRemainingSeconds } from '../lib/utils';

interface UseCountdownReturn {
  seconds: number;
  isEnded: boolean;
  isEndingSoon: boolean;
  refresh: () => void;
}

export function useCountdown(endTime: string | Date, refreshInterval: number = 1000): UseCountdownReturn {
  const calculateSeconds = useCallback(() => getTimeRemainingSeconds(endTime), [endTime]);

  const [seconds, setSeconds] = useState(calculateSeconds);

  useEffect(() => {
    setSeconds(calculateSeconds());

    const interval = setInterval(() => {
      const newSeconds = calculateSeconds();
      setSeconds(newSeconds);
      if (newSeconds <= 0) {
        clearInterval(interval);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [calculateSeconds, refreshInterval]);

  const refresh = useCallback(() => {
    setSeconds(calculateSeconds());
  }, [calculateSeconds]);

  return {
    seconds,
    isEnded: seconds <= 0,
    isEndingSoon: seconds > 0 && seconds < 300,
    refresh,
  };
}
