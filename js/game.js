/**
 * 放置工厂大亨 - 核心游戏逻辑
 * 生产循环 / 电力 / 转生 / 离线 / 科技
 */

const Game = {
  state: null,
  tickInterval: null,
  saveInterval: null,
  lastTick: 0,

  // ==================== 初始化 ====================
  init() {
    // 加载或创建存档
    this.state = SaveManager.load() || SaveManager.getDefaultState();
    AdManager.init();
    AdManager.checkDailyReset();

    // 应用科技效果（需先于离线收益计算）
    this.applyTechEffects();

    // 计算离线收益
    this.calculateOfflineEarnings();

    // 启动游戏循环
    this.lastTick = Date.now();
    this.tickInterval = setInterval(() => this.tick(), 1000);
    this.saveInterval = setInterval(() => this.save(), 5000);

    // 页面关闭前保存
    window.addEventListener('beforeunload', () => this.save());
  },

  // ==================== 离线收益 ====================
  calculateOfflineEarnings() {
    const now = Date.now();
    const lastOnline = this.state.lastOnlineTime || now;
    const offlineMs = now - lastOnline;
    if (offlineMs < 60000) return; // 不足1分钟不计

    // 获取离线效率
    let efficiency = 0.5; // 默认50%
    if (this.hasTech('economy_lv2')) efficiency = 0.70;
    if (this.hasTech('economy_lv3')) efficiency = 0.85;
    if (this.hasTech('economy_empire')) efficiency = 1.0;

    // 离线上限
    let maxHours = 8;
    if (this.hasTech('economy_lv3')) maxHours = 16;
    if (this.hasTech('economy_empire')) maxHours = 24;

    const cappedMs = Math.min(offlineMs, maxHours * 3600 * 1000);
    const offlineSeconds = cappedMs / 1000;

    // 计算每秒利润
    const profitPerSec = this.calculateProfitPerSec();
    const offlineCoins = Math.floor(profitPerSec * offlineSeconds * efficiency);

    // 科技点
    const techPerSec = this.calculateTechPerSec();
    const offlineTech = Math.floor(techPerSec * offlineSeconds * efficiency);

    if (offlineCoins > 0 || offlineTech > 0) {
      this.state.coins += offlineCoins;
      this.state.techPoints += offlineTech;
      this.pendingOfflineReport = {
        duration: offlineSeconds,
        efficiency: efficiency,
        coins: offlineCoins,
        tech: offlineTech,
      };
    }
  },

  getOfflineReport() {
    const report = this.pendingOfflineReport;
    this.pendingOfflineReport = null;
    return report;
  },

  // ==================== 科技效果 ====================
  applyTechEffects() {
    // 重置效果为基础值
    this.effects = {
      globalRateMul: 1.0,
      sellPriceMul: 1.0,
      powerCapacityMul: 1.0,
      globalPowerMul: 1.0,
      machineMaxLevel: 3,
      logisticsLevel: 1,
      logisticsLoss: 0.10,
      globalDoubleChance: 0,
      miningRateMul: 1.0,
      offlineEfficiency: 0.5,
      offlineMaxHours: 8,
      sinkRateMul: 1.0,
      bulkOrderBonus: 1.0,
      powerCapacity: 100,
      infinitePower: false,
    };

    // 遍历已解锁科技，叠加效果
    for (const techId of this.state.unlockedTech) {
      const tech = TECH_TREE[techId];
      if (!tech || !tech.effects) continue;
      const e = tech.effects;
      if (e.globalRateMul) this.effects.globalRateMul *= e.globalRateMul;
      if (e.sellPriceMul) this.effects.sellPriceMul *= e.sellPriceMul;
      if (e.powerCapacityMul) this.effects.powerCapacityMul *= e.powerCapacityMul;
      if (e.globalPowerMul) this.effects.globalPowerMul *= e.globalPowerMul;
      if (e.machineMaxLevel) this.effects.machineMaxLevel = e.machineMaxLevel;
      if (e.logisticsLevel) {
        this.effects.logisticsLevel = e.logisticsLevel;
        this.effects.logisticsLoss = e.logisticsLevel >= 4 ? 0 : e.logisticsLevel >= 3 ? 0.01 : 0.05;
      }
      if (e.globalDoubleChance) this.effects.globalDoubleChance += e.globalDoubleChance;
      if (e.miningRateMul) this.effects.miningRateMul *= e.miningRateMul;
      if (e.offlineEfficiency) this.effects.offlineEfficiency = e.offlineEfficiency;
      if (e.offlineMaxHours) this.effects.offlineMaxHours = e.offlineMaxHours;
      if (e.sinkRateMul) this.effects.sinkRateMul *= e.sinkRateMul;
      if (e.bulkOrderBonus) this.effects.bulkOrderBonus *= e.bulkOrderBonus;
      if (e.infinitePower) this.effects.infinitePower = true;
    }

    // 转生加成
    const prestigeBonus = 1 + 0.1 * this.state.prestigeCount;
    this.effects.globalRateMul *= prestigeBonus;
    this.effects.sellPriceMul *= prestigeBonus;

    // 角色加成
    const charBonuses = this.getCharacterBonuses();
    this.effects.globalRateMul *= (1 + (charBonuses.global_production || 0));
    this.effects.miningRateMul *= (1 + (charBonuses.mining || 0));
    // 冶炼、制造加成归入全局产出
    this.effects.globalRateMul *= (1 + (charBonuses.smelting || 0));
    this.effects.globalRateMul *= (1 + (charBonuses.manufacturing || 0));
    // 科研加成
    if (charBonuses.research) {
      this.effects.researchMul = (this.effects.researchMul || 1) * (1 + charBonuses.research);
    }

    // 巨构效果
    const megaStructures = this.state.megaStructures || {};
    for (const [megaId, mega] of Object.entries(megaStructures)) {
      if (mega.completed) {
        const def = MEGA_STRUCTURES[megaId];
        if (!def || !def.effect) continue;
        if (def.effect.infinitePower) this.effects.infinitePower = true;
        if (def.effect.researchMul) {
          this.effects.researchMul = (this.effects.researchMul || 1) * def.effect.researchMul;
        }
      }
    }

    // 计算总电力容量
    this.effects.powerCapacity = this.calculatePowerCapacity();
  },

  calculatePowerCapacity() {
    let total = 100; // 基础
    for (const gen of this.state.generators) {
      const def = GENERATORS[gen.type];
      if (!def) continue;
      total += def.basePower * gen.level * this.effects.powerCapacityMul;
    }
    return Math.floor(total);
  },

  hasTech(techId) {
    return this.state.unlockedTech.includes(techId);
  },

  isUnlocked(id) {
    return this.state.unlockedTech.includes(id) || this.state.unlockedRecipes.includes(id);
  },

  // ==================== 电力计算 ====================
  calculatePowerUsage() {
    let total = 0;
    for (const machine of this.state.machines) {
      const def = MACHINES[machine.type];
      if (!def) continue;
      let power = def.basePower * Math.pow(1.2, machine.level - 1);

      // 模块影响
      for (const modId of (machine.modules || [])) {
        const mod = MODULES[modId];
        if (mod && mod.effect.powerMul) power *= mod.effect.powerMul;
      }

      // 超频模式
      if (machine.overclock) power *= 3;

      total += power;
    }
    return Math.floor(total);
  },

  getPowerEfficiency() {
    if (this.effects.infinitePower) return 1.0;
    const usage = this.calculatePowerUsage();
    const capacity = this.effects.powerCapacity;
    if (usage <= capacity) return 1.0;
    const ratio = capacity / usage;
    // 低电力惩罚降级（能源Lv2后）
    if (this.hasTech('energy_lv2')) {
      return Math.max(0.3, ratio * 0.7); // 降速不停机
    }
    return ratio; // 按比例降速
  },

  // ==================== 生产循环 ====================
  tick() {
    const now = Date.now();
    const dt = (now - this.lastTick) / 1000; // 秒
    this.lastTick = now;

    if (dt <= 0) return;

    this.state.totalPlayTime += dt;

    // 1. 处理每台机器的生产
    this.processProduction(dt);

    // 2. 自动出售成品
    if (this.state.settings.autoSell || this.hasTech('auto_lv1')) {
      this.autoSell();
    }

    // 3. 回收器处理
    this.processSinks(dt);

    // 4. 研究中心处理（含科技研究进度）
    this.processResearch(dt);

    // 6. 硬盘探索
    this.processDiskExplore(dt);

    // 7. 检查自动功能
    this.checkAutoFeatures();

    // 8. 占领星球产出
    this.processOccupiedPlanets(dt);
    // 9. 巨构建造
    this.processMegaConstruction(dt);
    // 10. 贸易订单超时检查
    this.processTradeOrders(dt);
    // 11. 市场价格更新（每60秒）
    if (Date.now() - this.state.marketLastUpdate > 60000) {
      this.updateMarketPrices();
      this.state.marketLastUpdate = Date.now();
    }
  },

  processProduction(dt) {
    const powerEff = this.getPowerEfficiency();
    const boostActive = Date.now() < this.state.boostUntil;
    const boostMul = boostActive ? 2.0 : 1.0;

    for (const machine of this.state.machines) {
      const def = MACHINES[machine.type];
      if (!def || !machine.recipeId) continue;

      const recipe = RECIPES[machine.recipeId];
      if (!recipe) continue;

      // 计算产出速率
      let rate = def.baseRate * Math.pow(1.15, machine.level - 1);
      rate *= this.effects.globalRateMul;
      rate *= powerEff;
      rate *= boostMul;

      // 模块效果
      for (const modId of (machine.modules || [])) {
        const mod = MODULES[modId];
        if (mod && mod.effect.rateMul) rate *= mod.effect.rateMul;
      }

      // 超频
      if (machine.overclock) rate *= 2;

      // 采矿加成
      if (machine.type === 'miner') rate *= this.effects.miningRateMul;

      // 物流损耗
      rate *= (1 - this.effects.logisticsLoss);

      // 检查输入材料是否充足
      let canProduce = true;
      if (recipe.inputs && Object.keys(recipe.inputs).length > 0) {
        for (const [resId, amount] of Object.entries(recipe.inputs)) {
          const needed = amount * rate * dt;
          if ((this.state.inventory[resId] || 0) < needed) {
            canProduce = false;
            break;
          }
        }
      }

      if (!canProduce) continue;

      // 消耗输入
      if (recipe.inputs) {
        for (const [resId, amount] of Object.entries(recipe.inputs)) {
          this.state.inventory[resId] = (this.state.inventory[resId] || 0) - amount * rate * dt;
        }
      }

      // 产出
      if (recipe.outputs) {
        for (const [resId, amount] of Object.entries(recipe.outputs)) {
          let produced = amount * rate * dt;

          // 产能模块：概率双倍产出
          let doubleChance = this.effects.globalDoubleChance;
          for (const modId of (machine.modules || [])) {
            const mod = MODULES[modId];
            if (mod && mod.effect.doubleChance) doubleChance += mod.effect.doubleChance;
            if (mod && mod.effect.chainChance) {
              // 连锁模块：概率额外产出
              if (Math.random() < mod.effect.chainChance) produced *= 2;
            }
          }
          if (doubleChance > 0 && Math.random() < doubleChance) produced *= 2;

          this.state.inventory[resId] = (this.state.inventory[resId] || 0) + produced;
        }
      }
    }
  },

  autoSell() {
    for (const [resId, amount] of Object.entries(this.state.inventory)) {
      const res = RESOURCES[resId];
      if (!res || res.isResearch) continue; // 科研瓶不卖
      if (res.sellPrice > 0 && amount > 0) {
        // 保留一定量供下游使用，只卖"过剩"部分
        // 简化：如果该资源是某些配方的输入，保留100个
        let keepAmount = 0;
        for (const recipe of Object.values(RECIPES)) {
          if (recipe.inputs && recipe.inputs[resId]) {
            keepAmount = Math.max(keepAmount, 100);
          }
        }
        const sellAmount = Math.max(0, amount - keepAmount);
        if (sellAmount > 0) {
          const revenue = sellAmount * res.sellPrice * this.effects.sellPriceMul;
          this.state.coins += revenue;
          this.state.totalProfit += revenue;
          this.state.inventory[resId] = amount - sellAmount;
        }
      }
    }
  },

  processSinks(dt) {
    for (const machine of this.state.machines) {
      if (machine.type !== 'awesome_sink' || !machine.recipeId) continue;
      const recipe = RECIPES[machine.recipeId];
      if (!recipe || !recipe.inputs) continue;

      // 回收器消耗指定资源产出积分
      for (const [resId, amount] of Object.entries(recipe.inputs)) {
        const available = this.state.inventory[resId] || 0;
        if (available > 100) { // 保留100
          const sinkAmount = Math.min(available - 100, amount * 10 * dt);
          const res = RESOURCES[resId];
          if (res) {
            this.state.inventory[resId] = available - sinkAmount;
            this.state.sinkPoints += sinkAmount * res.sellPrice * this.effects.sinkRateMul;
          }
        }
      }
    }
  },

  processResearch(dt) {
    const techBoostActive = Date.now() < this.state.techBoostUntil;
    const boostMul = techBoostActive ? 2.0 : 1.0;

    for (const machine of this.state.machines) {
      if (machine.type !== 'research_center' || !machine.recipeId) continue;
      const recipe = RECIPES[machine.recipeId];
      if (!recipe || !recipe.outputs) continue;

      // 研究中心消耗科研瓶
      const def = MACHINES[machine.type];
      let rate = def.baseRate * Math.pow(1.15, machine.level - 1);
      rate *= this.effects.globalRateMul;
      rate *= boostMul;

      // 检查科研瓶库存
      let canProduce = true;
      if (recipe.inputs) {
        for (const [resId, amount] of Object.entries(recipe.inputs)) {
          if ((this.state.inventory[resId] || 0) < amount * rate * dt) {
            canProduce = false;
            break;
          }
        }
      }

      if (!canProduce) continue;

      // 消耗科研瓶，产出科技点
      if (recipe.inputs) {
        for (const [resId, amount] of Object.entries(recipe.inputs)) {
          this.state.inventory[resId] = (this.state.inventory[resId] || 0) - amount * rate * dt;
        }
      }

      // 产出科技点
      const techPointOutput = Object.values(recipe.outputs)[0] || 1;
      const points = techPointOutput * rate * dt;
      // 如果正在研究科技，消耗科技点推进进度
      if (this.state.researchingTech) {
        this.researchTech(this.state.researchingTech, points);
      } else {
        this.state.techPoints += points;
      }
    }
  },

  // ==================== 科技研究 ====================
  startResearch(techId) {
    const tech = TECH_TREE[techId];
    if (!tech) return false;
    if (this.hasTech(techId)) return false;
    if (!this.canResearch(techId)) return false;

    this.state.researchingTech = techId;
    this.state.researchProgress[techId] = this.state.researchProgress[techId] || {};
    return true;
  },

  researchTech(techId, points) {
    const tech = TECH_TREE[techId];
    if (!tech || !tech.cost) return;

    const progress = this.state.researchProgress[techId] || {};
    let allComplete = true;

    for (const [bottleId, needed] of Object.entries(tech.cost)) {
      progress[bottleId] = (progress[bottleId] || 0) + points;
      if (progress[bottleId] < needed) {
        allComplete = false;
      }
    }

    this.state.researchProgress[techId] = progress;

    if (allComplete) {
      this.completeResearch(techId);
    }
  },

  completeResearch(techId) {
    const tech = TECH_TREE[techId];
    if (!tech) return;

    this.state.unlockedTech.push(techId);
    // 解锁配方/机器/模块
    if (tech.unlocks) {
      for (const unlockId of tech.unlocks) {
        if (!this.state.unlockedRecipes.includes(unlockId)) {
          this.state.unlockedRecipes.push(unlockId);
        }
      }
    }
    this.state.researchingTech = null;
    delete this.state.researchProgress[techId];

    // 重新计算效果
    this.applyTechEffects();
  },

  canResearch(techId) {
    const tech = TECH_TREE[techId];
    if (!tech) return false;
    if (this.hasTech(techId)) return false;

    // 检查前置
    if (tech.prereq && tech.prereq.length > 0) {
      if (tech.requireAny) {
        // 任一前置即可
        if (!tech.prereq.some(p => this.hasTech(p))) return false;
      } else {
        // 全部前置都需要
        if (!tech.prereq.every(p => this.hasTech(p))) return false;
      }
    }

    // 检查分支冲突（A/B二选一）
    if (tech.branch) {
      const siblings = Object.entries(TECH_TREE)
        .filter(([id, t]) => t.line === tech.line && t.tier === tech.tier && t.branch && id !== techId)
        .map(([id]) => id);
      for (const sibling of siblings) {
        if (this.hasTech(sibling)) return false; // 另一分支已选
      }
    }

    return true;
  },

  getResearchProgress(techId) {
    const tech = TECH_TREE[techId];
    if (!tech || !tech.cost) return 0;
    const progress = this.state.researchProgress[techId] || {};
    let total = 0, done = 0;
    for (const [bottleId, needed] of Object.entries(tech.cost)) {
      total += needed;
      done += Math.min(needed, progress[bottleId] || 0);
    }
    return total > 0 ? done / total : 0;
  },

  // ==================== 机器操作 ====================
  buyMachine(type) {
    const def = MACHINES[type];
    if (!def) return false;
    if (this.isUnlocked(def.unlock) === false && def.unlock) return false;

    const cost = this.getMachineCost(type);
    if (this.state.coins < cost) return false;

    this.state.coins -= cost;
    this.state.machines.push({
      id: 'm_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      type: type,
      recipeId: null,
      level: 1,
      modules: [],
      progress: 0,
      overclock: false,
    });

    // 自动分配默认配方
    const recipes = getRecipeList(type).filter(([id]) => this.isUnlocked(id) || !RECIPES[id].unlock);
    if (recipes.length > 0) {
      this.state.machines[this.state.machines.length - 1].recipeId = recipes[0][0];
    }

    return true;
  },

  getMachineCost(type) {
    const def = MACHINES[type];
    if (!def) return Infinity;
    return def.baseCost;
  },

  upgradeMachine(machineId) {
    const machine = this.state.machines.find(m => m.id == machineId);
    if (!machine) return false;
    if (machine.level >= this.effects.machineMaxLevel) return false;

    const def = MACHINES[machine.type];
    const cost = this.getUpgradeCost(machine);
    if (this.state.coins < cost) return false;

    this.state.coins -= cost;
    machine.level++;
    return true;
  },

  getUpgradeCost(machine) {
    const def = MACHINES[machine.type];
    return Math.floor(def.baseCost * 0.5);
  },

  setMachineRecipe(machineId, recipeId) {
    const machine = this.state.machines.find(m => m.id == machineId);
    if (!machine) return false;
    const recipe = RECIPES[recipeId];
    if (!recipe || recipe.machine !== machine.type) return false;
    machine.recipeId = recipeId;
    return true;
  },

  installModule(machineId, moduleIndex, moduleId) {
    const machine = this.state.machines.find(m => m.id == machineId);
    if (!machine) return false;
    if (!machine.modules) machine.modules = [];

    // 检查库存
    const invIdx = this.state.moduleInventory.indexOf(moduleId);
    if (invIdx === -1) return false;

    // 取出旧模块
    if (machine.modules[moduleIndex]) {
      this.state.moduleInventory.push(machine.modules[moduleIndex]);
    }

    // 安装新模块
    machine.modules[moduleIndex] = moduleId;
    this.state.moduleInventory.splice(invIdx, 1);
    return true;
  },

  toggleOverclock(machineId) {
    const machine = this.state.machines.find(m => m.id == machineId);
    if (!machine) return false;
    if (!this.hasTech('efficiency_overclock')) return false;
    machine.overclock = !machine.overclock;
    return true;
  },

  // ==================== 发电机 ====================
  buyGenerator(type) {
    const def = GENERATORS[type];
    if (!def) return false;
    if (def.unlock && !this.hasTech(def.unlock)) return false;

    const cost = this.getGeneratorCost(type);
    if (def.isDiamond) {
      if (this.state.diamonds < def.diamondCost) return false;
      this.state.diamonds -= def.diamondCost;
    } else {
      if (this.state.coins < cost) return false;
      this.state.coins -= cost;
    }

    this.state.generators.push({ type, level: 1 });
    this.applyTechEffects();
    return true;
  },

  getGeneratorCost(type) {
    const def = GENERATORS[type];
    if (!def) return Infinity;
    if (def.isDiamond) return def.diamondCost;
    return def.baseCost;
  },

  upgradeGenerator(genId) {
    const gen = this.state.generators.find(g => g.id === genId || g === genId);
    if (!gen) return false;
    const def = GENERATORS[gen.type];
    const cost = Math.floor(def.baseCost * 0.3);
    if (this.state.coins < cost) return false;
    this.state.coins -= cost;
    gen.level++;
    this.applyTechEffects();
    return true;
  },

  // ==================== 太空电梯 ====================
  deliverToElevator() {
    const stage = SPACE_ELEVATOR[this.state.elevatorStage];
    if (!stage) return false;

    // 检查材料
    for (const [resId, amount] of Object.entries(stage.deliver)) {
      const delivered = this.state.elevatorDelivered[resId] || 0;
      const needed = amount - delivered;
      if (needed > 0) {
        const available = this.state.inventory[resId] || 0;
        if (available < needed) return false; // 材料不足
      }
    }

    // 扣除材料
    for (const [resId, amount] of Object.entries(stage.deliver)) {
      const delivered = this.state.elevatorDelivered[resId] || 0;
      const needed = amount - delivered;
      if (needed > 0) {
        this.state.inventory[resId] -= needed;
        this.state.elevatorDelivered[resId] = amount;
      }
    }

    // 完成阶段
    this.state.elevatorStage++;
    this.state.elevatorDelivered = {};

    // 解锁奖励
    if (stage.rewards && stage.rewards.unlock) {
      for (const unlockId of stage.rewards.unlock) {
        if (!this.state.unlockedRecipes.includes(unlockId)) {
          this.state.unlockedRecipes.push(unlockId);
        }
      }
    }

    return true;
  },

  getElevatorProgress() {
    const stage = SPACE_ELEVATOR[this.state.elevatorStage];
    if (!stage) return null;
    const progress = {};
    for (const [resId, amount] of Object.entries(stage.deliver)) {
      const delivered = this.state.elevatorDelivered[resId] || 0;
      progress[resId] = { current: Math.min(delivered, amount), needed: amount };
    }
    return progress;
  },

  // ==================== 转生 ====================
  canPrestige() {
    return this.state.elevatorStage >= 4;
  },

  prestige() {
    if (!this.canPrestige()) return false;

    // 计算钻石奖励
    const baseDiamonds = Math.floor(Math.sqrt(this.state.totalProfit / 10000));
    const bonusDiamonds = this.state.prestigeCount * 5;
    let diamonds = baseDiamonds + bonusDiamonds;

    // 重置进度
    const preserved = {
      diamonds: this.state.diamonds + diamonds,
      unlockedTech: this.state.unlockedTech,
      unlockedRecipes: this.state.unlockedRecipes,
      prestigeCount: this.state.prestigeCount + 1,
      moduleInventory: this.state.moduleInventory,
      sinkPoints: this.state.sinkPoints,
    };

    const newState = SaveManager.getDefaultState();
    newState.diamonds = preserved.diamonds;
    newState.unlockedTech = preserved.unlockedTech;
    newState.unlockedRecipes = preserved.unlockedRecipes;
    newState.prestigeCount = preserved.prestigeCount;
    newState.moduleInventory = preserved.moduleInventory;
    newState.sinkPoints = preserved.sinkPoints;

    this.state = newState;
    this.applyTechEffects();
    return { diamonds: diamonds };
  },

  // ==================== 硬盘探索 ====================
  generateDiskTask() {
    if (this.state.diskExploreTask) return;
    if (Date.now() < this.state.diskExploreCooldown) return;

    // 随机选择2-3种中间产物作为任务
    const possibleRes = ['gear', 'copper_wire', 'iron_plate', 'screw', 'circuit_board', 'steel', 'plastic'];
    const taskRes = possibleRes.sort(() => Math.random() - 0.5).slice(0, 2);
    const task = {};
    for (const resId of taskRes) {
      task[resId] = 20 + Math.floor(Math.random() * 30);
    }

    this.state.diskExploreTask = {
      requirements: task,
      submitted: {},
      completed: false,
      startTime: Date.now(),
    };
  },

  submitDiskMaterial(resId, amount) {
    if (!this.state.diskExploreTask || this.state.diskExploreTask.completed) return false;
    const needed = this.state.diskExploreTask.requirements[resId] || 0;
    const submitted = this.state.diskExploreTask.submitted[resId] || 0;
    const remaining = needed - submitted;
    if (remaining <= 0) return false;

    const available = this.state.inventory[resId] || 0;
    const toSubmit = Math.min(amount, remaining, available);
    if (toSubmit <= 0) return false;

    this.state.inventory[resId] -= toSubmit;
    this.state.diskExploreTask.submitted[resId] = submitted + toSubmit;

    // 检查是否完成
    let allDone = true;
    for (const [r, n] of Object.entries(this.state.diskExploreTask.requirements)) {
      if ((this.state.diskExploreTask.submitted[r] || 0) < n) {
        allDone = false;
        break;
      }
    }

    if (allDone) {
      this.state.diskExploreTask.completed = true;
      this.state.diskExploreTask.completionTime = Date.now();
    }
    return true;
  },

  completeDiskExplore() {
    if (!this.state.diskExploreTask || !this.state.diskExploreTask.completed) return null;
    // 随机解锁一个未解锁的替代配方
    const lockedAlts = Object.entries(ALT_RECIPES).filter(([id]) => !this.isUnlocked(id));
    if (lockedAlts.length === 0) {
      // 全部解锁了，给钻石
      this.state.diamonds += 5;
      this.state.diskExploreTask = null;
      this.state.diskExploreCooldown = Date.now() + 2 * 3600 * 1000;
      return { type: 'diamonds', amount: 5 };
    }

    const [altId, alt] = lockedAlts[Math.floor(Math.random() * lockedAlts.length)];
    this.state.unlockedRecipes.push(altId);
    this.state.unlockedRecipes.push(alt.recipe);
    this.state.diskExploreTask = null;
    this.state.diskExploreCooldown = Date.now() + 2 * 3600 * 1000;
    return { type: 'recipe', altId, alt };
  },

  processDiskExplore(dt) {
    if (!this.state.diskExploreTask && Date.now() >= this.state.diskExploreCooldown) {
      this.generateDiskTask();
    }
  },

  // ==================== 计算函数 ====================
  calculateProfitPerSec() {
    // 粗略估算：所有非科研机器的产出售价
    let profit = 0;
    const powerEff = this.getPowerEfficiency();

    for (const machine of this.state.machines) {
      const def = MACHINES[machine.type];
      if (!def || def.isResearch || def.isSink) continue;
      if (!machine.recipeId) continue;
      const recipe = RECIPES[machine.recipeId];
      if (!recipe || !recipe.outputs) continue;

      let rate = def.baseRate * Math.pow(1.15, machine.level - 1);
      rate *= this.effects.globalRateMul;
      rate *= powerEff;
      for (const modId of (machine.modules || [])) {
        const mod = MODULES[modId];
        if (mod && mod.effect.rateMul) rate *= mod.effect.rateMul;
      }
      rate *= (1 - this.effects.logisticsLoss);

      // 产值 = 产出售价 - 输入成本
      let outputValue = 0;
      for (const [resId, amount] of Object.entries(recipe.outputs)) {
        const res = RESOURCES[resId];
        if (res) outputValue += res.sellPrice * amount;
      }
      let inputCost = 0;
      if (recipe.inputs) {
        for (const [resId, amount] of Object.entries(recipe.inputs)) {
          const res = RESOURCES[resId];
          if (res) inputCost += res.sellPrice * amount;
        }
      }
      profit += (outputValue - inputCost) * rate * this.effects.sellPriceMul;
    }
    return Math.max(0, profit);
  },

  calculateTechPerSec() {
    let total = 0;
    const powerEff = this.getPowerEfficiency();
    for (const machine of this.state.machines) {
      if (machine.type !== 'research_center' || !machine.recipeId) continue;
      const def = MACHINES[machine.type];
      let rate = def.baseRate * Math.pow(1.15, machine.level - 1);
      rate *= this.effects.globalRateMul;
      rate *= powerEff;
      total += rate;
    }
    return total;
  },

  // ==================== 广告奖励 ====================
  applyOfflineDouble(coins, tech) {
    this.state.coins += coins;
    this.state.techPoints += tech;
  },

  applySpeedBoost() {
    this.state.boostUntil = Date.now() + 5 * 60 * 1000; // 5分钟
  },

  applyTechBoost() {
    this.state.techBoostUntil = Date.now() + 60 * 60 * 1000; // 1小时
  },

  claimFreeCoins() {
    const profit = this.calculateProfitPerSec();
    const coins = Math.floor(profit * 600); // 10分钟产出
    this.state.coins += coins;
    this.state.totalProfit += coins;
    return coins;
  },

  claimFreeModule() {
    // 随机给一个Mk2模块
    const possible = ['speed_mk2', 'productivity_mk2', 'efficiency_mk2', 'chain_mk1'];
    const moduleId = possible[Math.floor(Math.random() * possible.length)];
    if (this.isUnlocked(MODULES[moduleId].unlock)) {
      this.state.moduleInventory.push(moduleId);
      return MODULES[moduleId];
    }
    // 降级给Mk1
    this.state.moduleInventory.push('speed_mk1');
    return MODULES['speed_mk1'];
  },

  // ==================== 自动功能 ====================
  checkAutoFeatures() {
    // 自动升级
    if (this.hasTech('auto_lv2') && this.state.settings.autoUpgrade) {
      for (const machine of this.state.machines) {
        if (machine.level < this.effects.machineMaxLevel) {
          const cost = this.getUpgradeCost(machine);
          if (this.state.coins >= cost * 5) { // 保留5倍资金缓冲
            this.upgradeMachine(machine.id);
          }
        }
      }
    }

    // 自动研究
    if (this.hasTech('auto_lv3') && !this.state.researchingTech) {
      // 找第一个可研究的科技
      for (const [techId, tech] of Object.entries(TECH_TREE)) {
        if (this.canResearch(techId)) {
          this.startResearch(techId);
          break;
        }
      }
    }
  },

  // ==================== 存档 ====================
  save() {
    SaveManager.save(this.state);
  },

  hardReset() {
    SaveManager.delete();
    this.state = SaveManager.getDefaultState();
    this.applyTechEffects();
  },

  // ==================== 传送带物流系统 ====================
  // 建立传送带连接
  connectConveyor(fromMachineId, toMachineId, beltType) {
    const beltDef = CONVEYORS[beltType];
    if (!beltDef) return false;
    // 检查传送带是否解锁
    if (beltDef.unlock && !this.hasTech(beltDef.unlock)) return false;
    // 检查机器是否存在
    const fromMachine = this.state.machines.find(m => m.id == fromMachineId);
    const toMachine = this.state.machines.find(m => m.id == toMachineId);
    if (!fromMachine || !toMachine) return false;
    if (fromMachineId === toMachineId) return false;
    // 检查是否已存在连接
    if (!this.state.conveyors) this.state.conveyors = [];
    const exists = this.state.conveyors.find(c =>
      c.fromMachineId === fromMachineId && c.toMachineId === toMachineId
    );
    if (exists) return false;
    // 检查金币是否足够
    if (this.state.coins < beltDef.cost) return false;
    // 扣除金币并添加连接
    this.state.coins -= beltDef.cost;
    this.state.conveyors.push({
      id: 'conv_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      fromMachineId,
      toMachineId,
      beltType,
    });
    return true;
  },

  // 断开传送带连接
  disconnectConveyor(conveyorId) {
    if (!this.state.conveyors) return false;
    const idx = this.state.conveyors.findIndex(c => c.id === conveyorId);
    if (idx === -1) return false;
    this.state.conveyors.splice(idx, 1);
    return true;
  },

  // 获取机器的输入源（通过传送带连接的上游机器）
  getInputSources(machineId) {
    return (this.state.conveyors || [])
      .filter(c => c.toMachineId === machineId)
      .map(c => c.fromMachineId);
  },

  // ==================== 战舰系统 ====================
  // 组装战舰
  assembleShip(name, parts) {
    // parts = { hull: partId, engine: partId, weapon: partId, shield: partId, control: partId }
    const requiredTypes = ['hull', 'engine', 'weapon', 'shield', 'control'];
    // 检查配件是否都存在且类型匹配
    for (const type of requiredTypes) {
      const partId = parts[type];
      if (!partId) return false;
      const partDef = SHIP_PARTS[partId];
      if (!partDef || partDef.type !== type) return false;
      if (partDef.unlock && !this.hasTech(partDef.unlock)) return false;
      // 检查配件库存
      if ((this.state.inventory[partId] || 0) < 1) return false;
    }
    // 消耗配件
    for (const type of requiredTypes) {
      const partId = parts[type];
      this.state.inventory[partId] = (this.state.inventory[partId] || 0) - 1;
    }
    // 计算战舰属性
    const hullDef = SHIP_PARTS[parts.hull];
    if (!this.state.ships) this.state.ships = [];
    const ship = {
      id: 'ship_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      name: name,
      parts: { ...parts },
      level: 1,
      hp: hullDef.hp,
      maxHp: hullDef.hp,
      inBattle: false,
    };
    this.state.ships.push(ship);
    return ship;
  },

  // 计算战舰总战力
  calculateShipPower(ship) {
    if (!ship || !ship.parts) return 0;
    const hull = SHIP_PARTS[ship.parts.hull];
    const engine = SHIP_PARTS[ship.parts.engine];
    const weapon = SHIP_PARTS[ship.parts.weapon];
    const shield = SHIP_PARTS[ship.parts.shield];
    const control = SHIP_PARTS[ship.parts.control];
    if (!hull || !engine || !weapon || !shield || !control) return 0;
    // HP = hull.hp * (1 + shield.defense * 0.01)
    const hp = hull.hp * (1 + (shield.defense || 0) * 0.01);
    // Attack = weapon.attack * (1 + control.hitRate)
    const attack = (weapon.attack || 0) * (1 + (control.hitRate || 0));
    // Speed = engine.speed
    const speed = engine.speed || 0;
    // 暴击率
    const critRate = control.critRate || 0;
    // Power = (HP + Attack * 10 + Speed * 5) * (1 + critRate * 0.5)
    const power = (hp + attack * 10 + speed * 5) * (1 + critRate * 0.5);
    // 等级加成
    return Math.floor(power * (1 + (ship.level - 1) * 0.1));
  },

  // 编组舰队
  assignFleet(shipIds) {
    if (!this.state.ships) return false;
    // 检查所有战舰是否存在
    for (const sid of shipIds) {
      const ship = this.state.ships.find(s => s.id === sid);
      if (!ship) return false;
      if (ship.inBattle) return false; // 已在战斗中
    }
    this.state.fleet = shipIds.slice();
    return true;
  },

  // 计算舰队总战力
  calculateFleetPower() {
    if (!this.state.fleet || this.state.fleet.length === 0) return 0;
    let total = 0;
    for (const sid of this.state.fleet) {
      const ship = this.state.ships.find(s => s.id === sid);
      if (ship) total += this.calculateShipPower(ship);
    }
    // 角色军事加成
    const bonuses = this.getCharacterBonuses();
    let militaryMul = 1 + (bonuses.global_military || 0);
    militaryMul *= (1 + (bonuses.attack || 0));
    militaryMul *= (1 + (bonuses.defense || 0));
    // 科技加成
    if (this.hasTech('star_military')) militaryMul *= 1.5;
    return Math.floor(total * militaryMul);
  },

  // ==================== 太空征战系统 ====================
  // 攻击星球
  attackPlanet(planetId) {
    const planet = PLANETS.find(p => p.id === planetId);
    if (!planet) return { success: false, reason: '星球不存在' };
    // 检查舰队
    if (!this.state.fleet || this.state.fleet.length === 0) {
      return { success: false, reason: '舰队未编组' };
    }
    const fleetPower = this.calculateFleetPower();
    const garrison = planet.garrison;
    // 计算战斗结果（回合制简化：战力对比）
    const ratio = fleetPower / Math.max(1, garrison);
    let result;
    if (ratio >= 1.0) {
      // 完胜
      result = {
        success: true, victory: true,
        fleetLoss: Math.floor(garrison * 0.3),
        planet, fleetPower, garrison,
      };
    } else if (ratio >= 0.5) {
      // 惨胜
      result = {
        success: true, victory: true,
        fleetLoss: Math.floor(garrison * 0.7),
        planet, fleetPower, garrison,
      };
    } else {
      // 失败
      result = {
        success: false, victory: false,
        fleetLoss: Math.floor(fleetPower * 0.5),
        planet, fleetPower, garrison,
      };
    }
    // 应用损失：按概率损失战舰
    if (result.fleetLoss > 0 && this.state.ships) {
      const totalShipPower = this.state.fleet.reduce((sum, sid) => {
        const ship = this.state.ships.find(s => s.id === sid);
        return sum + (ship ? this.calculateShipPower(ship) : 0);
      }, 0);
      if (totalShipPower > 0) {
        const lossRatio = Math.min(1, result.fleetLoss / totalShipPower);
        const lostShipIds = [];
        for (const sid of this.state.fleet.slice()) {
          if (Math.random() < lossRatio) lostShipIds.push(sid);
        }
        // 移除损失的战舰
        this.state.ships = this.state.ships.filter(s => !lostShipIds.includes(s.id));
        this.state.fleet = this.state.fleet.filter(sid => !lostShipIds.includes(sid));
      }
    }
    // 标记星球状态
    if (!this.state.planetStates) this.state.planetStates = {};
    this.state.planetStates[planetId] = this.state.planetStates[planetId] || {};
    this.state.planetStates[planetId].lastAttacked = Date.now();
    this.state.planetStates[planetId].defeated = result.victory;
    return result;
  },

  // 掠夺星球（获得一次性资源）
  plunderPlanet(planetId) {
    const planet = PLANETS.find(p => p.id === planetId);
    if (!planet) return { success: false, reason: '星球不存在' };
    const state = (this.state.planetStates || {})[planetId];
    if (!state || !state.defeated) {
      return { success: false, reason: '需要先击败星球守军' };
    }
    if (state.plundered) {
      return { success: false, reason: '该星球已被掠夺' };
    }
    // 获得资源奖励（掠夺只能拿一半）
    const gained = {};
    if (planet.resources) {
      for (const [resId, amount] of Object.entries(planet.resources)) {
        const got = Math.floor(amount * 0.5);
        this.state.inventory[resId] = (this.state.inventory[resId] || 0) + got;
        gained[resId] = got;
      }
    }
    if (planet.reward && planet.reward.coins) {
      this.state.coins += planet.reward.coins;
      gained.coins = planet.reward.coins;
    }
    state.plundered = true;
    return { success: true, gained, planet };
  },

  // 占领星球（获得持续产出）
  occupyPlanet(planetId) {
    const planet = PLANETS.find(p => p.id === planetId);
    if (!planet) return { success: false, reason: '星球不存在' };
    const state = (this.state.planetStates || {})[planetId];
    if (!state || !state.defeated) {
      return { success: false, reason: '需要先击败星球守军' };
    }
    if (!this.state.occupiedPlanets) this.state.occupiedPlanets = [];
    if (this.state.occupiedPlanets.includes(planetId)) {
      return { success: false, reason: '已占领该星球' };
    }
    this.state.occupiedPlanets.push(planetId);
    state.occupied = true;
    state.occupyTime = Date.now();
    return { success: true, planet };
  },

  // 摧毁星球（获得大量钻石）
  destroyPlanet(planetId) {
    const planet = PLANETS.find(p => p.id === planetId);
    if (!planet) return { success: false, reason: '星球不存在' };
    const state = (this.state.planetStates || {})[planetId];
    if (!state || !state.defeated) {
      return { success: false, reason: '需要先击败星球守军' };
    }
    if (state.destroyed) {
      return { success: false, reason: '该星球已被摧毁' };
    }
    // 获得钻石奖励（摧毁奖励为占领奖励的5倍钻石）
    const diamonds = planet.reward && planet.reward.diamonds
      ? planet.reward.diamonds * 5
      : Math.floor(planet.difficulty * 10);
    this.state.diamonds += diamonds;
    state.destroyed = true;
    // 从已占领列表中移除
    if (this.state.occupiedPlanets) {
      const idx = this.state.occupiedPlanets.indexOf(planetId);
      if (idx !== -1) this.state.occupiedPlanets.splice(idx, 1);
    }
    return { success: true, diamonds, planet };
  },

  // 占领星球的持续产出（在tick中调用）
  processOccupiedPlanets(dt) {
    const occupied = Array.isArray(this.state.occupiedPlanets) ? this.state.occupiedPlanets : [];
    if (occupied.length === 0) return;
    for (const planetId of occupied) {
      const planet = PLANETS.find(p => p.id === planetId);
      if (!planet || !planet.resources) continue;
      // 每秒产出资源总量的 1/3600（即每小时产出1倍资源量）
      for (const [resId, amount] of Object.entries(planet.resources)) {
        const produced = amount * dt / 3600;
        this.state.inventory[resId] = (this.state.inventory[resId] || 0) + produced;
      }
    }
  },

  // ==================== 角色系统 ====================
  // 获取角色位上限
  getCharacterSlots() {
    let slots = 0;
    if (this.hasTech('character_lv1')) slots = 3;
    if (this.hasTech('character_lv2')) slots = 6;
    if (this.hasTech('character_lv3')) slots = 10;
    return slots;
  },

  // 招募角色
  recruitCharacter(charId) {
    const def = CHARACTERS[charId];
    if (!def) return false;
    // 检查解锁
    if (def.unlock && !this.hasTech(def.unlock)) return false;
    // 检查角色位是否足够
    const slots = this.getCharacterSlots();
    if (slots <= 0) return false;
    if (!this.state.characters) this.state.characters = [];
    if (this.state.characters.length >= slots) return false;
    // 检查是否已招募
    if (this.state.characters.find(c => c.charId === charId)) return false;
    // 检查金币是否足够
    if (this.state.coins < def.cost) return false;
    // 扣除金币并添加角色
    this.state.coins -= def.cost;
    this.state.characters.push({
      id: 'char_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      charId: charId,
      level: 1,
      exp: 0,
      classId: null,
      assignedTo: null,
    });
    // 角色加成需要重新计算
    this.applyTechEffects();
    return true;
  },

  // 角色升级
  upgradeCharacter(characterId) {
    if (!this.state.characters) return false;
    const character = this.state.characters.find(c => c.id === characterId);
    if (!character) return false;
    const def = CHARACTERS[character.charId];
    if (!def) return false;
    // 升级费用 = 基础费用 * 等级 * 2
    const cost = def.cost * character.level * 2;
    if (this.state.coins < cost) return false;
    this.state.coins -= cost;
    character.level++;
    character.exp = 0;
    // 角色加成需要重新计算
    this.applyTechEffects();
    return true;
  },

  // 角色转职
  changeClass(characterId, classId) {
    if (!this.state.characters) return false;
    const character = this.state.characters.find(c => c.id === characterId);
    if (!character) return false;
    const classDef = CLASSES[classId];
    if (!classDef) return false;
    // 检查前置角色
    if (classDef.prereq && character.charId !== classDef.prereq) return false;
    character.classId = classId;
    // 角色加成需要重新计算
    this.applyTechEffects();
    return true;
  },

  // 获取角色加成
  getCharacterBonuses() {
    const bonuses = {
      mining: 0, smelting: 0, manufacturing: 0, research: 0,
      attack: 0, defense: 0, speed: 0, crit: 0,
      global_production: 0, global_military: 0,
    };
    // 职业加成倍率
    let classMul = 1.0;
    if (this.hasTech('character_lv3')) classMul = 1.5;
    const characters = this.state.characters || [];
    for (const character of characters) {
      const def = CHARACTERS[character.charId];
      if (!def) continue;
      // 基础技能加成 * 等级倍率 * 职业倍率
      const levelMul = 1 + (character.level - 1) * 0.1;
      const bonusVal = def.skillVal * levelMul * classMul;
      if (bonuses.hasOwnProperty(def.skill)) {
        bonuses[def.skill] += bonusVal;
      }
      // 职业额外加成
      if (character.classId) {
        const classDef = CLASSES[character.classId];
        if (classDef && classDef.bonus) {
          for (const [key, val] of Object.entries(classDef.bonus)) {
            if (bonuses.hasOwnProperty(key)) {
              bonuses[key] += val * classMul;
            }
          }
        }
      }
    }
    return bonuses;
  },

  // ==================== 巨构系统 ====================
  // 开始建造巨构
  startMegaConstruction(megaId) {
    const def = MEGA_STRUCTURES[megaId];
    if (!def) return false;
    // 检查解锁
    if (def.unlock && !this.hasTech(def.unlock)) return false;
    if (!this.state.megaStructures) this.state.megaStructures = {};
    // 检查是否已建造或正在建造
    const existing = this.state.megaStructures[megaId];
    if (existing && (existing.completed || existing.building)) return false;
    // 检查资源
    if (def.cost) {
      for (const [resId, amount] of Object.entries(def.cost)) {
        if ((this.state.inventory[resId] || 0) < amount) return false;
      }
    }
    // 扣除资源
    if (def.cost) {
      for (const [resId, amount] of Object.entries(def.cost)) {
        this.state.inventory[resId] -= amount;
      }
    }
    // 开始建造
    this.state.megaStructures[megaId] = {
      building: true,
      completed: false,
      progress: 0,
      totalTime: def.time,
      startTime: Date.now(),
    };
    return true;
  },

  // 巨构建造进度（在tick中调用）
  processMegaConstruction(dt) {
    const megaStructures = this.state.megaStructures || {};
    for (const [megaId, mega] of Object.entries(megaStructures)) {
      if (!mega.building || mega.completed) continue;
      const def = MEGA_STRUCTURES[megaId];
      if (!def) continue;
      mega.progress += dt;
      if (mega.progress >= mega.totalTime) {
        this.completeMegaConstruction(megaId);
      }
    }
  },

  // 完成巨构
  completeMegaConstruction(megaId) {
    if (!this.state.megaStructures) return false;
    const mega = this.state.megaStructures[megaId];
    if (!mega || mega.completed) return false;
    mega.building = false;
    mega.completed = true;
    mega.completedTime = Date.now();
    // 重新计算效果（巨构效果在applyTechEffects中应用）
    this.applyTechEffects();
    return true;
  },

  // ==================== 贸易系统 ====================
  // 获取某商品的当前市场价格
  getMarketPrice(resId) {
    const good = TRADE_GOODS[resId];
    if (!good) return 0;
    if (!this.state.marketPrices) this.state.marketPrices = {};
    // 如果未初始化，使用基础价格
    if (this.state.marketPrices[resId] === undefined) {
      this.state.marketPrices[resId] = good.basePrice;
    }
    return this.state.marketPrices[resId];
  },

  // 更新市场价格（在tick中调用，每60秒更新一次）
  updateMarketPrices() {
    if (!this.state.marketPrices) this.state.marketPrices = {};
    for (const [resId, good] of Object.entries(TRADE_GOODS)) {
      const current = this.state.marketPrices[resId] !== undefined
        ? this.state.marketPrices[resId]
        : good.basePrice;
      // 价格在 basePrice * (1 ± volatility) 范围内随机波动
      const delta = (Math.random() - 0.5) * 2 * good.volatility;
      let newPrice = current * (1 + delta);
      // 限制在基础价格的 (1 - volatility) 到 (1 + volatility) 范围内
      const minPrice = good.basePrice * (1 - good.volatility);
      const maxPrice = good.basePrice * (1 + good.volatility);
      newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
      this.state.marketPrices[resId] = newPrice;
    }
  },

  // 购买资源
  buyResource(resId, amount) {
    const good = TRADE_GOODS[resId];
    if (!good) return { success: false, reason: '该资源不可交易' };
    if (amount <= 0) return { success: false, reason: '数量必须大于0' };
    const price = this.getMarketPrice(resId);
    const totalCost = Math.floor(price * amount);
    if (this.state.coins < totalCost) {
      return { success: false, reason: '金币不足' };
    }
    this.state.coins -= totalCost;
    this.state.inventory[resId] = (this.state.inventory[resId] || 0) + amount;
    return { success: true, spent: totalCost, amount, price };
  },

  // 出售资源
  sellResource(resId, amount) {
    const good = TRADE_GOODS[resId];
    if (!good) return { success: false, reason: '该资源不可交易' };
    if (amount <= 0) return { success: false, reason: '数量必须大于0' };
    const available = this.state.inventory[resId] || 0;
    if (available < amount) {
      return { success: false, reason: '库存不足' };
    }
    const price = this.getMarketPrice(resId);
    const revenue = Math.floor(price * amount);
    this.state.inventory[resId] -= amount;
    this.state.coins += revenue;
    this.state.totalProfit += revenue;
    // 增加声望
    this.state.tradeRep = (this.state.tradeRep || 0) + Math.floor(amount / 100);
    return { success: true, revenue, amount, price };
  },

  // 接取贸易订单
  acceptOrder(orderId) {
    const order = TRADE_ORDERS.find(o => o.id === orderId);
    if (!order) return false;
    // 检查声望
    if ((this.state.tradeRep || 0) < order.repReq) return false;
    if (!this.state.activeOrders) this.state.activeOrders = [];
    // 检查是否已接取
    if (this.state.activeOrders.find(o => o.orderId === orderId)) return false;
    this.state.activeOrders.push({
      orderId: orderId,
      acceptedTime: Date.now(),
      deadline: Date.now() + order.timeLimit * 1000,
      delivered: {},
    });
    return true;
  },

  // 完成贸易订单
  completeOrder(orderId) {
    const order = TRADE_ORDERS.find(o => o.id === orderId);
    if (!order) return { success: false, reason: '订单不存在' };
    if (!this.state.activeOrders) return { success: false, reason: '未接取该订单' };
    const active = this.state.activeOrders.find(o => o.orderId === orderId);
    if (!active) return { success: false, reason: '未接取该订单' };
    // 检查是否超时
    if (Date.now() > active.deadline) {
      this.state.activeOrders = this.state.activeOrders.filter(o => o.orderId !== orderId);
      return { success: false, reason: '订单已超时' };
    }
    // 检查材料是否齐全
    if (order.deliver) {
      for (const [resId, amount] of Object.entries(order.deliver)) {
        if ((this.state.inventory[resId] || 0) < amount) {
          return { success: false, reason: '材料不足' };
        }
      }
      // 扣除材料
      for (const [resId, amount] of Object.entries(order.deliver)) {
        this.state.inventory[resId] -= amount;
      }
    }
    // 发放奖励
    const gained = {};
    if (order.reward) {
      if (order.reward.coins) {
        this.state.coins += order.reward.coins;
        this.state.totalProfit += order.reward.coins;
        gained.coins = order.reward.coins;
      }
      if (order.reward.diamonds) {
        this.state.diamonds += order.reward.diamonds;
        gained.diamonds = order.reward.diamonds;
      }
    }
    // 增加声望
    this.state.tradeRep = (this.state.tradeRep || 0) + 1;
    gained.tradeRep = 1;
    // 移除订单
    this.state.activeOrders = this.state.activeOrders.filter(o => o.orderId !== orderId);
    return { success: true, gained };
  },

  // 处理贸易订单超时（在tick中调用）
  processTradeOrders(dt) {
    if (!this.state.activeOrders || this.state.activeOrders.length === 0) return;
    const now = Date.now();
    const expired = this.state.activeOrders.filter(o => now > o.deadline);
    if (expired.length > 0) {
      const expiredIds = expired.map(o => o.orderId);
      this.state.activeOrders = this.state.activeOrders.filter(o => !expiredIds.includes(o.orderId));
    }
  },
};
