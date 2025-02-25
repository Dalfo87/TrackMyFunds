import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { Reports } from './components/Reports';
import { login, logout, register } from './services/auth';
import { fetchData, postData } from './services/api';
import { formatDate, calculateTotal } from './utils/helpers';
import { Transaction, User, Report } from './types';

class App {
    private dashboard: Dashboard;
    private transactions: Transactions;
    private reports: Reports;

    constructor() {
        this.dashboard = new Dashboard();
        this.transactions = new Transactions();
        this.reports = new Reports();
    }

    public initialize() {
        this.setupRouting();
        this.dashboard.render();
    }

    private setupRouting() {
        // Setup routing logic here
    }
}

const app = new App();
app.initialize();