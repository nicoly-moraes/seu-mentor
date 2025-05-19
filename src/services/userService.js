// src/services/userService.js
import apiClient from "./api";

// GET /api/v1/users/{id}: mostra os dados do usuario
export const getUserData = (id) => {
  return apiClient.get(`/users/${id}`);
};

// GET /api/v1/users/{userId}/mentor_availability: mostra todos os horários disponíveis do usuário mentor
export const getMentorAvailability = (userId) => {
  return apiClient.get(`tutoring/mentors/${userId}/availabilities`);
};

// GET /api/v1/users/{id}/participation-sessions: mostra todas as mentorias que o usuário participa
export const getUserParticipationSessions = (id) => {
  return apiClient.get(`/tutoring/${id}/participation-sessions`);
};

// GET /api/v1/users/{id}/mentoring-sessions: mostra todas as mentorias que ele é mentor
export const getUserMentoringSessions = (id) => {
  return apiClient.get(`/tutoring/${id}/mentoring-sessions`);
};

// POST /api/v1/users/{userId}/mentor: marca um horário de disponibilidade para ser mentor
export const addMentorAvailability = (userId, availabilityData) => {
  return apiClient.post(`tutoring/mentors/${userId}/availabilities`, availabilityData);
};

// POST /api/v1/users/{id}/change-password: troca senha do usuario
export const changePassword = (id, passwordData) => {
  return apiClient.post(`/users/${id}/change-password`, passwordData);
};

// PUT /api/v1/users/{id}: atualiza os dados do usuario
export const updateUserData = (id, userData) => {
  return apiClient.put(`/users/${id}`, userData);
};

// PATCH /api/v1/users/{userId}/availabilities/{availabilityId}/status: atualiza o status de uma disponibilidade
export const updateAvailabilityStatus = (
  userId,
  availabilityId,
  statusData
) => {
  return apiClient.patch(
    `tutoring/mentors/${userId}/availabilities/${availabilityId}/status`,
    statusData
  );
};

// PUT Confirma e atualiza os dados da mentoria
export const confirmTutoringSession = (sessionId, confirmationData) => {
  return apiClient.put(`/tutoring/${sessionId}/confirm`, confirmationData);
};

// DELETE /api/v1/users/{userId}/availabilities/{availabilityId}: deleta uma disponibilidade
export const deleteAvailability = (userId, availabilityId) => {
  return apiClient.delete(`tutoring/mentors/${userId}/availabilities/${availabilityId}`);
};

// DELETE /api/v1/tutoring/{tutoringId}/participants/{userId}: remove um participante de uma mentoria
export const leaveTutoringSession = (tutoringId, userId) => {
  return apiClient.delete(`/tutoring/${tutoringId}/participants/${userId}`);
};

// DELETE /api/v1/users/{id}: deleta o usuário.
export const deleteUser = (id) => {
  return apiClient.delete(`/users/${id}`);
};

// DELETE /api/v1/users/{userId}/tutoring/{tutoringId}/cancel-by-mentor: Cancela uma mentoria (pelo mentor)
export const cancelMentorTutoringSession = (
  userId,
  tutoringId,
  deactivateAvailability = false
) => {
  return apiClient.delete(
    `/tutoring/users/${userId}/tutoring/${tutoringId}/cancel-by-mentor`,
    {
      params: {
        deactivateAvailability:deactivateAvailability,
      },
    }
  );
};
