import {
  getActiveTryOnPromptVersion,
  getTryOnPromptDefinition,
  listTryOnPromptVersions,
  TRY_ON_PROMPT_VERSION_ENV,
} from '../src/lib/try-on-prompt-registry'

const activeVersion = getActiveTryOnPromptVersion()
getTryOnPromptDefinition(activeVersion)

console.log(`Active try-on prompt: ${activeVersion}`)
console.log(`Override with: ${TRY_ON_PROMPT_VERSION_ENV}=<version>`)

for (const definition of listTryOnPromptVersions()) {
  const marker = definition.version === activeVersion ? '*' : ' '
  console.log(`${marker} ${definition.version} (${definition.createdAt}) - ${definition.description}`)
}
