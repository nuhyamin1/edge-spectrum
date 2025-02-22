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
      border border-blue-200 group hover:border-blue-400
      transition-all duration-300 hover:shadow-lg hover:shadow-blue-400/20">
      
      {/* Header */}
      <div className="p-6 border-b border-blue-200">
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
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
          
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              onSubjectChange(e.target.value);
            }}
            className="p-2 border border-gray-300 rounded-lg min-w-[150px]"
          >
            <option value="">All Subjects</option>
            {getUniqueSubjects().map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials List */}
      <div className="divide-y divide-gray-200">
        {filteredMaterials.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            No materials found.
          </div>
        ) : (
          filteredMaterials.map(material => (
            <div 
              key={material._id}
              className="p-6 hover:bg-blue-50 transition-all duration-300 cursor-pointer"
              onClick={() => onMaterialClick(material._id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900">
                    {highlightText(material.title, searchTerm)}
                  </h3>
                  <p className="text-sm text-blue-600 mt-1">{material.subject}</p>
                  <p className="text-sm text-blue-700 mt-2">
                    {highlightText(material.description, searchTerm)}
                  </p>
                  {material.fileUrl && (
                    <a
                      href={material.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 text-sm mt-2 inline-flex items-center gap-1"
                    >
                      View Material
                      <ArrowRightIcon className="w-4 h-4" />
                    </a>
                  )}
                </div>
                {renderActions && (
                  <div onClick={(e) => e.stopPropagation()}>
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