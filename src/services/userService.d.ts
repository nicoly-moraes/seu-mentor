import { AxiosPromise } from 'axios';

export const getUserData: (id: string | number) => AxiosPromise<any>;
export const getMentorAvailability: (userId: string | number) => AxiosPromise<any>;
export const getUserParticipationSessions: (id: string | number) => AxiosPromise<any>;
export const getUserMentoringSessions: (id: string | number) => AxiosPromise<any>;
export const addMentorAvailability: (userId: string | number, availabilityData: any) => AxiosPromise<any>;
export const changePassword: (id: string | number, passwordData: any) => AxiosPromise<any>;
export const updateUserData: (id: string | number, userData: any) => AxiosPromise<any>;
export const updateAvailabilityStatus: (
  userId: string | number,
  availabilityId: string | number,
  statusData: any
) => AxiosPromise<any>;
export const confirmTutoringSession: (sessionId: string | number, confirmationData: any) => AxiosPromise<any>;
export const deleteAvailability: (userId: string | number, availabilityId: string | number) => AxiosPromise<any>;
export const leaveTutoringSession: (tutoringId: string | number, userId: string | number) => AxiosPromise<any>;
export const deleteUser: (id: string | number) => AxiosPromise<any>;
export const cancelMentorTutoringSession: (
  userId: string | number,
  tutoringId: string | number,
  deactivateAvailability?: boolean
) => AxiosPromise<any>;
