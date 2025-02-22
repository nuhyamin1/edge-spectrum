import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../utils/axios';
import { toast } from 'react-toastify';
import Layout from '../Layout';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './QuillEditor.css';
import ImageResize from 'quill-image-resize-module-react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// Custom image blot definition
const Image = Quill.import('formats/image');
class CustomImageBlot extends Image {
  static create(value) {
    const node = super.create(value.src || value);
    if (typeof value === 'object') {
      if (value.width) node.setAttribute('width', value.width);
      if (value.height) node.setAttribute('height', value.height);
      if (value.style) node.setAttribute('style', value.style);
    }
    return node;
  }

  static value(node) {
    return {
      src: node.getAttribute('src'),
      width: node.getAttribute('width'),
      height: node.getAttribute('height'),
      style: node.getAttribute('style')
    };
  }
}
CustomImageBlot.blotName = 'image';
CustomImageBlot.tagName = 'img';
Quill.register(CustomImageBlot);
Quill.register('modules/imageResize', ImageResize);

// Context Menu Component
const ContextMenu = ({ x, y, onClose, onEdit, onDelete }) => {
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.context-menu')) {
        onClose();
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  return (
    <div 
      className="context-menu fixed bg-white rounded-lg shadow-lg py-2 z-50 min-w-[150px] border border-gray-200"
      style={{ left: x, top: y }}
    >
      <button
        className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-700 text-sm"
        onClick={onEdit}
      >
        Edit Image Properties
      </button>
      <button
        className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600 text-sm"
        onClick={onDelete}
      >
        Delete Image
      </button>
    </div>
  );
};

// Image Resize Modal Component
const ImageResizeModal = ({ isOpen, onClose, onConfirm, initialDimensions, initialAlignment }) => {
  const [dimensions, setDimensions] = useState({ width: 300, height: 200 });
  const [alignment, setAlignment] = useState('none');
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);

  // Update state when initial values change
  useEffect(() => {
    if (initialDimensions) {
      setDimensions(initialDimensions);
    }
    if (initialAlignment) {
      setAlignment(initialAlignment);
    }
  }, [initialDimensions, initialAlignment]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h3 className="text-lg font-semibold mb-4">Set Image Properties</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Width (px)</label>
              <input
                type="number"
                value={dimensions.width}
                onChange={(e) => {
                  const newWidth = parseInt(e.target.value);
                  if (maintainAspectRatio) {
                    const aspectRatio = dimensions.width / dimensions.height;
                    setDimensions({
                      width: newWidth,
                      height: Math.round(newWidth / aspectRatio)
                    });
                  } else {
                    setDimensions({ ...dimensions, width: newWidth });
                  }
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Height (px)</label>
              <input
                type="number"
                value={dimensions.height}
                onChange={(e) => {
                  const newHeight = parseInt(e.target.value);
                  if (maintainAspectRatio) {
                    const aspectRatio = dimensions.width / dimensions.height;
                    setDimensions({
                      width: Math.round(newHeight * aspectRatio),
                      height: newHeight
                    });
                  } else {
                    setDimensions({ ...dimensions, height: newHeight });
                  }
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Alignment</label>
            <select
              value={alignment}
              onChange={(e) => setAlignment(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="none">Default</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="center">Center</option>
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="aspectRatio"
              checked={maintainAspectRatio}
              onChange={(e) => setMaintainAspectRatio(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="aspectRatio" className="ml-2 text-sm text-gray-600">
              Maintain aspect ratio
            </label>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm({ dimensions, alignment })}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateMaterial = () => {
  const navigate = useNavigate();
  const quillRef = useRef();
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    content: ''
  });
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [pendingImageUpload, setPendingImageUpload] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedRange, setSelectedRange] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  // Handle keyboard delete
  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const handleKeyDown = (e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          const range = quill.getSelection();
          if (range) {
            const [blot] = quill.getLine(range.index);
            const formats = quill.getFormat(range);
            
            // Check if we're on an image
            if (formats.image || (blot && blot.domNode && blot.domNode.querySelector('img'))) {
              e.preventDefault();
              e.stopPropagation();
              
              // Find the image element
              let imageElement;
              if (blot && blot.domNode) {
                imageElement = blot.domNode.querySelector('img') || 
                             (blot.domNode.tagName === 'IMG' ? blot.domNode : null);
              }

              // Clean up resize handles if they exist
              if (imageElement) {
                const resizeHandles = imageElement.parentElement.querySelectorAll('.image-resizer');
                resizeHandles.forEach(handle => handle.remove());
              }

              // Delete the image using Quill's API
              quill.deleteText(range.index, 1);
              
              // Ensure proper selection after deletion
              quill.setSelection(range.index, 0);
            }
          }
        }
      };

      // Use capturing phase to handle the event before the resize module
      quill.root.addEventListener('keydown', handleKeyDown, true);
      return () => quill.root.removeEventListener('keydown', handleKeyDown, true);
    }
  }, []);

  // Setup right-click handler for images
  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const container = quill.root;

      const handleContextMenu = (event) => {
        const img = event.target;
        if (img.tagName === 'IMG') {
          event.preventDefault();
          
          // Calculate position for context menu
          const editorBounds = container.getBoundingClientRect();
          const x = Math.min(event.pageX, editorBounds.right - 150); // Prevent menu from going off-screen
          const y = Math.min(event.pageY, window.innerHeight - 100);
          
          // Show context menu at click position
          setContextMenu({
            x,
            y,
            image: {
              element: img,
              src: img.getAttribute('src'),
              dimensions: {
                width: parseInt(img.getAttribute('width') || img.style.width || img.width),
                height: parseInt(img.getAttribute('height') || img.style.height || img.height)
              },
              alignment: (() => {
                const style = img.getAttribute('style') || '';
                if (style.includes('float: left')) return 'left';
                if (style.includes('float: right')) return 'right';
                if (style.includes('margin: 10px auto')) return 'center';
                return 'none';
              })(),
              index: (() => {
                const nodes = Array.from(container.childNodes);
                let index = 0;
                for (let node of nodes) {
                  if (node === img) break;
                  index += node.textContent.length || 1;
                }
                return index;
              })()
            }
          });
        }
      };

      container.addEventListener('contextmenu', handleContextMenu);
      return () => container.removeEventListener('contextmenu', handleContextMenu);
    }
  }, []);

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      try {
        const file = input.files[0];
        const formData = new FormData();
        formData.append('image', file);

        const response = await axios.post('/api/upload/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        const imageUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${response.data.url}`;
        setPendingImageUpload(imageUrl);
        setSelectedRange(quillRef.current.getEditor().getSelection());
        setSelectedImage(null); // Clear selected image since this is a new upload
        setIsImageModalOpen(true);
      } catch (error) {
        console.error('Image upload error:', error);
        toast.error('Failed to upload image');
      }
    };
  }, []);

  const handleEditImage = () => {
    if (contextMenu) {
      const quill = quillRef.current.getEditor();
      setSelectedRange(quill.getSelection());
      setSelectedImage(contextMenu.image);
      setIsImageModalOpen(true);
      setContextMenu(null);
    }
  };

  const handleDeleteImage = () => {
    if (contextMenu) {
      const quill = quillRef.current.getEditor();
      const imageElement = contextMenu.image.element;
      
      // Clean up resize handles if they exist
      const resizeHandles = imageElement.parentElement.querySelectorAll('.image-resizer');
      resizeHandles.forEach(handle => handle.remove());

      // Delete the image
      quill.deleteText(contextMenu.image.index, 1);
      setContextMenu(null);
    }
  };

  const handleImageResize = ({ dimensions, alignment }) => {
    const quill = quillRef.current.getEditor();
    
    let style = '';
    switch(alignment) {
      case 'left':
        style = 'float: left; margin: 10px 10px 10px 0;';
        break;
      case 'right':
        style = 'float: right; margin: 10px 0 10px 10px;';
        break;
      case 'center':
        style = 'display: block; margin: 10px auto;';
        break;
      default:
        style = 'margin: 10px;';
    }

    if (selectedImage) {
      // Update existing image
      const img = selectedImage.element;
      img.setAttribute('width', dimensions.width);
      img.setAttribute('height', dimensions.height);
      img.setAttribute('style', style);
    } else {
      // Insert new image
      quill.insertEmbed(selectedRange.index, 'image', {
        src: pendingImageUpload,
        width: dimensions.width,
        height: dimensions.height,
        style: style
      }, 'user');
      quill.setSelection(selectedRange.index + 1, 0, 'silent');
    }

    // Reset state
    setIsImageModalOpen(false);
    setPendingImageUpload(null);
    setSelectedImage(null);
    setSelectedRange(null);
  };

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
    imageResize: {
      parchment: Quill.import('parchment'),
      modules: ['Resize', 'DisplaySize'],
      handleStyles: {
        backgroundColor: '#4A9FFF',
        border: 'none'
      }
    },
    clipboard: {
      matchVisual: false // Prevent paste issues with images
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleContentChange = (content) => {
    setFormData({
      ...formData,
      content: content
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/materials', formData);
      toast.success('Material created successfully');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create material');
    }
  };

  return (
    <Layout userType="teacher">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 flex items-center text-blue-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden 
          border border-blue-200 group hover:border-blue-400
          transition-all duration-300 hover:shadow-lg hover:shadow-blue-400/20">
          
          <div className="p-6">
            <h2 className="text-2xl font-bold text-blue-900 group-hover:text-blue-600 transition-colors mb-6">
              Create New Material
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <input
                type="text"
                name="title"
                placeholder="Title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg
                  text-blue-900 placeholder-blue-300
                  focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                  transition-all duration-300"
              />

              <input
                type="text"
                name="subject"
                placeholder="Subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg
                  text-blue-900 placeholder-blue-300
                  focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                  transition-all duration-300"
              />

              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg
                  text-blue-900 placeholder-blue-300
                  focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                  transition-all duration-300 resize-none"
              />

              <div className="relative">
                <div className="quill-container bg-white rounded-lg border border-blue-200
                  focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400
                  transition-all duration-300">
                  <ReactQuill
                    theme="snow"
                    value={formData.content}
                    onChange={handleContentChange}
                    modules={modules}
                    placeholder="Write your content here..."
                    className="h-64 mb-12"
                    ref={quillRef}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-blue-200">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2 bg-white text-blue-500 rounded-lg 
                  hover:bg-blue-50 transition-all duration-300 
                  border border-blue-200 hover:border-blue-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg 
                  hover:bg-blue-600 transition-all duration-300 
                  border border-blue-400 
                  hover:shadow-lg hover:shadow-blue-400/20"
                >
                  Create Material
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onEdit={handleEditImage}
            onDelete={handleDeleteImage}
          />
        )}

        {/* Image Resize Modal */}
        <ImageResizeModal
          isOpen={isImageModalOpen}
          onClose={() => {
            setIsImageModalOpen(false);
            setPendingImageUpload(null);
            setSelectedImage(null);
            setSelectedRange(null);
          }}
          onConfirm={handleImageResize}
          initialDimensions={selectedImage?.dimensions}
          initialAlignment={selectedImage?.alignment}
        />
      </div>
    </Layout>
  );
};

export default CreateMaterial;
