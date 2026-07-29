/**
 * 放置工厂大亨 - 配置数据
 * 资源 / 机器 / 配方 / 科技树 / 模块 / 太空电梯
 */

// ==================== 资源定义 ====================
const RESOURCES = {
  // 原材料 Tier 0
  iron_ore:    { name: '铁矿石', tier: 0, icon: '⛏️', color: '#94A3B8', sellPrice: 1 },
  copper_ore:  { name: '铜矿石', tier: 0, icon: '⛏️', color: '#F97316', sellPrice: 1 },
  coal:        { name: '煤矿',   tier: 0, icon: '⛏️', color: '#475569', sellPrice: 1 },
  stone:       { name: '石头',   tier: 0, icon: '⛏️', color: '#78716C', sellPrice: 1 },
  bauxite:     { name: '铝土矿', tier: 0, icon: '⛏️', color: '#A78BFA', sellPrice: 2, unlock: 'expand_lv2' },
  crude_oil:   { name: '原油',   tier: 0, icon: '🛢️', color: '#1E293B', sellPrice: 2, unlock: 'expand_lv2' },
  uranium:     { name: '铀矿',   tier: 0, icon: '⛏️', color: '#84CC16', sellPrice: 5, unlock: 'energy_nuclear' },
  titanium:    { name: '钛矿石', tier: 0, icon: '⛏️', color: '#C0C0C0', sellPrice: 10, unlock: 'expand_lv3' },

  // Tier 1 产物
  iron_ingot:  { name: '铁锭',   tier: 1, icon: '🔩', color: '#94A3B8', sellPrice: 2 },
  copper_ingot:{ name: '铜锭',   tier: 1, icon: '🟧', color: '#F97316', sellPrice: 2 },
  stone_brick: { name: '石砖',   tier: 1, icon: '🧱', color: '#78716C', sellPrice: 1 },
  coke:        { name: '焦炭',   tier: 1, icon: '⚫', color: '#475569', sellPrice: 2 },
  pig_iron:    { name: '生铁',   tier: 1, icon: '🔩', color: '#64748B', sellPrice: 3 },

  // Tier 2 产物
  iron_plate:  { name: '铁板',   tier: 2, icon: '📋', color: '#94A3B8', sellPrice: 5 },
  copper_plate:{ name: '铜板',   tier: 2, icon: '🟫', color: '#F97316', sellPrice: 5 },
  gear:        { name: '齿轮',   tier: 2, icon: '⚙️', color: '#64748B', sellPrice: 8 },
  copper_wire: { name: '铜线',   tier: 2, icon: '➰', color: '#F97316', sellPrice: 3 },
  screw:       { name: '螺丝',   tier: 2, icon: '🔩', color: '#94A3B8', sellPrice: 1 },
  concrete:    { name: '混凝土', tier: 2, icon: '🏗️', color: '#78716C', sellPrice: 6 },

  // Tier 3 产物
  steel:       { name: '钢材',   tier: 3, icon: '🏗️', color: '#475569', sellPrice: 25 },
  steel_plate: { name: '钢板',   tier: 3, icon: '📋', color: '#64748B', sellPrice: 20 },
  circuit_board:{name: '电路板', tier: 3, icon: '📦', color: '#10B981', sellPrice: 40 },
  reinforced_plate:{name:'加强铁板',tier:3,icon:'🔧',color: '#475569', sellPrice: 30 },
  plastic:     { name: '塑料',   tier: 3, icon: '🧊', color: '#14B8A6', sellPrice: 15 },
  rubber:      { name: '橡胶',   tier: 3, icon: '⭕', color: '#92400E', sellPrice: 12 },
  sulfuric_acid:{name: '硫酸',   tier: 3, icon: '🧪', color: '#14B8A6', sellPrice: 18 },

  // Tier 4 产物
  aluminum_ingot:{name:'铝锭',   tier: 4, icon: '⬜', color: '#A78BFA', sellPrice: 15, unlock: 'expand_lv2' },
  aluminum_alloy:{name:'铝合金', tier: 4, icon: '✈️', color: '#A78BFA', sellPrice: 90 },
  electronic_component:{name:'电子元件',tier:4,icon:'💻',color:'#3B82F6',sellPrice:120 },
  electric_motor:{name:'电动马达',tier: 4, icon: '⚡', color: '#FBBF24', sellPrice: 100 },
  battery:     { name: '电池',   tier: 4, icon: '🔋', color: '#84CC16', sellPrice: 80 },

  // Tier 5 产物
  processor:   { name: '处理器', tier: 5, icon: '🖥️', color: '#8B5CF6', sellPrice: 500, unlock: 'expand_lv3' },
  electric_furnace:{name:'电炉', tier: 5, icon: '🔥', color: '#EF4444', sellPrice: 400 },
  robot_frame: { name: '机器人框架',tier: 5, icon: '🤖', color: '#64748B', sellPrice: 800, unlock: 'expand_lv3' },
  nuclear_fuel:{ name: '核燃料', tier: 5, icon: '☢️', color: '#84CC16', sellPrice: 300, unlock: 'energy_nuclear' },

  // Tier 6 产物
  industrial_robot:{name:'工业机器人',tier:6,icon:'🤖',color:'#8B5CF6',sellPrice:3000, unlock: 'star_tech' },
  quantum_chip:{ name: '量子芯片',tier: 6, icon: '💎', color: '#A78BFA', sellPrice: 5000, unlock: 'star_tech' },
  low_density_structure:{name:'低密度结构',tier:6,icon:'🚀',color:'#C0C0C0',sellPrice:2000, unlock: 'star_tech' },
  rocket_part: { name: '火箭部件',tier: 6, icon: '🚀', color: '#EF4444', sellPrice: 20000, unlock: 'star_tech' },

  // 科研瓶（特殊产物，不卖钱）
  red_bottle:    { name: '红瓶', tier: 2, icon: '🔴', color: '#EF4444', sellPrice: 0, isResearch: true },
  green_bottle:  { name: '绿瓶', tier: 3, icon: '🟢', color: '#10B981', sellPrice: 0, isResearch: true, unlock: 'auto_lv1' },
  blue_bottle:   { name: '蓝瓶', tier: 4, icon: '🔵', color: '#3B82F6', sellPrice: 0, isResearch: true, unlock: 'expand_lv2' },
  gray_bottle:   { name: '灰瓶', tier: 5, icon: '⚫', color: '#6B7280', sellPrice: 0, isResearch: true, unlock: 'expand_lv3' },
  gold_bottle:   { name: '金瓶', tier: 6, icon: '🟡', color: '#F5A623', sellPrice: 0, isResearch: true, unlock: 'star_tech' },
};

// ==================== 机器定义 ====================
const MACHINES = {
  miner: {
    name: '采矿器', icon: '⛏️', tier: 0,
    inputs: 0, outputs: 1,
    baseCost: 50, basePower: 5, baseRate: 1.0,
    description: '从矿点自动开采原材料',
    unlock: null,
  },
  smelter: {
    name: '冶炼炉', icon: '🔲', tier: 1,
    inputs: 1, outputs: 1,
    baseCost: 200, basePower: 15, baseRate: 0.8,
    description: '将矿石冶炼为金属锭',
    unlock: null,
  },
  constructor: {
    name: '构造机', icon: '▫️', tier: 2,
    inputs: 1, outputs: 1,
    baseCost: 1000, basePower: 30, baseRate: 0.6,
    description: '将锭加工为基础零件',
    unlock: 'efficiency_lv1',
  },
  assembler: {
    name: '组装机', icon: '▫️', tier: 3,
    inputs: 2, outputs: 1,
    baseCost: 5000, basePower: 50, baseRate: 0.4,
    description: '将两个零件组装为组件',
    unlock: 'expand_lv1',
  },
  manufacturer: {
    name: '制造商', icon: '▫️', tier: 4,
    inputs: 3, outputs: 1,
    baseCost: 25000, basePower: 80, baseRate: 0.25,
    description: '高级多输入制造',
    unlock: 'expand_petro',
  },
  chemical_plant: {
    name: '化工厂', icon: '▫️', tier: 3,
    inputs: 2, outputs: 1,
    baseCost: 8000, basePower: 60, baseRate: 0.35,
    description: '处理原油等流体原料',
    unlock: 'expand_lv2',
  },
  precision_factory: {
    name: '精密制造', icon: '▫️', tier: 5,
    inputs: 4, outputs: 1,
    baseCost: 200000, basePower: 150, baseRate: 0.12,
    description: '制造处理器等精密件',
    unlock: 'expand_lv3',
  },
  assembly_center: {
    name: '总装中心', icon: '▫️', tier: 6,
    inputs: 5, outputs: 1,
    baseCost: 2000000, basePower: 300, baseRate: 0.05,
    description: '组装终极产品',
    unlock: 'star_tech',
  },
  research_center: {
    name: '研究中心', icon: '🔬', tier: 2,
    inputs: 1, outputs: 0,
    baseCost: 3000, basePower: 40, baseRate: 1.0,
    description: '消耗科研瓶产出科技点',
    unlock: 'efficiency_lv1',
    isResearch: true,
  },
  awesome_sink: {
    name: '回收器', icon: '♻️', tier: 2,
    inputs: 1, outputs: 0,
    baseCost: 5000, basePower: 20, baseRate: 10.0,
    description: '将多余产物回收为积分',
    unlock: 'auto_lv2',
    isSink: true,
  },
};

// ==================== 配方定义 ====================
const RECIPES = {
  mine_iron:    { machine: 'miner', inputs: {}, outputs: { iron_ore: 1 }, time: 1.0, unlock: null },
  mine_copper:  { machine: 'miner', inputs: {}, outputs: { copper_ore: 1 }, time: 1.0, unlock: null },
  mine_coal:    { machine: 'miner', inputs: {}, outputs: { coal: 1 }, time: 1.0, unlock: null },
  mine_stone:   { machine: 'miner', inputs: {}, outputs: { stone: 1 }, time: 1.0, unlock: null },
  mine_bauxite: { machine: 'miner', inputs: {}, outputs: { bauxite: 1 }, time: 1.2, unlock: 'expand_lv2' },
  mine_oil:     { machine: 'miner', inputs: {}, outputs: { crude_oil: 1 }, time: 1.2, unlock: 'expand_lv2' },
  mine_uranium: { machine: 'miner', inputs: {}, outputs: { uranium: 1 }, time: 2.0, unlock: 'energy_nuclear' },
  mine_titanium:{ machine: 'miner', inputs: {}, outputs: { titanium: 1 }, time: 2.5, unlock: 'expand_lv3' },

  smelt_iron:   { machine: 'smelter', inputs: { iron_ore: 1 }, outputs: { iron_ingot: 1 }, time: 1.5, unlock: null },
  smelt_copper: { machine: 'smelter', inputs: { copper_ore: 1 }, outputs: { copper_ingot: 1 }, time: 1.5, unlock: null },
  smelt_stone:  { machine: 'smelter', inputs: { stone: 1 }, outputs: { stone_brick: 1 }, time: 2.0, unlock: null },
  smelt_coke:   { machine: 'smelter', inputs: { coal: 2 }, outputs: { coke: 1 }, time: 2.0, unlock: null },
  smelt_aluminum:{machine: 'smelter', inputs: { bauxite: 2 }, outputs: { aluminum_ingot: 1 }, time: 3.0, unlock: 'expand_lv2' },
  smelt_pig_iron:{machine: 'smelter', inputs: { iron_ore: 3 }, outputs: { pig_iron: 2 }, time: 4.0, unlock: 'alt_pig_iron' },

  craft_iron_plate: { machine: 'constructor', inputs: { iron_ingot: 1 }, outputs: { iron_plate: 2 }, time: 1.0, unlock: 'efficiency_lv1' },
  craft_copper_plate:{machine: 'constructor', inputs: { copper_ingot: 1 }, outputs: { copper_plate: 2 }, time: 1.0, unlock: 'efficiency_lv1' },
  craft_gear:       { machine: 'constructor', inputs: { iron_ingot: 2 }, outputs: { gear: 1 }, time: 1.5, unlock: 'efficiency_lv1' },
  craft_wire:       { machine: 'constructor', inputs: { copper_ingot: 1 }, outputs: { copper_wire: 3 }, time: 1.0, unlock: 'efficiency_lv1' },
  craft_concrete:   { machine: 'constructor', inputs: { stone_brick: 2, coke: 1 }, outputs: { concrete: 1 }, time: 3.0, unlock: 'efficiency_lv1' },
  craft_screw:      { machine: 'constructor', inputs: { iron_plate: 3 }, outputs: { screw: 5 }, time: 2.0, unlock: 'efficiency_lv1' },
  craft_gear_alt:   { machine: 'constructor', inputs: { iron_ingot: 2 }, outputs: { gear: 2 }, time: 3.0, unlock: 'alt_gear' },
  craft_plate_alt:  { machine: 'constructor', inputs: { pig_iron: 1 }, outputs: { iron_plate: 1 }, time: 0.5, unlock: 'alt_pig_iron' },

  assemble_circuit:   { machine: 'assembler', inputs: { steel: 2, copper_wire: 1 }, outputs: { circuit_board: 1 }, time: 4.0, unlock: 'expand_lv1' },
  assemble_reinforced:{ machine: 'assembler', inputs: { iron_plate: 4, screw: 8 }, outputs: { reinforced_plate: 1 }, time: 3.0, unlock: 'expand_lv1' },
  assemble_coil:      { machine: 'assembler', inputs: { copper_plate: 2, iron_plate: 1 }, outputs: { electric_motor: 0 }, time: 2.5, unlock: 'expand_lv1' },
  assemble_circuit_alt:{machine: 'assembler', inputs: { plastic: 2, copper_wire: 3 }, outputs: { circuit_board: 2 }, time: 3.0, unlock: 'alt_circuit' },

  make_steel:       { machine: 'assembler', inputs: { iron_ingot: 5, coke: 1 }, outputs: { steel: 1 }, time: 6.0, unlock: 'expand_lv1' },
  make_steel_alt:   { machine: 'assembler', inputs: { iron_ingot: 3, stone_brick: 1 }, outputs: { steel: 1 }, time: 4.0, unlock: 'alt_steel' },
  make_steel_plate: { machine: 'assembler', inputs: { iron_plate: 3, coke: 1 }, outputs: { steel_plate: 2 }, time: 3.0, unlock: 'expand_lv1' },

  chem_refine_oil:  { machine: 'chemical_plant', inputs: { crude_oil: 2 }, outputs: { plastic: 1, rubber: 0 }, time: 5.0, unlock: 'expand_lv2' },
  chem_sulfuric:    { machine: 'chemical_plant', inputs: { crude_oil: 3 }, outputs: { sulfuric_acid: 1 }, time: 4.0, unlock: 'expand_lv2' },
  chem_plastic_alt: { machine: 'chemical_plant', inputs: { coal: 1 }, outputs: { plastic: 1 }, time: 3.0, unlock: 'alt_plastic' },
  chem_rubber:      { machine: 'chemical_plant', inputs: { crude_oil: 1 }, outputs: { rubber: 1 }, time: 2.5, unlock: 'expand_lv2' },

  make_electronic:  { machine: 'manufacturer', inputs: { circuit_board: 2, copper_wire: 4, plastic: 1 }, outputs: { electronic_component: 1 }, time: 6.0, unlock: 'expand_petro' },
  make_motor:       { machine: 'manufacturer', inputs: { gear: 2, steel_plate: 2, copper_wire: 2 }, outputs: { electric_motor: 1 }, time: 5.0, unlock: 'expand_petro' },
  make_battery:     { machine: 'manufacturer', inputs: { sulfuric_acid: 1, copper_plate: 3, iron_plate: 2 }, outputs: { battery: 2 }, time: 8.0, unlock: 'expand_petro' },
  make_aluminum_alloy:{machine: 'manufacturer', inputs: { aluminum_ingot: 2, copper_wire: 1, steel_plate: 1 }, outputs: { aluminum_alloy: 2 }, time: 5.0, unlock: 'expand_petro' },
  make_electronic_alt:{machine:'manufacturer', inputs: { circuit_board: 1, electronic_component: 1, plastic: 1 }, outputs: { electronic_component: 2 }, time: 4.0, unlock: 'alt_electronic' },
  make_reinforced_alt:{machine:'manufacturer', inputs: { gear: 1, steel: 2, screw: 4 }, outputs: { reinforced_plate: 2 }, time: 3.0, unlock: 'alt_reinforced' },

  make_processor:   { machine: 'precision_factory', inputs: { electronic_component: 4, circuit_board: 2, copper_wire: 6, plastic: 2 }, outputs: { processor: 1 }, time: 10.0, unlock: 'expand_lv3' },
  make_furnace:     { machine: 'precision_factory', inputs: { electric_motor: 2, gear: 4, steel_plate: 3, copper_wire: 2 }, outputs: { electric_furnace: 1 }, time: 8.0, unlock: 'expand_lv3' },
  make_robot_frame: { machine: 'precision_factory', inputs: { battery: 4, aluminum_alloy: 2, circuit_board: 1, screw: 8 }, outputs: { robot_frame: 1 }, time: 12.0, unlock: 'expand_lv3' },
  make_nuclear_fuel:{ machine: 'precision_factory', inputs: { uranium: 3, sulfuric_acid: 2, steel_plate: 2, concrete: 1 }, outputs: { nuclear_fuel: 1 }, time: 15.0, unlock: 'energy_nuclear' },

  make_robot:       { machine: 'assembly_center', inputs: { robot_frame: 2, processor: 1, electric_motor: 2, battery: 4, circuit_board: 4 }, outputs: { industrial_robot: 1 }, time: 20.0, unlock: 'star_tech' },
  make_quantum:     { machine: 'assembly_center', inputs: { processor: 2, electronic_component: 4, aluminum_alloy: 3, nuclear_fuel: 1 }, outputs: { quantum_chip: 1 }, time: 25.0, unlock: 'star_tech' },
  make_lds:         { machine: 'assembly_center', inputs: { aluminum_alloy: 4, steel_plate: 4, circuit_board: 2, screw: 16 }, outputs: { low_density_structure: 1 }, time: 15.0, unlock: 'star_tech' },
  make_rocket:      { machine: 'assembly_center', inputs: { quantum_chip: 1, processor: 2, robot_frame: 1, nuclear_fuel: 1 }, outputs: { rocket_part: 1 }, time: 30.0, unlock: 'star_tech' },

  craft_red_bottle:   { machine: 'constructor', inputs: { gear: 1, copper_plate: 1 }, outputs: { red_bottle: 1 }, time: 5.0, unlock: 'efficiency_lv1' },
  craft_green_bottle: { machine: 'assembler', inputs: { circuit_board: 1, screw: 4 }, outputs: { green_bottle: 1 }, time: 6.0, unlock: 'auto_lv1' },
  craft_blue_bottle:  { machine: 'manufacturer', inputs: { plastic: 1, battery: 1, sulfuric_acid: 1 }, outputs: { blue_bottle: 1 }, time: 10.0, unlock: 'expand_lv2' },
  craft_gray_bottle:  { machine: 'precision_factory', inputs: { electric_furnace: 1, concrete: 3, steel: 2 }, outputs: { gray_bottle: 1 }, time: 12.0, unlock: 'expand_lv3' },
  craft_gold_bottle:  { machine: 'assembly_center', inputs: { processor: 1, robot_frame: 1, low_density_structure: 1 }, outputs: { gold_bottle: 1 }, time: 20.0, unlock: 'star_tech' },
};

// ==================== 模块定义 ====================
const MODULES = {
  speed_mk1:    { name: '速度模块Mk1', icon: '⚡', rarity: 'common',   effect: { rateMul: 1.2, powerMul: 1.3 }, cost: 5000, unlock: 'efficiency_lv1' },
  speed_mk2:    { name: '速度模块Mk2', icon: '⚡', rarity: 'rare',     effect: { rateMul: 1.35, powerMul: 1.35 }, cost: 50000, unlock: 'efficiency_lv2' },
  speed_mk3:    { name: '速度模块Mk3', icon: '⚡', rarity: 'epic',     effect: { rateMul: 1.5, powerMul: 1.4 }, cost: 500000, unlock: 'efficiency_overclock' },
  productivity_mk1:{name:'产能模块Mk1',icon:'📦',rarity: 'common',   effect: { doubleChance: 0.05 }, cost: 8000, unlock: 'efficiency_lv1' },
  productivity_mk2:{name:'产能模块Mk2',icon:'📦',rarity: 'rare',     effect: { doubleChance: 0.10 }, cost: 80000, unlock: 'efficiency_productivity' },
  efficiency_mk1:{ name: '效率模块Mk1', icon: '🔋', rarity: 'common',   effect: { powerMul: 0.7 }, cost: 6000, unlock: 'energy_lv2' },
  efficiency_mk2:{ name: '效率模块Mk2', icon: '🔋', rarity: 'rare',     effect: { powerMul: 0.5 }, cost: 60000, unlock: 'energy_lv2' },
  chain_mk1:    { name: '连锁模块Mk1', icon: '🔄', rarity: 'rare',     effect: { chainChance: 0.10 }, cost: 100000, unlock: 'efficiency_productivity' },
  quantum_mk1:  { name: '量子模块Mk1', icon: '⭐', rarity: 'epic',     effect: { rateMul: 1.1, powerMul: 0.9, doubleChance: 0.05 }, cost: 0, unlock: 'efficiency_lv3', isDiamond: true, diamondCost: 20 },
  quantum_mk2:  { name: '量子模块Mk2', icon: '⭐', rarity: 'legendary', effect: { rateMul: 1.2, powerMul: 0.8, doubleChance: 0.10 }, cost: 0, unlock: 'efficiency_max', isDiamond: true, diamondCost: 50 },
};

// ==================== 科技树定义 ====================
const TECH_TREE = {
  efficiency_lv1: {
    name: '效率Lv1', line: 'efficiency', tier: 1,
    cost: { red_bottle: 10 },
    effects: { globalRateMul: 1.10, machineMaxLevel: 5 },
    description: '全局产出+10%，机器升级上限→Lv5',
    unlocks: ['constructor', 'craft_iron_plate', 'craft_copper_plate', 'craft_gear', 'craft_wire', 'craft_concrete', 'craft_screw', 'research_center', 'craft_red_bottle', 'speed_mk1', 'productivity_mk1'],
    prereq: [],
  },
  efficiency_lv2: {
    name: '效率Lv2', line: 'efficiency', tier: 2,
    cost: { red_bottle: 20, green_bottle: 10 },
    effects: { globalRateMul: 1.15 },
    description: '全局产出+15%',
    unlocks: ['speed_mk2'],
    prereq: ['efficiency_lv1'],
  },
  efficiency_overclock: {
    name: '超频技术', line: 'efficiency', tier: 3, branch: 'A',
    cost: { red_bottle: 30, green_bottle: 20, blue_bottle: 10 },
    effects: { overclock: true },
    description: '解锁超频模式，机器可临时2倍速运转（耗电×3）',
    unlocks: ['speed_mk3'],
    prereq: ['efficiency_lv2'],
  },
  efficiency_productivity: {
    name: '产能突破', line: 'efficiency', tier: 3, branch: 'B',
    cost: { red_bottle: 30, green_bottle: 20, blue_bottle: 10 },
    effects: { globalDoubleChance: 0.05 },
    description: '5%概率双倍产出',
    unlocks: ['productivity_mk2', 'chain_mk1'],
    prereq: ['efficiency_lv2'],
  },
  efficiency_lv3: {
    name: '效率Lv3', line: 'efficiency', tier: 4,
    cost: { gray_bottle: 25, blue_bottle: 30 },
    effects: { globalRateMul: 1.25, machineMaxLevel: 10 },
    description: '全局产出+25%，机器升级上限→Lv10',
    unlocks: ['quantum_mk1'],
    prereq: ['efficiency_overclock', 'efficiency_productivity'],
    requireAny: true,
  },
  efficiency_max: {
    name: '极致效率', line: 'efficiency', tier: 5,
    cost: { gold_bottle: 30, gray_bottle: 40 },
    effects: { globalRateMul: 1.50, machineMaxLevel: 20 },
    description: '全局产出+50%，机器升级上限→Lv20',
    unlocks: ['quantum_mk2'],
    prereq: ['efficiency_lv3'],
  },

  energy_lv1: {
    name: '能源Lv1', line: 'energy', tier: 1,
    cost: { red_bottle: 15 },
    effects: { powerCapacityMul: 1.5 },
    description: '电力容量+50%',
    unlocks: [],
    prereq: [],
  },
  energy_lv2: {
    name: '能源Lv2', line: 'energy', tier: 2,
    cost: { red_bottle: 20, green_bottle: 15 },
    effects: { lowPowerPenalty: 0.5 },
    description: '电力不足时降速而非停机，解锁蓄电池',
    unlocks: ['efficiency_mk1'],
    prereq: ['energy_lv1'],
  },
  energy_nuclear: {
    name: '核能路线', line: 'energy', tier: 3, branch: 'A',
    cost: { green_bottle: 25, blue_bottle: 20 },
    effects: { nuclearPower: true },
    description: '解锁核能发电机（燃煤10倍），解锁铀矿开采',
    unlocks: ['mine_uranium', 'make_nuclear_fuel'],
    prereq: ['energy_lv2'],
  },
  energy_renewable: {
    name: '可再生路线', line: 'energy', tier: 3, branch: 'B',
    cost: { green_bottle: 25, blue_bottle: 20 },
    effects: { renewablePower: true },
    description: '解锁太阳能/风力，在线时发电免费',
    unlocks: [],
    prereq: ['energy_lv2'],
  },
  energy_lv3: {
    name: '能源Lv3', line: 'energy', tier: 4,
    cost: { blue_bottle: 30, gray_bottle: 20 },
    effects: { powerCapacityMul: 3.0, globalPowerMul: 0.8 },
    description: '电力容量×3，全局能耗-20%',
    unlocks: [],
    prereq: ['energy_nuclear', 'energy_renewable'],
    requireAny: true,
  },
  energy_perpetual: {
    name: '永动能源', line: 'energy', tier: 5,
    cost: { gold_bottle: 25, gray_bottle: 35 },
    effects: { globalPowerMul: 0.6, infinitePower: true },
    description: '全局能耗-40%，解锁零点能发电机（无限免费电力）',
    unlocks: [],
    prereq: ['energy_lv3'],
  },

  auto_lv1: {
    name: '自动化Lv1', line: 'automation', tier: 1,
    cost: { red_bottle: 10, green_bottle: 5 },
    effects: { logisticsLevel: 2, autoSell: true },
    description: '物流Lv2（损耗5%），自动出售成品',
    unlocks: ['green_bottle', 'craft_green_bottle'],
    prereq: [],
  },
  auto_lv2: {
    name: '自动化Lv2', line: 'automation', tier: 2,
    cost: { green_bottle: 20, blue_bottle: 10 },
    effects: { logisticsLevel: 3, autoUpgrade: true },
    description: '物流Lv3（损耗1%），自动升级机器，解锁回收器',
    unlocks: ['awesome_sink'],
    prereq: ['auto_lv1'],
  },
  auto_smart: {
    name: '智能管理', line: 'automation', tier: 3, branch: 'A',
    cost: { green_bottle: 30, blue_bottle: 25, gray_bottle: 10 },
    effects: { logisticsLevel: 4, aiBalance: true },
    description: '物流Lv4（0损耗），AI自动平衡产线',
    unlocks: [],
    prereq: ['auto_lv2'],
  },
  auto_blueprint: {
    name: '蓝图系统', line: 'automation', tier: 3, branch: 'B',
    cost: { green_bottle: 30, blue_bottle: 25, gray_bottle: 10 },
    effects: { blueprintSlots: 3 },
    description: '解锁蓝图保存/一键部署',
    unlocks: [],
    prereq: ['auto_lv2'],
  },
  auto_lv3: {
    name: '自动化Lv3', line: 'automation', tier: 4,
    cost: { gray_bottle: 30, blue_bottle: 35 },
    effects: { autoRecipe: true, autoResearch: true, blueprintSlots: 8 },
    description: '自动切换配方，自动研究科技，蓝图槽+5',
    unlocks: [],
    prereq: ['auto_smart', 'auto_blueprint'],
    requireAny: true,
  },
  auto_full: {
    name: '全自动工厂', line: 'automation', tier: 5,
    cost: { gold_bottle: 35, gray_bottle: 40 },
    effects: { autoPrestige: true, autoElevator: true },
    description: '自动转生，自动交付太空电梯',
    unlocks: [],
    prereq: ['auto_lv3'],
  },

  economy_lv1: {
    name: '经济Lv1', line: 'economy', tier: 1,
    cost: { red_bottle: 15, green_bottle: 10 },
    effects: { sellPriceMul: 1.10 },
    description: '全局售价+10%，解锁合同订单',
    unlocks: [],
    prereq: [],
  },
  economy_lv2: {
    name: '经济Lv2', line: 'economy', tier: 2,
    cost: { green_bottle: 20, blue_bottle: 15 },
    effects: { sellPriceMul: 1.15, offlineEfficiency: 0.70 },
    description: '售价+15%，离线效率→70%',
    unlocks: [],
    prereq: ['economy_lv1'],
  },
  economy_bulk: {
    name: '批量订单', line: 'economy', tier: 3, branch: 'A',
    cost: { blue_bottle: 25, gray_bottle: 15 },
    effects: { bulkOrderBonus: 1.30 },
    description: '大客户售价+30%',
    unlocks: [],
    prereq: ['economy_lv2'],
  },
  economy_recycle: {
    name: '回收优化', line: 'economy', tier: 3, branch: 'B',
    cost: { blue_bottle: 25, gray_bottle: 15 },
    effects: { sinkRateMul: 1.5 },
    description: '回收器兑换率+50%，解锁积分商店',
    unlocks: [],
    prereq: ['economy_lv2'],
  },
  economy_lv3: {
    name: '经济Lv3', line: 'economy', tier: 4,
    cost: { gray_bottle: 25, blue_bottle: 30 },
    effects: { sellPriceMul: 1.25, offlineEfficiency: 0.85, offlineMaxHours: 16 },
    description: '售价+25%，离线效率→85%，离线上限→16h',
    unlocks: [],
    prereq: ['economy_bulk', 'economy_recycle'],
    requireAny: true,
  },
  economy_empire: {
    name: '商业帝国', line: 'economy', tier: 5,
    cost: { gold_bottle: 30, gray_bottle: 35 },
    effects: { sellPriceMul: 1.50, offlineEfficiency: 1.0, offlineMaxHours: 24 },
    description: '售价+50%，离线效率→100%，离线上限→24h',
    unlocks: [],
    prereq: ['economy_lv3'],
  },

  expand_lv1: {
    name: '扩展Lv1', line: 'expand', tier: 1,
    cost: { red_bottle: 15, green_bottle: 10 },
    effects: {},
    description: '解锁组装机+钢材配方',
    unlocks: ['assembler', 'assemble_circuit', 'assemble_reinforced', 'make_steel', 'make_steel_plate', 'alt_circuit'],
    prereq: [],
  },
  expand_lv2: {
    name: '扩展Lv2', line: 'expand', tier: 2,
    cost: { green_bottle: 20, blue_bottle: 15 },
    effects: {},
    description: '解锁化工厂+原油链+铝土矿+蓝瓶',
    unlocks: ['chemical_plant', 'bauxite', 'crude_oil', 'mine_bauxite', 'mine_oil', 'smelt_aluminum', 'chem_refine_oil', 'chem_sulfuric', 'chem_rubber', 'blue_bottle', 'craft_blue_bottle'],
    prereq: ['expand_lv1'],
  },
  expand_petro: {
    name: '石化深加工', line: 'expand', tier: 3, branch: 'A',
    cost: { blue_bottle: 25, gray_bottle: 15 },
    effects: {},
    description: '解锁制造商+电子元件/电池/铝合金',
    unlocks: ['manufacturer', 'make_electronic', 'make_motor', 'make_battery', 'make_aluminum_alloy'],
    prereq: ['expand_lv2'],
  },
  expand_mining: {
    name: '采矿扩展', line: 'expand', tier: 3, branch: 'B',
    cost: { blue_bottle: 25, gray_bottle: 15 },
    effects: { miningRateMul: 2.0 },
    description: '矿产量×2，解锁稀有矿脉',
    unlocks: [],
    prereq: ['expand_lv2'],
  },
  expand_lv3: {
    name: '扩展Lv3', line: 'expand', tier: 4,
    cost: { gray_bottle: 25, blue_bottle: 30 },
    effects: {},
    description: '解锁精密制造+处理器/机器人框架+钛矿',
    unlocks: ['precision_factory', 'titanium', 'mine_titanium', 'processor', 'make_processor', 'make_furnace', 'make_robot_frame', 'robot_frame', 'gray_bottle', 'craft_gray_bottle'],
    prereq: ['expand_petro', 'expand_mining'],
    requireAny: true,
  },
  star_tech: {
    name: '星际科技', line: 'expand', tier: 5,
    cost: { gold_bottle: 30, gray_bottle: 40 },
    effects: { multiFactory: true },
    description: '解锁总装中心+量子芯片/火箭部件+多工厂',
    unlocks: ['assembly_center', 'industrial_robot', 'quantum_chip', 'low_density_structure', 'rocket_part', 'make_robot', 'make_quantum', 'make_lds', 'make_rocket', 'gold_bottle', 'craft_gold_bottle'],
    prereq: ['expand_lv3'],
  },

  military_lv1: {
    name: '军事Lv1', line: 'military', tier: 1,
    cost: { red_bottle: 20, green_bottle: 10 },
    effects: {},
    description: '解锁战舰配件制造',
    unlocks: ['hull_scout', 'engine_basic', 'weapon_laser', 'shield_basic', 'control_basic'],
    prereq: ['expand_lv1'],
  },
  military_lv2: {
    name: '军事Lv2', line: 'military', tier: 2,
    cost: { green_bottle: 20, blue_bottle: 15 },
    effects: {},
    description: '解锁护卫舰级配件',
    unlocks: ['hull_frigate', 'engine_ion', 'weapon_missile', 'shield_energy', 'control_advanced'],
    prereq: ['military_lv1'],
  },
  military_lv3: {
    name: '军事Lv3', line: 'military', tier: 3,
    cost: { blue_bottle: 25, gray_bottle: 15 },
    effects: {},
    description: '解锁巡洋舰级配件',
    unlocks: ['hull_cruiser', 'engine_warp', 'weapon_railgun', 'shield_quantum', 'control_ai'],
    prereq: ['military_lv2'],
  },
  star_military: {
    name: '星际军事', line: 'military', tier: 4,
    cost: { gold_bottle: 20, gray_bottle: 30 },
    effects: { fleetPowerMul: 1.5 },
    description: '解锁航母级配件，舰队战力+50%',
    unlocks: ['hull_carrier', 'weapon_plasma'],
    prereq: ['military_lv3'],
  },

  character_lv1: {
    name: '角色Lv1', line: 'character', tier: 1,
    cost: { red_bottle: 15, green_bottle: 10 },
    effects: { characterSlots: 3 },
    description: '解锁角色系统，3个角色位',
    unlocks: [],
    prereq: [],
  },
  character_lv2: {
    name: '角色Lv2', line: 'character', tier: 2,
    cost: { green_bottle: 20, blue_bottle: 15 },
    effects: { characterSlots: 6 },
    description: '角色位+3，解锁SSR角色',
    unlocks: ['eng_5', 'mil_5'],
    prereq: ['character_lv1'],
  },
  character_lv3: {
    name: '角色Lv3', line: 'character', tier: 3,
    cost: { blue_bottle: 25, gray_bottle: 15 },
    effects: { characterSlots: 10, classMul: 1.5 },
    description: '角色位+4，职业加成×1.5',
    unlocks: [],
    prereq: ['character_lv2'],
  },
};

// ==================== 替代配方解锁（硬盘） ====================
const ALT_RECIPES = {
  alt_gear:        { name: '高效齿轮', recipe: 'craft_gear_alt', description: '铁锭×2→齿轮×2（慢但产量翻倍）' },
  alt_pig_iron:    { name: '生铁配方', recipe: 'smelt_pig_iron', description: '铁矿石×3→生铁×2（产量高但慢）' },
  alt_steel:       { name: '省煤钢材', recipe: 'make_steel_alt', description: '铁锭×3+石砖→钢材（省煤耗石）' },
  alt_circuit:     { name: '石化电路板', recipe: 'assemble_circuit_alt', description: '塑料×2+铜线×3→电路板×2' },
  alt_plastic:     { name: '煤制塑料', recipe: 'chem_plastic_alt', description: '煤×1→塑料×1（不走原油链）' },
  alt_electronic:  { name: '自消耗电子', recipe: 'make_electronic_alt', description: '电路板+电子元件+塑料→电子元件×2' },
  alt_reinforced:  { name: '快速加强板', recipe: 'make_reinforced_alt', description: '齿轮+钢材+螺丝→加强铁板×2' },
};

// ==================== 太空电梯阶段 ====================
const SPACE_ELEVATOR = [
  {
    stage: 1, name: '首次发射',
    deliver: { steel: 100, gear: 50, circuit_board: 20 },
    rewards: { unlock: ['expand_petro', 'expand_mining'], desc: '解锁Tier4制造商' },
  },
  {
    stage: 2, name: '轨道空间站',
    deliver: { electronic_component: 50, battery: 30, aluminum_alloy: 40 },
    rewards: { unlock: ['expand_lv3'], desc: '解锁Tier5精密制造+核能' },
  },
  {
    stage: 3, name: '深空探测',
    deliver: { processor: 30, robot_frame: 15, nuclear_fuel: 10 },
    rewards: { unlock: ['star_tech'], desc: '解锁Tier6总装中心+太空科技' },
  },
  {
    stage: 4, name: '星际殖民',
    deliver: { industrial_robot: 5, quantum_chip: 3, rocket_part: 1 },
    rewards: { unlock: [], desc: '通关！可转生' },
  },
];

// ==================== 发电机定义 ====================
const GENERATORS = {
  biomass: { name: '生物质发电', basePower: 50, baseCost: 100, unlock: null, fuel: null },
  coal_gen: { name: '燃煤发电机', basePower: 200, baseCost: 2000, unlock: 'energy_lv1', fuel: { coal: 1 } },
  nuclear:  { name: '核能发电机', basePower: 2000, baseCost: 100000, unlock: 'energy_nuclear', fuel: { nuclear_fuel: 1 } },
  solar:    { name: '太阳能板', basePower: 150, baseCost: 50000, unlock: 'energy_renewable', fuel: null },
  fusion:   { name: '聚变发电机', basePower: 20000, baseCost: 5000000, unlock: 'energy_lv3', fuel: null },
  zero:     { name: '零点能发电机', basePower: 999999, baseCost: 0, unlock: 'energy_perpetual', fuel: null, isDiamond: true, diamondCost: 100 },
};

// ==================== 广告位配置 ====================
const AD_SLOTS = {
  offline_double:  { name: '离线收益翻倍', cooldown: 0 },
  speed_boost:     { name: '生产加速', cooldown: 1800 },
  free_coins:      { name: '免费金币', cooldown: 7200 },
  prestige_double: { name: '转生钻石翻倍', cooldown: 0 },
  disk_skip:       { name: '硬盘探索加速', cooldown: 0 },
  free_module:     { name: '免费模块', cooldown: 86400 },
  tech_boost:      { name: '科技加速', cooldown: 14400 },
};

// ==================== 工具函数 ====================
function formatNumber(n) {
  if (n < 1000) return n.toFixed(n < 10 && n % 1 !== 0 ? 1 : 0);
  if (n < 1e6) return (n / 1e3).toFixed(2) + 'K';
  if (n < 1e9) return (n / 1e6).toFixed(2) + 'M';
  if (n < 1e12) return (n / 1e9).toFixed(2) + 'B';
  if (n < 1e15) return (n / 1e12).toFixed(2) + 'T';
  return n.toExponential(2);
}

function getRecipeList(machineType) {
  return Object.entries(RECIPES).filter(([_, r]) => r.machine === machineType);
}

function isRecipeUnlocked(recipeId, gameState) {
  const recipe = RECIPES[recipeId];
  if (!recipe.unlock) return true;
  return gameState.unlockedRecipes.has(recipe.unlock) || gameState.unlockedTech.has(recipe.unlock);
}

// ==================== 传送带物流系统 ====================
const CONVEYORS = {
  belt_mk1: { name: '基础传送带', speed: 2, loss: 0.05, cost: 100, unlock: null },
  belt_mk2: { name: '高速传送带', speed: 5, loss: 0.02, cost: 1000, unlock: 'auto_lv1' },
  belt_mk3: { name: '磁悬浮传送带', speed: 10, loss: 0.01, cost: 10000, unlock: 'auto_lv2' },
  belt_mk4: { name: '量子传送带', speed: 999, loss: 0, cost: 100000, unlock: 'auto_smart' },
};

// ==================== 战舰配件定义 ====================
const SHIP_PARTS = {
  hull_scout: { name: '侦察舰船体', type: 'hull', tier: 1, hp: 100, cost: { steel: 20, iron_plate: 10 }, time: 10, unlock: 'military_lv1' },
  hull_frigate: { name: '护卫舰船体', type: 'hull', tier: 2, hp: 300, cost: { steel: 50, aluminum_alloy: 20 }, time: 20, unlock: 'military_lv2' },
  hull_cruiser: { name: '巡洋舰船体', type: 'hull', tier: 3, hp: 800, cost: { aluminum_alloy: 50, low_density_structure: 5 }, time: 40, unlock: 'military_lv3' },
  hull_carrier: { name: '航母船体', type: 'hull', tier: 4, hp: 2000, cost: { low_density_structure: 20, titanium: 50 }, time: 80, unlock: 'star_military' },
  engine_basic: { name: '基础引擎', type: 'engine', tier: 1, speed: 10, power: 20, cost: { gear: 10, iron_plate: 5 }, time: 8, unlock: 'military_lv1' },
  engine_ion: { name: '离子引擎', type: 'engine', tier: 2, speed: 25, power: 50, cost: { electric_motor: 5, electronic_component: 10 }, time: 15, unlock: 'military_lv2' },
  engine_warp: { name: '曲速引擎', type: 'engine', tier: 3, speed: 60, power: 120, cost: { processor: 5, aluminum_alloy: 10 }, time: 30, unlock: 'military_lv3' },
  weapon_laser: { name: '激光炮', type: 'weapon', tier: 1, attack: 30, cost: { electronic_component: 5, copper_wire: 10 }, time: 8, unlock: 'military_lv1' },
  weapon_missile: { name: '导弹发射器', type: 'weapon', tier: 2, attack: 80, cost: { explosive: 5, steel: 20 }, time: 15, unlock: 'military_lv2' },
  weapon_railgun: { name: '电磁轨道炮', type: 'weapon', tier: 3, attack: 200, cost: { processor: 3, electric_motor: 10 }, time: 30, unlock: 'military_lv3' },
  weapon_plasma: { name: '等离子炮', type: 'weapon', tier: 4, attack: 500, cost: { quantum_chip: 2, nuclear_fuel: 5 }, time: 60, unlock: 'star_military' },
  shield_basic: { name: '基础护盾', type: 'shield', tier: 1, defense: 50, cost: { iron_plate: 10, copper_wire: 5 }, time: 8, unlock: 'military_lv1' },
  shield_energy: { name: '能量护盾', type: 'shield', tier: 2, defense: 150, cost: { battery: 5, electronic_component: 5 }, time: 15, unlock: 'military_lv2' },
  shield_quantum: { name: '量子护盾', type: 'shield', tier: 3, defense: 400, cost: { processor: 3, battery: 10 }, time: 30, unlock: 'military_lv3' },
  control_basic: { name: '基础火控', type: 'control', tier: 1, hitRate: 0.8, cost: { circuit_board: 3, copper_wire: 5 }, time: 8, unlock: 'military_lv1' },
  control_advanced: { name: '高级火控', type: 'control', tier: 2, hitRate: 0.9, critRate: 0.1, cost: { processor: 2, electronic_component: 5 }, time: 15, unlock: 'military_lv2' },
  control_ai: { name: 'AI战术系统', type: 'control', tier: 3, hitRate: 0.95, critRate: 0.25, cost: { processor: 5, quantum_chip: 1 }, time: 30, unlock: 'military_lv3' },
};

// ==================== 星球定义（太空征战目标） ====================
const PLANETS = [
  { id: 'planet_1', name: '荒芜星', distance: 10, difficulty: 1, type: 'rocky',
    resources: { iron_ore: 500, stone: 300 }, garrison: 50, reward: { coins: 5000 } },
  { id: 'planet_2', name: '冰晶星', distance: 20, difficulty: 2, type: 'ice',
    resources: { copper_ore: 800, titanium: 50 }, garrison: 150, reward: { coins: 20000, diamonds: 1 } },
  { id: 'planet_3', name: '气态巨星', distance: 35, difficulty: 3, type: 'gas',
    resources: { crude_oil: 1000, plastic: 200 }, garrison: 400, reward: { coins: 80000, diamonds: 3 } },
  { id: 'planet_4', name: '辐射世界', distance: 50, difficulty: 4, type: 'radioactive',
    resources: { uranium: 300, nuclear_fuel: 50 }, garrison: 1000, reward: { coins: 300000, diamonds: 8 } },
  { id: 'planet_5', name: '机械行星', distance: 70, difficulty: 5, type: 'machine',
    resources: { processor: 100, robot_frame: 20 }, garrison: 2500, reward: { coins: 1000000, diamonds: 20 } },
  { id: 'planet_6', name: '量子星域', distance: 100, difficulty: 7, type: 'quantum',
    resources: { quantum_chip: 30, low_density_structure: 50 }, garrison: 6000, reward: { coins: 5000000, diamonds: 50 } },
  { id: 'planet_7', name: '银河核心', distance: 150, difficulty: 10, type: 'core',
    resources: { rocket_part: 5, quantum_chip: 100 }, garrison: 15000, reward: { coins: 20000000, diamonds: 200 } },
];

// ==================== 角色定义（舰娘系统） ====================
const CHARACTERS = {
  eng_1: { name: '矿工艾丽', type: 'production', rarity: 'R', skill: 'mining', skillVal: 0.15, desc: '采矿产出+15%', cost: 5000 },
  eng_2: { name: '冶金师琳达', type: 'production', rarity: 'R', skill: 'smelting', skillVal: 0.15, desc: '冶炼产出+15%', cost: 8000 },
  eng_3: { name: '工程师小薇', type: 'production', rarity: 'SR', skill: 'manufacturing', skillVal: 0.25, desc: '制造产出+25%', cost: 50000 },
  eng_4: { name: '科研官苏菲', type: 'production', rarity: 'SR', skill: 'research', skillVal: 0.30, desc: '科技点产出+30%', cost: 80000 },
  eng_5: { name: '总督凯瑟琳', type: 'production', rarity: 'SSR', skill: 'global_production', skillVal: 0.20, desc: '全局产出+20%', cost: 500000, unlock: 'character_lv2' },
  mil_1: { name: '枪手小红', type: 'military', rarity: 'R', skill: 'attack', skillVal: 0.20, desc: '舰队攻击+20%', cost: 10000 },
  mil_2: { name: '盾卫阿梅', type: 'military', rarity: 'R', skill: 'defense', skillVal: 0.20, desc: '舰队防御+20%', cost: 10000 },
  mil_3: { name: '舰长露娜', type: 'military', rarity: 'SR', skill: 'speed', skillVal: 0.30, desc: '舰队速度+30%', cost: 80000 },
  mil_4: { name: '战术官银狐', type: 'military', rarity: 'SR', skill: 'crit', skillVal: 0.15, desc: '暴击率+15%', cost: 80000 },
  mil_5: { name: '元帅艾莉丝', type: 'military', rarity: 'SSR', skill: 'global_military', skillVal: 0.30, desc: '全局军事+30%', cost: 500000, unlock: 'character_lv2' },
};

// 职业转职
const CLASSES = {
  miner_class: { name: '采矿专家', prereq: 'eng_1', bonus: { mining: 0.10 }, desc: '采矿额外+10%' },
  smelter_class: { name: '冶金大师', prereq: 'eng_2', bonus: { smelting: 0.10 }, desc: '冶炼额外+10%' },
  engineer_class: { name: '总工程师', prereq: 'eng_3', bonus: { manufacturing: 0.15 }, desc: '制造额外+15%' },
  scientist_class: { name: '首席科学家', prereq: 'eng_4', bonus: { research: 0.20 }, desc: '科研额外+20%' },
  gunner_class: { name: '王牌炮手', prereq: 'mil_1', bonus: { attack: 0.15 }, desc: '攻击额外+15%' },
  defender_class: { name: '铁壁守卫', prereq: 'mil_2', bonus: { defense: 0.15 }, desc: '防御额外+15%' },
  captain_class: { name: '星际舰长', prereq: 'mil_3', bonus: { speed: 0.20 }, desc: '速度额外+20%' },
  tactician_class: { name: '兵法大师', prereq: 'mil_4', bonus: { crit: 0.10 }, desc: '暴击额外+10%' },
};

// ==================== 巨构定义 ====================
const MEGA_STRUCTURES = {
  dyson_sphere: {
    name: '戴森球', desc: '包裹恒星，获取无限能源',
    cost: { steel: 100000, aluminum_alloy: 50000, processor: 5000, low_density_structure: 1000 },
    time: 3600, effect: { infinitePower: true, powerCapacity: 999999 }, unlock: 'star_tech'
  },
  mega_computer: {
    name: '巨型计算机', desc: '全帝国科技研究速度+100%',
    cost: { processor: 10000, electronic_component: 50000, quantum_chip: 100 },
    time: 1800, effect: { researchMul: 2.0 }, unlock: 'star_tech'
  },
  star_gate: {
    name: '星际之门', desc: '瞬间到达任何星球，无需航行时间',
    cost: { quantum_chip: 500, low_density_structure: 2000, rocket_part: 10 },
    time: 2400, effect: { instantTravel: true }, unlock: 'star_military'
  },
  matter_replicator: {
    name: '物质复制器', desc: '可复制任何资源（每小时一次）',
    cost: { quantum_chip: 1000, nuclear_fuel: 5000, rocket_part: 50 },
    time: 3600, effect: { replicate: true }, unlock: 'star_tech'
  },
};

// ==================== 贸易/市场系统 ====================
const TRADE_GOODS = {
  iron_ore: { basePrice: 1, volatility: 0.2 },
  copper_ore: { basePrice: 1, volatility: 0.2 },
  coal: { basePrice: 1, volatility: 0.2 },
  steel: { basePrice: 25, volatility: 0.15 },
  gear: { basePrice: 8, volatility: 0.15 },
  circuit_board: { basePrice: 40, volatility: 0.1 },
  electronic_component: { basePrice: 120, volatility: 0.1 },
  processor: { basePrice: 500, volatility: 0.08 },
};

const TRADE_ORDERS = [
  { id: 'order_1', name: '紧急钢材订单', deliver: { steel: 50 }, reward: { coins: 5000 }, timeLimit: 1800, repReq: 0 },
  { id: 'order_2', name: '电路板供应', deliver: { circuit_board: 20 }, reward: { coins: 20000 }, timeLimit: 1800, repReq: 1 },
  { id: 'order_3', name: '处理器合约', deliver: { processor: 10 }, reward: { coins: 100000, diamonds: 1 }, timeLimit: 3600, repReq: 2 },
  { id: 'order_4', name: '军需物资', deliver: { gear: 100, steel: 100 }, reward: { coins: 50000 }, timeLimit: 3600, repReq: 1 },
  { id: 'order_5', name: '量子设备', deliver: { quantum_chip: 5 }, reward: { coins: 1000000, diamonds: 10 }, timeLimit: 7200, repReq: 3 },
];
