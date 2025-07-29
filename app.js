import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import permissionRoutes from './routes/permissionRoutes.js';
import chickenRoutes from './routes/chickenRoutes.js';
import farmRoutes from './routes/farmRoutes.js';
import breedingRoutes from './routes/breedingRoutes.js';
import alertRuleRoutes from './routes/alertRuleRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import complianceExportRoutes from './routes/complianceExportRoutes.js';
import feedingRoutes from './routes/feedingRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import taskCalendarRoutes from './routes/taskCalendarRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';


const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/chickens', chickenRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/breeding', breedingRoutes);
app.use('/api/alert-rules', alertRuleRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/compliance-exports', complianceExportRoutes);
app.use('/api/feedings', feedingRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/task-calendar', taskCalendarRoutes);
app.use('/api/webhooks', webhookRoutes);


export default app;