export interface AiMentorResponse {
  content: string;
  tokenUsed: number;
}

export interface IAiMentorProvider {
  /**
   * Gửi messages tới AI và nhận response.
   * @param messages - Mảng conversation history (role + content)
   * @param model - Tên model (optional, dùng default nếu không truyền)
   */
  chat(
    messages: Array<{ role: string; content: string }>,
    model?: string,
  ): Promise<AiMentorResponse>;
}
