
import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';

const DEFAULT_FONT_SIZE = '16px';
const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 60;
const FONT_SIZE_STEP = 2;

// Normalize and validate font-size values.
const normalizeFontSize = (value) => {
  if (typeof value === 'number') {
    value = `${value}px`;
  }

  if (typeof value !== 'string') return null;

  const normalized = value.trim().toLowerCase();

  const match = normalized.match(
    /^(\d+(?:\.\d+)?)(px|pt|rem|em)$/
  );

  if (!match) return null;

  const numericValue = Number(match[1]);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  return `${numericValue}${match[2]}`;
};

const getPixelSize = (value) => {
  const normalized = normalizeFontSize(value);

  if (!normalized) return 16;

  const number = parseFloat(normalized);
  const unit = normalized.replace(/[0-9.]/g, '');

  switch (unit) {
    case 'pt':
      return number * (4 / 3);
    case 'rem':
    case 'em':
      return number * 16;
    default:
      return number;
  }
};

export const FontSize = Extension.create({
  name: 'fontSize',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,

            parseHTML: (element) =>
              element.style.fontSize || null,

            renderHTML: (attributes) => {
              const fontSize = normalizeFontSize(
                attributes.fontSize
              );

              return fontSize
                ? { style: `font-size: ${fontSize}` }
                : {};
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) => {
          const normalized = normalizeFontSize(fontSize);

          if (!normalized) return false;

          return chain()
            .setMark('textStyle', {
              fontSize: normalized,
            })
            .run();
        },

      unsetFontSize:
        () =>
        ({ chain }) =>
          chain()
            .setMark('textStyle', {
              fontSize: null,
            })
            .removeEmptyTextStyle()
            .run(),

      resetFontSize:
        () =>
        ({ chain }) =>
          chain()
            .setMark('textStyle', {
              fontSize: DEFAULT_FONT_SIZE,
            })
            .run(),

      increaseFontSize:
        () =>
        ({ editor, chain }) => {
          const current =
            editor.getAttributes('textStyle').fontSize ||
            DEFAULT_FONT_SIZE;

          const currentSize = getPixelSize(current);

          const nextSize = Math.min(
            currentSize + FONT_SIZE_STEP,
            MAX_FONT_SIZE
          );

          return chain()
            .setMark('textStyle', {
              fontSize: `${nextSize}px`,
            })
            .run();
        },

      decreaseFontSize:
        () =>
        ({ editor, chain }) => {
          const current =
            editor.getAttributes('textStyle').fontSize ||
            DEFAULT_FONT_SIZE;

          const currentSize = getPixelSize(current);

          const nextSize = Math.max(
            currentSize - FONT_SIZE_STEP,
            MIN_FONT_SIZE
          );

          return chain()
            .setMark('textStyle', {
              fontSize: `${nextSize}px`,
            })
            .run();
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction: (transactions, oldState, newState) => {
          const documentIsEmpty =
            newState.doc.textContent.trim().length === 0;

          if (!documentIsEmpty) return null;

          const storedMarks = newState.storedMarks || [];

          const hasTypographyMark = storedMarks.some((mark) => {
            if (
              mark.type.name !== 'textStyle'
            ) {
              return false;
            }

            return Boolean(
              mark.attrs.fontSize ||
              mark.attrs.fontFamily
            );
          });

          if (!hasTypographyMark) return null;

          return newState.tr.setStoredMarks([]);
        },
      }),
    ];
  },
});
