// Sets up the Tiptap editors for the recipe description and process.
// Loaded as a module; exposes descriptionEditor, processEditor, insertIngredient() and updateIngredient() on window
// so the classic scripts (createRecipe.js, recipeData.js) can use them.
import { Editor, Node, Extension, mergeAttributes, Document, Paragraph, Text, Heading, UndoRedo,
         Plugin, PluginKey, Decoration, DecorationSet } from '/assets/js/vendor/tiptap.js';

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

    // Mark ingredients that sit alone in a paragraph as .orphan. Whitespace-only text is ignored,
    // matching how recipeData.js saves paragraphs and how recipeViewer.js applies .orphan
    addProseMirrorPlugins() {
        return [new Plugin({
            key: new PluginKey('orphanIngredient'),
            props: {
                decorations(state) {
                    const decorations = [];
                    state.doc.descendants((node, pos) => {
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

// Keyboard shortcuts for the process editor
const ProcessShortcuts = Extension.create({
    name: 'processShortcuts',
    addKeyboardShortcuts() {
        return {
            // Opens the add-ingredient panel; the ingredient is inserted at the cursor on save
            'Shift-Enter': () => { openAddIngredient(); return true; },
            // Toggles the current line between section header and body text
            '#': () => this.editor.commands.toggleHeading({ level: 1 }),
        };
    },
});

const baseExtensions = [
    Document,
    Text,
    Paragraph.configure({ HTMLAttributes: { class: 'recipe-paragraph' } }),
    UndoRedo,
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
    IngredientNode,
    ProcessShortcuts,
]);

// Inserts an Ingredient (from recipeData.js) at the process editor's cursor
window.insertIngredient = function (ingredient) {
    const attrs = {};
    ingredientFields.forEach(field => attrs[field] = String(ingredient[field]));

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
    const attrs = {};
    ingredientFields.forEach(field => attrs[field] = String(ingredient[field]));

    const { tr } = processEditor.state;
    processEditor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'ingredient' && node.attrs.id === attrs.id) {
            tr.setNodeMarkup(pos, null, attrs);
        }
    });
    processEditor.view.dispatch(tr);
};
