import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  linkPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CreateLink,
  InsertTable,
  BlockTypeSelect,
  ListsToggle,
  Separator,
  InsertThematicBreak,
  type MDXEditorMethods,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import './mdx-editor-custom.css';
import { useRef } from 'react';

interface NoteEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function NoteEditor({ value, onChange, placeholder }: NoteEditorProps) {
  const editorRef = useRef<MDXEditorMethods>(null);

  return (
    <div className="mdx-editor-wrapper border rounded-lg overflow-hidden bg-white">
      <MDXEditor
        ref={editorRef}
        markdown={value || ''}
        onChange={onChange}
        placeholder={placeholder || 'Escribe tu nota aquí... Usa la barra de herramientas para formatear texto, insertar tablas y más.'}
        contentEditableClassName="prose prose-sm max-w-none min-h-96 p-4 focus:outline-none"
        plugins={[
          // Plugins de contenido
          headingsPlugin(),
          listsPlugin(),
          linkPlugin(),
          quotePlugin(),
          tablePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),

          // Toolbar plugin
          toolbarPlugin({
            toolbarContents: () => (
              <div className="flex items-center gap-2 flex-wrap p-2 bg-gray-50 border-b">
                <UndoRedo />
                <Separator />
                <BoldItalicUnderlineToggles />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <CreateLink />
                <Separator />
                <ListsToggle />
                <Separator />
                <InsertTable />
                <Separator />
                <InsertThematicBreak />
              </div>
            )
          })
        ]}
      />
    </div>
  );
}
