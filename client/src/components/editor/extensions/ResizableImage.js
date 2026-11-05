import { Node, mergeAttributes } from '@tiptap/core';

function updateNodeAttributes(view, getPos, attributes) {
  try {
    const position = getPos();

    if (typeof position !== 'number') {
      return;
    }

    const transaction = view.state.tr.setNodeMarkup(
      position,
      undefined,
      {
        ...view.state.doc.nodeAt(position)?.attrs,
        ...attributes,
      }
    );

    view.dispatch(transaction);
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
          width: element.getAttribute('width') || '100%',
          alignment:
            element.getAttribute('data-alignment') || 'center',
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
        width,
        style: `width: ${width}; max-width: 100%; height: auto; display: block; margin: ${margin};`,
      }),
    ];
  },

  addNodeView() {
    const thisNodeType = this.type;

return ({ node, getPos, view }) => {
      const document = view.dom.ownerDocument;

      const wrapper = document.createElement('div');
      wrapper.className = 'bn-image-node';
      wrapper.contentEditable = 'false';
      wrapper.draggable = true;

      Object.assign(wrapper.style, {
        position: 'relative',
        display: 'table',
        maxWidth: '100%',
        margin: '16px auto',
        lineHeight: '0',
      });

      const image = document.createElement('img');

      image.src = node.attrs.src || '';
      image.alt = node.attrs.alt || '';
      image.title = node.attrs.title || '';

      Object.assign(image.style, {
        display: 'block',
        width: node.attrs.width || '100%',
        maxWidth: '100%',
        height: 'auto',
        borderRadius: '8px',
        userSelect: 'none',
      });

      image.draggable = false;

      const resizeHandle = document.createElement('button');

      resizeHandle.type = 'button';
      resizeHandle.className = 'bn-image-resize-handle';
      resizeHandle.title = 'Resize image';
      resizeHandle.setAttribute('aria-label', 'Resize image');

      Object.assign(resizeHandle.style, {
        position: 'absolute',
        right: '-7px',
        bottom: '-7px',
        width: '15px',
        height: '15px',
        border: '2px solid white',
        borderRadius: '50%',
        background: '#8b5cf6',
        cursor: 'nwse-resize',
        padding: '0',
        zIndex: '5',
      });

      wrapper.append(image, resizeHandle);

      let resizing = false;
      let startX = 0;
      let startWidth = 0;

      const getCurrentWidth = () => {
        const value = node.attrs.width;

        if (typeof value === 'number') {
          return value;
        }

        if (typeof value === 'string' && value.endsWith('px')) {
          return parseFloat(value);
        }

        return image.getBoundingClientRect().width || 400;
      };

      const handlePointerMove = (event) => {
        if (!resizing) {
          return;
        }

        const delta = event.clientX - startX;

        const parentWidth =
          wrapper.parentElement?.getBoundingClientRect().width || 900;

        const nextWidth = Math.max(
          80,
          Math.min(startWidth + delta, parentWidth)
        );

        image.style.width = `${nextWidth}px`;
        wrapper.style.width = `${nextWidth}px`;
      };

      const handlePointerUp = () => {
        if (!resizing) {
          return;
        }

        resizing = false;

        const finalWidth = Math.round(
          image.getBoundingClientRect().width
        );

        updateNodeAttributes(view, getPos, {
          width: `${finalWidth}px`,
        });

        document.defaultView?.removeEventListener(
          'pointermove',
          handlePointerMove
        );

        document.defaultView?.removeEventListener(
          'pointerup',
          handlePointerUp
        );
      };

      const handlePointerDown = (event) => {
        event.preventDefault();
        event.stopPropagation();

        resizing = true;
        startX = event.clientX;
        startWidth = getCurrentWidth();

        document.defaultView?.addEventListener(
          'pointermove',
          handlePointerMove
        );

        document.defaultView?.addEventListener(
          'pointerup',
          handlePointerUp
        );
      };

      resizeHandle.addEventListener(
        'pointerdown',
        handlePointerDown
      );

      const applyAlignment = (alignment) => {
  wrapper.style.margin =
    alignment === 'left'
      ? '16px auto 16px 0'
      : alignment === 'right'
        ? '16px 0 16px auto'
        : '16px auto';
};

      applyAlignment(node.attrs.alignment || 'center');

      return {
        dom: wrapper,

        update(updatedNode) {
          if (updatedNode.type !== thisNodeType) {
            return false;
          }

          image.src = updatedNode.attrs.src || '';
          image.alt = updatedNode.attrs.alt || '';
          image.title = updatedNode.attrs.title || '';
          image.style.width = updatedNode.attrs.width || '100%';

          applyAlignment(
            updatedNode.attrs.alignment || 'center'
          );

          return true;
        },

        selectNode() {
          wrapper.classList.add('ProseMirror-selectednode');
        },

        deselectNode() {
          wrapper.classList.remove('ProseMirror-selectednode');
        },

        stopEvent(event) {
          return (
            event.target === resizeHandle ||
            resizeHandle.contains(event.target)
          );
        },

        destroy() {
          resizing = false;

          document.defaultView?.removeEventListener(
            'pointermove',
            handlePointerMove
          );

          document.defaultView?.removeEventListener(
            'pointerup',
            handlePointerUp
          );

          resizeHandle.removeEventListener(
            'pointerdown',
            handlePointerDown
          );
        },
      };
    };
  },
});