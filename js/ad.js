/**
 * 放置工厂大亨 - 广告抽象层
 * 纯激励视频广告，支持TapTap JSBridge + Web测试回退
 */

const AdManager = {
  platform: 'web', // 'taptap' | 'web'
  cooldowns: {},    // 广告位冷却时间戳
  adUnitIds: {},    // TapADN广告位ID（上线时配置）

  init() {
    // 检测运行环境
    if (typeof window !== 'undefined') {
      if (window.TapTapSDK && window.TapTapSDK.showAd) {
        this.platform = 'taptap';
      } else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.TapTapAd) {
        this.platform = 'taptap';
      } else {
        this.platform = 'web';
      }
    }
    // 从存档恢复冷却
    this.loadCooldowns();
  },

  // 检查是否在冷却中
  isOnCooldown(slotId) {
    const slot = AD_SLOTS[slotId];
    if (!slot || slot.cooldown === 0) return false;
    const lastUsed = this.cooldowns[slotId] || 0;
    return Date.now() < lastUsed + slot.cooldown * 1000;
  },

  // 获取冷却剩余秒数
  getCooldownRemaining(slotId) {
    const slot = AD_SLOTS[slotId];
    if (!slot || slot.cooldown === 0) return 0;
    const lastUsed = this.cooldowns[slotId] || 0;
    const remaining = Math.ceil((lastUsed + slot.cooldown * 1000 - Date.now()) / 1000);
    return Math.max(0, remaining);
  },

  // 设置冷却
  setCooldown(slotId) {
    const slot = AD_SLOTS[slotId];
    if (slot && slot.cooldown > 0) {
      this.cooldowns[slotId] = Date.now();
      this.saveCooldowns();
    }
  },

  // 格式化冷却时间
  formatCooldown(slotId) {
    const remaining = this.getCooldownRemaining(slotId);
    if (remaining <= 0) return null;
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    if (h > 0) return `${h}h${m}m`;
    if (m > 0) return `${m}m${s}s`;
    return `${s}s`;
  },

  // 核心方法：展示激励视频广告
  showRewardedAd(slotId) {
    return new Promise((resolve, reject) => {
      // 检查冷却
      if (this.isOnCooldown(slotId)) {
        reject({
          reason: 'cooldown',
          remaining: this.getCooldownRemaining(slotId),
          message: `冷却中: ${this.formatCooldown(slotId)}`,
        });
        return;
      }

      const slot = AD_SLOTS[slotId];
      if (!slot) {
        reject({ reason: 'invalid_slot', message: '无效的广告位' });
        return;
      }

      if (this.platform === 'taptap') {
        this._showTaptapAd(slotId, resolve, reject);
      } else {
        this._showWebAd(slotId, resolve, reject);
      }
    });
  },

  // TapTap环境：通过JSBridge调用原生激励视频
  _showTaptapAd(slotId, resolve, reject) {
    const adUnitId = this.adUnitIds[slotId] || 'default_rewarded_video';

    try {
      // Android WebView
      if (window.TapTapSDK && window.TapTapSDK.showAd) {
        window.TapTapSDK.showAd(
          JSON.stringify({
            type: 'rewarded_video',
            adUnitId: adUnitId,
            slotId: slotId,
          }),
          (result) => {
            // 成功回调
            if (result && result.watched) {
              this.setCooldown(slotId);
              resolve({ watched: true, reward: result.reward });
            } else {
              resolve({ watched: false });
            }
          },
          (error) => {
            // 失败回调
            reject({ reason: 'error', message: error });
          }
        );
      }
      // iOS WKWebView
      else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.TapTapAd) {
        // iOS通过messageHandlers调用，需要监听回调
        window.__taptapAdCallback = (result) => {
          if (result.watched) {
            this.setCooldown(slotId);
            resolve({ watched: true, reward: result.reward });
          } else {
            resolve({ watched: false });
          }
        };
        window.__taptapAdError = (error) => {
          reject({ reason: 'error', message: error });
        };
        window.webkit.messageHandlers.TapTapAd.postMessage({
          type: 'rewarded_video',
          adUnitId: adUnitId,
          slotId: slotId,
        });
      }
    } catch (e) {
      reject({ reason: 'error', message: String(e) });
    }
  },

  // Web测试环境：模拟广告
  _showWebAd(slotId, resolve, reject) {
    // 显示模拟广告弹窗
    this._showWebAdModal(() => {
      this.setCooldown(slotId);
      resolve({ watched: true });
    }, () => {
      resolve({ watched: false });
    });
  },

  // Web模拟广告弹窗
  _showWebAdModal(onSuccess, onClose) {
    const overlay = document.createElement('div');
    overlay.className = 'ad-modal-overlay';
    overlay.innerHTML = `
      <div class="ad-modal">
        <div class="ad-modal-header">📺 模拟激励视频广告</div>
        <div class="ad-modal-body">
          <p>正在播放广告...</p>
          <div class="ad-progress-bar"><div class="ad-progress-fill"></div></div>
          <p class="ad-timer">3</p>
        </div>
        <div class="ad-modal-footer">
          <button class="btn-secondary ad-skip-btn" disabled>跳过</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    let countdown = 3;
    const timerEl = overlay.querySelector('.ad-timer');
    const fillEl = overlay.querySelector('.ad-progress-fill');
    const skipBtn = overlay.querySelector('.ad-skip-btn');

    const timer = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        timerEl.textContent = countdown;
        fillEl.style.width = `${(3 - countdown) / 3 * 100}%`;
      } else {
        clearInterval(timer);
        fillEl.style.width = '100%';
        timerEl.textContent = '✓';
        skipBtn.disabled = false;
        skipBtn.textContent = '领取奖励';
        skipBtn.className = 'btn-primary ad-skip-btn';
        skipBtn.onclick = () => {
          document.body.removeChild(overlay);
          onSuccess();
        };
      }
    }, 1000);

    // 允许直接关闭（视为未看完）
    overlay.onclick = (e) => {
      if (e.target === overlay && countdown <= 0) {
        document.body.removeChild(overlay);
        onClose();
      }
    };
  },

  // 冷却数据持久化
  saveCooldowns() {
    try {
      localStorage.setItem('idle_factory_ad_cooldowns', JSON.stringify(this.cooldowns));
    } catch (e) {}
  },

  loadCooldowns() {
    try {
      const data = localStorage.getItem('idle_factory_ad_cooldowns');
      if (data) this.cooldowns = JSON.parse(data);
    } catch (e) {
      this.cooldowns = {};
    }
  },

  // 每日重置检查（免费模块等每日广告位）
  checkDailyReset() {
    const today = new Date().toDateString();
    const lastDay = localStorage.getItem('idle_factory_ad_last_day');
    if (lastDay !== today) {
      // 重置每日广告位冷却
      this.cooldowns.free_module = 0;
      localStorage.setItem('idle_factory_ad_last_day', today);
      this.saveCooldowns();
    }
  },
};
