
import { useState } from 'react';

import { Button } from '../ui/Button.jsx';
import { Dialog } from '../ui/Dialog.jsx';
import { Input, Field } from '../ui/Input.jsx';

import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  Link as LinkIcon,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  RemoveFormatting,
  Image as ImageIcon,
  Table as TableIcon,
  Highlighter,
  Palette,
  Plus,
  Square,
  Circle,
} from 'lucide-react';

import { cn } from '../../lib/utils.js';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const FONT_FAMILIES = [
  { label: 'Calibri', value: 'Calibri' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS' },
  { label: 'Courier New', value: 'Courier New' },
];

const FONT_SIZES = [
  '10px',
  '12px',
  '14px',
  '16px',
  '18px',
  '20px',
  '24px',
  '28px',
  '32px',
  '36px',
  '48px',
  '60px',
];

const DEFAULT_TEXT_COLOR = '#292524';
const DEFAULT_HIGHLIGHT_COLOR = '#fef08a';

// -----------------------------------------------------------------------------
// Toolbar Button
// -----------------------------------------------------------------------------

function TBtn({
  active = false,
  onClick,
  title,
  children,
  disabled = false,
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
        'text-text-main transition-colors',
        'hover:bg-highlight active:scale-95',
        'disabled:cursor-not-allowed disabled:opacity-40',
        active && 'bg-highlight text-accent'
      )}
    >
      {children}
    </button>
  );
}

// -----------------------------------------------------------------------------
// Toolbar Divider
// -----------------------------------------------------------------------------

function ToolbarDivider() {
  return <span className="mx-1 h-6 w-px shrink-0 bg-border" />;
}

// -----------------------------------------------------------------------------
// Toolbar Group
// -----------------------------------------------------------------------------

function ToolbarGroup({ children, className }) {
  return (
    <div className={cn('flex shrink-0 items-center gap-0.5', className)}>
      {children}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Select Control
// -----------------------------------------------------------------------------

function ToolbarSelect({
  value,
  onChange,
  title,
  children,
  className,
}) {
  return (
    <select
      aria-label={title}
      title={title}
      value={value}
      onChange={onChange}
      className={cn(
        'h-9 max-w-full rounded-lg border border-border',
        'bg-bg-secondary px-2 text-xs text-text-main',
        'outline-none focus:border-accent',
        'cursor-pointer',
        className
      )}
    >
      {children}
    </select>
  );
}

// -----------------------------------------------------------------------------
// Color Control
// -----------------------------------------------------------------------------

function ColorControl({ icon, title, value, onChange }) {
  return (
    <label
      title={title}
      className={cn(
        'relative flex h-9 w-9 shrink-0 cursor-pointer',
        'items-center justify-center rounded-lg',
        'text-text-main transition-colors hover:bg-highlight'
      )}
    >
      {icon}

      <span
        className="absolute bottom-1 h-1 w-5 rounded-full border border-black/10"
        style={{ backgroundColor: value }}
      />

      <input
        type="color"
        value={value}
        onChange={onChange}
        aria-label={title}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  );
}

// -----------------------------------------------------------------------------
// Main Toolbar
// -----------------------------------------------------------------------------

export function EditorToolbar({ editor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const [imageOpen, setImageOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  const [fontFamily, setFontFamily] = useState('Calibri');
  const [fontSize, setFontSize] = useState('16px');

  if (!editor) return null;

  // ---------------------------------------------------------------------------
  // Link
  // ---------------------------------------------------------------------------

  const openLinkDialog = () => {
    setLinkUrl(editor.getAttributes('link').href || '');
    setLinkOpen(true);
  };

  const applyLink = () => {
    const url = linkUrl.trim();

    if (!url) {
      editor.chain().focus().unsetLink().run();
    } else {
      const normalized =
        /^https?:\/\//i.test(url) || url.startsWith('#')
          ? url
          : `https://${url}`;

      editor.chain().focus().setLink({ href: normalized }).run();
    }

    setLinkOpen(false);
    setLinkUrl('');
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
    setLinkOpen(false);
    setLinkUrl('');
  };

  // ---------------------------------------------------------------------------
  // Font Family
  // ---------------------------------------------------------------------------

  const handleFontFamily = (event) => {
    const value = event.target.value;
    setFontFamily(value);

    editor.chain().focus().setFontFamily(value).run();
  };

  // ---------------------------------------------------------------------------
  // Font Size
  // ---------------------------------------------------------------------------

  const handleFontSize = (event) => {
    const value = event.target.value;
    setFontSize(value);

    editor.chain()
      .focus()
      .setMark('textStyle', { fontSize: value })
      .run();
  };

  // ---------------------------------------------------------------------------
  // Text Color
  // ---------------------------------------------------------------------------

  const handleTextColor = (event) => {
    editor.chain()
      .focus()
      .setColor(event.target.value)
      .run();
  };

  // ---------------------------------------------------------------------------
  // Highlight
  // ---------------------------------------------------------------------------

  const handleHighlight = (event) => {
    editor.chain()
      .focus()
      .toggleHighlight({ color: event.target.value })
      .run();
  };

  // ---------------------------------------------------------------------------
  // Image
  // ---------------------------------------------------------------------------

  const openImageDialog = () => {
    setImageUrl('');
    setImageAlt('');
    setImageOpen(true);
  };

  const insertImage = () => {
    const src = imageUrl.trim();

    if (!src) return;

    if (
      !/^https?:\/\//i.test(src) &&
      !src.startsWith('data:image/')
    ) {
      return;
    }

    editor.chain()
      .focus()
      .insertContent({
        type: 'resizableImage',
        attrs: {
          src,
          alt: imageAlt.trim(),
          width: '100%',
          alignment: 'center',
        },
      })
      .run();

    setImageOpen(false);
    setImageUrl('');
    setImageAlt('');
  };

  // ---------------------------------------------------------------------------
  // Table
  // ---------------------------------------------------------------------------

  const insertTable = () => {
    editor.chain()
      .focus()
      .insertTable({
        rows: 3,
        cols: 3,
        withHeaderRow: true,
      })
      .run();
  };

  const addTableRow = () => {
    editor.chain().focus().addRowAfter().run();
  };

  const addTableColumn = () => {
    editor.chain().focus().addColumnAfter().run();
  };

  const deleteTable = () => {
    editor.chain().focus().deleteTable().run();
  };

  // ---------------------------------------------------------------------------
  // Shapes
  // ---------------------------------------------------------------------------

  const insertShape = (shape) => {
    editor.chain()
      .focus()
      .insertContent({
        type: 'shape',
        attrs: {
          shape,
          width: shape === 'square' || shape === 'circle' ? 120 : 180,
          height: shape === 'line' ? 4 : 120,
          backgroundColor: '#ede9fe',
          borderColor: '#8b5cf6',
          borderWidth: 2,
          borderRadius: shape === 'circle' ? '50%' : '12px',
          rotation: 0,
        },
      })
      .run();
  };

  // ---------------------------------------------------------------------------
  // Clear Formatting
  // ---------------------------------------------------------------------------

  const clearFormatting = () => {
    editor.chain()
      .focus()
      .unsetAllMarks()
      .clearNodes()
      .run();
  };

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  return (
    <>
      <div className="sticky top-0 z-20 mx-4 rounded-xl border border-border bg-bg-secondary shadow-sm">
        <div className="flex flex-wrap items-center gap-1 p-2">

          {/* Font Family and Size */}

          <ToolbarGroup>
            <ToolbarSelect
              title="Font family"
              value={fontFamily}
              onChange={handleFontFamily}
              className="w-[125px]"
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </ToolbarSelect>

            <ToolbarSelect
              title="Font size"
              value={fontSize}
              onChange={handleFontSize}
              className="w-[76px]"
            >
              {FONT_SIZES.map((size) => (
                <option key={size} value={size}>
                  {parseInt(size, 10)}
                </option>
              ))}
            </ToolbarSelect>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Basic Formatting */}

          <ToolbarGroup>
            <TBtn
              title="Bold (Ctrl+B)"
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold size={16} />
            </TBtn>

            <TBtn
              title="Italic (Ctrl+I)"
              active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic size={16} />
            </TBtn>

            <TBtn
              title="Underline (Ctrl+U)"
              active={editor.isActive('underline')}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <Underline size={16} />
            </TBtn>

            <TBtn
              title="Strikethrough"
              active={editor.isActive('strike')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough size={16} />
            </TBtn>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Headings */}

          <ToolbarGroup>
            <TBtn
              title="Heading 1"
              active={editor.isActive('heading', { level: 1 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
            >
              <Heading1 size={17} />
            </TBtn>

            <TBtn
              title="Heading 2"
              active={editor.isActive('heading', { level: 2 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              <Heading2 size={17} />
            </TBtn>

            <TBtn
              title="Heading 3"
              active={editor.isActive('heading', { level: 3 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
            >
              <Heading3 size={17} />
            </TBtn>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Lists and Blocks */}

          <ToolbarGroup>
            <TBtn
              title="Bullet list"
              active={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List size={16} />
            </TBtn>

            <TBtn
              title="Ordered list"
              active={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered size={16} />
            </TBtn>

            <TBtn
              title="Task list"
              active={editor.isActive('taskList')}
              onClick={() => editor.chain().focus().toggleTaskList().run()}
            >
              <ListChecks size={16} />
            </TBtn>

            <TBtn
              title="Blockquote"
              active={editor.isActive('blockquote')}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote size={16} />
            </TBtn>

            <TBtn
              title="Code block"
              active={editor.isActive('codeBlock')}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            >
              <Code size={16} />
            </TBtn>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Text Colors */}

          <ToolbarGroup>
            <ColorControl
              title="Text color"
              value={DEFAULT_TEXT_COLOR}
              onChange={handleTextColor}
              icon={<Palette size={16} />}
            />

            <ColorControl
              title="Text highlight"
              value={DEFAULT_HIGHLIGHT_COLOR}
              onChange={handleHighlight}
              icon={<Highlighter size={16} />}
            />
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Alignment */}

          <ToolbarGroup>
            <TBtn
              title="Align left"
              active={editor.isActive({ textAlign: 'left' })}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
            >
              <AlignLeft size={16} />
            </TBtn>

            <TBtn
              title="Align center"
              active={editor.isActive({ textAlign: 'center' })}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
            >
              <AlignCenter size={16} />
            </TBtn>

            <TBtn
              title="Align right"
              active={editor.isActive({ textAlign: 'right' })}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
            >
              <AlignRight size={16} />
            </TBtn>

            <TBtn
              title="Justify"
              active={editor.isActive({ textAlign: 'justify' })}
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            >
              <AlignJustify size={16} />
            </TBtn>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Insert Elements */}

          <ToolbarGroup>
            <TBtn title="Insert image" onClick={openImageDialog}>
              <ImageIcon size={16} />
            </TBtn>

            <TBtn title="Insert table" onClick={insertTable}>
              <TableIcon size={16} />
            </TBtn>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Shapes */}

          <ToolbarGroup>
            <TBtn
              title="Insert rectangle"
              onClick={() => insertShape('rectangle')}
            >
              <Square size={16} />
            </TBtn>

            <TBtn
              title="Insert square"
              onClick={() => insertShape('square')}
            >
              <Square size={16} />
            </TBtn>

            <TBtn
              title="Insert circle"
              onClick={() => insertShape('circle')}
            >
              <Circle size={16} />
            </TBtn>

            <TBtn
              title="Insert ellipse"
              onClick={() => insertShape('ellipse')}
            >
              <Circle size={16} />
            </TBtn>

            <TBtn
              title="Insert line"
              onClick={() => insertShape('line')}
            >
              <Minus size={16} />
            </TBtn>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Links and Horizontal Rule */}

          <ToolbarGroup>
            <TBtn
              title="Insert link"
              active={editor.isActive('link')}
              onClick={openLinkDialog}
            >
              <LinkIcon size={16} />
            </TBtn>

            <TBtn
              title="Horizontal rule"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            >
              <Minus size={16} />
            </TBtn>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Table Editing */}

          <ToolbarGroup>
            <TBtn
              title="Add table row"
              disabled={!editor.isActive('table')}
              onClick={addTableRow}
            >
              <Plus size={16} />
              <span className="text-[10px]">R</span>
            </TBtn>

            <TBtn
              title="Add table column"
              disabled={!editor.isActive('table')}
              onClick={addTableColumn}
            >
              <Plus size={16} />
              <span className="text-[10px]">C</span>
            </TBtn>

            <TBtn
              title="Delete table"
              disabled={!editor.isActive('table')}
              onClick={deleteTable}
            >
              <TableIcon size={16} className="text-rose-500" />
            </TBtn>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* History */}

          <ToolbarGroup>
            <TBtn
              title="Undo (Ctrl+Z)"
              disabled={!editor.can().undo()}
              onClick={() => editor.chain().focus().undo().run()}
            >
              <Undo size={16} />
            </TBtn>

            <TBtn
              title="Redo (Ctrl+Shift+Z)"
              disabled={!editor.can().redo()}
              onClick={() => editor.chain().focus().redo().run()}
            >
              <Redo size={16} />
            </TBtn>

            <TBtn title="Clear formatting" onClick={clearFormatting}>
              <RemoveFormatting size={16} />
            </TBtn>
          </ToolbarGroup>
        </div>
      </div>

      {/* Link Dialog */}

      <Dialog
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        title="Insert link"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setLinkOpen(false)}
            >
              Cancel
            </Button>

            {linkUrl && (
              <Button variant="outline" onClick={removeLink}>
                Remove link
              </Button>
            )}

            <Button onClick={applyLink}>
              <LinkIcon size={14} />
              Apply
            </Button>
          </>
        }
      >
        <Field
          label="URL"
          hint="https:// will be added automatically if missing."
        >
          <Input
            type="url"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder="https://example.com"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === 'Enter') applyLink();
            }}
          />
        </Field>
      </Dialog>

      {/* Image Dialog */}

      <Dialog
        open={imageOpen}
        onClose={() => setImageOpen(false)}
        title="Insert image"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setImageOpen(false)}
            >
              Cancel
            </Button>

            <Button
              onClick={insertImage}
              disabled={!imageUrl.trim()}
            >
              <ImageIcon size={14} />
              Insert image
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            label="Image URL"
            hint="Use a publicly accessible HTTPS image URL."
          >
            <Input
              type="url"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="https://example.com/image.jpg"
              autoFocus
            />
          </Field>

          <Field label="Alternative text">
            <Input
              value={imageAlt}
              onChange={(event) => setImageAlt(event.target.value)}
              placeholder="Describe this image"
            />
          </Field>
        </div>
      </Dialog>
    </>
  );
}
