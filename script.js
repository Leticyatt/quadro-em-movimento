document.addEventListener('DOMContentLoaded', () => {
    loadBoardState();
    
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    if (themeToggleBtn) {
        const savedTheme = localStorage.getItem('kanbanTheme');
        if (savedTheme === 'dark') {
            body.classList.add('dark-mode');
            themeToggleBtn.textContent = '☀️';
        }

        themeToggleBtn.addEventListener('click', () => {
            body.classList.toggle('dark-mode'); 
            
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('kanbanTheme', 'dark');
                themeToggleBtn.textContent = '☀️';
            } else {
                localStorage.setItem('kanbanTheme', 'light');
                themeToggleBtn.textContent = '🌙';
            }
        });
    }

    const cardLists = document.querySelectorAll('.card-list');
    
    cardLists.forEach(list => {
        list.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingCard = document.querySelector('.is-dragging');
            if (draggingCard) {
                list.appendChild(draggingCard);
            }
        });
    });

    let undoTimeout;

    function showUndoToast(card, parentList, nextSibling) {
        const toast = document.getElementById('toast-container');
        
        toast.innerHTML = `
            <span>Tarefa excluída.</span>
            <button class="undo-btn">Desfazer</button>
        `;
        
        toast.classList.add('show'); 

        if (undoTimeout) {
            clearTimeout(undoTimeout);
        }

        undoTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 5000);

        const undoBtn = toast.querySelector('.undo-btn');
        undoBtn.addEventListener('click', () => {
            if (nextSibling) {
                parentList.insertBefore(card, nextSibling);
            } else {
                parentList.appendChild(card);
            }
            saveBoardState(); 
            toast.classList.remove('show'); 
            clearTimeout(undoTimeout); 
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            const focusedElement = document.activeElement;
            
            if (focusedElement && focusedElement.classList.contains('column')) {
                focusedElement.remove(); 
                saveBoardState(); 
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('add-card-btn')) {
            const btn = e.target;
            const column = btn.closest('.column');
            const cardList = column.querySelector('.card-list');

            if (column.querySelector('.inline-add-form')) return;

            btn.style.display = 'none';

            const formContainer = document.createElement('div');
            formContainer.classList.add('inline-add-form');

            const input = document.createElement('textarea');
            input.placeholder = 'Insira um título para este cartão...';
            input.classList.add('inline-input');

            const controls = document.createElement('div');
            controls.classList.add('inline-controls');

            const confirmBtn = document.createElement('button');
            confirmBtn.textContent = 'Adicionar cartão';
            confirmBtn.classList.add('confirm-add-btn');

            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = '×';
            cancelBtn.classList.add('cancel-add-btn');

            controls.appendChild(confirmBtn);
            controls.appendChild(cancelBtn);
            formContainer.appendChild(input);
            formContainer.appendChild(controls);

            column.insertBefore(formContainer, btn);
            input.focus();

            const closeForm = () => {
                formContainer.remove();
                btn.style.display = 'block';
            };

            const saveTask = () => {
                const text = input.value.trim();
                if (text !== '') {
                    createNewCard(text, cardList);
                }
                closeForm();
            };

            confirmBtn.addEventListener('click', saveTask);
            cancelBtn.addEventListener('click', closeForm);

            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault(); 
                    saveTask();
                }
                if (event.key === 'Escape') {
                    closeForm();
                }
            });
        }
    });

    const addListBtn = document.getElementById('add-list-btn');
    const board = document.querySelector('.board');

    if (addListBtn) {
        addListBtn.addEventListener('click', () => {
            const wrapper = addListBtn.parentElement;

            if (wrapper.querySelector('.inline-add-column')) {
                return;
            }

            addListBtn.style.display = 'none';

            const form = document.createElement('div');
            form.classList.add('inline-add-column');

            const input = document.createElement('input');
            input.classList.add('column-input');
            input.placeholder = 'Insira o título da lista...';

            const controls = document.createElement('div');
            controls.classList.add('inline-controls');

            const confirmBtn = document.createElement('button');
            confirmBtn.textContent = 'Adicionar lista';
            confirmBtn.classList.add('confirm-add-btn');

            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = '×';
            cancelBtn.classList.add('cancel-add-btn');

            controls.append(confirmBtn, cancelBtn);
            form.append(input, controls);
            wrapper.appendChild(form);
            input.focus();

            const closeForm = () => {
                form.remove();
                addListBtn.style.display = 'block';
            };

            const saveColumn = () => {
                const title = input.value.trim();
                if (title) {
                    createNewColumn(title);
                }
                closeForm();
            };

            confirmBtn.onclick = saveColumn;
            cancelBtn.onclick = closeForm;
            input.onkeydown = (e) => { 
                if(e.key === 'Enter') saveColumn(); 
                if(e.key === 'Escape') closeForm(); 
            };
        });
    }

    function createNewColumn(title) {
        const status = title.toLowerCase().replace(/\s+/g, '-');
        const column = document.createElement('div');
        column.classList.add('column');
        column.dataset.status = status;
        column.setAttribute('tabindex', '0'); 
        
        column.innerHTML = `
            <h3>${title}</h3>
            <div class="card-list"></div>
            <button class="add-card-btn">+ Adicionar um cartão</button>
        `;

        board.insertBefore(column, addListBtn.parentElement);
        
        const newList = column.querySelector('.card-list');
        newList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingCard = document.querySelector('.is-dragging');
            if (draggingCard) newList.appendChild(draggingCard);
        });

        saveBoardState();
    }

    function createNewCard(text, targetList, id = `task-${Date.now()}`) {
        const newCard = document.createElement('div');
        newCard.classList.add('card');
        newCard.setAttribute('draggable', 'true');
        newCard.id = id;

        newCard.innerHTML = `
            <span>${text}</span>
            <button class="delete-btn" aria-label="Excluir tarefa">×</button>
        `;

        attachEventsToCard(newCard);
        targetList.appendChild(newCard);
        saveBoardState();
    }

    function attachEventsToCard(card) {
        card.addEventListener('dragstart', () => {
            card.classList.add('is-dragging');
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('is-dragging');
            saveBoardState();
        });

        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            const parentList = card.parentNode;
            const nextSibling = card.nextSibling;
            card.remove();
            saveBoardState();
            showUndoToast(card, parentList, nextSibling);
        });

        const textSpan = card.querySelector('span');

        textSpan.addEventListener('click', () => {
            card.setAttribute('draggable', 'false');
            const originalText = textSpan.innerText;
            
            textSpan.contentEditable = 'true';
            textSpan.classList.add('is-editing');
            textSpan.focus();

            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(textSpan);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);

            const finishEditing = () => {
                textSpan.contentEditable = 'false';
                textSpan.classList.remove('is-editing');
                card.setAttribute('draggable', 'true'); 

                if (textSpan.innerText.trim() === '') {
                    textSpan.innerText = originalText;
                } else {
                    saveBoardState(); 
                }
            };

            textSpan.addEventListener('blur', finishEditing, { once: true });

            textSpan.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault(); 
                    textSpan.blur(); 
                }
                if (event.key === 'Escape') {
                    textSpan.innerText = originalText; 
                    textSpan.blur();
                }
            });
        });
    }

    function saveBoardState() {
        const boardState = {};
        
        document.querySelectorAll('.column').forEach(column => {
            const status = column.getAttribute('data-status');
            const tasks = [];
            
            column.querySelectorAll('.card').forEach(card => {
                const text = card.querySelector('span').innerText;
                tasks.push({ id: card.id, text: text });
            });
            
            boardState[status] = tasks;
        });
        
        localStorage.setItem('meuKanbanState', JSON.stringify(boardState));
    }

    function loadBoardState() {
        const savedState = localStorage.getItem('meuKanbanState');
        
        if (savedState) {
            const boardState = JSON.parse(savedState);
            
            for (const [status, tasks] of Object.entries(boardState)) {
                const column = document.querySelector(`[data-status="${status}"]`);
                if(column) {
                    const cardList = column.querySelector('.card-list');
                    cardList.innerHTML = '';
                    
                    tasks.forEach(task => {
                        createNewCard(task.text, cardList, task.id);
                    });
                }
            }
        }
    }
});