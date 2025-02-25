import { formatDate, calculateTotal } from '../../src/utils/helpers';

describe('Helpers Utility Functions', () => {
    describe('formatDate', () => {
        it('should format the date correctly', () => {
            const date = new Date('2023-01-01');
            expect(formatDate(date)).toBe('January 1, 2023');
        });
    });

    describe('calculateTotal', () => {
        it('should return the correct total for an array of numbers', () => {
            const numbers = [10, 20, 30];
            expect(calculateTotal(numbers)).toBe(60);
        });

        it('should return 0 for an empty array', () => {
            const numbers: number[] = [];
            expect(calculateTotal(numbers)).toBe(0);
        });
    });
});