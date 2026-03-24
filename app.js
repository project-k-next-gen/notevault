'use strict';

// ============================================================================
// CUSTOM DATA STRUCTURES (DSA)
// ============================================================================

/**
 * Trie Data Structure for efficient prefix-based search
 */
class Trie {
  constructor() {
    this.root = {};
  }

  insert(word) {
    if (typeof word !== 'string' || word.trim().length === 0) return;
    const normalized = word.toLowerCase().trim();
    let node = this.root;
    for (const char of normalized) {
      if (!node[char]) node[char] = {};
      node = node[char];
    }
    node.isEnd = true;
    node.word = normalized;
  }

  search(prefix) {
    const normalized = prefix.toLowerCase().trim();
    let node = this.root;
    for (const char of normalized) {
      if (!node[char]) return [];
      node = node[char];
    }
    return this._collectWords(node, []);
  }

  _collectWords(node, results, maxResults = 100) {
    if (results.length >= maxResults) return results;
    if (node.isEnd) results.push(node.word);
    for (const key in node) {
      if (key !== 'isEnd' && key !== 'word') {
        this._collectWords(node[key], results, maxResults);
      }
    }
    return results;
  }

  clear() {
    this.root = {};
  }
}

/**
 * HashMap for O(1) lookups
 */
class HashMap {
  constructor() {
    this.map = new Map();
  }

  set(key, value) {
    this.map.set(String(key), value);
  }

  get(key) {
    return this.map.get(String(key));
  }

  has(key) {
    return this.map.has(String(key));
  }

  delete(key) {
    this.map.delete(String(key));
  }

  clear() {
    this.map.clear();
  }

  values() {
    return Array.from(this.map.values());
  }

  keys() {
    return Array.from(this.map.keys());
  }

  entries() {
    return Array.from(this.map.entries());
  }

  size() {
    return this.map.size;
  }
}

/**
 * HashSet for unique value management
 */
class HashSet {
  constructor() {
    this.set = new Set();
  }

  add(value) {
    this.set.add(String(value));
    return this;
  }

  has(value) {
    return this.set.has(String(value));
  }

  delete(value) {
    this.set.delete(String(value));
  }

  clear() {
    this.set.clear();
  }

  toArray() {
    return Array.from(this.set);
  }

  size() {
    return this.set.size;
  }
}

/**
 * Queue for FIFO operations
 */
class Queue {
  constructor() {
    this.items = [];
    this.front = 0;
  }

  enqueue(element) {
    this.items.push(element);
  }

  dequeue() {
    if (this.isEmpty()) return undefined;
    const result = this.items[this.front];
    this.front++;
    if (this.front * 2 >= this.items.length) {
      this.items = this.items.slice(this.front);
      this.front = 0;
    }
    return result;
  }

  peek() {
    return this.items[this.front];
  }

  isEmpty() {
    return this.front >= this.items.length;
  }

  size() {
    return this.items.length - this.front;
  }

  clear() {
    this.items = [];
    this.front = 0;
  }

  toArray() {
    return this.items.slice(this.front);
  }
}

/**
 * Merge Sort Algorithm for efficient sorting
 */
class MergeSort {
  static sort(array, compareFn = (a, b) => a - b) {
    if (array.length <= 1) return array;
    return MergeSort._mergeSort(array, compareFn);
  }

  static _mergeSort(array, compareFn) {
    if (array.length <= 1) return array;
    const mid = Math.floor(array.length / 2);
    const left = MergeSort._mergeSort(array.slice(0, mid), compareFn);
    const right = MergeSort._mergeSort(array.slice(mid), compareFn);
    return MergeSort._merge(left, right, compareFn);
  }

  static _merge(left, right, compareFn) {
    const result = [];
    let i = 0,
      j = 0;
    while (i < left.length && j < right.length) {
      if (compareFn(left[i], right[j]) <= 0) {
        result.push(left[i++]);
      } else {
        result.push(right[j++]);
      }
    }
    return result.concat(left.slice(i)).concat(right.slice(j));
  }
}

// ============================================================================
// INDEXED DB MANAGER
// ============================================================================

class IndexedDBManager {
  constructor(dbName = 'NoteVaultDB', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('bookmarks')) {
          db.createObjectStore('bookmarks', { keyPath: 'noteId' });
        }
        if (!db.objectStoreNames.contains('contributed')) {
          db.createObjectStore('contributed', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('recentSearches')) {
          db.createObjectStore('recentSearches', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('appSettings')) {
          db.createObjectStore('appSettings', { keyPath: 'key' });
        }
      };
    });
  }

  async saveNotes(notes) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notes'], 'readwrite');
      const objectStore = transaction.objectStore('notes');
      objectStore.clear();

      const chunkSize = 500;
      for (let i = 0; i < notes.length; i += chunkSize) {
        const chunk = notes.slice(i, i + chunkSize);
        chunk.forEach((note) => {
          try {
            objectStore.put(note);
          } catch (e) {
            console.warn('Note save error:', e);
          }
        });
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getAllNotes() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notes'], 'readonly');
      const objectStore = transaction.objectStore('notes');
      const request = objectStore.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveBookmark(noteId) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['bookmarks'], 'readwrite');
      const objectStore = transaction.objectStore('bookmarks');
      objectStore.put({ noteId, timestamp: Date.now() });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async deleteBookmark(noteId) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['bookmarks'], 'readwrite');
      const objectStore = transaction.objectStore('bookmarks');
      objectStore.delete(noteId);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getBookmarks() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['bookmarks'], 'readonly');
      const objectStore = transaction.objectStore('bookmarks');
      const request = objectStore.getAll();

      request.onsuccess = () => resolve(request.result?.map((b) => b.noteId) || []);
      request.onerror = () => reject(request.error);
    });
  }

  async isBookmarked(noteId) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['bookmarks'], 'readonly');
      const objectStore = transaction.objectStore('bookmarks');
      const request = objectStore.get(noteId);

      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveContributedNote(note) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['contributed'], 'readwrite');
      const objectStore = transaction.objectStore('contributed');
      objectStore.put({ ...note, contributedAt: Date.now() });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getContributedNotes() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['contributed'], 'readonly');
      const objectStore = transaction.objectStore('contributed');
      const request = objectStore.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async addRecentSearch(query) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['recentSearches'], 'readwrite');
      const objectStore = transaction.objectStore('recentSearches');
      objectStore.put({ query, timestamp: Date.now() });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getRecentSearches(limit = 10) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['recentSearches'], 'readonly');
      const objectStore = transaction.objectStore('recentSearches');
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        const sorted = results.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
        resolve(sorted.map((r) => r.query));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearRecentSearches() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['recentSearches'], 'readwrite');
      const objectStore = transaction.objectStore('recentSearches');
      objectStore.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async saveSetting(key, value) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['appSettings'], 'readwrite');
      const objectStore = transaction.objectStore('appSettings');
      objectStore.put({ key, value });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getSetting(key) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['appSettings'], 'readonly');
      const objectStore = transaction.objectStore('appSettings');
      const request = objectStore.get(key);

      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }
}

// ============================================================================
// FILE DOWNLOADER (Fixed Blob Race Condition)
// ============================================================================

class FileDownloader {
  static async download(content, filename, mimeType = 'application/octet-stream') {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            URL.revokeObjectURL(url);
            resolve();
          }, 100);
        });
      });
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  static async downloadJSON(data, filename) {
    const jsonContent = JSON.stringify(data, null, 2);
    await FileDownloader.download(jsonContent, filename, 'application/json');
  }

  static async downloadCSV(data, filename) {
    let csvContent = '';

    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      csvContent += headers.map((h) => `"${h}"`).join(',') + '\n';

      for (const row of data) {
        const values = headers.map((h) => {
          const value = row[h];
          return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvContent += values.join(',') + '\n';
      }
    }

    await FileDownloader.download(csvContent, filename, 'text/csv;charset=utf-8;');
  }

  static async downloadPDF(content, filename) {
    await FileDownloader.download(content, filename, 'application/pdf');
  }
}

// ============================================================================
// STATE MANAGER
// ============================================================================

class StateManager {
  constructor() {
    this.state = {
      notes: [],
      filteredNotes: [],
      displayedNotes: [],
      filters: {
        search: '',
        semester: '',
        stream: '',
        course: '',
        subject: '',
        year: '',
        author: '',
      },
      sort: {
        key: 'semester',
        direction: 'asc',
      },
      view: 'grid',
      currentTab: 'all',
      pagination: {
        pageSize: 12,
        currentPage: 1,
      },
      bookmarks: new HashSet(),
      contributed: [],
      recentSearches: [],
      ui: {
        filterPanelOpen: false,
        searchFocused: false,
        modalOpen: null,
      },
    };
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  updateFilters(filterUpdates) {
    this.state.filters = { ...this.state.filters, ...filterUpdates };
    this.state.pagination.currentPage = 1;
    this.notify();
  }

  updateSort(key, direction) {
    this.state.sort = { key, direction };
    this.state.pagination.currentPage = 1;
    this.notify();
  }

  setCurrentTab(tab) {
    this.state.currentTab = tab;
    this.state.pagination.currentPage = 1;
    this.notify();
  }

  setView(view) {
    this.state.view = view;
    this.notify();
  }

  addBookmark(noteId) {
    this.state.bookmarks.add(noteId);
    this.notify();
  }

  removeBookmark(noteId) {
    this.state.bookmarks.delete(noteId);
    this.notify();
  }

  isBookmarked(noteId) {
    return this.state.bookmarks.has(noteId);
  }

  getState() {
    return this.state;
  }
}

// ============================================================================
// FILTER ENGINE
// ============================================================================

class FilterEngine {
  constructor(notes) {
    this.originalNotes = notes;
    this.filteredNotes = notes;
  }

  apply(filters) {
    let results = [...this.originalNotes];

    if (filters.search && filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter((note) => {
        return (
          note.title?.toLowerCase().includes(searchLower) ||
          note.description?.toLowerCase().includes(searchLower) ||
          note.subject?.toLowerCase().includes(searchLower) ||
          note.topics?.some((t) => t.toLowerCase().includes(searchLower)) ||
          note.author?.toLowerCase().includes(searchLower)
        );
      });
    }

    if (filters.semester) {
      results = results.filter((note) => note.semester === filters.semester);
    }

    if (filters.stream) {
      results = results.filter((note) => note.stream === filters.stream);
    }

    if (filters.course) {
      results = results.filter((note) => note.course === filters.course);
    }

    if (filters.subject) {
      results = results.filter((note) => note.subject === filters.subject);
    }

    if (filters.year) {
      results = results.filter((note) => String(note.year) === filters.year);
    }

    if (filters.author) {
      results = results.filter((note) => note.author === filters.author);
    }

    this.filteredNotes = results;
    return results;
  }

  sort(results, sortKey, sortDirection) {
    const sorted = [...results];

    const compareFns = {
      semester: (a, b) => {
        const semA = parseInt(a.semester || 0);
        const semB = parseInt(b.semester || 0);
        return semA - semB;
      },
      course: (a, b) => String(a.course || '').localeCompare(String(b.course || '')),
      year: (a, b) => {
        const yearA = parseInt(a.year || 0);
        const yearB = parseInt(b.year || 0);
        return yearA - yearB;
      },
      title: (a, b) => String(a.title || '').localeCompare(String(b.title || '')),
      topics: (a, b) => {
        const topicsA = (a.topics || []).length;
        const topicsB = (b.topics || []).length;
        return topicsA - topicsB;
      },
    };

    const compareFn = compareFns[sortKey] || compareFns.semester;

    if (sortDirection === 'asc') {
      return MergeSort.sort(sorted, compareFn);
    } else {
      return MergeSort.sort(sorted, (a, b) => -compareFn(a, b));
    }
  }

  getFilterOptions() {
    const options = {
      semesters: new HashSet(),
      streams: new HashSet(),
      courses: new HashSet(),
      subjects: new HashSet(),
      years: new HashSet(),
      authors: new HashSet(),
    };

    this.originalNotes.forEach((note) => {
      if (note.semester) options.semesters.add(String(note.semester));
      if (note.stream) options.streams.add(note.stream);
      if (note.course) options.courses.add(note.course);
      if (note.subject) options.subjects.add(note.subject);
      if (note.year) options.years.add(String(note.year));
      if (note.author) options.authors.add(note.author);
    });

    return {
      semesters: options.semesters.toArray().sort((a, b) => parseInt(a) - parseInt(b)),
      streams: options.streams.toArray().sort(),
      courses: options.courses.toArray().sort(),
      subjects: options.subjects.toArray().sort(),
      years: options.years.toArray().sort((a, b) => parseInt(b) - parseInt(a)),
      authors: options.authors.toArray().sort(),
    };
  }
}

// ============================================================================
// SEARCH ENGINE (Trie-based)
// ============================================================================

class SearchEngine {
  constructor(notes) {
    this.trie = new Trie();
    this.notes = notes;
    this.indexMap = new HashMap();
    this.buildIndex();
  }

  buildIndex() {
    this.trie.clear();
    this.indexMap.clear();

    const seen = new Set();

    this.notes.forEach((note) => {
      if (note.title) {
        const titleTokens = this._tokenize(note.title);
        titleTokens.forEach((token) => {
          if (!seen.has(token)) {
            this.trie.insert(token);
            seen.add(token);
          }
        });
      }

      if (note.subject) {
        const subjectTokens = this._tokenize(note.subject);
        subjectTokens.forEach((token) => {
          if (!seen.has(token)) {
            this.trie.insert(token);
            seen.add(token);
          }
        });
      }

      if (note.topics && Array.isArray(note.topics)) {
        note.topics.forEach((topic) => {
          const topicTokens = this._tokenize(topic);
          topicTokens.forEach((token) => {
            if (!seen.has(token)) {
              this.trie.insert(token);
              seen.add(token);
            }
          });
        });
      }

      if (note.course) {
        const courseTokens = this._tokenize(note.course);
        courseTokens.forEach((token) => {
          if (!seen.has(token)) {
            this.trie.insert(token);
            seen.add(token);
          }
        });
      }

      if (note.stream) {
        const streamTokens = this._tokenize(note.stream);
        streamTokens.forEach((token) => {
          if (!seen.has(token)) {
            this.trie.insert(token);
            seen.add(token);
          }
        });
      }

      if (note.author) {
        const authorTokens = this._tokenize(note.author);
        authorTokens.forEach((token) => {
          if (!seen.has(token)) {
            this.trie.insert(token);
            seen.add(token);
          }
        });
      }
    });
  }

  _tokenize(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((t) => t.length > 0);
  }

  suggest(query) {
    if (!query || query.trim().length === 0) return [];
    const normalized = query.toLowerCase().trim();
    const suggestions = this.trie.search(normalized);
    return suggestions.slice(0, 8);
  }

  search(query) {
    if (!query || query.trim().length === 0) return [];
    const searchLower = query.toLowerCase();
    return this.notes.filter((note) => {
      return (
        note.title?.toLowerCase().includes(searchLower) ||
        note.description?.toLowerCase().includes(searchLower) ||
        note.subject?.toLowerCase().includes(searchLower) ||
        note.topics?.some((t) => t.toLowerCase().includes(searchLower)) ||
        note.course?.toLowerCase().includes(searchLower) ||
        note.stream?.toLowerCase().includes(searchLower) ||
        note.author?.toLowerCase().includes(searchLower)
      );
    });
  }
}

// ============================================================================
// ANIMATION CONTROLLER
// ============================================================================

class AnimationController {
  static fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease-out`;
    element.offsetHeight;
    element.style.opacity = '1';
  }

  static slideUp(element, duration = 300) {
    element.style.transform = 'translateY(20px)';
    element.style.opacity = '0';
    element.style.transition = `all ${duration}ms ease-out`;
    element.offsetHeight;
    element.style.transform = 'translateY(0)';
    element.style.opacity = '1';
  }

  static scale(element, duration = 300) {
    element.style.transform = 'scale(0.95)';
    element.style.opacity = '0';
    element.style.transition = `all ${duration}ms ease-out`;
    element.offsetHeight;
    element.style.transform = 'scale(1)';
    element.style.opacity = '1';
  }

  static pulse(element, duration = 600) {
    element.style.animation = `pulse ${duration}ms ease-in-out`;
  }
}

// ============================================================================
// UI RENDERER
// ============================================================================

class UIRenderer {
  static renderNoteCard(note, view = 'grid', isBookmarked = false) {
    const card = document.createElement('div');
    card.className = `NoteCard ${view === 'list' ? 'list-view' : ''} ${view === 'compact' ? 'compact-view' : ''}`;
    card.setAttribute('data-note-id', note.id);
    card.setAttribute('role', 'article');
    card.setAttribute('tabindex', '0');

    const accentBar = document.createElement('div');
    accentBar.className = 'NoteCard__AccentBar';

    const body = document.createElement('div');
    body.className = 'NoteCard__Body';

    const badgeRow = document.createElement('div');
    badgeRow.className = 'NoteCard__BadgeRow';

    if (note.semester) {
      const semesterBadge = document.createElement('span');
      semesterBadge.className = 'NoteCard__Badge';
      semesterBadge.textContent = `Sem ${note.semester}`;
      badgeRow.appendChild(semesterBadge);
    }

    if (note.stream) {
      const streamBadge = document.createElement('span');
      streamBadge.className = 'NoteCard__Badge';
      streamBadge.textContent = note.stream;
      badgeRow.appendChild(streamBadge);
    }

    const title = document.createElement('h3');
    title.className = 'NoteCard__Title';
    title.textContent = note.title || 'Untitled Note';

    const description = document.createElement('p');
    description.className = 'NoteCard__Description';
    description.textContent = note.description || 'No description provided.';

    const tagsRow = document.createElement('div');
    tagsRow.className = 'NoteCard__TagsRow';
    if (note.topics && Array.isArray(note.topics)) {
      note.topics.slice(0, 3).forEach((topic) => {
        const tag = document.createElement('span');
        tag.className = 'NoteCard__Tag';
        tag.textContent = topic;
        tagsRow.appendChild(tag);
      });
    }

    body.appendChild(badgeRow);
    body.appendChild(title);
    body.appendChild(description);
    body.appendChild(tagsRow);

    const footer = document.createElement('div');
    footer.className = 'NoteCard__Footer';

    const meta = document.createElement('div');
    meta.className = 'NoteCard__Meta';

    const metaRow1 = document.createElement('div');
    metaRow1.className = 'NoteCard__MetaRow';
    if (note.subject) {
      const subjectMeta = document.createElement('span');
      subjectMeta.textContent = note.subject;
      metaRow1.appendChild(subjectMeta);
    }
    if (note.course) {
      const courseMeta = document.createElement('span');
      courseMeta.textContent = note.course;
      metaRow1.appendChild(courseMeta);
    }
    meta.appendChild(metaRow1);

    const metaRow2 = document.createElement('div');
    metaRow2.className = 'NoteCard__MetaRow';
    if (note.author) {
      const authorMeta = document.createElement('span');
      authorMeta.textContent = `by ${note.author}`;
      metaRow2.appendChild(authorMeta);
    }
    if (note.year) {
      const yearMeta = document.createElement('span');
      yearMeta.textContent = `${note.year}`;
      metaRow2.appendChild(yearMeta);
    }
    meta.appendChild(metaRow2);

    const actions = document.createElement('div');
    actions.className = 'NoteCard__Actions';

    const bookmarkBtn = document.createElement('button');
    bookmarkBtn.className = `NoteCard__ActionBtn ${isBookmarked ? 'NoteCard__ActionBtn--Bookmarked' : ''}`;
    bookmarkBtn.setAttribute('aria-label', isBookmarked ? 'Remove bookmark' : 'Add bookmark');
    bookmarkBtn.setAttribute('title', isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks');
    bookmarkBtn.setAttribute('data-action', 'bookmark');
    bookmarkBtn.setAttribute('data-note-id', note.id);
    bookmarkBtn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="' +
      (isBookmarked ? 'currentColor' : 'none') +
      '" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"></path></svg>';
    actions.appendChild(bookmarkBtn);

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'NoteCard__ActionBtn';
    downloadBtn.setAttribute('aria-label', 'Download note');
    downloadBtn.setAttribute('title', 'Download PDF');
    downloadBtn.setAttribute('data-action', 'download');
    downloadBtn.setAttribute('data-note-id', note.id);
    downloadBtn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';
    actions.appendChild(downloadBtn);

    footer.appendChild(meta);
    footer.appendChild(actions);

    card.appendChild(accentBar);
    card.appendChild(body);
    card.appendChild(footer);

    return card;
  }

  static renderEmptyState() {
    const container = document.createElement('div');
    container.className = 'EmptyState';
    container.innerHTML = `
      <div class="EmptyState__Illustration">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="M21 21l-4.35-4.35"></path>
        </svg>
      </div>
      <h2 class="EmptyState__Title">No notes found</h2>
      <p class="EmptyState__Description">Try adjusting your search or filters to find notes that match your criteria.</p>
      <div class="EmptyState__Actions">
        <button class="EmptyState__PrimaryBtn" id="EmptyStateClearFiltersBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 102.13-9.36L1 10"></path></svg>
          Clear Filters
        </button>
        <button class="EmptyState__SecondaryBtn" id="EmptyStateContributeBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Contribute a Note
        </button>
      </div>
    `;
    return container;
  }

  static renderLoadMore(totalResults, displayedCount) {
    const section = document.createElement('div');
    section.className = 'LoadMoreSection';
    section.id = 'LoadMoreSection';
    section.style.display = totalResults > displayedCount ? 'flex' : 'none';
    section.innerHTML = `
      <button class="LoadMoreButton" id="LoadMoreButton" aria-label="Load more notes">
        <span class="LoadMoreButton__Spinner" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>
        </span>
        Load More
      </button>
      <p class="LoadMoreSection__Info" id="LoadMoreInfo" aria-live="polite">Showing ${displayedCount} of ${totalResults} notes</p>
    `;
    return section;
  }

  static renderToast(message, type = 'info', title = null, duration = 4000) {
    const container = document.getElementById('ToastContainer');
    const toast = document.createElement('div');
    toast.className = `Toast Toast--${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

    const icons = {
      success:
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
      error:
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
      warning:
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
    };

    toast.innerHTML = `
      <div class="Toast__Icon">${icons[type] || icons.info}</div>
      <div class="Toast__Content">
        ${title ? `<div class="Toast__Title">${title}</div>` : ''}
        <div class="Toast__Message">${message}</div>
      </div>
      <button class="Toast__CloseBtn" aria-label="Close notification">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;

    toast.querySelector('.Toast__CloseBtn').addEventListener('click', () => {
      toast.remove();
    });

    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        toast.remove();
      }, duration);
    }

    return toast;
  }
}

// ============================================================================
// NOTE VAULT APP (Main Controller)
// ============================================================================

class NoteVaultApp {
  constructor() {
    this.stateManager = new StateManager();
    this.filterEngine = null;
    this.searchEngine = null;
    this.indexedDBManager = new IndexedDBManager();
    this.notesData = [];
    this.isInitializing = true;
    this.animationFrameId = null;
  }

  async init() {
    try {
      await this.setupDOM();
      await this.loadInitialData();
      await this.indexedDBManager.init();
      await this.restoreAppState();
      this.setupEventListeners();
      this.render();
      this.hideLoadingScreen();
      this.isInitializing = false;
    } catch (error) {
      console.error('App initialization error:', error);
      UIRenderer.renderToast('Failed to load NoteVault. Please refresh the page.', 'error', 'Initialization Error');
    }
  }

  async setupDOM() {
    document.documentElement.setAttribute('data-app-initialized', 'false');
    this.dom = {
      appWrapper: document.getElementById('AppWrapper'),
      appLoadingScreen: document.getElementById('AppLoadingScreen'),
      loadingStatusText: document.getElementById('LoadingStatusText'),
      loadingProgressFill: document.getElementById('LoadingProgressFill'),
      heroHeader: document.getElementById('HeroHeader'),
      searchInput: document.getElementById('SearchInput'),
      filterToggleButton: document.getElementById('FilterToggleButton'),
      filterDropdownPanel: document.getElementById('FilterDropdownPanel'),
      closeFilterPanelBtn: document.getElementById('CloseFilterPanelBtn'),
      notesGrid: document.getElementById('NotesGrid'),
      emptyState: document.getElementById('EmptyState'),
      mainContentArea: document.getElementById('MainContentArea'),
      resultsToolbar: document.getElementById('ResultsToolbar'),
      filteredResultsCount: document.getElementById('FilteredResultsCount'),
      activeFilterChips: document.getElementById('ActiveFilterChips'),
      themeToggler: document.getElementById('ThemeToggler'),
      contributeNoteBtn: document.getElementById('ContributeNoteBtn'),
      contributeFloatingBtn: document.getElementById('ContributeFloatingBtn'),
      streamFilter: document.getElementById('StreamFilter'),
      semesterFilter: document.getElementById('SemesterFilter'),
      courseFilter: document.getElementById('CourseFilter'),
      subjectFilter: document.getElementById('SubjectFilter'),
      yearFilter: document.getElementById('YearFilter'),
      authorFilter: document.getElementById('AuthorFilter'),
      resetAllFiltersBtn: document.getElementById('ResetAllFiltersBtn'),
      loadMoreButton: document.getElementById('LoadMoreButton'),
      loadMoreSection: document.getElementById('LoadMoreSection'),
      loadMoreInfo: document.getElementById('LoadMoreInfo'),
      viewSwitcherButtons: document.querySelectorAll('.ViewSwitcher__Button'),
      sortButtons: document.querySelectorAll('.SortButton'),
      tabButtons: document.querySelectorAll('.TabButton'),
      scrollProgressBar: document.getElementById('ScrollProgressBar'),
      statsRow: document.getElementById('StatsRow'),
      streamPillsRow: document.getElementById('StreamPillsRow'),
      skeletonLoaderGrid: document.getElementById('SkeletonLoaderGrid'),
      searchSuggestionsPanel: document.getElementById('SearchSuggestionsPanel'),
      recentSearchesPanel: document.getElementById('RecentSearchesPanel'),
      recentSearchesList: document.getElementById('RecentSearchesList'),
      clearSearchBtn: document.getElementById('ClearSearchBtn'),
      clearAllRecentSearches: document.getElementById('ClearAllRecentSearches'),
      searchBoxActions: document.getElementById('SearchBoxActions'),
      announcementBanner: document.getElementById('AnnouncementBanner'),
      dismissAnnouncementBtn: document.getElementById('DismissAnnouncementBtn'),
      appSettingsOpener: document.getElementById('AppSettingsOpener'),
      keyboardShortcutsOpener: document.getElementById('KeyboardShortcutsOpener'),
      exportResultsButton: document.getElementById('ExportResultsButton'),
      shareResultsButton: document.getElementById('ShareResultsButton'),
    };
  }

  async loadInitialData() {
    return new Promise((resolve) => {
      this.updateLoadingProgress('Loading notes database...', 25);

      setTimeout(() => {
        const sampleNotes = this.generateSampleNotes();
        this.notesData = sampleNotes;
        this.stateManager.state.notes = sampleNotes;

        this.filterEngine = new FilterEngine(sampleNotes);
        this.searchEngine = new SearchEngine(sampleNotes);

        this.updateLoadingProgress('Indexing search engine...', 50);

        setTimeout(() => {
          this.updateLoadingProgress('Building filter options...', 75);

          setTimeout(() => {
            this.updateLoadingProgress('Preparing interface...', 95);
            resolve();
          }, 200);
        }, 200);
      }, 300);
    });
  }

  generateSampleNotes() {
    const streams = ['Engineering', 'Science', 'Commerce', 'Arts', 'Medical'];
    const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];
    const subjects = {
      Engineering: [
        'Data Structures',
        'Database Management',
        'Operating Systems',
        'Web Development',
        'Machine Learning',
        'Cloud Computing',
      ],
      Science: ['Chemistry', 'Physics', 'Biology', 'Mathematics', 'Botany', 'Zoology'],
      Commerce: ['Accounting', 'Economics', 'Business Law', 'Finance', 'Management', 'Marketing'],
      Arts: ['History', 'Literature', 'Philosophy', 'Psychology', 'Political Science', 'Sociology'],
      Medical: ['Anatomy', 'Physiology', 'Pathology', 'Pharmacology', 'Microbiology', 'Biochemistry'],
    };

    const notes = [];
    const authors = ['Dr. Smith', 'Prof. Johnson', 'Ms. Williams', 'Mr. Brown', 'Dr. Davis'];
    let id = 1;

    streams.forEach((stream) => {
      const streamSubjects = subjects[stream];
      semesters.forEach((semester) => {
        streamSubjects.forEach((subject, idx) => {
          const courses = ['CS101', 'CS201', 'CS301', 'PHY101', 'CHM101', 'ACC101', 'HIS101', 'MED101'];

          for (let i = 0; i < 2; i++) {
            notes.push({
              id: String(id++),
              title: `${subject} - ${stream} Notes Semester ${semester}`,
              description: `Complete notes covering ${subject} syllabus for ${stream} stream. Includes examples, diagrams, and practice problems.`,
              subject: subject,
              stream: stream,
              semester: semester,
              course: courses[idx % courses.length],
              topics: [subject.split(' ')[0], stream, `Sem${semester}`],
              author: authors[Math.floor(Math.random() * authors.length)],
              year: 2025 - Math.floor(Math.random() * 3),
              file: null,
              fileSize: Math.floor(Math.random() * 500) + 100,
              downloads: Math.floor(Math.random() * 1000),
              rating: (Math.random() * 5).toFixed(1),
              createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            });
          }
        });
      });
    });

    return notes;
  }

  async restoreAppState() {
    try {
      const savedTheme = await this.indexedDBManager.getSetting('theme');
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
      }

      const savedView = await this.indexedDBManager.getSetting('view');
      if (savedView) {
        this.stateManager.state.view = savedView;
      }

      const bookmarks = await this.indexedDBManager.getBookmarks();
      bookmarks.forEach((id) => this.stateManager.addBookmark(id));

      const recentSearches = await this.indexedDBManager.getRecentSearches(5);
      this.stateManager.state.recentSearches = recentSearches;
    } catch (error) {
      console.warn('State restoration error:', error);
    }
  }

  setupEventListeners() {
    this.dom.searchInput.addEventListener('input', (e) => this.handleSearch(e));
    this.dom.searchInput.addEventListener('focus', () => this.showRecentSearches());
    this.dom.searchInput.addEventListener('blur', () => setTimeout(() => this.hideSearchPanels(), 200));
    this.dom.searchInput.addEventListener('keydown', (e) => this.handleSearchKeydown(e));

    this.dom.clearSearchBtn.addEventListener('click', () => this.clearSearch());

    this.dom.filterToggleButton.addEventListener('click', () => this.toggleFilterPanel());
    this.dom.closeFilterPanelBtn.addEventListener('click', () => this.toggleFilterPanel());

    this.dom.semesterFilter.addEventListener('change', (e) => this.handleFilterChange('semester', e.target.value));
    this.dom.streamFilter.addEventListener('change', (e) => this.handleFilterChange('stream', e.target.value));
    this.dom.courseFilter.addEventListener('change', (e) => this.handleFilterChange('course', e.target.value));
    this.dom.subjectFilter.addEventListener('change', (e) => this.handleFilterChange('subject', e.target.value));
    this.dom.yearFilter.addEventListener('change', (e) => this.handleFilterChange('year', e.target.value));
    this.dom.authorFilter.addEventListener('change', (e) => this.handleFilterChange('author', e.target.value));

    this.dom.resetAllFiltersBtn.addEventListener('click', () => this.resetAllFilters());

    this.dom.sortButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const sortKey = e.currentTarget.getAttribute('data-sort-key');
        const currentSort = this.stateManager.state.sort;
        const newDirection =
          currentSort.key === sortKey && currentSort.direction === 'asc' ? 'desc' : 'asc';
        this.stateManager.updateSort(sortKey, newDirection);
        this.applyFiltersAndSort();
      });
    });

    this.dom.viewSwitcherButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const viewMode = e.currentTarget.getAttribute('data-view-mode');
        this.stateManager.setView(viewMode);
        this.updateViewSwitcher(viewMode);
        this.renderNotes();
      });
    });

    this.dom.tabButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tabName = e.currentTarget.getAttribute('data-tab-name');
        this.stateManager.setCurrentTab(tabName);
        this.updateTabButtons(tabName);
        this.applyFiltersAndSort();
      });
    });

    this.dom.notesGrid.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const action = actionBtn.getAttribute('data-action');
        const noteId = actionBtn.getAttribute('data-note-id');
        if (action === 'bookmark') this.handleBookmark(noteId);
        if (action === 'download') this.handleDownload(noteId);
      }
    });

    if (this.dom.loadMoreButton) {
      this.dom.loadMoreButton.addEventListener('click', () => this.loadMore());
    }

    this.dom.themeToggler.addEventListener('click', () => this.toggleTheme());

    this.dom.contributeNoteBtn.addEventListener('click', () => this.openContributeModal());
    this.dom.contributeFloatingBtn.addEventListener('click', () => this.openContributeModal());

    this.dom.exportResultsButton.addEventListener('click', () => this.exportResults());
    this.dom.shareResultsButton.addEventListener('click', () => this.shareResults());

    this.dom.dismissAnnouncementBtn.addEventListener('click', () => {
      this.dom.announcementBanner.style.display = 'none';
      this.indexedDBManager.saveSetting('dismissedAnnouncement', 'v1');
    });

    this.dom.appSettingsOpener.addEventListener('click', () => this.openSettingsModal());
    this.dom.keyboardShortcutsOpener.addEventListener('click', () => this.openShortcutsModal());

    document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));
    window.addEventListener('scroll', () => this.updateScrollProgressBar());

    const streamPills = document.querySelectorAll('.StreamPill');
    streamPills.forEach((pill) => {
      pill.addEventListener('click', (e) => {
        const streamValue = pill.getAttribute('data-stream-value');
        this.handleFilterChange('stream', streamValue);
      });
    });

    this.dom.clearAllRecentSearches.addEventListener('click', async () => {
      await this.indexedDBManager.clearRecentSearches();
      this.stateManager.state.recentSearches = [];
      this.renderRecentSearches();
    });
  }

  handleSearch(e) {
    const query = e.target.value;
    this.stateManager.updateFilters({ search: query });

    if (query.trim().length > 0) {
      this.showSearchSuggestions(query);
    } else {
      this.hideSearchPanels();
      this.showRecentSearches();
    }

    this.applyFiltersAndSort();
  }

  handleSearchKeydown(e) {
    if (e.key === 'Escape') {
      this.clearSearch();
      this.hideSearchPanels();
    } else if (e.key === 'Enter') {
      const query = e.target.value.trim();
      if (query.length > 0) {
        this.indexedDBManager.addRecentSearch(query);
        this.stateManager.state.recentSearches.unshift(query);
        if (this.stateManager.state.recentSearches.length > 10) {
          this.stateManager.state.recentSearches.pop();
        }
      }
      this.hideSearchPanels();
    }
  }

  showSearchSuggestions(query) {
    const suggestions = this.searchEngine.suggest(query);
    const panel = this.dom.searchSuggestionsPanel;
    panel.innerHTML = '';

    if (suggestions.length === 0) {
      panel.style.display = 'none';
      return;
    }

    suggestions.forEach((suggestion, index) => {
      const item = document.createElement('div');
      item.className = 'SearchSuggestionItem';
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      item.innerHTML = `
        <span class="SearchSuggestionItem__Icon">🔍</span>
        <span class="SearchSuggestionItem__Text">${suggestion}</span>
      `;
      item.addEventListener('click', () => {
        this.dom.searchInput.value = suggestion;
        this.stateManager.updateFilters({ search: suggestion });
        this.applyFiltersAndSort();
        this.hideSearchPanels();
        this.indexedDBManager.addRecentSearch(suggestion);
      });
      panel.appendChild(item);
    });

    panel.style.display = 'block';
  }

  showRecentSearches() {
    if (this.stateManager.state.recentSearches.length === 0) {
      this.dom.recentSearchesPanel.style.display = 'none';
      return;
    }

    this.renderRecentSearches();
    this.dom.recentSearchesPanel.style.display = 'block';
    this.dom.searchSuggestionsPanel.style.display = 'none';
  }

  renderRecentSearches() {
    const list = this.dom.recentSearchesList;
    list.innerHTML = '';

    this.stateManager.state.recentSearches.forEach((query) => {
      const item = document.createElement('div');
      item.className = 'RecentSearchItem';
      item.innerHTML = `
        <span class="RecentSearchItem__Text">${query}</span>
        <button class="RecentSearchItem__RemoveBtn" aria-label="Remove search" title="Remove">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      `;
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.RecentSearchItem__RemoveBtn')) {
          this.dom.searchInput.value = query;
          this.stateManager.updateFilters({ search: query });
          this.applyFiltersAndSort();
          this.hideSearchPanels();
        }
      });
      item.querySelector('.RecentSearchItem__RemoveBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.stateManager.state.recentSearches = this.stateManager.state.recentSearches.filter((q) => q !== query);
        this.renderRecentSearches();
      });
      list.appendChild(item);
    });
  }

  hideSearchPanels() {
    this.dom.searchSuggestionsPanel.style.display = 'none';
    this.dom.recentSearchesPanel.style.display = 'none';
  }

  clearSearch() {
    this.dom.searchInput.value = '';
    this.stateManager.updateFilters({ search: '' });
    this.applyFiltersAndSort();
  }

  handleFilterChange(filterKey, value) {
    this.stateManager.updateFilters({ [filterKey]: value });
    this.updateFilterDropdown(filterKey, value);
    this.applyFiltersAndSort();
  }

  updateFilterDropdown(filterKey, value) {
    const filterSelector = {
      semester: 'semesterFilter',
      stream: 'streamFilter',
      course: 'courseFilter',
      subject: 'subjectFilter',
      year: 'yearFilter',
      author: 'authorFilter',
    };

    const selector = filterSelector[filterKey];
    if (selector && this.dom[selector]) {
      this.dom[selector].value = value;
    }

    if (filterKey === 'stream') {
      const streamPills = document.querySelectorAll('.StreamPill');
      streamPills.forEach((pill) => {
        const pillValue = pill.getAttribute('data-stream-value');
        if (pillValue === value) {
          pill.classList.add('StreamPill--Active');
          pill.setAttribute('aria-pressed', 'true');
        } else {
          pill.classList.remove('StreamPill--Active');
          pill.setAttribute('aria-pressed', 'false');
        }
      });
    }
  }

  resetAllFilters() {
    this.stateManager.updateFilters({
      search: '',
      semester: '',
      stream: '',
      course: '',
      subject: '',
      year: '',
      author: '',
    });
    this.stateManager.updateSort('semester', 'asc');

    this.dom.searchInput.value = '';
    this.dom.semesterFilter.value = '';
    this.dom.streamFilter.value = '';
    this.dom.courseFilter.value = '';
    this.dom.subjectFilter.value = '';
    this.dom.yearFilter.value = '';
    this.dom.authorFilter.value = '';

    this.applyFiltersAndSort();
  }

  toggleFilterPanel() {
    const isOpen = this.dom.filterDropdownPanel.getAttribute('aria-hidden') === 'false';
    this.dom.filterDropdownPanel.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
    this.dom.filterToggleButton.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
  }

  applyFiltersAndSort() {
    const state = this.stateManager.getState();
    let filtered = this.filterEngine.apply(state.filters);

    if (state.currentTab === 'bookmarks') {
      filtered = filtered.filter((note) => state.bookmarks.has(note.id));
    } else if (state.currentTab === 'contributed') {
      filtered = filtered.filter((note) => state.contributed.some((c) => c.id === note.id));
    } else if (state.currentTab === 'recent') {
      filtered = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50);
    }

    const sorted = this.filterEngine.sort(filtered, state.sort.key, state.sort.direction);

    this.stateManager.setState({
      filteredNotes: sorted,
      displayedNotes: sorted.slice(0, state.pagination.pageSize),
      pagination: { ...state.pagination, currentPage: 1 },
    });

    this.updateFilterUI();
    this.renderNotes();
  }

  updateFilterUI() {
    const state = this.stateManager.getState();
    const activeFilters = Object.entries(state.filters)
      .filter(([_, value]) => value && value.trim() !== '')
      .map(([key]) => key);

    const badge = this.dom.filterToggleButton.querySelector('.FilterToggleButton__Badge');
    badge.setAttribute('data-count', activeFilters.length);

    const chipsContainer = this.dom.activeFilterChips;
    chipsContainer.innerHTML = '';

    activeFilters.forEach((key) => {
      const value = state.filters[key];
      const chip = document.createElement('div');
      chip.className = 'FilterChip';
      chip.innerHTML = `
        <span>${key}: ${value}</span>
        <button class="FilterChip__RemoveBtn" data-filter-key="${key}" aria-label="Remove filter">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      `;
      chip.querySelector('.FilterChip__RemoveBtn').addEventListener('click', () => {
        this.handleFilterChange(key, '');
      });
      chipsContainer.appendChild(chip);
    });

    const resultCount = state.filteredNotes.length;
    this.dom.filteredResultsCount.textContent = `${resultCount} result${resultCount !== 1 ? 's' : ''} found`;
  }

  updateViewSwitcher(viewMode) {
    this.dom.viewSwitcherButtons.forEach((btn) => {
      if (btn.getAttribute('data-view-mode') === viewMode) {
        btn.classList.add('ViewSwitcher__Button--Active');
        btn.setAttribute('aria-checked', 'true');
      } else {
        btn.classList.remove('ViewSwitcher__Button--Active');
        btn.setAttribute('aria-checked', 'false');
      }
    });
  }

  updateTabButtons(tabName) {
    this.dom.tabButtons.forEach((btn) => {
      if (btn.getAttribute('data-tab-name') === tabName) {
        btn.setAttribute('aria-selected', 'true');
        btn.classList.add('TabButton--Active');
        btn.setAttribute('tabindex', '0');
      } else {
        btn.setAttribute('aria-selected', 'false');
        btn.classList.remove('TabButton--Active');
        btn.setAttribute('tabindex', '-1');
      }
    });
  }

  async handleBookmark(noteId) {
    const state = this.stateManager.getState();
    const isBookmarked = state.bookmarks.has(noteId);

    try {
      if (isBookmarked) {
        this.stateManager.removeBookmark(noteId);
        await this.indexedDBManager.deleteBookmark(noteId);
        UIRenderer.renderToast('Bookmark removed', 'info');
      } else {
        this.stateManager.addBookmark(noteId);
        await this.indexedDBManager.saveBookmark(noteId);
        UIRenderer.renderToast('Note bookmarked!', 'success');
      }
      this.renderNotes();
    } catch (error) {
      UIRenderer.renderToast('Failed to update bookmark', 'error');
      console.error('Bookmark error:', error);
    }
  }

  async handleDownload(noteId) {
    try {
      const note = this.stateManager.state.notes.find((n) => n.id === noteId);
      if (!note) return;

      const content = `
${note.title}
=====================================

Stream: ${note.stream}
Semester: ${note.semester}
Subject: ${note.subject}
Course: ${note.course}
Author: ${note.author}
Year: ${note.year}

Topics: ${note.topics?.join(', ') || 'N/A'}

Description:
${note.description}

---
Downloaded from NoteVault
Developed by project-k-next-gen (project-k)
${new Date().toLocaleString()}
`;

      await FileDownloader.download(content, `${note.title.replace(/\s+/g, '_')}.txt`, 'text/plain;charset=utf-8;');
      UIRenderer.renderToast(`Downloaded: ${note.title}`, 'success');
    } catch (error) {
      UIRenderer.renderToast('Download failed. Please try again.', 'error');
      console.error('Download error:', error);
    }
  }

  async exportResults() {
    try {
      const state = this.stateManager.getState();
      const notesToExport = state.displayedNotes.map((note) => ({
        Title: note.title,
        Subject: note.subject,
        Stream: note.stream,
        Semester: note.semester,
        Course: note.course,
        Author: note.author,
        Year: note.year,
        Topics: note.topics?.join('; ') || '',
        Description: note.description,
      }));

      await FileDownloader.downloadCSV(notesToExport, 'notevault_export.csv');
      UIRenderer.renderToast('Results exported successfully!', 'success');
    } catch (error) {
      UIRenderer.renderToast('Export failed', 'error');
      console.error('Export error:', error);
    }
  }

  async shareResults() {
    try {
      const state = this.stateManager.getState();
      const query = new URLSearchParams({
        search: state.filters.search,
        stream: state.filters.stream,
        semester: state.filters.semester,
      }).toString();

      const shareUrl = `${window.location.origin}${window.location.pathname}?${query}`;

      if (navigator.share) {
        await navigator.share({
          title: 'NoteVault Search Results',
          text: `Check out these study notes on NoteVault (by project-k-next-gen)`,
          url: shareUrl,
        });
        UIRenderer.renderToast('Shared successfully!', 'success');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        UIRenderer.renderToast('Link copied to clipboard!', 'success');
      }
    } catch (error) {
      console.warn('Share error:', error);
    }
  }

  renderNotes() {
    const state = this.stateManager.getState();

    if (state.displayedNotes.length === 0) {
      this.dom.notesGrid.innerHTML = '';
      this.dom.emptyState.style.display = 'flex';
      this.dom.loadMoreSection.style.display = 'none';

      const clearBtn = this.dom.emptyState.querySelector('#EmptyStateClearFiltersBtn');
      const contributeBtn = this.dom.emptyState.querySelector('#EmptyStateContributeBtn');

      if (clearBtn) {
        clearBtn.addEventListener('click', () => this.resetAllFilters());
      }
      if (contributeBtn) {
        contributeBtn.addEventListener('click', () => this.openContributeModal());
      }
      return;
    }

    this.dom.emptyState.style.display = 'none';

    const fragment = document.createDocumentFragment();

    state.displayedNotes.forEach((note) => {
      const isBookmarked = state.bookmarks.has(note.id);
      const card = UIRenderer.renderNoteCard(note, state.view, isBookmarked);
      fragment.appendChild(card);
    });

    this.dom.notesGrid.innerHTML = '';
    this.dom.notesGrid.appendChild(fragment);

    const showLoadMore =
      state.filteredNotes.length > state.displayedNotes.length;
    this.dom.loadMoreSection.style.display = showLoadMore ? 'flex' : 'none';

    if (showLoadMore && this.dom.loadMoreInfo) {
      this.dom.loadMoreInfo.textContent = `Showing ${state.displayedNotes.length} of ${state.filteredNotes.length} notes`;
    }

    AnimationController.slideUp(this.dom.notesGrid, 300);
  }

  loadMore() {
    const state = this.stateManager.getState();
    const newPageSize = state.pagination.pageSize + 12;
    const newDisplayedNotes = state.filteredNotes.slice(0, newPageSize);

    this.stateManager.setState({
      displayedNotes: newDisplayedNotes,
      pagination: { ...state.pagination, pageSize: newPageSize },
    });

    this.renderNotes();
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    this.indexedDBManager.saveSetting('theme', newTheme);

    const darkIcon = this.dom.themeToggler.querySelector('.ThemeToggler__DarkIcon');
    const lightIcon = this.dom.themeToggler.querySelector('.ThemeToggler__LightIcon');

    if (newTheme === 'dark') {
      darkIcon.style.display = 'none';
      lightIcon.style.display = 'flex';
      this.dom.themeToggler.setAttribute('aria-checked', 'true');
    } else {
      darkIcon.style.display = 'flex';
      lightIcon.style.display = 'none';
      this.dom.themeToggler.setAttribute('aria-checked', 'false');
    }

    UIRenderer.renderToast(`Switched to ${newTheme} mode`, 'info');
  }

  openContributeModal() {
    const modal = document.createElement('div');
    modal.className = 'ModalBackdrop';
    modal.innerHTML = `
      <div class="Modal">
        <div class="Modal__Content ContributeModal">
          <div class="Modal__Header">
            <h2 class="Modal__Title">Contribute a Note</h2>
            <button class="Modal__CloseBtn" aria-label="Close modal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="Modal__Body">
            <form class="ContributeForm" id="ContributeForm">
              <div class="FormGroup">
                <label class="FormGroup__Label">Note Title *</label>
                <input type="text" class="FormGroup__Input" id="ContributeTitle" placeholder="e.g., Data Structures - Sorting Algorithms" maxlength="200" required>
                <span class="FormGroup__Helper">Enter a descriptive title for your note</span>
              </div>

              <div class="FormGroup">
                <label class="FormGroup__Label">Stream *</label>
                <select class="FormGroup__Select" id="ContributeStream" required>
                  <option value="">Select a stream</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Science">Science</option>
                  <option value="Commerce">Commerce</option>
                  <option value="Arts">Arts</option>
                  <option value="Medical">Medical</option>
                </select>
              </div>

              <div class="FormGroup">
                <label class="FormGroup__Label">Semester *</label>
                <select class="FormGroup__Select" id="ContributeSemester" required>
                  <option value="">Select a semester</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                  <option value="5">Semester 5</option>
                  <option value="6">Semester 6</option>
                  <option value="7">Semester 7</option>
                  <option value="8">Semester 8</option>
                </select>
              </div>

              <div class="FormGroup">
                <label class="FormGroup__Label">Subject *</label>
                <input type="text" class="FormGroup__Input" id="ContributeSubject" placeholder="e.g., Data Structures" maxlength="100" required>
              </div>

              <div class="FormGroup">
                <label class="FormGroup__Label">Course Code</label>
                <input type="text" class="FormGroup__Input" id="ContributeCourse" placeholder="e.g., CS101" maxlength="50">
              </div>

              <div class="FormGroup">
                <label class="FormGroup__Label">Topics (comma-separated)</label>
                <input type="text" class="FormGroup__Input" id="ContributeTopics" placeholder="e.g., Arrays, Linked Lists, Sorting" maxlength="200">
              </div>

              <div class="FormGroup">
                <label class="FormGroup__Label">Year *</label>
                <select class="FormGroup__Select" id="ContributeYear" required>
                  <option value="">Select a year</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                </select>
              </div>

              <div class="FormGroup">
                <label class="FormGroup__Label">Author Name *</label>
                <input type="text" class="FormGroup__Input" id="ContributeAuthor" placeholder="Your name" maxlength="100" required>
              </div>

              <div class="FormGroup">
                <label class="FormGroup__Label">Description</label>
                <textarea class="FormGroup__Textarea" id="ContributeDescription" placeholder="Describe what's covered in these notes..." maxlength="500"></textarea>
              </div>

              <div class="FileUploadZone" id="FileUploadZone">
                <div class="FileUploadZone__Icon">📄</div>
                <div class="FileUploadZone__Text">
                  <div class="FileUploadZone__Title">Drag & drop your file or click to browse</div>
                  <div class="FileUploadZone__Subtitle">Supported: PDF, DOC, TXT (Max 10MB)</div>
                </div>
                <input type="file" id="ContributeFile" accept=".pdf,.doc,.docx,.txt" />
              </div>
            </form>
          </div>
          <div class="Modal__Footer">
            <button class="EmptyState__SecondaryBtn" id="ContributeCancelBtn">Cancel</button>
            <button class="EmptyState__PrimaryBtn" id="ContributeSubmitBtn">Submit Note</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.Modal__CloseBtn');
    const cancelBtn = modal.querySelector('#ContributeCancelBtn');
    const submitBtn = modal.querySelector('#ContributeSubmitBtn');
    const fileUploadZone = modal.querySelector('#FileUploadZone');
    const fileInput = modal.querySelector('#ContributeFile');

    const closeModal = () => {
      modal.remove();
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    fileUploadZone.addEventListener('click', () => fileInput.click());
    fileUploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileUploadZone.style.borderColor = 'var(--primary)';
      fileUploadZone.style.background = 'rgba(108, 99, 255, 0.05)';
    });
    fileUploadZone.addEventListener('dragleave', () => {
      fileUploadZone.style.borderColor = '';
      fileUploadZone.style.background = '';
    });
    fileUploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      fileUploadZone.style.borderColor = '';
      fileUploadZone.style.background = '';
      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
      }
    });

    submitBtn.addEventListener('click', async () => {
      const form = modal.querySelector('#ContributeForm');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const newNote = {
        id: String(this.notesData.length + 1),
        title: modal.querySelector('#ContributeTitle').value,
        description: modal.querySelector('#ContributeDescription').value || 'Contributed note',
        stream: modal.querySelector('#ContributeStream').value,
        semester: modal.querySelector('#ContributeSemester').value,
        subject: modal.querySelector('#ContributeSubject').value,
        course: modal.querySelector('#ContributeCourse').value || 'General',
        topics: modal
          .querySelector('#ContributeTopics')
          .value.split(',')
          .map((t) => t.trim())
          .filter((t) => t),
        author: modal.querySelector('#ContributeAuthor').value,
        year: modal.querySelector('#ContributeYear').value,
        createdAt: new Date(),
        downloads: 0,
        rating: 0,
      };

      try {
        await this.indexedDBManager.saveContributedNote(newNote);
        this.notesData.push(newNote);
        this.stateManager.state.notes.push(newNote);
        this.stateManager.state.contributed.push(newNote);

        this.filterEngine = new FilterEngine(this.notesData);
        this.searchEngine = new SearchEngine(this.notesData);

        this.applyFiltersAndSort();
        closeModal();

        UIRenderer.renderToast('Thank you for contributing!', 'success', 'Note Published');
      } catch (error) {
        UIRenderer.renderToast('Failed to save your note', 'error');
        console.error('Contribution error:', error);
      }
    });
  }

  openSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'ModalBackdrop';
    modal.innerHTML = `
      <div class="Modal">
        <div class="Modal__Content SettingsModal">
          <div class="Modal__Header">
            <h2 class="Modal__Title">⚙️ Settings</h2>
            <button class="Modal__CloseBtn" aria-label="Close modal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="Modal__Body">
            <div class="SettingsTabs">
              <button class="SettingsTab SettingsTab--Active" data-tab="general">General</button>
              <button class="SettingsTab" data-tab="display">Display</button>
              <button class="SettingsTab" data-tab="about">About</button>
            </div>

            <div class="SettingsPanel SettingsPanel--Active" data-panel="general">
              <div class="SettingItem">
                <div class="SettingItem__Label">
                  <div class="SettingItem__Title">Auto-save Bookmarks</div>
                  <div class="SettingItem__Description">Automatically save your bookmarks to local storage</div>
                </div>
                <label class="ToggleSwitch">
                  <input type="checkbox" id="AutosaveBookmarks" checked>
                  <span class="ToggleSwitchSlider"></span>
                </label>
              </div>

              <div class="SettingItem">
                <div class="SettingItem__Label">
                  <div class="SettingItem__Title">Search Suggestions</div>
                  <div class="SettingItem__Description">Show search suggestions as you type</div>
                </div>
                <label class="ToggleSwitch">
                  <input type="checkbox" id="SearchSuggestions" checked>
                  <span class="ToggleSwitchSlider"></span>
                </label>
              </div>

              <div class="SettingItem">
                <div class="SettingItem__Label">
                  <div class="SettingItem__Title">Recent Searches</div>
                  <div class="SettingItem__Description">Save recent searches for quick access</div>
                </div>
                <label class="ToggleSwitch">
                  <input type="checkbox" id="RecentSearchesToggle" checked>
                  <span class="ToggleSwitchSlider"></span>
                </label>
              </div>
            </div>

            <div class="SettingsPanel" data-panel="display">
              <div class="SettingItem">
                <div class="SettingItem__Label">
                  <div class="SettingItem__Title">Dark Mode</div>
                  <div class="SettingItem__Description">Use dark theme for comfortable viewing</div>
                </div>
                <label class="ToggleSwitch">
                  <input type="checkbox" id="DarkModeToggle">
                  <span class="ToggleSwitchSlider"></span>
                </label>
              </div>

              <div class="SettingItem">
                <div class="SettingItem__Label">
                  <div class="SettingItem__Title">Animations</div>
                  <div class="SettingItem__Description">Enable smooth animations and transitions</div>
                </div>
                <label class="ToggleSwitch">
                  <input type="checkbox" id="AnimationsToggle" checked>
                  <span class="ToggleSwitchSlider"></span>
                </label>
              </div>

              <div class="SettingItem">
                <div class="SettingItem__Label">
                  <div class="SettingItem__Title">Compact Mode</div>
                  <div class="SettingItem__Description">Show more notes per page in a compact view</div>
                </div>
                <label class="ToggleSwitch">
                  <input type="checkbox" id="CompactModeToggle">
                  <span class="ToggleSwitchSlider"></span>
                </label>
              </div>
            </div>

            <div class="SettingsPanel" data-panel="about">
              <div class="SettingItem">
                <div class="SettingItem__Label">
                  <div class="SettingItem__Title">NoteVault</div>
                  <div class="SettingItem__Description">v1.0.0 • Developed by project-k-next-gen (project-k)</div>
                </div>
              </div>

              <div class="SettingItem">
                <div class="SettingItem__Label">
                  <div class="SettingItem__Title">Storage Usage</div>
                  <div class="SettingItem__Description" id="StorageInfo">Calculating...</div>
                </div>
              </div>

              <div class="SettingItem">
                <div class="SettingItem__Label">
                  <div class="SettingItem__Title">Database</div>
                  <div class="SettingItem__Description">IndexedDB • Local Storage</div>
                </div>
              </div>
            </div>
          </div>
          <div class="Modal__Footer">
            <button class="EmptyState__SecondaryBtn" id="SettingsCloseBtn">Close</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.Modal__CloseBtn');
    const settingsCloseBtn = modal.querySelector('#SettingsCloseBtn');
    const settingsTabs = modal.querySelectorAll('.SettingsTab');
    const darkModeToggle = modal.querySelector('#DarkModeToggle');

    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
      darkModeToggle.checked = true;
    }

    const closeModal = () => modal.remove();

    closeBtn.addEventListener('click', closeModal);
    settingsCloseBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    settingsTabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const tabName = e.currentTarget.getAttribute('data-tab');
        modal.querySelectorAll('.SettingsTab').forEach((t) => {
          t.classList.remove('SettingsTab--Active');
        });
        modal.querySelectorAll('.SettingsPanel').forEach((p) => {
          p.classList.remove('SettingsPanel--Active');
        });
        e.currentTarget.classList.add('SettingsTab--Active');
        modal.querySelector(`[data-panel="${tabName}"]`).classList.add('SettingsPanel--Active');
      });
    });

    darkModeToggle.addEventListener('change', () => {
      this.toggleTheme();
    });
  }

  openShortcutsModal() {
    const modal = document.createElement('div');
    modal.className = 'ModalBackdrop';
    modal.innerHTML = `
      <div class="Modal">
        <div class="Modal__Content ShortcutsModal">
          <div class="Modal__Header">
            <h2 class="Modal__Title">⌨️ Keyboard Shortcuts</h2>
            <button class="Modal__CloseBtn" aria-label="Close modal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="Modal__Body">
            <div class="ShortcutsGrid">
              <div class="ShortcutItem">
                <div class="ShortcutItem__Keys">
                  <span class="ShortcutKey">/</span>
                </div>
                <div class="ShortcutItem__Description">
                  <div class="ShortcutItem__Title">Focus Search</div>
                  <div>Jump to search bar quickly</div>
                </div>
              </div>

              <div class="ShortcutItem">
                <div class="ShortcutItem__Keys">
                  <span class="ShortcutKey">?</span>
                </div>
                <div class="ShortcutItem__Description">
                  <div class="ShortcutItem__Title">Show Shortcuts</div>
                  <div>Open this shortcuts modal</div>
                </div>
              </div>

              <div class="ShortcutItem">
                <div class="ShortcutItem__Keys">
                  <span class="ShortcutKey">T</span>
                </div>
                <div class="ShortcutItem__Description">
                  <div class="ShortcutItem__Title">Toggle Theme</div>
                  <div>Switch between light and dark mode</div>
                </div>
              </div>

              <div class="ShortcutItem">
                <div class="ShortcutItem__Keys">
                  <span class="ShortcutKey">F</span>
                </div>
                <div class="ShortcutItem__Description">
                  <div class="ShortcutItem__Title">Open Filters</div>
                  <div>Show the filter panel</div>
                </div>
              </div>

              <div class="ShortcutItem">
                <div class="ShortcutItem__Keys">
                  <span class="ShortcutKey">+</span>
                </div>
                <div class="ShortcutItem__Description">
                  <div class="ShortcutItem__Title">Add Note</div>
                  <div>Open contribute modal</div>
                </div>
              </div>

              <div class="ShortcutItem">
                <div class="ShortcutItem__Keys">
                  <span class="ShortcutKey">G</span>
                </div>
                <div class="ShortcutItem__Description">
                  <div class="ShortcutItem__Title">Grid View</div>
                  <div>Switch to grid layout</div>
                </div>
              </div>

              <div class="ShortcutItem">
                <div class="ShortcutItem__Keys">
                  <span class="ShortcutKey">L</span>
                </div>
                <div class="ShortcutItem__Description">
                  <div class="ShortcutItem__Title">List View</div>
                  <div>Switch to list layout</div>
                </div>
              </div>

              <div class="ShortcutItem">
                <div class="ShortcutItem__Keys">
                  <span class="ShortcutKey">C</span>
                </div>
                <div class="ShortcutItem__Description">
                  <div class="ShortcutItem__Title">Compact View</div>
                  <div>Switch to compact layout</div>
                </div>
              </div>

              <div class="ShortcutItem">
                <div class="ShortcutItem__Keys">
                  <span class="ShortcutKey">Esc</span>
                </div>
                <div class="ShortcutItem__Description">
                  <div class="ShortcutItem__Title">Close Modal</div>
                  <div>Dismiss open dialog</div>
                </div>
              </div>

              <div class="ShortcutItem">
                <div class="ShortcutItem__Keys">
                  <span class="ShortcutKey">S</span>
                </div>
                <div class="ShortcutItem__Description">
                  <div class="ShortcutItem__Title">Settings</div>
                  <div>Open app settings</div>
                </div>
              </div>
            </div>
          </div>
          <div class="Modal__Footer">
            <button class="EmptyState__SecondaryBtn" id="ShortcutsCloseBtn">Close</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.Modal__CloseBtn');
    const shortcutsCloseBtn = modal.querySelector('#ShortcutsCloseBtn');

    const closeModal = () => modal.remove();

    closeBtn.addEventListener('click', closeModal);
    shortcutsCloseBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  handleGlobalKeydown(e) {
    if (this.isInitializing) return;

    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
      if (e.key === 'Escape') {
        document.activeElement.blur();
      }
      return;
    }

    const shortcuts = {
      '/': () => {
        e.preventDefault();
        this.dom.searchInput.focus();
      },
      '?': () => {
        e.preventDefault();
        this.openShortcutsModal();
      },
      t: () => this.toggleTheme(),
      f: () => {
        e.preventDefault();
        this.toggleFilterPanel();
      },
      '+': () => this.openContributeModal(),
      g: () => {
        e.preventDefault();
        this.stateManager.setView('grid');
        this.updateViewSwitcher('grid');
        this.renderNotes();
      },
      l: () => {
        e.preventDefault();
        this.stateManager.setView('list');
        this.updateViewSwitcher('list');
        this.renderNotes();
      },
      c: () => {
        e.preventDefault();
        this.stateManager.setView('compact');
        this.updateViewSwitcher('compact');
        this.renderNotes();
      },
      s: () => {
        e.preventDefault();
        this.openSettingsModal();
      },
    };

    const handler = shortcuts[e.key.toLowerCase()];
    if (handler) {
      handler();
    }
  }

  updateScrollProgressBar() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    this.dom.scrollProgressBar.style.width = scrolled + '%';
  }

  updateLoadingProgress(status, percentage) {
    if (this.dom.loadingStatusText) {
      this.dom.loadingStatusText.textContent = status;
    }
    if (this.dom.loadingProgressFill) {
      this.dom.loadingProgressFill.style.width = percentage + '%';
    }
  }

  hideLoadingScreen() {
    const screen = this.dom.appLoadingScreen;
    screen.style.opacity = '0';
    screen.style.pointerEvents = 'none';
    screen.style.transition = 'opacity 400ms ease-out';

    setTimeout(() => {
      screen.style.display = 'none';
      document.documentElement.setAttribute('data-app-initialized', 'true');
    }, 400);
  }

  async populateFilterOptions() {
    const options = this.filterEngine.getFilterOptions();

    this.populateSelectOptions(this.dom.semesterFilter, options.semesters, 'Sem ');
    this.populateSelectOptions(this.dom.streamFilter, options.streams);
    this.populateSelectOptions(this.dom.courseFilter, options.courses);
    this.populateSelectOptions(this.dom.subjectFilter, options.subjects);
    this.populateSelectOptions(this.dom.yearFilter, options.years);
    this.populateSelectOptions(this.dom.authorFilter, options.authors);

    this.updateStreamPillCounts(options.streams);
  }

  populateSelectOptions(selectElement, options, prefix = '') {
    options.forEach((option) => {
      const optionElement = document.createElement('option');
      optionElement.value = option;
      optionElement.textContent = prefix + option;
      selectElement.appendChild(optionElement);
    });
  }

  updateStreamPillCounts(streams) {
    const streamCountMap = {
      Engineering: this.notesData.filter((n) => n.stream === 'Engineering').length,
      Science: this.notesData.filter((n) => n.stream === 'Science').length,
      Commerce: this.notesData.filter((n) => n.stream === 'Commerce').length,
      Arts: this.notesData.filter((n) => n.stream === 'Arts').length,
      Medical: this.notesData.filter((n) => n.stream === 'Medical').length,
    };

    streams.forEach((stream) => {
      const countElement = document.getElementById(`PillCount${stream}`);
      if (countElement) {
        countElement.textContent = streamCountMap[stream] || 0;
      }
    });
  }

  updateStatistics() {
    const state = this.stateManager.getState();

    document.getElementById('TotalNotesCount').textContent = state.notes.length;
    document.getElementById('TotalSubjectsCount').textContent = new Set(
      state.notes.map((n) => n.subject)
    ).size;
    document.getElementById('TotalTopicsCount').textContent = new Set(
      state.notes.flatMap((n) => n.topics || [])
    ).size;
    document.getElementById('TotalStreamsCount').textContent = new Set(
      state.notes.map((n) => n.stream)
    ).size;
    document.getElementById('TotalContributorsCount').textContent = new Set(
      state.notes.map((n) => n.author)
    ).size;
  }

  render() {
    this.populateFilterOptions();
    this.updateStatistics();
    this.applyFiltersAndSort();
    this.updateViewSwitcher(this.stateManager.getState().view);
    this.updateTabButtons('all');
  }
}

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

let app;

document.addEventListener('DOMContentLoaded', async () => {
  app = new NoteVaultApp();
  await app.init();
});

window.addEventListener('beforeunload', () => {
  if (app && app.indexedDBManager) {
    app.indexedDBManager.saveNotes(app.notesData);
  }
});

window.addEventListener('load', () => {
  if (navigator.serviceWorker && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
  }
});

export { NoteVaultApp, StateManager, FilterEngine, SearchEngine, FileDownloader, IndexedDBManager };
