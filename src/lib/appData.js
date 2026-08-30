const storage = typeof window !== 'undefined' ? window.localStorage : null;

const memory = {};

const safeGetItem = (key) => {
  if (!storage) return memory[key] ?? null;
  return storage.getItem(key);
};

const safeSetItem = (key, value) => {
  if (!storage) {
    memory[key] = value;
    return;
  }
  storage.setItem(key, value);
};

const safeRemoveItem = (key) => {
  if (!storage) {
    delete memory[key];
    return;
  }
  storage.removeItem(key);
};

const readStore = (key, fallback) => {
  const raw = safeGetItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const writeStore = (key, value) => {
  safeSetItem(key, JSON.stringify(value));
};

const makeId = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const seedJobs = () => [
  {
    id: 'job-2025-04',
    externalId: '2025-04',
    title: 'Staff Engineer',
    department: 'Engineering',
    office: 'Waipahu, HI',
    employmentType: 'full_time',
    status: 'published',
    publishedDate: '2025-04-01T00:00:00.000Z',
    description: 'Perform assignments requiring application of standard techniques, procedures, and criteria to carry out engineering tasks.\n\nWork on assignments designed to further develop judgment and understanding of professional and ethical responsibilities.',
    requiredQualifications: '• Bachelor of Science in Civil Engineering\n• Excellent communication and grammar skills\n• Proficient with Microsoft Windows, Microsoft Office (Outlook, Word, and Excel), and Adobe Acrobat\n• Able to lift or move at least 50 pounds\n• Able to work overtime, including evenings and weekends\n• Willing to travel',
    preferredQualifications: 'Current pursuit of a Master of Science in Civil Engineering with a geotechnical focus is desired. Related engineering experience is helpful.',
    created_date: '2025-04-01T00:00:00.000Z',
    updated_date: '2025-04-01T00:00:00.000Z',
    statusHistory: [{ status: 'published', changedAt: '2025-04-01T00:00:00.000Z', changedBy: 'admin' }]
  },
  {
    id: 'job-2025-03',
    externalId: '2025-03',
    title: 'Engineering Technician or Trainee (Field)',
    department: 'Field Services',
    office: 'Maui, HI',
    employmentType: 'full_time',
    status: 'published',
    publishedDate: '2025-03-01T00:00:00.000Z',
    description: 'Geolabs, Inc. is offering an opportunity for a responsible, dedicated individual to join our Maui operations. We are willing to train a qualified applicant.\n\n• Perform daily field tests of different soil types\n• Prepare digital reports documenting daily field work\n• Communicate with Project Engineers and project teams about site requirements, testing, observations, inspections, and results\n• Perform laboratory tests on soils, aggregates, concrete, and other materials according to standard specifications',
    requiredQualifications: '• Working knowledge of Microsoft Office (Word, Excel, Outlook, etc.)\n• Able to work overtime, including evenings and weekends\n• Valid driver’s license and acceptable violation history\n• Strong organizational, problem-solving, mathematical, and analytical abilities\n• Ability to work in a fast-paced team environment while maintaining strict quality standards\n• Able to stand, observe, walk, push, pull, and lift or move at least 50 pounds; peripheral vision is required',
    created_date: '2025-03-01T00:00:00.000Z',
    updated_date: '2025-03-01T00:00:00.000Z',
    statusHistory: [{ status: 'published', changedAt: '2025-03-01T00:00:00.000Z', changedBy: 'admin' }]
  },
  {
    id: 'job-2026-01-tech',
    externalId: '2026-01',
    title: 'Engineering Technician or Trainee (Field)',
    department: 'Engineering / Laboratory / Materials',
    office: 'Waipahu, HI',
    employmentType: 'full_time',
    status: 'published',
    publishedDate: '2026-01-07T00:00:00.000Z',
    description: 'Geolabs, Inc. is offering an opportunity for a responsible, dedicated individual to join our operations as an Engineering Technician. We are willing to train a qualified applicant.\n\n• Perform daily field tests of different soil types\n• Prepare digital reports documenting daily field work\n• Communicate with Project Engineers and project teams about site requirements, testing, observations, inspections, and results\n• Perform laboratory tests on soils, aggregates, concrete, and other materials according to standard specifications',
    requiredQualifications: '• High school diploma or GED\n• Working knowledge of Microsoft Office (Word, Excel, Outlook, etc.)\n• Able to work overtime, including evenings and weekends\n• Valid driver’s license and clean abstract\n• Strong organizational, problem-solving, mathematical, and analytical abilities\n• Ability to work in a fast-paced team environment while maintaining strict quality standards\n• Able to stand, observe, walk, push, pull, and lift or move at least 50 pounds; peripheral vision is required',
    created_date: '2026-01-07T00:00:00.000Z',
    updated_date: '2026-01-07T00:00:00.000Z',
    statusHistory: [{ status: 'published', changedAt: '2026-01-07T00:00:00.000Z', changedBy: 'admin' }]
  },
  {
    id: 'job-2026-01-driller',
    externalId: '2026-01',
    title: 'Driller Helper',
    department: 'Drilling',
    office: 'Waipahu, HI',
    employmentType: 'full_time',
    status: 'published',
    publishedDate: '2026-01-06T00:00:00.000Z',
    description: 'Geolabs, Inc. is offering an opportunity for a responsible, dedicated individual to join our drilling operations. We are willing to train a qualified applicant.\n\nAssist with day-to-day drill rig operations and field tasks. The successful candidate must be willing to work in various weather conditions, be dependable, work well with others, and maintain strict quality standards in a fast-paced environment. This is a physically demanding job.',
    requiredQualifications: '• High school diploma or GED\n• Valid driver’s license and clean abstract\n• Able to lift or move 50+ pounds\n• Able to work overtime, including evenings and weekends\n• Willing to travel',
    preferredQualifications: 'Forklift operation or a CDL is helpful but not required. Drilling, construction, or labor experience is also helpful.',
    created_date: '2026-01-06T00:00:00.000Z',
    updated_date: '2026-01-06T00:00:00.000Z',
    statusHistory: [{ status: 'published', changedAt: '2026-01-06T00:00:00.000Z', changedBy: 'admin' }]
  }
];

const seedUsers = () => [
  {
    id: 'user-admin-001',
    email: 'taikiy49@gmail.com',
    full_name: 'Taiki Yamashita',
    role: 'admin',
    notificationsEnabled: true,
    created_date: '2026-01-01T00:00:00.000Z',
    updated_date: '2026-01-01T00:00:00.000Z'
  }
];

const seedTemplates = () => [
  {
    id: 'template-under-review',
    stageKey: 'under_review',
    name: 'Under Review',
    subject: 'Thanks for your interest',
    body: 'We appreciate your interest in Geolabs, Inc..',
    isActive: true,
    created_date: '2026-01-01T00:00:00.000Z',
    updated_date: '2026-01-01T00:00:00.000Z'
  }
];

const ensureSeedData = () => {
  const dataVersion = 'original-content-v1';
  if (!readStore('geolabs_jobs', null)) {
    writeStore('geolabs_jobs', seedJobs());
    safeSetItem('geolabs_data_version', dataVersion);
  } else if (safeGetItem('geolabs_data_version') !== dataVersion) {
    const priorDemoIds = new Set(['job-geo-001', 'job-geo-002', 'job-geo-003']);
    const existing = readStore('geolabs_jobs', []).filter(job => !priorDemoIds.has(job.id));
    const existingIds = new Set(existing.map(job => job.id));
    writeStore('geolabs_jobs', [...seedJobs().filter(job => !existingIds.has(job.id)), ...existing]);
    safeSetItem('geolabs_data_version', dataVersion);
  }
  if (!readStore('geolabs_applications', null)) writeStore('geolabs_applications', []);
  if (!readStore('geolabs_users', null)) writeStore('geolabs_users', seedUsers());
  if (!readStore('geolabs_templates', null)) writeStore('geolabs_templates', seedTemplates());
  if (!readStore('geolabs_current_user', null)) writeStore('geolabs_current_user', seedUsers()[0]);
};

const getCollection = (key, fallback = []) => {
  ensureSeedData();
  return readStore(key, fallback);
};

const saveCollection = (key, value) => {
  writeStore(key, value);
  return value;
};

const sortCollection = (items, sortField) => {
  if (!sortField) return items;
  const direction = sortField.startsWith('-') ? -1 : 1;
  const field = sortField.replace(/^-/, '');
  return [...items].sort((a, b) => {
    const left = a[field] ?? '';
    const right = b[field] ?? '';
    if (left < right) return -1 * direction;
    if (left > right) return 1 * direction;
    return 0;
  });
};

const matchFilters = (item, params = {}) => Object.entries(params).every(([key, expected]) => {
  if (expected === undefined || expected === null) return true;
  const actual = item[key];
  if (Array.isArray(expected)) return expected.includes(actual);
  if (typeof expected === 'boolean') return actual === expected;
  return actual === expected;
});

const usesServerApplicationStore = () => (
  typeof window !== 'undefined'
  && !['localhost', '127.0.0.1'].includes(window.location.hostname)
  && window.location.pathname.startsWith('/admin')
);

const usesServerJobStore = () => (
  typeof window !== 'undefined'
  && !['localhost', '127.0.0.1'].includes(window.location.hostname)
);

const jobApi = async (path = '', options = {}) => {
  const admin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  const response = await fetch(`${admin ? '/api/admin/jobs' : '/api/jobs'}${path}`, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
    ...options,
  });
  const result = await response.json().catch(() => ({}));
  if (response.status === 401 && admin) {
    window.location.assign(`/auth/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    throw new Error('Microsoft admin authentication is required.');
  }
  if (!response.ok) throw new Error(result.error || 'Job opening request failed.');
  return result;
};

const applicationApi = async (path = '', options = {}) => {
  const response = await fetch(`/api/admin/applications${path}`, {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  const result = await response.json().catch(() => ({}));
  if (response.status === 401) {
    window.location.assign(`/auth/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    throw new Error('Microsoft admin authentication is required.');
  }
  if (!response.ok) throw new Error(result.error || 'Application record request failed.');
  return result;
};

export const appData = {
  auth: {
    me: async () => {
      if (typeof window === 'undefined') return null;
      if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
        ensureSeedData();
        return readStore('geolabs_current_user', null) || getCollection('geolabs_users')[0];
      }
      const response = await fetch('/auth/session', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('Unable to verify the Microsoft admin session.');
      const result = await response.json();
      return result.authenticated ? result.user : null;
    },
    logout: async () => {
      safeRemoveItem('geolabs_current_user');
      if (typeof window !== 'undefined') window.location.assign('/auth/logout');
      return true;
    },
    redirectToLogin: async () => {
      if (typeof window !== 'undefined') {
        const returnTo = window.location.pathname.startsWith('/admin')
          ? `${window.location.pathname}${window.location.search}`
          : '/admin';
        window.location.assign(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
      }
      return true;
    }
  },
  entities: {
    JobRequisition: {
      filter: async (params = {}, sortField = null, limit = 100) => {
        if (usesServerJobStore()) {
          const query = new URLSearchParams({ filters: JSON.stringify(params), sort: sortField || '-created_date', limit: String(limit) });
          return (await jobApi(`?${query}`)).jobs;
        }
        const jobs = getCollection('geolabs_jobs', []);
        const results = jobs.filter((job) => matchFilters(job, params));
        const sorted = sortCollection(results, sortField);
        return sorted.slice(0, limit);
      },
      list: async (sortField = '-created_date', limit = 200) => {
        if (usesServerJobStore()) {
          const query = new URLSearchParams({ sort: sortField, limit: String(limit) });
          return (await jobApi(`?${query}`)).jobs;
        }
        const jobs = getCollection('geolabs_jobs', []);
        return sortCollection(jobs, sortField).slice(0, limit);
      },
      create: async (data) => {
        if (usesServerJobStore()) return (await jobApi('', { method: 'POST', body: JSON.stringify(data) })).job;
        const jobs = getCollection('geolabs_jobs', []);
        const next = {
          id: data.id || makeId('job'),
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
          ...data,
        };
        jobs.push(next);
        saveCollection('geolabs_jobs', jobs);
        return next;
      },
      update: async (id, updates) => {
        if (usesServerJobStore()) return (await jobApi(`/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(updates) })).job;
        const jobs = getCollection('geolabs_jobs', []);
        const index = jobs.findIndex((job) => job.id === id);
        if (index === -1) return null;
        jobs[index] = { ...jobs[index], ...updates, updated_date: new Date().toISOString() };
        saveCollection('geolabs_jobs', jobs);
        return jobs[index];
      },
      delete: async (id) => {
        if (usesServerJobStore()) {
          await jobApi(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
          return true;
        }
        const jobs = getCollection('geolabs_jobs', []);
        const updated = jobs.filter((job) => job.id !== id);
        saveCollection('geolabs_jobs', updated);
        return true;
      }
    },
    Application: {
      filter: async (params = {}, sortField = null, limit = 100) => {
        if (usesServerApplicationStore()) {
          const query = new URLSearchParams({
            filters: JSON.stringify(params),
            sort: sortField || '-created_date',
            limit: String(limit),
          });
          return (await applicationApi(`?${query}`)).applications;
        }
        const apps = getCollection('geolabs_applications', []);
        const results = apps.filter((app) => matchFilters(app, params));
        const sorted = sortCollection(results, sortField);
        return sorted.slice(0, limit);
      },
      list: async (sortField = '-created_date', limit = 200) => {
        if (usesServerApplicationStore()) {
          const query = new URLSearchParams({ sort: sortField, limit: String(limit) });
          return (await applicationApi(`?${query}`)).applications;
        }
        const apps = getCollection('geolabs_applications', []);
        return sortCollection(apps, sortField).slice(0, limit);
      },
      create: async (data) => {
        if (usesServerApplicationStore()) {
          return (await applicationApi('', { method: 'POST', body: JSON.stringify(data) })).application;
        }
        const apps = getCollection('geolabs_applications', []);
        const next = {
          id: data.id || makeId('application'),
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
          ...data,
        };
        apps.push(next);
        saveCollection('geolabs_applications', apps);
        return next;
      },
      update: async (id, updates) => {
        if (usesServerApplicationStore()) {
          return (await applicationApi(`/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
          })).application;
        }
        const apps = getCollection('geolabs_applications', []);
        const index = apps.findIndex((app) => app.id === id);
        if (index === -1) return null;
        apps[index] = { ...apps[index], ...updates, updated_date: new Date().toISOString() };
        saveCollection('geolabs_applications', apps);
        return apps[index];
      },
      delete: async (id) => {
        if (usesServerApplicationStore()) {
          await applicationApi(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
          return true;
        }
        const apps = getCollection('geolabs_applications', []);
        const updated = apps.filter((app) => app.id !== id);
        saveCollection('geolabs_applications', updated);
        return true;
      }
    },
    User: {
      list: async () => getCollection('geolabs_users', []),
      create: async (data) => {
        const users = getCollection('geolabs_users', []);
        const next = { id: data.id || makeId('user'), created_date: new Date().toISOString(), updated_date: new Date().toISOString(), ...data };
        users.push(next);
        saveCollection('geolabs_users', users);
        return next;
      },
      update: async (id, updates) => {
        const users = getCollection('geolabs_users', []);
        const index = users.findIndex((user) => user.id === id);
        if (index === -1) return null;
        users[index] = { ...users[index], ...updates, updated_date: new Date().toISOString() };
        saveCollection('geolabs_users', users);
        return users[index];
      }
    },
    EmailTemplate: {
      list: async () => getCollection('geolabs_templates', []),
      create: async (data) => {
        const templates = getCollection('geolabs_templates', []);
        const next = { id: data.id || makeId('template'), created_date: new Date().toISOString(), updated_date: new Date().toISOString(), ...data };
        templates.push(next);
        saveCollection('geolabs_templates', templates);
        return next;
      },
      update: async (id, updates) => {
        const templates = getCollection('geolabs_templates', []);
        const index = templates.findIndex((template) => template.id === id);
        if (index === -1) return null;
        templates[index] = { ...templates[index], ...updates, updated_date: new Date().toISOString() };
        saveCollection('geolabs_templates', templates);
        return templates[index];
      },
      delete: async (id) => {
        const templates = getCollection('geolabs_templates', []);
        const updated = templates.filter((template) => template.id !== id);
        saveCollection('geolabs_templates', updated);
        return true;
      }
    }
  },
  functions: {
    invoke: async (name, payload = {}) => {
      return { ok: true, name, payload };
    }
  },
  users: {
    inviteUser: async (email, role = 'admin') => {
      const users = getCollection('geolabs_users', []);
      const nextUser = {
        id: makeId('user'),
        email,
        role,
        full_name: email.split('@')[0],
        notificationsEnabled: true,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      };
      users.push(nextUser);
      saveCollection('geolabs_users', users);
      return nextUser;
    }
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        if (!file) throw new Error('Choose a file before uploading.');
        return {
          file_url: `local-file:${encodeURIComponent(file.name)}`,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        };
      },
      InvokeLLM: async () => ({})
    }
  }
};

ensureSeedData();
