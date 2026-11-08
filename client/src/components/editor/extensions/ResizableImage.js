import { Node, mergeAttributes } from '@tiptap/core';

function clamp(value, min, max) {
  return Math.max(min, Math.min(Number(value) || min, max));
}

function normalizeWidth(value, fallback = '100%') {
  if (typeof value === 'number') {
    return `${value}px`;
  }

  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return fallback;
}

function updateNodeAttributes(view, getPos, attributes) {
  try {
    const position = getPos();

    if (typeof position !== 'number') return;

    const currentNode = view.state.doc.nodeAt(position);

    if (!currentNode) return;

    view.dispatch(
      view.state.tr.setNodeMarkup(position, undefined, {
        ...currentNode.attrs,
        ...attributes,
      })
    );
  } catch (error) {
    console.warn('[BloomNotes] Image update failed:', error);
  }
}

export const ResizableImage = Node.create({
  name: 'resizableImage',

  group: 'block',

  atom: true,

  draggable: true,

  selectable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },

      alt: {
        default: '',
      },

      title: {
        default: null,
      },

      width: {
        default: '100%',
      },

      alignment: {
        default: 'center',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[data-type="resizable-image"]',

        getAttrs: (element) => ({
          src: element.getAttribute('src'),

          alt: element.getAttribute('alt') || '',

          title: element.getAttribute('title'),

          width:
            element.getAttribute('data-width') ||
            element.style.width ||
            element.getAttribute('width') ||
            '100%',

          alignment:
            element.getAttribute('data-alignment') ||
            'center',
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const {
      alignment = 'center',
      width = '100%',
      ...attributes
    } = HTMLAttributes;

    const safeWidth = normalizeWidth(width);

    const margin =
      alignment === 'left'
        ? '0 auto 0 0'
        : alignment === 'right'
          ? '0 0 0 auto'
          : '0 auto';

    return [
      'img',
      mergeAttributes(attributes, {
        'data-type': 'resizable-image',
        'data-alignment': alignment,
        'data-width': safeWidth,

        style: `
          width: ${safeWidth};
          max-width: 100%;
          height: auto;
          display: block;
          margin: ${margin};
        `,
      }),
    ];
  },

  addNodeView() {
    const nodeType = this.type;

    return ({ node, getPos, view }) => {
      const doc = view.dom.ownerDocument;
      const win = doc.defaultView;

      const wrapper = doc.createElement('div');

      wrapper.className = 'bn-image-node';
      wrapper.contentEditable = 'false';
      wrapper.draggable = true;

      Object.assign(wrapper.style, {
        position: 'relative',
        display: 'table',
        width: 'fit-content',
        maxWidth: '100%',
        margin: '16px auto',
        lineHeight: '0',
      });

      const image = doc.createElement('img');

      image.src = node.attrs.src || '';
      image.alt = node.attrs.alt || '';
      image.title = node.attrs.title || '';
      image.draggable = false;

      Object.assign(image.style, {
        display: 'block',
        width: normalizeWidth(node.attrs.width),
        maxWidth: '100%',
        height: 'auto',
        borderRadius: '8px',
        userSelect: 'none',
        boxSizing: 'border-box',
      });

      const resizeHandle = doc.createElement('button');

      resizeHandle.type = 'button';
      resizeHandle.className = 'bn-image-resize-handle';
      resizeHandle.title = 'Resize image';

      resizeHandle.setAttribute(
        'aria-label',
        'Resize image'
      );

      Object.assign(resizeHandle.style, {
        position: 'absolute',
        right: '-7px',
        bottom: '-7px',
        width: '15px',
        height: '15px',
        border: '2px solid white',
        borderRadius: '50%',
        background: '#8b5cf6',
        boxShadow: '0 1px 4px rgba(0,0,0,.25)',
        cursor: 'nwse-resize',
        padding: '0',
        zIndex: '5',
      });

      wrapper.append(image, resizeHandle);

      let resizing = false;
      let startX = 0;
      let startWidth = 0;

      const currentRenderedWidth = () => {
        const rect = image.getBoundingClientRect();

        if (rect.width) {
          return rect.width;
        }

        const raw = node.attrs.width;

        if (typeof raw === 'number') {
          return raw;
        }

        if (
          typeof raw === 'string' &&
          raw.endsWith('px')
        ) {
          return parseFloat(raw);
        }

        return 400;
      };

      const removeListeners = () => {
        win?.removeEventListener(
          'pointermove',
          onPointerMove
        );

        win?.removeEventListener(
          'pointerup',
          onPointerUp
        );

        win?.removeEventListener(
          'pointercancel',
          onPointerUp
        );
      };

      const onPointerMove = (event) => {
        if (!resizing) return;

        const parentWidth =
          wrapper.parentElement?.getBoundingClientRect().width ||
          900;

        const nextWidth = clamp(
          startWidth + event.clientX - startX,
          80,
          parentWidth
        );

        image.style.width = `${nextWidth}px`;
        wrapper.style.width = `${nextWidth}px`;
      };

      const onPointerUp = () => {
        if (!resizing) return;

        resizing = false;

        const finalWidth = Math.round(
          image.getBoundingClientRect().width ||
          currentRenderedWidth()
        );

        updateNodeAttributes(view, getPos, {
          width: `${finalWidth}px`,
        });

        removeListeners();
      };

      const onPointerDown = (event) => {
        event.preventDefault();
        event.stopPropagation();

        resizing = true;

        startX = event.clientX;
        startWidth = currentRenderedWidth();

        win?.addEventListener(
          'pointermove',
          onPointerMove
        );

        win?.addEventListener(
          'pointerup',
          onPointerUp
        );

        win?.addEventListener(
          'pointercancel',
          onPointerUp
        );
      };

      const applyAlignment = (alignment) => {
        wrapper.style.margin =
          alignment === 'left'
            ? '16px auto 16px 0'
            : alignment === 'right'
              ? '16px 0 16px auto'
              : '16px auto';
      };

      resizeHandle.addEventListener(
        'pointerdown',
        onPointerDown
      );

      applyAlignment(node.attrs.alignment || 'center');

      return {
        dom: wrapper,

        update(updatedNode) {
          if (updatedNode.type !== nodeType) {
            return false;
          }

          node = updatedNode;

          image.src = updatedNode.attrs.src || '';
          image.alt = updatedNode.attrs.alt || '';
          image.title = updatedNode.attrs.title || '';

          image.style.width = normalizeWidth(
            updatedNode.attrs.width
          );

          wrapper.style.width = 'fit-content';

          applyAlignment(
            updatedNode.attrs.alignment || 'center'
          );

          return true;
        },

        selectNode() {
          wrapper.classList.add(
            'ProseMirror-selectednode'
          );
        },

        deselectNode() {
          wrapper.classList.remove(
            'ProseMirror-selectednode'
          );
        },

        stopEvent(event) {
          return (
            event.target === resizeHandle ||
            resizeHandle.contains(event.target)
          );
        },

        destroy() {
          resizing = false;

          removeListeners();

          resizeHandle.removeEventListener(
            'pointerdown',
            onPointerDown
          );
        },
      };
    };
  },
});