import { extractDetailpage } from '../extractor/extractDetailpage';
import { axiosInstance } from '../services/axiosInstance';
import { validationError } from '../utils/errors';
import blacklist from '../blacklist/blacklist.json' assert { type: 'json' };

import { Redis } from '@upstash/redis';

const detailpageController = async (c) => {
  const id = c.req.param('id');
  
   // 🔥 BLACKLIST CHECK
  if (blacklist.ids.includes(Number(id))) {
    throw new validationError('This anime is blocked.', 'blacklist');
  }

  const isRedisEnv = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
  if (isRedisEnv) {
    const redis = Redis.fromEnv();
    const detail = await redis.get(id);

    if (detail) {
      return detail;
    }

    const result = await axiosInstance(`/${id}`);
    if (!result.success) {
      throw new validationError(result.message, 'maybe id is incorrect : ' + id);
    }
    const response = extractDetailpage(result.data);
    await redis.set(id, JSON.stringify(response), {
      ex: 60 * 60 * 24,
    });
    return response;
  } else {
    const result = await axiosInstance(`/${id}`);
    if (!result.success) {
      throw new validationError(result.message, 'maybe id is incorrect : ' + id);
    }
    const response = extractDetailpage(result.data);
    return response;
  }
};

export default detailpageController;
