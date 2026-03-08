import { GenerateRequest } from '../types';

export function buildGeneratePrompt(data: GenerateRequest): { system: string; user: string } {
  const system = `你是一位专业的旅行规划师。请根据用户的需求生成详细的旅行攻略。

你必须严格按照以下JSON格式逐日输出行程，每天一个JSON对象，用 ---DAY_SEPARATOR--- 分隔：

{
  "dayNumber": 1,
  "theme": "当日主题，如'西湖漫游日'",
  "hotel": {
    "name": "酒店名称",
    "address": "酒店详细地址"
  },
  "spots": [
    {
      "name": "景点名称",
      "address": "景点详细地址",
      "description": "推荐理由（50字内）",
      "estimatedMinutes": 90,
      "type": "spot"
    }
  ],
  "restaurants": [
    {
      "name": "餐厅名称",
      "address": "餐厅详细地址",
      "description": "推荐理由（50字内）",
      "estimatedMinutes": 60
    }
  ],
  "notes": "当日注意事项或小贴士"
}

重要规则：
1. 每天安排3-5个景点、2-3个餐厅（含早午晚餐建议）
2. 景点按游览顺序排列，路线要合理，减少折返
3. 地址必须是真实存在的具体地址（包含城市和区域）
4. 只输出JSON，不要输出其他内容
5. 每天的JSON之间用 ---DAY_SEPARATOR--- 分隔`;

  const destinations = data.destinations.join('、');
  const travelerInfo = `${data.adults}位成人${data.children > 0 ? `、${data.children}位儿童` : ''}`;

  let userPrompt = `请为我规划一次旅行：
- 目的地：${destinations}
- 出行日期：${data.startDate} 至 ${data.endDate}
- 共${data.totalDays}天
- 出行人数：${travelerInfo}`;

  if (data.preferences) {
    userPrompt += `\n- 特殊要求：${data.preferences}`;
  }

  return { system, user: userPrompt };
}

export function buildOptimizePrompt(dayData: string, instruction: string): { system: string; user: string } {
  const system = `你是一位专业的旅行规划师。用户希望调整行程中某一天的安排。
请根据用户的修改意见，输出优化后的完整当日行程JSON（格式与原数据相同）。只输出JSON，不要输出其他内容。`;

  const user = `当前行程数据：
${dayData}

用户修改意见：${instruction}

请输出优化后的完整当日行程JSON。`;

  return { system, user };
}
