import type { Config } from '@tsslint/config'
import { antfu } from '@antfu/eslint-config'
import { createCategoryPlugin, createIgnorePlugin, defineConfig } from '@tsslint/config'
import { convertRules } from '@tsslint/eslint'

const includedPlugins = new Set<string | undefined>([
  'antfu/ignores',
  'antfu/javascript/rules',
  'antfu/eslint-comments/rules',
  'antfu/node/rules',
  'antfu/jsdoc/rules',
  'antfu/imports/rules',
  'antfu/command/rules',
  'antfu/perfectionist/setup',
  'antfu/imports/rules',
  'antfu/unicorn/rules',
  'antfu/typescript/rules',
  'antfu/stylistic/rules',
  'antfu/regexp/rules',
  'antfu/test/rules',
  'antfu/disables/scripts',
  'antfu/disables/cli',
  'antfu/disables/bin',
  'antfu/disables/dts',
  'antfu/disables/cjs',
  'antfu/disables/config-files',
])
const esConfigs = (await antfu({ typescript: true })).filter(config => includedPlugins.has(config.name))
const globalExclude = esConfigs.map(config => config.ignores ?? []).flat()

export default defineConfig([
  ...await Promise.all(esConfigs.map(convertConfig)),
  {
    plugins: [
      createIgnorePlugin('eslint-disable-next-line', false),
      createCategoryPlugin({
        '@stylistic/*': 2,
        '**': 3,
      }),
    ],
  },
  {
    include: [
      'packages/language-service/**/*.ts',
      'packages/language-server/**/*.ts',
    ],
    rules: {
      'no-console': () => { },
    },
  },
  {
    rules: {
      'curly': () => { },
      'prefer-const': () => { },
      'new-cap': () => { }, // TODO: FIXME
    },
  },
])

async function convertConfig(esConfig: any) {
  const tssConfig: Config = {}
  if (globalExclude.length) {
    tssConfig.exclude = globalExclude
  }
  if (esConfig.files) {
    tssConfig.include = esConfig.files.flat()
  }
  if (esConfig.rules) {
    tssConfig.rules = await convertRules(fixRuleNames(esConfig.rules))
  }
  return tssConfig
}

function fixRuleNames(rules: Record<string, any>) {
  const renamed: Record<string, any> = {}
  for (let [key, value] of Object.entries(rules)) {
    if (key.startsWith('eslint-comments/')) {
      key = key.replace('eslint-comments/', '@eslint-community/eslint-comments/')
    }
    else if (key.startsWith('node/')) {
      key = key.replace('node/', 'n/')
    }
    else if (key.startsWith('import/')) {
      key = key.replace('import/', 'import-lite/')
    }
    else if (key.startsWith('ts/')) {
      key = key.replace('ts/', '@typescript-eslint/')
    }
    else if (key.startsWith('style/')) {
      key = key.replace('style/', '@stylistic/')
    }
    else if (key.startsWith('test/')) {
      if (key.endsWith('/no-only-tests')) {
        key = 'no-only-tests/no-only-tests'
      }
      else {
        key = key.replace('test/', '@vitest/')
      }
    }
    renamed[key] = value
  }
  return renamed
}
