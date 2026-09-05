import type { CourtFormValues } from '../model';

/** Synthetic QA inputs only. These are not a recommended request or real case. */
export const DECLARATION_FIXTURE: CourtFormValues = {
  petitioner: 'Alex Rivera', respondent: 'Morgan Rivera', caseNumber: 'TEST-2026-001',
  declaration: 'SYNTHETIC TEST DOCUMENT — NOT FOR FILING\n\nOn September 4, 2026, I arrived at the school entrance at 3:00 p.m. I waited until 3:20 p.m.\n\nAt 3:20 p.m., I received a text message stating that the pickup location had changed. I recorded the message in my journal.\n\nI have reviewed this statement and the dates above. FINAL DECLARATION SENTINEL.',
  declarantName: 'Alex Rivera', declarationDate: '2026-09-05', rolePetitioner: true,
};

export const REQUEST_FIXTURE: CourtFormValues = {
  petitioner: 'Alex Rivera', respondent: 'Morgan Rivera', otherParent: 'Jordan Lane', caseNumber: 'TEST-2026-002',
  declarantName: 'Alex Rivera', street: '123 Example Street', city: 'Example City', state: 'CA', zip: '90000', phone: '555-010-0100', email: 'alex@example.test',
  county: 'Los Angeles', courtStreet: '123 Example Court Street', courtMailing: 'PO Box 123', courtCityZip: 'Example City, CA 90000', courtBranch: 'SYNTHETIC TEST ONLY',
  noticeTo: 'Morgan Rivera', noticeRespondent: true,
  requestCustody: true, requestVisitation: true, requestOther: true, otherRequestTitle: 'SYNTHETIC TEST REQUEST', otherOrders: 'Synthetic example: exchange the school calendar by email.',
  hasRestrainingOrders: true, restrainingPetitioner: true, restrainingRespondent: true,
  criminalOrder: true, criminalOrderCounty: 'Example County, CA', criminalOrderCase: 'TEST-CR-01',
  familyOrder: true, familyOrderCounty: 'Example County, CA', familyOrderCase: 'TEST-FL-01',
  juvenileOrder: true, juvenileOrderCounty: 'Example County, CA', juvenileOrderCase: 'TEST-JV-01',
  otherOrder: true, otherOrderCounty: 'Example County, CA', otherOrderCase: 'TEST-OT-01',
  requestLegalCustody: true, requestPhysicalCustody: true,
  ...Object.fromEntries([1, 2, 3, 4].flatMap((i) => [[`child${i}Name`, `Test Child ${i}`], [`child${i}BirthDate`, `201${i}-04-12`], [`child${i}Legal`, 'Both parents'], [`child${i}Physical`, 'Both parents']])),
  custodyOrders: 'Synthetic request: the parents exchange the child at the school entrance on Fridays at 3:00 p.m.',
  childrenReasons: 'Synthetic example only. I recorded the school pickup on September 4, 2026. My proposed location is the school entrance, which the child already uses.',
  changeOrder: true, changeCustody: true, custodyOrderDate: '2026-01-15', custodyOrderCurrent: 'Synthetic current order: joint legal custody.',
  changeVisitation: true, visitationOrderDate: '2026-01-15', visitationOrderCurrent: 'Synthetic current order: exchanges at the school on Fridays.',
  supportingFacts: 'SYNTHETIC TEST DOCUMENT — NOT FOR FILING. On September 4, 2026, I arrived at the school entrance at 3:00 p.m. I received a message at 3:20 p.m. about a changed pickup location. FINAL FACTS SENTINEL.',
  declarationDate: '2026-09-05', printedName: 'Alex Rivera',
};
