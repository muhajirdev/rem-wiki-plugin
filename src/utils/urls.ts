import { BASE_URL } from '../constants';

export const getPublicSiteByUsername = (username: string) => {
  return `${BASE_URL}/${username}`;
};
