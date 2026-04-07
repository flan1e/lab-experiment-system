import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
    const { darkMode, toggleDarkMode } = useTheme();
    return (
        <button
            onClick={toggleDarkMode}
            aria-label="Переключить тему"
            style={{
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer'
            }}
        >
            {darkMode ? '🌙' : '☀️'}
        </button>
    );
};

export default ThemeToggle;