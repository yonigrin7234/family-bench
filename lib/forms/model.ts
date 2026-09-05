import { isCalendarDate } from '../utils/dateInput';

export type CourtFormId = 'mc031' | 'fl300';
export type CourtFormValues = Record<string, string | boolean>;
export type CourtFormDraft = {
  id: string; userId: string; caseId: string; formId: CourtFormId; values: CourtFormValues;
  sourceEntryIds: string[]; createdAt: string; updatedAt: string;
};
export type FormField = { id: string; label: string; pdfFields: string[]; kind: 'text' | 'check'; required?: boolean; multiline?: boolean; date?: boolean; help?: string };
export type FormSection = { id: string; title: string; help?: string; fields: FormField[] };
const text = (id: string, label: string, pdfFields: string | string[], extra: Partial<FormField> = {}): FormField => ({ id, label, pdfFields: typeof pdfFields === 'string' ? [pdfFields] : pdfFields, kind: 'text', ...extra });
const check = (id: string, label: string, pdfFields: string | string[]): FormField => ({ id, label, pdfFields: typeof pdfFields === 'string' ? [pdfFields] : pdfFields, kind: 'check' });
const p = (page: number, field: string) => `FL-300[0].Page${page}[0].${field}`;
const parties = (name: string) => [p(1, `TitlePartyName[0].${name}[0]`), ...[2, 3, 4].map((page) => p(page, `Parties[0].${name}[0]`))];
const court = (name: string) => p(1, `CourtInfo[0].${name}[0]`);
const contact = (name: string) => p(1, `AttyInfo[0].${name}[0]`);

export const MC031_SECTIONS: FormSection[] = [
  { id: 'caption', title: 'Case caption', fields: [text('petitioner', 'Plaintiff / petitioner', 'FillText10', { required: true }), text('respondent', 'Defendant / respondent', 'FillText9', { required: true }), text('caseNumber', 'Case number', 'FillText11', { required: true })] },
  { id: 'declaration', title: 'Your declaration', help: 'MC-031 is an attached declaration. It must accompany another form or court paper. Write your own facts; review any source text you insert.', fields: [text('declaration', 'Declaration text', 'FillText8', { required: true, multiline: true })] },
  { id: 'declarant', title: 'Declarant and review', help: 'The generated PDF remains unsigned. Review the complete form and follow the court’s signing and filing instructions. A typed name here fills the printed-name field only.', fields: [text('declarantName', 'Type or print name', 'FillText7', { required: true }), text('declarationDate', 'Date (optional until signing)', 'FillText14', { date: true }), check('rolePetitioner', 'Petitioner', 'CheckBx6'), check('roleRespondent', 'Respondent', 'Chck6'), check('rolePlaintiff', 'Plaintiff', 'CheckBox6'), check('roleDefendant', 'Defendant', 'ChckBox6'), check('roleOther', 'Other', 'Ck6'), text('otherRole', 'Other role — specify', 'FillText13')] },
];

export const FL300_SECTIONS: FormSection[] = [
  { id: 'caption', title: 'Case caption and contact', help: 'Confirm each field against your case documents. Use a mailing address appropriate for your court papers; this form does not automatically suppress confidential information.', fields: [
    text('petitioner', 'Petitioner', parties('Petitioner_1_ft'), { required: true }), text('respondent', 'Respondent', parties('Respondent_ft'), { required: true }), text('otherParent', 'Other parent / party (optional)', parties('OtherParentPart_ft')),
    text('caseNumber', 'Case number', [1, 2, 3, 4].map((page) => p(page, 'CaseNumber[0].CaseNumber_ft[0]')), { required: true }),
    text('declarantName', 'Your name — party without attorney', contact('AttyName_ft'), { required: true }),
    text('street', 'Your street / mailing address', contact('AttyStreet_ft')), text('city', 'Your city', contact('AttyCity_ft')), text('state', 'Your state', contact('AttyState_ft')), text('zip', 'Your ZIP code', contact('AttyZip_ft')), text('phone', 'Telephone', contact('Phone_ft')), text('email', 'Email', contact('Email_ft')),
  ] },
  { id: 'court', title: 'Court and notice recipient', help: 'Hearing details, court orders and the judicial signature are left blank for the court. This app does not schedule a hearing or serve documents.', fields: [
    text('county', 'Superior Court of California — county', court('CrtCounty_ft'), { required: true }), text('courtStreet', 'Court street address', court('Street_ft')), text('courtMailing', 'Court mailing address', court('MailingAdd_ft')), text('courtCityZip', 'Court city and ZIP', court('CityZip_ft')), text('courtBranch', 'Court branch name', court('Branch_ft')),
    text('noticeTo', 'Notice of hearing — to (names)', p(1, 'List1[0].Li1[0].NameOfParty_ft[0]')),
    check('noticePetitioner', 'Notice recipient is petitioner', p(1, 'List1[0].Li1[0].Petitioner_cb1[0]')), check('noticeRespondent', 'Notice recipient is respondent', p(1, 'List1[0].Li1[0].Petitioner_cb2[0]')), check('noticeOtherParent', 'Notice recipient is other parent / party', p(1, 'List1[0].Li1[0].Petitioner_cb3[0]')),
  ] },
  { id: 'requests', title: 'Orders you are requesting', help: 'Choose the requests you have decided to make. This guided version fills custody, parenting time and other-order requests. Support, property, fees and emergency requests require additional sections/attachments; use the full official form for those requests.', fields: [
    check('requestCustody', 'Child custody', [p(1, 'FormTitle[0].ChildCustody_cb[0]'), p(2, 'List2[0].CheckBoxCC[0]'), p(2, 'List2[0].Li2[0].CheckBoxCC[0]')]),
    check('requestVisitation', 'Visitation (parenting time)', [p(1, 'FormTitle[0].ChildCustody_cb[1]'), p(2, 'List2[0].CheckBoxvisit[0]'), p(2, 'List2[0].Li2[0].CheckBox61[0]')]),
    check('requestOther', 'Other orders', [p(1, 'FormTitle[0].other_cb[0]'), p(4, 'List7[0].Li1[0].CheckBox1[0]')]),
    text('otherRequestTitle', 'Other request — brief description on page 1', p(1, 'FormTitle[0].OtherSpecify_ft[0]')),
    text('otherOrders', 'Other orders requested — item 7', p(4, 'List7[0].Li1[0].OtherRelief_ft[0]'), { multiline: true }),
  ] },
  { id: 'restraining', title: 'Existing protective orders — item 1', help: 'Record existing orders from your documents. Leaving boxes blank does not ask the app to determine whether an order exists or applies.', fields: [
    check('hasRestrainingOrders', 'One or more restraining / protective orders are now in effect', p(2, 'List1[0].CheckBox1[0]')), check('restrainingPetitioner', 'Orders involve petitioner', p(2, 'List1[0].CheckBox2[0]')), check('restrainingRespondent', 'Orders involve respondent', p(2, 'List1[0].CheckBox3[0]')), check('restrainingOtherParent', 'Orders involve other parent / party', p(2, 'List1[0].CheckBox61[0]')),
    ...(['Criminal', 'Family', 'Juvenile', 'Other'] as const).flatMap((kind, i) => {
      const part = `List1[0].Li${i + 1}[0].`; const label = kind.toLowerCase();
      const fieldPrefix = kind === 'Criminal' ? 'CriminalProtectiveOrders' : `${kind}CourtRestrainingOrders`;
      return [check(`${label}Order`, `${kind} court order`, p(2, `${part}CheckBox61[0]`)), text(`${label}OrderCounty`, `${kind} — county and state`, p(2, `${part}${fieldPrefix}_CountyState_ft[0]`)), text(`${label}OrderCase`, `${kind} — case number, if known`, p(2, `${part}${fieldPrefix}_CaseNo_ft[0]`))];
    }),
  ] },
  { id: 'children', title: 'Children and requested custody — item 2a', help: 'Enter only the children covered by this request. State the legal/physical custody arrangement you are requesting in your own words. This form has four child rows; additional children require an attachment reviewed outside this initial workflow.', fields: [
    check('requestLegalCustody', 'Request concerns legal custody', p(2, 'List2[0].Li1[0].LegalCustody_cb[0]')), check('requestPhysicalCustody', 'Request concerns physical custody', p(2, 'List2[0].Li1[0].PhysicalCustody_cb[0]')),
    ...[1, 2, 3, 4].flatMap((i) => [text(`child${i}Name`, `Child ${i} — name`, p(2, `List2[0].Li1[0].Child${i}Name_ft[0]`)), text(`child${i}BirthDate`, `Child ${i} — date of birth`, p(2, `List2[0].Li1[0].Child${i}BirthDate_dt[0]`), { date: true }), text(`child${i}Legal`, `Child ${i} — legal custody requested to`, p(2, `List2[0].Li1[0].Child${i}LegalCustody_ft[0]`)), text(`child${i}Physical`, `Child ${i} — physical custody requested to`, p(2, `List2[0].Li1[0].Child${i === 4 ? 5 : i}PhysicalCustody_ft[0]`))]),
  ] },
  { id: 'custody', title: 'Your requested orders and reasons — items 2b–2c', fields: [
    text('custodyOrders', 'The orders you request for custody / parenting time', p(2, 'List2[0].Li2[0].List[0].Li2[0].ReasonForOrders_ft[0]'), { multiline: true }),
    text('childrenReasons', 'Why you request these orders for the children', p(2, 'List2[0].Li3[0].ReasonForOrders_ft[0]'), { multiline: true }),
  ] },
  { id: 'changes', title: 'Changing an existing order — item 2d', help: 'Complete this section only for an existing order you intend to change. The app does not decide whether a change is appropriate.', fields: [
    check('changeOrder', 'This request changes an existing order', [p(1, 'FormTitle[0].modify_cb[0]'), p(3, 'List2Cont[0].Li1[0].CheckBoxchangeorder[0]')]),
    check('changeCustody', 'Change current child custody order', [p(3, 'List2Cont[0].Li1[0].CheckBoxCC[0]'), p(3, 'List2Cont[0].Li1[0].List[0].Li1[0].CheckBox61[0]')]),
    text('custodyOrderDate', 'Current custody order — date filed', p(3, 'List2Cont[0].Li1[0].List[0].Li1[0].FileDateChildCustodyOrderFiled\\.dt[0]'), { date: true }),
    text('custodyOrderCurrent', 'What the current custody order says', p(3, 'List2Cont[0].Li1[0].List[0].Li1[0].ChildCustodyOrderDetails_ft[0]'), { multiline: true }),
    check('changeVisitation', 'Change current parenting-time order', [p(3, 'List2Cont[0].Li1[0].CheckBoxVisit[0]'), p(3, 'List2Cont[0].Li1[0].List[0].Li2[0].CheckBox61[0]')]),
    text('visitationOrderDate', 'Current parenting-time order — date filed', p(3, 'List2Cont[0].Li1[0].List[0].Li2[0].VisitaionOrderFileDate_dt[0]'), { date: true }),
    text('visitationOrderCurrent', 'What the current parenting-time order says', p(3, 'List2Cont[0].Li1[0].List[0].Li2[0].VisitationOrderDetails_ft[0]'), { multiline: true }),
  ] },
  { id: 'facts', title: 'Facts supporting your requests — item 9', help: 'Use facts you can review and explain. Text that does not fit stops generation; it is never silently truncated. Additional attachments are a separate review task.', fields: [
    text('supportingFacts', 'Facts supporting the orders you request', p(4, 'List9[0].Li1[0].ReasonForChange_ft[0]'), { required: true, multiline: true }),
    text('declarationDate', 'Date (optional until signing)', p(4, 'signsub[0].SigDate[0]'), { date: true }),
    text('printedName', 'Type or print name — page 4', p(4, 'signsub[0].TypePrintName_ft[0]'), { required: true }),
  ] },
];

export function courtFormSections(formId: CourtFormId): FormSection[] {
  if (formId !== 'mc031' && formId !== 'fl300') throw new Error('This court form is not supported.');
  return formId === 'mc031' ? MC031_SECTIONS : FL300_SECTIONS;
}
export function sanitizeCourtFormValues(formId: CourtFormId, input: unknown): CourtFormValues {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Form values are invalid.');
  const source = input as Record<string, unknown>; const output: CourtFormValues = {};
  for (const field of courtFormSections(formId).flatMap((section) => section.fields)) {
    const value = source[field.id];
    if (value === undefined) continue;
    if (field.kind === 'check') { if (typeof value !== 'boolean') throw new Error(`${field.label}: expected a checkbox value.`); output[field.id] = value; }
    else { if (typeof value !== 'string' || value.length > 20_000) throw new Error(`${field.label}: enter text under 20,000 characters.`); output[field.id] = value.replace(/\r\n?/g, '\n').trim(); }
  }
  return output;
}

export function validateCourtFormValues(formId: CourtFormId, input: unknown): CourtFormValues {
  const values = sanitizeCourtFormValues(formId, input);
  for (const field of courtFormSections(formId).flatMap((section) => section.fields)) {
    const value = values[field.id];
    if (field.required && (typeof value !== 'string' || !value.trim())) throw new Error(`${field.label} is required for this workflow.`);
    if (field.date && value && (typeof value !== 'string' || !isCalendarDate(value))) throw new Error(`${field.label}: enter a real date in YYYY-MM-DD format.`);
  }
  if (formId === 'mc031') {
    const roles = ['rolePetitioner', 'roleRespondent', 'rolePlaintiff', 'roleDefendant', 'roleOther'].filter((key) => values[key]);
    if (roles.length !== 1) throw new Error('Choose one declarant role.');
    if (values.roleOther && !values.otherRole) throw new Error('Specify the other declarant role.');
    if (values.otherRole && !values.roleOther) throw new Error('Select Other to include the other declarant role.');
  } else {
    if (!values.requestCustody && !values.requestVisitation && !values.requestOther) throw new Error('Choose at least one supported request type.');
    if ((values.requestCustody || values.requestVisitation) && (!values.child1Name || !values.custodyOrders || !values.childrenReasons)) throw new Error('Custody / parenting time requests need a child, requested orders, and your reasons.');
    if (values.requestOther && (!values.otherRequestTitle || !values.otherOrders)) throw new Error('Describe the other orders you request on pages 1 and 4.');
    if (!values.requestOther && (values.otherRequestTitle || values.otherOrders)) throw new Error('Select Other orders to include that request text.');
    for (const i of [1, 2, 3, 4]) {
      if (!values[`child${i}Name`] && ['BirthDate', 'Legal', 'Physical'].some((suffix) => values[`child${i}${suffix}`])) throw new Error(`Child ${i}: enter a name for this child’s details.`);
    }
    if (!values.requestCustody && !values.requestVisitation && (values.child1Name || values.custodyOrders || values.childrenReasons || values.requestLegalCustody || values.requestPhysicalCustody)) throw new Error('Select custody or parenting time to include the item 2 information.');
    for (const kind of ['criminal', 'family', 'juvenile', 'other']) {
      if (values[`${kind}Order`] && (!values.hasRestrainingOrders || !values[`${kind}OrderCounty`])) throw new Error('An existing protective order needs the item 1 checkbox and its county and state.');
      if (!values[`${kind}Order`] && (values[`${kind}OrderCounty`] || values[`${kind}OrderCase`])) throw new Error('Select the protective-order court type for the details you entered.');
    }
    if (!values.hasRestrainingOrders && (values.restrainingPetitioner || values.restrainingRespondent || values.restrainingOtherParent)) throw new Error('Mark item 1 to include the parties involved in existing protective orders.');
    if (values.changeOrder && !values.changeCustody && !values.changeVisitation) throw new Error('Identify the existing custody or parenting-time order being changed.');
    if ((values.changeCustody || values.changeVisitation) && !values.changeOrder) throw new Error('Mark this as a change to an existing order.');
    if (values.changeCustody && (!values.requestCustody || !values.custodyOrderDate || !values.custodyOrderCurrent)) throw new Error('A custody change needs the request, current order date and current order details.');
    if (values.changeVisitation && (!values.requestVisitation || !values.visitationOrderDate || !values.visitationOrderCurrent)) throw new Error('A parenting-time change needs the request, current order date and current order details.');
  }
  return values;
}

export function mappedPdfValues(formId: CourtFormId, input: unknown): Record<string, string | boolean> {
  const values = validateCourtFormValues(formId, input); const mapped: Record<string, string | boolean> = {};
  for (const field of courtFormSections(formId).flatMap((section) => section.fields)) for (const name of field.pdfFields) {
    const value = values[field.id] ?? (field.kind === 'check' ? false : '');
    mapped[name] = field.date && typeof value === 'string' && value ? `${value.slice(5, 7)}/${value.slice(8, 10)}/${value.slice(0, 4)}` : value;
  }
  if (formId === 'fl300') {
    const custody = Boolean(values.requestCustody || values.requestVisitation);
    mapped[p(2, 'List2[0].Li2[0].CheckBox2b[0]')] = custody;
    mapped[p(2, 'List2[0].Li2[0].List[0].Li2[0].CheckBoxfollow[0]')] = custody;
    mapped[p(4, 'List9[0].Li1[0].CheckBox1[0]')] = true;
  }
  return mapped;
}
