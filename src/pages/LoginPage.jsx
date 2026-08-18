import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import { useStore } from "../hooks/useStore";
import { useLanguage } from "../i18n";
import { consumePendingAfterAuth, loginUser, logoutUser, SAMPLE_PROJECTS, updateUserProfile } from "../lib/store";

function profileFromUser(user) {
  return {
    name: user?.name || "",
    phone: user?.phone || "",
    jobTitle: user?.jobTitle || "",
    companyName: user?.companyName || "",
    companyReg: user?.companyReg || "",
    companyPhone: user?.companyPhone || "",
    companyAddress: user?.companyAddress || "",
    project: user?.project || "",
  };
}

export default function LoginPage() {
  const { user } = useStore();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(() => profileFromUser(user));
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    if (!editing) setProfile(profileFromUser(user));
  }, [user, editing]);

  function onSubmit(e) {
    e.preventDefault();
    const result = loginUser({ email, password });
    if (!result.ok) {
      setError(result.error === "password" ? t("loginErrorPassword") : t("loginErrorGeneric"));
      return;
    }
    navigate(consumePendingAfterAuth());
  }

  function onSaveProfile(e) {
    e.preventDefault();
    const result = updateUserProfile(profile);
    if (!result.ok) {
      const messages = {
        name: t("fullName"),
        companyName: t("companyName"),
        companyAddress: t("companyAddress"),
      };
      setError(messages[result.error] ? `${messages[result.error]} *` : t("saveErrorGeneric"));
      return;
    }
    setError("");
    setSaveMsg(t("profileSaved"));
    setEditing(false);
  }

  return (
    <div className="bg-paper min-h-screen">
      <SiteHeader />
      <main className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white border border-line rounded-xl p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 mb-2">
            {user ? t("profile") : t("account")}
          </p>
          <h1 className="reveal text-2xl font-bold text-brand-800">{user ? t("profile") : t("login")}</h1>
          <p className="mt-2 text-sm text-mute">
            {user ? t("profileHint") : t("loginRequiredRfq")}
          </p>

          {user ? (
            <div className="mt-6 space-y-4">
              {editing ? (
                <form className="space-y-4" onSubmit={onSaveProfile}>
                  <label className="block">
                    <span className="block text-sm font-medium mb-1">{t("email")}</span>
                    <input type="email" value={user.email} disabled className="field-input opacity-70" />
                    <span className="mt-1 block text-xs text-mute">{t("emailReadOnly")}</span>
                  </label>

                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mute pt-1">
                    {t("userInfo")}
                  </p>
                  <label className="block">
                    <span className="block text-sm font-medium mb-1">
                      {t("fullName")} <span className="text-brand-600">*</span>
                    </span>
                    <input
                      type="text"
                      required
                      value={profile.name}
                      onChange={(e) => {
                        setProfile((p) => ({ ...p, name: e.target.value }));
                        setError("");
                        setSaveMsg("");
                      }}
                      className="field-input"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-medium mb-1">{t("jobTitle")}</span>
                    <input
                      type="text"
                      value={profile.jobTitle}
                      onChange={(e) => setProfile((p) => ({ ...p, jobTitle: e.target.value }))}
                      className="field-input"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-medium mb-1">{t("mobilePhone")}</span>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                      className="field-input"
                    />
                  </label>

                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mute pt-1">
                    {t("companyDetails")}
                  </p>
                  <label className="block">
                    <span className="block text-sm font-medium mb-1">
                      {t("companyName")} <span className="text-brand-600">*</span>
                    </span>
                    <input
                      type="text"
                      required
                      value={profile.companyName}
                      onChange={(e) => {
                        setProfile((p) => ({ ...p, companyName: e.target.value }));
                        setError("");
                      }}
                      className="field-input"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-medium mb-1">{t("companyReg")}</span>
                    <input
                      type="text"
                      value={profile.companyReg}
                      onChange={(e) => setProfile((p) => ({ ...p, companyReg: e.target.value }))}
                      className="field-input"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-medium mb-1">{t("companyPhone")}</span>
                    <input
                      type="tel"
                      value={profile.companyPhone}
                      onChange={(e) => setProfile((p) => ({ ...p, companyPhone: e.target.value }))}
                      className="field-input"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-medium mb-1">
                      {t("companyAddress")} <span className="text-brand-600">*</span>
                    </span>
                    <textarea
                      required
                      rows={2}
                      value={profile.companyAddress}
                      onChange={(e) => {
                        setProfile((p) => ({ ...p, companyAddress: e.target.value }));
                        setError("");
                      }}
                      className="field-input resize-y"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-medium mb-1">{t("projectName")}</span>
                    <input
                      type="text"
                      list="profile-project-suggestions"
                      value={profile.project}
                      onChange={(e) => setProfile((p) => ({ ...p, project: e.target.value }))}
                      placeholder={t("projectPlaceholder")}
                      className="field-input"
                    />
                    <datalist id="profile-project-suggestions">
                      {SAMPLE_PROJECTS.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                    <span className="mt-1 block text-xs text-mute">{t("profileProjectHint")}</span>
                  </label>

                  {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
                  <div className="grid grid-cols-2 gap-2">
                    <button type="submit" className="btn-primary !py-2.5">
                      {t("saveProfile")}
                    </button>
                    <button
                      type="button"
                      className="btn-soft !py-2.5"
                      onClick={() => {
                        setEditing(false);
                        setError("");
                        setProfile(profileFromUser(user));
                      }}
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="border border-line rounded-xl p-4 bg-paper/60">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mute">
                        {t("signedIn")}
                      </p>
                      <button
                        type="button"
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                        onClick={() => {
                          setEditing(true);
                          setSaveMsg("");
                          setError("");
                        }}
                      >
                        {t("editProfile")}
                      </button>
                    </div>
                    <p className="mt-2 font-semibold text-brand-800">{user.name}</p>
                    <p className="text-sm text-mute">{user.email}</p>
                    {user.jobTitle ? <p className="mt-1 text-sm text-mute">{user.jobTitle}</p> : null}
                    {user.phone ? <p className="mt-1 text-sm text-mute">{user.phone}</p> : null}
                    {user.companyName ? (
                      <div className="mt-3 pt-3 border-t border-line">
                        <p className="text-sm font-semibold text-ink">{user.companyName}</p>
                        {user.companyReg ? (
                          <p className="mt-1 text-xs text-mute">{user.companyReg}</p>
                        ) : null}
                        {user.companyPhone ? (
                          <p className="mt-1 text-xs text-mute">{user.companyPhone}</p>
                        ) : null}
                        {user.companyAddress ? (
                          <p className="mt-1 text-xs text-mute">{user.companyAddress}</p>
                        ) : null}
                        {user.project ? (
                          <p className="mt-1 text-xs text-mute">
                            {t("projectLabel")} {user.project}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {saveMsg ? (
                      <p className="mt-3 text-sm font-medium text-brand-700">{saveMsg}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-2">
                    <Link to="/rfq" className="btn-primary !py-2.5">
                      {t("openRfqDraft")}
                    </Link>
                    <Link to="/rfqs" className="btn-soft !py-2.5 !border-brand-600 !text-brand-600">
                      {t("myRfqs")}
                    </Link>
                    <Link to="/" className="btn-soft !py-2.5">
                      {t("continueShopping")}
                    </Link>
                    <button
                      type="button"
                      onClick={() => logoutUser()}
                      className="btn-soft !py-2.5"
                    >
                      {t("logout")}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                <label className="block">
                  <span className="block text-sm font-medium mb-1">{t("email")}</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="you@company.com"
                    className="field-input"
                    autoComplete="email"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium mb-1">{t("password")}</span>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="••••••••"
                    className="field-input"
                    autoComplete="current-password"
                  />
                </label>
                {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
                <button type="submit" className="btn-primary w-full !py-2.5">
                  {t("login")}
                </button>
              </form>
              <p className="mt-5 text-sm text-mute">
                {t("noAccount")}{" "}
                <Link to="/signup" className="font-semibold text-brand-600 hover:underline">
                  {t("createAccount")}
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
