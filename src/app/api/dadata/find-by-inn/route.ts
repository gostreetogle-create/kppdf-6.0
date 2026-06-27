import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';

const DADATA_API_KEY = process.env.DADATA_API_KEY;
const DADATA_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party';

// POST /api/dadata/find-by-inn — поиск организации по ИНН через DaData.
// P2.3: платный API proxy → requireRole(['admin', 'manager']) (CRM-операция DaData lookup для заполнения карточки контрагента; viewer/production/storekeeper/accountant не должны иметь прямой доступ к API key).
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'manager']);

    if (!DADATA_API_KEY) {
      return apiError('DaData API key not configured (DADATA_API_KEY)', 500);
    }

    const { inn } = await request.json();

    if (!inn || typeof inn !== 'string' || inn.trim().length === 0) {
      return apiError('ИНН обязателен', 400);
    }

    // Валидация: ИНН — 10 цифр (юрлицо) или 12 цифр (ИП)
    const cleanInn = inn.trim();
    if (!/^\d{10,12}$/.test(cleanInn)) {
      return apiError('ИНН должен содержать 10 или 12 цифр', 400);
    }

    const response = await fetch(DADATA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${DADATA_API_KEY}`,
      },
      body: JSON.stringify({ query: cleanInn }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('DaData API error:', response.status, text);
      return apiError('Ошибка при запросе к DaData', 502);
    }

    const data = await response.json();

    if (!data.suggestions || data.suggestions.length === 0) {
      return apiError('Организация с таким ИНН не найдена', 404);
    }

    const party = data.suggestions[0]?.data;
    if (!party) return apiError('Некорректный ответ DaData', 502);

    // Маппинг полей DaData → Organization
    const result = {
      name: party.name?.full_with_opf || party.name?.short_with_opf || '',
      shortName: party.name?.short_with_opf || party.name?.short || '',
      inn: party.inn || cleanInn,
      kpp: party.kpp || '',
      ogrn: party.ogrn || '',
      legalForm: party.type === 'INDIVIDUAL' ? 'ИП' : (party.name?.short_with_opf || '').split(' ')[0] || '',
      legalAddress: party.address?.value || '',
      signerName: party.management?.name || '',
      signerPosition: party.management?.post || '',
    };

    return apiOk(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    console.error('DaData proxy error:', error);
    return apiError(String(error), 500);
  }
}
