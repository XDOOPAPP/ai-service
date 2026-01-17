import { Injectable } from '@nestjs/common';
import { CategoryResult } from '../interfaces/ai-results.interface';

@Injectable()
export class CategorizationEngine {
    private categoryKeywords = {
        food: [
            'cơm',
            'phở',
            'bún',
            'restaurant',
            'cafe',
            'coffee',
            'ăn',
            'uống',
            'food',
            'lunch',
            'dinner',
            'breakfast',
            'trà',
            'tea',
            'bánh',
            'mì',
            'noodle',
            'pizza',
            'burger',
            'fastfood',
            'quán',
            'nhà hàng',
        ],
        transport: [
            'grab',
            'xe',
            'taxi',
            'bus',
            'xăng',
            'gas',
            'parking',
            'vé',
            'ticket',
            'gojek',
            'be',
            'uber',
            'xe ôm',
            'xe buýt',
            'tàu',
            'train',
            'máy bay',
            'flight',
            'vietjet',
            'vietnam airlines',
        ],
        shopping: [
            'mua',
            'shop',
            'mall',
            'siêu thị',
            'market',
            'store',
            'quần áo',
            'clothes',
            'giày',
            'shoes',
            'vinmart',
            'coopmart',
            'lotte',
            'aeon',
            'shopee',
            'lazada',
            'tiki',
            'sendo',
        ],
        entertainment: [
            'phim',
            'movie',
            'game',
            'concert',
            'bar',
            'club',
            'vui chơi',
            'giải trí',
            'cinema',
            'cgv',
            'lotte cinema',
            'galaxy',
            'karaoke',
            'spa',
            'massage',
        ],
        health: [
            'bệnh viện',
            'hospital',
            'thuốc',
            'medicine',
            'doctor',
            'khám',
            'phòng khám',
            'clinic',
            'dược',
            'pharmacy',
            'y tế',
            'medical',
            'nha khoa',
            'dental',
        ],
        education: [
            'học',
            'school',
            'course',
            'book',
            'sách',
            'tuition',
            'học phí',
            'trường',
            'đại học',
            'university',
            'khóa học',
            'training',
            'giáo dục',
        ],
        utilities: [
            'điện',
            'nước',
            'internet',
            'phone',
            'electric',
            'water',
            'bill',
            'hóa đơn',
            'evn',
            'vnpt',
            'viettel',
            'fpt',
            'mobifone',
            'vinaphone',
        ],
        other: [],
    };

    categorize(description: string, amount: number): CategoryResult {
        const normalizedDesc = this.normalizeText(description);
        const scores: { [key: string]: number } = {};

        // Calculate scores for each category
        for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
            if (category === 'other') continue;

            let score = 0;
            for (const keyword of keywords) {
                const normalizedKeyword = this.normalizeText(keyword);
                if (normalizedDesc.includes(normalizedKeyword)) {
                    score += 1;
                }
            }
            scores[category] = score;
        }

        // Sort categories by score
        const sortedCategories = Object.entries(scores)
            .filter(([_, score]) => score > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([category, score]) => ({
                category,
                confidence: Math.min(score * 0.3, 0.95), // Max 95% confidence
            }));

        // Default to 'other' if no match
        if (sortedCategories.length === 0) {
            return {
                category: 'other',
                confidence: 0.5,
                suggestedCategories: [
                    { category: 'other', confidence: 0.5 },
                    { category: 'shopping', confidence: 0.3 },
                    { category: 'food', confidence: 0.2 },
                ],
            };
        }

        return {
            category: sortedCategories[0].category,
            confidence: sortedCategories[0].confidence,
            suggestedCategories: sortedCategories.slice(0, 3),
        };
    }

    private normalizeText(text: string): string {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/đ/g, 'd')
            .trim();
    }
}
