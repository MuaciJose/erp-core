import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Search, X } from 'lucide-react';

export const Autocomplete = ({ 
    label, 
    placeholder, 
    onSearch, // Função async que retorna array de dados
    onSelect, // Função chamada ao selecionar um item
    renderItem, // Função que retorna o JSX de cada item da lista
    displayValue, // Função que extrai o texto para mostrar no input após seleção
    initialValue = ''
}) => {
    const [query, setQuery] = useState(initialValue);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    // Atualiza o input se o valor inicial mudar externamente
    useEffect(() => {
        setQuery(initialValue);
    }, [initialValue]);

    // Debounce para busca
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length > 1 && showSuggestions) {
                setLoading(true);
                try {
                    const results = await onSearch(query);
                    setSuggestions(results || []);
                    setHighlightedIndex(-1); // Reseta destaque
                } catch (error) {
                    console.error("Erro no autocomplete:", error);
                    setSuggestions([]);
                } finally {
                    setLoading(false);
                }
            } else if (query.length <= 1) {
                setSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query, showSuggestions, onSearch]);

    // Fecha a lista ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => 
                prev < suggestions.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
                handleSelect(suggestions[highlightedIndex]);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const handleSelect = (item) => {
        setQuery(displayValue(item));
        onSelect(item);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                {label}
                {loading && <Loader2 size={14} className="animate-spin text-blue-600" />}
            </label>
            
            <div className="relative">
                <input
                    type="text"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-8"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                />
                {query && (
                    <button 
                        type="button"
                        onClick={() => {
                            setQuery('');
                            onSelect(null); // Limpa seleção
                            setSuggestions([]);
                        }}
                        className="absolute right-2 top-2.5 text-gray-400 hover:text-red-500"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto mt-1 left-0">
                    {suggestions.map((item, index) => (
                        <li
                            key={index}
                            onClick={() => handleSelect(item)}
                            className={`p-3 cursor-pointer text-sm border-b last:border-b-0 transition-colors ${
                                index === highlightedIndex ? 'bg-blue-100' : 'hover:bg-gray-50'
                            }`}
                        >
                            {renderItem(item)}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
