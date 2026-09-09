"use client";

import { useId, useRef, useState } from "react";
import { useEditor, useEditorState, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import { uploadImageFile, type UploadFolder } from "@/lib/clientImageUpload";
import { RICH_TEXT_CLASSNAME } from "@/lib/richTextClassName";

/**
 * Replaces the plain HTML textarea previously used for property
 * descriptions and blog content — that had no formatting UI at all (raw
 * `<p>`/`<b>` tags typed by hand), which read as "the editor doesn't work"
 * even though it was working as designed. TipTap (not Laravel's Summernote
 * — that's a jQuery-era editor with no clean way into a React 19/Next 16
 * app, and its own maintenance has slowed) is the current standard choice
 * for a React rich text editor: actively maintained, first-class React
 * bindings, and — the part that matters most here — it outputs plain
 * semantic HTML (`<p>`, `<h2>`, `<strong>`, `<ul><li>`, `<a>`, `<img>`),
 * so nothing about how content is stored or rendered on the public site
 * changes; only the authoring experience does.
 *
 * The editable area below uses the exact same typography classes the
 * public blog/property pages render content with (text-xl/font-medium/
 * leading-[1.85]/mb-8 per block) — so what you see while typing already
 * looks like the real page, not a generic "rich text box" appearance that
 * then renders differently once published.
 */
export function RichTextEditor({
  defaultValue,
  onChange,
  folder,
  slug,
}: {
  defaultValue?: string;
  onChange: (html: string) => void;
  /** Which S3 prefix images inserted into this content upload under. */
  folder: UploadFolder;
  /** Existing record's slug, for the S3 key — same draft-id fallback
   * pattern as ImageUploader when the record doesn't exist yet. */
  slug?: string;
}) {
  const reactId = useId();
  const draftSlugRef = useRef(slug || `draft-${reactId.replace(/[^a-z0-9]/gi, "")}`);
  const [uploading, setUploading] = useState(false);

  // Shared by all three entry points an image can come in through (toolbar
  // file picker, drag-drop, paste) — one upload-then-insert path, `insert`
  // just varies in how it places the result (via the editor's own command
  // chain when a live Editor instance is on hand, or a raw ProseMirror
  // transaction when only the view is — see handleDrop/handlePaste below,
  // which run before the wrapping Editor is available to them).
  async function uploadAndInsert(file: File, insert: (url: string) => void) {
    setUploading(true);
    try {
      const url = await uploadImageFile(file, folder, draftSlugRef.current);
      insert(url);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  const editor = useEditor({
    // Next.js pre-renders a server pass before hydrating — without this,
    // TipTap's default of rendering immediately on mount can produce a
    // server/client markup mismatch (a known SSR gotcha for this library,
    // not specific to anything else in the app).
    immediatelyRender: false,
    extensions: [
      // TipTap v3's StarterKit bundles its own Link extension (unlike v2,
      // where it was always a separate package) — configuring it here
      // instead of also importing @tiptap/extension-link avoids a
      // "duplicate extension" warning from registering Link twice.
      StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
      TiptapImage,
    ],
    content: defaultValue || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: `min-h-64 max-h-[32rem] overflow-y-auto rounded-b border border-t-0 border-slate-300 bg-white px-4 py-3 focus:outline-none ${RICH_TEXT_CLASSNAME}`,
      },
      // Without these, dropping or pasting an image file falls through to
      // ProseMirror's default handling, which — depending on what's in the
      // clipboard/drag payload — can end up inlining the image as a base64
      // data: URI directly in the stored HTML (bloating every future page
      // load with the full image bytes, every time, forever). Intercepting
      // both here routes any actual image file through the same
      // compress-then-upload-to-S3 pipeline the toolbar button and the
      // property/agent/blog-cover pickers all use, so a real hosted URL is
      // what ever ends up in the saved content — never embedded bytes.
      handleDrop(view, event) {
        const file = event.dataTransfer?.files?.[0];
        if (!file || !file.type.startsWith("image/")) return false;
        event.preventDefault();
        uploadAndInsert(file, (url) => {
          const node = view.state.schema.nodes.image.create({ src: url });
          view.dispatch(view.state.tr.replaceSelectionWith(node));
        });
        return true;
      },
      handlePaste(view, event) {
        const file = [...(event.clipboardData?.items ?? [])]
          .find((item) => item.type.startsWith("image/"))
          ?.getAsFile();
        if (!file) return false;
        event.preventDefault();
        uploadAndInsert(file, (url) => {
          const node = view.state.schema.nodes.image.create({ src: url });
          view.dispatch(view.state.tr.replaceSelectionWith(node));
        });
        return true;
      },
    },
  });

  return (
    <div>
      <Toolbar
        editor={editor}
        uploading={uploading}
        onPickImage={(file) =>
          editor && uploadAndInsert(file, (url) => editor.chain().focus().setImage({ src: url }).run())
        }
      />
      <EditorContent editor={editor} />
      {uploading && <p className="mt-1 text-xs text-slate-500">Uploading image…</p>}
    </div>
  );
}

function ToolbarButton({
  title,
  active,
  disabled,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      // Clicking a button naturally blurs the editor and collapses its
      // text selection on mousedown, *before* onClick even fires — so by
      // the time the formatting command runs, there's nothing selected to
      // apply it to (this is what made every toolbar button look like it
      // "did nothing" when text was selected first). Preventing the
      // default mousedown behavior stops the editor from losing focus/
      // selection in the first place, which is the standard fix for this
      // in any contenteditable-based toolbar.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded px-2.5 py-1 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        active ? "bg-brand-navy text-white" : "text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({
  editor,
  uploading,
  onPickImage,
}: {
  editor: Editor | null;
  uploading: boolean;
  onPickImage: (file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // editor.isActive(...) always reflects the true current state whenever
  // it's CALLED, but React only re-renders this component when its own
  // props/state change — TipTap's Editor instance keeps the same object
  // identity across a selection change alone (clicking into existing
  // bold text, arrow-keying around), so without this, the toolbar's
  // highlighted state only ever refreshed as a side effect of typing
  // (onUpdate firing → onChange → parent state update → this re-renders
  // too), never from selection changes on their own. That's exactly why
  // it looked fine while actively typing new content (create) but stale
  // while just clicking around existing content to check formatting
  // (edit) — not actually a create-vs-edit difference in the code at
  // all, both use this same component. useEditorState is TipTap's own
  // documented fix for this: it subscribes to the editor's transactions
  // (which fire on selection changes too, not just content ones) and
  // re-renders this component whenever the selected snapshot changes.
  // Selector always returns a real object (never null) — the readiness
  // gate below checks the `editor` PROP directly instead, not this hook's
  // output. Found live: with a null-then-real selector (checked here via
  // the destructured snapshot editor), the returned state got stuck
  // permanently null on an EDIT page loading a large existing document —
  // `editor` (this component's own prop, confirmed correct: EditorContent
  // right below, given the exact same prop, was already rendering real
  // content) had clearly become available, but this hook's own internal
  // state manager — constructed once, lazily, on Toolbar's very first
  // render, which happens before `editor` exists at all since
  // `immediatelyRender: false` guarantees a null-first render — never
  // seemed to pick up the transition once the null case was baked into
  // the selector's own conditional. Decoupling the two (this always
  // computes real values off whatever editor it currently has, falling
  // back to `false` only via `?.` when there's truly nothing yet) sidesteps
  // that entirely, verified fixed via Playwright on the exact page that
  // reproduced it.
  const activeStates = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold") ?? false,
      italic: editor?.isActive("italic") ?? false,
      h2: editor?.isActive("heading", { level: 2 }) ?? false,
      h3: editor?.isActive("heading", { level: 3 }) ?? false,
      bulletList: editor?.isActive("bulletList") ?? false,
      orderedList: editor?.isActive("orderedList") ?? false,
      blockquote: editor?.isActive("blockquote") ?? false,
      link: editor?.isActive("link") ?? false,
    }),
    // The selector above never actually returns null, but the `Editor |
    // null` overload's return type is still `TSelectorResult | null` —
    // TypeScript picks the overload from the input type, not from
    // analyzing whether the callback could produce null. This fallback
    // is purely to satisfy that type, not a real runtime path.
  }) ?? {
    bold: false,
    italic: false,
    h2: false,
    h3: false,
    bulletList: false,
    orderedList: false,
    blockquote: false,
    link: false,
  };

  if (!editor) return <div className="h-10 rounded-t border border-slate-300 bg-slate-50" />;

  const buttons: { label: string; title: string; active?: boolean; onClick: () => void }[] = [
    { label: "B", title: "Bold", active: activeStates.bold, onClick: () => editor.chain().focus().toggleBold().run() },
    { label: "I", title: "Italic", active: activeStates.italic, onClick: () => editor.chain().focus().toggleItalic().run() },
    { label: "H2", title: "Heading 2", active: activeStates.h2, onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "H3", title: "Heading 3", active: activeStates.h3, onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: "•", title: "Bullet list", active: activeStates.bulletList, onClick: () => editor.chain().focus().toggleBulletList().run() },
    { label: "1.", title: "Numbered list", active: activeStates.orderedList, onClick: () => editor.chain().focus().toggleOrderedList().run() },
    { label: "❝", title: "Quote", active: activeStates.blockquote, onClick: () => editor.chain().focus().toggleBlockquote().run() },
    // StarterKit already registers the horizontalRule node/command by
    // default (confirmed in @tiptap/starter-kit's own types, not assumed)
    // — it's exactly why an <hr> pasted in from elsewhere already worked;
    // this just exposes the same thing as a toolbar button. No `active`
    // state: an <hr> is a standalone block with nothing to toggle on/off
    // the way bold/italic/a list can be.
    { label: "―", title: "Horizontal line", onClick: () => editor.chain().focus().setHorizontalRule().run() },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t border border-slate-300 bg-slate-50 p-1.5">
      {buttons.map((b) => (
        <ToolbarButton key={b.title} title={b.title} active={b.active} onClick={b.onClick}>
          {b.label}
        </ToolbarButton>
      ))}

      <span className="mx-1 h-5 w-px bg-slate-300" />

      <ToolbarButton
        title="Link"
        active={activeStates.link}
        onClick={() => {
          const url = window.prompt("Link URL");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
      >
        Link
      </ToolbarButton>
      <ToolbarButton title="Image" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
        {uploading ? "Uploading…" : "Image"}
      </ToolbarButton>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPickImage(file);
          e.target.value = "";
        }}
      />

      <span className="mx-1 h-5 w-px bg-slate-300" />

      <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
        ↺
      </ToolbarButton>
      <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
        ↻
      </ToolbarButton>
    </div>
  );
}

export default RichTextEditor;
