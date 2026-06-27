/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const queuePath = path.join(__dirname, '..', 'agent-queue.json');
const queue = JSON.parse(fs.readFileSync(queuePath, 'utf-8'));

const newTasks = [
  {
    id: 'error-boundaries',
    title: 'Глобальный ErrorBoundary + кастомный fallback UI',
    assignee: 'mimo',
    status: 'pending',
    priority: 1,
    depends_on: [],
    description: 'Создать ErrorBoundary React-компонент, обернуть dashboard layout, кастомный fallback с кнопкой "Попробовать снова" и иконкой'
  },
  {
    id: 'dashboard-charts',
    title: 'Дашборд — графики и аналитика (recharts)',
    assignee: 'mimo',
    status: 'pending',
    priority: 1,
    depends_on: [],
    description: 'Установить recharts. Добавить на дашборд: график доходов за месяц, круговую диаграмму статусов заказов, активность по неделям, топ-5 товаров. Данные через API эндпоинты.'
  },
  {
    id: 'login-redesign',
    title: 'Редизайн страницы логина — премиум уровень',
    assignee: 'mimo',
    status: 'pending',
    priority: 1,
    depends_on: [],
    description: 'Анимированный градиентный фон, логотип с glow эффектом, плавные переходы состояний, секция KeyFeatures под формой (3 карточки: безопасность, скорость, аналитика)'
  },
  {
    id: 'page-transitions',
    title: 'Анимация переходов между страницами',
    assignee: 'mimo',
    status: 'pending',
    priority: 2,
    depends_on: [],
    description: 'Добавить animate-fadeIn на все page.tsx. Создать PageTransition компонент-обёртку. Единый стиль появления контента.'
  },
  {
    id: 'empty-states',
    title: 'Кастомные empty states для всех списков',
    assignee: 'mimo',
    status: 'pending',
    priority: 2,
    depends_on: [],
    description: 'Для каждой страницы списка: большая иконка, описание, кнопка действия (Создать первый...). Убрать стандартное "Ничего не найдено".'
  },
  {
    id: 'form-select-fix',
    title: 'Заменить ID inputs на выпадающие списки в формах',
    assignee: 'mimo',
    status: 'pending',
    priority: 2,
    depends_on: [],
    description: 'ProposalForm: clientId, organizationId на <select> с данными из API. ProductionOrderForm: workTypeId, workCenterId на <select>.'
  },
  {
    id: 'finance-pages',
    title: 'Финансовые страницы — OrderClosing, ReconciliationAct, FinancialReport',
    assignee: 'buffy',
    status: 'in_progress',
    priority: 1,
    depends_on: [],
    description: 'Создать страницы: /finance/order-closings, /finance/reconciliation, /finance/reports с CrudPage таблицами и базовыми формами.'
  },
  {
    id: 'theme-toggle',
    title: 'Переключатель тёмной/светлой темы в топбаре',
    assignee: 'mimo',
    status: 'pending',
    priority: 2,
    depends_on: [],
    description: 'Добавить кнопку Sun/Moon в топбар. Использовать useThemeStore. Плавный transition на body.'
  }
];

let addedCount = 0;
newTasks.forEach(t => {
  const exists = queue.tasks.find(x => x.id === t.id);
  if (!exists) {
    queue.tasks.push(t);
    addedCount++;
  }
});

// Update Buffy's current task
const financeTask = queue.tasks.find(t => t.id === 'finance-module');
if (financeTask) {
  financeTask.status = 'in_progress';
}

fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2), 'utf-8');
console.log(`✅ Добавлено задач: ${addedCount}`);
console.log(`📊 Всего задач в очереди: ${queue.tasks.length}`);
