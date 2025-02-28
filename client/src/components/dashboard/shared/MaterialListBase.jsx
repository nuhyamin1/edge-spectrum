import React, { useState } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export const MaterialListBase = ({ 
  materials, 
  loading, 
  onSearch, 
  onSubjectChange,
  renderActions, // Function to render action buttons (different for teacher/student)
  showCreateButton = false, // Only true for teacher view
  onMaterialClick // Add this new prop
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      setSearchTerm(searchInput);
      onSearch(searchInput);
    }
  };

  const getUniqueSubjects = () => {
    const subjects = new Set();
    materials.forEach(material => {
      if (material.subject) {
        subjects.add(material.subject);
      }
    });
    return Array.from(subjects);
  };

  const highlightText = (text, searchTerm) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-medium">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = !searchTerm || 
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubject = !selectedSubject || 
      material.subject === selectedSubject;

    return matchesSearch && matchesSubject;
  });

  return (
    <div className="relative bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden 
      border border-blue-200 shadow-lg">
      
      {/* Header */}
      <div className="p-6 border-b border-blue-200 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-900">Materials</h2>
          {showCreateButton}
        </div>

        {/* Search and Filter */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search by title or description... (Press Enter)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 
              focus:ring-blue-400 focus:border-blue-400 transition-all duration-300
              placeholder-gray-400 bg-white/50 backdrop-blur-sm"
          />
          
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              onSubjectChange(e.target.value);
            }}
            className="p-3 border border-blue-200 rounded-lg min-w-[150px]
              focus:ring-2 focus:ring-blue-400 focus:border-blue-400 
              transition-all duration-300 bg-white/50 backdrop-blur-sm"
          >
            <option value="">All Subjects</option>
            {getUniqueSubjects().map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials List */}
      <div className="divide-y divide-blue-100">
        {filteredMaterials.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-gray-50">
            <p className="font-medium">No materials found.</p>
          </div>
        ) : (
          filteredMaterials.map(material => (
            <div 
              key={material._id}
              className="group p-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-white
                transition-all duration-300 cursor-pointer relative overflow-hidden"
              onClick={() => onMaterialClick(material._id)}
            >
              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 to-blue-400/0 
                group-hover:from-blue-400/5 group-hover:to-transparent transition-all duration-500"/>
              
              <div className="flex justify-between items-start relative">
                <div className="flex-1 group-hover:translate-x-2 transition-transform duration-300">
                  <h3 className="text-lg font-semibold text-blue-900 mb-1">
                    {highlightText(material.title, searchTerm)}
                  </h3>
                  <p className="text-sm text-blue-600 px-3 py-1 bg-blue-50 rounded-full 
                    inline-block mb-2">
                    {material.subject}
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {highlightText(material.description, searchTerm)}
                  </p>
                  {material.fileUrl && (
                    <a
                      href={material.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 text-sm mt-3 
                        inline-flex items-center gap-1 font-medium
                        hover:gap-2 transition-all duration-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Material
                      <ArrowRightIcon className="w-4 h-4" />
                    </a>
                  )}
                </div>
                {renderActions && (
                  <div onClick={(e) => e.stopPropagation()} 
                    className="group-hover:scale-105 transition-transform duration-300">
                    {renderActions(material)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};