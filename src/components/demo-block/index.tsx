import React, { useEffect, useState } from 'react'
import {
  getCodeFromVanilla,
  getCodeFromVue,
  getCodeFromReact,
  getType,
  getLocalOptions,
} from '../../utils/transform'
import { Runner } from '../runner'
import { Playground } from '../playground'
import { CodeBlockPropsType, CodeType, TransformReturnValue } from '../../types'
import { DEFAULT_SCOPE } from '../../utils/scope'
import { useDebounceFn } from '../../utils/hooks'
import { usePluginData } from '@docusaurus/useGlobalData'
import { useColorMode } from '@docusaurus/theme-common'
import { Options } from '../../types/option-type'
import { DEFAULT_OPTIONS } from '../../utils/constants'
import CodeBlock from '@theme-init/CodeBlock'
import { ControlBar } from '../control-bar'

import './index.css'

const GET_CODE_FUNCTION: Record<
  CodeType,
  (code: string) => Promise<TransformReturnValue>
> = {
  vanilla: getCodeFromVanilla,
  vue: getCodeFromVue,
  react: getCodeFromReact,
}

function DemoBlock(props: CodeBlockPropsType) {
  const { children, metastring } = props
  const [code, setCode] = useState(children)
  const [scope, setScope] = useState(null)
  const [runtimeCode, setRuntimeCode] = useState<TransformReturnValue>({
    html: '',
    css: '',
    js: '',
  })

  const { isDarkTheme } = useColorMode()
  const customOptions: Options = usePluginData('docusaurus-plugin-demo-block')
  const localOptions = getLocalOptions(metastring)

  const options: Options = {
    ...DEFAULT_OPTIONS,
    ...customOptions,
    ...localOptions,
  }
  const { layout, live, showCode, scope: optionsScope = {} } = options

  const [codeVisible, setCodeVisible] = useState(options.showCodeByDefault)

  const handleCodeChange = useDebounceFn<[string]>((v) => {
    setCode(v)
  })

  useEffect(() => {
    if (code !== children) {
      setCode(children)
    }
  }, [children])

  useEffect(() => {
    ;(async () => {
      const scope = { ...DEFAULT_SCOPE, ...optionsScope }
      setScope(scope)
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      const runtimeCode = await GET_CODE_FUNCTION[getType(metastring)](code)
      setRuntimeCode(runtimeCode)
    })()
  }, [code])

  const direction = layout.split('-')[0]

  return (
    <div className="dpdb">
      <div
        className={`dpdb__container dpdb__container-${layout} dpdb__display-${
          layout.split('-')[0]
        }`}
      >
        {showCode && (
          <div
            className={`dpdb__playground-wrapper ${
              codeVisible ? '' : `dpdb__hidden`
            }`}
          >
            {live ? (
              <Playground
                isDarkTheme={isDarkTheme}
                type={getType(metastring)}
                value={code}
                onChange={(value) => handleCodeChange(value)}
              />
            ) : (
              <CodeBlock {...props} />
            )}
          </div>
        )}
        {direction === 'column' && (
          <ControlBar
            options={options}
            code={children}
            codeVisible={codeVisible}
            onToggleCode={(visible) => {
              setCodeVisible(visible)
            }}
          />
        )}
        <div className="dpdb__runner-wrapper">
          <Runner {...runtimeCode} isDarkTheme={isDarkTheme} scope={scope} />
        </div>
      </div>
      {direction === 'row' && (
        <ControlBar
          options={options}
          code={children}
          codeVisible={codeVisible}
          onToggleCode={(visible) => {
            setCodeVisible(visible)
          }}
        />
      )}
    </div>
  )
}

export { DemoBlock }
