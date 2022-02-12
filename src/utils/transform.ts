import type babel from '@babel/standalone'
import { CodeType, TransformReturnValue } from '../types'
import { Options } from '../types/option-type'

const BABEL_PRESETS = ['env', 'react']

async function getCodeFromVanilla(
  code: string,
  useBabel: boolean
): Promise<TransformReturnValue> {
  let html = ''
  let css = ''
  let js = ''
  let originJs = ''
  try {
    html = getTagContent(code, 'template')
    css = getTagContent(code, 'style')
    originJs = getTagContent(code, 'script')
    const Babel = await getBabel()
    if (useBabel) {
      js = Babel.transform(originJs, {
        presets: BABEL_PRESETS,
      }).code
    } else {
      js = originJs
    }
  } catch (err) {
    html = `<pre style="color: red">${err}</pre>`
  }

  return { html, css, js, originJs, type: 'vanilla' }
}

async function getCodeFromVue(
  code: string,
  useBabel: boolean
): Promise<TransformReturnValue> {
  let html = ''
  let css = ''
  let js = ''
  let originJs = ''
  try {
    const template = getTagContent(code, 'template')
    css = getTagContent(code, 'style')
    const script = getTagContent(code, 'script')

    const scriptTemp = script.replace('export default', 'var App =')
    let scriptResult = ''
    if (useBabel) {
      const Babel = await getBabel()
      scriptResult = Babel.transform(scriptTemp, {
        presets: ['env'],
      }).code
    } else {
      scriptResult = scriptTemp
    }

    js = `
    var CONTAINER = document.getElementById('app');
    ${scriptResult};
    Vue.createApp(App).mount(CONTAINER);
  `
    originJs = `
    const CONTAINER = document.getElementById('app');
${scriptTemp}
Vue.createApp(App).mount(CONTAINER);
  `.trim()
    html = `<div id="app">${template}</div>`
  } catch (err) {
    html = `<pre style="color: red">${err}</pre>`
  }

  return { html, css, js, originJs, type: 'vue' }
}

async function getCodeFromReact(
  code: string,
  useBabel: boolean
): Promise<TransformReturnValue> {
  let html = ''
  let js = ''
  let originJs = ''
  try {
    let scriptResult = ''
    if (useBabel) {
      const Babel = await getBabel()
      scriptResult = Babel.transform(code, {
        presets: BABEL_PRESETS,
      }).code
    } else {
      scriptResult = code
    }

    js = `
    var CONTAINER = document.getElementById('app');
    ${scriptResult}
  `

    originJs = `
    const CONTAINER = document.getElementById('app');
${code.trim()}
  `.trim()
    html = '<div id="app"></div>'
  } catch (err) {
    html = `<pre style="color: red">${err}</pre>`
  }

  return { html, css: '', js, originJs, type: 'react' }
}

function getTagContent(code: string, tag: string) {
  const matchResult = code.match(
    new RegExp(`<${tag}>([\\s\\S]+)</${tag}>`, 'gim')
  )
  let result = ''
  if (matchResult) {
    result = matchResult[0].replace(`<${tag}>`, '').replace(`</${tag}>`, '')
  }
  return result
}

let babelPromise: Promise<typeof babel> = null
function getBabel() {
  if (babelPromise) return babelPromise
  babelPromise = import('@babel/standalone').catch((err) => {
    babelPromise = null
    throw err
  })
  return babelPromise
}

function getType(metastring: string) {
  return metastring.split(' ')[0] as CodeType
}

function getLocalOptions(metastring: string) {
  const localConfigStr = metastring.split(' ')[1]
  if (!localConfigStr) return {}
  return localConfigStr
    .split('&')
    .reduce<Record<string, unknown>>((acc, curr) => {
      const [key, value] = curr.split('=')
      // eslint-disable-next-line no-new-func
      acc[key] = new Function(`return ${value}`)()
      return acc
    }, {}) as Options
}

export {
  getCodeFromVanilla,
  getCodeFromVue,
  getCodeFromReact,
  getType,
  getLocalOptions,
}
