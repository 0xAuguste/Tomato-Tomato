// Entry point for the vendored Tiptap bundle (assets/js/vendor/tiptap.js).
// Bundling everything into one file guarantees a single copy of ProseMirror.
export { Editor, Node, Extension, mergeAttributes } from '@tiptap/core';
export { Document } from '@tiptap/extension-document';
export { Paragraph } from '@tiptap/extension-paragraph';
export { Text } from '@tiptap/extension-text';
export { Heading } from '@tiptap/extension-heading';
export { UndoRedo } from '@tiptap/extensions';
export { Plugin, PluginKey } from '@tiptap/pm/state';
export { Decoration, DecorationSet } from '@tiptap/pm/view';
