import get from 'lodash/get';
import isNil from 'lodash/isNil';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import isObject from 'lodash/isObject';

import React, { Children, Component, FunctionComponent, isValidElement, ReactNode } from 'react';
import { isFragment } from 'react-is';
import { DotProps } from '..';
import { isNumber } from './DataUtils';
import { shallowEqual } from './ShallowEqual';
import { FilteredSvgElementType, FilteredElementKeyMap, SVGElementPropKeys, EventKeys } from './types';
import { AreaDot } from '../cartesian/Area';
import { LineDot } from '../cartesian/Line';

const REACT_BROWSER_EVENT_MAP: Record<string, string> = {
  click: 'onClick',
  mousedown: 'onMouseDown',
  mouseup: 'onMouseUp',
  mouseover: 'onMouseOver',
  mousemove: 'onMouseMove',
  mouseout: 'onMouseOut',
  mouseenter: 'onMouseEnter',
  mouseleave: 'onMouseLeave',
  touchcancel: 'onTouchCancel',
  touchend: 'onTouchEnd',
  touchmove: 'onTouchMove',
  touchstart: 'onTouchStart',
  contextmenu: 'onContextMenu',
  dblclick: 'onDoubleClick',
};

export const SCALE_TYPES = [
  'auto',
  'linear',
  'pow',
  'sqrt',
  'log',
  'identity',
  'time',
  'band',
  'point',
  'ordinal',
  'quantile',
  'quantize',
  'utc',
  'sequential',
  'threshold',
];

export const LEGEND_TYPES = [
  'plainline',
  'line',
  'square',
  'rect',
  'circle',
  'cross',
  'diamond',
  'star',
  'triangle',
  'wye',
  'none',
];

export const TOOLTIP_TYPES = ['none'];

/**
 * Get the display name of a component
 * @param  {Object} Comp Specified Component
 * @return {String}      Display name of Component
 */
export const getDisplayName = (Comp: React.ComponentType | string) => {
  if (typeof Comp === 'string') {
    return Comp;
  }
  if (!Comp) {
    return '';
  }
  return Comp.displayName || Comp.name || 'Component';
};

// `toArray` gets called multiple times during the render
// so we can memoize last invocation (since reference to `children` is the same)
let lastChildren: ReactNode | null = null;
let lastResult: ReactNode[] | null = null;

export const toArray = <T extends ReactNode>(children: T | T[]): T[] => {
  if (children === lastChildren && Array.isArray(lastResult)) {
    return lastResult as T[];
  }
  let result: T[] = [];
  Children.forEach(children, child => {
    if (isNil(child)) return;
    if (isFragment(child)) {
      result = result.concat(toArray(child.props.children));
    } else {
      // @ts-expect-error this could still be Iterable<ReactNode> and TS does not like that
      result.push(child);
    }
  });
  lastResult = result;
  lastChildren = children;
  return result;
};

/*
 * Find and return all matched children by type.
 * `type` must be a React.ComponentType
 */
export function findAllByType<
  ComponentType extends React.ComponentType,
  DetailedElement = React.DetailedReactHTMLElement<React.ComponentProps<ComponentType>, HTMLElement>,
>(children: ReactNode, type: ComponentType | ComponentType[]): DetailedElement[] {
  const result: DetailedElement[] = [];
  let types: string[] = [];

  if (Array.isArray(type)) {
    types = type.map(t => getDisplayName(t));
  } else {
    types = [getDisplayName(type)];
  }

  toArray(children).forEach(child => {
    const childType = get(child, 'type.displayName') || get(child, 'type.name');
    if (types.indexOf(childType) !== -1) {
      result.push(child as DetailedElement);
    }
  });

  return result;
}

/*
 * Return the first matched child by type, return null otherwise.
 * `type` must be a React.ComponentType
 */
export function findChildByType<ComponentType extends React.ComponentType>(
  children: ReactNode[],
  type: ComponentType | ComponentType[],
) {
  const result = findAllByType(children, type);

  return result && result[0];
}

/*
 * Create a new array of children excluding the ones matched the type
 */
export const withoutType = (children: ReactNode, type: string | string[]) => {
  const newChildren: ReactNode[] = [];
  let types: string[];

  if (Array.isArray(type)) {
    types = type.map(t => getDisplayName(t));
  } else {
    types = [getDisplayName(type)];
  }

  toArray(children).forEach(child => {
    const displayName = get(child, 'type.displayName');

    if (displayName && types.indexOf(displayName) !== -1) {
      return;
    }
    newChildren.push(child);
  });

  return newChildren;
};

/**
 * validate the width and height props of a chart element
 * @param  {Object} el A chart element
 * @return {Boolean}   true If the props width and height are number, and greater than 0
 */
export const validateWidthHeight = (el: any): boolean => {
  if (!el || !el.props) {
    return false;
  }
  const { width, height } = el.props;

  if (!isNumber(width) || width <= 0 || !isNumber(height) || height <= 0) {
    return false;
  }

  return true;
};

const SVG_TAGS: string[] = [
  'a',
  'altGlyph',
  'altGlyphDef',
  'altGlyphItem',
  'animate',
  'animateColor',
  'animateMotion',
  'animateTransform',
  'circle',
  'clipPath',
  'color-profile',
  'cursor',
  'defs',
  'desc',
  'ellipse',
  'feBlend',
  'feColormatrix',
  'feComponentTransfer',
  'feComposite',
  'feConvolveMatrix',
  'feDiffuseLighting',
  'feDisplacementMap',
  'feDistantLight',
  'feFlood',
  'feFuncA',
  'feFuncB',
  'feFuncG',
  'feFuncR',
  'feGaussianBlur',
  'feImage',
  'feMerge',
  'feMergeNode',
  'feMorphology',
  'feOffset',
  'fePointLight',
  'feSpecularLighting',
  'feSpotLight',
  'feTile',
  'feTurbulence',
  'filter',
  'font',
  'font-face',
  'font-face-format',
  'font-face-name',
  'font-face-url',
  'foreignObject',
  'g',
  'glyph',
  'glyphRef',
  'hkern',
  'image',
  'line',
  'lineGradient',
  'marker',
  'mask',
  'metadata',
  'missing-glyph',
  'mpath',
  'path',
  'pattern',
  'polygon',
  'polyline',
  'radialGradient',
  'rect',
  'script',
  'set',
  'stop',
  'style',
  'svg',
  'switch',
  'symbol',
  'text',
  'textPath',
  'title',
  'tref',
  'tspan',
  'use',
  'view',
  'vkern',
];

const isSvgElement = (child: any) => child && child.type && isString(child.type) && SVG_TAGS.indexOf(child.type) >= 0;

export const hasClipDot = (dot: LineDot | AreaDot): dot is DotProps =>
  dot && typeof dot === 'object' && 'clipDot' in dot;

/**
 * Checks if the property is valid to spread onto an SVG element or onto a specific component
 * @param {unknown} property property value currently being compared
 * @param {string} key property key currently being compared
 * @param {boolean} includeEvents if events are included in spreadable props
 * @param {boolean} svgElementType checks against map of SVG element types to attributes
 * @returns {boolean} is prop valid
 */
export const isValidSpreadableProp = (
  property: unknown,
  key: string,
  includeEvents?: boolean,
  svgElementType?: FilteredSvgElementType,
) => {
  /**
   * If the svg element type is explicitly included, check against the filtered element key map
   * to determine if there are attributes that should only exist on that element type.
   * @todo Add an internal cjs version of https://github.com/wooorm/svg-element-attributes for full coverage.
   */
  const matchingElementTypeKeys = FilteredElementKeyMap?.[svgElementType] ?? [];

  return (
    key.startsWith('data-') ||
    (!isFunction(property) &&
      ((svgElementType && matchingElementTypeKeys.includes(key)) || SVGElementPropKeys.includes(key))) ||
    (includeEvents && EventKeys.includes(key))
  );
};

/**
 * Filter all the svg elements of children
 * @param  {Array} children The children of a react element
 * @return {Array}          All the svg elements
 */
export const filterSvgElements = (children: React.ReactElement[]): React.ReactElement[] => {
  const svgElements = [] as React.ReactElement[];

  toArray(children).forEach((entry: React.ReactElement) => {
    if (isSvgElement(entry)) {
      svgElements.push(entry);
    }
  });

  return svgElements;
};

export const filterProps = (
  props: Record<string, any> | Component | FunctionComponent | boolean | unknown,
  includeEvents: boolean,
  svgElementType?: FilteredSvgElementType,
) => {
  if (!props || typeof props === 'function' || typeof props === 'boolean') {
    return null;
  }

  let inputProps = props as Record<string, any>;

  if (isValidElement(props)) {
    inputProps = props.props as Record<string, any>;
  }

  if (!isObject(inputProps)) {
    return null;
  }

  const out: Record<string, any> = {};

  /**
   * Props are blindly spread onto SVG elements. This loop filters out properties that we don't want to spread.
   * Items filtered out are as follows:
   *   - functions in properties that are SVG attributes (functions are included when includeEvents is true)
   *   - props that are SVG attributes but don't matched the passed svgElementType
   *   - any prop that is not in SVGElementPropKeys (or in EventKeys if includeEvents is true)
   */
  Object.keys(inputProps).forEach(key => {
    if (isValidSpreadableProp(inputProps?.[key], key, includeEvents, svgElementType)) {
      out[key] = inputProps[key];
    }
  });

  return out;
};

/**
 * Wether props of children changed
 * @param  {Object} nextChildren The latest children
 * @param  {Object} prevChildren The prev children
 * @return {Boolean}             equal or not
 */
export const isChildrenEqual = (nextChildren: React.ReactElement[], prevChildren: React.ReactElement[]): boolean => {
  if (nextChildren === prevChildren) {
    return true;
  }

  const count = Children.count(nextChildren);
  if (count !== Children.count(prevChildren)) {
    return false;
  }

  if (count === 0) {
    return true;
  }
  if (count === 1) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return isSingleChildEqual(
      Array.isArray(nextChildren) ? nextChildren[0] : nextChildren,
      Array.isArray(prevChildren) ? prevChildren[0] : prevChildren,
    );
  }

  for (let i = 0; i < count; i++) {
    const nextChild: any = nextChildren[i];
    const prevChild: any = prevChildren[i];

    if (Array.isArray(nextChild) || Array.isArray(prevChild)) {
      if (!isChildrenEqual(nextChild, prevChild)) {
        return false;
      }
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
    } else if (!isSingleChildEqual(nextChild, prevChild)) {
      return false;
    }
  }

  return true;
};

export const isSingleChildEqual = (nextChild: React.ReactElement, prevChild: React.ReactElement): boolean => {
  if (isNil(nextChild) && isNil(prevChild)) {
    return true;
  }
  if (!isNil(nextChild) && !isNil(prevChild)) {
    const { children: nextChildren, ...nextProps } = nextChild.props || {};
    const { children: prevChildren, ...prevProps } = prevChild.props || {};

    if (nextChildren && prevChildren) {
      return shallowEqual(nextProps, prevProps) && isChildrenEqual(nextChildren, prevChildren);
    }
    if (!nextChildren && !prevChildren) {
      return shallowEqual(nextProps, prevProps);
    }

    return false;
  }

  return false;
};

export const renderByOrder = (children: React.ReactElement[], renderMap: any) => {
  const elements: React.ReactElement[] = [];
  const record: Record<string, boolean> = {};

  toArray(children).forEach((child, index) => {
    if (isSvgElement(child)) {
      elements.push(child);
    } else if (child) {
      const displayName = getDisplayName(child.type);
      const { handler, once } = renderMap[displayName] || {};

      if (handler && (!once || !record[displayName])) {
        const results = handler(child, displayName, index);

        elements.push(results);
        record[displayName] = true;
      }
    }
  });

  return elements;
};

export const getReactEventByType = (e: { type?: string }): string => {
  const type = e && e.type;

  if (type && REACT_BROWSER_EVENT_MAP[type]) {
    return REACT_BROWSER_EVENT_MAP[type];
  }

  return null;
};

export const parseChildIndex = (child: any, children: any[]) => {
  return toArray(children).indexOf(child);
};
