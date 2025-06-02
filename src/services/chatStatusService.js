import apiClient from './api';

/**
 * Controller para gerenciar o status do chat das mentorias
 */
class ChatStatusController {
  
  /**
   * Habilita ou desabilita o chat para uma mentoria
   * @param {number} tutoringId - ID da mentoria
   * @param {boolean} enable - true para habilitar, false para desabilitar
   * @returns {Promise<Object>} - Dados da mentoria atualizada
   */
  async toggleChatEnabled(tutoringId, enable) {
    try {
      const response = await apiClient.patch(`/tutoring/${tutoringId}/chat/enable`, {
        enable: enable
      });
      return response.data;
    } catch (error) {
      this.handleError(error, 'Erro ao atualizar status do chat');
      throw error;
    }
  }

  /**
   * Define se apenas o mentor pode postar no chat geral
   * @param {number} tutoringId - ID da mentoria
   * @param {boolean} mentorOnly - true para restringir apenas ao mentor, false para liberar
   * @returns {Promise<Object>} - Dados da mentoria atualizada
   */
  async toggleMentorPostingOnly(tutoringId, mentorOnly) {
    try {
      const response = await apiClient.patch(`/tutoring/${tutoringId}/chat/mentor-posting-only`, {
        mentorOnly: mentorOnly
      });
      return response.data;
    } catch (error) {
      this.handleError(error, 'Erro ao atualizar modo de postagem do chat');
      throw error;
    }
  }

  /**
   * Habilita o chat para uma mentoria
   * @param {number} tutoringId - ID da mentoria
   * @returns {Promise<Object>} - Dados da mentoria atualizada
   */
  async enableChat(tutoringId) {
    return this.toggleChatEnabled(tutoringId, true);
  }

  /**
   * Desabilita o chat para uma mentoria
   * @param {number} tutoringId - ID da mentoria
   * @returns {Promise<Object>} - Dados da mentoria atualizada
   */
  async disableChat(tutoringId) {
    return this.toggleChatEnabled(tutoringId, false);
  }

  /**
   * Restringe o chat para postagens apenas do mentor
   * @param {number} tutoringId - ID da mentoria
   * @returns {Promise<Object>} - Dados da mentoria atualizada
   */
  async restrictChatToMentor(tutoringId) {
    return this.toggleMentorPostingOnly(tutoringId, true);
  }

  /**
   * Libera o chat para todos os participantes
   * @param {number} tutoringId - ID da mentoria
   * @returns {Promise<Object>} - Dados da mentoria atualizada
   */
  async allowAllParticipantsToPost(tutoringId) {
    return this.toggleMentorPostingOnly(tutoringId, false);
  }

  /**
   * Manipula erros das requisições
   * @param {Error} error - Erro da requisição
   * @param {string} defaultMessage - Mensagem padrão de erro
   */
  handleError(error, defaultMessage) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          console.error('Erro de validação:', data.message || 'Dados inválidos fornecidos');
          break;
        case 403:
          console.error('Acesso negado:', data.message || 'Você não tem permissão para realizar esta ação');
          break;
        case 404:
          console.error('Mentoria não encontrada:', data.message || 'A mentoria especificada não foi encontrada');
          break;
        case 500:
          console.error('Erro interno do servidor:', data.message || 'Erro interno do servidor');
          break;
        default:
          console.error('Erro desconhecido:', data.message || defaultMessage);
      }
    } else if (error.request) {
      console.error('Erro de conexão:', 'Não foi possível conectar ao servidor');
    } else {
      console.error('Erro:', error.message || defaultMessage);
    }
  }

  /**
   * Obtém mensagem de erro formatada para exibição ao usuário
   * @param {Error} error - Erro da requisição
   * @returns {string} - Mensagem de erro formatada
   */
  getErrorMessage(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return data.message || 'Dados inválidos fornecidos';
        case 403:
          return 'Você não tem permissão para realizar esta ação';
        case 404:
          return 'Mentoria não encontrada';
        case 500:
          return 'Erro interno do servidor. Tente novamente mais tarde';
        default:
          return data.message || 'Erro desconhecido';
      }
    } else if (error.request) {
      return 'Não foi possível conectar ao servidor';
    } else {
      return error.message || 'Erro desconhecido';
    }
  }
}

// Exporta uma instância singleton do controller
const chatStatusController = new ChatStatusController();
export default chatStatusController;