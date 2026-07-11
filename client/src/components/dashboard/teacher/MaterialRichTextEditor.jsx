import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, mergeAttributes, ResizableNodeView, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  FaAlignCenter,
  FaAlignLeft,
  FaAlignRight,
  FaBold,
  FaEraser,
  FaHighlighter,
  FaImage,
  FaItalic,
  FaLink,
  FaListOl,
  FaListUl,
  FaPalette,
  FaStrikethrough,
  FaUnderline
} from 'react-icons/fa';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { toast } from 'react-toastify';
import axios from '../../../utils/axios';
import './MaterialRichTextEditor.css';

const imageStyles = {
  left: 'display: block; margin: 1rem auto 1rem 0; max-width: 100%;',
  center: 'display: block; margin: 1rem auto; max-width: 100%;',
  right: 'display: block; margin: 1rem 0 1rem auto; max-width: 100%;'
};

const imageJustifyContent = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end'
};

const getImageAlignFromStyle = (style = '') => {
  if (!style) return 'center';
  if (style.includes('margin: 1rem auto') || style.includes('margin: 10px auto')) return 'center';
  if (style.includes('margin-left: auto') || style.includes('margin: 1rem 0 1rem auto') || style.includes('float: right')) return 'right';
  return 'left';
};

const applyImageAttributes = (element, attributes) => {
  Array.from(element.attributes).forEach((attribute) => {
    if (!['src', 'alt', 'title', 'width', 'height', 'style', 'data-align'].includes(attribute.name)) {
      element.removeAttribute(attribute.name);
    }
  });

  Object.entries(attributes).forEach(([key, value]) => {
    if (value == null || key === 'width' || key === 'height') return;

    if (key === 'imageAlign') {
      element.setAttribute('data-align', value);
      return;
    }

    element.setAttribute(key, value);
  });

  if (attributes.width) {
    element.style.width = `${attributes.width}px`;
  }

  if (attributes.height) {
    element.style.height = `${attributes.height}px`;
  }
};

const applyImageAlignment = (container, imageAlign) => {
  if (!container) return;

  container.style.justifyContent = imageJustifyContent[imageAlign] || imageJustifyContent.center;
};

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      imageAlign: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-align') || getImageAlignFromStyle(element.getAttribute('style') || ''),
        renderHTML: (attributes) => ({
          'data-align': attributes.imageAlign || 'center'
        })
      },
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute('style'),
        renderHTML: (attributes) => (
          attributes.style ? { style: attributes.style } : {}
        )
      }
    };
  },

  addNodeView() {
    if (!this.options.resize?.enabled || typeof document === 'undefined') {
      return null;
    }

    const { directions, minWidth, minHeight, alwaysPreserveAspectRatio } = this.options.resize;

    return ({ node, getPos, HTMLAttributes, editor }) => {
      const image = document.createElement('img');
      image.draggable = false;

      const getMergedAttributes = (activeNode) => mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        activeNode.attrs
      );

      applyImageAttributes(image, getMergedAttributes(node));

      const nodeView = new ResizableNodeView({
        element: image,
        editor,
        node,
        getPos,
        onResize: (width, height) => {
          image.style.width = `${width}px`;
          image.style.height = `${height}px`;
        },
        onCommit: (width, height) => {
          const pos = getPos();
          if (pos === undefined) return;

          this.editor
            .chain()
            .setNodeSelection(pos)
            .updateAttributes(this.name, { width, height })
            .run();
        },
        onUpdate: (updatedNode) => {
          if (updatedNode.type !== node.type) return false;

          applyImageAttributes(image, getMergedAttributes(updatedNode));
          applyImageAlignment(nodeView.dom, updatedNode.attrs.imageAlign || 'center');
          return true;
        },
        options: {
          directions,
          min: {
            width: minWidth,
            height: minHeight
          },
          preserveAspectRatio: alwaysPreserveAspectRatio === true
        }
      });

      const dom = nodeView.dom;
      dom.style.width = '100%';
      applyImageAlignment(dom, node.attrs.imageAlign || 'center');

      const originalSelectNode = nodeView.selectNode?.bind(nodeView);
      const originalDeselectNode = nodeView.deselectNode?.bind(nodeView);

      nodeView.selectNode = () => {
        originalSelectNode?.();
        dom.classList.add('is-selected');
      };

      nodeView.deselectNode = () => {
        originalDeselectNode?.();
        dom.classList.remove('is-selected');
      };

      dom.style.visibility = 'hidden';
      dom.style.pointerEvents = 'none';
      image.onload = () => {
        dom.style.visibility = '';
        dom.style.pointerEvents = '';
      };
      if (image.complete) {
        dom.style.visibility = '';
        dom.style.pointerEvents = '';
      }

      return nodeView;
    };
  }
});

const ToolbarButton = ({ active, disabled, onClick, title, children }) => (
  <button
    type="button"
    className={`material-editor__button${active ? ' is-active' : ''}`}
    disabled={disabled}
    onMouseDown={(event) => {
      event.preventDefault();
      onClick();
    }}
    title={title}
    aria-label={title}
  >
    {children}
  </button>
);

const getSelectedImage = (editor) => {
  if (!editor) return null;

  const { selection } = editor.state;

  if (selection.node?.type.name === 'image') {
    return {
      pos: selection.from,
      node: selection.node
    };
  }

  const directNode = selection.$from.nodeAfter || selection.$from.nodeBefore;
  const directOffset = selection.$from.nodeAfter ? 0 : -(selection.$from.nodeBefore?.nodeSize || 1);

  if (directNode?.type.name === 'image') {
    return {
      pos: selection.from + directOffset,
      node: directNode
    };
  }

  let foundImage = null;
  editor.state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
    if (node.type.name === 'image') {
      foundImage = { pos, node };
      return false;
    }

    return true;
  });

  return foundImage;
};

const updateSelectedImage = (editor, attributes) => {
  const selectedImage = getSelectedImage(editor);

  if (!selectedImage) return false;

  editor
    .chain()
    .focus()
    .setNodeSelection(selectedImage.pos)
    .updateAttributes('image', attributes)
    .run();

  return true;
};

const MaterialRichTextEditor = ({ value, onChange, placeholder = 'Write your content here...' }) => {
  const fileInputRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [, forceToolbarRefresh] = useState(0);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3]
      }
    }),
    Underline,
    TextStyle,
    Color,
    Highlight.configure({
      multicolor: true
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph']
    }),
    Link.configure({
      autolink: true,
      openOnClick: false,
      linkOnPaste: true,
      HTMLAttributes: {
        rel: 'noopener noreferrer',
        target: '_blank'
      }
    }),
    ResizableImage.configure({
      allowBase64: false,
      resize: {
        enabled: true,
        directions: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        minWidth: 80,
        minHeight: 60,
        alwaysPreserveAspectRatio: true
      }
    })
  ], []);

  const editor = useEditor({
    extensions,
    content: value || '',
    editorProps: {
      attributes: {
        class: 'material-editor__content',
        'aria-label': placeholder
      }
    },
    onUpdate: ({ editor: activeEditor }) => {
      onChangeRef.current(activeEditor.getHTML());
      forceToolbarRefresh((key) => key + 1);
    },
    onSelectionUpdate: () => {
      forceToolbarRefresh((key) => key + 1);
    }
  });

  useEffect(() => {
    if (!editor) return;

    const nextValue = value || '';
    if (nextValue !== editor.getHTML()) {
      editor.commands.setContent(nextValue, { emitUpdate: false });
    }
  }, [editor, value]);

  const uploadImage = useCallback(async (file) => {
    if (!file || !editor) return;

    try {
      const payload = new FormData();
      payload.append('image', file);

      const response = await axios.post('/api/upload/image', payload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const imageUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${response.data.url}`;
      editor
        .chain()
        .focus()
        .setImage({
          src: imageUrl,
          alt: file.name,
          width: 480,
          imageAlign: 'center',
          style: imageStyles.center
        })
        .run();
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href || '';
    const url = window.prompt('Enter link URL', previousUrl);

    if (url === null) return;

    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }, [editor]);

  const setAlignment = useCallback((alignment) => {
    if (!editor) return;

    const imageAlignment = alignment === 'none' ? 'left' : alignment;

    if (updateSelectedImage(editor, {
      imageAlign: imageAlignment,
      style: imageStyles[imageAlignment]
    })) {
      return;
    }

    if (alignment === 'none') {
      editor.chain().focus().unsetTextAlign().run();
    } else {
      editor.chain().focus().setTextAlign(alignment).run();
    }
  }, [editor]);

  if (!editor) {
    return <div className="material-editor material-editor--loading">Loading editor...</div>;
  }

  const selectedImage = getSelectedImage(editor);
  const selectedImageAlign = selectedImage?.node.attrs.imageAlign || 'center';

  return (
    <div className="material-editor">
      <div className="material-editor__toolbar" aria-label="Material editor toolbar">
        <select
          className="material-editor__select"
          value={
            editor.isActive('heading', { level: 1 }) ? 'h1'
              : editor.isActive('heading', { level: 2 }) ? 'h2'
                : editor.isActive('heading', { level: 3 }) ? 'h3'
                  : 'paragraph'
          }
          onChange={(event) => {
            const choice = event.target.value;
            if (choice === 'paragraph') {
              editor.chain().focus().setParagraph().run();
            } else {
              editor.chain().focus().toggleHeading({ level: Number(choice.replace('h', '')) }).run();
            }
          }}
          title="Text style"
          aria-label="Text style"
        >
          <option value="paragraph">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><FaBold /></ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><FaItalic /></ToolbarButton>
        <ToolbarButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><FaUnderline /></ToolbarButton>
        <ToolbarButton title="Strike" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><FaStrikethrough /></ToolbarButton>
        <ToolbarButton title="Bulleted list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><FaListUl /></ToolbarButton>
        <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><FaListOl /></ToolbarButton>
        <ToolbarButton
          title="Align left"
          active={getSelectedImage(editor)?.node.attrs.imageAlign === 'left' || editor.isActive({ textAlign: 'left' })}
          onClick={() => setAlignment('none')}
        >
          <FaAlignLeft />
        </ToolbarButton>
        <ToolbarButton
          title="Align center"
          active={getSelectedImage(editor)?.node.attrs.imageAlign === 'center' || editor.isActive({ textAlign: 'center' })}
          onClick={() => setAlignment('center')}
        >
          <FaAlignCenter />
        </ToolbarButton>
        <ToolbarButton
          title="Align right"
          active={getSelectedImage(editor)?.node.attrs.imageAlign === 'right' || editor.isActive({ textAlign: 'right' })}
          onClick={() => setAlignment('right')}
        >
          <FaAlignRight />
        </ToolbarButton>
        <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}><FaLink /></ToolbarButton>
        <ToolbarButton title="Image" onClick={() => fileInputRef.current?.click()}><FaImage /></ToolbarButton>

        {selectedImage && (
          <span className="material-editor__image-tools" aria-label="Image position">
            <span className="material-editor__image-tools-label" title="Image position"><FaImage /></span>
            <ToolbarButton
              title="Image left"
              active={selectedImageAlign === 'left'}
              onClick={() => setAlignment('none')}
            >
              <FaAlignLeft />
            </ToolbarButton>
            <ToolbarButton
              title="Image center"
              active={selectedImageAlign === 'center'}
              onClick={() => setAlignment('center')}
            >
              <FaAlignCenter />
            </ToolbarButton>
            <ToolbarButton
              title="Image right"
              active={selectedImageAlign === 'right'}
              onClick={() => setAlignment('right')}
            >
              <FaAlignRight />
            </ToolbarButton>
          </span>
        )}

        <label className="material-editor__color" title="Text color">
          <FaPalette aria-hidden="true" />
          <input
            type="color"
            defaultValue="#1d4ed8"
            onInput={(event) => editor.chain().focus().setColor(event.target.value).run()}
          />
        </label>

        <label className="material-editor__color" title="Highlight color">
          <FaHighlighter aria-hidden="true" />
          <input
            type="color"
            defaultValue="#fef08a"
            onInput={(event) => editor.chain().focus().setHighlight({ color: event.target.value }).run()}
          />
        </label>

        <ToolbarButton title="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><FaEraser /></ToolbarButton>
      </div>

      <EditorContent editor={editor} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="material-editor__file"
        onChange={(event) => uploadImage(event.target.files?.[0])}
      />
    </div>
  );
};

export default MaterialRichTextEditor;
