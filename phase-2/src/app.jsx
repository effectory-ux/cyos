// app.jsx — flow controller
import { useState, useEffect, useRef } from "react";
import { Sidebar, SurveysPage, OutOfScopeDialog } from "./components/Shell.jsx";
import { Builder } from "./components/Builder.jsx";
import { TemplateModal } from "./components/TemplateModal.jsx";
import { EditQuestionsDialog, ThemeConfirm } from "./components/EditQuestionsDialog.jsx";
import { CustomQuestionDialog } from "./components/CustomQuestionDialog.jsx";
import { NameSurveyDialog } from "./components/NameSurveyDialog.jsx";
import { themeStatus, themesOf } from "./components/shared.jsx";
import { SEED_SURVEYS, surveyFromTemplate } from "./data/data.js";
import { libraryPool } from "./data/qlib.js";
import { PrototypeBar, getStartAt } from "./proto/PrototypeBar.jsx";
import { PROTO_STORAGE_PREFIX, START_POINTS, USE_CASES, VARIANTS } from "./data/proto-config.js";
import { serialize, writeRoute, parse } from "./data/routes.js";
import { defaultEdges, EDGE_CASES } from "./data/edgecases.js";
import { designById } from "./data/designs.js";
import { ORG_CUSTOM } from "./data/data.js";

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
  // Design variants (toolbar): flip between candidate designs live.
  // The sidebar dialog (Figma 6316:27977) is the default now; flipping the
  // variant off brings the old tabbed dialog back for comparison.
  const [variantsOn, setVariantsOn] = useState({ dialogSidebarNav: true });
  const toggleVariant = (key) => setVariantsOn(v => ({ ...v, [key]: !v[key] }));
  const [newCustom, setNewCustom] = useState(false); // create-from-builder ("Add" menu)
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
  // Which dialog the Builder currently has open ({ dialog, arg }), reported up so
  // every step of the prototype has a URL. `openInBuilder` asks the Builder to
  // restore one (deep link / use case).
  const [builderDialog, setBuilderDialog] = useState(null);
  // The URL the prototype was opened with, captured during the first render:
  // the route-writing effect below runs before boot and would overwrite it.
  // Edge-case switches from the prototype toolbar. These are not cosmetic: they
  // change the survey (org-required questions) and behaviour (soft-lock,
  // whether approved alternative wordings exist at all).
  const [edges, setEdges] = useState(defaultEdges);
  // Which questions were org-required before they were switched off, so the
  // toggle round-trips exactly instead of guessing.
  const wasRequired = useRef(null);
  const toggleEdge = (key) => {
    const on = !edges[key];
    setEdges(prev => ({ ...prev, [key]: on }));
    if (key !== "required") return;
    // Org-required questions actually leave / return to the survey. Remember
    // which ones were required so switching back restores exactly those.
    setSurvey(sv => {
      if (!sv) return sv;
      if (!on) {
        wasRequired.current = new Set(sv.pool.filter(q => q.required).map(q => q.id));
        return { ...sv, pool: sv.pool.map(q => (q.required ? { ...q, required: false } : q)) };
      }
      const back = wasRequired.current;
      if (!back) return sv;
      return { ...sv, pool: sv.pool.map(q => (back.has(q.id) ? { ...q, required: true } : q)) };
    });
  };

  const initialHash = useRef(typeof window !== "undefined" ? window.location.hash : "");
  const [openInBuilder, setOpenInBuilder] = useState(null);

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
  const normalize = (sv) => ({ topicMeta: {}, customTopics: [], qMeta: {}, i18nEdits: {}, intro: {}, ...sv });

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
  const confirmName = (name, proj) => {
    setSurvey(normalize({ ...pending.survey, id: pending.survey.id || "d" + Date.now(), name, proj: proj || pending.survey.proj }));
    setPending(null); setChanging(false); setEditing(false); setScreen("builder");
  };
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
      const base = existing || { id: survey.id, proj: survey.proj || "Central Employee Listening", status: "Draft", resp: "—", mine: true };
      const row = { ...base, name: survey.name, proj: survey.proj || base.proj, date: "Edited just now", questions: survey.selectedIds.length, survey };
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
  // Which of the org's designs this survey wears — a plain survey property.
  const setDesign = (id) => setSurvey(s => ({ ...s, design: id }));
  // The intro screen participants see first. Survey-scoped like everything else
  // in this step; its title defaults to the survey's own name until edited.
  const updateIntro = (patch) => setSurvey(s => {
    const next = compact({ ...(s.intro || {}), ...patch });
    const touched = [];
    if ("title" in patch && (patch.title || undefined) !== ((s.intro || {}).title || undefined)) touched.push("intro:name");
    if ("desc" in patch && (patch.desc || undefined) !== ((s.intro || {}).desc || undefined)) touched.push("intro:desc");
    return { ...s, intro: next, i18nEdits: touched.length ? dropI18n(s, touched) : s.i18nEdits };
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
  // "Write your own wording": the standard question leaves the questionnaire
  // (deselected in the library — it is no longer that benchmarked question) and
  // a CUSTOM question takes its place, same text and topic to start from. Its
  // survey-scoped meta goes with it; a custom question owns its own text.
  const detachQuestion = (q, text, topic) => {
    const id = "c" + Date.now();
    setSurvey(s => {
      const qm = { ...(s.qMeta || {}) }; delete qm[q.id];
      const custom = {
        id, topic: topic || q.topic, theme: null, themes: undefined, bench: false,
        type: q.type, custom: true, required: false,
        text: text || q.text, desc: (s.qMeta || {})[q.id] ? (s.qMeta[q.id].desc || undefined) : undefined,
        options: q.options,
      };
      return {
        ...s,
        pool: [...s.pool, custom],
        selectedIds: [...s.selectedIds.filter(x => x !== q.id), id],
        qMeta: qm,
      };
    });
    // Straight into the editor — wording is the reason they detached.
    setEditCustom({ id, topic: topic || q.topic, theme: null, bench: false, type: q.type,
      custom: true, required: false, text: text || q.text, options: q.options });
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
  // "Add custom question" straight from the builder bar: the new question goes
  // into the pool and is selected immediately — no trip through the library.
  const addCustomDirect = (nq) => {
    setSurvey(s => ({ ...s, pool: [...s.pool, nq], selectedIds: [...s.selectedIds, nq.id] }));
    setNewCustom(false);
  };
  // The similar-question check found a match: select the existing question
  // instead of creating a duplicate.
  const useSuggested = (q) => {
    setSurvey(s => ({
      ...s,
      // an org-created custom question isn't in this survey's pool yet
      pool: s.pool.some(p => p.id === q.id) ? s.pool : [...s.pool, q],
      selectedIds: s.selectedIds.includes(q.id) ? s.selectedIds : [...s.selectedIds, q.id],
    }));
    setNewCustom(false);
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

  // ---- URLs for every step -------------------------------------------------
  // The current step is mirrored into the hash in the platform's own shape, so
  // any state can be linked to (see data/routes.js). Dialog state that lives in
  // the Builder is reported up via `builderDialog`.
  const appDialog = () => {
    if (modal) return { dialog: "choose-template" };
    if (pending) return { dialog: "create-draft-survey" };
    if (editing) return { dialog: "select-questions" };
    if (editCustom) return { dialog: "custom-question", arg: editCustom.id };
    if (newCustom) return { dialog: "new-custom-question" };
    if (outOfScope) return { dialog: "out-of-scope", arg: outOfScope.id };
    if (screen === "builder" && builderDialog) return builderDialog;
    return {};
  };
  const route = { screen, surveyId: survey && survey.id, ...appDialog() };
  useEffect(() => { writeRoute(route); }, [screen, survey && survey.id, modal, pending, editing, editCustom, newCustom, outOfScope, builderDialog]); // eslint-disable-line

  // Open a demo/use-case state in one step (prototype toolbar).
  const draftSurvey = () => {
    const row = surveysList.find(r => r.status === "Draft" && r.survey) || surveysList.find(r => r.survey);
    return row ? normalize(row.survey) : null;
  };
  const scratchSurvey = () => normalize({
    id: "d-demo", name: "New survey", proj: "Central Employee Listening", templateName: null,
    isTemplate: false, selectedIds: [], pool: libraryPool().map(q => ({ ...q, required: false })),
  });
  const closeAll = () => { setModal(false); setPending(null); setEditing(false); setEditCustom(null); setNewCustom(false); setOutOfScope(null); setOpenInBuilder(null); setBuilderDialog(null); };
  const gotoUseCase = (key) => {
    closeAll();
    const openBuilder = (sv, dialog) => { setSurvey(sv); setScreen("builder"); setOpenInBuilder(dialog || null); };
    switch (key) {
      case "surveys": setScreen("surveys"); break;
      case "template-dialog": setScreen("surveys"); setChanging(false); setModal(true); break;
      case "template-empty": setScreen("surveys"); setModal(true); setTimeout(() => {
        const i = document.querySelector("input.srch"); if (i) { i.focus(); }
      }, 60); break;
      case "name-dialog": {
        const base = surveyFromTemplate("sos", null, "Smart Organisation Scan");
        setScreen("surveys"); setPending({ suggested: base.templateName, survey: base }); break;
      }
      case "builder": { const sv = draftSurvey(); if (sv) openBuilder(sv); break; }
      case "builder-scratch": openBuilder(scratchSurvey()); break;
      case "select-questions": { const sv = draftSurvey(); if (sv) { setSurvey(sv); setScreen("builder"); setEditTab("questions"); setEditing(true); } break; }
      case "question-settings": { const sv = draftSurvey(); if (sv) openBuilder(sv, { dialog: "question-settings", arg: (sv.pool.find(q => !q.custom && sv.selectedIds.includes(q.id)) || {}).id }); break; }
      case "question-edited": {
        const sv = draftSurvey(); if (!sv) break;
        const q = sv.pool.find(x => x.text === "Day to day, I find my work enjoyable") || sv.pool[0];
        openBuilder({ ...sv, qMeta: { ...sv.qMeta, [q.id]: { variant: "I enjoy the work I do most days", desc: "Think about your work in general, not one exceptional day." } } },
          { dialog: "question-settings", arg: q.id });
        break;
      }
      case "topic-dialog": { const sv = draftSurvey(); if (sv) openBuilder(sv, { dialog: "topic", arg: (sv.pool.find(q => sv.selectedIds.includes(q.id)) || {}).topic }); break; }
      case "topic-custom": {
        const sv = draftSurvey(); if (!sv) break;
        const key = "ct-demo";
        openBuilder({ ...sv, customTopics: [...(sv.customTopics || []), key],
          topicMeta: { ...sv.topicMeta, [key]: { name: "Our office move", desc: "A few questions about the move to the new building." } } },
          { dialog: "topic", arg: key });
        break;
      }
      case "translations": {
        const sv = draftSurvey(); if (!sv) break;
        const first = sv.pool.find(q => sv.selectedIds.includes(q.id));
        openBuilder({ ...sv, topicMeta: { ...sv.topicMeta, [first.topic]: { name: "How you feel about your work", desc: "A short check-in on how your daily work feels." } } },
          { dialog: "translations" });
        break;
      }
      default: setScreen("surveys");
    }
  };

  // Honour the toolbar's "Start at" (and a deep link) on first load.
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return; booted.current = true;
    const fromUrl = parse(initialHash.current);
    if (fromUrl && fromUrl.screen === "builder") {
      const sv = draftSurvey(); if (sv) { setSurvey(sv); setScreen("builder");
        // App-level dialogs live outside the Builder's own dialog routing.
        if (fromUrl.dialog === "new-custom-question") setNewCustom(true);
        else if (fromUrl.dialog === "custom-question" && fromUrl.arg) {
          const q = sv.pool.find(x => x.id === fromUrl.arg); if (q) setEditCustom(q);
        }
        else if (fromUrl.dialog) setOpenInBuilder({ dialog: fromUrl.dialog, arg: fromUrl.arg }); }
      return;
    }
    if (fromUrl && fromUrl.dialog) { gotoUseCase(fromUrl.dialog === "create-draft-survey" ? "name-dialog" : fromUrl.dialog === "choose-template" ? "template-dialog" : "surveys"); return; }
    const start = getStartAt(PROTO_STORAGE_PREFIX, "surveys");
    if (start !== "surveys") gotoUseCase(start);
  }, []); // eslint-disable-line

  return (
    <div className="proto-shell">
      <PrototypeBar useCases={USE_CASES} startPoints={START_POINTS} edgeCases={EDGE_CASES} variants={VARIANTS}
        storagePrefix={PROTO_STORAGE_PREFIX}
        onUseCase={gotoUseCase} edges={edges} onToggleEdge={toggleEdge}
        varState={variantsOn} onToggleVariant={toggleVariant} />
      <div className="app">
      {screen === "surveys" && <Sidebar />}
      {screen === "surveys"
        ? <SurveysPage rows={surveysList} onCreate={() => setModal(true)} onDeleteDraft={deleteSurvey} onOpen={openSurvey} />
        : <Builder survey={survey} onDetachQuestion={detachQuestion} onEditQuestions={(tab) => { setEditTab(tab || "questions"); setEditing(true); }} onExit={() => { setScreen("surveys"); }}
            onSaveClose={saveAndClose} onRemoveQuestion={requestRemove} onEditCustom={setEditCustom}
            onRename={renameSurvey} onRemoveTopic={removeTopic} onMoveTopic={moveQuestionTopic}
            onToggleQuestion={toggleQuestion} onSetManyQuestions={setManyQuestions}
            onUpdateTopicMeta={updateTopicMeta} onAddTopic={addTopic} onUpdateQMeta={updateQMeta} onUpdateIntro={updateIntro} onSetDesign={setDesign} onNewCustom={() => setNewCustom(true)}
            onSaveTranslation={saveTranslation}
            openDialog={openInBuilder} onDialogChange={setBuilderDialog}
            onOpenTemplates={() => { setEditTab("templates"); setEditing(true); }} />}
      </div>

      {modal && <TemplateModal changing={changing} onClose={closeModal} onUse={useTemplate} onScratch={startScratch} />}
      {pending && <NameSurveyDialog suggested={pending.suggested} isTemplate={pending.survey.isTemplate}
        templateName={pending.survey.templateName} changing={changing}
        needsProject={!pending.survey.proj} project={pending.survey.proj}
        onBack={cancelName} onConfirm={confirmName} />}
      {editing && survey && (
        <EditQuestionsDialog initialPool={survey.pool} initialSelected={survey.selectedIds} tweaks={TWEAKS}
          initialTab={editTab} nav={variantsOn.dialogSidebarNav ? "sidebar" : "tabs"}
          onClose={() => setEditing(false)} onSave={saveQuestions} />
      )}
      {removeConfirm && <ThemeConfirm q={removeConfirm.q} themes={removeConfirm.themes} pool={survey && survey.pool}
        onKeep={() => setRemoveConfirm(null)}
        onRemove={() => { removeFromSurvey(removeConfirm.q); setRemoveConfirm(null); }} />}
      {newCustom && survey && <CustomQuestionDialog topics={surveyTopicOptions()} design={designById(survey.design)}
        pool={[...survey.pool, ...ORG_CUSTOM.filter(o => !survey.pool.some(p => p.id === o.id))]} selectedIds={survey.selectedIds}
        onUseSuggestion={useSuggested}
        onCancel={() => setNewCustom(false)} onAdd={addCustomDirect} />}
      {editCustom && <CustomQuestionDialog question={editCustom} design={survey ? designById(survey.design) : null}
        topics={surveyTopicOptions()}
        onCancel={() => setEditCustom(null)} onSubmit={saveCustomEdit}
        onDelete={(q) => { removeFromSurvey(q); setEditCustom(null); }} />}
      {outOfScope && <OutOfScopeDialog row={outOfScope} onClose={() => setOutOfScope(null)} />}
    </div>
  );
}
