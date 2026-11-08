import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils.js';

function flattenChildren(children, group = '', result = []) {
  const nodes = Array.isArray(children) ? children : [children];

  nodes.forEach((child) => {
    if (child == null || typeof child === 'boolean') return;
    if (Array.isArray(child)) {
      flattenChildren(child, group, result);
      return;
    }
    if (typeof child !== 'object') return;

    if (child.type === Symbol.for('react.fragment')) {
      flattenChildren(child.props?.children, group, result);
    } else if (child.type === 'optgroup') {
      flattenChildren(child.props?.children, child.props?.label || '', result);
    } else if (child.type === 'option') {
      const label = child.props?.children;
      result.push({
        value: String(child.props?.value ?? label ?? ''),
        label,
        disabled: Boolean(child.props?.disabled),
        group,
      });
    }
  });

  return result;
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) return [];

  return options.flatMap((item) => {
    if (item == null) return [];

    if (Array.isArray(item.options)) {
      return item.options.map((option) => ({
        value: String(option.value ?? option.id ?? option.label ?? ''),
        label: option.label ?? option.name ?? option.title ?? String(option.value ?? option.id ?? ''),
        disabled: Boolean(option.disabled),
        group: item.label ?? item.group ?? '',
      }));
    }

    if (typeof item !== 'object') {
      return [{ value: String(item), label: String(item), disabled: false, group: '' }];
    }

    return [{
      value: String(item.value ?? item.id ?? item.label ?? item.name ?? ''),
      label: item.label ?? item.name ?? item.title ?? String(item.value ?? item.id ?? ''),
      disabled: Boolean(item.disabled),
      group: item.group ?? '',
    }];
  });
}

function getOptions(children, optionsProp) {
  return Array.isArray(optionsProp) ? normalizeOptions(optionsProp) : flattenChildren(children);
}

export const Select = forwardRef(function Select(
  {
    className,
    children,
    options: optionsProp,
    value,
    defaultValue,
    onChange,
    onBlur,
    onFocus,
    disabled = false,
    required = false,
    name,
    id,
    placeholder = 'Select an option',
    ...props
  },
  ref
) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const listboxId = `${selectId}-listbox`;
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const optionRefs = useRef([]);

  const isControlled = value !== undefined;
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(String(defaultValue ?? ''));
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState(null);

  const options = useMemo(() => getOptions(children, optionsProp), [children, optionsProp]);
  const selectedValue = String(isControlled ? value ?? '' : internalValue);
  const selectedOption = options.find((option) => option.value === selectedValue);
  const enabledIndexes = useMemo(
    () => options.map((option, index) => option.disabled ? -1 : index).filter((index) => index >= 0),
    [options]
  );

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openAbove = spaceBelow < 260 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(120, Math.min(260, (openAbove ? spaceAbove : spaceBelow) - 12));

    setPosition({
      top: openAbove ? Math.max(8, rect.top - maxHeight - 8) : rect.bottom + 8,
      left: Math.max(8, rect.left),
      width: Math.min(rect.width, window.innerWidth - 16),
      maxHeight,
    });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    updatePosition();

    const handleOutside = (event) => {
      if (rootRef.current?.contains(event.target) || panelRef.current?.contains(event.target)) return;
      closeDropdown();
    };
    const handleViewportChange = () => updatePosition();

    document.addEventListener('pointerdown', handleOutside);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [open, closeDropdown, updatePosition]);

  useEffect(() => {
    if (open && activeIndex >= 0) {
      optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, activeIndex]);

  const selectOption = useCallback((option) => {
    if (!option || option.disabled || disabled) return;
    if (!isControlled) setInternalValue(option.value);

    // Existing project handlers can continue using event.target.value.
    const target = { value: option.value, name: name || '' };
    onChange?.({ target, currentTarget: target });

    closeDropdown();
    triggerRef.current?.focus();
  }, [disabled, isControlled, name, onChange, closeDropdown]);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    updatePosition();
    setOpen(true);

    const selectedIndex = options.findIndex(
      (option) => option.value === selectedValue && !option.disabled
    );
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : (enabledIndexes[0] ?? -1));
  }, [disabled, updatePosition, options, selectedValue, enabledIndexes]);

  const handleKeyDown = (event) => {
    if (disabled) return;

    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
        openDropdown();
      }
      return;
    }

    if (event.key === 'Tab') {
      closeDropdown();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectOption(options[activeIndex]);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!enabledIndexes.length) return;
      const currentPosition = enabledIndexes.indexOf(activeIndex);
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const nextPosition = currentPosition < 0
        ? 0
        : (currentPosition + direction + enabledIndexes.length) % enabledIndexes.length;
      setActiveIndex(enabledIndexes[nextPosition]);
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      if (enabledIndexes.length) {
        setActiveIndex(event.key === 'Home' ? enabledIndexes[0] : enabledIndexes[enabledIndexes.length - 1]);
      }
    }
  };

  const listbox = open && position && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={panelRef}
          id={listboxId}
          role="listbox"
          aria-label={props['aria-label'] || 'Select an option'}
          className={cn(
            'fixed z-[99999] overflow-hidden rounded-2xl',
            'border border-white/70 dark:border-white/[0.10]',
            'bg-white/95 dark:bg-[#302b38]/[0.98] backdrop-blur-2xl',
            'shadow-[0_16px_45px_rgba(40,25,65,0.18)]',
            'dark:shadow-[0_16px_45px_rgba(0,0,0,0.45)]'
          )}
          style={{ top: position.top, left: position.left, width: position.width, maxHeight: position.maxHeight }}
        >
          <div className="overflow-y-auto p-1.5" style={{ maxHeight: position.maxHeight }}>
            {options.length === 0 ? (
              <p className="px-3 py-5 text-center text-xs text-text-muted">No options available</p>
            ) : options.map((option, index) => {
              const isSelected = option.value === selectedValue;
              const isActive = activeIndex === index;
              const showGroup = option.group && (index === 0 || options[index - 1]?.group !== option.group);

              return (
                <div key={`${option.value}-${index}`}>
                  {showGroup && (
                    <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      {option.group}
                    </p>
                  )}
                  <button
                    ref={(element) => { optionRefs.current[index] = element; }}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectOption(option)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5',
                      'text-left text-[13px] transition-colors',
                      isSelected
                        ? 'bg-accent/[0.11] font-semibold text-accent dark:bg-accent/[0.17]'
                        : 'text-text-main hover:bg-accent/[0.07]',
                      isActive && !isSelected && 'bg-highlight',
                      option.disabled && 'cursor-not-allowed opacity-40'
                    )}
                  >
                    <span className="min-w-0 truncate">{option.label}</span>
                    {isSelected && <Check size={16} strokeWidth={2.5} className="shrink-0 text-accent" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={rootRef} className="relative w-full min-w-0">
      <select
        ref={ref}
        id={selectId}
        name={name}
        value={selectedValue}
        required={required}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        readOnly
        className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
      >
        <option value="" />
        {options.map((option, index) => (
          <option key={`${option.value}-${index}`} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={props['aria-label']}
        onClick={() => open ? closeDropdown() : openDropdown()}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        onFocus={onFocus}
        className={cn(
          'group flex w-full min-w-0 items-center justify-between gap-3 rounded-xl',
          'border border-border/70 bg-white/75 px-3.5 py-[11px]',
          'text-left text-[13px] font-medium text-text-main transition-all duration-200',
          'hover:border-accent/40 hover:bg-white',
          'focus:border-accent/60 focus:outline-none focus:ring-[3px] focus:ring-accent/10',
          'dark:border-white/[0.10] dark:bg-[#302b38]/55 dark:hover:bg-[#383241]/75',
          'disabled:cursor-not-allowed disabled:opacity-50',
          open && 'border-accent/50 bg-white ring-[3px] ring-accent/10 dark:bg-[#383241]',
          className
        )}
      >
        <span className={cn('min-w-0 truncate', !selectedOption && 'text-text-muted')}>
          {selectedOption?.label ?? placeholder}
        </span>
        <span className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-text-muted',
          'transition-all duration-200 group-hover:bg-accent/10 group-hover:text-accent',
          open && 'rotate-180 bg-accent/10 text-accent'
        )}>
          <ChevronDown size={15} strokeWidth={2} />
        </span>
      </button>

      {listbox}
    </div>
  );
});
