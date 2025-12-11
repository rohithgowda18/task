import './App.css';
import React, { useEffect, useState } from 'react';
import AddTask from './AddTask';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: API });

function App() {
      const [showAddTask, setShowAddTask] = useState(false);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterLabel, setFilterLabel] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
  const [itemText, setItemText] = useState('');
  const [deadline, setDeadline] = useState('');
  const [completed, setCompleted] = useState(false);
  const [updateDeadline, setUpdateDeadline] = useState('');
  const [updateCompleted, setUpdateCompleted] = useState(false);
  const [category, setCategory] = useState('');
  const [label, setLabel] = useState('');
  const [priority, setPriority] = useState('medium');
  const [updateCategory, setUpdateCategory] = useState('');
  const [updateLabel, setUpdateLabel] = useState('');
  const [updatePriority, setUpdatePriority] = useState('medium');
  const [listItems, setListItems] = useState([]);
  const [isUpdating, setIsUpdating] = useState(null);
  const [updateItemText, setUpdateItemText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [token, setToken] = useState(() => localStorage.getItem('api_token') || '');
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('api_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [authMode, setAuthMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('api_token', token);
      if (user) localStorage.setItem('api_user', JSON.stringify(user));
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('api_token');
      localStorage.removeItem('api_user');
    }
  }, [token, user]);

  const handleTaskAdded = (task) => {
    setListItems(prev => [task, ...prev]);
    setShowAddTask(false);
    setError(null);
  };
  const handleCancelAddTask = () => {
    setShowAddTask(false);
  };

  const deleteItem = async (id) => {
    try {
      await api.delete(`/api/item/${id}`);
      const newListItems = listItems.filter(item => item._id !== id);
      setListItems(newListItems);
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to delete item');
    }
  }

  const updateItem = async () => {
    try {
      if (!updateItemText || updateItemText.trim().length === 0) return;
      const res = await api.put(`/api/item/${isUpdating}`, {
        item: updateItemText,
        category: updateCategory,
        label: updateLabel,
        priority: updatePriority,
        deadline: updateDeadline || null,
        completed: updateCompleted
      });
      setListItems(prev => prev.map(it => it._id === isUpdating ? { ...it, ...res.data } : it));
      setUpdateItemText('');
      setUpdateCategory('');
      setUpdateLabel('');
      setUpdatePriority('medium');
      setUpdateDeadline('');
      setUpdateCompleted(false);
      setIsUpdating(null);
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update item');
    }
  }

  const cancelUpdate = () => {
    setIsUpdating(null);
    setUpdateItemText('');
    setUpdateCategory('');
    setUpdateLabel('');
    setUpdatePriority('medium');
    setUpdateDeadline('');
    setUpdateCompleted(false);
  }
  const toggleCompleted = async (id, current) => {
    try {
      const res = await api.patch(`/api/item/${id}/completed`, { completed: !current });
      setListItems(prev => prev.map(it => it._id === id ? { ...it, completed: res.data.completed } : it));
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update completed status');
    }
  }

  const goPrev = () => {
    if (page > 1) setPage(page - 1);
  }

  const goNext = () => {
    if (meta?.totalPages && page < meta.totalPages) setPage(page + 1);
  }

  useEffect(() => {
    const getItemsList = async () => {
      if (!token) {
        setListItems([]);
        setLoading(false);
        setMeta({ page: 1, limit: 10, total: 0, totalPages: 1 });
        return;
      }
      setLoading(true);
      try {
        const params = {
          page,
          limit: meta.limit
        };
        if (filterCategory) params.category = filterCategory;
        if (filterLabel) params.label = filterLabel;
        if (filterPriority) params.priority = filterPriority;
        const res = await api.get('/api/items', { params });
        if (Array.isArray(res.data)) {
            setListItems(res.data);
            setMeta({ page: 1, limit: res.data.length, total: res.data.length, totalPages: 1 });
        } else {
            setListItems(res.data.items || []);
            setMeta(res.data.meta || { page: 1, limit: 10, total: 0, totalPages: 1 });
        }
        setError(null);
      } catch (err) {
        setError(err?.response?.data?.error || 'Failed to load items');
      } finally {
        setLoading(false);
      }
    }
    getItemsList();
  }, [token, page, filterCategory, filterLabel, filterPriority]);

  const submitAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await api.post(endpoint, { username, password });
      if (res.data?.token) {
        setToken(res.data.token);
        setUser(res.data.user || null);
        setPage(1);
      }
    } catch (err) {
      setAuthError(err?.response?.data?.error || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  }

  const logout = () => {
    setToken('');
    setUser(null);
    setAuthError(null);
    setPage(1);
  }

  // If not authenticated, show dedicated auth page
  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-shell">
          <header className="hero auth-hero">
            <div>
              <p className="eyebrow">Welcome</p>
              <h1>Sign in or Register</h1>
              <p className="subtitle">Access your personal to-do list. Each account sees only its own items.</p>
            </div>
          </header>

          <section className="card auth-card">
            <div className="auth-header">
              <div>
                <p className="eyebrow">Authentication</p>
                <h2 className="section-title">{authMode === 'login' ? 'Login to continue' : 'Create your account'}</h2>
                <p className="subtitle">Your tasks are kept separate per user.</p>
              </div>
            </div>
            <div className="auth-toggle">
              <button
                type="button"
                className={`ghost-btn ${authMode === 'login' ? 'active-tab' : ''}`}
                onClick={() => setAuthMode('login')}
              >
                Login
              </button>
              <button
                type="button"
                className={`ghost-btn ${authMode === 'register' ? 'active-tab' : ''}`}
                onClick={() => setAuthMode('register')}
              >
                Register
              </button>
            </div>
            <form className="auth-form" onSubmit={submitAuth}>
              <div className="input-group">
                <label>Username</label>
                <input
                  className="text-input"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="your username"
                />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input
                  className="text-input"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="your password"
                />
              </div>
              <div className="auth-actions">
                <button className="primary-btn" type="submit" disabled={authLoading}>
                  {authLoading ? 'Submitting...' : authMode === 'login' ? 'Sign In' : 'Register'}
                </button>
              </div>
              {authError && <div className="alert alert-error">{authError}</div>}
            </form>
          </section>
        </div>
      </div>
    );
  }

  // Authenticated view
  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Plan. Track. Complete.</p>
          <h1>Your To-Do List</h1>
          <p className="subtitle">Stay organized with quick add, edit, and delete.</p>
        </div>
        <div className="auth-status">
          <span className="badge">{user?.username || 'Authenticated'}</span>
          <button className="ghost-btn" type="button" onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="content">
        <section className="card">
          <div className="filter-row">
            <input
              className="text-input"
              placeholder="Filter by category"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            />
            <input
              className="text-input"
              placeholder="Filter by label"
              value={filterLabel}
              onChange={e => setFilterLabel(e.target.value)}
            />
            <select
              className="text-input"
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button className="ghost-btn" type="button" onClick={() => {
              setFilterCategory('');
              setFilterLabel('');
              setFilterPriority('');
            }}>Clear Filters</button>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <button className="primary-btn" type="button" onClick={() => setShowAddTask(true)}>
              Add New Task
            </button>
          </div>
          {showAddTask && (
            <AddTask onTaskAdded={handleTaskAdded} onCancel={handleCancelAddTask} />
          )}

          {error && <div className="alert alert-error">{error}</div>}

          {loading && (
            <div className="loading">Loading your tasks...</div>
          )}

          {!loading && listItems.length === 0 && (
            <div className="empty-state">
              <h3>No tasks yet</h3>
              <p>Start by adding your first task above.</p>
            </div>
          )}

          {!loading && listItems.length > 0 && (
            <ul className="todo-list">
              {listItems.map(item => (
                <li key={item._id} className="todo-item">
                  {item._id === isUpdating ? (
                    <div className="todo-edit-row">
                      <input
                        className="text-input"
                        value={updateItemText}
                        onChange={e => setUpdateItemText(e.target.value)}
                      />
                      <input
                        className="text-input"
                        placeholder="Category"
                        value={updateCategory}
                        onChange={e => setUpdateCategory(e.target.value)}
                      />
                      <input
                        className="text-input"
                        placeholder="Label"
                        value={updateLabel}
                        onChange={e => setUpdateLabel(e.target.value)}
                      />
                      <select
                        className="text-input"
                        value={updatePriority}
                        onChange={e => setUpdatePriority(e.target.value)}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      <input
                        className="text-input"
                        type="datetime-local"
                        value={updateDeadline}
                        onChange={e => setUpdateDeadline(e.target.value)}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="checkbox"
                          checked={updateCompleted}
                          onChange={e => setUpdateCompleted(e.target.checked)}
                        />
                        Completed
                      </label>
                      <div className="actions">
                        <button className="primary-btn" type="button" onClick={updateItem} disabled={!updateItemText.trim()}>
                          Save
                        </button>
                        <button className="ghost-btn" type="button" onClick={cancelUpdate}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="todo-row">
                      <div>
                        <p className="todo-text">{item.item}</p>
                        <p className="todo-meta">Category: {item.category || '-'} | Label: {item.label || '-'} | Priority: {item.priority || 'medium'}</p>
                        <p className="todo-meta">Deadline: {item.deadline ? new Date(item.deadline).toLocaleString() : '-'}</p>
                        <p className="todo-meta">Notes: {item.notes || '-'}</p>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => toggleCompleted(item._id, item.completed)}
                          />
                          Completed
                        </label>
                      </div>
                      <div className="actions">
                        <button className="ghost-btn" type="button" onClick={() => {
                          setIsUpdating(item._id);
                          setUpdateItemText(item.item);
                          setUpdateCategory(item.category || '');
                          setUpdateLabel(item.label || '');
                          setUpdatePriority(item.priority || 'medium');
                          setUpdateDeadline(item.deadline ? item.deadline.slice(0, 16) : '');
                          setUpdateCompleted(!!item.completed);
                        }}>Edit</button>
                        <button className="danger-btn" type="button" onClick={() => deleteItem(item._id)}>Delete</button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {!loading && listItems.length > 0 && (
            <div className="pagination">
              <button className="ghost-btn" type="button" onClick={goPrev} disabled={page <= 1}>Prev</button>
              <span className="page-meta">Page {meta.page} of {meta.totalPages || 1}</span>
              <button className="ghost-btn" type="button" onClick={goNext} disabled={page >= (meta.totalPages || 1)}>Next</button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
