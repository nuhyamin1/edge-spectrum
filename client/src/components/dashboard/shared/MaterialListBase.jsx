import React, { useMemo, useState } from 'react';
import {
  ArrowRightIcon,
  BookOpenIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export const MaterialListBase = ({
  materials,
  loading,
  onSearch,
  onSubjectChange,
  renderActions,
  showCreateButton = false,
  onMaterialClick
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const uniqueSubjects = useMemo(() => (
    [...new Set(materials.map((material) => material.subject).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
  ), [materials]);

  const submitSearch = () => {
    const nextSearchTerm = searchInput.trim();
    setSearchTerm(nextSearchTerm);
    onSearch(nextSearchTerm);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter') {
      submitSearch();
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setSelectedSubject('');
    onSearch('');
    onSubjectChange('');
  };

  const highlightText = (text, term) => {
    if (!term) return text;

    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <mark key={index} className="rounded bg-amber-200 px-0.5 text-inherit">
          {part}
        </mark>
      ) : part
    );
  };

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = !searchTerm
      || material.title.toLowerCase().includes(searchTerm.toLowerCase())
      || material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !selectedSubject || material.subject === selectedSubject;

    return matchesSearch && matchesSubject;
  });

  const hasActiveFilters = Boolean(searchTerm || selectedSubject);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-50 shadow-[0_18px_55px_-35px_rgba(30,64,175,0.55)]">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-indigo-700 px-5 py-7 text-white sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border-[42px] border-white/5" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">
                <SparklesIcon className="h-4 w-4" />
                Learning library
              </div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Discover your next lesson</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                Search, explore, and open learning resources prepared for your speaking practice.
              </p>
            </div>
            {showCreateButton && <div className="shrink-0">{showCreateButton}</div>}
          </div>

          <div className="grid gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 shadow-lg backdrop-blur-md md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="flex min-w-0 items-center rounded-xl bg-white shadow-sm ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-cyan-300">
              <MagnifyingGlassIcon className="ml-4 h-5 w-5 shrink-0 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title or description"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0 sm:text-base"
                aria-label="Search materials"
              />
              <button
                type="button"
                onClick={submitSearch}
                className="m-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                Search
              </button>
            </div>

            <label className="flex items-center gap-2 rounded-xl bg-white px-4 shadow-sm ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-cyan-300">
              <FunnelIcon className="h-5 w-5 shrink-0 text-blue-600" />
              <span className="sr-only">Filter by subject</span>
              <select
                value={selectedSubject}
                onChange={(event) => {
                  setSelectedSubject(event.target.value);
                  onSubjectChange(event.target.value);
                }}
                className="w-full min-w-[170px] border-0 bg-transparent py-3.5 pr-8 text-sm font-medium text-slate-700 outline-none focus:ring-0 sm:text-base"
              >
                <option value="">All subjects</option>
                {uniqueSubjects.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 sm:px-8 sm:py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {filteredMaterials.length} {filteredMaterials.length === 1 ? 'material' : 'materials'} available
            </p>
            <p className="mt-0.5 text-sm text-slate-500">
              {hasActiveFilters ? 'Showing results that match your filters' : 'Choose a resource to start learning'}
            </p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
            >
              <XMarkIcon className="h-4 w-4" />
              Clear filters
            </button>
          )}
        </div>

        {filteredMaterials.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-white px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <BookOpenIcon className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No materials found</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Try another keyword or subject to discover more learning resources.
            </p>
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className="mt-5 text-sm font-semibold text-blue-600 hover:text-blue-800">
                Reset search and filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {filteredMaterials.map((material, index) => (
              <article
                key={material._id}
                role="button"
                tabIndex={0}
                onClick={() => onMaterialClick(material._id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onMaterialClick(material._id);
                  }
                }}
                className="group relative flex min-h-[245px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_40px_-24px_rgba(37,99,235,0.45)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 sm:p-6"
              >
                <div className={`absolute inset-x-0 top-0 h-1 ${index % 3 === 0 ? 'bg-gradient-to-r from-blue-600 to-cyan-400' : index % 3 === 1 ? 'bg-gradient-to-r from-indigo-600 to-violet-400' : 'bg-gradient-to-r from-cyan-500 to-emerald-400'}`} />

                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                      <BookOpenIcon className="h-5 w-5" />
                    </div>
                    <span className="truncate rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {material.subject || 'General'}
                    </span>
                  </div>
                  {renderActions && (
                    <div onClick={(event) => event.stopPropagation()} className="shrink-0">
                      {renderActions(material)}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex-1">
                  <h3 className="text-xl font-bold leading-snug text-slate-900 transition group-hover:text-blue-700">
                    {highlightText(material.title, searchTerm)}
                  </h3>
                  <p
                    className="mt-3 overflow-hidden text-sm leading-6 text-slate-600"
                    style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}
                  >
                    {highlightText(material.description, searchTerm)}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition-all group-hover:gap-3 group-hover:text-blue-800">
                    Open material
                    <ArrowRightIcon className="h-4 w-4" />
                  </span>
                  {material.fileUrl && (
                    <a
                      href={material.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="text-xs font-medium text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-blue-700"
                    >
                      View file
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
