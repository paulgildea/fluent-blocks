import { MouseEventHandler, useEffect, useRef } from 'react'
import {
  Button,
  makeStyles,
  Theme,
  Text,
  mergeClasses as cx,
} from '@fluentui/react-components'

import { sx, ThemeName, useTranslations } from '../../lib'

import { legendLabels, Pattern } from './chart-patterns'
import { ChartData, ChartDataset } from './chart-types'

export type LegendProps = {
  data: ChartData
  themeName: ThemeName
  theme: Theme
  chartDataPointColors: string[]
  onLegendClick: (index: number) => void
  verticalDataAlignment?: boolean
  patterns?: Pattern[]
}

const useColorValueStyles = makeStyles({
  root: {
    marginTop: '-5px',
    width: '.75rem',
    minWidth: '.75rem',
    height: '.75rem',
  },
  hc: {
    marginTop: '-5px',
    width: '1.25rem',
    minWidth: '1.25rem',
    height: '1rem',
  },
  canvas: {
    width: '100%',
    height: '100%',
    userSelect: 'none',
    ...sx.border('0'),
    ...sx.borderRadius('var(--borderRadiusSmall)'),
  },
  canvasHc: {
    ...sx.border('1px', 'solid', 'var(--colorNeutralStroke1)'),
  },
})

const useLegendItemStyles = makeStyles({
  root: {
    ...sx.flex(0, 0, 'auto'),
    fontSize: '.75rem',
    color: 'var(--colorNeutralForeground2)',
    ...sx.margin('0.125rem'),
    ...sx.padding('0.125rem'),
    minWidth: 0,
  },
})

const useLegendStyles = makeStyles({
  root: {
    display: 'flex',
    ...sx.flexFlow('row', 'nowrap'),
    overflowX: 'auto',
    overflowY: 'hidden',
  },
})

const ColorValue = ({
  index,
  themeName,
  theme,
  dataPointColor,
  patterns,
}: {
  index: number
  themeName: ThemeName
  theme: Theme
  dataPointColor: string
  patterns?: Pattern[]
}) => {
  const colorValueStyles = useColorValueStyles()
  const labelColorValueRef = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    if (!labelColorValueRef.current) {
      return
    }
    const canvasRef: HTMLCanvasElement = labelColorValueRef.current
    legendLabels({
      canvasRef,
      themeName,
      theme,
      patterns,
      dataPointColor,
      index,
    })
  }, [theme])
  return (
    <div
      className={
        themeName === 'high-contrast'
          ? colorValueStyles.hc
          : colorValueStyles.root
      }
    >
      <canvas
        ref={labelColorValueRef}
        className={cx(
          colorValueStyles.canvas,
          patterns && themeName === 'high-contrast' && colorValueStyles.canvasHc
        )}
      />
    </div>
  )
}

const LegendItem = ({
  index,
  value,
  hidden,
  themeName,
  theme,
  chartDataPointColors,
  onClick,
  patterns,
}: {
  index: number
  value: string
  themeName: ThemeName
  theme: Theme
  chartDataPointColors: string[]
  onClick: MouseEventHandler
  hidden?: boolean
  patterns?: Pattern[]
}) => {
  const legendItemStyles = useLegendItemStyles()
  const translate = useTranslations()
  return (
    <Button
      appearance="subtle"
      className={legendItemStyles.root}
      onClick={onClick}
      aria-label={translate(value)}
    >
      <ColorValue
        index={index}
        theme={theme}
        themeName={themeName}
        dataPointColor={chartDataPointColors[index]}
        patterns={patterns}
      />
      <Text size={200}>{translate(value)}</Text>
    </Button>
  )
}

const LegendItems = (props: LegendProps) =>
  props.verticalDataAlignment
    ? Array.from(props.data.labels, (label: string, index) => (
        <LegendItem
          {...props}
          index={index}
          key={index}
          value={label}
          onClick={() => props.onLegendClick(index)}
        />
      ))
    : Array.from(props.data.datasets, (dataset: ChartDataset, index) => (
        <LegendItem
          {...props}
          index={index}
          key={index}
          value={dataset.label}
          onClick={() => props.onLegendClick(index)}
        />
      ))

export const Legend = (props: LegendProps) => {
  const legendStyles = useLegendStyles()
  return <div className={legendStyles.root}>{LegendItems(props)}</div>
}
