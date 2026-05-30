import { AppError } from '../errors/app-error.js';
import { stableStringify } from './literature-content-processing-utils.js';

export interface TopicSelectionTextTokenEstimate {
  estimated_tokens: number;
  cjk_character_count: number;
  latin_word_count: number;
  non_cjk_character_count: number;
}

export interface EstimateTopicSelectionInputTokensInput {
  messages?: Array<{ role: string; content: string }>;
  context_payloads?: unknown[];
  schema?: Record<string, unknown> | null;
  extra_payloads?: unknown[];
  safety_margin?: number | null;
}

export interface TopicSelectionInputTokenEstimate {
  raw_input_tokens: number;
  estimated_input_tokens: number;
  schema_overhead_tokens: number;
  safety_margin: number;
}

const DEFAULT_SAFETY_MARGIN = 1.25;
const CJK_PATTERN = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/gu;
const WORD_PATTERN = /[A-Za-z]+(?:'[A-Za-z]+)?|\d+(?:\.\d+)?/gu;
const JSON_STRUCTURE_PATTERN = /[{}\[\]:,"]/g;

export class TopicSelectionConservativeTokenEstimatorService {
  estimateText(value: string): TopicSelectionTextTokenEstimate {
    if (value.length === 0) {
      return {
        estimated_tokens: 0,
        cjk_character_count: 0,
        latin_word_count: 0,
        non_cjk_character_count: 0,
      };
    }

    const cjkCharacterCount = [...value.matchAll(CJK_PATTERN)].length;
    const nonCjkText = value.replace(CJK_PATTERN, ' ');
    const latinWordCount = [...nonCjkText.matchAll(WORD_PATTERN)].length;
    const nonCjkCharacterCount = nonCjkText.replace(/\s+/g, '').length;
    const characterBasedTokens = Math.ceil(nonCjkCharacterCount / 4);
    const latinTokens = Math.max(characterBasedTokens, Math.ceil(latinWordCount * 1.15));
    const newlineOverhead = Math.ceil((value.match(/\n/g)?.length ?? 0) / 8);

    return {
      estimated_tokens: Math.max(1, cjkCharacterCount + latinTokens + newlineOverhead),
      cjk_character_count: cjkCharacterCount,
      latin_word_count: latinWordCount,
      non_cjk_character_count: nonCjkCharacterCount,
    };
  }

  estimatePayload(value: unknown): number {
    if (value === null || value === undefined) {
      return 0;
    }
    if (typeof value === 'string') {
      return this.estimateText(value).estimated_tokens;
    }

    const serialized = stableStringify(value);
    const structureCount = serialized.match(JSON_STRUCTURE_PATTERN)?.length ?? 0;
    const structureOverhead = Math.ceil(structureCount / 12);
    const keyOverhead = this.countObjectKeys(value);
    return this.estimateText(serialized).estimated_tokens + structureOverhead + keyOverhead;
  }

  estimateSchemaOverhead(schema?: Record<string, unknown> | null): number {
    if (!schema) {
      return 0;
    }
    return Math.ceil(this.estimatePayload(schema) * 1.2);
  }

  estimateInputTokens(
    input: EstimateTopicSelectionInputTokensInput,
  ): TopicSelectionInputTokenEstimate {
    const safetyMargin = input.safety_margin ?? DEFAULT_SAFETY_MARGIN;
    if (!Number.isFinite(safetyMargin) || safetyMargin < 1) {
      throw new AppError(
        400,
        'INVALID_PAYLOAD',
        'token estimate safety margin must be a finite multiplier greater than or equal to 1.',
      );
    }

    const messageTokens = (input.messages ?? []).reduce<number>((total, message) => {
      const roleOverhead = 4;
      return total + roleOverhead + this.estimateText(message.role).estimated_tokens
        + this.estimateText(message.content).estimated_tokens;
    }, 0);
    const contextTokens = (input.context_payloads ?? []).reduce<number>(
      (total, payload) => total + this.estimatePayload(payload),
      0,
    );
    const extraPayloadTokens = (input.extra_payloads ?? []).reduce<number>(
      (total, payload) => total + this.estimatePayload(payload),
      0,
    );
    const schemaOverheadTokens = this.estimateSchemaOverhead(input.schema);
    const rawInputTokens = messageTokens + contextTokens + extraPayloadTokens + schemaOverheadTokens;

    return {
      raw_input_tokens: rawInputTokens,
      estimated_input_tokens: Math.ceil(rawInputTokens * safetyMargin),
      schema_overhead_tokens: schemaOverheadTokens,
      safety_margin: safetyMargin,
    };
  }

  private countObjectKeys(value: unknown): number {
    if (!value || typeof value !== 'object') {
      return 0;
    }
    if (Array.isArray(value)) {
      return value.reduce<number>((total, item) => total + this.countObjectKeys(item), 0);
    }

    const record = value as Record<string, unknown>;
    return Object.keys(record).length
      + Object.values(record).reduce<number>(
        (total, item) => total + this.countObjectKeys(item),
        0,
      );
  }
}
