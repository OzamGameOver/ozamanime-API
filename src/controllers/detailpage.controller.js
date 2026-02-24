import { extractDetailpage } from '../extractor/extractDetailpage';
import { axiosInstance } from '../services/axiosInstance';
import { validationError } from '../utils/errors';
import blacklist from '../blacklist/blacklist.json' assert { type: 'json' };
import { Redis } from '@upstash/redis';

const detailpageController = async (c) => {
  // 1️⃣ Get raw ID from request
  const rawId = c.req.param('id'); // e.g., "overflow-uncensored-17884"
  if (!rawId) throw new validationError('id is required');

  // 2️⃣ Extract numeric anime ID
  const animeId = Number(rawId.split('-').pop());

  // 3️⃣ BLACKLIST CHECK
  if (blacklist.ids.includes(animeId)) {
    throw new validationError('This anime is blocked.', 'blacklist');
  }

  // 4️⃣ Check Redis cache if available
  const isRedisEnv = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );

  if (isRedisEnv) {
    const redis = Redis.fromEnv();
    const cachedDetail = await redis.get(rawId);

    if (cachedDetail) {
      return cachedDetail;
    }

    const result = await axiosInstance(`/${rawId}`);
    if (!result.success) {
      throw new validationError(result.message, 'maybe id is incorrect : ' + rawId);
    }

    const response = extractDetailpage(result.data);
    await redis.set(rawId, JSON.stringify(response), { ex: 60 * 60 * 24 });
    return response;
  } else {
    const result = await axiosInstance(`/${rawId}`);
    if (!result.success) {
      throw new validationError(result.message, 'maybe id is incorrect : ' + rawId);
    }
    return extractDetailpage(result.data);
  }
};

export default detailpageController;
