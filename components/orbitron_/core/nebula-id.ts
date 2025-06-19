import type { Fingerprint, NebulaIdentity } from './types';

const EMOJIS = ['🚀', '🌌', '🛸', '🌍', '🌠', '👨‍🚀', '💫', '☄️', '✨', '🛰️'];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOCAL_KEY = 'Vootaa_NebulaID';

// 添加缓存机制
const fingerprintCache = new Map<string, string>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

function getCachedFingerprint(): string | null {
    const cached = fingerprintCache.get('current');
    if (cached) {
        const [fingerprint, timestamp] = cached.split('|');
        if (Date.now() - parseInt(timestamp) < CACHE_TTL) {
            return fingerprint;
        }
        fingerprintCache.delete('current');
    }
    return null;
}

function setCachedFingerprint(fingerprint: string): void {
    fingerprintCache.set('current', `${fingerprint}|${Date.now()}`);
}

/**
 * 采集轻量 fingerprint 信息
 */
function collectFingerprint(): string {
    const cached = getCachedFingerprint();
    if (cached) return cached;

    try {
        const fingerprint: Fingerprint = {
            ua: navigator.userAgent || 'Vootaa',
            lang: navigator.language || 'en-US',
            plat: navigator.platform || 'unknown',
            tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            res: `${screen.width || 0}x${screen.height || 0}`,
            color: screen.colorDepth || 24,
            createdAt: Date.now(),
        };
        const fp = JSON.stringify(fingerprint);
        setCachedFingerprint(fp);
        return fp;
    } catch (error) {
        console.warn('Failed to collect fingerprint:', error);
        const fp = JSON.stringify({
            fallback: true,
            timestamp: Date.now(),
            random: Math.random().toString(36).substring(2)
        });
        setCachedFingerprint(fp);
        return fp;
    }
}

// 添加debounce防抖
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        return new Promise((resolve) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => resolve(func(...args)), wait);
        });
    };
}

export const debouncedGetNebulaIdentity = debounce(getNebulaIdentity, 300);

/**
 * 使用 WebCrypto API 对字符串做 SHA-256 哈希
 */
async function sha256WebCrypto(input: string): Promise<string> {
    try {
        if (!crypto?.subtle) {
            throw new Error('WebCrypto not supported');
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
        console.warn('WebCrypto failed, using fallback hash:', error);
        // 简单fallback哈希
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return Math.abs(hash).toString(16).padStart(8, '0');
    }
}

/**
 * 安全的localStorage操作
 */
function safeGetFromStorage(key: string): Record<string, NebulaIdentity> {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.warn('Failed to read from localStorage:', error);
        return {};
    }
}

function safeSetToStorage(key: string, data: Record<string, NebulaIdentity>): boolean {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.warn('Failed to write to localStorage:', error);
        return false;
    }
}

/**
 * 将 visitorId hash 转换为 Nebula 可读 ID
 */
function generateNebulaId(visitorId: string, achievement: string = ''): string {
    const seed = parseInt(visitorId.slice(0, 8), 16);
    const emoji = EMOJIS[seed % EMOJIS.length];
    const a = LETTERS[seed % 26];
    const b = LETTERS[(seed >> 5) % 26];
    const c = LETTERS[(seed >> 10) % 26];
    const digits = (seed % 90 + 10).toString().padStart(2, '0');
    return `${emoji} ${a}${b}${c}-${digits} ${achievement}`;
}

/**
 * 获取已缓存身份或异步生成新的
 */
export async function getNebulaIdentity(name: 'default'): Promise<NebulaIdentity> {
    const all = safeGetFromStorage(LOCAL_KEY);

    if (all[name] && isValidIdentity(all[name])) {
        return all[name];
    }

    const identity: NebulaIdentity = await generateNebulaIdentity();
    all[name] = identity;
    safeSetToStorage(LOCAL_KEY, all);

    return identity
}

/**
 * 验证身份数据有效性
 */
function isValidIdentity(identity: any): identity is NebulaIdentity {
    return identity &&
        typeof identity.visitorId === 'string' &&
        typeof identity.nebulaId === 'string' &&
        typeof identity.createdAt === 'number';
}

/**
 * 生成NebulaID，并可作为新名称存储
 */
async function generateNebulaIdentity(): Promise<NebulaIdentity> {
    const fingerprint = collectFingerprint();
    const visitorId = await sha256WebCrypto(fingerprint);
    const nebulaId = generateNebulaId(visitorId);
    return {
        visitorId,
        nebulaId,
        createdAt: Date.now()
    };
}

/**
 * 获取所有 NebulaID
 */
export function getAllNebulaIdentities(): Record<string, { visitorId: string; nebulaId: string }> {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
}

/**
 * 添加成就标识（前端逻辑附加）
 */
export function appendAchievement(nebulaId: string, icon: string): string {
    return nebulaId + icon;
}

/**
 * 删除当前默认 NebulaID
 */
export function resetNebulaIdentity(): void {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
    delete all.default;
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
}