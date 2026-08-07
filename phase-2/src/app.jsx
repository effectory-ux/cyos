// app.jsx — flow controller
import { useState } from "react";
import { Sidebar, SurveysPage, OutOfScopeDialog } from "./components/Shell.jsx";
import { Builder } from "./components/Builder.jsx";
import { TemplateModal } from "./components/TemplateModal.jsx";
import { EditQuestionsDialog, ThemeConfirm } from "./components/EditQuestionsDialog.jsx";
import { CustomQuestionDialog } from "./components/CustomQuestionDialog.jsx";
import { NameSurveyDialog } from "./components/NameSurveyDialog.jsx";
import { themeStatus, themesOf } from "./components/shared.jsx";
import { SEED_SURVEYS, surveyFromTemplate } from "./data/data.js";
import { libraryPool } from "./data/qlib.js";

// Behaviour the design iterations landed on: removing the last question of a
// complete theme soft-locks (asks first), and "Add custom question" lives in
// the Add-questions toolbar.
const TWEAKS = { integrity: "lock", customEntry: "toolbar" };

export function App() {
  const [screen, setScreen] = useState("surveys");
  const [modal, setModal] = useState(false);
  // True when the template modal was opened from the builder to CHANGE the
  // template of the current survey (which resets its questionnaire).
  const [changing, setChanging] = useState(false);
  const [editing, setEditing] = useState(false);
  // Which tab the Add-questions dialog opens on ("questions" default; a builder
  // template tag opens it on "templates").
  const [editTab, setEditTab] = useState("questions");
  const [survey, setSurvey] = useState(null);
  const [removeConfirm, setRemoveConfirm] = useState(null);
  const [editCustom, setEditCustom] = useState(null);
  // A survey-in-progress awaiting its name. Set after a template is chosen or
  // "Start from scratch" is pressed; cleared once the name dialog is confirmed
  // (→ builder) or backed out of (→ template modal).
  const [pending, setPending] = useState(null);
  // The Surveys landing list. Drafts created in the flow are upserted here on
  // "Save & close"; any Draft row can be deleted from its row menu.
  const [surveysList, setSurveysList] = useState(SEED_SURVEYS);
  // A non-editable survey (Live/Closed) the user clicked — shows the
  // out-of-scope dialog pointing at a separate prototype.
  const [outOfScope, setOutOfScope] = useState(null);

  // Phase-2 customization state lives ON the survey, so it saves/reopens with
  // it and is always survey-scoped (the library is never written to):
  //   topicMeta:    { [topicKey]: { name?, desc?, descHidden? } } — overrides for
  //                 library topics; name/desc for custom topics.
  //   customTopics: [topicKey] — user-created topics (key "ct-…"; may be empty).
  //   qMeta:        { [qId]: { desc?, descHidden?, topic? } } — survey-scoped
  //                 extras on STANDARD questions (custom questions carry their
  //                 own desc/topic on the pool object).
  //   i18nEdits:    { [lang]: { [stringKey]: text } } — reviewed translations of
  //                 user-authored strings; absence = automatic translation.
  const normalize = (sv) => ({ topicMeta: {}, customTopics: [], qMeta: {}, i18nEdits: {}, ...sv });

  // When changing a template from the builder, keep the same survey id so it
  // updates in place (a fresh id is minted only for a brand-new survey).
  const keepId = () => (changing && survey ? { id: survey.id } : {});
  const useTemplate = (tmpl) => {
    // Build the survey from the template's own question set — all selected, so
    // the template reads as "active" in the builder + Templates tab. The rest of
    // the shared library rides along (unselected) so there's plenty more to add.
    const base = surveyFromTemplate(tmpl.id, null, tmpl.name);
    setPending({ suggested: tmpl.name, survey: { ...base, ...keepId() } });
    setModal(false);
  };
  const startScratch = () => {
    // Start-from-scratch drops the org-required questions for THIS survey (the
    // `required` flag is stripped) so the prototype can show a true empty state.
    const pool = libraryPool().map(q => ({ ...q, required: false }));
    setPending({ suggested: "", survey: { ...keepId(), templateName: null, isTemplate: false, selectedIds: [], pool } });
    setModal(false);
  };
  // Commit the named survey and open the builder (reusing the id when changing).
  const confirmName = (name) => { setSurvey(normalize({ ...pending.survey, id: pending.survey.id || "d" + Date.now(), name })); setPending(null); setChanging(false); setEditing(false); setScreen("builder"); };
  // Back out of naming → return to template selection.
  const cancelName = () => { setPending(null); setModal(true); };
  // Close the modal without changing anything (also cancels a change-in-progress).
  const closeModal = () => { setModal(false); setChanging(false); };

  // Save & close: upsert the current survey into the list, then return to the
  // Surveys landing page. New surveys are saved as Drafts; editing an existing
  // row preserves its status (e.g. a Planned survey stays Planned). The full
  // survey state is stashed on the row so reopening keeps the edits.
  const saveAndClose = () => {
    setSurveysList(list => {
      const existing = list.find(r => r.id === survey.id);
      const base = existing || { id: survey.id, proj: "Central Employee Listening", status: "Draft", resp: "—", mine: true };
      const row = { ...base, name: survey.name, date: "Edited just now", questions: survey.selectedIds.length, survey };
      return existing ? list.map(r => r.id === survey.id ? row : r) : [row, ...list];
    });
    setScreen("surveys");
  };
  const deleteSurvey = (id) => setSurveysList(list => list.filter(r => r.id !== id));

  // Open a survey from the list. Draft & Planned are editable → builder; other
  // statuses point at separate prototypes (out of scope here). Editable seed
  // rows with no saved questionnaire open with the default template selection.
  const openSurvey = (row) => {
    if (row.status === "Draft" || row.status === "Planned") {
      let sv = row.survey;
      if (!sv) {
        const lib = libraryPool();
        sv = { id: row.id, name: row.name, templateName: null, isTemplate: false,
          selectedIds: lib.filter(q => q.required).map(q => q.id), pool: lib };
      }
      setSurvey(normalize(sv)); setEditing(false); setScreen("builder");
    } else {
      setOutOfScope(row);
    }
  };

  const saveQuestions = (ids, pool) => { setSurvey(s => ({ ...s, selectedIds: ids, pool })); setEditing(false); };
  // Add/remove a theme's questions from the builder's "View details" dialog.
  const toggleQuestion = (id) => setSurvey(s => ({ ...s, selectedIds: s.selectedIds.includes(id) ? s.selectedIds.filter(x => x !== id) : [...s.selectedIds, id] }));
  const setManyQuestions = (ids, on) => setSurvey(s => { const set = new Set(s.selectedIds); ids.forEach(id => on ? set.add(id) : set.delete(id)); return { ...s, selectedIds: [...set] }; });
  // ---- phase-2 customization handlers (all survey-scoped) ----------------
  // Drop empty values so overrides disappear cleanly when reset.
  const compact = (obj) => {
    const out = { ...obj };
    Object.keys(out).forEach(k => { if (out[k] === undefined || out[k] === null || out[k] === "") delete out[k]; });
    return out;
  };
  // Reviewed translations of a string die when its base text changes — the
  // string reverts to a fresh automatic translation.
  const dropI18n = (s, keys) => {
    const edits = {};
    Object.entries(s.i18nEdits || {}).forEach(([lang, m]) => {
      const next = { ...m }; keys.forEach(k => delete next[k]); edits[lang] = next;
    });
    return edits;
  };
  const updateTopicMeta = (key, patch) => setSurvey(s => {
    const prev = (s.topicMeta || {})[key] || {};
    // Renaming a library topic back to its original name clears the override.
    const p = { ...patch };
    if (p.name !== undefined && p.name === key && !(s.customTopics || []).includes(key)) p.name = undefined;
    const cur = compact({ ...prev, ...p });
    const tm = { ...(s.topicMeta || {}) };
    if (Object.keys(cur).length) tm[key] = cur; else delete tm[key];
    const touched = [];
    if ("name" in patch) touched.push(`topic:${key}:name`);
    if ("desc" in patch) touched.push(`topic:${key}:desc`);
    return { ...s, topicMeta: tm, i18nEdits: dropI18n(s, touched) };
  });
  const addTopic = ({ name, desc }) => setSurvey(s => {
    const key = "ct-" + Date.now();
    return { ...s, customTopics: [...(s.customTopics || []), key],
      topicMeta: { ...(s.topicMeta || {}), [key]: compact({ name, desc }) } };
  });
  const updateQMeta = (id, patch) => setSurvey(s => {
    const cur = compact({ ...((s.qMeta || {})[id] || {}), ...patch });
    const qm = { ...(s.qMeta || {}) };
    if (Object.keys(cur).length) qm[id] = cur; else delete qm[id];
    return { ...s, qMeta: qm, i18nEdits: "desc" in patch ? dropI18n(s, [`q:${id}:desc`]) : s.i18nEdits };
  });
  // Any question may be reassigned to another topic (via drag or its menu).
  // Custom questions carry their topic on the pool object; standard questions
  // get a survey-scoped override in qMeta (the library topic stays canonical).
  const moveQuestionTopic = (id, topicKey) => setSurvey(s => {
    const q = s.pool.find(p => p.id === id);
    if (q && q.custom) return { ...s, pool: s.pool.map(p => p.id === id ? { ...p, topic: topicKey } : p) };
    const cur = { ...((s.qMeta || {})[id] || {}) };
    if (q && topicKey === q.topic) delete cur.topic; else cur.topic = topicKey;
    const qm = { ...(s.qMeta || {}) };
    if (Object.keys(cur).length) qm[id] = cur; else delete qm[id];
    return { ...s, qMeta: qm };
  });
  // Topic choices for the custom-question dialog: every topic visible in this
  // survey (by its survey-scoped display name), including empty custom topics.
  const surveyTopicOptions = () => {
    if (!survey) return undefined;
    const sel = new Set(survey.selectedIds);
    const eff = (q) => ((survey.qMeta || {})[q.id] || {}).topic || q.topic;
    const keys = [];
    survey.pool.forEach(q => { if (sel.has(q.id)) { const t = eff(q); if (t && !keys.includes(t)) keys.push(t); } });
    (survey.customTopics || []).forEach(k => { if (!keys.includes(k)) keys.push(k); });
    return keys.map(k => ({ value: k, label: ((survey.topicMeta || {})[k] || {}).name || k }));
  };
  const saveTranslation = (lang, key, text) => setSurvey(s => {
    const forLang = { ...((s.i18nEdits || {})[lang] || {}) };
    if (text && text.trim()) forLang[key] = text.trim(); else delete forLang[key];
    return { ...s, i18nEdits: { ...(s.i18nEdits || {}), [lang]: forLang } };
  });

  // Remove a question from THIS questionnaire (library questions are only
  // deselected; custom questions are deleted from the pool entirely).
  const removeFromSurvey = (q) => {
    if (q.required) return; // org-required questions can't be removed
    setSurvey(s => ({
      ...s,
      selectedIds: s.selectedIds.filter(id => id !== q.id),
      pool: q.custom ? s.pool.filter(p => p.id !== q.id) : s.pool,
    }));
  };
  // Removing the last question of a complete theme breaks its composite score —
  // surface the positive “keep it complete” dialog first (when soft-lock is on).
  const requestRemove = (q) => {
    if (TWEAKS.integrity === "lock") {
      const status = themeStatus(survey.selectedIds, survey.pool);
      // A question in several themes can break more than one complete theme.
      const broken = themesOf(q).filter(name => status.find(x => x.name === name)?.complete);
      if (broken.length) { setRemoveConfirm({ q, themes: broken }); return; }
    }
    removeFromSurvey(q);
  };
  const saveCustomEdit = (q) => {
    setSurvey(s => ({
      ...s,
      pool: s.pool.map(p => p.id === q.id ? q : p),
      // The question's own strings changed — reviewed translations go stale.
      i18nEdits: dropI18n(s, [`q:${q.id}:text`, `q:${q.id}:desc`, ...(q.options || []).map((_, i) => `q:${q.id}:opt:${i}`)]),
    }));
    setEditCustom(null);
  };
  const renameSurvey = (newName) => setSurvey(s => ({ ...s, name: newName }));
  // Remove a whole topic from this questionnaire: deselect all its questions
  // (and drop any custom ones from the pool). Library + benchmarks are untouched.
  // For a custom topic the topic itself is deleted too; survey-scoped moves into
  // the removed topic are cleared so those questions return to their own topic.
  const removeTopic = (ids, key) => setSurvey(s => {
    const idset = new Set(ids);
    const reqKept = new Set(s.pool.filter(p => p.required).map(p => p.id)); // required questions stay
    const qm = {};
    Object.entries(s.qMeta || {}).forEach(([id, m]) => {
      const next = m.topic === key ? { ...m, topic: undefined } : m;
      const cur = Object.fromEntries(Object.entries(next).filter(([, v]) => v !== undefined));
      if (Object.keys(cur).length) qm[id] = cur;
    });
    const tm = { ...(s.topicMeta || {}) }; delete tm[key];
    return {
      ...s,
      selectedIds: s.selectedIds.filter(id => !idset.has(id) || reqKept.has(id)),
      pool: s.pool.filter(p => !(p.custom && idset.has(p.id))),
      qMeta: qm,
      customTopics: (s.customTopics || []).filter(k => k !== key),
      topicMeta: tm, // removing a topic also clears its survey-scoped overrides
    };
  });

  return (
    <div className="app">
      {screen === "surveys" && <Sidebar />}
      {screen === "surveys"
        ? <SurveysPage rows={surveysList} onCreate={() => setModal(true)} onDeleteDraft={deleteSurvey} onOpen={openSurvey} />
        : <Builder survey={survey} onEditQuestions={() => { setEditTab("questions"); setEditing(true); }} onExit={() => { setScreen("surveys"); }}
            onSaveClose={saveAndClose} onRemoveQuestion={requestRemove} onEditCustom={setEditCustom}
            onRename={renameSurvey} onRemoveTopic={removeTopic} onMoveTopic={moveQuestionTopic}
            onToggleQuestion={toggleQuestion} onSetManyQuestions={setManyQuestions}
            onUpdateTopicMeta={updateTopicMeta} onAddTopic={addTopic} onUpdateQMeta={updateQMeta}
            onSaveTranslation={saveTranslation}
            onOpenTemplates={() => { setEditTab("templates"); setEditing(true); }} />}

      {modal && <TemplateModal changing={changing} onClose={closeModal} onUse={useTemplate} onScratch={startScratch} />}
      {pending && <NameSurveyDialog suggested={pending.suggested} isTemplate={pending.survey.isTemplate}
        templateName={pending.survey.templateName} changing={changing} onBack={cancelName} onConfirm={confirmName} />}
      {editing && survey && (
        <EditQuestionsDialog initialPool={survey.pool} initialSelected={survey.selectedIds} tweaks={TWEAKS}
          initialTab={editTab} onClose={() => setEditing(false)} onSave={saveQuestions} />
      )}
      {removeConfirm && <ThemeConfirm q={removeConfirm.q} themes={removeConfirm.themes} pool={survey && survey.pool}
        onKeep={() => setRemoveConfirm(null)}
        onRemove={() => { removeFromSurvey(removeConfirm.q); setRemoveConfirm(null); }} />}
      {editCustom && <CustomQuestionDialog question={editCustom}
        topics={surveyTopicOptions()}
        onCancel={() => setEditCustom(null)} onSubmit={saveCustomEdit}
        onDelete={(q) => { removeFromSurvey(q); setEditCustom(null); }} />}
      {outOfScope && <OutOfScopeDialog row={outOfScope} onClose={() => setOutOfScope(null)} />}
    </div>
  );
}
