class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.editingId = null;
        
        this.initializeElements();
        this.bindEvents();
        this.renderTodos();
        this.updateStats();
    }

    initializeElements() {
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addBtn');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.todoList = document.getElementById('todoList');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.clearAllBtn = document.getElementById('clearAll');
        this.totalTasksSpan = document.getElementById('totalTasks');
        this.completedTasksSpan = document.getElementById('completedTasks');
        this.pendingTasksSpan = document.getElementById('pendingTasks');
    }

    bindEvents() {
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });
        
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        this.clearAllBtn.addEventListener('click', () => this.clearAll());
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        if (!text) return;

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            priority: this.prioritySelect.value,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.saveTodos();
        this.renderTodos();
        this.updateStats();
        
        this.todoInput.value = '';
        this.todoInput.focus();
        
        this.showNotification('Task added successfully!', 'success');
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            
            const message = todo.completed ? 'Task completed!' : 'Task marked as pending';
            this.showNotification(message, 'info');
        }
    }

    deleteTodo(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.todos = this.todos.filter(t => t.id !== id);
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            this.showNotification('Task deleted!', 'warning');
        }
    }

    startEdit(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        this.editingId = id;
        const todoItem = document.querySelector(`[data-id="${id}"]`);
        const todoText = todoItem.querySelector('.todo-text');
        const currentText = todoText.textContent;

        todoText.innerHTML = `
            <input type="text" class="edit-input" value="${currentText}" maxlength="100">
            <div class="edit-actions">
                <button class="save-edit-btn" onclick="todoApp.saveEdit(${id})">
                    <i class="fas fa-check"></i>
                </button>
                <button class="cancel-edit-btn" onclick="todoApp.cancelEdit(${id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        const editInput = todoItem.querySelector('.edit-input');
        editInput.focus();
        editInput.select();
    }

    saveEdit(id) {
        const todoItem = document.querySelector(`[data-id="${id}"]`);
        const editInput = todoItem.querySelector('.edit-input');
        const newText = editInput.value.trim();

        if (!newText) {
            this.cancelEdit(id);
            return;
        }

        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.text = newText;
            this.saveTodos();
            this.renderTodos();
            this.showNotification('Task updated!', 'success');
        }

        this.editingId = null;
    }

    cancelEdit(id) {
        this.editingId = null;
        this.renderTodos();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        this.filterBtns.forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        this.renderTodos();
    }

    clearCompleted() {
        if (confirm('Are you sure you want to clear all completed tasks?')) {
            this.todos = this.todos.filter(t => !t.completed);
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            this.showNotification('Completed tasks cleared!', 'info');
        }
    }

    clearAll() {
        if (confirm('Are you sure you want to clear all tasks? This action cannot be undone.')) {
            this.todos = [];
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            this.showNotification('All tasks cleared!', 'warning');
        }
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            case 'high':
                return this.todos.filter(t => t.priority === 'high');
            default:
                return this.todos;
        }
    }

    renderTodos() {
        const filteredTodos = this.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            this.todoList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>${this.getEmptyStateMessage()}</p>
                </div>
            `;
            return;
        }

        this.todoList.innerHTML = filteredTodos.map(todo => `
            <li class="todo-item ${todo.completed ? 'completed' : ''} priority-${todo.priority}" data-id="${todo.id}">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} 
                       onchange="todoApp.toggleTodo(${todo.id})">
                
                <div class="todo-content">
                    <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                    <div class="todo-meta">
                        <span class="priority-badge">${todo.priority}</span>
                        <span>${this.formatDate(todo.createdAt)}</span>
                    </div>
                </div>
                
                <div class="todo-actions">
                    <button class="action-icon edit-icon" onclick="todoApp.startEdit(${todo.id})" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-icon delete-icon" onclick="todoApp.deleteTodo(${todo.id})" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </li>
        `).join('');
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;

        this.totalTasksSpan.textContent = `Total: ${total}`;
        this.completedTasksSpan.textContent = `Completed: ${completed}`;
        this.pendingTasksSpan.textContent = `Pending: ${pending}`;
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    getEmptyStateMessage() {
        switch (this.currentFilter) {
            case 'active':
                return 'No active tasks. Add some tasks to get started!';
            case 'completed':
                return 'No completed tasks yet. Complete some tasks to see them here!';
            case 'high':
                return 'No high priority tasks. Set some tasks as high priority!';
            default:
                return 'No tasks yet. Add your first task to get started!';
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Today';
        } else if (diffDays === 2) {
            return 'Yesterday';
        } else if (diffDays <= 7) {
            return `${diffDays - 1} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'warning': return 'exclamation-triangle';
            case 'error': return 'times-circle';
            default: return 'info-circle';
        }
    }

    getNotificationColor(type) {
        switch (type) {
            case 'success': return '#28a745';
            case 'warning': return '#ffc107';
            case 'error': return '#dc3545';
            default: return '#17a2b8';
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.todoApp = new TodoApp();
});

// Add some sample data if no todos exist
if (!localStorage.getItem('todos')) {
    const sampleTodos = [
        {
            id: Date.now() - 3000,
            text: 'Welcome to your To-Do List!',
            completed: false,
            priority: 'high',
            createdAt: new Date(Date.now() - 3000).toISOString()
        },
        {
            id: Date.now() - 2000,
            text: 'Click the checkbox to mark as complete',
            completed: true,
            priority: 'medium',
            createdAt: new Date(Date.now() - 2000).toISOString()
        },
        {
            id: Date.now() - 1000,
            text: 'Try adding your own tasks!',
            completed: false,
            priority: 'low',
            createdAt: new Date(Date.now() - 1000).toISOString()
        }
    ];
    localStorage.setItem('todos', JSON.stringify(sampleTodos));
} 