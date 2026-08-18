import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import { useLanguage } from "../i18n";
import { consumePendingAfterAuth, registerUser, SAMPLE_PROJECTS } from "../lib/store";

const INITIAL = {
  companyName: "",
  companyReg: "",
  companyPhone: "",
  companyAddress: "",
  project: "",
  name: "",
  jobTitle: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function SignupPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState("");

  function update(field) {
    return (e) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setError("");
    };
  }

  function onSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError(t("passwordsMismatch"));
      return;
    }
    const result = registerUser(form);
    if (!result.ok) {
      const messages = {
        exists: t("signupErrorExists"),
        email: t("workEmail"),
        name: t("fullName"),
        phone: t("mobilePhone"),
        jobTitle: t("jobTitle"),
        companyName: t("companyName"),
        companyAddress: t("companyAddress"),
        password: t("password"),
      };
      setError(messages[result.error] ? `${messages[result.error]} *` : t("signupErrorGeneric"));
      return;
    }
    navigate(consumePendingAfterAuth());
  }

  return (
    <div className="bg-paper min-h-screen">
      <SiteHeader />

      <main className="max-w-2xl mx-auto px-4 py-10 sm:py-12">
        <div className="bg-white border border-line rounded-xl p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 mb-2">
            {t("account")}
          </p>
          <h1 className="reveal text-2xl sm:text-3xl font-bold text-brand-800">
            {t("createAccountTitle")}
          </h1>
          <p className="mt-2 text-sm text-mute">{t("createAccountHint")}</p>

          <form className="mt-8 space-y-8" onSubmit={onSubmit}>
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-mute mb-4">
                {t("companyDetails")}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block sm:col-span-2">
                  <span className="block text-sm font-medium mb-1">
                    {t("companyName")} <span className="text-brand-600">*</span>
                  </span>
                  <input
                    required
                    value={form.companyName}
                    onChange={update("companyName")}
                    className="field-input"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium mb-1">{t("companyReg")}</span>
                  <input
                    value={form.companyReg}
                    onChange={update("companyReg")}
                    placeholder={t("optional")}
                    className="field-input"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium mb-1">{t("companyPhone")}</span>
                  <input
                    type="tel"
                    value={form.companyPhone}
                    onChange={update("companyPhone")}
                    className="field-input"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="block text-sm font-medium mb-1">
                    {t("companyAddress")} <span className="text-brand-600">*</span>
                  </span>
                  <input
                    required
                    value={form.companyAddress}
                    onChange={update("companyAddress")}
                    placeholder={t("addressPlaceholder")}
                    className="field-input"
                    autoComplete="organization"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="block text-sm font-medium mb-1">{t("projectName")}</span>
                  <input
                    type="text"
                    list="signup-project-suggestions"
                    value={form.project}
                    onChange={update("project")}
                    placeholder={t("projectPlaceholder")}
                    className="field-input"
                  />
                  <datalist id="signup-project-suggestions">
                    {SAMPLE_PROJECTS.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                  <span className="mt-1 block text-xs text-mute">{t("profileProjectHint")}</span>
                </label>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-mute mb-4">
                {t("userInfo")}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-sm font-medium mb-1">
                    {t("fullName")} <span className="text-brand-600">*</span>
                  </span>
                  <input
                    required
                    value={form.name}
                    onChange={update("name")}
                    className="field-input"
                    autoComplete="name"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium mb-1">
                    {t("jobTitle")} <span className="text-brand-600">*</span>
                  </span>
                  <input
                    required
                    value={form.jobTitle}
                    onChange={update("jobTitle")}
                    className="field-input"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium mb-1">
                    {t("workEmail")} <span className="text-brand-600">*</span>
                  </span>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={update("email")}
                    className="field-input"
                    autoComplete="email"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium mb-1">
                    {t("mobilePhone")} <span className="text-brand-600">*</span>
                  </span>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={update("phone")}
                    className="field-input"
                    autoComplete="tel"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium mb-1">
                    {t("password")} <span className="text-brand-600">*</span>
                  </span>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={form.password}
                    onChange={update("password")}
                    className="field-input"
                    autoComplete="new-password"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium mb-1">
                    {t("confirmPassword")} <span className="text-brand-600">*</span>
                  </span>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={form.confirmPassword}
                    onChange={update("confirmPassword")}
                    className="field-input"
                    autoComplete="new-password"
                  />
                </label>
              </div>
            </section>

            {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

            <button type="submit" className="btn-primary w-full !py-3">
              {t("createAccount")}
            </button>
          </form>

          <p className="mt-5 text-sm text-mute">
            {t("alreadyRegistered")}{" "}
            <Link to="/login" className="font-semibold text-brand-600 hover:underline">
              {t("login")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
