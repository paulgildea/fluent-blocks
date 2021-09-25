import { z } from 'zod'
import { key } from '../lib/keys'
import { Text, textProps, isTextProps } from './Text'
import { Icon, iconProps, isIconProps } from './Icon'
import { invalidInline } from '../lib/warnings'

export const inlineProps = z.union([textProps, iconProps])

export const inlineSequence = z.array(inlineProps)

export type InlineSequence = z.infer<typeof inlineSequence>

export const inlineContentProps = z.object({
  inlines: inlineSequence,
})

export type InlineContentProps = z.infer<typeof inlineContentProps>

/**
 * An ordered set of phrasing elements to render inline together.
 */

export const InlineContent = (props: InlineContentProps) => {
  const { inlines } = inlineContentProps.parse(props)
  return (
    <>
      {(inlines ?? []).map((inline) =>
        isIconProps(inline) ? (
          <Icon {...inline} key={key(inline)} />
        ) : isTextProps(inline) ? (
          <Text {...inline} key={key(inline)} />
        ) : (
          invalidInline(inline)
        )
      )}
    </>
  )
}