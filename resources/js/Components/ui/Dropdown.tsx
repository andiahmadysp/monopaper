import { cn } from '@/lib/utils';
import { useEffect, useRef, useState, type ReactNode } from 'react';

interface DropdownItem {
    label: string;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
    icon?: ReactNode;
}

interface DropdownProps {
    trigger: ReactNode;
    items: DropdownItem[];
    align?: 'left' | 'right';
    className?: string;
}

export function Dropdown({ trigger, items, align = 'left', className }: DropdownProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function onOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        document.addEventListener('mousedown', onOutside);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onOutside);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    return (
        <div ref={ref} className={cn('dropdown', className)}>
            <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
            {open && (
                <div className={cn('dropdown-menu', align === 'right' && 'dropdown-menu--right')}>
                    {items.map((item, i) => (
                        <button
                            key={i}
                            className={cn('dropdown-item', item.danger && 'dropdown-item--danger')}
                            disabled={item.disabled}
                            onClick={() => {
                                setOpen(false);
                                item.onClick();
                            }}
                        >
                            {item.icon && <span className="dropdown-item-icon">{item.icon}</span>}
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
