/** Write only synthetic forms for manual all-page rendering and field inspection. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { createCourtFormPdf } from '../lib/forms/pdf';
import { courtFormTemplate } from '../lib/forms/templates';
import { DECLARATION_FIXTURE, REQUEST_FIXTURE } from '../lib/forms/__tests__/fixtures';

async function main() {
  const output = resolve(process.argv[2] ?? '/private/tmp/family-bench-form-qa'); mkdirSync(output, { recursive: true });
  for (const [formId, values] of [['mc031', DECLARATION_FIXTURE], ['fl300', REQUEST_FIXTURE]] as const) {
    const source = courtFormTemplate(formId);
    const artifact = await createCourtFormPdf({ formId, values, reviewed: true, templateBytes: readFileSync(`assets/forms/${source.template}`) }, { fontBytes: readFileSync('node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'), sha256: async (bytes) => createHash('sha256').update(bytes).digest('hex') });
    const path = resolve(output, `${formId}-synthetic.pdf`); writeFileSync(path, artifact.bytes); console.log(path);
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
