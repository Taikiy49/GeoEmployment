import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminLayout from '../../components/admin/AdminLayout';

const TYPE_LABELS = {
  interview_invitation: 'Interview Invitation',
  rejection: 'Rejection',
  offer: 'Offer',
  general: 'General',
};

const TYPE_COLORS = {
  interview_invitation: 'bg-blue-50 text-blue-700',
  rejection: 'bg-red-50 text-red-700',
  offer: 'bg-green-50 text-green-700',
  general: 'bg-gray-50 text-gray-700',
};

export default function EmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    base44.entities.EmailTemplate.list('-created_date', 100).then(t => {
      setTemplates(t);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const filtered = templates.filter(t => {
    const matchType = typeFilter === 'all' || t.type === typeFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || t.name?.toLowerCase().includes(q) || t.subject?.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const openForm = (template = null) => {
    if (template) {
      setFormData({ ...template });
      setEditingId(template.id);
    } else {
      setFormData({ name: '', type: 'general', subject: '', body: '', isActive: true, notes: '' });
      setEditingId(null);
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormData(null);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.subject || !formData.body) {
      alert('Please fill in all required fields');
      return;
    }
    setSaving(true);
    if (editingId) {
      await base44.entities.EmailTemplate.update(editingId, formData);
    } else {
      await base44.entities.EmailTemplate.create(formData);
    }
    setSaving(false);
    closeForm();
    load();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this template?')) {
      await base44.entities.EmailTemplate.delete(id);
      load();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-navy">Email Templates</h1>
            <p className="text-sm text-[#6b7280] mt-0.5">Manage reusable email templates for candidates</p>
          </div>
          <Button onClick={() => openForm()} className="rounded-full px-5 h-9 text-sm bg-bronze hover:bg-bronze-dark text-white">
            <Plus className="w-4 h-4 mr-1.5" /> New Template
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['all', 'interview_invitation', 'rejection', 'offer', 'general'].map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${
                  typeFilter === t
                    ? 'bg-navy text-white border-navy'
                    : 'bg-white text-[#6b7280] border-[#e5e7eb] hover:border-[#9ca3af]'
                }`}
              >
                {t === 'all' ? 'All Types' : TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-7 h-7 border-4 border-bronze/30 border-t-bronze rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-[#6b7280]">No templates found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">Name</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide hidden sm:table-cell">Subject</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide hidden md:table-cell">Status</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {filtered.map(t => (
                    <tr key={t.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-navy">{t.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[t.type]}`}>
                          {TYPE_LABELS[t.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#374151] hidden sm:table-cell text-xs truncate max-w-xs">{t.subject}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {t.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openForm(t)} className="p-1.5 rounded hover:bg-[#f3f4f6] text-[#6b7280] hover:text-navy transition-colors">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded hover:bg-[#f3f4f6] text-[#6b7280] hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form Modal */}
        {showForm && formData && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[#e5e7eb] sticky top-0 bg-white">
                <h2 className="text-lg font-semibold text-navy">
                  {editingId ? 'Edit Template' : 'New Template'}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[11px] font-medium text-[#374151] block mb-1">Template Name *</label>
                  <Input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Interview Invitation"
                    className="h-9 text-sm"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#374151] block mb-1">Type *</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full h-9 px-3 text-sm rounded-lg border border-[#e5e7eb] bg-white"
                  >
                    <option value="interview_invitation">Interview Invitation</option>
                    <option value="rejection">Rejection</option>
                    <option value="offer">Offer</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#374151] block mb-1">Email Subject *</label>
                  <Input
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Your Geolabs Interview — {{position}}"
                    className="h-9 text-sm"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#374151] block mb-1">Email Body *</label>
                  <textarea
                    value={formData.body}
                    onChange={e => setFormData({ ...formData, body: e.target.value })}
                    placeholder="Enter email content. Use {{firstName}}, {{lastName}}, {{position}} for variable insertion."
                    className="w-full h-40 px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] focus:outline-none focus:ring-1 focus:ring-bronze"
                  />
                  <p className="text-[10px] text-[#9ca3af] mt-1">Available variables: firstname, lastname, position, company, email (example: {`{{firstName}}`})</p>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#374151] block mb-1">Notes (Internal)</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Internal notes about when/how to use this template"
                    className="w-full h-20 px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] focus:outline-none focus:ring-1 focus:ring-bronze"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-[#d1d5db]"
                  />
                  <label htmlFor="isActive" className="text-[11px] font-medium text-[#374151]">Active (available for use)</label>
                </div>
              </div>

              <div className="p-6 border-t border-[#e5e7eb] flex justify-end gap-2">
                <Button onClick={closeForm} variant="outline" className="rounded-lg px-4 h-9 text-sm">
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg px-4 h-9 text-sm bg-bronze hover:bg-bronze-dark text-white"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : null}
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}