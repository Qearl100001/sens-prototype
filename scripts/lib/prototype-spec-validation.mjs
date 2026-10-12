import Ajv2020 from 'ajv/dist/2020.js';

const postIntakeStages = new Set(['ready', 'generated', 'checked']);
const requiredReadinessChecks = [
  'pageBoundaries',
  'entryAndReturn',
  'coreStates',
  'mainFlow',
  'exceptionFlow',
  'dataAndContent',
  'scope',
  'designSystem',
  'acceptancePlan',
];

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

function checkRefs(errors, owner, refs, available, kind) {
  for (const ref of refs ?? []) {
    if (!available.has(ref)) errors.push(`${owner}: unknown ${kind} ${ref}`);
  }
}

export function createSchemaValidator(schema) {
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
  return ajv.compile(schema);
}

export function validatePrototypeSpec(spec, schemaValidator) {
  const errors = [];
  if (!schemaValidator(spec)) {
    errors.push(...schemaValidator.errors.map((error) => `schema ${error.instancePath || '/'} ${error.message}`));
    return errors;
  }

  const sourceIds = spec.sources.map((item) => item.id);
  const actorIds = spec.actors.map((item) => item.id);
  const taskIds = spec.coreTasks.map((item) => item.id);
  const requirementIds = spec.requirements.map((item) => item.id);
  const pageIds = spec.pages.map((item) => item.id);
  const questionIds = spec.questions.map((item) => item.id);
  const interactionIds = spec.interactions.map((item) => item.id);
  const stateIds = spec.pages.flatMap((page) => page.states.map((state) => state.id));
  const sources = new Set(sourceIds);
  const actors = new Set(actorIds);
  const requirements = new Set(requirementIds);
  const pages = new Set(pageIds);
  const questions = new Set(questionIds);
  const interactions = new Set(interactionIds);
  const states = new Set(stateIds);

  for (const [kind, values] of [
    ['source id', sourceIds],
    ['actor id', actorIds],
    ['core task id', taskIds],
    ['requirement id', requirementIds],
    ['page id', pageIds],
    ['question id', questionIds],
    ['interaction id', interactionIds],
    ['state id', stateIds],
  ]) {
    for (const value of duplicates(values)) errors.push(`duplicate ${kind}: ${value}`);
  }

  for (const actor of spec.actors) checkRefs(errors, `actor ${actor.id}`, actor.sourceRefs, sources, 'sourceRef');
  for (const task of spec.coreTasks) {
    checkRefs(errors, `coreTask ${task.id}`, task.actorRefs, actors, 'actorRef');
    checkRefs(errors, `coreTask ${task.id}`, task.pageRefs, pages, 'pageRef');
    checkRefs(errors, `coreTask ${task.id}`, task.requirementRefs, requirements, 'requirementRef');
    checkRefs(errors, `coreTask ${task.id}`, task.sourceRefs, sources, 'sourceRef');
  }

  const iaPageIds = new Set();
  for (const node of spec.informationArchitecture.nodes) {
    iaPageIds.add(node.pageId);
    checkRefs(errors, `informationArchitecture ${node.pageId}`, [node.pageId], pages, 'pageId');
    if (node.parentPageId) checkRefs(errors, `informationArchitecture ${node.pageId}`, [node.parentPageId], pages, 'parentPageId');
    if (node.returnTargetPageId) checkRefs(errors, `informationArchitecture ${node.pageId}`, [node.returnTargetPageId], pages, 'returnTargetPageId');
    checkRefs(errors, `informationArchitecture ${node.pageId}`, node.sourceRefs, sources, 'sourceRef');
  }
  for (const pageId of pages) {
    if (!iaPageIds.has(pageId)) errors.push(`informationArchitecture: page ${pageId} has no node`);
  }

  for (const requirement of spec.requirements) {
    checkRefs(errors, `requirement ${requirement.id}`, requirement.sourceRefs, sources, 'sourceRef');
    checkRefs(errors, `requirement ${requirement.id}`, requirement.questionRefs, questions, 'questionRef');
    if (requirement.basis === 'inferred') {
      if (!requirement.category) errors.push(`requirement ${requirement.id}: inferred requirement needs category`);
      if (!requirement.readinessImpact) errors.push(`requirement ${requirement.id}: inferred requirement needs readinessImpact`);
      if (!requirement.questionRefs?.length) errors.push(`requirement ${requirement.id}: inferred requirement needs questionRefs`);
      if (postIntakeStages.has(spec.stage) && requirement.readinessImpact === 'blocking') {
        errors.push(`requirement ${requirement.id}: blocking inferred requirement cannot enter ${spec.stage}`);
      }
    }
  }

  for (const page of spec.pages) {
    if (!page.states.length) errors.push(`page ${page.id}: states must not be empty`);
  }
  for (const interaction of spec.interactions) {
    checkRefs(errors, `interaction ${interaction.id}`, [interaction.pageId], pages, 'pageId');
    checkRefs(errors, `interaction ${interaction.id}`, [interaction.fromState, interaction.toState], states, 'state');
    checkRefs(errors, `interaction ${interaction.id}`, interaction.requirementRefs, requirements, 'requirementRef');
  }
  for (const flow of spec.flows) {
    checkRefs(errors, `flow ${flow.id}`, flow.actorRefs, actors, 'actorRef');
    checkRefs(errors, `flow ${flow.id}`, [flow.entryPageId], pages, 'entryPageId');
    checkRefs(errors, `flow ${flow.id}`, flow.interactionRefs, interactions, 'interactionRef');
    checkRefs(errors, `flow ${flow.id}`, flow.sourceRefs, sources, 'sourceRef');
  }
  for (const validation of spec.validations) {
    checkRefs(errors, `validation ${validation.id}`, [validation.pageId], pages, 'pageId');
    checkRefs(errors, `validation ${validation.id}`, validation.requirementRefs, requirements, 'requirementRef');
  }
  for (const question of spec.questions) checkRefs(errors, `question ${question.id}`, question.sourceRefs, sources, 'sourceRef');
  for (const criterion of spec.acceptanceCriteria) {
    checkRefs(errors, `acceptanceCriterion ${criterion.id}`, criterion.requirementRefs, requirements, 'requirementRef');
  }
  for (const mapping of spec.designSystem.mappings) {
    checkRefs(errors, `designSystem mapping ${mapping.pageId}/${mapping.region}`, [mapping.pageId], pages, 'pageId');
    checkRefs(errors, `designSystem mapping ${mapping.pageId}/${mapping.region}`, mapping.ruleSourceRefs, sources, 'sourceRef');
  }
  for (const field of ['templateRefs', 'compositeRefs']) {
    for (const ref of spec.designSystem[field] ?? []) checkRefs(errors, `designSystem ${field}`, [ref.pageId], pages, 'pageId');
  }

  checkRefs(errors, 'readiness', spec.readiness.sourceRefs, sources, 'sourceRef');
  for (const [name, check] of Object.entries(spec.readiness.checks)) {
    checkRefs(errors, `readiness ${name}`, check.sourceRefs, sources, 'sourceRef');
  }

  if (postIntakeStages.has(spec.stage)) {
    if (spec.readiness.decision !== 'confirmed') errors.push(`${spec.stage}: readiness.decision must be confirmed`);
    if (!spec.readiness.confirmedBy || !spec.readiness.confirmedAt || !spec.readiness.sourceRefs.length) {
      errors.push(`${spec.stage}: readiness confirmation record is incomplete`);
    }
    for (const name of requiredReadinessChecks) {
      const check = spec.readiness.checks[name];
      if (check.status === 'pending') errors.push(`${spec.stage}: readiness check ${name} is pending`);
      if (check.status === 'confirmed' && !check.sourceRefs.length) errors.push(`${spec.stage}: readiness check ${name} needs sourceRefs`);
    }
    if (!spec.flows.some((flow) => flow.kind === 'main')) errors.push(`${spec.stage}: at least one main flow is required`);
    for (const question of spec.questions) {
      if (question.blocking && question.status === 'open') errors.push(`${spec.stage}: blocking question ${question.id} is open`);
    }
  }

  if (spec.review.designStatus === 'approved_with_followups' && !spec.review.designerDecision?.includes('approved_with_followups')) {
    errors.push('approved_with_followups needs a matching designerDecision');
  }

  return errors;
}
