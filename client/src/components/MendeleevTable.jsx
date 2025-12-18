import React, { useState } from 'react';

const MendeleevTable = () => {
    const [viewMode, setViewMode] = useState('hidden'); 

    const toggleMinimized = () => {
        if (viewMode === 'hidden' || viewMode === 'maximized') {
            setViewMode('minimized');
        } else {
            setViewMode('hidden');
        }
    };

    const toggleMaximized = () => {
        if (viewMode === 'minimized') {
            setViewMode('maximized');
        } else if (viewMode === 'maximized') {
            setViewMode('minimized');
        }
    };

    const closeTable = () => {
        setViewMode('hidden');
    };

    return (
        <div>
            <button 
                onClick={toggleMinimized}
                style={{
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginBottom: '10px'
                }}
            >
                🧪 Таблица Менделеева
            </button>

            {viewMode === 'minimized' && (
                <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    display: 'inline-block',
                    maxWidth: '100%',
                    overflow: 'auto'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        marginBottom: '10px'
                    }}>
                        <button 
                            onClick={toggleMaximized}
                            style={{
                                padding: '4px 8px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            🔍 Увеличить
                        </button>
                        <button 
                            onClick={closeTable}
                            style={{
                                padding: '4px 8px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            ✕ Закрыть
                        </button>
                    </div>
                    <img 
                        src="/images/Mendeleev_table.png" 
                        alt="Таблица Менделеева"
                        style={{
                            maxWidth: '500px',
                            height: 'auto',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                        }}
                    />
                </div>
            )}

            {viewMode === 'maximized' && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        maxWidth: '90vw',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '15px'
                        }}>
                            <h3>Таблица Менделеева</h3>
                            <div>
                                <button 
                                    onClick={toggleMaximized}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        marginRight: '5px'
                                    }}
                                >
                                    Уменьшить
                                </button>
                                <button 
                                    onClick={closeTable}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Закрыть
                                </button>
                            </div>
                        </div>
                        <img 
                            src="/images/Mendeleev_table.png" 
                            alt="Таблица Менделеева"
                            style={{
                                maxWidth: '100%',
                                height: 'auto'
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MendeleevTable;