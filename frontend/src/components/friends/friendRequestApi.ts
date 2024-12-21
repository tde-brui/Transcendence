import axiosInstance from '../utils/AxiosInstance';

export const sendFriendRequest = async (userId: number) => {
  return await axiosInstance.post(`/send_friend_request/${userId}/`);
};

export const cancelFriendRequest = async (requestId: number) => {
  return await axiosInstance.post(`/cancel_friend_request/${requestId}/`);
};

export const acceptFriendRequest = async (requestId: number) => {
  return await axiosInstance.post(`/accept_friend_request/${requestId}/`);
};

export const declineFriendRequest = async (requestId: number) => {
  return await axiosInstance.post(`/decline_friend_request/${requestId}/`);
};

export const removeFriend = async (userId: number) => {
  return await axiosInstance.post(`/remove_friend/${userId}/`);
};

export const getFriendRequests = async () => {
  return await axiosInstance.get(`/friend_requests/`);
};
