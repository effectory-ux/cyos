// app.jsx — flow controller
import { useState } from "react";
import { Sidebar, SurveysPage, OutOfScopeDialog } from "./components/Shell.jsx";
import { Builder } from "./components/Builder.jsx";
import { TemplateModal } from "./components/TemplateModal.jsx";
import { EditQuestionsDialog, ThemeConfirm } from "./components/EditQuestionsDialog.jsx";
import { CustomQuestionDialog } from "./components/CustomQuestionDialog.jsx";
import { NameSurveyDialog } from "./components/NameSurveyDialog.jsx";
import { themeStatus } from "./components/shared.jsx";
import { POOL, SEED_SURVEYS } from "./data/data.js";
import { libraryPool } from "./data/qlib.js";

// Behaviour the design iterations landed on: removing the last question of a
// complete theme soft-locks (asks first), and "Add custom question" lives in
// the Add-questions toolbar.
const TWEAKS = { integrity: "lock", customEntry: "toolbar" };

export function App() {
  const [screen, setScreen] = useState("surveys");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(false);
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

  const useTemplate = (tmpl) => {
    // Template's curated questions are pre-selected; the rest of the shared
    // library comes along (unselected) so there's plenty more to add.
    const pool = [...POOL.map(q => ({ ...q })), ...libraryPool()];
    const selectedIds = pool.filter(q => q.tmpl).map(q => q.id);
    setPending({ suggested: tmpl.name, survey: { templateName: tmpl.name, isTemplate: true, selectedIds, pool } });
    setModal(false);
  };
  const startScratch = () => {
    setPending({ suggested: "", survey: { templateName: null, isTemplate: false, selectedIds: [], pool: [...POOL.map(q => ({ ...q })), ...libraryPool()] } });
    setModal(false);
  };
  // Commit the named survey (with a stable id) and open the builder.
  const confirmName = (name) => { setSurvey({ ...pending.survey, id: "d" + Date.now(), name }); setPending(null); setEditing(false); setScreen("builder"); };
  // Back out of naming → return to template selection.
  const cancelName = () => { setPending(null); setModal(true); };

  // Save & close: upsert the current survey into the list, then return to the
  // Surveys landing page. New surveys are saved as Drafts; editing an existing
  // row preserves its status (e.g. a Planned survey stays Planned). The full
  // survey state is stashed on the row so reopening keeps the edits.
  const saveAndClose = () => {
    setSurveysList(list => {
      const existing = list.find(r => r.id === survey.id);
      const base = existing || { id: survey.id, proj: "Company-wide", status: "Draft", resp: "—" };
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
      setSurvey(row.survey || { id: row.id, name: row.name, templateName: null, isTemplate: false,
        selectedIds: POOL.filter(q => q.tmpl).map(q => q.id), pool: POOL.map(q => ({ ...q })) });
      setEditing(false); setScreen("builder");
    } else {
      setOutOfScope(row);
    }
  };

  const saveQuestions = (ids, pool) => { setSurvey(s => ({ ...s, selectedIds: ids, pool })); setEditing(false); };

  // Remove a question from THIS questionnaire (library questions are only
  // deselected; custom questions are deleted from the pool entirely).
  const removeFromSurvey = (q) => setSurvey(s => ({
    ...s,
    selectedIds: s.selectedIds.filter(id => id !== q.id),
    pool: q.custom ? s.pool.filter(p => p.id !== q.id) : s.pool,
  }));
  // Removing the last question of a complete theme breaks its composite score —
  // surface the positive “keep it complete” dialog first (when soft-lock is on).
  const requestRemove = (q) => {
    const complete = q.theme && TWEAKS.integrity === "lock" && themeStatus(survey.selectedIds).find(x => x.name === q.theme)?.complete;
    if (complete) { setRemoveConfirm(q); return; }
    removeFromSurvey(q);
  };
  const saveCustomEdit = (q) => { setSurvey(s => ({ ...s, pool: s.pool.map(p => p.id === q.id ? q : p) })); setEditCustom(null); };
  const renameSurvey = (newName) => setSurvey(s => ({ ...s, name: newName }));
  // Remove a whole topic from this questionnaire: deselect all its questions
  // (and drop any custom ones from the pool). Library + benchmarks are untouched.
  const removeTopic = (ids) => setSurvey(s => ({
    ...s,
    selectedIds: s.selectedIds.filter(id => !ids.includes(id)),
    pool: s.pool.filter(p => !(p.custom && ids.includes(p.id))),
  }));

  return (
    <div className="app">
      {screen === "surveys" && <Sidebar />}
      {screen === "surveys"
        ? <SurveysPage rows={surveysList} onCreate={() => setModal(true)} onDeleteDraft={deleteSurvey} onOpen={openSurvey} />
        : <Builder survey={survey} onEditQuestions={() => setEditing(true)} onExit={() => { setScreen("surveys"); }}
            onSaveClose={saveAndClose} onRemoveQuestion={requestRemove} onEditCustom={setEditCustom}
            onRename={renameSurvey} onRemoveTopic={removeTopic} />}

      {modal && <TemplateModal onClose={() => setModal(false)} onUse={useTemplate} onScratch={startScratch} />}
      {pending && <NameSurveyDialog suggested={pending.suggested} isTemplate={pending.survey.isTemplate}
        templateName={pending.survey.templateName} onBack={cancelName} onConfirm={confirmName} />}
      {editing && survey && (
        <EditQuestionsDialog initialPool={survey.pool} initialSelected={survey.selectedIds} tweaks={TWEAKS}
          onClose={() => setEditing(false)} onSave={saveQuestions} />
      )}
      {removeConfirm && <ThemeConfirm q={removeConfirm}
        onKeep={() => setRemoveConfirm(null)}
        onRemove={() => { removeFromSurvey(removeConfirm); setRemoveConfirm(null); }} />}
      {editCustom && <CustomQuestionDialog question={editCustom}
        topics={survey ? [...new Set(survey.pool.filter(x => survey.selectedIds.includes(x.id) && x.topic).map(x => x.topic))] : undefined}
        onCancel={() => setEditCustom(null)} onSubmit={saveCustomEdit}
        onDelete={(q) => { removeFromSurvey(q); setEditCustom(null); }} />}
      {outOfScope && <OutOfScopeDialog row={outOfScope} onClose={() => setOutOfScope(null)} />}
    </div>
  );
}
