
import { RichCategory, NutritionGuideline, TreatmentPlan, StructuredAdvice, HADSResult, RichSideEffect } from "../types";

// --- HADS QUESTIONS ---
export const HADS_QUESTIONS = [
  { id: 1, category: "A", text: "我感到紧张(或痛苦)", options: ["几乎所有时候", "大多数时候", "有时", "根本没有"], scores: [3, 2, 1, 0] },
  { id: 2, category: "D", text: "我对以往感兴趣的事情还是有兴趣", options: ["肯定一样", "不像以前那么多", "只有一点儿", "基本上没有了"], scores: [0, 1, 2, 3] },
  { id: 3, category: "A", text: "我感到有点害怕，好像预感到有什么可怕事情要发生", options: ["非常肯定和十分严重", "是有，但不太严重", "有一点，但并不使我苦恼", "根本没有"], scores: [3, 2, 1, 0] },
  { id: 4, category: "D", text: "我能够哈哈大笑，并看到事物好的一面", options: ["我经常这样", "现在已经不大这样了", "现在肯定是不太多了", "根本没有"], scores: [0, 1, 2, 3] },
  { id: 5, category: "A", text: "我的心中充满烦恼", options: ["大多数时间", "常常如此", "时时，但并不经常", "偶尔如此"], scores: [3, 2, 1, 0] },
  { id: 6, category: "D", text: "我感到愉快", options: ["根本没有", "并不经常", "有时", "大多数"], scores: [3, 2, 1, 0] },
  { id: 7, category: "A", text: "我能够安闲而轻松地坐着", options: ["肯定", "经常", "并不经常", "根本没有"], scores: [0, 1, 2, 3] },
  { id: 8, category: "D", text: "我对自己的仪容(打扮自己)失去兴趣", options: ["肯定", "并不像我应该做到的那样关心", "我可能不是非常关心", "我仍像以往一样关心"], scores: [3, 2, 1, 0] },
  { id: 9, category: "A", text: "我有点坐立不安，好像感到非要活动不可", options: ["确实非常多", "是不少", "并不很多", "根本没有"], scores: [3, 2, 1, 0] },
  { id: 10, category: "D", text: "我对一切都是乐观地向前看", options: ["差不多是这样做的", "并不完全是这样做的", "很少这样做", "几乎从来不这样做"], scores: [0, 1, 2, 3] },
  { id: 11, category: "A", text: "我有一种恐慌感", options: ["确实很经常", "时常", "并非经常", "根本没有"], scores: [3, 2, 1, 0] },
  { id: 12, category: "D", text: "我好像感到情绪在渐渐低落", options: ["几乎所有的时间", "很经常", "有时", "根本没有"], scores: [3, 2, 1, 0] },
  { id: 13, category: "A", text: "我感到有点害怕，好像某些事情在往坏的方向发展", options: ["根本没有", "有时", "很经常", "非常经常"], scores: [0, 1, 2, 3] },
  { id: 14, category: "D", text: "我能安静地欣赏一本好书或一项好的广播或电视节目", options: ["常常", "有时", "并非经常", "很少"], scores: [0, 1, 2, 3] }
];

export const calculateHADSLevel = (score: number): 'Normal' | 'Mild' | 'Moderate' | 'Severe' => {
    if (score <= 7) return 'Normal';
    if (score <= 10) return 'Mild';
    if (score <= 14) return 'Moderate';
    return 'Severe';
};

// --- SYMPTOM MAPPING FOR BODY MAP ---
export const SYMPTOM_OPTIONS: Record<string, string[]> = {
  'Head': ['头晕', '头痛', '失眠', '视物模糊', '脱发'],
  'Chest': ['咳嗽', '气短', '胸痛', '心悸'],
  'Abdomen': ['恶心', '呕吐', '腹泻', '便秘', '食欲不振'],
  'Limbs': ['手足麻木', '皮疹', '关节疼痛', '水肿', '甲沟炎'],
  'General': ['发热', '乏力', '疼痛', '体重下降']
};

// --- RICH MEDICAL DATABASE ---

export const LUNG_CANCER_DB: RichCategory[] = [
    {
        id: "surgery",
        name: "外科治疗",
        description: "手术是早中期NSCLC治愈的基石，但会造成解剖结构和呼吸动力学的直接创伤。",
        adverseEvents: [
            {
                id: "ptps",
                name: "术后疼痛 (PTPS)",
                mechanism: "肋间神经损伤、引流管压迫及中枢敏化。",
                management: {
                    actionableSteps: [
                        "多模式镇痛：遵医嘱使用非甾体抗炎药(如布洛芬)减少阿片类需求。",
                        "切口保护性咳嗽：用双手或抱枕紧压伤口处咳嗽，减轻疼痛。",
                        "早期下床：术后24小时内下床活动，促进恢复。"
                    ],
                    whenToSeekHelp: "疼痛评分>7分，或出现发热红肿。"
                },
                comfortMessage: "疼痛是身体愈合的信号，利用抱枕和呼吸技巧可以很好地缓解。"
            },
            {
                id: "resp_dysfunction",
                name: "呼吸功能障碍",
                management: {
                    actionableSteps: [
                        "腹式呼吸：吸气时腹部隆起，呼气时腹部内陷，每小时10次。",
                        "缩唇呼吸：鼻吸气2秒，口唇缩成吹口哨状缓慢呼气4-6秒。",
                        "主动循环呼吸技术(ACBT)：帮助清理深部痰液。"
                    ]
                }
            }
        ]
    },
    {
        id: "chemotherapy",
        name: "细胞毒性化疗",
        description: "化疗药物无差别攻击增殖活跃细胞，导致全身性损伤。",
        adverseEvents: [
            {
                id: "cinv",
                name: "恶心呕吐 (CINV)",
                mechanism: "化疗药物刺激迷走神经和中枢CTZ区域。",
                management: {
                    actionableSteps: [
                        "少食多餐：每日5-6顿，避免空腹。",
                        "温度控制：食用室温或冷凉食物（如酸奶、苏打饼干），减少气味刺激。",
                        "晨起干食：起床前吃几片苏打饼干吸附胃酸。"
                    ],
                    medications: ["昂丹司琼", "甲氧氯普胺 (遵医嘱)"],
                    whenToSeekHelp: "连续呕吐超过24小时或无法进食饮水。"
                },
                comfortMessage: "这是一种暂时的反应，结束后会迅速恢复。清淡饮食能帮您度过难关。"
            },
            {
                id: "neutropenia",
                name: "白细胞/中性粒细胞减少",
                riskFactors: "感染风险增加。",
                management: {
                    actionableSteps: [
                        "食品安全：吃熟食，去皮水果，避免生肉/生海鲜/溏心蛋。",
                        "严密防护：佩戴口罩，避免去人群密集场所。",
                        "体温监测：每日监测体温两次。"
                    ],
                    whenToSeekHelp: "体温 > 38.0℃ 需立即就医（发热性中性粒细胞减少）。"
                }
            },
            {
                id: "cipn",
                name: "手足麻木 (CIPN)",
                mechanism: "紫杉类或铂类药物损伤末梢神经。",
                management: {
                    actionableSteps: [
                        "温水泡脚：促进血液循环（水温<40度）。",
                        "精细训练：练习系扣子、捡豆子保持手部功能。",
                        "防跌倒：穿防滑鞋，走路慢行。"
                    ],
                    whenToSeekHelp: "麻木感向肢体近端蔓延或出现剧烈刺痛。"
                },
                comfortMessage: "神经修复需要时间，虽然恢复较慢，但坚持康复训练一定有帮助。"
            },
            {
                id: "alopecia",
                name: "脱发",
                management: {
                    actionableSteps: [
                        "温和护发：使用宽齿梳，避免吹烫。",
                        "心理准备：可提前准备舒适的帽子或假发。",
                        "头皮冷却：化疗期间使用冰帽可减少脱发（咨询医生）。"
                    ]
                },
                comfortMessage: "头发会在化疗结束后的3-6个月内重新长出，往往比以前更卷曲、更黑。"
            }
        ]
    },
    {
        id: "targeted",
        name: "分子靶向治疗",
        description: "特异性靶点抑制带来的皮肤及黏膜毒性。",
        adverseEvents: [
            {
                id: "egfr_rash",
                name: "皮疹 (EGFR-TKI)",
                management: {
                    actionableSteps: [
                        "加强保湿：每日涂抹不含酒精的润肤霜。",
                        "严格防晒：外出戴遮阳帽，使用SPF>30防晒霜。",
                        "温和清洁：使用无皂基沐浴露，水温不宜过高。"
                    ],
                    medications: ["轻度可用红霉素软膏", "中重度需口服抗生素（遵医嘱）"]
                },
                comfortMessage: "皮疹的出现往往意味着药物正在对肿瘤起效，是治疗有效的“副产品”。"
            },
            {
                id: "paronychia",
                name: "甲沟炎",
                management: {
                    actionableSteps: [
                        "浸泡疗法：每日用白醋水（1:10）或硼酸溶液浸泡手指15分钟。",
                        "保持干燥：穿宽松透气的鞋袜。",
                        "修剪指甲：不要剪得太短，避免修剪甲缘皮。"
                    ]
                }
            },
            {
                id: "diarrhea",
                name: "腹泻",
                management: {
                    actionableSteps: [
                        "BRAT饮食：香蕉(Banana)、米饭(Rice)、苹果酱(Applesauce)、烤面包(Toast)。",
                        "补充水分：饮用口服补液盐或运动饮料。",
                        "避免刺激：禁食辛辣、油腻、牛奶和咖啡。"
                    ],
                    whenToSeekHelp: "每日腹泻超过4-6次，或伴有脱水症状。"
                }
            }
        ]
    },
    {
        id: "immuno",
        name: "免疫检查点抑制剂",
        description: "激活T细胞可能导致自身免疫样反应 (irAEs)。",
        adverseEvents: [
            {
                id: "pneumonitis",
                name: "免疫性肺炎 (CIP)",
                management: {
                    actionableSteps: [
                        "症状监测：密切关注是否有新发的干咳、气短。",
                        "血氧监测：家中备指脉氧仪，静息SPO2<95%需警惕。"
                    ],
                    whenToSeekHelp: "出现呼吸困难加重，必须立即就医，这可能是急症。"
                },
                comfortMessage: "免疫性肺炎虽然听起来可怕，但早期发现并使用激素治疗，绝大多数可以完全控制。"
            },
            {
                id: "thyroid",
                name: "甲状腺功能异常",
                management: {
                    actionableSteps: [
                        "定期复查：每3-4周检查甲功。",
                        "症状识别：怕冷、乏力、浮肿可能是甲减；心慌、手抖可能是甲亢。"
                    ],
                    medications: ["优甲乐 (甲减时服用)"]
                },
                comfortMessage: "甲状腺问题非常普遍且容易通过药物调节，不会影响您的正常生活。"
            },
            {
                id: "fatigue_immune",
                name: "免疫性疲乏",
                management: {
                    actionableSteps: [
                        "适度活动：散步、瑜伽等轻运动可缓解疲乏。",
                        "午间小憩：白天小睡不超过30分钟。",
                        "排查原因：若极度疲乏需检查甲状腺或垂体功能。"
                    ]
                }
            }
        ]
    },
    {
        id: "radiotherapy",
        name: "放射治疗",
        description: "高能射线导致的局部组织损伤。",
        adverseEvents: [
            {
                id: "esophagitis",
                name: "放射性食管炎",
                management: {
                    actionableSteps: [
                        "改变质地：吃软食、流食（布丁、粥、蒸蛋）。",
                        "避免刺激：不吃过烫、过硬、辛辣食物。",
                        "止痛技巧：饭前口服利多卡因凝胶或冷牛奶保护黏膜。"
                    ]
                }
            },
            {
                id: "dermatitis_radio",
                name: "放射性皮炎",
                management: {
                    actionableSteps: [
                        "保护照射区：穿纯棉宽松衣物，避免摩擦。",
                        "皮肤清洁：温水轻柔冲洗，切勿揉搓。",
                        "外用药：放疗后涂抹比亚芬或金盏花软膏。"
                    ]
                }
            }
        ]
    }
];

export const NUTRITION_DB: NutritionGuideline[] = [
    {
        id: "general",
        condition: "General",
        content: "总体营养原则：高蛋白、优质脂肪、充足果蔬。",
        allowedFoods: ["鱼肉", "去皮禽肉", "蛋类", "全谷物", "深色蔬菜"],
        avoidFoods: ["红肉 (限量)", "加工肉 (香肠/腊肉)", "酒精", "精制糖"]
    },
    {
        id: "nausea",
        condition: "恶心/呕吐",
        content: "饮食策略：少食多餐，干湿分离。",
        allowedFoods: ["苏打饼干", "烤面包", "姜茶", "柠檬水", "苹果泥"],
        avoidFoods: ["油炸食品", "甜食", "热食 (气味大)"]
    },
    {
        id: "diarrhea",
        condition: "腹泻",
        content: "饮食策略：低渣饮食，补充电解质。",
        allowedFoods: ["白米粥", "面条", "香蕉", "去皮苹果", "清肉汤"],
        avoidFoods: ["粗粮", "豆类", "牛奶", "坚果", "生冷蔬果"]
    },
    {
        id: "mucositis",
        condition: "口腔黏膜炎/吞咽痛",
        content: "饮食策略：机械性软食，低温食物。",
        allowedFoods: ["冰淇淋", "酸奶", "蛋羹", "肉泥", "西瓜"],
        avoidFoods: ["酸性水果 (橘子/西红柿)", "干硬食物", "辛辣调料"]
    }
];

// --- HELPER FUNCTIONS ---

export const getSideEffectsForTreatment = (treatment: TreatmentPlan): RichSideEffect[] => {
    let categoryId = '';
    if (treatment === TreatmentPlan.SURGERY) categoryId = 'surgery';
    else if (treatment === TreatmentPlan.CHEMO_PLATINUM) categoryId = 'chemotherapy';
    else if (treatment === TreatmentPlan.TARGETED_EGFR) categoryId = 'targeted';
    else if (treatment === TreatmentPlan.IMMUNO_PD1) categoryId = 'immuno';
    else if (treatment === TreatmentPlan.RADIO) categoryId = 'radiotherapy';
    
    return LUNG_CANCER_DB.find(c => c.id === categoryId)?.adverseEvents || [];
};

export const generateSmartAdvice = (
    treatment: TreatmentPlan, 
    symptoms: string[], 
    hadsResult?: HADSResult,
    dtScore?: number
): StructuredAdvice[] => {
    const adviceList: StructuredAdvice[] = [];
    const allSideEffects = LUNG_CANCER_DB.flatMap(c => c.adverseEvents);

    // 1. SYMPTOM BASED ADVICE
    symptoms.forEach(sym => {
        // Find matching side effect in DB (fuzzy match)
        const matchedSE = allSideEffects.find(se => se.name.includes(sym) || sym.includes(se.name));
        if (matchedSE) {
            adviceList.push({
                category: 'SideEffect',
                title: `${matchedSE.name} 应对指南`,
                content: matchedSE.management.actionableSteps.join('\n'),
                source: "LungCare 智能不良反应库",
                isComforting: !!matchedSE.comfortMessage
            });
            if (matchedSE.comfortMessage) {
                adviceList.push({
                    category: 'Psych',
                    title: '暖心护航',
                    content: matchedSE.comfortMessage,
                    source: "LungCare 心理支持",
                    isComforting: true
                });
            }
        }
    });

    // 2. NUTRITION ADVICE
    let nutritionGuideline = NUTRITION_DB.find(n => n.condition === "General");
    if (symptoms.some(s => s.includes('恶心') || s.includes('呕吐'))) nutritionGuideline = NUTRITION_DB.find(n => n.condition === "恶心/呕吐");
    else if (symptoms.some(s => s.includes('腹泻'))) nutritionGuideline = NUTRITION_DB.find(n => n.condition === "腹泻");
    
    if (nutritionGuideline) {
        adviceList.push({
            category: 'Nutrition',
            title: '个性化营养建议',
            content: `${nutritionGuideline.content}\n推荐：${nutritionGuideline.allowedFoods.join(', ')}。\n避免：${nutritionGuideline.avoidFoods.join(', ')}。`,
            source: "LungCare 营养数据库"
        });
    }

    // 3. PSYCH ADVICE (HADS & DT BASED)
    
    // DT Logic (Distress Thermometer)
    if (dtScore !== undefined) {
        if (dtScore >= 7) {
            adviceList.push({
                category: 'Psych',
                title: '高度心理痛苦预警 (DT≥7)',
                content: "您的心理痛苦程度较高（重度）。这在治疗过程中并不罕见，但需要重视。建议您向主治医生反馈，或寻求肿瘤心理专科医生的帮助。请记住，寻求帮助是勇敢的表现。",
                source: "DT 心理痛苦温度计",
                severityLevel: 'Severe',
                isComforting: true
            });
        } else if (dtScore >= 4) {
            adviceList.push({
                category: 'Psych',
                title: '中度心理压力 (DT≥4)',
                content: "您近期可能感到压力较大。建议尝试每天进行15分钟的正念冥想或腹式呼吸。如果这种状态持续超过2周，请务必告诉您的医生。",
                source: "DT 心理痛苦温度计",
                severityLevel: 'Moderate'
            });
        }
    }

    // HADS Logic
    if (hadsResult) {
        if (hadsResult.anxietyLevel === 'Moderate' || hadsResult.anxietyLevel === 'Severe') {
            adviceList.push({
                category: 'Psych',
                title: '焦虑缓解干预',
                content: "检测到您近期焦虑水平较高。建议尝试 4-7-8 呼吸法：吸气4秒，屏息7秒，呼气8秒，重复4次。",
                source: "HADS 评估反馈",
                severityLevel: hadsResult.anxietyLevel
            });
        }
        if (hadsResult.depressionLevel === 'Moderate' || hadsResult.depressionLevel === 'Severe') {
            adviceList.push({
                category: 'Psych',
                title: '情绪支持提醒',
                content: "您似乎有些情绪低落。请尝试每天记录一件发生的小确幸，或者与家人聊聊天。我们一直在这里支持您。",
                source: "HADS 评估反馈",
                severityLevel: hadsResult.depressionLevel,
                isComforting: true
            });
        }
    }

    return adviceList;
};
