/**
 * @fileOverview Default Legend Content
 */
import React, { PureComponent, ReactNode, MouseEvent, ReactElement } from 'react';
import isFunction from 'lodash/isFunction';

import clsx from 'clsx';
import { warn } from '../util/LogUtils';
import { Surface } from '../container/Surface';
import { Symbols } from '../shape/Symbols';
import {
  DataKey,
  LegendType,
  LayoutType,
  SymbolType,
  adaptEventsOfChild,
  PresentationAttributesAdaptChildEvent,
} from '../util/types';

const SIZE = 32;
export type ContentType = ReactElement | ((props: Props) => ReactNode);
export type IconType = Exclude<LegendType, 'none'>;
export type HorizontalAlignmentType = 'center' | 'left' | 'right';
export type VerticalAlignmentType = 'top' | 'bottom' | 'middle';
export type Formatter = (
  value: any,
  entry: {
    value: any;
    id?: string;
    type?: LegendType;
    color?: string;
    payload?: {
      strokeDasharray: string | number;
      value?: any;
    };
    dataKey?: DataKey<any>;
  },
  index: number,
) => ReactNode;

export interface Payload {
  value: any;
  id?: string;
  type?: LegendType;
  color?: string;
  payload?: {
    strokeDasharray: string | number;
    value?: any;
  };
  formatter?: Formatter;
  inactive?: boolean;
  legendIcon?: ReactElement<SVGElement>;
  dataKey?: DataKey<any>;
}
interface InternalProps {
  content?: ContentType;
  iconSize?: number;
  iconType?: IconType;
  layout?: LayoutType;
  align?: HorizontalAlignmentType;
  verticalAlign?: VerticalAlignmentType;
  payload?: Array<Payload>;
  inactiveColor?: string;
  formatter?: Formatter;
  onMouseEnter?: (data: Payload, index: number, event: MouseEvent) => void;
  onMouseLeave?: (data: Payload, index: number, event: MouseEvent) => void;
  onClick?: (data: Payload, index: number, event: MouseEvent) => void;
}

export type Props = InternalProps & Omit<PresentationAttributesAdaptChildEvent<any, ReactElement>, keyof InternalProps>;

export class DefaultLegendContent extends PureComponent<Props> {
  static displayName = 'Legend';

  static defaultProps = {
    iconSize: 14,
    layout: 'horizontal',
    align: 'center',
    verticalAlign: 'middle',
    inactiveColor: '#ccc',
  };

  /**
   * Render the path of icon
   * @param {Object} data Data of each legend item
   * @return {String} Path element
   */
  renderIcon(data: Payload) {
    const { inactiveColor } = this.props;
    const halfSize = SIZE / 2;
    const sixthSize = SIZE / 6;
    const thirdSize = SIZE / 3;
    const color = data.inactive ? inactiveColor : data.color;

    if (data.type === 'plainline') {
      return (
        <line
          strokeWidth={4}
          fill="none"
          stroke={color}
          strokeDasharray={data.payload.strokeDasharray}
          x1={0}
          y1={halfSize}
          x2={SIZE}
          y2={halfSize}
          className="recharts-legend-icon"
        />
      );
    }
    if (data.type === 'line') {
      return (
        <path
          strokeWidth={4}
          fill="none"
          stroke={color}
          d={`M0,${halfSize}h${thirdSize}
            A${sixthSize},${sixthSize},0,1,1,${2 * thirdSize},${halfSize}
            H${SIZE}M${2 * thirdSize},${halfSize}
            A${sixthSize},${sixthSize},0,1,1,${thirdSize},${halfSize}`}
          className="recharts-legend-icon"
        />
      );
    }
    if (data.type === 'rect') {
      return (
        <path
          stroke="none"
          fill={color}
          d={`M0,${SIZE / 8}h${SIZE}v${(SIZE * 3) / 4}h${-SIZE}z`}
          className="recharts-legend-icon"
        />
      );
    }
    if (React.isValidElement(data.legendIcon)) {
      const iconProps: any = { ...data };
      delete iconProps.legendIcon;
      return React.cloneElement(data.legendIcon, iconProps);
    }

    return (
      <Symbols
        fill={color}
        cx={halfSize}
        cy={halfSize}
        size={SIZE}
        sizeType="diameter"
        type={data.type as SymbolType}
      />
    );
  }

  /**
   * Draw items of legend
   * @return {ReactElement} Items
   */
  renderItems() {
    const { payload, iconSize, layout, formatter, inactiveColor } = this.props;
    const viewBox = { x: 0, y: 0, width: SIZE, height: SIZE };
    const itemStyle = {
      display: layout === 'horizontal' ? 'inline-block' : 'block',
      marginRight: 10,
    };
    const svgStyle = { display: 'inline-block', verticalAlign: 'middle', marginRight: 4 };

    return payload.map((entry, i) => {
      const finalFormatter = entry.formatter || formatter;
      const className = clsx({
        'recharts-legend-item': true,
        [`legend-item-${i}`]: true,
        inactive: entry.inactive,
      });

      if (entry.type === 'none') {
        return null;
      }

      // Do not render entry.value as functions. Always require static string properties.
      const entryValue = !isFunction(entry.value) ? entry.value : null;
      warn(
        !isFunction(entry.value),
        `The name property is also required when using a function for the dataKey of a chart's cartesian components. Ex: <Bar name="Name of my Data"/>`, // eslint-disable-line max-len
      );

      const color = entry.inactive ? inactiveColor : entry.color;

      return (
        <li
          className={className}
          style={itemStyle}
          // eslint-disable-next-line react/no-array-index-key
          key={`legend-item-${i}`}
          {...adaptEventsOfChild(this.props, entry, i)}
        >
          <Surface width={iconSize} height={iconSize} viewBox={viewBox} style={svgStyle}>
            {this.renderIcon(entry)}
          </Surface>
          <span className="recharts-legend-item-text" style={{ color }}>
            {finalFormatter ? finalFormatter(entryValue, entry, i) : entryValue}
          </span>
        </li>
      );
    });
  }

  render() {
    const { payload, layout, align } = this.props;

    if (!payload || !payload.length) {
      return null;
    }

    const finalStyle = {
      padding: 0,
      margin: 0,
      textAlign: layout === 'horizontal' ? align : 'left',
    };

    return (
      <ul className="recharts-default-legend" style={finalStyle}>
        {this.renderItems()}
      </ul>
    );
  }
}
