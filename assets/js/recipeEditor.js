// Sets up the Tiptap editors for the recipe description and process.
// Loaded as a module; exposes descriptionEditor, processEditor and insertIngredient() on window
// so the classic scripts (createRecipe.js, recipeData.js) can use them.
import { Editor, Node, Extension, mergeAttributes, Document, Paragraph, Text, Heading, UndoRedo,
         Plugin, PluginKey, Decoration, DecorationSet } from '/assets/js/vendor/tiptap.js';

// Ingredient fields stored on each ingredient node (mirrors the Ingredient class in recipeData.js)
const ingredientFields = ['id', 'name', 'ingredientDbId', 'quantity', 'unit', 'unitDbId', 'displayText'];

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

    // Mark ingredients that sit alone in a paragraph as .orphan (same rule as recipeViewer.js)
    addProseMirrorPlugins() {
        return [new Plugin({
            key: new PluginKey('orphanIngredient'),
            props: {
                decorations(state) {
                    const decorations = [];
                    state.doc.descendants((node, pos) => {
                        if (node.type.name === 'paragraph' && node.childCount === 1 && node.firstChild.type.name === 'ingredient') {
                            decorations.push(Decoration.node(pos + 1, pos + 1 + node.firstChild.nodeSize, { class: 'orphan' }));
                        }
                    });
                    return DecorationSet.create(state.doc, decorations);
                },
            },
        })];
    },
});

// Shift + Enter opens the add-ingredient panel; the ingredient is inserted at the cursor on save
const AddIngredientShortcut = Extension.create({
    name: 'addIngredientShortcut',
    addKeyboardShortcuts() {
        return { 'Shift-Enter': () => { openAddIngredient(); return true; } };
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
    Heading.configure({ levels: [1], HTMLAttributes: { class: 'recipe-paragraph section-header' } }), // "# " at line start
    IngredientNode,
    AddIngredientShortcut,
]);

// Inserts an Ingredient (from recipeData.js) at the process editor's cursor
window.insertIngredient = function (ingredient) {
    const attrs = {};
    ingredientFields.forEach(field => attrs[field] = String(ingredient[field]));
    processEditor.chain().focus().insertContent({ type: 'ingredient', attrs }).run();
};
