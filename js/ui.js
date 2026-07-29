/**
 * 放置工厂大亨 - UI渲染与交互
 * 纯列表式工厂视图 / 科技树 / 商店 / 订单
 */

const UI = {
  currentTab: 'factory',
  currentTechLine: 'efficiency',
  expandedMachine: null,
  uiUpdateInterval: null,

  init() {
    this.bindEvents();
    this.startUIUpdate();

    // 检查离线报告
    const report = Game.getOfflineReport();
    if (report) {
      setTimeout(() => this.showOfflineReport(report), 500);
    }
  },

  startUIUpdate() {
    this.uiUpdateInterval = setInterval(() => this.update(), 500);
    this.update();
  },

  // ==================== 事件绑定 ====================
  bindEvents() {
    // 底部导航
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // 加速按钮
    const boostBtn = document.getElementById('boost-btn');
    if (boostBtn) {
      boostBtn.addEventListener('click', () => this.handleSpeedBoost());
    }
  },

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-page').forEach(p => p.classList.toggle('active', p.id === `page-${tab}`));
    this.update();
  },

  // ==================== 主更新 ====================
  update() {
    this.updateTopBar();
    this.updateStatusBar();
    this.updateBoostButton();

    switch (this.currentTab) {
      case 'factory': this.updateFactoryPage(); break;
      case 'tech': this.updateTechPage(); break;
      case 'shop': this.updateShopPage(); break;
      case 'orders': this.updateOrdersPage(); break;
      case 'fleet': this.updateFleetPage(); break;
      case 'starmap': this.updateStarMapPage(); break;
      case 'character': this.updateCharacterPage(); break;
      case 'trade': this.updateTradePage(); break;
    }
  },

  // ==================== 顶部资源栏 ====================
  updateTopBar() {
    const s = Game.state;
    document.getElementById('top-coins').textContent = formatNumber(s.coins);
    document.getElementById('top-diamonds').textContent = formatNumber(s.diamonds);

    const powerUsage = Game.calculatePowerUsage();
    const powerCap = Game.effects.powerCapacity;
    const powerEl = document.getElementById('top-power');
    powerEl.textContent = `${formatNumber(powerUsage)}/${formatNumber(powerCap)}`;
    powerEl.parentElement.querySelector('.res-val').style.color =
      powerUsage > powerCap ? 'var(--accent-red)' : 'var(--res-power)';
  },

  // ==================== 状态栏 ====================
  updateStatusBar() {
    const profit = Game.calculateProfitPerSec();
    const tech = Game.calculateTechPerSec();
    document.getElementById('status-profit').textContent = `+${formatNumber(profit)}/s`;
    document.getElementById('status-tech').textContent = `+${formatNumber(tech)}/s`;

    const powerEff = Game.getPowerEfficiency();
    const powerEl = document.getElementById('status-power');
    if (powerEff < 1) {
      powerEl.textContent = `${Math.round(powerEff * 100)}%`;
      powerEl.style.color = powerEff < 0.5 ? 'var(--accent-red)' : 'var(--accent-yellow)';
    } else {
      powerEl.textContent = '100%';
      powerEl.style.color = 'var(--accent-green)';
    }
  },

  // ==================== 工厂页 ====================
  updateFactoryPage() {
    const container = document.getElementById('page-factory');
    const s = Game.state;

    // 按机器类型分组
    const grouped = {};
    for (const machine of s.machines) {
      if (!grouped[machine.type]) grouped[machine.type] = [];
      grouped[machine.type].push(machine);
    }

    let html = '';

    // 机器列表
    for (const [type, machines] of Object.entries(grouped)) {
      const def = MACHINES[type];
      if (!def) continue;

      const totalRate = machines.reduce((sum, m) => {
        if (!m.recipeId) return sum;
        const recipe = RECIPES[m.recipeId];
        if (!recipe || !recipe.outputs) return sum;
        let rate = def.baseRate * Math.pow(1.15, m.level - 1) * Game.effects.globalRateMul * Game.getPowerEfficiency();
        for (const modId of (m.modules || [])) {
          const mod = MODULES[modId];
          if (mod && mod.effect.rateMul) rate *= mod.effect.rateMul;
        }
        return sum + rate;
      }, 0);

      const totalPower = machines.reduce((sum, m) => {
        let power = def.basePower * Math.pow(1.2, m.level - 1);
        for (const modId of (m.modules || [])) {
          const mod = MODULES[modId];
          if (mod && mod.effect.powerMul) power *= mod.effect.powerMul;
        }
        return sum + power;
      }, 0);

      const recipe = machines[0].recipeId ? RECIPES[machines[0].recipeId] : null;
      const recipeText = recipe ? this.formatRecipe(recipe) : '未设置配方';

      // 模块显示
      const firstMachine = machines[0];
      let moduleHtml = '';
      if (firstMachine.modules && firstMachine.modules.length > 0) {
        moduleHtml = firstMachine.modules.map(mId => {
          const mod = MODULES[mId];
          return mod ? `<span class="module-slot filled">${mod.icon}${mod.name.replace('Mk1','').replace('Mk2','').replace('Mk3','')}</span>` : '';
        }).join('');
      }

      const isExpanded = this.expandedMachine === type;

      html += `
        <div class="machine-item" onclick="UI.toggleMachineExpand('${type}')">
          <div class="machine-item-header">
            <div class="machine-name">
              <span class="machine-icon-box" style="background:${this.getMachineColor(type)}">${def.icon}</span>
              ${def.name}
            </div>
            <span class="machine-count">×${machines.length}</span>
          </div>
          <div class="machine-recipe">${recipeText}</div>
          <div class="machine-stats">
            <span>产出: <span class="stat-val">${formatNumber(totalRate)}/s</span></span>
            <span>耗电: <span class="stat-power">${formatNumber(totalPower)}W</span></span>
            ${machines[0].overclock ? '<span class="text-red">⚡超频</span>' : ''}
          </div>
          ${moduleHtml ? `<div class="machine-modules">${moduleHtml}</div>` : ''}
        </div>
      `;

      // 展开详情
      if (isExpanded) {
        html += this.renderMachineDetails(type, machines, def);
      }
    }

    // 可购买的新机器
    html += '<div class="card mt-12"><div class="card-title">📦 购买机器</div>';
    for (const [type, def] of Object.entries(MACHINES)) {
      const isUnlocked = !def.unlock || Game.isUnlocked(def.unlock);
      if (!isUnlocked) continue;
      const cost = Game.getMachineCost(type);
      const canAfford = s.coins >= cost;
      html += `
        <div class="flex-between mt-8" style="padding:8px;background:var(--bg-card2);border-radius:6px;">
          <div>
            <span>${def.icon} ${def.name}</span>
            <div class="text-sm text-muted">${def.description}</div>
          </div>
          <button class="btn btn-sm ${canAfford ? 'btn-primary' : 'btn-secondary'}"
                  onclick="UI.buyMachine('${type}')" ${canAfford ? '' : 'disabled'}>
            💰${formatNumber(cost)}
          </button>
        </div>
      `;
    }
    html += '</div>';

    // 发电机
    html += '<div class="card mt-12"><div class="card-title">⚡ 发电机</div>';
    for (const gen of s.generators) {
      const def = GENERATORS[gen.type];
      if (!def) continue;
      html += `
        <div class="flex-between mt-8" style="padding:8px;background:var(--bg-card2);border-radius:6px;">
          <div><span>⚡ ${def.name} Lv${gen.level}</span><div class="text-sm text-muted">产出: ${formatNumber(def.basePower * gen.level)}W</div></div>
          <button class="btn btn-sm btn-secondary" onclick="UI.upgradeGenerator(${s.generators.indexOf(gen)})">⬆️升级</button>
        </div>
      `;
    }
    // 可购买发电机
    for (const [type, def] of Object.entries(GENERATORS)) {
      if (def.unlock && !Game.hasTech(def.unlock)) continue;
      const cost = Game.getGeneratorCost(type);
      const costText = def.isDiamond ? `💎${def.diamondCost}` : `💰${formatNumber(cost)}`;
      html += `
        <div class="flex-between mt-8" style="padding:8px;background:var(--bg-card2);border-radius:6px;">
          <div><span>⚡ ${def.name}</span><div class="text-sm text-muted">+${formatNumber(def.basePower)}W</div></div>
          <button class="btn btn-sm btn-secondary" onclick="UI.buyGenerator('${type}')">${costText}</button>
        </div>
      `;
    }
    html += '</div>';

    container.innerHTML = html;
  },

  renderMachineDetails(type, machines, def) {
    let html = '<div class="card" style="margin-top:-4px;border-top:none;">';

    for (let i = 0; i < machines.length; i++) {
      const m = machines[i];
      const recipe = m.recipeId ? RECIPES[m.recipeId] : null;
      const upgradeCost = Game.getUpgradeCost(m);
      const canUpgrade = m.level < Game.effects.machineMaxLevel && Game.state.coins >= upgradeCost;

      html += `
        <div style="padding:8px;border-bottom:1px solid var(--bg-border);">
          <div class="flex-between">
            <span class="text-bold">#${i + 1} Lv${m.level}</span>
            <div class="flex gap-4">
              <button class="btn btn-sm btn-secondary" onclick="UI.showRecipePicker('${m.id}')">📋配方</button>
              ${canUpgrade ? `<button class="btn btn-sm btn-primary" onclick="UI.upgradeMachine('${m.id}')">⬆️${formatNumber(upgradeCost)}</button>` : ''}
            </div>
          </div>
          <div class="text-sm text-muted mt-4">${recipe ? this.formatRecipe(recipe) : '未设置'}</div>
          <div class="flex gap-4 mt-4">
      `;

      // 模块插槽
      const maxSlots = 2 + Math.floor(m.level / 5);
      for (let s = 0; s < maxSlots; s++) {
        const modId = m.modules && m.modules[s];
        const mod = modId ? MODULES[modId] : null;
        if (mod) {
          html += `<span class="module-slot filled" onclick="UI.showModulePicker('${m.id}', ${s})" style="cursor:pointer;">${mod.icon}</span>`;
        } else {
          html += `<span class="module-slot" onclick="UI.showModulePicker('${m.id}', ${s})" style="cursor:pointer;">+空</span>`;
        }
      }

      html += '</div>';

      // 超频按钮
      if (Game.hasTech('efficiency_overclock')) {
        html += `<button class="btn btn-sm ${m.overclock ? 'btn-danger' : 'btn-secondary'} mt-4" onclick="UI.toggleOverclock('${m.id}')">${m.overclock ? '⚡超频中(关)' : '⚡超频'}</button>`;
      }

      html += '</div>';
    }

    // 购买更多同类机器
    const cost = Game.getMachineCost(type);
    const canAfford = Game.state.coins >= cost;
    html += `<button class="btn btn-block ${canAfford ? 'btn-primary' : 'btn-secondary'} mt-8" onclick="UI.buyMachine('${type}')" ${canAfford ? '' : 'disabled'}>➕ 购买 ${def.name} 💰${formatNumber(cost)}</button>`;

    html += '</div>';
    return html;
  },

  toggleMachineExpand(type) {
    this.expandedMachine = this.expandedMachine === type ? null : type;
    this.update();
  },

  formatRecipe(recipe) {
    let inputStr = '';
    if (recipe.inputs && Object.keys(recipe.inputs).length > 0) {
      inputStr = Object.entries(recipe.inputs).map(([resId, amt]) => {
        const res = RESOURCES[resId];
        return `${res ? res.icon : '?'}${res ? res.name : resId}×${amt}`;
      }).join(' + ');
    } else {
      inputStr = '（无需输入）';
    }

    let outputStr = '';
    if (recipe.outputs) {
      outputStr = Object.entries(recipe.outputs).map(([resId, amt]) => {
        if (amt === 0) return '';
        const res = RESOURCES[resId];
        return `${res ? res.icon : '?'}${res ? res.name : resId}×${amt}`;
      }).filter(s => s).join(' + ');
    }

    return `${inputStr} → ${outputStr}`;
  },

  getMachineColor(type) {
    const colors = {
      miner: '#475569', smelter: '#F97316', constructor: '#3B82F6',
      assembler: '#10B981', manufacturer: '#8B5CF6', chemical_plant: '#14B8A6',
      precision_factory: '#F5A623', assembly_center: '#EF4444',
      research_center: '#FBBF24', awesome_sink: '#6B7280',
    };
    return colors[type] || '#475569';
  },

  // ==================== 科技树页 ====================
  updateTechPage() {
    const container = document.getElementById('page-tech');
    const s = Game.state;

    let html = `
      <div class="flex-between mb-8">
        <span class="text-bold">🔬 科技树</span>
        <span>科技点: <span class="text-yellow text-bold">${formatNumber(s.techPoints)}</span></span>
      </div>
    `;

    // 科技线标签
    const lines = [
      { id: 'efficiency', name: '🔧效率', color: '#EF4444' },
      { id: 'energy', name: '⚡能源', color: '#3B82F6' },
      { id: 'automation', name: '🤖自动化', color: '#10B981' },
      { id: 'economy', name: '📈经济', color: '#F5A623' },
      { id: 'expand', name: '🚀扩展', color: '#8B5CF6' },
    ];

    html += '<div class="tech-line-tabs">';
    for (const line of lines) {
      html += `<div class="tech-line-tab ${this.currentTechLine === line.id ? 'active' : ''}" onclick="UI.switchTechLine('${line.id}')" style="${this.currentTechLine === line.id ? `background:${line.color};border-color:${line.color}` : ''}">${line.name}</div>`;
    }
    html += '</div>';

    // 科技节点
    const techs = Object.entries(TECH_TREE).filter(([_, t]) => t.line === this.currentTechLine).sort((a, b) => a[1].tier - b[1].tier);

    for (const [techId, tech] of techs) {
      const isUnlocked = Game.hasTech(techId);
      const canResearch = Game.canResearch(techId);
      const isResearching = s.researchingTech === techId;
      const progress = Game.getResearchProgress(techId);

      let statusClass = 'locked';
      if (isUnlocked) statusClass = 'unlocked';
      else if (isResearching) statusClass = 'researching';
      else if (canResearch) statusClass = 'available';

      let costHtml = '';
      if (tech.cost && !isUnlocked) {
        const prog = s.researchProgress[techId] || {};
        costHtml = Object.entries(tech.cost).map(([bottleId, needed]) => {
          const bottle = RESOURCES[bottleId];
          const done = prog[bottleId] || 0;
          const insufficient = (s.inventory[bottleId] || 0) + done < needed;
          return `<span class="tech-cost-item ${insufficient ? 'insufficient' : ''}">${bottle ? bottle.icon : '?'}${formatNumber(done)}/${needed}</span>`;
        }).join('');
      }

      let actionBtn = '';
      if (isUnlocked) {
        actionBtn = '<span class="text-green">✓ 已解锁</span>';
      } else if (isResearching) {
        actionBtn = '<span class="text-yellow">⚡ 研究中</span>';
      } else if (canResearch) {
        actionBtn = `<button class="btn btn-sm btn-primary" onclick="UI.startResearch('${techId}')">开始研究</button>`;
      } else {
        actionBtn = '<span class="text-muted">🔒 锁定</span>';
      }

      html += `
        <div class="tech-node ${statusClass}">
          <div class="tech-node-header">
            <span class="tech-node-name">${tech.name}${tech.branch ? ` (${tech.branch})` : ''}</span>
            ${actionBtn}
          </div>
          <div class="tech-node-desc">${tech.description}</div>
          ${costHtml ? `<div class="tech-node-cost">${costHtml}</div>` : ''}
          ${isResearching ? `<div class="tech-progress"><div class="tech-progress-fill" style="width:${progress * 100}%"></div></div>` : ''}
        </div>
      `;
    }

    container.innerHTML = html;
  },

  switchTechLine(line) {
    this.currentTechLine = line;
    this.update();
  },

  // ==================== 商店页 ====================
  updateShopPage() {
    const container = document.getElementById('page-shop');
    const s = Game.state;

    let html = '';

    // 激励视频广告区
    html += '<div class="card"><div class="card-title">🎁 激励奖励</div>';

    // 免费金币
    const freeCoinsCooldown = AdManager.isOnCooldown('free_coins');
    const freeCoinsTimer = AdManager.formatCooldown('free_coins');
    const estCoins = Math.floor(Game.calculateProfitPerSec() * 600);
    html += `
      <div class="flex-between mt-8" style="padding:10px;background:var(--bg-card2);border-radius:8px;">
        <div>
          <div class="text-bold">💰 免费金币</div>
          <div class="text-sm text-muted">获得10分钟产出: ~${formatNumber(estCoins)}💰</div>
        </div>
        <button class="btn btn-sm btn-ad" onclick="UI.handleFreeCoins()" ${freeCoinsCooldown ? 'disabled' : ''}>
          ${freeCoinsCooldown ? `⏳${freeCoinsTimer}` : '📺领取'}
        </button>
      </div>
    `;

    // 免费模块
    const freeModCooldown = AdManager.isOnCooldown('free_module');
    const freeModTimer = AdManager.formatCooldown('free_module');
    html += `
      <div class="flex-between mt-8" style="padding:10px;background:var(--bg-card2);border-radius:8px;">
        <div>
          <div class="text-bold">📦 每日免费模块</div>
          <div class="text-sm text-muted">随机获得Mk2模块 ×1</div>
        </div>
        <button class="btn btn-sm btn-ad" onclick="UI.handleFreeModule()" ${freeModCooldown ? 'disabled' : ''}>
          ${freeModCooldown ? `⏳${freeModTimer}` : '📺领取'}
        </button>
      </div>
    `;

    // 科技加速
    const techBoostCooldown = AdManager.isOnCooldown('tech_boost');
    const techBoostTimer = AdManager.formatCooldown('tech_boost');
    html += `
      <div class="flex-between mt-8" style="padding:10px;background:var(--bg-card2);border-radius:8px;">
        <div>
          <div class="text-bold">⚡ 科技加速</div>
          <div class="text-sm text-muted">科技点产出×2，持续1小时</div>
        </div>
        <button class="btn btn-sm btn-ad" onclick="UI.handleTechBoost()" ${techBoostCooldown ? 'disabled' : ''}>
          ${techBoostCooldown ? `⏳${techBoostTimer}` : '📺加速'}
        </button>
      </div>
    `;

    html += '</div>';

    // 模块商店
    html += '<div class="card"><div class="card-title">🧩 模块商店</div>';
    const ownedModules = new Set(s.moduleInventory);
    for (const [modId, mod] of Object.entries(MODULES)) {
      if (mod.unlock && !Game.isUnlocked(mod.unlock)) continue;
      if (mod.isDiamond) {
        const canAfford = s.diamonds >= mod.diamondCost;
        html += `
          <div class="flex-between mt-8" style="padding:8px;background:var(--bg-card2);border-radius:6px;">
            <div>
              <span>${mod.icon} ${mod.name}</span>
              <div class="text-sm text-muted">${this.formatModuleEffect(mod)}</div>
            </div>
            <button class="btn btn-sm ${canAfford ? 'btn-primary' : 'btn-secondary'}" onclick="UI.buyModule('${modId}')" ${canAfford ? '' : 'disabled'}>
              💎${mod.diamondCost}
            </button>
          </div>
        `;
      } else if (mod.cost > 0) {
        const canAfford = s.coins >= mod.cost;
        html += `
          <div class="flex-between mt-8" style="padding:8px;background:var(--bg-card2);border-radius:6px;">
            <div>
              <span>${mod.icon} ${mod.name}</span>
              <div class="text-sm text-muted">${this.formatModuleEffect(mod)}</div>
            </div>
            <button class="btn btn-sm ${canAfford ? 'btn-primary' : 'btn-secondary'}" onclick="UI.buyModule('${modId}')" ${canAfford ? '' : 'disabled'}>
              💰${formatNumber(mod.cost)}
            </button>
          </div>
        `;
      }
    }
    html += '</div>';

    // 模块库存
    if (s.moduleInventory.length > 0) {
      html += '<div class="card"><div class="card-title">🎒 模块库存</div>';
      for (const modId of s.moduleInventory) {
        const mod = MODULES[modId];
        if (!mod) continue;
        html += `<div class="flex-between mt-8" style="padding:8px;background:var(--bg-card2);border-radius:6px;"><span>${mod.icon} ${mod.name}</span><span class="text-sm text-muted">点击机器安装</span></div>`;
      }
      html += '</div>';
    }

    // 转生
    if (Game.canPrestige()) {
      const baseDiamonds = Math.floor(Math.sqrt(s.totalProfit / 10000));
      const bonusDiamonds = s.prestigeCount * 5;
      html += `
        <div class="card">
          <div class="card-title">🔄 转生</div>
          <div class="modal-body">重置工厂进度，保留科技/模块/蓝图。获得钻石奖励。</div>
          <div class="flex-between mb-8"><span>预计钻石:</span><span class="text-purple text-bold">+${baseDiamonds + bonusDiamonds}💎</span></div>
          <div class="flex-between mb-8"><span>转生次数:</span><span>${s.prestigeCount}</span></div>
          <div class="flex-between mb-8"><span>累计利润:</span><span>💰${formatNumber(s.totalProfit)}</span></div>
          <button class="btn btn-block btn-ad mt-8" onclick="UI.handlePrestige()">📺 看广告 钻石×2</button>
          <button class="btn btn-block btn-secondary mt-8" onclick="UI.confirmPrestige(false)">直接转生</button>
        </div>
      `;
    } else {
      const stage = SPACE_ELEVATOR[s.elevatorStage];
      html += `
        <div class="card">
          <div class="card-title">🔄 转生</div>
          <div class="modal-body">完成太空电梯第4阶段"星际殖民"后可转生。</div>
          <div class="text-sm text-muted">当前进度: 第${s.elevatorStage + 1}阶段 / 共4阶段</div>
        </div>
      `;
    }

    container.innerHTML = html;
  },

  formatModuleEffect(mod) {
    const parts = [];
    if (mod.effect.rateMul) parts.push(`速率+${Math.round((mod.effect.rateMul - 1) * 100)}%`);
    if (mod.effect.powerMul) parts.push(`能耗${Math.round((mod.effect.powerMul - 1) * 100)}%`);
    if (mod.effect.doubleChance) parts.push(`双产${Math.round(mod.effect.doubleChance * 100)}%`);
    if (mod.effect.chainChance) parts.push(`连锁${Math.round(mod.effect.chainChance * 100)}%`);
    return parts.join(', ') || '综合加成';
  },

  // ==================== 订单/太空电梯页 ====================
  updateOrdersPage() {
    const container = document.getElementById('page-orders');
    const s = Game.state;

    let html = '';

    // 太空电梯
    const stage = SPACE_ELEVATOR[s.elevatorStage];
    if (stage) {
      const progress = Game.getElevatorProgress();
      html += `
        <div class="card">
          <div class="card-title">🚀 太空电梯 - 第${stage.stage}阶段</div>
          <div class="card-subtitle">${stage.name}</div>
          <div class="modal-body mt-8">${stage.rewards.desc}</div>
      `;

      let canDeliver = true;
      for (const [resId, info] of Object.entries(progress)) {
        const res = RESOURCES[resId];
        const has = s.inventory[resId] || 0;
        const remaining = info.needed - info.current;
        if (remaining > has) canDeliver = false;
        html += `
          <div class="flex-between mt-8" style="padding:8px;background:var(--bg-card2);border-radius:6px;">
            <span>${res ? res.icon : ''} ${res ? res.name : resId}</span>
            <span class="${info.current >= info.needed ? 'text-green' : 'text-muted'}">${formatNumber(info.current)}/${info.needed}</span>
          </div>
        `;
      }

      html += `<button class="btn btn-block ${canDeliver ? 'btn-primary' : 'btn-secondary'} mt-8" onclick="UI.deliverElevator()" ${canDeliver ? '' : 'disabled'}>📤 交付</button>`;
      html += '</div>';
    } else {
      html += '<div class="card"><div class="card-title">🎉 通关！</div><div class="modal-body">所有阶段已完成，可转生重新挑战。</div></div>';
    }

    // 硬盘探索
    html += '<div class="card"><div class="card-title">🔍 硬盘探索</div>';
    if (s.diskExploreTask && !s.diskExploreTask.completed) {
      html += '<div class="text-sm text-muted mb-8">提交材料解锁替代配方</div>';
      for (const [resId, needed] of Object.entries(s.diskExploreTask.requirements)) {
        const res = RESOURCES[resId];
        const submitted = s.diskExploreTask.submitted[resId] || 0;
        const remaining = needed - submitted;
        const has = s.inventory[resId] || 0;
        html += `
          <div class="flex-between mt-8" style="padding:8px;background:var(--bg-card2);border-radius:6px;">
            <span>${res ? res.icon : ''} ${res ? res.name : resId}</span>
            <div class="flex gap-4 items-center">
              <span class="text-sm">${submitted}/${needed}</span>
              ${remaining > 0 ? `<button class="btn btn-sm btn-secondary" onclick="UI.submitDisk('${resId}', ${remaining})" ${has > 0 ? '' : 'disabled'}>提交</button>` : '<span class="text-green">✓</span>'}
            </div>
          </div>
        `;
      }
    } else if (s.diskExploreTask && s.diskExploreTask.completed) {
      html += '<div class="text-sm text-green mb-8">✓ 探索完成！</div>';
      html += `<button class="btn btn-block btn-ad" onclick="UI.skipDiskWait()">📺 看广告立即领取</button>`;
      html += `<button class="btn btn-block btn-primary mt-8" onclick="UI.completeDisk()">领取硬盘</button>`;
    } else {
      const cd = s.diskExploreCooldown - Date.now();
      if (cd > 0) {
        const mins = Math.ceil(cd / 60000);
        html += `<div class="text-sm text-muted mb-8">下次探索: ${mins}分钟后</div>`;
        html += `<button class="btn btn-block btn-ad" onclick="UI.skipDiskWait()">📺 看广告跳过等待</button>`;
      } else {
        html += '<div class="text-sm text-muted mb-8">新的探索任务即将刷新...</div>';
      }
    }
    html += '</div>';

    // 库存
    html += '<div class="card"><div class="card-title">📦 库存</div>';
    let hasItems = false;
    for (const [resId, amount] of Object.entries(s.inventory)) {
      if (amount > 0.1) {
        hasItems = true;
        const res = RESOURCES[resId];
        html += `<div class="flex-between mt-8" style="padding:6px 8px;background:var(--bg-card2);border-radius:6px;font-size:13px;">
          <span>${res ? res.icon : ''} ${res ? res.name : resId}</span>
          <span class="text-bold">${formatNumber(amount)}</span>
        </div>`;
      }
    }
    if (!hasItems) html += '<div class="text-sm text-muted">暂无库存</div>';
    html += '</div>';

    container.innerHTML = html;
  },

  // ==================== 加速按钮 ====================
  updateBoostButton() {
    const btn = document.getElementById('boost-btn');
    if (!btn) return;

    const boostActive = Date.now() < Game.state.boostUntil;
    const onCooldown = AdManager.isOnCooldown('speed_boost');
    const timer = AdManager.formatCooldown('speed_boost');

    if (boostActive) {
      const remaining = Math.ceil((Game.state.boostUntil - Date.now()) / 1000);
      btn.className = 'boost-btn';
      btn.innerHTML = `🚀<span class="boost-timer">${remaining}s</span>`;
    } else if (onCooldown) {
      btn.className = 'boost-btn cooldown';
      btn.innerHTML = `⏳<span class="boost-timer">${timer}</span>`;
    } else {
      btn.className = 'boost-btn';
      btn.innerHTML = '🚀';
    }
  },

  // ==================== 交互操作 ====================
  buyMachine(type) {
    if (Game.buyMachine(type)) {
      this.showToast('✓ 购买成功');
    } else {
      this.showToast('✗ 金币不足');
    }
    this.update();
  },

  upgradeMachine(id) {
    if (Game.upgradeMachine(id)) {
      this.update();
    } else {
      this.showToast('✗ 金币不足或已达上限');
    }
  },

  buyGenerator(type) {
    if (Game.buyGenerator(type)) {
      this.showToast('✓ 购买发电机');
    } else {
      this.showToast('✗ 资源不足');
    }
    this.update();
  },

  upgradeGenerator(idx) {
    const gen = Game.state.generators[idx];
    if (!gen) return;
    // 简化：直接升级
    const def = GENERATORS[gen.type];
    const cost = Math.floor(def.baseCost * 0.3 * Math.pow(1.5, gen.level));
    if (Game.state.coins >= cost) {
      Game.state.coins -= cost;
      gen.level++;
      Game.applyTechEffects();
      this.showToast('✓ 升级成功');
    } else {
      this.showToast('✗ 金币不足');
    }
    this.update();
  },

  startResearch(techId) {
    if (Game.startResearch(techId)) {
      this.showToast('⚡ 开始研究');
    }
    this.update();
  },

  toggleOverclock(id) {
    Game.toggleOverclock(id);
    this.update();
  },

  deliverElevator() {
    if (Game.deliverToElevator()) {
      this.showToast(`🚀 第${Game.state.elevatorStage}阶段完成！`);
    } else {
      this.showToast('✗ 材料不足');
    }
    this.update();
  },

  submitDisk(resId, amount) {
    Game.submitDiskMaterial(resId, amount);
    this.update();
  },

  completeDisk() {
    const result = Game.completeDiskExplore();
    if (result) {
      if (result.type === 'recipe') {
        this.showToast(`✓ 解锁配方: ${result.alt.name}`);
      } else {
        this.showToast(`✓ 获得${result.amount}💎`);
      }
    }
    this.update();
  },

  buyModule(modId) {
    const mod = MODULES[modId];
    if (!mod) return;
    if (mod.isDiamond) {
      if (Game.state.diamonds >= mod.diamondCost) {
        Game.state.diamonds -= mod.diamondCost;
        Game.state.moduleInventory.push(modId);
        this.showToast(`✓ 购买${mod.name}`);
      } else {
        this.showToast('✗ 钻石不足');
      }
    } else {
      if (Game.state.coins >= mod.cost) {
        Game.state.coins -= mod.cost;
        Game.state.moduleInventory.push(modId);
        this.showToast(`✓ 购买${mod.name}`);
      } else {
        this.showToast('✗ 金币不足');
      }
    }
    this.update();
  },

  // ==================== 配方选择器 ====================
  showRecipePicker(machineId) {
    const machine = Game.state.machines.find(m => m.id == machineId);
    if (!machine) return;
    const def = MACHINES[machine.type];
    const recipes = getRecipeList(machine.type);

    let html = `<div class="modal-title">📋 选择配方 - ${def.name}</div>`;
    for (const [recipeId, recipe] of recipes) {
      const unlocked = !recipe.unlock || Game.isUnlocked(recipe.unlock);
      if (!unlocked) continue;
      const selected = machine.recipeId === recipeId;
      html += `
        <div class="recipe-option ${selected ? 'selected' : ''}" onclick="UI.setRecipe('${machineId}', '${recipeId}')">
          <div class="recipe-flow">${this.formatRecipe(recipe)}</div>
          <div class="text-sm text-muted">耗时: ${recipe.time}s</div>
        </div>
      `;
    }

    this.showModal(html);
  },

  setRecipe(machineId, recipeId) {
    Game.setMachineRecipe(machineId, recipeId);
    this.closeModal();
    this.update();
  },

  // ==================== 模块选择器 ====================
  showModulePicker(machineId, slotIndex) {
    const machine = Game.state.machines.find(m => m.id == machineId);
    if (!machine) return;

    let html = `<div class="modal-title">🧩 安装模块 - 插槽${slotIndex + 1}</div>`;
    if (machine.modules && machine.modules[slotIndex]) {
      const oldMod = MODULES[machine.modules[slotIndex]];
      html += `<div class="text-sm text-muted mb-8">当前: ${oldMod.icon} ${oldMod.name}</div>`;
    }

    if (Game.state.moduleInventory.length === 0) {
      html += '<div class="text-sm text-muted">模块库存为空，去商店购买模块</div>';
    } else {
      for (let i = 0; i < Game.state.moduleInventory.length; i++) {
        const modId = Game.state.moduleInventory[i];
        const mod = MODULES[modId];
        if (!mod) continue;
        html += `
          <div class="recipe-option" onclick="UI.installModule('${machineId}', ${slotIndex}, ${i})">
            <span>${mod.icon} ${mod.name}</span>
            <div class="text-sm text-muted">${this.formatModuleEffect(mod)}</div>
          </div>
        `;
      }
    }

    // 卸载按钮
    if (machine.modules && machine.modules[slotIndex]) {
      html += `<button class="btn btn-block btn-danger mt-8" onclick="UI.uninstallModule('${machineId}', ${slotIndex})">卸载模块</button>`;
    }

    this.showModal(html);
  },

  installModule(machineId, slotIndex, invIdx) {
    const modId = Game.state.moduleInventory[invIdx];
    const machine = Game.state.machines.find(m => m.id == machineId);
    if (!machine) return;

    // 取出旧模块
    if (machine.modules && machine.modules[slotIndex]) {
      Game.state.moduleInventory.push(machine.modules[slotIndex]);
    }
    // 安装新模块
    if (!machine.modules) machine.modules = [];
    machine.modules[slotIndex] = modId;
    Game.state.moduleInventory.splice(invIdx, 1);

    this.closeModal();
    this.update();
  },

  uninstallModule(machineId, slotIndex) {
    const machine = Game.state.machines.find(m => m.id == machineId);
    if (!machine || !machine.modules || !machine.modules[slotIndex]) return;
    Game.state.moduleInventory.push(machine.modules[slotIndex]);
    machine.modules.splice(slotIndex, 1);
    this.closeModal();
    this.update();
  },

  // ==================== 广告处理 ====================
  async handleSpeedBoost() {
    if (Date.now() < Game.state.boostUntil) return;
    try {
      const result = await AdManager.showRewardedAd('speed_boost');
      if (result.watched) {
        Game.applySpeedBoost();
        this.showToast('🚀 生产加速 ×2，5分钟');
        this.update();
      }
    } catch (e) {
      this.showToast(e.message || '广告失败');
    }
  },

  async handleFreeCoins() {
    try {
      const result = await AdManager.showRewardedAd('free_coins');
      if (result.watched) {
        const coins = Game.claimFreeCoins();
        this.showToast(`💰 +${formatNumber(coins)}金币`);
        this.update();
      }
    } catch (e) {
      this.showToast(e.message || '广告失败');
    }
  },

  async handleFreeModule() {
    try {
      const result = await AdManager.showRewardedAd('free_module');
      if (result.watched) {
        const mod = Game.claimFreeModule();
        this.showToast(`📦 获得${mod.name}`);
        this.update();
      }
    } catch (e) {
      this.showToast(e.message || '广告失败');
    }
  },

  async handleTechBoost() {
    try {
      const result = await AdManager.showRewardedAd('tech_boost');
      if (result.watched) {
        Game.applyTechBoost();
        this.showToast('⚡ 科技加速 ×2，1小时');
        this.update();
      }
    } catch (e) {
      this.showToast(e.message || '广告失败');
    }
  },

  async skipDiskWait() {
    try {
      const result = await AdManager.showRewardedAd('disk_skip');
      if (result.watched) {
        // 跳过冷却/完成探索
        if (Game.state.diskExploreTask && Game.state.diskExploreTask.completed) {
          // 直接领取
        } else if (!Game.state.diskExploreTask) {
          Game.state.diskExploreCooldown = 0;
          Game.generateDiskTask();
        }
        this.showToast('✓ 跳过等待');
        this.update();
      }
    } catch (e) {
      this.showToast(e.message || '广告失败');
    }
  },

  async handlePrestige() {
    try {
      const result = await AdManager.showRewardedAd('prestige_double');
      if (result.watched) {
        this.confirmPrestige(true);
      }
    } catch (e) {
      this.showToast(e.message || '广告失败');
    }
  },

  confirmPrestige(doubled) {
    const result = Game.prestige();
    if (result) {
      if (doubled) {
        Game.state.diamonds += result.diamonds; // 额外翻倍
      }
      this.showToast(`🔄 转生成功！+${result.diamonds * (doubled ? 2 : 1)}💎`);
      this.expandedMachine = null;
      this.update();
    }
  },

  // ==================== 离线报告 ====================
  showOfflineReport(report) {
    const html = `
      <div class="modal-title">📦 离线收益报告</div>
      <div class="offline-report">
        <div class="report-time">离线时长: ${this.formatDuration(report.duration)}</div>
        <div class="report-time">效率: ${Math.round(report.efficiency * 100)}%</div>
        <div class="report-amount">💰 ${formatNumber(report.coins)}</div>
        ${report.tech > 0 ? `<div class="text-yellow">🔬 +${formatNumber(report.tech)} 科技点</div>` : ''}
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="UI.closeModal()">领取</button>
        <button class="btn btn-ad" onclick="UI.claimOfflineDouble(${report.coins}, ${report.tech})">📺 ×2</button>
      </div>
    `;
    this.showModal(html);
  },

  async claimOfflineDouble(coins, tech) {
    try {
      const result = await AdManager.showRewardedAd('offline_double');
      if (result.watched) {
        Game.applyOfflineDouble(coins, tech); // 额外翻倍
        this.closeModal();
        this.showToast(`💰 离线收益翻倍！`);
        this.update();
      }
    } catch (e) {
      this.closeModal();
      this.showToast(e.message || '广告失败');
    }
  },

  // ==================== 工具方法 ====================
  formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}小时${m}分`;
    return `${m}分钟`;
  },

  showModal(html) {
    let overlay = document.getElementById('modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'modal-overlay';
      overlay.className = 'modal-overlay';
      overlay.innerHTML = '<div class="modal" id="modal-content"></div>';
      overlay.addEventListener('click', (e) => { if (e.target === overlay) this.closeModal(); });
      document.body.appendChild(overlay);
    }
    document.getElementById('modal-content').innerHTML = html;
    overlay.style.display = 'flex';
  },

  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.style.display = 'none';
  },

  showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  },

  // ==================== 传送带视图（工厂页附属） ====================
  updateConveyorView() {
    const s = Game.state;
    if (!s.conveyors) s.conveyors = []; // 传送带实例 { type, fromMachine, toMachine }
    if (!s.conveyorInventory) s.conveyorInventory = {};

    let html = '<div class="card mt-12"><div class="card-title">🔗 传送带物流</div>';

    // 当前物流等级
    const logisticsLevel = Game.effects.logisticsLevel || 1;
    const loss = Game.effects.logisticsLoss || 0.10;
    html += `<div class="text-sm text-muted mb-8">物流等级: Lv${logisticsLevel}（损耗${Math.round(loss * 100)}%）</div>`;

    // 已部署传送带
    if (s.conveyors.length > 0) {
      for (let i = 0; i < s.conveyors.length; i++) {
        const c = s.conveyors[i];
        const def = CONVEYORS[c.type];
        if (!def) continue;
        html += `
          <div class="flex-between mt-8" style="padding:8px;background:var(--bg-card2);border-radius:6px;">
            <div>
              <span>${def.name}</span>
              <div class="text-sm text-muted">速率${def.speed}/s · 损耗${Math.round(def.loss * 100)}%</div>
            </div>
            <button class="btn btn-sm btn-danger" onclick="UI.removeConveyor(${i})">拆除</button>
          </div>
        `;
      }
    } else {
      html += '<div class="text-sm text-muted mb-8">暂无部署的传送带</div>';
    }

    // 可购买传送带
    html += '<div class="card-subtitle mt-12">购买传送带</div>';
    for (const [type, def] of Object.entries(CONVEYORS)) {
      if (def.unlock && !Game.isUnlocked(def.unlock) && !Game.hasTech(def.unlock)) continue;
      const owned = s.conveyorInventory[type] || 0;
      const canAfford = s.coins >= def.cost;
      html += `
        <div class="flex-between mt-8" style="padding:8px;background:var(--bg-card2);border-radius:6px;">
          <div>
            <span>${def.name} <span class="text-sm text-muted">(库存×${owned})</span></span>
            <div class="text-sm text-muted">速率${def.speed}/s · 损耗${Math.round(def.loss * 100)}%</div>
          </div>
          <button class="btn btn-sm ${canAfford ? 'btn-primary' : 'btn-secondary'}" onclick="UI.buyConveyor('${type}')" ${canAfford ? '' : 'disabled'}>
            💰${formatNumber(def.cost)}
          </button>
        </div>
      `;
    }
    html += '</div>';
    return html;
  },

  buyConveyor(type) {
    const def = CONVEYORS[type];
    if (!def) return;
    if (def.unlock && !Game.isUnlocked(def.unlock) && !Game.hasTech(def.unlock)) {
      this.showToast('✗ 未解锁');
      return;
    }
    if (Game.state.coins < def.cost) {
      this.showToast('✗ 金币不足');
      return;
    }
    Game.state.coins -= def.cost;
    if (!Game.state.conveyorInventory) Game.state.conveyorInventory = {};
    Game.state.conveyorInventory[type] = (Game.state.conveyorInventory[type] || 0) + 1;
    this.showToast(`✓ 购买${def.name}`);
    this.update();
  },

  removeConveyor(idx) {
    if (!Game.state.conveyors) return;
    const c = Game.state.conveyors[idx];
    if (!c) return;
    const def = CONVEYORS[c.type];
    Game.state.conveyors.splice(idx, 1);
    if (def) {
      Game.state.conveyorInventory[c.type] = (Game.state.conveyorInventory[c.type] || 0) + 1;
    }
    this.update();
  },

  // ==================== 舰队/战舰面板 ====================
  updateFleetPage() {
    const container = document.getElementById('page-fleet');
    if (!container) return;
    const s = Game.state;
    // 懒初始化战舰相关状态
    if (!s.ships) s.ships = [];
    if (!s.shipPartsInventory) s.shipPartsInventory = {};
    if (!s.fleet) s.fleet = [];

    let html = '';

    // 1. 舰队总战力概览
    const fleetShips = s.ships.filter(sh => s.fleet.includes(sh.id));
    const fleetPower = fleetShips.reduce((sum, sh) => sum + this.calcShipPower(sh), 0);
    const totalPower = s.ships.reduce((sum, sh) => sum + this.calcShipPower(sh), 0);
    const fleetCap = Game.effects.fleetSize || 6;
    html += `
      <div class="card">
        <div class="card-title">🚀 舰队总览</div>
        <div class="flex-between mt-8" style="padding:8px;background:var(--bg-card2);border-radius:6px;">
          <span>舰队战力</span>
          <span class="text-yellow text-bold">${formatNumber(fleetPower)}</span>
        </div>
        <div class="flex-between mt-8" style="padding:8px;background:var(--bg-card2);border-radius:6px;">
          <span>总战舰战力</span>
          <span class="text-blue text-bold">${formatNumber(totalPower)}</span>
        </div>
        <div class="flex-between mt-8" style="padding:8px;background:var(--bg-card2);border-radius:6px;">
          <span>舰队编组</span>
          <span>${fleetShips.length}/${fleetCap}</span>
        </div>
        ${Game.hasTech('star_military') ? '<div class="text-sm text-green mt-4">✓ 星际军事加成：舰队战力+50%</div>' : ''}
      </div>
    `;

    // 2. 当前拥有的战舰列表
    html += '<div class="card mt-12"><div class="card-title">🛸 战舰列表</div>';
    if (s.ships.length === 0) {
      html += '<div class="text-sm text-muted mb-8">暂无战舰，请在下方组装</div>';
    } else {
      for (const ship of s.ships) {
        const power = this.calcShipPower(ship);
        const inFleet = s.fleet.includes(ship.id);
        const canJoin = s.fleet.length < fleetCap;
        html += `
          <div class="flex-between mt-8" style="padding:8px;background:var(--bg-card2);border-radius:6px;">
            <div style="flex:1;">
              <div class="flex-between">
                <span class="text-bold">🛸 战舰 #${s.ships.indexOf(ship) + 1} Lv${ship.level || 1}</span>
                <span class="text-yellow">战力 ${formatNumber(power)}</span>
              </div>
              <div class="text-sm text-muted mt-4">${this.formatShipStats(ship)}</div>
            </div>
            <button class="btn btn-sm ${inFleet ? 'btn-danger' : (canJoin ? 'btn-primary' : 'btn-secondary')}" onclick="UI.assignFleet('${ship.id}')" ${(!inFleet && !canJoin) ? 'disabled' : ''}>
              ${inFleet ? '移出舰队' : '加入舰队'}
            </button>
          </div>
        `;
      }
    }
    html += '</div>';

    // 3. 战舰组装区域
    html += '<div class="card mt-12"><div class="card-title">🔧 战舰组装</div>';
    html += '<div class="text-sm text-muted mb-8">选择5类配件组装战舰（船体/引擎/武器/护盾/控制）</div>';
    html += `<button class="btn btn-block btn-primary mt-8" onclick="UI.showShipAssembler()">🛠️ 打开组装台</button>`;
    html += '</div>';

    // 4. 配件库存
    html += '<div class="card mt-12"><div class="card-title">📦 配件库存</div>';
    let hasParts = false;
    for (const [partId, count] of Object.entries(s.shipPartsInventory)) {
      if (count > 0) {
        hasParts = true;
        const part = SHIP_PARTS[partId];
        if (!part) continue;
        const typeName = { hull: '船体', engine: '引擎', weapon: '武器', shield: '护盾', control: '控制' }[part.type] || part.type;
        html += `
          <div class="flex-between mt-8" style="padding:8px;background:var(--bg-card2);border-radius:6px;">
            <span>${typeName} T${part.tier} ${part.name}</span>
            <span class="text-bold">×${count}</span>
          </div>
        `;
      }
    }
    if (!hasParts) html += '<div class="text-sm text-muted">暂无配件，需先在工厂制造（解锁军事科技后）</div>';
    html += '</div>';

    // 5. 配件制造入口（提示）
    html += '<div class="card mt-12"><div class="card-title">⚙️ 制造配件</div>';
    let hasMilitaryTech = Game.hasTech('military_lv1');
    if (!hasMilitaryTech) {
      html += '<div class="text-sm text-muted">需先研究军事Lv1科技解锁配件制造</div>';
    } else {
      html += '<div class="text-sm text-muted mb-8">在工厂页的组装机/制造商中可制造配件</div>';
      // 显示可制造配件列表
      for (const [partId, part] of Object.entries(SHIP_PARTS)) {
        if (part.unlock && !Game.isUnlocked(part.unlock) && !Game.hasTech(part.unlock)) continue;
        const canCraft = this.canCraftPart(part);
        html += `
          <div class="flex-between mt-8" style="padding:8px;background:var(--bg-card2);border-radius:6px;">
            <div>
              <span>${part.name} <span class="text-sm text-muted">T${part.tier}</span></span>
              <div class="text-sm text-muted">${this.formatPartCost(part)}</div>
            </div>
            <button class="btn btn-sm ${canCraft ? 'btn-primary' : 'btn-secondary'}" onclick="UI.craftShipPart('${partId}')" ${canCraft ? '' : 'disabled'}>制造</button>
          </div>
        `;
      }
    }
    html += '</div>';

    // 传送带视图（附属）
    html += this.updateConveyorView();

    container.innerHTML = html;
  },

  // 计算战舰战力
  calcShipPower(ship) {
    if (!ship || !ship.parts) return 0;
    let power = 0;
    for (const partId of Object.values(ship.parts)) {
      if (!partId) continue;
      const part = SHIP_PARTS[partId];
      if (!part) continue;
      if (part.hp) power += part.hp * 0.5;
      if (part.attack) power += part.attack * 2;
      if (part.defense) power += part.defense * 1.5;
      if (part.speed) power += part.speed * 0.3;
      if (part.power) power += part.power * 0.2;
    }
    power *= Math.pow(1.1, (ship.level || 1) - 1);
    if (Game.hasTech('star_military')) power *= 1.5;
    return Math.floor(power);
  },

  // 检查是否可制造配件
  canCraftPart(part) {
    if (!part.cost) return false;
    for (const [resId, amt] of Object.entries(part.cost)) {
      if ((Game.state.inventory[resId] || 0) < amt) return false;
    }
    return true;
  },

  // 格式化配件成本
  formatPartCost(part) {
    if (!part.cost) return '';
    return Object.entries(part.cost).map(([resId, amt]) => {
      const res = RESOURCES[resId];
      return `${res ? res.icon : '?'}${amt}`;
    }).join(' ');
  },

  // 制造配件
  craftShipPart(partId) {
    const part = SHIP_PARTS[partId];
    if (!part) return;
    if (!this.canCraftPart(part)) {
      this.showToast('✗ 材料不足');
      return;
    }
    for (const [resId, amt] of Object.entries(part.cost)) {
      Game.state.inventory[resId] = (Game.state.inventory[resId] || 0) - amt;
    }
    Game.state.shipPartsInventory[partId] = (Game.state.shipPartsInventory[partId] || 0) + 1;
    this.showToast(`✓ 制造${part.name}`);
    this.update();
  },

  // 战舰组装台
  showShipAssembler() {
    const s = Game.state;
    const partTypes = [
      { key: 'hull', name: '船体' },
      { key: 'engine', name: '引擎' },
      { key: 'weapon', name: '武器' },
      { key: 'shield', name: '护盾' },
      { key: 'control', name: '控制' },
    ];

    if (!s.assemblerSelection) s.assemblerSelection = {};

    let html = `<div class="modal-title">🛠️ 战舰组装台</div>`;
    html += '<div class="text-sm text-muted mb-8">为每类配件选择一种，然后组装</div>';

    for (const pt of partTypes) {
      html += `<div class="mb-8"><div class="text-bold mt-8">${pt.name}</div>`;
      const parts = Object.entries(SHIP_PARTS).filter(([id, p]) => p.type === pt.key && (Game.state.shipPartsInventory[id] || 0) > 0);
      if (parts.length === 0) {
        html += '<div class="text-sm text-muted">库存无此类配件</div>';
      } else {
        const selected = s.assemblerSelection[pt.key];
        for (const [partId, part] of parts) {
          const isSel = selected === partId;
          html += `
            <div class="recipe-option ${isSel ? 'selected' : ''}" onclick="UI.selectAssemblerPart('${pt.key}', '${partId}')">
              <span>${part.name} T${part.tier} (库存×${Game.state.shipPartsInventory[partId]})</span>
              <div class="text-sm text-muted">${this.formatPartStats(part)}</div>
            </div>
          `;
        }
      }
      html += '</div>';
    }

    // 检查是否全部选齐
    const allSelected = partTypes.every(pt => s.assemblerSelection[pt.key]);
    html += `<button class="btn btn-block ${allSelected ? 'btn-primary' : 'btn-secondary'} mt-8" onclick="UI.assembleShip()" ${allSelected ? '' : 'disabled'}>🚀 组装战舰</button>`;
    html += `<button class="btn btn-block btn-secondary mt-8" onclick="UI.closeModal()">关闭</button>`;

    this.showModal(html);
  },

  // 格式化配件属性
  formatPartStats(part) {
    const parts = [];
    if (part.hp) parts.push(`HP${part.hp}`);
    if (part.attack) parts.push(`攻击${part.attack}`);
    if (part.defense) parts.push(`防御${part.defense}`);
    if (part.speed) parts.push(`速度${part.speed}`);
    if (part.power) parts.push(`动力${part.power}`);
    if (part.hitRate) parts.push(`命中${Math.round(part.hitRate * 100)}%`);
    if (part.critRate) parts.push(`暴击${Math.round(part.critRate * 100)}%`);
    return parts.join(' · ') || '综合';
  },

  // 选择组装配件
  selectAssemblerPart(type, partId) {
    if (!Game.state.assemblerSelection) Game.state.assemblerSelection = {};
    Game.state.assemblerSelection[type] = partId;
    this.showShipAssembler(); // 刷新弹窗
  },

  // 组装战舰
  assembleShip() {
    const s = Game.state;
    const sel = s.assemblerSelection || {};
    const required = ['hull', 'engine', 'weapon', 'shield', 'control'];
    for (const t of required) {
      if (!sel[t]) {
        this.showToast('✗ 请选齐5类配件');
        return;
      }
      if ((s.shipPartsInventory[sel[t]] || 0) <= 0) {
        this.showToast('✗ 配件不足');
        return;
      }
    }
    // 扣除配件
    for (const t of required) {
      s.shipPartsInventory[sel[t]] -= 1;
    }
    // 创建战舰
    const newShip = {
      id: 'ship_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      parts: { ...sel },
      level: 1,
    };
    s.ships.push(newShip);
    s.assemblerSelection = {};
    this.closeModal();
    this.showToast('✓ 战舰组装成功！');
    this.update();
  },

  // 加入/移出舰队
  assignFleet(shipId) {
    const s = Game.state;
    const fleetCap = Game.effects.fleetSize || 6;
    const idx = s.fleet.indexOf(shipId);
    if (idx >= 0) {
      s.fleet.splice(idx, 1);
      this.showToast('✓ 移出舰队');
    } else {
      if (s.fleet.length >= fleetCap) {
        this.showToast('✗ 舰队已满');
        return;
      }
      s.fleet.push(shipId);
      this.showToast('✓ 加入舰队');
    }
    this.update();
  },

  // 格式化战舰属性
  formatShipStats(ship) {
    if (!ship || !ship.parts) return '无配件';
    const parts = [];
    for (const [type, partId] of Object.entries(ship.parts)) {
      if (!partId) continue;
      const part = SHIP_PARTS[partId];
      if (part) parts.push(part.name);
    }
    return parts.join(' | ') || '无配件';
  },

  // ==================== 星图面板 ====================
  updateStarMapPage() {
    const container = document.getElementById('page-starmap');
    if (!container) return;
    const s = Game.state;
    // 懒初始化
    if (!s.occupiedPlanets) s.occupiedPlanets = {};
    if (!s.fleetStatus) s.fleetStatus = { status: 'idle' };
    if (!s.battleReports) s.battleReports = [];

    let html = '';

    // 舰队状态
    html += '<div class="card"><div class="card-title">🗺️ 星图</div>';
    const fs = s.fleetStatus;
    if (fs.status === 'idle') {
      const fleetPower = this.calcFleetPower();
      html += `<div class="text-sm text-muted mb-8">舰队状态: <span class="text-green">待命中</span></div>`;
      html += `<div class="text-sm text-muted">舰队战力: <span class="text-yellow">${formatNumber(fleetPower)}</span></div>`;
      if (fleetPower === 0) {
        html += '<div class="text-sm text-red mt-4">⚠️ 舰队无战舰，请先在舰队页编组</div>';
      }
    } else if (fs.status === 'attacking') {
      const target = PLANETS.find(p => p.id === fs.targetPlanet);
      const remain = Math.max(0, Math.ceil((fs.returnAt - Date.now()) / 1000));
      html += `<div class="text-sm text-yellow mb-8">⚡ 出征中 → ${target ? target.name : '?'}</div>`;
      html += `<div class="text-sm text-muted">剩余时间: ${this.formatDuration(remain)}</div>`;
    } else if (fs.status === 'occupying') {
      const target = PLANETS.find(p => p.id === fs.targetPlanet);
      html += `<div class="text-sm text-green mb-8">🏰 占领中: ${target ? target.name : '?'}</div>`;
    }
    html += '</div>';

    // 已占领星球产出
    const occupiedList = Object.entries(s.occupiedPlanets);
    if (occupiedList.length > 0) {
      html += '<div class="card mt-12"><div class="card-title">🏰 已占领星球</div>';
      for (const [planetId, info] of occupiedList) {
        const planet = PLANETS.find(p => p.id === planetId);
        if (!planet) continue;
        let resStr = Object.entries(planet.resources).map(([r, a]) => {
          const res = RESOURCES[r];
          return `${res ? res.icon : ''}${formatNumber(a * 0.01)}/s`;
        }).join(' ');
        html += `
          <div class="flex-between mt-8" style="padding:8px;background:var(--bg-card2);border-radius:6px;">
            <div>
              <span class="text-bold">${planet.name}</span>
              <div class="text-sm text-green">产出: ${resStr}</div>
            </div>
            <button class="btn btn-sm btn-secondary" onclick="UI.abandonPlanet('${planetId}')">放弃</button>
          </div>
        `;
      }
      html += '</div>';
    }

    // 星球列表
    html += '<div class="card mt-12"><div class="card-title">🌍 可征战星球</div>';
    for (const planet of PLANETS) {
      const isOccupied = !!s.occupiedPlanets[planet.id];
      const stars = '⭐'.repeat(Math.min(planet.difficulty, 10));
      let resStr = Object.entries(planet.resources).map(([r, a]) => {
        const res = RESOURCES[r];
        return `${res ? res.icon : '?'}${formatNumber(a)}`;
      }).join(' ');
      let rewardStr = Object.entries(planet.reward).map(([r, a]) => {
        if (r === 'coins') return `💰${formatNumber(a)}`;
        if (r === 'diamonds') return `💎${a}`;
        return `${r}:${a}`;
      }).join(' ');

      html += `
        <div class="machine-item mt-8" style="cursor:default;">
          <div class="machine-item-header">
            <div class="machine-name">
              <span class="machine-icon-box" style="background:#3B82F6">🌍</span>
              ${planet.name} ${isOccupied ? '<span class="text-green">[已占领]</span>' : ''}
            </div>
            <span class="text-sm">${stars}</span>
          </div>
          <div class="machine-stats">
            <span>距离: <span class="stat-val">${planet.distance}</span></span>
            <span>驻军: <span class="text-red">${formatNumber(planet.garrison)}</span></span>
          </div>
          <div class="text-sm text-muted mt-4">资源: ${resStr}</div>
          <div class="text-sm text-yellow mt-4">奖励: ${rewardStr}</div>
          <div class="flex gap-4 mt-8">
            <button class="btn btn-sm btn-primary" onclick="UI.attackPlanet('${planet.id}')">⚔️攻击</button>
            <button class="btn btn-sm btn-secondary" onclick="UI.plunderPlanet('${planet.id}')">💰掠夺</button>
            <button class="btn btn-sm ${isOccupied ? 'btn-secondary' : 'btn-primary'}" onclick="UI.occupyPlanet('${planet.id}')" ${isOccupied ? 'disabled' : ''}>🏰占领</button>
            <button class="btn btn-sm btn-danger" onclick="UI.destroyPlanet('${planet.id}')">💥摧毁</button>
          </div>
        </div>
      `;
    }
    html += '</div>';

    container.innerHTML = html;
  },

  // 计算舰队战力
  calcFleetPower() {
    const s = Game.state;
    if (!s.ships || !s.fleet) return 0;
    const fleetShips = s.ships.filter(sh => s.fleet.includes(sh.id));
    return fleetShips.reduce((sum, sh) => sum + this.calcShipPower(sh), 0);
  },

  // 攻击星球
  attackPlanet(planetId) {
    const s = Game.state;
    if (s.fleetStatus && s.fleetStatus.status !== 'idle') {
      this.showToast('✗ 舰队出征中');
      return;
    }
    const planet = PLANETS.find(p => p.id === planetId);
    if (!planet) return;
    const fleetPower = this.calcFleetPower();
    if (fleetPower <= 0) {
      this.showToast('✗ 舰队无战舰');
      return;
    }
    // 航行时间（距离/速度），简化为距离秒
    const travelTime = planet.distance;
    const battleTime = 30;
    const totalTime = travelTime * 2 + battleTime;

    s.fleetStatus = {
      status: 'attacking',
      targetPlanet: planetId,
      returnAt: Date.now() + totalTime * 1000,
      travelEnd: Date.now() + travelTime * 1000,
      battleEnd: Date.now() + (travelTime + battleTime) * 1000,
      action: 'attack',
    };

    // 模拟战斗结果
    const win = fleetPower > planet.garrison * 50;
    const losses = Math.floor(planet.garrison * 50 / Math.max(1, fleetPower) * 0.3);
    setTimeout(() => {
      this.resolveBattle(planetId, 'attack', win, losses);
    }, totalTime * 1000);

    this.showToast(`⚡ 出征${planet.name}`);
    this.update();
  },

  // 掠夺星球
  plunderPlanet(planetId) {
    const s = Game.state;
    if (s.fleetStatus && s.fleetStatus.status !== 'idle') {
      this.showToast('✗ 舰队出征中');
      return;
    }
    const planet = PLANETS.find(p => p.id === planetId);
    if (!planet) return;
    const fleetPower = this.calcFleetPower();
    if (fleetPower <= 0) {
      this.showToast('✗ 舰队无战舰');
      return;
    }
    const travelTime = planet.distance;
    const battleTime = 20;
    const totalTime = travelTime * 2 + battleTime;

    s.fleetStatus = {
      status: 'attacking',
      targetPlanet: planetId,
      returnAt: Date.now() + totalTime * 1000,
      travelEnd: Date.now() + travelTime * 1000,
      battleEnd: Date.now() + (travelTime + battleTime) * 1000,
      action: 'plunder',
    };

    const win = fleetPower > planet.garrison * 30;
    setTimeout(() => {
      this.resolveBattle(planetId, 'plunder', win, 0);
    }, totalTime * 1000);

    this.showToast(`⚡ 掠夺${planet.name}`);
    this.update();
  },

  // 占领星球
  occupyPlanet(planetId) {
    const s = Game.state;
    if (s.occupiedPlanets[planetId]) {
      this.showToast('✗ 已占领');
      return;
    }
    if (s.fleetStatus && s.fleetStatus.status !== 'idle') {
      this.showToast('✗ 舰队出征中');
      return;
    }
    const planet = PLANETS.find(p => p.id === planetId);
    if (!planet) return;
    const fleetPower = this.calcFleetPower();
    if (fleetPower <= 0) {
      this.showToast('✗ 舰队无战舰');
      return;
    }
    const travelTime = planet.distance;
    const battleTime = 60;
    const totalTime = travelTime * 2 + battleTime;

    s.fleetStatus = {
      status: 'attacking',
      targetPlanet: planetId,
      returnAt: Date.now() + totalTime * 1000,
      travelEnd: Date.now() + travelTime * 1000,
      battleEnd: Date.now() + (travelTime + battleTime) * 1000,
      action: 'occupy',
    };

    const win = fleetPower > planet.garrison * 80;
    setTimeout(() => {
      this.resolveBattle(planetId, 'occupy', win, 0);
    }, totalTime * 1000);

    this.showToast(`⚡ 占领${planet.name}`);
    this.update();
  },

  // 摧毁星球
  destroyPlanet(planetId) {
    const s = Game.state;
    if (s.fleetStatus && s.fleetStatus.status !== 'idle') {
      this.showToast('✗ 舰队出征中');
      return;
    }
    const planet = PLANETS.find(p => p.id === planetId);
    if (!planet) return;
    const fleetPower = this.calcFleetPower();
    if (fleetPower <= 0) {
      this.showToast('✗ 舰队无战舰');
      return;
    }
    const travelTime = planet.distance;
    const battleTime = 90;
    const totalTime = travelTime * 2 + battleTime;

    s.fleetStatus = {
      status: 'attacking',
      targetPlanet: planetId,
      returnAt: Date.now() + totalTime * 1000,
      travelEnd: Date.now() + travelTime * 1000,
      battleEnd: Date.now() + (travelTime + battleTime) * 1000,
      action: 'destroy',
    };

    const win = fleetPower > planet.garrison * 120;
    setTimeout(() => {
      this.resolveBattle(planetId, 'destroy', win, 0);
    }, totalTime * 1000);

    this.showToast(`⚡ 摧毁${planet.name}`);
    this.update();
  },

  // 战斗结算
  resolveBattle(planetId, action, win, losses) {
    const s = Game.state;
    const planet = PLANETS.find(p => p.id === planetId);
    if (!planet) return;

    const report = {
      planetName: planet.name,
      action,
      win,
      fleetPower: this.calcFleetPower(),
      enemyPower: planet.garrison,
      losses,
      rewards: {},
      time: Date.now(),
    };

    if (win) {
      // 胜利奖励
      if (action === 'attack' || action === 'plunder') {
        if (planet.reward.coins) {
          const coins = Math.floor(planet.reward.coins * 0.5);
          s.coins += coins;
          report.rewards.coins = coins;
        }
        if (planet.reward.diamonds) {
          const dia = Math.floor(planet.reward.diamonds * 0.5);
          s.diamonds += dia;
          report.rewards.diamonds = dia;
        }
      } else if (action === 'occupy') {
        s.occupiedPlanets[planetId] = { occupiedAt: Date.now() };
        if (planet.reward.coins) {
          s.coins += planet.reward.coins;
          report.rewards.coins = planet.reward.coins;
        }
        if (planet.reward.diamonds) {
          s.diamonds += planet.reward.diamonds;
          report.rewards.diamonds = planet.reward.diamonds;
        }
      } else if (action === 'destroy') {
        if (planet.reward.coins) {
          s.coins += Math.floor(planet.reward.coins * 1.5);
          report.rewards.coins = Math.floor(planet.reward.coins * 1.5);
        }
        if (planet.reward.diamonds) {
          s.diamonds += Math.floor(planet.reward.diamonds * 1.5);
          report.rewards.diamonds = Math.floor(planet.reward.diamonds * 1.5);
        }
      }
    } else {
      // 失败损失战舰
      if (s.ships && s.ships.length > 0 && losses > 0) {
        // 简化：损失部分战舰等级
        for (const ship of s.ships) {
          if (s.fleet.includes(ship.id) && losses > 0) {
            ship.level = Math.max(1, (ship.level || 1) - 1);
            losses--;
          }
        }
      }
    }

    // 添加战报
    if (!s.battleReports) s.battleReports = [];
    s.battleReports.unshift(report);
    if (s.battleReports.length > 20) s.battleReports = s.battleReports.slice(0, 20);

    s.fleetStatus = { status: 'idle' };

    // 弹出战斗报告
    this.showBattleReportModal(report);
    this.update();
  },

  // 放弃星球
  abandonPlanet(planetId) {
    if (!Game.state.occupiedPlanets) return;
    delete Game.state.occupiedPlanets[planetId];
    this.showToast('✓ 放弃占领');
    this.update();
  },

  // 战斗报告弹窗
  showBattleReportModal(report) {
    const html = this.formatBattleReport(report);
    this.showModal(html);
  },

  // 格式化战斗报告
  formatBattleReport(report) {
    if (!report) return '<div class="modal-body">无战报</div>';
    let html = `<div class="modal-title">📋 战斗报告 - ${report.planetName}</div>`;
    html += `<div class="modal-body">`;
    html += `<div class="mb-8">行动: ${this.getActionName(report.action)}</div>`;
    html += `<div class="mb-8 ${report.win ? 'text-green' : 'text-red'}">${report.win ? '✓ 胜利' : '✗ 失败'}</div>`;
    html += `<div class="flex-between mb-8"><span>我方战力:</span><span class="text-blue">${formatNumber(report.fleetPower)}</span></div>`;
    html += `<div class="flex-between mb-8"><span>敌方驻军:</span><span class="text-red">${formatNumber(report.enemyPower)}</span></div>`;
    if (report.losses > 0) {
      html += `<div class="flex-between mb-8"><span>战损:</span><span class="text-red">${report.losses}战舰受损</span></div>`;
    }
    if (report.rewards && Object.keys(report.rewards).length > 0) {
      html += '<div class="text-bold mt-8">战利品:</div>';
      for (const [r, a] of Object.entries(report.rewards)) {
        if (r === 'coins') html += `<div class="text-yellow">💰 ${formatNumber(a)}</div>`;
        else if (r === 'diamonds') html += `<div class="text-purple">💎 ${a}</div>`;
      }
    }
    html += '</div>';
    html += `<button class="btn btn-block btn-primary mt-8" onclick="UI.closeModal()">确认</button>`;
    return html;
  },

  // 获取行动名称
  getActionName(action) {
    const names = { attack: '攻击', plunder: '掠夺', occupy: '占领', destroy: '摧毁' };
    return names[action] || action;
  },

  // ==================== 角色面板 ====================
  updateCharacterPage() {
    const container = document.getElementById('page-character');
    if (!container) return;
    const s = Game.state;
    // 懒初始化
    if (!s.characters) s.characters = [];
    if (!s.recruitedCharIds) s.recruitedCharIds = [];

    const slotsMax = Game.effects.characterSlots || (Game.hasTech('character_lv1') ? 3 : 0);
    const slotsUsed = s.characters.length;

    let html = '';

    // 1. 角色位
    html += `
      <div class="card">
        <div class="card-title">👥 角色</div>
        <div class="flex-between mt-8" style="padding:8px;background:var(--bg-card2);border-radius:6px;">
          <span>角色位</span>
          <span class="${slotsUsed >= slotsMax ? 'text-red' : 'text-green'}">${slotsUsed}/${slotsMax}</span>
        </div>
        ${slotsMax === 0 ? '<div class="text-sm text-muted mt-4">需研究"角色Lv1"科技解锁角色系统</div>' : ''}
      </div>
    `;

    // 5. 角色加成总览
    if (s.characters.length > 0) {
      html += '<div class="card mt-12"><div class="card-title">📈 角色加成总览</div>';
      const bonuses = this.calcCharacterBonuses();
      for (const [key, val] of Object.entries(bonuses)) {
        if (val > 0) {
          html += `<div class="flex-between mt-8" style="padding:6px 8px;background:var(--bg-card2);border-radius:6px;font-size:13px;">
            <span>${this.getBonusName(key)}</span>
            <span class="text-green">+${Math.round(val * 100)}%</span>
          </div>`;
        }
      }
      html += '</div>';
    }

    // 2. 已招募角色列表
    html += '<div class="card mt-12"><div class="card-title">✨ 已招募角色</div>';
    if (s.characters.length === 0) {
      html += '<div class="text-sm text-muted">暂无角色，请在下方招募</div>';
    } else {
      for (let i = 0; i < s.characters.length; i++) {
        const c = s.characters[i];
        const def = CHARACTERS[c.charId];
        if (!def) continue;
        const rarityColor = this.getRarityColor(def.rarity);
        const classDef = c.class ? CLASSES[c.class] : null;
        html += `
          <div class="machine-item mt-8" style="cursor:default;border-left:3px solid ${rarityColor};">
            <div class="machine-item-header">
              <div class="machine-name">
                <span>${this.getRarityIcon(def.rarity)}</span>
                <span style="color:${rarityColor}">${def.name}</span>
              </div>
              <span class="text-sm" style="color:${rarityColor}">${def.rarity}</span>
            </div>
            <div class="text-sm text-muted mt-4">${def.desc}</div>
            <div class="machine-stats">
              <span>Lv${c.level || 1}</span>
              <span>${def.type === 'production' ? '🏭生产' : '⚔️军事'}</span>
              ${classDef ? `<span class="text-yellow">${classDef.name}</span>` : '<span class="text-muted">未转职</span>'}
            </div>
            <div class="flex gap-4 mt-8">
              <button class="btn btn-sm btn-primary" onclick="UI.upgradeCharacter('${c.id}')">⬆️升级</button>
              <button class="btn btn-sm btn-secondary" onclick="UI.showCharacterDetail('${c.id}')">详情</button>
            </div>
          </div>
        `;
      }
    }
    html += '</div>';

    // 3. 可招募角色列表
    if (slotsMax > 0) {
      html += '<div class="card mt-12"><div class="card-title">🎪 可招募角色</div>';
      let hasAvailable = false;
      for (const [charId, def] of Object.entries(CHARACTERS)) {
        if (s.recruitedCharIds.includes(charId)) continue;
        if (def.unlock && !Game.isUnlocked(def.unlock) && !Game.hasTech(def.unlock)) continue;
        hasAvailable = true;
        const rarityColor = this.getRarityColor(def.rarity);
        const canAfford = s.coins >= def.cost;
        const slotAvailable = slotsUsed < slotsMax;
        html += `
          <div class="machine-item mt-8" style="cursor:default;border-left:3px solid ${rarityColor};">
            <div class="machine-item-header">
              <div class="machine-name">
                <span>${this.getRarityIcon(def.rarity)}</span>
                <span style="color:${rarityColor}">${def.name}</span>
              </div>
              <span class="text-sm" style="color:${rarityColor}">${def.rarity}</span>
            </div>
            <div class="text-sm text-muted mt-4">${def.desc}</div>
            <div class="machine-stats">
              <span>${def.type === 'production' ? '🏭生产型' : '⚔️军事型'}</span>
            </div>
            <button class="btn btn-sm ${canAfford && slotAvailable ? 'btn-primary' : 'btn-secondary'} mt-8" onclick="UI.recruitCharacter('${charId}')" ${canAfford && slotAvailable ? '' : 'disabled'}>
              招募 💰${formatNumber(def.cost)}
            </button>
          </div>
        `;
      }
      if (!hasAvailable) html += '<div class="text-sm text-muted">暂无可招募角色</div>';
      html += '</div>';
    }

    container.innerHTML = html;
  },

  // 获取稀有度图标
  getRarityIcon(rarity) {
    const icons = { R: '🔵', SR: '🟣', SSR: '🟡' };
    return icons[rarity] || '⚪';
  },

  // 获取加成名称
  getBonusName(key) {
    const names = {
      mining: '采矿', smelting: '冶炼', manufacturing: '制造', research: '科研',
      global_production: '全局生产', attack: '舰队攻击', defense: '舰队防御',
      speed: '舰队速度', crit: '暴击率', global_military: '全局军事',
    };
    return names[key] || key;
  },

  // 计算角色加成
  calcCharacterBonuses() {
    const s = Game.state;
    const bonuses = {};
    if (!s.characters) return bonuses;
    const classMul = Game.effects.classMul || 1.0;
    for (const c of s.characters) {
      const def = CHARACTERS[c.charId];
      if (!def) continue;
      const levelMul = 1 + (c.level - 1) * 0.05;
      bonuses[def.skill] = (bonuses[def.skill] || 0) + def.skillVal * levelMul;
      // 职业加成
      if (c.class) {
        const cls = CLASSES[c.class];
        if (cls && cls.bonus) {
          for (const [k, v] of Object.entries(cls.bonus)) {
            bonuses[k] = (bonuses[k] || 0) + v * classMul;
          }
        }
      }
    }
    return bonuses;
  },

  // 招募角色
  recruitCharacter(charId) {
    const s = Game.state;
    const def = CHARACTERS[charId];
    if (!def) return;
    const slotsMax = Game.effects.characterSlots || 3;
    if (s.characters.length >= slotsMax) {
      this.showToast('✗ 角色位已满');
      return;
    }
    if (s.recruitedCharIds && s.recruitedCharIds.includes(charId)) {
      this.showToast('✗ 已招募');
      return;
    }
    if (s.coins < def.cost) {
      this.showToast('✗ 金币不足');
      return;
    }
    s.coins -= def.cost;
    if (!s.recruitedCharIds) s.recruitedCharIds = [];
    s.recruitedCharIds.push(charId);
    s.characters.push({
      id: 'char_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      charId,
      level: 1,
      class: null,
    });
    this.showToast(`✓ 招募${def.name}`);
    this.update();
  },

  // 升级角色
  upgradeCharacter(charId) {
    const s = Game.state;
    const c = s.characters.find(ch => ch.id === charId);
    if (!c) return;
    const def = CHARACTERS[c.charId];
    if (!def) return;
    const cost = Math.floor(def.cost * 0.2 * Math.pow(1.5, c.level));
    if (s.coins < cost) {
      this.showToast('✗ 金币不足');
      return;
    }
    s.coins -= cost;
    c.level++;
    this.showToast(`✓ ${def.name}升到Lv${c.level}`);
    this.update();
  },

  // 角色详情
  showCharacterDetail(charId) {
    const s = Game.state;
    const c = s.characters.find(ch => ch.id === charId);
    if (!c) return;
    const def = CHARACTERS[c.charId];
    if (!def) return;
    const rarityColor = this.getRarityColor(def.rarity);

    let html = `<div class="modal-title" style="color:${rarityColor}">${this.getRarityIcon(def.rarity)} ${def.name}</div>`;
    html += '<div class="modal-body">';
    html += `<div class="mb-8">稀有度: <span style="color:${rarityColor}">${def.rarity}</span></div>`;
    html += `<div class="mb-8">类型: ${def.type === 'production' ? '🏭生产型' : '⚔️军事型'}</div>`;
    html += `<div class="mb-8">等级: Lv${c.level}</div>`;
    html += `<div class="mb-8">技能: ${def.desc} (+${Math.round(def.skillVal * 100 * (1 + (c.level - 1) * 0.05))}%)</div>`;
    html += `<div class="mb-8">职业: ${c.class ? CLASSES[c.class].name : '未转职'}</div>`;
    if (c.class) {
      html += `<div class="text-sm text-muted mb-8">${CLASSES[c.class].desc}</div>`;
    }
    html += '</div>';

    // 升级按钮
    const upCost = Math.floor(def.cost * 0.2 * Math.pow(1.5, c.level));
    html += `<button class="btn btn-block btn-primary mt-8" onclick="UI.upgradeCharacter('${c.id}'); UI.closeModal();">⬆️ 升级 💰${formatNumber(upCost)}</button>`;

    // 转职按钮
    const availableClasses = Object.entries(CLASSES).filter(([cid, cls]) => cls.prereq === c.charId);
    if (availableClasses.length > 0) {
      for (const [classId, cls] of availableClasses) {
        if (c.class === classId) {
          html += `<button class="btn btn-block btn-secondary mt-8" disabled>✓ ${cls.name}</button>`;
        } else {
          html += `<button class="btn btn-block btn-secondary mt-8" onclick="UI.changeClass('${c.id}', '${classId}')">🎓 转职: ${cls.name}</button>`;
          html += `<div class="text-sm text-muted mt-4">${cls.desc}</div>`;
        }
      }
    }

    html += `<button class="btn btn-block btn-secondary mt-8" onclick="UI.closeModal()">关闭</button>`;
    this.showModal(html);
  },

  // 转职
  changeClass(charId, classId) {
    const s = Game.state;
    const c = s.characters.find(ch => ch.id === charId);
    if (!c) return;
    const cls = CLASSES[classId];
    if (!cls) return;
    if (cls.prereq !== c.charId) {
      this.showToast('✗ 不满足转职条件');
      return;
    }
    c.class = classId;
    this.closeModal();
    this.showToast(`✓ 转职为${cls.name}`);
    this.update();
  },

  // 获取稀有度颜色
  getRarityColor(rarity) {
    const colors = { R: '#3B82F6', SR: '#8B5CF6', SSR: '#F5A623' };
    return colors[rarity] || '#94A3B8';
  },

  // ==================== 贸易面板 ====================
  updateTradePage() {
    const container = document.getElementById('page-trade');
    if (!container) return;
    const s = Game.state;
    // 懒初始化
    if (s.tradeRep === undefined) s.tradeRep = 0;
    if (!s.marketPrices) this.refreshMarketPrices();
    if (!s.activeOrders) s.activeOrders = [];

    let html = '';

    // 1. 贸易声望
    html += `
      <div class="card">
        <div class="card-title">💼 贸易中心</div>
        <div class="flex-between mt-8" style="padding:8px;background:var(--bg-card2);border-radius:6px;">
          <span>贸易声望</span>
          <span class="text-yellow text-bold">${s.tradeRep}</span>
        </div>
        <button class="btn btn-sm btn-secondary mt-8" onclick="UI.refreshMarketPrices()">🔄 刷新市场价格</button>
      </div>
    `;

    // 2. 市场价格列表
    html += '<div class="card mt-12"><div class="card-title">📈 市场行情</div>';
    // 确保市场价格已初始化
    if (!s.marketPrices || Object.keys(s.marketPrices).length === 0) {
      Game.updateMarketPrices();
    }
    const hasMarket = s.marketPrices && Object.keys(s.marketPrices).length > 0;
    if (!hasMarket) {
      html += '<div class="text-sm text-muted">点击刷新查看价格</div>';
    } else {
      for (const [resId, price] of Object.entries(s.marketPrices)) {
        const good = TRADE_GOODS[resId];
        const res = RESOURCES[resId];
        if (!good || !res) continue;
        const currentPrice = typeof price === 'number' ? price : (price.current || good.basePrice);
        const change = this.formatPriceChange(currentPrice, good.basePrice);
        const isUp = currentPrice > good.basePrice;
        const has = s.inventory[resId] || 0;
        html += `
          <div class="machine-item mt-8" style="cursor:default;">
            <div class="machine-item-header">
              <div class="machine-name">
                <span class="machine-icon-box" style="background:${res.color || '#475569'}">${res.icon}</span>
                ${res.name}
              </div>
              <span class="text-sm ${isUp ? 'text-green' : 'text-red'}">${change}</span>
            </div>
            <div class="machine-stats">
              <span>当前价: <span class="text-yellow">${formatNumber(currentPrice)}</span></span>
              <span>基础价: ${good.basePrice}</span>
              <span>持有: ${formatNumber(has)}</span>
            </div>
            <div class="flex gap-4 mt-8">
              <button class="btn btn-sm btn-primary" onclick="UI.buyResource('${resId}')">📥买入</button>
              <button class="btn btn-sm btn-secondary" onclick="UI.sellResource('${resId}')">📤卖出</button>
            </div>
          </div>
        `;
      }
    }
    html += '</div>';

    // 4. 贸易订单列表
    html += '<div class="card mt-12"><div class="card-title">📜 贸易订单</div>';
    let hasAvailableOrder = false;
    for (const order of TRADE_ORDERS) {
      if (s.tradeRep < order.repReq) continue;
      const active = s.activeOrders.find(o => o.orderId === order.id);
      if (active) {
        // 进行中的订单
        const remain = Math.max(0, Math.ceil((active.acceptedAt + order.timeLimit * 1000 - Date.now()) / 1000));
        const expired = remain <= 0;
        let canDeliver = true;
        let deliverStr = Object.entries(order.deliver).map(([r, a]) => {
          const has = s.inventory[r] || 0;
          if (has < a) canDeliver = false;
          const res = RESOURCES[r];
          return `${res ? res.icon : '?'}${formatNumber(has)}/${a}`;
        }).join(' ');
        let rewardStr = Object.entries(order.reward).map(([r, a]) => {
          if (r === 'coins') return `💰${formatNumber(a)}`;
          if (r === 'diamonds') return `💎${a}`;
          return `${r}:${a}`;
        }).join(' ');
        html += `
          <div class="machine-item mt-8" style="cursor:default;border-left:3px solid var(--accent-yellow);">
            <div class="machine-item-header">
              <div class="machine-name">${order.name}</div>
              <span class="text-sm ${expired ? 'text-red' : 'text-yellow'}">${expired ? '已过期' : this.formatDuration(remain)}</span>
            </div>
            <div class="text-sm text-muted mt-4">交付: ${deliverStr}</div>
            <div class="text-sm text-yellow mt-4">奖励: ${rewardStr}</div>
            <div class="flex gap-4 mt-8">
              <button class="btn btn-sm ${canDeliver ? 'btn-primary' : 'btn-secondary'}" onclick="UI.completeOrder('${order.id}')" ${canDeliver ? '' : 'disabled'}>📦交付</button>
              <button class="btn btn-sm btn-danger" onclick="UI.cancelOrder('${order.id}')">取消</button>
            </div>
          </div>
        `;
      } else {
        hasAvailableOrder = true;
        let deliverStr = Object.entries(order.deliver).map(([r, a]) => {
          const res = RESOURCES[r];
          return `${res ? res.icon : '?'}${a}`;
        }).join(' ');
        let rewardStr = Object.entries(order.reward).map(([r, a]) => {
          if (r === 'coins') return `💰${formatNumber(a)}`;
          if (r === 'diamonds') return `💎${a}`;
          return `${r}:${a}`;
        }).join(' ');
        html += `
          <div class="machine-item mt-8" style="cursor:default;">
            <div class="machine-item-header">
              <div class="machine-name">${order.name}</div>
              <span class="text-sm text-muted">⏱️${this.formatDuration(order.timeLimit)}</span>
            </div>
            <div class="text-sm text-muted mt-4">交付: ${deliverStr}</div>
            <div class="text-sm text-yellow mt-4">奖励: ${rewardStr}</div>
            <button class="btn btn-sm btn-primary mt-8" onclick="UI.acceptOrder('${order.id}')">✅ 接取</button>
          </div>
        `;
      }
    }
    if (!hasAvailableOrder && s.activeOrders.length === 0) {
      html += '<div class="text-sm text-muted">暂无可用订单（提升声望解锁更多）</div>';
    }
    html += '</div>';

    container.innerHTML = html;
  },

  // 刷新市场价格
  refreshMarketPrices() {
    Game.updateMarketPrices();
    this.update();
  },

  // 买入资源
  buyResource(resId) {
    const s = Game.state;
    const price = Game.getMarketPrice(resId);
    if (!price || price <= 0) {
      this.showToast('✗ 无市场价');
      return;
    }
    const amount = 10; // 每次买10个
    const totalCost = price * amount;
    if (s.coins < totalCost) {
      this.showToast('✗ 金币不足');
      return;
    }
    s.coins -= totalCost;
    s.inventory[resId] = (s.inventory[resId] || 0) + amount;
    this.showToast(`✓ 买入${amount}个 (花费${formatNumber(totalCost)})`);
    this.update();
  },

  // 卖出资源
  sellResource(resId) {
    const s = Game.state;
    const price = Game.getMarketPrice(resId);
    if (!price || price <= 0) {
      this.showToast('✗ 无市场价');
      return;
    }
    const has = s.inventory[resId] || 0;
    if (has < 10) {
      this.showToast('✗ 库存不足10');
      return;
    }
    const amount = 10;
    const revenue = price * amount;
    s.inventory[resId] = has - amount;
    s.coins += revenue;
    s.totalProfit += revenue;
    this.showToast(`✓ 卖出${amount}个 (获得${formatNumber(revenue)})`);
    this.update();
  },

  // 接取订单
  acceptOrder(orderId) {
    const s = Game.state;
    const order = TRADE_ORDERS.find(o => o.id === orderId);
    if (!order) return;
    if (s.tradeRep < order.repReq) {
      this.showToast('✗ 声望不足');
      return;
    }
    if (s.activeOrders && s.activeOrders.find(o => o.orderId === orderId)) {
      this.showToast('✗ 已接取');
      return;
    }
    if (!s.activeOrders) s.activeOrders = [];
    s.activeOrders.push({
      orderId,
      acceptedAt: Date.now(),
      delivered: false,
    });
    this.showToast(`✓ 接取${order.name}`);
    this.update();
  },

  // 完成订单
  completeOrder(orderId) {
    const s = Game.state;
    const order = TRADE_ORDERS.find(o => o.id === orderId);
    if (!order) return;
    const active = s.activeOrders.find(o => o.orderId === orderId);
    if (!active) return;
    // 检查材料
    for (const [resId, amt] of Object.entries(order.deliver)) {
      if ((s.inventory[resId] || 0) < amt) {
        this.showToast('✗ 材料不足');
        return;
      }
    }
    // 扣除材料
    for (const [resId, amt] of Object.entries(order.deliver)) {
      s.inventory[resId] -= amt;
    }
    // 发放奖励
    if (order.reward.coins) s.coins += order.reward.coins;
    if (order.reward.diamonds) s.diamonds += order.reward.diamonds;
    s.tradeRep += 1;
    // 移除订单
    s.activeOrders = s.activeOrders.filter(o => o.orderId !== orderId);
    this.showToast(`✓ 完成${order.name}，声望+1`);
    this.update();
  },

  // 取消订单
  cancelOrder(orderId) {
    Game.state.activeOrders = Game.state.activeOrders.filter(o => o.orderId !== orderId);
    this.showToast('✓ 取消订单');
    this.update();
  },

  // 格式化市场价格变化
  formatPriceChange(current, base) {
    const change = ((current - base) / base * 100).toFixed(1);
    return change > 0 ? `+${change}% (涨)` : `${change}% (跌)`;
  },

  // ==================== 巨构 ====================
  startMegaConstruction(megaId) {
    const s = Game.state;
    const mega = MEGA_STRUCTURES[megaId];
    if (!mega) return;
    if (mega.unlock && !Game.hasTech(mega.unlock)) {
      this.showToast('✗ 未解锁');
      return;
    }
    if (s.megaStructures && s.megaStructures[megaId]) {
      this.showToast('✗ 已建造或建造中');
      return;
    }
    // 检查材料
    for (const [resId, amt] of Object.entries(mega.cost)) {
      if ((s.inventory[resId] || 0) < amt) {
        this.showToast('✗ 材料不足');
        return;
      }
    }
    // 扣除材料
    for (const [resId, amt] of Object.entries(mega.cost)) {
      s.inventory[resId] -= amt;
    }
    if (!s.megaStructures) s.megaStructures = {};
    s.megaStructures[megaId] = {
      startedAt: Date.now(),
      completeAt: Date.now() + mega.time * 1000,
      completed: false,
    };
    this.showToast(`🏗️ 开始建造${mega.name}`);
    this.update();
  },
};
