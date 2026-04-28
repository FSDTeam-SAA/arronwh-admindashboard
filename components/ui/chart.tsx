'use client';

import * as React from 'react';
import {
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps as RechartsTooltipContentProps,
} from 'recharts';
import { cn } from '@/lib/utils';

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    color?: string;
  }
>;

type ChartContextValue = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextValue | null>(null);

const useChart = (): ChartContextValue => {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }
  return context;
};

type ChartContainerProps = React.ComponentProps<'div'> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof ResponsiveContainer>['children'];
};

function ChartContainer({
  config,
  children,
  className,
  style,
  ...props
}: ChartContainerProps) {
  const chartVars = React.useMemo(() => {
    return Object.entries(config).reduce<Record<string, string>>((styles, [key, item]) => {
      if (item.color) {
        styles[`--color-${key}`] = item.color;
      }
      return styles;
    }, {});
  }, [config]);

  return (
    <ChartContext.Provider value={{ config }}>
      <div className={cn('w-full', className)} style={{ ...chartVars, ...style } as React.CSSProperties} {...props}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartTooltip = Tooltip;

type ChartTooltipContentProps = React.ComponentProps<'div'> &
  Partial<Pick<RechartsTooltipContentProps<number, string>, 'active' | 'payload' | 'label'>> & {
    hideLabel?: boolean;
    indicator?: 'dot' | 'line';
    formatter?: (value: number | string, name: string) => React.ReactNode;
    labelFormatter?: (label: string | number | undefined) => React.ReactNode;
  };

function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  hideLabel = false,
  indicator = 'dot',
  formatter,
  labelFormatter,
}: ChartTooltipContentProps) {
  const { config } = useChart();

  if (!active || !Array.isArray(payload) || payload.length === 0) return null;

  const title = hideLabel ? null : labelFormatter ? labelFormatter(label) : label;

  return (
    <div className={cn('grid min-w-[10rem] gap-1.5 rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-2 shadow-sm', className)}>
      {title ? <p className="text-[11px] font-medium text-[#64748B]">{title}</p> : null}
      <div className="grid gap-1">
        {payload.map((item, index) => {
          const key = String(item.dataKey ?? item.name ?? index);
          const configItem = config[key];
          const name = typeof configItem?.label === 'string' ? configItem.label : String(item.name ?? key);
          const rawValue = typeof item.value === 'number' || typeof item.value === 'string' ? item.value : 0;
          const value = formatter ? formatter(rawValue, name) : rawValue;
          const color = configItem?.color ?? item.color ?? '#F4BF24';

          return (
            <div key={`tooltip-item-${key}-${index}`} className="flex items-center gap-2 text-xs text-[#2D3D4D]">
              <span
                className={cn('inline-block rounded-full', indicator === 'line' ? 'h-3 w-0.5 rounded-none' : 'h-2 w-2')}
                style={{ backgroundColor: color }}
              />
              <span className="font-medium">{name}:</span>
              <span className="font-semibold text-[#F4BF24]">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent };
