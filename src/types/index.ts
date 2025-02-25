export interface Transaction {
    id: string;
    amount: number;
    date: Date;
    description: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
}

export interface Report {
    title: string;
    generatedDate: Date;
    transactions: Transaction[];
}