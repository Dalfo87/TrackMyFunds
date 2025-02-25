export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

export function calculateTotal(transactions: number[]): number {
    return transactions.reduce((acc, curr) => acc + curr, 0);
}

export function filterTransactions(transactions: any[], criteria: any): any[] {
    return transactions.filter(transaction => {
        // Implement filtering logic based on criteria
        return true; // Placeholder
    });
}