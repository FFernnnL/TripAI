/** Morandi 多日路线配色 */
const DAY_COLORS = [
  '#A8B5C4', // 灰蓝
  '#B5C4A8', // 灰绿
  '#C4B8A8', // 灰棕
  '#C4A8B5', // 灰紫
  '#C4C4A8', // 灰黄
  '#A8C4C4', // 灰青
  '#B5A8C4', // 灰紫蓝
];

export function getDayColor(dayIndex: number): string {
  return DAY_COLORS[dayIndex % DAY_COLORS.length];
}

export function getDayColors(): string[] {
  return [...DAY_COLORS];
}

/** 地点类型图标颜色 */
export const TYPE_COLORS: Record<string, string> = {
  spot: '#A8B5C4',
  restaurant: '#C47B6A',
  shopping: '#C4B88A',
  entertainment: '#C4A8B5',
  hotel: '#B5A99A',
};
