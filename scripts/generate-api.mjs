import { resolve } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import { generateApi } from 'swagger-typescript-api'

const contract = resolve('src/api/swagger.json')
const url = process.env.SWAGGER_URL
if (url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Swagger: HTTP ${response.status}`)
  const text = await response.text()
  const schema = JSON.parse(text)
  if (!schema.paths?.['/corpora']) throw new Error('Контракт не содержит /corpora')
  await writeFile(contract, `${JSON.stringify(schema, null, 2)}\n`)
}
await generateApi({
  name: 'Api.ts',
  output: resolve('src/api/generated'),
  spec: JSON.parse(await readFile(contract, 'utf8')),
  httpClientType: 'axios',
  generateClient: true,
  // Preserve thematic operationId from the backend, independently of tags.
  generateRouteTypes: false,
})
