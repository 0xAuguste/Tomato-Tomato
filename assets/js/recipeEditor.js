// Sets up the Tiptap editors for the recipe description, process and notes.
// Loaded as a module; exposes descriptionEditor, processEditor, notesEditor, insertIngredient(), updateIngredient() and setRecipeContent() on window
// so the classic scripts (createRecipe.js, recipeData.js) can use them.
import { Editor, Node, Extension, mergeAttributes, Document, Paragraph, Text, Heading, UndoRedo,
         BulletList, OrderedList, ListItem,
         Plugin, PluginKey, Decoration, DecorationSet } from '/assets/js/vendor/tiptap.js?v=2';

// Ingredient fields stored on each ingredient node (mirrors the Ingredient class in recipeData.js)
const ingredientFields = ['id', 'name', 'ingredientDbId', 'quantity', 'unit', 'unitDbId', 'displayText', 'linkedRecipeId'];

// Inline, non-editable ingredient pill. Deleted and moved as a single unit.
const IngredientNode = Node.create({
    name: 'ingredient',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,

    addAttributes() {
        const attributes = {};
        ingredientFields.forEach(field => {
            attributes[field] = {
                default: null,
                parseHTML: element => element.dataset[field] ?? null,
                renderHTML: attrs => ({ [`data-${field.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}`]: attrs[field] }),
            };
        });
        return attributes;
    },

    parseHTML() {
        return [{ tag: 'span.ingredient-text' }];
    },

    renderHTML({ node, HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { class: 'ingredient-text', onclick: 'editIngredient(this)' }),
                node.attrs.displayText];
    },

    renderText({ node }) {
        return node.attrs.displayText;
    },

    // Mark ingredients that sit alone in a top-level paragraph (not a list item) as .orphan. Whitespace-only
    // text is ignored, matching how recipeData.js saves paragraphs and how recipeViewer.js applies .orphan
    addProseMirrorPlugins() {
        return [new Plugin({
            key: new PluginKey('orphanIngredient'),
            props: {
                decorations(state) {
                    const decorations = [];
                    state.doc.forEach((node, pos) => {
                        if (node.type.name !== 'paragraph') {
                            return;
                        }
                        const segments = [];
                        node.forEach((child, offset) => {
                            if (!child.isText || child.text.trim()) {
                                segments.push({ child, offset });
                            }
                        });
                        if (segments.length === 1 && segments[0].child.type.name === 'ingredient') {
                            const from = pos + 1 + segments[0].offset;
                            decorations.push(Decoration.node(from, from + segments[0].child.nodeSize, { class: 'orphan' }));
                        }
                    });
                    return DecorationSet.create(state.doc, decorations);
                },
            },
        })];
    },
});

// List item holding a single paragraph, so lists stay flat. Drops the Tab / Shift-Tab nesting shortcuts
const FlatListItem = ListItem.extend({
    content: 'paragraph',
    addKeyboardShortcuts() {
        return { Enter: () => this.editor.commands.splitListItem(this.name) };
    },
});

// Keyboard shortcuts for the process editor
const ProcessShortcuts = Extension.create({
    name: 'processShortcuts',
    addKeyboardShortcuts() {
        return {
            // Opens the add-ingredient panel; the ingredient is inserted at the cursor on save
            'Shift-Enter': () => { openAddIngredient(); return true; },
            // Toggles the current line between section header and body text; typed as-is inside lists
            '#': () => !this.editor.isActive('listItem') && this.editor.commands.toggleHeading({ level: 1 }),
        };
    },
});

const baseExtensions = [
    Document,
    Text,
    Paragraph.configure({ HTMLAttributes: { class: 'recipe-paragraph' } }),
    UndoRedo,
];

// Flat bullet and numbered lists, for the process and notes editors
const listExtensions = [
    BulletList.configure({ HTMLAttributes: { class: 'recipe-list' } }),  // Started by typing "- " or "* "
    OrderedList.configure({ HTMLAttributes: { class: 'recipe-list' } }), // Started by typing "1. "
    FlatListItem,
];

// Creates an editor inside the given container; clicking empty space in the container focuses the end
function createEditor(container, extensions) {
    const editor = new Editor({ element: container, extensions });
    container.addEventListener('click', (e) => {
        if (e.target === container) {
            editor.commands.focus('end');
        }
    });
    return editor;
}

window.descriptionEditor = createEditor(document.getElementById('recipe-description'), baseExtensions);

window.processEditor = createEditor(document.getElementById('recipe-process'), [
    ...baseExtensions,
    Heading.configure({ levels: [1], HTMLAttributes: { class: 'recipe-paragraph section-header' } }), // Toggled with "#"
    ...listExtensions,
    IngredientNode,
    ProcessShortcuts,
]);

// Notes take paragraphs and lists, but no section headers or ingredients
window.notesEditor = createEditor(document.getElementById('recipe-notes'), [...baseExtensions, ...listExtensions]);

// Ingredient node attributes for an Ingredient (from recipeData.js); missing fields become ""
function ingredientAttrs(ingredient) {
    const attrs = {};
    ingredientFields.forEach(field => attrs[field] = String(ingredient[field] ?? ''));
    return attrs;
}

// Inserts an Ingredient (from recipeData.js) at the process editor's cursor
window.insertIngredient = function (ingredient) {
    const attrs = ingredientAttrs(ingredient);

    // Follow the ingredient with a space (unless whitespace already follows) so the cursor lands in
    // plain text; browsers draw a cursor placed directly after an uneditable span inside the span
    const { $from } = processEditor.state.selection;
    const nextChar = $from.parent.textBetween($from.parentOffset, Math.min($from.parentOffset + 1, $from.parent.content.size), '', '￼');
    const content = [{ type: 'ingredient', attrs }];
    if (!/^\s/.test(nextChar)) {
        content.push({ type: 'text', text: ' ' });
    }
    processEditor.chain().focus().insertContent(content).run();
};

// Replaces the data of every ingredient node with the given frontend ID (copy-pasted ingredients share
// an ID and are saved as one, so they're kept in sync)
window.updateIngredient = function (ingredient) {
    const attrs = ingredientAttrs(ingredient);

    const { tr } = processEditor.state;
    processEditor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'ingredient' && node.attrs.id === attrs.id) {
            tr.setNodeMarkup(pos, null, attrs);
        }
    });
    processEditor.view.dispatch(tr);
};

// Loads a saved description, process and notes (as returned by get_recipe.php) into the editors, without an undo step,
// so undo can't clear the loaded recipe. ingredients maps frontend IDs to Ingredient objects (recipeData.js)
window.setRecipeContent = function (description, process, notes, ingredients) {
    const textContent = text => text ? [{ type: 'text', text }] : [];
    const doc = blocks => ({ type: 'doc', content: blocks.length ? blocks : [{ type: 'paragraph' }] });

    // A paragraph of text and ingredient segments
    const paragraph = segments => ({
        type: 'paragraph',
        content: segments.map(segment => segment.type === 'ingredient'
            // An ingredient without a saved row (e.g. its recipe was deleted) keeps just its display text
            ? { type: 'ingredient', attrs: ingredientAttrs(ingredients.get(String(segment.id)) ?? { id: segment.id, displayText: segment.displayText }) }
            : { type: 'text', text: segment.text }),
    });

    // A flat list of paragraphs
    const list = block => ({
        type: block.ordered ? 'orderedList' : 'bulletList',
        attrs: block.ordered ? { start: block.start ?? 1 } : {},
        content: block.items.map(item => ({ type: 'listItem', content: [paragraph(item)] })),
    });

    const descriptionBlocks = (description || []).map(text => ({ type: 'paragraph', content: textContent(text) }));

    const processBlocks = (process || []).map(block => {
        if (block.type === 'header') {
            return { type: 'heading', attrs: { level: 1 }, content: textContent(block.text) };
        }
        if (block.type === 'list') {
            return list(block);
        }
        return paragraph(block.content);
    });

    const notesBlocks = (notes || []).map(block => block.type === 'list' ? list(block) : paragraph(block.content));

    descriptionEditor.chain().setMeta('addToHistory', false).setContent(doc(descriptionBlocks)).run();
    processEditor.chain().setMeta('addToHistory', false).setContent(doc(processBlocks)).run();
    notesEditor.chain().setMeta('addToHistory', false).setContent(doc(notesBlocks)).run();
};
