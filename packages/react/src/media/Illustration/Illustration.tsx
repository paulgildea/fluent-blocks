import { z } from 'zod'
import { ReactElement } from 'react'
import { illustrationProps as naturalIllustrationProps } from '@fluent-blocks/schemas'

import { propsElementUnion } from '../../lib'

import dfault from './variants/Default'
import error from './variants/Error'
import empty from './variants/Empty'
import hello from './variants/Hello'
import thanks from './variants/Thanks'

import { ThemedImage } from '../ThemedImage/ThemedImage'

export const illustrationProps = naturalIllustrationProps
export type IllustrationProps = z.infer<typeof illustrationProps>

const illustrations = { default: dfault, thanks, hello, empty, error }

export function Illustration(props: IllustrationProps) {
  const { illustration } = props
  const image = illustrations[illustration] ?? illustrations.error
  return <ThemedImage {...props} {...image} />
}

function isIllustrationProps(o: any): o is IllustrationProps {
  return 'illustration' in o
}

function isIllustrationElement(
  o: any
): o is ReactElement<IllustrationProps, typeof Illustration> {
  return o?.type === Illustration
}

export const illustrationPropsOrElement = propsElementUnion<
  typeof illustrationProps,
  typeof Illustration
>(illustrationProps)
export type IllustrationPropsOrElement = z.infer<
  typeof illustrationPropsOrElement
>

export function renderIfIllustration(o: any) {
  return isIllustrationProps(o) ? (
    <Illustration {...o} />
  ) : isIllustrationElement(o) ? (
    o
  ) : null
}
