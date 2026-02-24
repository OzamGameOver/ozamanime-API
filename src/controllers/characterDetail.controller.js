import { extractCharacterDetail } from '../extractor/extractCharacterDetail';
import { axiosInstance } from '../services/axiosInstance';
import { NotFoundError, validationError } from '../utils/errors';
import blacklist from '../blacklist/blacklist.json' assert { type: 'json' };

const characterDetailConroller = async (c) => {
  const id = c.req.param('id');
    // 🔥 BLACKLIST CHECK
  if (blacklist.ids.includes(Number(id))) {
    throw new validationError('This anime is blocked.', 'blacklist');
  }

  if (!id) throw new validationError('id is required');

  const result = await axiosInstance(`/${id.replace(':', '/')}`);
  if (!result.success) {
    throw new validationError('make sure given endpoint is correct');
  }

  const response = extractCharacterDetail(result.data);

  if (response.length < 1) throw new NotFoundError();
  return response;
};

export default characterDetailConroller;
