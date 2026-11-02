let tagFilterCount = 0; // Numbers each filter's list, so option IDs are unique on the page

// Creates a searchable multiselect dropdown: picking an option adds it as a removable pill.
// Pills go in a <span> appended to pillContainer, so several filters can share one row of pills, in filter order.
// options: [{ id, name }]. onChange(selectedIds) runs whenever the picked options change.
// Returns { getSelected, setSelected }. Uses normalizeText (recipeIndex.js) to match typed text.
function createTagFilter({ container, pillContainer, label, options, onChange }) {
    const listId = `tag-filter-list-${++tagFilterCount}`;
    let selected = []; // Picked options, in the order they were picked
    let shownOptions = []; // Options currently in the list
    let highlighted = -1; // Index in shownOptions picked by Enter, moved with the arrow keys

    const wrapper = document.createElement('div');
    wrapper.classList.add('tag-filter');
    const input = document.createElement('input');
    input.type = 'text';
    input.classList.add('tag-filter-input');
    input.placeholder = label;
    input.autocomplete = 'off';
    input.setAttribute('aria-label', `Filter by ${label}`);
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-controls', listId);
    input.setAttribute('aria-expanded', 'false');
    const list = document.createElement('ul');
    list.id = listId;
    list.classList.add('tag-filter-list');
    list.setAttribute('role', 'listbox');
    list.hidden = true;
    wrapper.append(input, list);
    container.append(wrapper);

    const pills = document.createElement('span');
    pills.classList.add('tag-filter-pills');
    pillContainer.append(pills);

    // Shows the options matching the typed text that aren't already picked
    function openList() {
        const query = normalizeText(input.value.trim());
        shownOptions = options.filter(option =>
            !selected.some(picked => picked.id === option.id) && normalizeText(option.name).includes(query)
        );
        highlighted = query && shownOptions.length > 0 ? 0 : -1; // While typing, Enter picks the first match
        renderList();
    }

    function closeList() {
        list.hidden = true;
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
    }

    function renderList() {
        list.innerHTML = ''; // Clear old options
        shownOptions.forEach((option, index) => {
            const item = document.createElement('li');
            item.id = `${listId}-${index}`;
            item.classList.add('tag-filter-option');
            item.setAttribute('role', 'option');
            item.textContent = option.name; // As text, never HTML
            if (index === highlighted) {
                item.classList.add('highlighted');
                item.setAttribute('aria-selected', 'true');
            }
            // Use mousedown so the input keeps focus and the list stays open for another pick
            item.onmousedown = (e) => {
                e.preventDefault();
                pick(option);
            };
            list.append(item);
        });

        list.hidden = shownOptions.length === 0;
        input.setAttribute('aria-expanded', String(!list.hidden));
        if (highlighted >= 0) {
            input.setAttribute('aria-activedescendant', `${listId}-${highlighted}`);
            list.children[highlighted].scrollIntoView({ block: 'nearest' });
        } else {
            input.removeAttribute('aria-activedescendant');
        }
    }

    function pick(option) {
        selected.push(option);
        input.value = '';
        renderPills();
        openList();
        onChange(selected.map(picked => picked.id));
    }

    function remove(id) {
        selected = selected.filter(picked => picked.id !== id);
        renderPills();
        if (!list.hidden) openList(); // Put the option back in the open list
        onChange(selected.map(picked => picked.id));
    }

    function renderPills() {
        pills.innerHTML = ''; // Clear old pills
        selected.forEach(option => {
            const pill = document.createElement('span');
            pill.classList.add('tag-filter-pill');
            pill.textContent = option.name; // As text, never HTML
            pill.title = label;
            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.classList.add('tag-filter-remove');
            removeButton.innerHTML = '&times;';
            removeButton.setAttribute('aria-label', `Remove ${option.name}`);
            removeButton.onclick = () => remove(option.id);
            pill.append(removeButton);
            pills.append(pill);
        });
    }

    input.addEventListener('focus', openList);
    input.addEventListener('input', openList);
    input.addEventListener('blur', closeList);
    input.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (list.hidden) {
                openList();
                return;
            }
            const step = event.key === 'ArrowDown' ? 1 : -1;
            highlighted = Math.min(Math.max(highlighted + step, 0), shownOptions.length - 1);
            renderList();
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (highlighted >= 0) pick(shownOptions[highlighted]);
        } else if (event.key === 'Escape') {
            input.value = '';
            closeList();
        } else if (event.key === 'Backspace' && input.value === '' && selected.length > 0) {
            remove(selected[selected.length - 1].id); // Remove the last pick
        }
    });

    return {
        getSelected: () => selected.map(picked => picked.id),
        // Picks the options with these IDs (e.g. from the URL), skipping unknown ones. Doesn't call onChange.
        setSelected(ids) {
            selected = ids.map(id => options.find(option => option.id === id)).filter(Boolean);
            renderPills();
        }
    };
}
