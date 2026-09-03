// app.jsx — flow controller
import { useState, useEffect, useRef } from "react";
import { Sidebar, SurveysPage, OutOfScopeDialog } from "./components/Shell.jsx";
import { Builder } from "./components/Builder.jsx";
import { TemplateModal } from "./components/TemplateModal.jsx";
import { EditQuestionsDialog, ThemeConfirm } from "./components/EditQuestionsDialog.jsx";
import { CustomQuestionDialog } from "./components/CustomQuestionDialog.jsx";
import { NameSurveyDialog } from "./components/NameSurveyDialog.jsx";
import { themeStatus, themesOf } from "./components/shared.jsx";
import { SEED_SURVEYS, TEMPLATES, surveyFromTemplate } from "./data/data.js";
import { libraryPool } from "./data/qlib.js";
// The prototype toolbar lives at the repo root (toolbar/) so every phase —
// and any other project — can use the same one. It reads this prototype's
// settings straight from the proto-config module (config={PROTO}).
import { PrototypeBar, getStartAt } from "prototype-toolbar/PrototypeBar.jsx";
import { VERSIONS } from "../../prototype-versions.js";
import * as PROTO from "./data/proto-config.js";

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
  const confirmName = (name) => { setSurvey({ ...pending.survey, id: pending.survey.id || "d" + Date.now(), name }); setPending(null); setChanging(false); setEditing(false); setScreen("builder"); };
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
      setSurvey(sv); setEditing(false); setScreen("builder");
    } else {
      setOutOfScope(row);
    }
  };

  // ---- Prototype toolbar wiring ------------------------------------------
  // Design variants (toolbar): flip between candidate designs live.
  const [variantsOn, setVariantsOn] = useState(PROTO.defaultVariants);
  const toggleVariant = (key) => setVariantsOn(v => ({ ...v, [key]: !v[key] }));
  // Edge-case switches. "required" is not cosmetic: the org-required questions
  // actually leave / return to the current survey.
  const [edges, setEdges] = useState(PROTO.defaultEdges);
  // Which questions were org-required before the switch went off, so the
  // toggle round-trips exactly instead of guessing.
  const wasRequired = useRef(null);
  const toggleEdge = (key) => {
    const on = !edges[key];
    setEdges(prev => ({ ...prev, [key]: on }));
    if (key !== "required") return;
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

  // Jump to a state (the toolbar's Use cases menu + the remembered start
  // point). Resets every layer first, then builds the requested one.
  const gotoUseCase = (key) => {
    setModal(false); setPending(null); setEditing(false); setEditCustom(null);
    setRemoveConfirm(null); setOutOfScope(null); setChanging(false);
    const t = TEMPLATES[0];
    const templateSurvey = () => ({ ...surveyFromTemplate(t.id, null, t.name), id: "uc-" + t.id, name: t.name });
    switch (key) {
      case "template-dialog": setScreen("surveys"); setModal(true); break;
      case "name-dialog": setScreen("surveys"); setPending({ suggested: t.name, survey: surveyFromTemplate(t.id, null, t.name) }); break;
      case "builder": setSurvey(templateSurvey()); setScreen("builder"); break;
      case "builder-scratch": {
        const pool = libraryPool().map(q => ({ ...q, required: false }));
        setSurvey({ id: "uc-scratch", name: "Untitled survey", templateName: null, isTemplate: false, selectedIds: [], pool });
        setScreen("builder");
        break;
      }
      case "select-questions": setSurvey(templateSurvey()); setScreen("builder"); setEditTab("questions"); setEditing(true); break;
      default: setScreen("surveys");
    }
  };

  // Open at the remembered start point (the toolbar's Start at menu).
  useEffect(() => {
    const start = getStartAt(PROTO.PROTO_STORAGE_PREFIX, "surveys");
    if (start && start !== "surveys") gotoUseCase(start);
  }, []); // eslint-disable-line

  const saveQuestions = (ids, pool) => { setSurvey(s => ({ ...s, selectedIds: ids, pool })); setEditing(false); };
  // Add/remove a theme's questions from the builder's "View details" dialog.
  const toggleQuestion = (id) => setSurvey(s => ({ ...s, selectedIds: s.selectedIds.includes(id) ? s.selectedIds.filter(x => x !== id) : [...s.selectedIds, id] }));
  const setManyQuestions = (ids, on) => setSurvey(s => { const set = new Set(s.selectedIds); ids.forEach(id => on ? set.add(id) : set.delete(id)); return { ...s, selectedIds: [...set] }; });
  // Custom questions may be reassigned to another topic (via drag or their menu).
  const moveCustomTopic = (id, topic) => setSurvey(s => ({ ...s, pool: s.pool.map(p => p.id === id ? { ...p, topic } : p) }));

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
  const saveCustomEdit = (q) => { setSurvey(s => ({ ...s, pool: s.pool.map(p => p.id === q.id ? q : p) })); setEditCustom(null); };
  const renameSurvey = (newName) => setSurvey(s => ({ ...s, name: newName }));
  // Remove a whole topic from this questionnaire: deselect all its questions
  // (and drop any custom ones from the pool). Library + benchmarks are untouched.
  const removeTopic = (ids) => setSurvey(s => {
    const idset = new Set(ids);
    const reqKept = new Set(s.pool.filter(p => p.required).map(p => p.id)); // required questions stay
    return {
      ...s,
      selectedIds: s.selectedIds.filter(id => !idset.has(id) || reqKept.has(id)),
      pool: s.pool.filter(p => !(p.custom && idset.has(p.id))),
    };
  });

  return (
    <div className="proto-shell">
      <PrototypeBar config={PROTO} versions={VERSIONS}
        onUseCase={gotoUseCase} edges={edges} onToggleEdge={toggleEdge}
        varState={variantsOn} onToggleVariant={toggleVariant} />
      <div className="app">
      {screen === "surveys" && <Sidebar />}
      {screen === "surveys"
        ? <SurveysPage rows={surveysList} onCreate={() => setModal(true)} onDeleteDraft={deleteSurvey} onOpen={openSurvey} />
        : <Builder survey={survey} showTemplateTags={variantsOn.templateTags}
            onEditQuestions={() => { setEditTab("questions"); setEditing(true); }} onExit={() => { setScreen("surveys"); }}
            onSaveClose={saveAndClose} onRemoveQuestion={requestRemove} onEditCustom={setEditCustom}
            onRename={renameSurvey} onRemoveTopic={removeTopic} onMoveTopic={moveCustomTopic}
            onToggleQuestion={toggleQuestion} onSetManyQuestions={setManyQuestions}
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
        topics={survey ? [...new Set(survey.pool.filter(x => survey.selectedIds.includes(x.id) && x.topic).map(x => x.topic))] : undefined}
        onCancel={() => setEditCustom(null)} onSubmit={saveCustomEdit}
        onDelete={(q) => { removeFromSurvey(q); setEditCustom(null); }} />}
      {outOfScope && <OutOfScopeDialog row={outOfScope} onClose={() => setOutOfScope(null)} />}
      </div>
    </div>
  );
}
