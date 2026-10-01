import clsx from 'clsx';
import type { FC } from 'react';
import styles from './SegmentedControl.module.css';

export interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  /** Accessible name of the group, e.g. "כלי". */
  label: string;
  options: readonly SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  size?: 'md' | 'sm';
  className?: string;
}

const SegmentedControl: FC<SegmentedControlProps> = ({
  label,
  options,
  value,
  onChange,
  size = 'md',
  className,
}) => {
  return (
    <div
      className={clsx(styles.group, size === 'sm' && styles.small, className)}
      role="group"
      aria-label={label}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className={styles.option}
            aria-pressed={isSelected}
            onClick={() => {
              if (!isSelected) onChange(option.value);
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;
