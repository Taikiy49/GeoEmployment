import React from 'react';
import { CheckCircle2, FileText, LockKeyhole, Mail, ShieldCheck, UserRoundCheck } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

const Card = ({ icon: Icon, title, description, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#A65F2A]/10 text-[#8A4A22]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-bold text-slate-950">{title}</h2>
        {description && <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>}
      </div>
    </div>
    <div className="mt-5">{children}</div>
  </section>
);

const Account = ({ name, email }) => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-[#8A4A22] shadow-sm">{name[0]}</div>
    <div className="min-w-0 flex-1">
      <div className="text-xs font-bold text-slate-900">{name}</div>
      <div className="truncate text-[11px] text-slate-500">{email}</div>
    </div>
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">Authorized</span>
  </div>
);

export default function AdminSettings() {
  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-5">
        <header>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A4A22]">Administration</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">Access & Security</h1>
          <p className="mt-1 text-sm text-slate-500">A clear view of who can access applicant records and where submissions are delivered.</p>
        </header>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card icon={UserRoundCheck} title="Authorized HR accounts" description="Only these Microsoft work accounts can enter the portal.">
            <div className="space-y-2">
              <Account name="Taiki Yamashita" email="tyamashita@geolabs.net" />
              <Account name="Lola Loui-Mishima" email="lola@geolabs.net" />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">Access changes require a server configuration update by IT. This prevents an accidental invitation from granting access to confidential records.</p>
          </Card>

          <Card icon={Mail} title="Application delivery" description="Every completed submission is sent to HR and retained in this portal.">
            <div className="space-y-2 text-xs">
              {['employment@geolabs.net', 'tyamashita@geolabs.net'].map(email => (
                <div key={email} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {email}
                </div>
              ))}
            </div>
          </Card>

          <Card icon={FileText} title="Application documents" description="Each submission is organized for HR review and supervisor forwarding.">
            <ul className="space-y-2 text-xs text-slate-600">
              {['Supervisor-facing employment application', 'EEO self-identification form', 'Veteran self-identification form', 'Alcohol and drug testing agreement', 'Applicant résumé'].map(item => (
                <li key={item} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A65F2A]" />{item}</li>
              ))}
            </ul>
          </Card>

          <Card icon={LockKeyhole} title="Confidentiality controls" description="Sensitive records are protected throughout the hiring process.">
            <ul className="space-y-2 text-xs leading-relaxed text-slate-600">
              <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A65F2A]" />Microsoft authentication is required for every admin page and file.</li>
              <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A65F2A]" />EEO and veteran files are labeled restricted.</li>
              <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A65F2A]" />Stage changes and recruiter notes are recorded in the audit trail.</li>
            </ul>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
