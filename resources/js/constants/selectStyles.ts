import type { StylesConfig } from 'react-select';

export const SELECT_STYLES: StylesConfig<any, false> = {
    control: (base, state) => ({
        ...base,
        minHeight: '38px',
        height: '38px',
        borderRadius: 'var(--r-md)',
        background: 'var(--surface)',
        borderColor: state.isFocused ? 'var(--fg-2)' : 'var(--border)',
        boxShadow: 'none',
        '&:hover': {
            borderColor: state.isFocused ? 'var(--fg-2)' : 'var(--border)',
        },
        cursor: 'pointer',
    }),
    valueContainer: (base) => ({
        ...base,
        padding: '0 12px',
        height: '36px',
    }),
    singleValue: (base) => ({
        ...base,
        color: 'var(--fg)',
        fontSize: 'var(--fs-md)',
        margin: 0,
    }),
    input: (base) => ({
        ...base,
        color: 'var(--fg)',
        fontSize: 'var(--fs-md)',
        margin: 0,
        padding: 0,
    }),
    menu: (base) => ({
        ...base,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        boxShadow: '0 8px 30px -4px rgba(0, 0, 0, 0.1)',
        zIndex: 9999,
        padding: '4px',
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
            ? 'var(--accent)'
            : state.isFocused
                ? 'var(--hover)'
                : 'transparent',
        color: state.isSelected ? 'var(--accent-fg)' : 'var(--fg)',
        fontSize: 'var(--fs-md)',
        cursor: 'pointer',
        borderRadius: 'var(--r-sm)',
        padding: '8px 12px',
        '&:active': { backgroundColor: 'var(--active)' },
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base) => ({
        ...base,
        color: 'var(--fg-3)',
        padding: '0 8px',
        '&:hover': { color: 'var(--fg-2)' },
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};
