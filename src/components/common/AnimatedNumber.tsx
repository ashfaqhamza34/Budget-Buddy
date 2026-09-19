import React, { useEffect, useState } from 'react';
import { formatCurrency } from '../../utils/currencies';

interface AnimatedNumberProps {
  value: number;
  currency: string;
  locale: string;
  duration?: number;
  className?: string;
  showSign?: boolean;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  currency,
  locale,
  duration = 600,
  className = '',
  showSign = false,
}) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTime: number | null = null;
    const startValue = displayValue;
    const endValue = value;

    if (startValue === endValue) return;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeOut;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  return (
    <span className={`tabular-nums font-semibold tracking-tight ${className}`}>
      {formatCurrency(displayValue, currency, locale, { showSign })}
    </span>
  );
};
