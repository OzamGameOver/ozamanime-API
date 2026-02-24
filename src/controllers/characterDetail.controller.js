import { extractCharacterDetail } from '../extractor/extractCharacterDetail';
import { axiosInstance } from '../services/axiosInstance';
import { NotFoundError, validationError } from '../utils/errors';
import blacklist from '../blacklist/blacklist.json' assert { type: 'json' };

const characterDetailController = async (c) => {
  // 1️⃣ Get raw ID from request
  const rawId = c.req.param('id'); // e.g., "overflow-uncensored-17884"
  if (!rawId) throw new validationError('id is required');

  // 2️⃣ Extract numeric anime ID
  const animeId = Number(rawId.split('-').pop()); // "17884" -> 17884

  // 3️⃣ BLACKLIST CHECK
  if (blacklist.ids.includes(animeId)) {
    throw new validationError('This anime is blocked.', 'blacklist');
  }

  // 4️⃣ Fetch anime data
  const result = await axiosInstance(`/${rawId.replace(':', '/')}`);
  if (!result.success) {
    throw new validationError('Make sure given endpoint is correct');
  }

  // 5️⃣ Extract character details
  const response = extractCharacterDetail(result.data);
  if (response.length < 1) throw new NotFoundError();

  return response;
};

export default characterDetailController;
