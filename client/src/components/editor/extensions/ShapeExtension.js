
import { Node, mergeAttributes } from '@tiptap/core';

function updateShapeAttributes(view, getPos, attributes) {
  try {
    const position = getPos();

    if (typeof position !== 'number') {
      return;
    }

    const currentNode = view.state.doc.nodeAt(position);

    if (!currentNode) {
      return;
    }

    const transaction = view.state.tr.setNodeMarkup(
      position,
      undefined,
      {
        ...currentNode.attrs,
        ...attributes,
      }
    );

    view.dispatch(transaction);
  } catch (error) {
    console.warn('[BloomNotes] Shape update failed:', error);
  }
}

function getShapeStyle(attrs) {
  const shape = attrs.shape || 'rectangle';

  const style = {
    width: `${attrs.width || 180}px`,
    height: `${attrs.height || 120}px`,
    backgroundColor: attrs.backgroundColor || '#ede9fe',
    border: `${attrs.borderWidth ?? 2}px solid ${
      attrs.borderColor || '#8b5cf6'
    }`,
    borderRadius:
      shape === 'circle'
        ? '50%'
        : shape === 'line'
          ? '2px'
          : attrs.borderRadius || '12px',
    transform: `rotate(${attrs.rotation || 0}deg)`,
    boxSizing: 'border-box',
  };

  if (shape === 'line') {
    style.height = `${attrs.height || 4}px`;
    style.border = 'none';
  }

  return style;
}

export const ShapeExtension = Node.create({
  name: 'shape',

  group: 'block',

  atom: true,

  draggable: true,

  selectable: true,

  addAttributes() {
    return {
      shape: {
        default: 'rectangle',
      },

      width: {
        default: 180,
      },

      height: {
        default: 120,
      },

      backgroundColor: {
        default: '#ede9fe',
      },

      borderColor: {
        default: '#8b5cf6',
      },

      borderWidth: {
        default: 2,
      },

      borderRadius: {
        default: '12px',
      },

      rotation: {
        default: 0,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="bn-shape"]',

        getAttrs: (element) => {
          const shapeElement = element;

          return {
            shape: shapeElement.getAttribute('data-shape') || 'rectangle',
            width: Number(shapeElement.getAttribute('data-width')) || 180,
            height: Number(shapeElement.getAttribute('data-height')) || 120,
            backgroundColor:
              shapeElement.getAttribute('data-background') || '#ede9fe',
            borderColor:
              shapeElement.getAttribute('data-border-color') || '#8b5cf6',
            borderWidth:
              Number(shapeElement.getAttribute('data-border-width')) || 2,
            borderRadius:
              shapeElement.getAttribute('data-border-radius') || '12px',
            rotation:
              Number(shapeElement.getAttribute('data-rotation')) || 0,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const {
      shape,
      width,
      height,
      backgroundColor,
      borderColor,
      borderWidth,
      borderRadius,
      rotation,
      ...attributes
    } = HTMLAttributes;

    const attrs = {
      'data-type': 'bn-shape',
      'data-shape': shape,
      'data-width': width,
      'data-height': height,
      'data-background': backgroundColor,
      'data-border-color': borderColor,
      'data-border-width': borderWidth,
      'data-border-radius': borderRadius,
      'data-rotation': rotation,
      style: Object.entries(
        getShapeStyle({
          shape,
          width,
          height,
          backgroundColor,
          borderColor,
          borderWidth,
          borderRadius,
          rotation,
        })
      )
        .map(([key, value]) => {
          const cssKey = key.replace(
            /[A-Z]/g,
            (letter) => `-${letter.toLowerCase()}`
          );

          return `${cssKey}: ${value}`;
        })
        .join('; '),
    };

    return [
      'div',
      mergeAttributes(attributes, attrs),
    ];
  },

  addNodeView() {
    const thisNodeType = this.type;

    return ({ node, getPos, view }) => {
      const document = view.dom.ownerDocument;

      // Outer draggable wrapper.
      const wrapper = document.createElement('div');

      wrapper.className = 'bn-shape-node';
      wrapper.contentEditable = 'false';
      wrapper.draggable = true;

      Object.assign(wrapper.style, {
        position: 'relative',
        display: 'table',
        maxWidth: '100%',
        margin: '20px auto',
        padding: '10px',
        cursor: 'move',
        userSelect: 'none',
      });

      // Actual shape.
      const shapeElement = document.createElement('div');

      shapeElement.className = 'bn-shape-element';

      Object.assign(shapeElement.style, {
        ...getShapeStyle(node.attrs),
        display: 'block',
        position: 'relative',
        cursor: 'move',
      });

      // Resize handle.
      const resizeHandle = document.createElement('button');

      resizeHandle.type = 'button';
      resizeHandle.className = 'bn-shape-resize-handle';
      resizeHandle.title = 'Resize shape';
      resizeHandle.setAttribute('aria-label', 'Resize shape');

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

      wrapper.append(shapeElement, resizeHandle);

      let resizing = false;
      let startX = 0;
      let startY = 0;
      let startWidth = 0;
      let startHeight = 0;

      const handlePointerMove = (event) => {
        if (!resizing) {
          return;
        }

        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;

        const nextWidth = Math.max(
          30,
          Math.min(startWidth + deltaX, 1000)
        );

        const nextHeight = Math.max(
          4,
          Math.min(startHeight + deltaY, 1000)
        );

        shapeElement.style.width = `${nextWidth}px`;
        shapeElement.style.height = `${nextHeight}px`;
      };

      const handlePointerUp = () => {
        if (!resizing) {
          return;
        }

        resizing = false;

        const finalWidth = Math.round(
          shapeElement.getBoundingClientRect().width
        );

        const finalHeight = Math.round(
          shapeElement.getBoundingClientRect().height
        );

        updateShapeAttributes(view, getPos, {
          width: finalWidth,
          height: finalHeight,
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
        startY = event.clientY;

        startWidth = shapeElement.getBoundingClientRect().width;
        startHeight = shapeElement.getBoundingClientRect().height;

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

      return {
        dom: wrapper,

        update(updatedNode) {
          if (updatedNode.type !== thisNodeType) {
            return false;
          }

          Object.assign(
            shapeElement.style,
            getShapeStyle(updatedNode.attrs)
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
