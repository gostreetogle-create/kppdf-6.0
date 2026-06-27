import { requireAuth, requireRole } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { isProd } from '@/lib/env';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    // Seed отключён в production — используйте миграции и admin-панель.
    if (isProd) {
      return apiError('Seed отключён в production', 403);
    }

    // Bootstrap: если в БД нет ни одного admin-user, требуем создать вручную.
    const adminCount = await prisma.user.count({ where: { role: 'admin' } });
    if (adminCount === 0) {
      return apiError('Нет ни одного admin-аккаунта. Создайте его через admin-панель или выполните начальную настройку вручную.', 403);
    }

    await requireAuth();
    await requireRole(['admin']);

    // Users
    const adminPass = await bcrypt.hash('admin123', 10);
    const managerPass = await bcrypt.hash('manager123', 10);

    await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: { username: 'admin', password: adminPass, displayName: 'Администратор', role: 'admin' },
    });
    await prisma.user.upsert({
      where: { username: 'manager' },
      update: {},
      create: { username: 'manager', password: managerPass, displayName: 'Менеджер', role: 'manager' },
    });

    // Counterparty roles
    const roleData = [
      { name: 'Поставщик', slug: 'supplier', description: 'Организация-поставщик товаров' },
      { name: 'Клиент', slug: 'client', description: 'Клиент организации' },
      { name: 'Подрядчик', slug: 'contractor', description: 'Подрядная организация' },
      { name: 'Логист', slug: 'logistician', description: 'Логистическая компания' },
    ];
    for (const r of roleData) {
      await prisma.orgRole.upsert({ where: { slug: r.slug }, update: {}, create: r });
    }

    // Organizations
    const orgData = [
      { name: 'ООО "МеталлПродукт"', shortName: 'МеталлПродукт', inn: '9876543210', phone: '+7 (495) 123-45-67', email: 'info@metallprodukt.ru', bankName: 'Сбербанк', bankBik: '044525225', bankAccount: '40702810100000012345', signerName: 'Иванов И.И.', signerPosition: 'Генеральный директор' },
      { name: 'АО "ХимРеактив"', shortName: 'ХимРеактив', inn: '7701234567', phone: '+7 (495) 987-65-43', email: 'info@chemreactive.ru', bankName: 'ВТБ', bankBik: '044525187', bankAccount: '40702810200000056789', signerName: 'Петров П.П.', signerPosition: 'Директор' },
      { name: 'ООО "СтройМаш"', shortName: 'СтройМаш', inn: '2345678901', phone: '+7 (861) 555-12-34', email: 'office@stroymash.ru', bankName: 'Альфа-Банк', bankBik: '044525102', bankAccount: '40702810300000098765', signerName: 'Сидоров С.С.', signerPosition: 'Коммерческий директор' },
      { name: 'ИП Козлов', shortName: 'Козлов', inn: '345678901234', phone: '+7 (918) 333-22-11', email: 'kozlov@mail.ru' },
    ];
    const orgs = [];
    for (const o of orgData) {
      const org = await prisma.organization.create({ data: o });
      orgs.push(org);
    }

    // Product Categories
    const catData = [
      { name: 'Станки', prefix: 'ST', sortOrder: 1 },
      { name: 'Металлоконструкции', prefix: 'MK', sortOrder: 2 },
      { name: 'Оборудование', prefix: 'OB', sortOrder: 3 },
      { name: 'Запчасти', prefix: 'ZP', sortOrder: 4 },
      { name: 'Расходники', prefix: 'RC', sortOrder: 5 },
    ];
    const cats = [];
    for (const c of catData) {
      const cat = await prisma.productCategory.create({ data: c });
      cats.push(cat);
    }

    // Products
    const prodData = [
      { sku: 'ST0001', name: 'Токарный станок ТВ-6', categoryId: cats[0].id, productType: 'manufactured', basePrice: 450000, unit: 'шт', weightKg: 1200, material: 'Сталь', hasPassport: true },
      { sku: 'ST0002', name: 'Фрезерный станок ФС-12', categoryId: cats[0].id, productType: 'manufactured', basePrice: 680000, unit: 'шт', weightKg: 2000, material: 'Сталь/чугун' },
      { sku: 'MK0001', name: 'Рама сварная Р-200', categoryId: cats[1].id, productType: 'manufactured', basePrice: 35000, unit: 'шт', weightKg: 85, material: 'Сталь 09Г2С' },
      { sku: 'MK0002', name: 'Корпус аппаратный КА-100', categoryId: cats[1].id, productType: 'manufactured', basePrice: 28000, unit: 'шт', weightKg: 45 },
      { sku: 'OB0001', name: 'Привод редукторный ПР-50', categoryId: cats[2].id, productType: 'purchased', basePrice: 78000, unit: 'шт', weightKg: 32 },
      { sku: 'OB0002', name: 'Мотор асинхронный МА-3', categoryId: cats[2].id, productType: 'purchased', basePrice: 42000, unit: 'шт', weightKg: 28 },
      { sku: 'ZP0001', name: 'Подшипник 6205', categoryId: cats[3].id, productType: 'purchased', basePrice: 350, unit: 'шт', weightKg: 0.12 },
      { sku: 'ZP0002', name: 'Ремень клиновой В-1500', categoryId: cats[3].id, productType: 'purchased', basePrice: 450, unit: 'шт' },
      { sku: 'RC0001', name: 'Смазка техническая Ст-200', categoryId: cats[4].id, productType: 'purchased', basePrice: 280, unit: 'кг' },
      { sku: 'RC0002', name: 'Фильтр масляный ФМ-10', categoryId: cats[4].id, productType: 'purchased', basePrice: 1200, unit: 'шт', weightKg: 0.8 },
    ];
    const prods = [];
    for (const p of prodData) {
      const prod = await prisma.product.create({ data: p });
      prods.push(prod);
    }

    // Work Types
    const wtData = [
      { name: 'Токарная обработка', hourlyRate: 1500 },
      { name: 'Фрезерная обработка', hourlyRate: 1800 },
      { name: 'Сварка', hourlyRate: 1200 },
      { name: 'Сборка', hourlyRate: 1000 },
      { name: 'Покраска', hourlyRate: 800 },
      { name: 'Контроль качества', hourlyRate: 1100 },
    ];
    const wts = [];
    for (const w of wtData) {
      const wt = await prisma.workType.create({ data: { ...w, description: w.name } });
      wts.push(wt);
    }

    // Work Centers
    const wcData = [
      { name: 'Токарный цех №1', capacity: 4 },
      { name: 'Фрезерный цех №2', capacity: 3 },
      { name: 'Сварочный участок', capacity: 6 },
      { name: 'Сборочный цех', capacity: 5 },
    ];
    const wcs = [];
    for (const w of wcData) {
      const wc = await prisma.workCenter.create({ data: { ...w, description: w.name } });
      wcs.push(wc);
    }

    // Workers
    const workerData = [
      { firstName: 'Алексей', lastName: 'Борисов', phone: '+7 (918) 100-00-01', role: 'operator' },
      { firstName: 'Дмитрий', lastName: 'Волков', phone: '+7 (918) 100-00-02', role: 'operator' },
      { firstName: 'Сергей', lastName: 'Громов', phone: '+7 (918) 100-00-03', role: 'welder' },
      { firstName: 'Николай', lastName: 'Давыдов', phone: '+7 (918) 100-00-04', role: 'assembler' },
      { firstName: 'Олег', lastName: 'Ермаков', phone: '+7 (918) 100-00-05', role: 'painter' },
    ];
    const workers = [];
    for (const w of workerData) {
      const wr = await prisma.worker.create({ data: w });
      workers.push(wr);
    }

    // Warehouses
    const whData = [
      { name: 'Основной склад', address: 'г. Краснодар, промзона, зд. 3' },
      { name: 'Сырьевой склад', address: 'г. Краснодар, промзона, зд. 5' },
    ];
    const whs = [];
    for (const w of whData) {
      const wh = await prisma.warehouse.create({ data: w });
      whs.push(wh);
    }

    // Proposals
    const prop1 = await prisma.proposal.create({
      data: {
        number: 'КП-2026-001',
        title: 'Поставка токарных станков для ООО "МеталлПродукт"',
        status: 'sent',
        customerId: orgs[0].id,
        organizationId: orgs[1].id,
        markupPercent: 15,
        validUntil: new Date('2026-07-15'),
        items: {
          create: [
            { productId: prods[0].id, quantity: 2, unitPrice: 450000, markupPercent: 15, total: 1035000, sortOrder: 1 },
            { productId: prods[6].id, quantity: 20, unitPrice: 350, markupPercent: 10, total: 7700, sortOrder: 2 },
          ],
        },
      },
    });

    await prisma.proposal.create({
      data: {
        number: 'КП-2026-002',
        title: 'Комплекс поставки оборудования',
        status: 'draft',
        organizationId: orgs[1].id,
        markupPercent: 20,
        validUntil: new Date('2026-08-01'),
        items: {
          create: [
            { productId: prods[1].id, quantity: 1, unitPrice: 680000, markupPercent: 20, total: 816000, sortOrder: 1 },
            { productId: prods[4].id, quantity: 3, unitPrice: 78000, markupPercent: 15, total: 269100, sortOrder: 2 },
          ],
        },
      },
    });

    // Contracts
    await prisma.contract.create({
      data: {
        number: 'ДГ-2026-001',
        title: 'Договор поставки станков',
        status: 'active',
        customerId: orgs[0].id,
        organizationId: orgs[1].id,
        proposalId: prop1.id,
        totalAmount: 1042700,
        signedAt: new Date('2026-06-01'),
        expiresAt: new Date('2026-12-31'),
        items: {
          create: [
            { name: 'Токарный станок ТВ-6', quantity: 2, unit: 'шт', unitPrice: 450000, total: 900000 },
            { name: 'Подшипник 6205', quantity: 20, unit: 'шт', unitPrice: 350, total: 7000 },
          ],
        },
      },
    });

    // Production Orders
    const order1 = await prisma.productionOrder.create({
      data: {
        number: 'ЗНП-2026-001',
        title: 'Изготовление рам Р-200',
        status: 'in_progress',
        workTypeId: wts[2].id,
        workCenterId: wcs[2].id,
        plannedStart: new Date('2026-06-10'),
        plannedEnd: new Date('2026-06-20'),
      },
    });

    await prisma.orderTask.create({
      data: {
        title: 'Нарезка заготовок',
        status: 'completed',
        orderId: order1.id,
        workTypeId: wts[0].id,
        workerId: workers[0].id,
        estimatedHours: 8,
        actualHours: 7,
        sortOrder: 1,
      },
    });

    await prisma.orderTask.create({
      data: {
        title: 'Сварка рамы',
        status: 'in_progress',
        orderId: order1.id,
        workTypeId: wts[2].id,
        workerId: workers[2].id,
        estimatedHours: 16,
        sortOrder: 2,
      },
    });

    await prisma.orderTask.create({
      data: {
        title: 'Покраска',
        status: 'pending',
        orderId: order1.id,
        workTypeId: wts[4].id,
        estimatedHours: 4,
        sortOrder: 3,
      },
    });

    // Storage Items
    for (const p of prods.slice(6)) {
      await prisma.storageItem.create({
        data: {
          warehouseId: whs[0].id,
          productId: p.id,
          quantity: Math.floor(Math.random() * 100) + 10,
          minQuantity: 5,
        },
      });
    }

    // Tenders
    await prisma.tender.create({
      data: {
        number: 'Т-2026-001',
        title: 'Поставка оборудования для завода',
        status: 'submitted',
        customerName: 'АО "АвтоВАЗ"',
        totalAmount: 5000000,
        deadline: new Date('2026-07-01'),
      },
    });

    // Doc Types
    await prisma.docType.create({ data: { name: 'Коммерческое предложение', slug: 'quotation', description: 'Стандартное КП' } });
    await prisma.docType.create({ data: { name: 'Договор', slug: 'contract', description: 'Договор поставки' } });
    await prisma.docType.create({ data: { name: 'Счёт', slug: 'invoice', description: 'Счёт на оплату' } });

    // Feature Flags
    const flags = [
      { key: 'pdfExport', label: 'Экспорт PDF', description: 'Кнопка PDF в предпросмотре', category: 'Документы' },
      { key: 'counterpartyRoles', label: 'Динамические роли контрагентов', description: 'Настраиваемые роли', category: 'Справочники' },
      { key: 'advancedSearch', label: 'Расширенный поиск', description: 'Мультиполевой поиск', category: 'Экспериментальное', enabledByDefault: false },
    ];
    for (const f of flags) {
      await prisma.featureFlag.upsert({ where: { key: f.key }, update: {}, create: f });
    }

    return apiOk(null, 'Данные успешно загружены');
  } catch (error) {
    console.error('Seed error:', error);
    return apiError('Ошибка при загрузке seed-данных', 500);
  }
}
