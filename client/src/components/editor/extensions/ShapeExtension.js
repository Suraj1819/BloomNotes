import { Node, mergeAttributes } from '@tiptap/core';

const DEFAULT_SHAPE_FILL = 'transparent';
const DEFAULT_SHAPE_BORDER = '#8b5cf6';

function clamp(value, min, max) {
  return Math.max(min, Math.min(Number(value) || min, max));
}

function getShapeStyle(attrs = {}) {
  const shape = attrs.shape || 'rectangle';
  const width = clamp(attrs.width ?? 180, 30, 1400);
  const height = clamp(attrs.height ?? 120, 4, 1400);
  const fill = attrs.backgroundColor || DEFAULT_SHAPE_FILL;
  const borderColor = attrs.borderColor || DEFAULT_SHAPE_BORDER;
  const borderWidth = clamp(attrs.borderWidth ?? 2, 0, 24);
  const radius = attrs.borderRadius || '12px';

  const style = {
    width: `${width}px`,
    height: `${height}px`,
    boxSizing: 'border-box',
    backgroundColor: shape === 'line' ? borderColor : fill,
    border: `${borderWidth}px solid ${borderColor}`,
    borderRadius:
      shape === 'circle' || shape === 'ellipse'
        ? '50%'
        : shape === 'line'
          ? '999px'
          : radius,
    transform: `rotate(${Number(attrs.rotation) || 0}deg)`,
    transformOrigin: 'center',
    flex: 'none',
  };

  if (shape === 'square') {
    style.width = `${Math.min(width, height)}px`;
    style.height = `${Math.min(width, height)}px`;
  }

  if (shape === 'circle') {
    const diameter = Math.min(width, height);
    style.width = `${diameter}px`;
    style.height = `${diameter}px`;
  }

  if (shape === 'triangle') {
    style.border = 'none';
    style.backgroundColor = fill;
    style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
    style.filter = `drop-shadow(0 0 1px ${borderColor}) drop-shadow(0 0 1px ${borderColor})`;
  }

  if (shape === 'arrow') {
    style.border = 'none';
    style.backgroundColor = fill;
    style.clipPath =
      'polygon(0 30%, 65% 30%, 65% 0, 100% 50%, 65% 100%, 65% 70%, 0 70%)';
    style.filter = `drop-shadow(0 0 1px ${borderColor}) drop-shadow(0 0 1px ${borderColor})`;
  }

  if (shape === 'line') {
    style.height = `${Math.max(2, height)}px`;
    style.border = 'none';
    style.backgroundColor = borderColor;
  }

  return style;
}

function updateShapeAttributes(view, getPos, attributes) {
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
    console.warn('[BloomNotes] Shape update failed:', error);
  }
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
        default: DEFAULT_SHAPE_FILL,
      },

      borderColor: {
        default: DEFAULT_SHAPE_BORDER,
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

        getAttrs: (element) => ({
          shape: element.getAttribute('data-shape') || 'rectangle',

          width: clamp(
            element.getAttribute('data-width') || 180,
            30,
            1400
          ),

          height: clamp(
            element.getAttribute('data-height') || 120,
            4,
            1400
          ),

          backgroundColor:
            element.getAttribute('data-background') ||
            DEFAULT_SHAPE_FILL,

          borderColor:
            element.getAttribute('data-border-color') ||
            DEFAULT_SHAPE_BORDER,

          borderWidth: clamp(
            element.getAttribute('data-border-width') || 2,
            0,
            24
          ),

          borderRadius:
            element.getAttribute('data-border-radius') || '12px',

          rotation:
            Number(element.getAttribute('data-rotation')) || 0,
        }),
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

    const style = getShapeStyle({
      shape,
      width,
      height,
      backgroundColor,
      borderColor,
      borderWidth,
      borderRadius,
      rotation,
    });

    const cssText = Object.entries(style)
      .map(([key, value]) => {
        const cssKey = key.replace(
          /[A-Z]/g,
          (letter) => `-${letter.toLowerCase()}`
        );

        return `${cssKey}: ${value}`;
      })
      .join('; ');

    return [
      'div',
      mergeAttributes(attributes, {
        'data-type': 'bn-shape',
        'data-shape': shape,
        'data-width': width,
        'data-height': height,
        'data-background': backgroundColor,
        'data-border-color': borderColor,
        'data-border-width': borderWidth,
        'data-border-radius': borderRadius,
        'data-rotation': rotation,
        style: cssText,
      }),
    ];
  },

  addNodeView() {
    const nodeType = this.type;

    return ({ node, getPos, view }) => {
      const doc = view.dom.ownerDocument;
      const win = doc.defaultView;

      const wrapper = doc.createElement('div');

      wrapper.className = 'bn-shape-node';
      wrapper.contentEditable = 'false';
      wrapper.draggable = true;

      Object.assign(wrapper.style, {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '100%',
        margin: '20px auto',
        padding: '10px',
        verticalAlign: 'middle',
        cursor: 'move',
        userSelect: 'none',
        lineHeight: 'normal',
      });

      const shapeElement = doc.createElement('div');

      shapeElement.className = 'bn-shape-element';

      Object.assign(
        shapeElement.style,
        getShapeStyle(node.attrs)
      );

      const resizeHandle = doc.createElement('button');

      resizeHandle.type = 'button';
      resizeHandle.className = 'bn-shape-resize-handle';
      resizeHandle.title = 'Resize shape';
      resizeHandle.setAttribute('aria-label', 'Resize shape');

      Object.assign(resizeHandle.style, {
        position: 'absolute',
        right: '1px',
        bottom: '1px',
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

      wrapper.append(shapeElement, resizeHandle);

      let resizing = false;
      let startX = 0;
      let startY = 0;
      let startWidth = 0;
      let startHeight = 0;

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

        const shapeName = node.attrs.shape || 'rectangle';

        let nextWidth = clamp(
          startWidth + event.clientX - startX,
          30,
          1400
        );

        let nextHeight = clamp(
          startHeight + event.clientY - startY,
          4,
          1400
        );

        if (
          shapeName === 'square' ||
          shapeName === 'circle'
        ) {
          const size = Math.max(
            30,
            Math.min(nextWidth, nextHeight)
          );

          nextWidth = size;
          nextHeight = size;
        }

        shapeElement.style.width = `${nextWidth}px`;
        shapeElement.style.height = `${nextHeight}px`;
      };

      const onPointerUp = () => {
        if (!resizing) return;

        resizing = false;

        const rect = shapeElement.getBoundingClientRect();

        updateShapeAttributes(view, getPos, {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });

        removeListeners();
      };

      const onPointerDown = (event) => {
        event.preventDefault();
        event.stopPropagation();

        resizing = true;

        startX = event.clientX;
        startY = event.clientY;

        const rect = shapeElement.getBoundingClientRect();

        startWidth = rect.width;
        startHeight = rect.height;

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

      resizeHandle.addEventListener(
        'pointerdown',
        onPointerDown
      );

      return {
        dom: wrapper,

        update(updatedNode) {
          if (updatedNode.type !== nodeType) {
            return false;
          }

          node = updatedNode;

          Object.assign(
            shapeElement.style,
            getShapeStyle(updatedNode.attrs)
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