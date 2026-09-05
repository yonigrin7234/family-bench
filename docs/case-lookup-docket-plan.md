# Case lookup and docket monitoring plan

Research checked September 5, 2026. **Not implemented. Court selection and coverage remain pending.** The user has requested case-number lookup, automatic case-data import and docket tracking; the question identifying the court/county has not yet been answered. California family court is the existing product context, not confirmation of the user's particular jurisdiction.

## Intended experience

Use the court already recorded in case setup, or ask the user to select it. Then accept the case number, show the matching court/caption/case type for confirmation, and preview the available information before importing selected fields. A case-number-only screen is possible when its court context is already known; a bare number does not reliably establish that context.

California Courts directs users to the court where their case was filed. County courts keep the records, and available online information differs by court. The state self-help website is not a statewide case-record database. [California Courts: how to look up a case](https://selfhelp.courts.ca.gov/court-basics/look-up-case)

## Access and coverage limits

- **Docket information and document contents are separate capabilities.** California Rule 2.503 provides for remote registers of actions, calendars and indexes to the extent feasible, while restricting public remote access to underlying records in Family Code proceedings. A docket entry saying an order was issued does not establish that its PDF or contents are accessible. Confidential or sealed material has additional restrictions. [2026 Rule 2.503](https://courts.ca.gov/cms/rules/index/two/rule2_503)
- **Party access can require a court-specific identity process.** San Mateo, as an example rather than the selected court, requires a signed agreement listing the cases, an appointment and government ID for self-represented electronic access. Case number alone is insufficient. [San Mateo electronic case access](https://sanmateo.courts.ca.gov/online-services/pro-per-self-represented-electronic-case-access)
- **Automated monitoring needs verified integration coverage.** Docket Alarm's primary API documentation describes court-and-docket tracking, configurable checks and server notifications of new docket entries. This establishes a possible integration mechanism, not coverage for the user's family case. Its coverage explorer is venue-specific; exact case types, fields, document availability, freshness, licensing, fees and permitted application use require confirmation. No provider is selected or registered. [Docket Alarm API](https://www.docketalarm.com/api/v1/), [coverage explorer](https://www.docketalarm.com/coverage)
- **PACER is a separate federal capability.** It provides federal appellate, district and bankruptcy case information, not California superior-court family cases. [U.S. Courts: PACER](https://www.uscourts.gov/court-records/find-a-case-pacer)

Use a documented court API or licensed provider integration after verifying its supported use. A public portal is not by itself an API or authorization for unattended access. No court credentials, credential automation, scraping workaround or paid registration is part of this plan. Unsupported or restricted records should use an official-portal link and user-upload workflow.

## Implementation sequence and acceptance

1. **Resolve the court and establish coverage.** Record a stable court identifier, official portal URL, supported case types, searchable identifiers, accessible data, permitted integration method and last coverage check. Distinguish unsupported access, restricted access, no match and temporary failure.
2. **Lookup and reviewed import.** Match court plus number, require confirmation, and show proposed caption/parties/status/hearings/docket fields with source and retrieval time. Import only available, selected facts. Preserve existing user edits; never treat missing provider data as proof that a case or event does not exist.
3. **Opt-in monitoring for supported connections.** Keep provider credentials on the backend; bind subscriptions to the owner and case. Validate incoming updates, deduplicate retries and preserve event revisions. Show source links, last successful check, configured frequency, and paused/error states. Test repeated delivery, changed hearing dates, permission loss, provider failure and cross-account isolation before claiming monitoring works.
4. **Restricted documents and deadlines.** Let users obtain authorized documents through their court and upload them for reviewed extraction. Keep deadline calculation separate from raw docket detection: the applicable rule, triggering event, service facts and exceptions must be established before proposing a deadline. Do not infer an order's terms from its docket label.

## Existing scope and short gap list

This request is already represented by [complete feature list §40.2–40.3 and §45](family-bench-complete-feature-list.md), [product spec §41.2, §52.2 and §72.6](product-spec.md), and the preserved [requirements coverage inventory](requirements-coverage.md). Current [case setup](../app/onboarding.tsx) accepts manual court/case information; no court lookup or docket connector was found in the inspected app, library or scripts.

The remaining work for this request is:

- A verified court/provider lookup and reviewed case-data import connection.
- A durable docket-monitoring and notification runtime for supported cases.
- Authorized document intake/extraction and separately validated deadline calculations.

These capabilities remain planned. This note does not mark them—or the wider requirements inventory—as wired or complete. No application UI, provider account, credentials, monitoring subscription or deployment is created by this document.
