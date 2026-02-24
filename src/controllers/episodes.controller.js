import axios from 'axios';
import { validationError } from '../utils/errors';
import config from '../config/config';
import { extractEpisodes } from '../extractor/extractEpisodes';
import blacklist from '../blacklist/blacklist.json' assert { type: 'json' };

const episodesController = async (c) => {
  // 1️⃣ Get raw ID from request
  const rawId = c.req.param('id'); // e.g., "overflow-uncensored-17884"
  if (!rawId) throw new validationError('id is required');

  // 2️⃣ Extract numeric anime ID
  const animeId = Number(rawId.split('-').pop()); // "17884" -> 17884

  // 3️⃣ BLACKLIST CHECK
  if (blacklist.ids.includes(animeId)) {
    throw new validationError('This anime is blocked.', 'blacklist');
  }

  // 4️⃣ Prepare AJAX request
  const Referer = `/watch/${rawId}`;
  const ajaxUrl = `/ajax/v2/episode/list/${animeId}`;

  try {
    const { data } = await axios.get(config.baseurl + ajaxUrl, {
      headers: {
        Referer: Referer,
        ...config.headers,
      },
    });

    const response = extractEpisodes(data.html);
    return response;
  } catch (err) {
    console.log(err.message);
    throw new validationError('Make sure the id is correct', { validIdEX: 'one-piece-100' });
  }
};

export default episodesController;
