import { Injectable } from '@nestjs/common';
import { AIMentorStyle, AIMentorTone } from '../../common/enums';

export interface PromptContext {
  style: AIMentorStyle;
  tone: AIMentorTone;
  contextSummary?: string;
}

@Injectable()
export class PromptStrategyService {
  /**
   * Build system prompt cho AI Mentor dựa trên style + tone + context.
   * System prompt này sẽ là message đầu tiên gửi tới AI mỗi lượt chat.
   */
  buildSystemPrompt(context: PromptContext): string {
    const parts: string[] = [];

    // 1. Base role
    parts.push(
      'You are an AI coding mentor on a personalized learning platform. ' +
        'Your goal is to help students understand concepts and solve problems on their own.',
    );

    // 2. Style-specific instructions
    parts.push(this.getStyleInstruction(context.style));

    // 3. Tone instruction
    parts.push(this.getToneInstruction(context.tone));

    // 4. Universal rules
    parts.push(
      'RULES:\n' +
        '- Respond in the same language the student uses.\n' +
        '- Keep responses concise (under 200 words unless the student asks for more detail).\n' +
        '- If the student is completely stuck after 3+ attempts, you may provide slightly more guidance.\n' +
        '- Never give the full solution outright unless style is DIRECT.',
    );

    // 5. Context (nếu có)
    if (context.contextSummary) {
      parts.push('CURRENT CONTEXT:\n' + context.contextSummary);
    }

    return parts.join('\n\n');
  }

  private getStyleInstruction(style: AIMentorStyle): string {
    switch (style) {
      case AIMentorStyle.INDIRECT:
        return (
          'STYLE: INDIRECT\n' +
          '- Only ask guiding questions to help the student think.\n' +
          '- Do NOT provide code, answers, or direct solutions.\n' +
          '- Ask one question at a time.\n' +
          '- Example: "What do you think happens when state updates inside useEffect without a dependency array?"'
        );

      case AIMentorStyle.STEP_BY_STEP:
        return (
          'STYLE: STEP BY STEP\n' +
          '- Reveal hints gradually, one small hint per response.\n' +
          '- Start with the most general hint, get more specific only if the student is still stuck.\n' +
          '- Do NOT provide complete code. Short pseudo-code snippets (1-2 lines max) are acceptable.\n' +
          '- Example: Hint 1: "Think about what triggers a re-render." → Hint 2: "Check your dependency array."'
        );

      case AIMentorStyle.CONCEPT_EXPLANATION:
        return (
          'STYLE: CONCEPT EXPLANATION\n' +
          '- Explain the underlying concept or theory behind the problem.\n' +
          '- Use analogies and simple examples to clarify.\n' +
          '- Do NOT provide the solution code directly. Illustrative code snippets (max 2-3 lines) are acceptable.\n' +
          '- Example: "useEffect with an empty dependency array runs only once after mount, similar to componentDidMount in class components."'
        );

      case AIMentorStyle.DIRECT:
        return (
          'STYLE: DIRECT\n' +
          '- You may provide code examples and direct solutions.\n' +
          '- Still explain WHY the solution works, not just the code.\n' +
          '- Keep code examples focused and minimal.'
        );
    }
  }

  private getToneInstruction(tone: AIMentorTone): string {
    switch (tone) {
      case AIMentorTone.STRICT:
        return (
          'TONE: Be concise and professional. ' +
          'No emojis or casual language. Get straight to the point.'
        );

      case AIMentorTone.FRIENDLY:
        return (
          'TONE: Be warm and approachable like a study buddy. ' +
          'Use casual language. Light encouragement is fine.'
        );

      case AIMentorTone.ENCOURAGING:
        return (
          'TONE: Be very supportive and motivating. ' +
          'Celebrate small wins. Reassure the student that mistakes are part of learning.'
        );

      case AIMentorTone.CUSTOM:
        return "TONE: Adapt your tone to match the student's communication style.";
    }
  }
}
