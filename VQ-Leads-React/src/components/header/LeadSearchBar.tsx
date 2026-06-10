import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, User, Mail, Phone, Hash } from 'lucide-react';
import { api, type Lead } from '../../api';

function highlightMatch(text: string, query: string) {
  if (!text || !query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-primary/20 px-0.5 text-foreground">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['lead-search', debounced],
    queryFn: () => api.searchLeads(debounced),
    enabled: debounced.length >= 2,
  });

  useEffect(() => {
    setActiveIndex(-1);
  }, [debounced, results.length]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const openLead = (lead: Lead) => {
    setOpen(false);
    setQuery('');
    navigate(`/leads?id=${lead.id}`);
  };

  const viewAllResults = () => {
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    navigate(`/leads?q=${encodeURIComponent(q)}`);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        openLead(results[activeIndex]);
      } else if (query.trim()) {
        viewAllResults();
      }
      return;
    }
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i <= 0 ? results.length - 1 : i - 1));
    }
  };

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-full md:max-w-md">
      <Search size={15} className="absolute left-3 top-3 text-muted-foreground pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search by name, phone, email, or ID…"
        className="flex h-10 w-full rounded-lg border border-input bg-muted/20 pl-9 pr-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-ring transition-all"
        aria-label="Search leads"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        role="combobox"
      />
      {isFetching && debounced.length >= 2 && (
        <Loader2 size={14} className="absolute right-3 top-3 animate-spin text-muted-foreground" />
      )}

      {showDropdown && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          <div className="border-b border-border/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Search leads
          </div>

          {results.length === 0 && !isFetching ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              No leads found for &ldquo;{debounced}&rdquo;
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1" role="listbox">
              {results.slice(0, 8).map((lead, i) => (
                <li key={lead.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === activeIndex}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => openLead(lead)}
                    className={`flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors ${
                      i === activeIndex ? 'bg-primary/10' : 'hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {highlightMatch(lead.name, debounced)}
                      </span>
                      <span className="shrink-0 text-[10px] font-bold text-muted-foreground">#{lead.id}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      {lead.email && (
                        <span className="inline-flex items-center gap-1 truncate">
                          <Mail size={10} />
                          {highlightMatch(lead.email, debounced)}
                        </span>
                      )}
                      {lead.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone size={10} />
                          {highlightMatch(lead.phone, debounced)}
                        </span>
                      )}
                      {lead.owner_name && (
                        <span className="inline-flex items-center gap-1">
                          <User size={10} />
                          {lead.owner_name}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {query.trim() && (
            <button
              type="button"
              onClick={viewAllResults}
              className="flex w-full items-center justify-center gap-1.5 border-t border-border/60 px-3 py-2.5 text-xs font-semibold text-primary hover:bg-muted/30"
            >
              <Hash size={12} />
              View all results for &ldquo;{query.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
};
