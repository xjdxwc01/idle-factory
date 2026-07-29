/**
 * 放置工厂大亨 - 存档系统
 * localStorage 自动存档/读档
 */

const SAVE_KEY = 'idle_factory_save';
const SAVE_VERSION = 1;

const SaveManager = {
  // 默认存档
  getDefaultState() {
    return {
      version: SAVE_VERSION,
      // 资源
      coins: 100,
      diamonds: 0,
      techPoints: 0,
      sinkPoints: 0,
      // 资源库存
      inventory: {},
      // 机器实例 { id: { type, recipeId, level, modules: [], progress: 0 } }
      machines: [],
      // 发电机实例 { id: { type, level } }
      generators: [{ type: 'biomass', level: 1 }],
      // 科技树
      unlockedTech: [],         // 已解锁的科技ID
      unlockedRecipes: [],      // 已解锁的配方/资源ID（含替代配方）
      researchingTech: null,    // 正在研究的科技ID
      researchProgress: {},     // 科技瓶消耗进度 { techId: { red_bottle: 5, ... } }
      // 太空电梯
      elevatorStage: 0,
      elevatorDelivered: {},
      // 转生
      prestigeCount: 0,
      totalProfit: 0,
      // 统计
      totalPlayTime: 0,
      lastSaveTime: Date.now(),
      lastOnlineTime: Date.now(),
      // 广告buff
      boostUntil: 0,           // 生产加速结束时间
      techBoostUntil: 0,       // 科技加速结束时间
      // 硬盘探索
      diskExploreTask: null,
      diskExploreCooldown: 0,
      // 模块库存
      moduleInventory: [],
      // 设置
      settings: {
        autoSell: true,
        autoUpgrade: false,
        autoResearch: false,
      },
      // 传送带连接 { fromMachineId, toMachineId, beltType }
      conveyors: [],
      // 战舰 { id, name, parts: { hull, engine, weapon, shield, control }, level, hp, inBattle }
      ships: [],
      // 舰队编组
      fleet: [],
      // 角色 { id, charId, level, exp, classId, assignedTo }
      characters: [],
      // 已占领星球
      occupiedPlanets: [],
      // 星球探索状态
      planetStates: {},
      // 巨构建造状态
      megaStructures: {},
      // 贸易声望
      tradeRep: 0,
      // 当前贸易订单
      activeOrders: [],
      // 市场价格（动态浮动）
      marketPrices: {},
      // 市场上次更新时间
      marketLastUpdate: 0,
    };
  },

  save(state) {
    try {
      state.lastSaveTime = Date.now();
      state.lastOnlineTime = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error('存档失败:', e);
      return false;
    }
  },

  load() {
    try {
      const data = localStorage.getItem(SAVE_KEY);
      if (!data) return null;
      const state = JSON.parse(data);
      // 版本兼容检查
      if (!state.version || state.version < SAVE_VERSION) {
        return this.migrate(state);
      }
      return state;
    } catch (e) {
      console.error('读档失败:', e);
      return null;
    }
  },

  migrate(oldState) {
    // 深度合并：默认值 + 旧存档（旧存档的值优先，但补齐缺失的新字段）
    const defaults = this.getDefaultState();
    const merged = Object.assign({}, defaults);
    for (const key of Object.keys(oldState)) {
      const val = oldState[key];
      if (val !== null && val !== undefined) {
        // 数组类型：确保旧值也是数组才覆盖
        if (Array.isArray(defaults[key]) && !Array.isArray(val)) continue;
        merged[key] = val;
      }
    }
    merged.version = SAVE_VERSION;
    return merged;
  },

  delete() {
    localStorage.removeItem(SAVE_KEY);
  },

  hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  },

  // 导出存档（base64）
  export(state) {
    try {
      return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    } catch (e) {
      return '';
    }
  },

  // 导入存档
  import(data) {
    try {
      const state = JSON.parse(decodeURIComponent(escape(atob(data))));
      if (state.version) {
        this.save(state);
        return state;
      }
    } catch (e) {}
    return null;
  },
};
