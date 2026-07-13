import { describe, it, expect } from '@jest/globals';
import {
    computeLevelFromXp,
    getXpProgress,
    xpThresholdForLevel,
} from './gamification.service';

describe('gamification XP/level pure functions', () => {
    describe('computeLevelFromXp', () => {
        it('trả về level 1 cho xp <= 0', () => {
            expect(computeLevelFromXp(0)).toBe(1);
            expect(computeLevelFromXp(-50)).toBe(1);
        });

        it('tăng level đúng tại các mốc XP đã biết', () => {
            expect(computeLevelFromXp(99)).toBe(1);
            expect(computeLevelFromXp(100)).toBe(2);
            expect(computeLevelFromXp(282)).toBe(2);
            expect(computeLevelFromXp(283)).toBe(3);
            expect(computeLevelFromXp(519)).toBe(3);
            expect(computeLevelFromXp(520)).toBe(4);
        });
    });

    describe('xpThresholdForLevel', () => {
        it('level 1 (và thấp hơn) luôn là mốc 0', () => {
            expect(xpThresholdForLevel(1)).toBe(0);
            expect(xpThresholdForLevel(0)).toBe(0);
        });

        it('khớp với các mốc chuyển level quan sát được từ computeLevelFromXp', () => {
            expect(xpThresholdForLevel(2)).toBe(100);
            expect(xpThresholdForLevel(3)).toBe(283);
            expect(xpThresholdForLevel(4)).toBe(520);
        });
    });

    describe('getXpProgress', () => {
        it('user mới (0 xp) ở level 1, 0% tiến độ, cần 100 xp để lên level 2', () => {
            const p = getXpProgress(0);
            expect(p.level).toBe(1);
            expect(p.currentLevelFloor).toBe(0);
            expect(p.nextLevelFloor).toBe(100);
            expect(p.xpIntoLevel).toBe(0);
            expect(p.xpToNextLevel).toBe(100);
            expect(p.progressPercent).toBe(0);
        });

        it('vừa đạt ngưỡng lên level mới thì progressPercent luôn là 0%', () => {
            for (let lvl = 2; lvl <= 10; lvl++) {
                const threshold = xpThresholdForLevel(lvl);
                const p = getXpProgress(threshold);
                expect(p.level).toBe(lvl);
                expect(p.xpIntoLevel).toBe(0);
                expect(p.progressPercent).toBe(0);
            }
        });

        it('còn 1 xp nữa là lên level thì progressPercent gần 100%', () => {
            const nextFloor = xpThresholdForLevel(3); // 283
            const p = getXpProgress(nextFloor - 1); // 282
            expect(p.level).toBe(2);
            expect(p.xpToNextLevel).toBe(1);
            expect(p.progressPercent).toBeGreaterThan(99);
            expect(p.progressPercent).toBeLessThan(100);
        });

        it('level luôn khớp 1:1 với computeLevelFromXp trên toàn dải giá trị', () => {
            for (let xp = 0; xp <= 20000; xp += 37) {
                const p = getXpProgress(xp);
                expect(p.level).toBe(computeLevelFromXp(xp));
                // xp phải nằm đúng trong khoảng [currentLevelFloor, nextLevelFloor)
                expect(xp).toBeGreaterThanOrEqual(p.currentLevelFloor);
                expect(xp).toBeLessThan(p.nextLevelFloor);
            }
        });

        it('progressPercent luôn nằm trong [0, 100] và xpIntoLevel không âm', () => {
            for (let xp = 0; xp <= 20000; xp += 53) {
                const p = getXpProgress(xp);
                expect(p.progressPercent).toBeGreaterThanOrEqual(0);
                expect(p.progressPercent).toBeLessThanOrEqual(100);
                expect(p.xpIntoLevel).toBeGreaterThanOrEqual(0);
                expect(p.xpToNextLevel).toBeGreaterThanOrEqual(0);
            }
        });

        it('xp âm được xử lý an toàn như xp = 0', () => {
            const p = getXpProgress(-100);
            expect(p.xp).toBe(0);
            expect(p.level).toBe(1);
            expect(p.progressPercent).toBe(0);
        });
    });
});