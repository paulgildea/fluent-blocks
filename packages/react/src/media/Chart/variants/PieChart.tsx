import { memo, useEffect, useRef, useContext } from 'react'
import Chart from 'chart.js'
import update from 'lodash/update'
import isNumber from 'lodash/isNumber'
import cloneDeep from 'lodash/cloneDeep'

import { FluentBlocksContext, useTranslations } from '../../../lib'
import {
  tooltipTrigger,
  chartConfig,
  axesConfig,
  setTooltipColorScheme,
  usNumberFormat,
  useChartId,
} from '../chart-utils'
import {
  buildPattern,
  chartBarDataPointPatterns,
  useChartColors,
} from '../chart-patterns'
import { ChartData } from '../chart-types'
import { Legend } from '../Legend'
import { useChartStyles } from '../chart-styles'

export type PieChartProps = {
  data: ChartData
  label?: string
  cutoutPercentage?: number
}

/**
 * @internal
 */
export const PieChart = memo(
  // eslint-disable-next-line max-lines-per-function
  function UnmemoizedPieChart({
    label,
    data,
    cutoutPercentage,
  }: PieChartProps) {
    if (data && data.datasets && data.datasets[0].data.length > 6) {
      data.datasets[0].data = data.datasets[0].data.slice(0, 6)
      console.warn(
        'Please follow design guidance and apply 6 or fewer data points per chart.'
      )
    }
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const chartRef = useRef<Chart | undefined>()
    const chartId = useChartId()
    const { themeName, theme } = useContext(FluentBlocksContext)
    const chartDataPointColors = useChartColors({ theme, themeName })
    const translate = useTranslations()

    const pieChartPatterns = Array.from({ length: 6 }, (v, i) =>
      buildPattern({
        ...chartBarDataPointPatterns[i],
        backgroundColor: theme.colorNeutralBackground1,
        patternColor: theme.colorBrandForeground1,
      })
    )

    const pieChartHoverPatterns = Array.from({ length: 6 }, (v, i) =>
      buildPattern({
        ...chartBarDataPointPatterns[i],
        backgroundColor: theme.colorNeutralBackground1,
        patternColor: theme.colorNeutralStroke1Hover,
      })
    )

    const createDataPoints = (): Chart.ChartDataSets[] => {
      let dataPointConfig = {
        label: translate(data.datasets[0].label),
        data: cloneDeep(data.datasets[0].data),
        borderWidth: 2,
        borderColor: theme.colorNeutralBackground1,
        hoverBorderColor: theme.colorNeutralBackground1,
        backgroundColor: chartDataPointColors,
        hoverBackgroundColor: chartDataPointColors,
      }
      if (themeName === 'high-contrast') {
        dataPointConfig = {
          ...dataPointConfig,
          borderWidth: 3,
          hoverBorderColor: theme.colorNeutralStroke1Hover,
          borderColor: theme.colorBrandBackground,
          backgroundColor: pieChartPatterns as unknown as string[],
          hoverBackgroundColor: pieChartHoverPatterns as unknown as string[],
        }
      }
      return [dataPointConfig]
    }

    // eslint-disable-next-line max-lines-per-function
    useEffect(() => {
      let selectedIndex = -1
      const selectedDataSet = 0

      if (!canvasRef.current) {
        return
      }
      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) {
        return
      }
      const config: any = chartConfig({ type: 'pie' })
      config.options.hover.mode = 'point'

      config.options.layout.padding.top = 32
      config.options.layout.padding.left = -16
      config.options.layout.padding.right = 32
      config.options.layout.padding.bottom = 32

      config.options.scales.xAxes[0].ticks.display = false
      config.options.scales.xAxes[0].gridLines.display = false

      config.options.scales.yAxes[0].ticks.display = false
      config.options.scales.yAxes[0].gridLines.display = false

      if (cutoutPercentage) {
        config.options.cutoutPercentage = cutoutPercentage
      }
      // Pie chart custom settings
      config.options.tooltips.callbacks.label = (tooltipItem: any, data: any) =>
        translate(data.labels[tooltipItem.index])
      config.options.tooltips.callbacks.labelColor = (tooltipItem: any) => ({
        backgroundColor: chartDataPointColors[tooltipItem.index],
      })

      config.options.tooltips.callbacks.title = (tooltipItems: any) =>
        `${(
          (Number(data.datasets[0].data[tooltipItems[0].index]) /
            (data.datasets[0].data as number[]).reduce((a, b) => a + b)) *
          100
        ).toPrecision(2)}% (${usNumberFormat(
          Number(data.datasets[0].data[tooltipItems[0].index])
        )})`

      chartRef.current = new Chart(ctx, {
        ...(config as any),
        data: {
          labels: Array.isArray(data.labels)
            ? data.labels.map((label) => translate(label))
            : translate(data.labels),
          datasets: [],
        },
      })
      const chart: any = chartRef.current

      /**
       * Keyboard manipulations
       */
      function meta() {
        return chart.getDatasetMeta(selectedDataSet)
      }

      function removeFocusStyleOnClick() {
        // Remove focus state style if selected by mouse
        if (canvasRef.current) {
          canvasRef.current.style.boxShadow = 'none'
        }
      }

      function removeDataPointsHoverStates() {
        if (selectedIndex > -1) {
          meta().controller.removeHoverStyle(
            meta().data[selectedIndex],
            0,
            selectedIndex
          )
        }
      }

      function hoverDataPoint(pointID: number) {
        meta().controller.setHoverStyle(
          meta().data[pointID],
          selectedDataSet,
          pointID
        )
      }

      function showFocusedDataPoint() {
        hoverDataPoint(selectedIndex)
        tooltipTrigger({
          chart: chartRef.current as any,
          data,
          set: selectedDataSet,
          index: selectedIndex,
          themeName,
          theme,
        })
        document
          .getElementById(
            `${chartId}-tooltip-${selectedDataSet}-${selectedIndex}`
          )
          ?.focus()
      }

      function resetChartStates() {
        removeDataPointsHoverStates()
        const activeElements = chart.tooltip._active
        const requestedElem =
          chart.getDatasetMeta(selectedDataSet).data[selectedIndex]
        activeElements.find((v: any, i: number) => {
          if (requestedElem._index === v._index) {
            activeElements.splice(i, 1)
            return true
          }
        })

        for (let i = 0; i < activeElements.length; i++) {
          if (requestedElem._index === activeElements[i]._index) {
            activeElements.splice(i, 1)
            break
          }
        }
        if (themeName === 'high-contrast') {
          ;(chartRef.current as any).data.datasets.map(
            (dataset: any, i: number) => {
              dataset.borderColor = theme.colorNeutralStroke1Hover
              dataset.borderWidth = 2
              dataset.backgroundColor = buildPattern({
                ...chartBarDataPointPatterns[i],
                backgroundColor: theme.colorNeutralBackground1,
                patternColor: theme.colorBrandBackground,
              })
            }
          )
          chart.update()
        }
        chart.tooltip._active = activeElements
        chart.tooltip.update(true)
        chart.draw()
      }

      function changeFocus(e: KeyboardEvent) {
        removeDataPointsHoverStates()
        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowUp':
            e.preventDefault()
            selectedIndex = (selectedIndex + 1) % meta().data.length
            break
          case 'ArrowLeft':
          case 'ArrowDown':
            e.preventDefault()
            selectedIndex = (selectedIndex || meta().data.length) - 1
            break
        }

        showFocusedDataPoint()
      }

      canvasRef.current.addEventListener('click', removeFocusStyleOnClick)
      canvasRef.current.addEventListener('keydown', changeFocus)
      canvasRef.current.addEventListener('focusout', resetChartStates)
      return () => {
        if (!chartRef.current) {
          return
        }
        if (canvasRef.current) {
          canvasRef.current.removeEventListener(
            'click',
            removeFocusStyleOnClick
          )
          canvasRef.current.removeEventListener('keydown', changeFocus)
          canvasRef.current.removeEventListener('focusout', resetChartStates)
        }
        chartRef.current.destroy()
      }
    }, [])

    /**
     * Theme updates
     */
    useEffect(() => {
      if (!chartRef.current) {
        return
      }
      if (!canvasRef.current) {
        return
      }
      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) {
        return
      }
      // Apply new colors scheme for data points
      chartRef.current.data.datasets = createDataPoints()
      // Update tooltip colors scheme
      setTooltipColorScheme({
        chart: chartRef.current,
        themeName,
        theme,
        chartDataPointColors,
        patterns: chartBarDataPointPatterns,
        verticalDataAlignment: true,
      })
      // Update axes
      axesConfig({ chart: chartRef.current, ctx, theme })

      chartRef.current.update()
    }, [themeName])

    function onLegendClick(datasetIndex: number) {
      if (!chartRef.current) {
        return
      }
      update(
        chartRef.current.data,
        `datasets[0].data[${datasetIndex}]`,
        (val) =>
          isNumber(val) ? { hidden: true } : data.datasets[0].data[datasetIndex]
      )
      chartRef.current.update()
    }

    const chartStyles = useChartStyles()

    return (
      <div>
        <div className={chartStyles.squareChartContainer}>
          <canvas
            id={chartId}
            ref={canvasRef}
            style={{ userSelect: 'none' }}
            tabIndex={0}
            aria-label={label}
            data-chromatic="ignore"
          >
            {data.datasets.map((set, setKey) =>
              (set.data as number[]).forEach(
                (item: number, itemKey: number) => (
                  // Generated tooltips for screen readers
                  <div
                    key={itemKey}
                    id={`${chartId}-tooltip-${setKey}-${itemKey}`}
                  >
                    <p>{item}</p>
                    <span>
                      {data.labels && Array.isArray(data.labels)
                        ? translate(data.labels[setKey])
                        : translate(data.labels)}
                      : {set.data[itemKey]}
                    </span>
                  </div>
                )
              )
            )}
          </canvas>
        </div>
        <Legend
          {...{ data, chartDataPointColors, themeName, theme, onLegendClick }}
          patterns={chartBarDataPointPatterns}
          verticalDataAlignment
        />
      </div>
    )
  }
)
