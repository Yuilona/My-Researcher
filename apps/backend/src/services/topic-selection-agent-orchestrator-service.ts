import * as AjvModule from 'ajv/dist/ajv.js';
import type {
  ErrorObject,
  ValidateFunction,
} from 'ajv/dist/ajv.js';
import type {
  TopicSelectionArtifactRefRecord,
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionAgentExecutionMode,
  TopicSelectionArtifactFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-need-validation-contracts';
import {
  TOPIC_SELECTION_AGENT_RUN_MODES,
  type TopicSelectionAgentExecutionSpec,
  type TopicSelectionAgentRunMode,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-agent-profile-contracts';
import {
  TOPIC_SELECTION_AGENT_EXECUTOR_KINDS,
  TOPIC_SELECTION_AGENT_INVOCATION_AUDIT_SCHEMA_VERSION,
  type TopicSelectionAgentInvocationAuditSnapshot,
  type TopicSelectionAgentInvocationProvenance,
  type TopicSelectionAgentInvocationStatus,
  type TopicSelectionAgentOutputSourceKind,
  type TopicSelectionAgentDebateExtension,
  type TopicSelectionAgentValidationSummary,
  type TopicSelectionExecutorKind,
  topicSelectionAgentInvocationAuditSnapshotSchema,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-agent-invocation-contracts';
import { AppError } from '../errors/app-error.js';
import {
  BackendLlmGateway,
  LlmGatewayError,
  type LlmModelRef,
  type LlmPromptRef,
  type LlmRequestPolicy,
  type LlmStructuredOutputRequest,
} from './llm-gateway.js';
import {
  sha256Text,
  stableStringify,
} from './literature-content-processing-utils.js';
import { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';
import {
  type TopicSelectionResolvedModelProfile,
  TopicSelectionModelProfileRegistryService,
} from './topic-selection-model-profile-registry-service.js';

export type { TopicSelectionAgentRunMode } from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-agent-profile-contracts';
export type {
  TopicSelectionAgentInvocationAuditSnapshot,
  TopicSelectionAgentInvocationProvenance,
  TopicSelectionAgentInvocationStatus,
  TopicSelectionAgentOutputSourceKind,
  TopicSelectionAgentValidationSummary,
  TopicSelectionExecutorKind,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-agent-invocation-contracts';

const AjvConstructor = AjvModule.Ajv;

const FORBIDDEN_OUTPUT_KEY_PATTERNS = [
  /hidden[_-]?reasoning/i,
  /chain[_-]?of[_-]?thought/i,
  /raw[_-]?provider[_-]?log/i,
  /raw[_-]?debate[_-]?transcript/i,
  /provider[_-]?secret/i,
  /api[_-]?key/i,
  /secret[_-]?key/i,
  /access[_-]?token/i,
  /credential/i,
] as const;

export type TopicSelectionAgentOrchestratorLlmGateway = Pick<BackendLlmGateway, 'createStructuredOutput'>;

export type TopicSelectionMockedAgentOutput<T> = {
  fixture_id: string;
  output: T;
  fixture_hash?: string | null;
  mock_profile?: string | null;
};

export type TopicSelectionCodexAssistedAgentOutput<T> = {
  output: T;
  operator_label: string;
  response_hash?: string | null;
  prompt_packet_hash?: string | null;
  operator_approval_ref?: TopicSelectionFunctionalRef | null;
  response_source?: 'operator_supplied' | 'cached_exact_invocation';
};

export type TopicSelectionAgentInvocationRequest<T> = {
  workspace_id?: string | null;
  title_card_id?: string | null;
  node_id: string;
  workflow_run_id: string;
  node_attempt_id: string;
  invocation_attempt_id?: string | null;
  execution_mode: TopicSelectionAgentExecutionMode;
  execution_spec?: TopicSelectionAgentExecutionSpec | null;
  executor_kind: TopicSelectionExecutorKind;
  run_mode: TopicSelectionAgentRunMode;
  profile_id: string;
  output_contract: string;
  model_option_id?: string | null;
  prompt: LlmPromptRef;
  schema_name: string;
  schema: Record<string, unknown>;
  messages: Array<{ role: 'system' | 'user'; content: string }>;
  input_refs?: TopicSelectionFunctionalRef[];
  context_packet_refs?: TopicSelectionArtifactFunctionalRef[];
  debate_extension?: TopicSelectionAgentDebateExtension | null;
  mocked_output?: TopicSelectionMockedAgentOutput<T> | null;
  codex_response?: TopicSelectionCodexAssistedAgentOutput<T> | null;
  created_by?: 'human' | 'llm' | 'system' | 'hybrid';
};

export type TopicSelectionAgentInvocationResult<T> = {
  schema_version: 'v1';
  node_id: string;
  workflow_run_id: string;
  node_attempt_id: string;
  status: TopicSelectionAgentInvocationStatus;
  structured_output: T | null;
  provenance: TopicSelectionAgentInvocationProvenance;
  validation: TopicSelectionAgentValidationSummary;
  warning_codes: string[];
  blocker_codes: string[];
  error_code?: string | null;
  audit_snapshot: TopicSelectionAgentInvocationAuditSnapshot;
  audit_artifact_ref?: TopicSelectionArtifactFunctionalRef | null;
};

type SourceExecution<T> = {
  output: T | null;
  provenance: TopicSelectionAgentInvocationProvenance;
  error_code?: string | null;
  blocker_codes?: string[];
  validation?: TopicSelectionAgentValidationSummary;
};

export class TopicSelectionAgentOrchestratorService {
  private readonly ajv = new AjvConstructor({
    allErrors: true,
    strict: false,
    removeAdditional: false,
  });
  private readonly auditSnapshotValidator = this.ajv.compile(
    topicSelectionAgentInvocationAuditSnapshotSchema,
  );
  private readonly validators = new Map<string, ValidateFunction>();
  private readonly llmGateway: TopicSelectionAgentOrchestratorLlmGateway;
  private readonly modelProfileRegistry: TopicSelectionModelProfileRegistryService;
  private readonly now: () => string;

  constructor(options: {
    llmGateway?: TopicSelectionAgentOrchestratorLlmGateway;
    controlPlane?: TopicSelectionControlPlaneService;
    modelProfileRegistry?: TopicSelectionModelProfileRegistryService;
    now?: () => string;
  } = {}) {
    this.llmGateway = options.llmGateway ?? new BackendLlmGateway();
    this.controlPlane = options.controlPlane ?? null;
    this.modelProfileRegistry = options.modelProfileRegistry ?? new TopicSelectionModelProfileRegistryService();
    this.now = options.now ?? (() => new Date().toISOString());
  }

  private readonly controlPlane: TopicSelectionControlPlaneService | null;

  async invokeStructuredOutput<T>(
    input: TopicSelectionAgentInvocationRequest<T>,
  ): Promise<TopicSelectionAgentInvocationResult<T>> {
    const effectiveInput = this.effectiveInvocationInput(input);
    this.assertInvocationInput(effectiveInput);
    const resolvedProfile = this.resolveInvocationProfile(effectiveInput);
    const source = await this.executeSource(effectiveInput, resolvedProfile);
    if (source.output === null) {
      return this.buildResult(effectiveInput, {
        status: 'blocked',
        structuredOutput: null,
        provenance: source.provenance,
        validation: source.validation ?? this.validationSummary(null),
        blockerCodes: source.blocker_codes ?? ['AGENT_EXECUTION_FAILED'],
        errorCode: source.error_code ?? 'AGENT_EXECUTION_FAILED',
      });
    }

    const forbiddenPath = this.findForbiddenOutputPath(source.output);
    if (forbiddenPath) {
      return this.buildResult(effectiveInput, {
        status: 'blocked',
        structuredOutput: null,
        provenance: source.provenance,
        validation: this.validationSummary(null),
        blockerCodes: ['FORBIDDEN_AGENT_OUTPUT_FIELD'],
        errorCode: 'FORBIDDEN_AGENT_OUTPUT_FIELD',
      });
    }

    const validation = this.validateStructuredOutput(effectiveInput.schema_name, effectiveInput.schema, source.output);
    if (!validation.valid) {
      return this.buildResult(effectiveInput, {
        status: 'blocked',
        structuredOutput: null,
        provenance: source.provenance,
        validation,
        blockerCodes: ['SCHEMA_VALIDATION_FAILED'],
        errorCode: 'SCHEMA_VALIDATION_FAILED',
      });
    }

    return this.buildResult(effectiveInput, {
      status: 'succeeded',
      structuredOutput: source.output,
      provenance: source.provenance,
      validation,
      blockerCodes: [],
      errorCode: null,
    });
  }

  private effectiveInvocationInput<T>(
    input: TopicSelectionAgentInvocationRequest<T>,
  ): TopicSelectionAgentInvocationRequest<T> {
    const spec = input.execution_spec;
    if (!spec) {
      return input;
    }
    if (input.execution_mode !== spec.execution_mode) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'execution_spec.execution_mode must match execution_mode.');
    }
    const specModelOptionId = spec.model_option_id?.trim() || null;
    const inputModelOptionId = input.model_option_id?.trim() || null;
    if (inputModelOptionId && specModelOptionId && inputModelOptionId !== specModelOptionId) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'execution_spec.model_option_id must match model_option_id.');
    }
    if (spec.execution_mode !== 'provider_llm' && (specModelOptionId || inputModelOptionId)) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'model_option_id requires execution_mode=provider_llm.');
    }
    return {
      ...input,
      execution_mode: spec.execution_mode,
      model_option_id: specModelOptionId ?? inputModelOptionId,
      execution_spec: {
        execution_mode: spec.execution_mode,
        ...(specModelOptionId ? { model_option_id: specModelOptionId } : {}),
      },
    };
  }

  private async executeSource<T>(
    input: TopicSelectionAgentInvocationRequest<T>,
    resolvedProfile: TopicSelectionResolvedModelProfile,
  ): Promise<SourceExecution<T>> {
    const invocationAttemptId = this.invocationAttemptId(input);
    const promptPacketHash = input.codex_response?.prompt_packet_hash?.trim()
      || this.hash({
        context_packet_refs: input.context_packet_refs ?? [],
        input_refs: input.input_refs ?? [],
        messages: input.messages,
        model_option_id: resolvedProfile.selected_model_option?.option_id ?? null,
        prompt: input.prompt,
        profile_id: input.profile_id,
        profile_hash: resolvedProfile.profile_hash,
        schema_name: input.schema_name,
      });

    if (input.execution_mode === 'mocked_llm') {
      if (input.run_mode === 'product') {
        throw new AppError(400, 'INVALID_PAYLOAD', 'mocked_llm cannot run in product mode.');
      }
      if (!input.mocked_output) {
        throw new AppError(400, 'INVALID_PAYLOAD', 'mocked_output is required for mocked_llm.');
      }
      const responseHash = this.hash(input.mocked_output.output);
      const fixtureHash = input.mocked_output.fixture_hash?.trim() || responseHash;
      return {
        output: input.mocked_output.output,
        provenance: {
          workflow_run_id: input.workflow_run_id,
          node_id: input.node_id,
          node_attempt_id: input.node_attempt_id,
          invocation_attempt_id: invocationAttemptId,
          execution_mode: input.execution_mode,
          executor_kind: input.executor_kind,
          source_kind: 'mock_fixture',
          non_provider: true,
          run_mode: input.run_mode,
          profile_id: input.profile_id,
          profile_version: resolvedProfile.profile.profile_version,
          profile_hash: resolvedProfile.profile_hash,
          model_option_id: null,
          normalized_params_hash: null,
          capability_degraded: false,
          capability_degrade_reason: null,
          output_contract: input.output_contract,
          prompt_template_id: input.prompt.promptTemplateId,
          prompt_template_version: input.prompt.version,
          schema_name: input.schema_name,
          prompt_packet_hash: promptPacketHash,
          response_hash: responseHash,
          structured_output_hash: responseHash,
          cache_status: 'not_applicable',
          response_reuse_ref: null,
          fixture_id: input.mocked_output.fixture_id,
          fixture_hash: fixtureHash,
          mock_profile: input.mocked_output.mock_profile ?? null,
          telemetry: null,
          ...this.debateExtensionProvenance(input),
        },
      };
    }

    if (input.execution_mode === 'codex_assisted') {
      if (!input.codex_response) {
        throw new AppError(400, 'INVALID_PAYLOAD', 'codex_response is required for codex_assisted.');
      }
      const responseHash = input.codex_response.response_hash?.trim() || this.hash(input.codex_response.output);
      const responseSource = input.codex_response.response_source ?? 'operator_supplied';
      return {
        output: input.codex_response.output,
        provenance: {
          workflow_run_id: input.workflow_run_id,
          node_id: input.node_id,
          node_attempt_id: input.node_attempt_id,
          invocation_attempt_id: invocationAttemptId,
          execution_mode: input.execution_mode,
          executor_kind: input.executor_kind,
          source_kind: 'codex_response',
          non_provider: true,
          run_mode: input.run_mode,
          profile_id: input.profile_id,
          profile_version: resolvedProfile.profile.profile_version,
          profile_hash: resolvedProfile.profile_hash,
          model_option_id: null,
          normalized_params_hash: null,
          capability_degraded: false,
          capability_degrade_reason: null,
          output_contract: input.output_contract,
          prompt_template_id: input.prompt.promptTemplateId,
          prompt_template_version: input.prompt.version,
          schema_name: input.schema_name,
          prompt_packet_hash: promptPacketHash,
          response_hash: responseHash,
          structured_output_hash: responseHash,
          cache_status: responseSource === 'cached_exact_invocation' ? 'hit' : 'not_applicable',
          response_reuse_ref: null,
          operator_label: input.codex_response.operator_label,
          operator_approval_ref: input.codex_response.operator_approval_ref ?? null,
          response_source: responseSource,
          telemetry: null,
          ...this.debateExtensionProvenance(input),
        },
      };
    }

    const model = this.modelRefForResolvedProfile(resolvedProfile);
    if (!model) {
      return this.blockedSource(
        input,
        resolvedProfile,
        'MISSING_PROVIDER_MODEL_OPTION',
        'provider_response',
        promptPacketHash,
      );
    }
    const requestPolicy = this.requestPolicyForResolvedProfile(resolvedProfile);

    try {
      const request: LlmStructuredOutputRequest = {
        executionContext: {
          feature: 'topic_selection',
          operation: input.node_id,
          traceId: invocationAttemptId,
          metadata: {
            workflow_run_id: input.workflow_run_id,
            execution_mode: input.execution_mode,
            executor_kind: input.executor_kind,
            profile_id: input.profile_id,
            profile_hash: resolvedProfile.profile_hash,
            model_option_id: resolvedProfile.selected_model_option?.option_id ?? null,
            normalized_params_hash: resolvedProfile.normalized_params_hash,
          },
        },
        model,
        prompt: input.prompt,
        messages: input.messages,
        schemaName: input.schema_name,
        schema: this.providerCompatibleSchema(input.schema),
        policy: requestPolicy,
        normalizedParams: resolvedProfile.selected_model_option?.normalized_params,
        providerOverrides: resolvedProfile.selected_model_option?.provider_overrides,
      };
      const response = await this.llmGateway.createStructuredOutput<T>(request);
      const responseHash = this.hash(response.parsed);
      return {
        output: response.parsed,
        provenance: {
          workflow_run_id: input.workflow_run_id,
          node_id: input.node_id,
          node_attempt_id: input.node_attempt_id,
          invocation_attempt_id: invocationAttemptId,
          execution_mode: input.execution_mode,
          executor_kind: input.executor_kind,
          source_kind: 'provider_response',
          non_provider: false,
          run_mode: input.run_mode,
          profile_id: input.profile_id,
          profile_version: resolvedProfile.profile.profile_version,
          profile_hash: resolvedProfile.profile_hash,
          model_option_id: resolvedProfile.selected_model_option?.option_id ?? null,
          normalized_params_hash: resolvedProfile.normalized_params_hash,
          capability_degraded: false,
          capability_degrade_reason: null,
          output_contract: input.output_contract,
          prompt_template_id: input.prompt.promptTemplateId,
          prompt_template_version: input.prompt.version,
          schema_name: input.schema_name,
          prompt_packet_hash: promptPacketHash,
          response_hash: responseHash,
          structured_output_hash: responseHash,
          cache_status: 'not_applicable',
          response_reuse_ref: null,
          provider_id: model.providerId,
          model_id: model.modelId,
          telemetry: response.telemetry,
          ...this.debateExtensionProvenance(input),
        },
      };
    } catch (error) {
      const llmError = error instanceof LlmGatewayError ? error : null;
      return {
        output: null,
        provenance: {
          workflow_run_id: input.workflow_run_id,
          node_id: input.node_id,
          node_attempt_id: input.node_attempt_id,
          invocation_attempt_id: invocationAttemptId,
          execution_mode: input.execution_mode,
          executor_kind: input.executor_kind,
          source_kind: 'provider_response',
          non_provider: false,
          run_mode: input.run_mode,
          profile_id: input.profile_id,
          profile_version: resolvedProfile.profile.profile_version,
          profile_hash: resolvedProfile.profile_hash,
          model_option_id: resolvedProfile.selected_model_option?.option_id ?? null,
          normalized_params_hash: resolvedProfile.normalized_params_hash,
          capability_degraded: false,
          capability_degrade_reason: null,
          output_contract: input.output_contract,
          prompt_template_id: input.prompt.promptTemplateId,
          prompt_template_version: input.prompt.version,
          schema_name: input.schema_name,
          prompt_packet_hash: promptPacketHash,
          response_hash: null,
          structured_output_hash: null,
          cache_status: 'not_applicable',
          response_reuse_ref: null,
          provider_id: model.providerId,
          model_id: model.modelId,
          telemetry: llmError?.telemetry ?? null,
          ...this.debateExtensionProvenance(input),
        },
        error_code: llmError?.code ?? 'PROVIDER_EXECUTION_FAILED',
        blocker_codes: [llmError?.code ?? 'PROVIDER_EXECUTION_FAILED'],
        validation: this.providerFailureValidationSummary(llmError),
      };
    }
  }

  private providerCompatibleSchema(schema: Record<string, unknown>): Record<string, unknown> {
    return this.removeFalsePropertySchemas(schema) as Record<string, unknown>;
  }

  private removeFalsePropertySchemas(value: unknown, parentKey: string | null = null): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.removeFalsePropertySchemas(item));
    }
    if (!value || typeof value !== 'object') {
      return value;
    }
    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      if (parentKey === 'properties' && child === false) {
        continue;
      }
      output[key] = this.removeFalsePropertySchemas(child, key);
    }
    return output;
  }

  private async buildResult<T>(
    input: TopicSelectionAgentInvocationRequest<T>,
    value: {
      status: TopicSelectionAgentInvocationStatus;
      structuredOutput: T | null;
      provenance: TopicSelectionAgentInvocationProvenance;
      validation: TopicSelectionAgentValidationSummary;
      blockerCodes: string[];
      errorCode?: string | null;
    },
  ): Promise<TopicSelectionAgentInvocationResult<T>> {
    const auditSnapshot: TopicSelectionAgentInvocationAuditSnapshot = {
      schema_version: TOPIC_SELECTION_AGENT_INVOCATION_AUDIT_SCHEMA_VERSION,
      node_id: input.node_id,
      workflow_run_id: input.workflow_run_id,
      node_attempt_id: input.node_attempt_id,
      status: value.status,
      provenance: value.provenance,
      validation: value.validation,
      warning_codes: [],
      blocker_codes: value.blockerCodes,
      created_at: this.now(),
    };
    this.assertAuditSnapshot(auditSnapshot);
    const auditArtifact = await this.recordAuditArtifact(input, auditSnapshot);
    return {
      schema_version: 'v1',
      node_id: input.node_id,
      workflow_run_id: input.workflow_run_id,
      node_attempt_id: input.node_attempt_id,
      status: value.status,
      structured_output: value.structuredOutput,
      provenance: value.provenance,
      validation: value.validation,
      warning_codes: [],
      blocker_codes: value.blockerCodes,
      error_code: value.errorCode ?? null,
      audit_snapshot: auditSnapshot,
      audit_artifact_ref: auditArtifact ? this.toArtifactFunctionalRef(auditArtifact) : null,
    };
  }

  private assertAuditSnapshot(snapshot: TopicSelectionAgentInvocationAuditSnapshot): void {
    const valid = this.auditSnapshotValidator(snapshot);
    if (valid) {
      return;
    }
    const message = (this.auditSnapshotValidator.errors ?? [])
      .map((error) => `${error.instancePath || '/'} ${error.message ?? 'schema validation failed'}`)
      .join('; ');
    throw new AppError(
      500,
      'INTERNAL_ERROR',
      `Agent invocation audit snapshot violated shared contract: ${message}`,
    );
  }

  private async recordAuditArtifact(
    input: TopicSelectionAgentInvocationRequest<unknown>,
    auditSnapshot: TopicSelectionAgentInvocationAuditSnapshot,
  ): Promise<TopicSelectionArtifactRefRecord | null> {
    if (!this.controlPlane) {
      return null;
    }
    return this.controlPlane.recordArtifactRef({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id ?? null,
      artifact_kind: 'diagnostic',
      storage_kind: 'inline',
      payload: auditSnapshot as unknown as Record<string, unknown>,
      workflow_run_id: input.workflow_run_id,
      created_by: input.created_by ?? 'system',
    });
  }

  private blockedSource<T>(
    input: TopicSelectionAgentInvocationRequest<T>,
    resolvedProfile: TopicSelectionResolvedModelProfile,
    errorCode: string,
    sourceKind: TopicSelectionAgentOutputSourceKind,
    promptPacketHash: string,
  ): SourceExecution<T> {
    return {
      output: null,
      provenance: {
        workflow_run_id: input.workflow_run_id,
        node_id: input.node_id,
        node_attempt_id: input.node_attempt_id,
        invocation_attempt_id: this.invocationAttemptId(input),
        execution_mode: input.execution_mode,
        executor_kind: input.executor_kind,
        source_kind: sourceKind,
        non_provider: sourceKind !== 'provider_response',
        run_mode: input.run_mode,
        profile_id: input.profile_id,
        profile_version: resolvedProfile.profile.profile_version,
        profile_hash: resolvedProfile.profile_hash,
        model_option_id: resolvedProfile.selected_model_option?.option_id ?? null,
        normalized_params_hash: resolvedProfile.normalized_params_hash,
        capability_degraded: false,
        capability_degrade_reason: null,
        output_contract: input.output_contract,
        prompt_template_id: input.prompt.promptTemplateId,
        prompt_template_version: input.prompt.version,
        schema_name: input.schema_name,
        prompt_packet_hash: promptPacketHash,
        response_hash: null,
        structured_output_hash: null,
        cache_status: 'not_applicable',
        response_reuse_ref: null,
        telemetry: null,
        ...this.debateExtensionProvenance(input),
      },
      error_code: errorCode,
      blocker_codes: [errorCode],
    };
  }

  private invocationAttemptId(input: TopicSelectionAgentInvocationRequest<unknown>): string {
    return input.invocation_attempt_id?.trim() || input.node_attempt_id;
  }

  private debateExtensionProvenance(
    input: TopicSelectionAgentInvocationRequest<unknown>,
  ): Pick<TopicSelectionAgentInvocationProvenance, 'debate_extension'> | Record<string, never> {
    return input.debate_extension ? { debate_extension: input.debate_extension } : {};
  }

  private validateStructuredOutput(
    schemaName: string,
    schema: Record<string, unknown>,
    output: unknown,
  ): TopicSelectionAgentValidationSummary {
    const validator = this.validatorFor(schemaName, schema);
    const valid = validator(output);
    if (valid) {
      return this.validationSummary([]);
    }
    return this.validationSummary(validator.errors ?? []);
  }

  private validatorFor(schemaName: string, schema: Record<string, unknown>): ValidateFunction {
    const schemaHash = this.hash(schema);
    const key = `${schemaName}:${schemaHash}`;
    const existing = this.validators.get(key);
    if (existing) {
      return existing;
    }
    const validator = this.ajv.compile(schema);
    this.validators.set(key, validator);
    return validator;
  }

  private validationSummary(errors: ErrorObject[] | null): TopicSelectionAgentValidationSummary {
    if (errors === null) {
      return {
        valid: false,
        error_count: 1,
        errors: ['output unavailable'],
      };
    }
    return {
      valid: errors.length === 0,
      error_count: errors.length,
      errors: errors.map((error) => `${error.instancePath || '/'} ${error.message ?? 'schema validation failed'}`),
    };
  }

  private providerFailureValidationSummary(error: LlmGatewayError | null): TopicSelectionAgentValidationSummary {
    if (!error) {
      return this.validationSummary(null);
    }
    const statusSuffix = error.statusCode ? ` status=${error.statusCode}` : '';
    return {
      valid: false,
      error_count: 1,
      errors: [
        `${error.code}${statusSuffix}: ${this.sanitizeProviderErrorMessage(error.message)}`,
      ],
    };
  }

  private sanitizeProviderErrorMessage(message: string): string {
    return message
      .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/giu, 'Bearer [REDACTED]')
      .replace(/sk-[A-Za-z0-9_-]+/giu, '[REDACTED_API_KEY]')
      .replace(/(api[_-]?key\s*[:=]\s*)[^\s,;}]+/giu, '$1[REDACTED]')
      .replace(/(access[_-]?token\s*[:=]\s*)[^\s,;}]+/giu, '$1[REDACTED]')
      .replace(/\s+/gu, ' ')
      .trim()
      .slice(0, 500);
  }

  private findForbiddenOutputPath(value: unknown, path: string[] = ['structured_output']): string | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    if (Array.isArray(value)) {
      for (const [index, item] of value.entries()) {
        const child = this.findForbiddenOutputPath(item, [...path, String(index)]);
        if (child) {
          return child;
        }
      }
      return null;
    }
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const childPath = [...path, key];
      if (FORBIDDEN_OUTPUT_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
        return childPath.join('.');
      }
      const found = this.findForbiddenOutputPath(child, childPath);
      if (found) {
        return found;
      }
    }
    return null;
  }

  private assertInvocationInput(input: TopicSelectionAgentInvocationRequest<unknown>): void {
    this.assertNonEmpty(input.node_id, 'node_id');
    this.assertNonEmpty(input.workflow_run_id, 'workflow_run_id');
    this.assertNonEmpty(input.node_attempt_id, 'node_attempt_id');
    if (input.invocation_attempt_id !== undefined && input.invocation_attempt_id !== null) {
      this.assertNonEmpty(input.invocation_attempt_id, 'invocation_attempt_id');
    }
    this.assertNonEmpty(input.profile_id, 'profile_id');
    this.assertNonEmpty(input.output_contract, 'output_contract');
    this.assertNonEmpty(input.prompt.promptTemplateId, 'prompt.promptTemplateId');
    this.assertNonEmpty(input.prompt.version, 'prompt.version');
    this.assertNonEmpty(input.schema_name, 'schema_name');
    if (!['mocked_llm', 'codex_assisted', 'provider_llm'].includes(input.execution_mode)) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'execution_mode is not supported.');
    }
    if (!TOPIC_SELECTION_AGENT_EXECUTOR_KINDS.includes(input.executor_kind)) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'executor_kind is not supported.');
    }
    if (!TOPIC_SELECTION_AGENT_RUN_MODES.includes(input.run_mode)) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'run_mode is not supported.');
    }
    if (!input.schema || typeof input.schema !== 'object' || Array.isArray(input.schema)) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'schema must be an object.');
    }
    if (!Array.isArray(input.messages) || input.messages.length === 0) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'messages must contain at least one message.');
    }
  }

  private toArtifactFunctionalRef(record: TopicSelectionArtifactRefRecord): TopicSelectionArtifactFunctionalRef {
    return {
      ref_type: 'artifact_ref',
      ref_id: record.artifact_ref_id,
      title_card_id: record.title_card_id ?? null,
    };
  }

  private assertNonEmpty(value: string, fieldName: string): void {
    if (!value.trim()) {
      throw new AppError(400, 'INVALID_PAYLOAD', `${fieldName} cannot be empty.`);
    }
  }

  private hash(value: unknown): string {
    return sha256Text(stableStringify(value));
  }

  private resolveInvocationProfile(
    input: TopicSelectionAgentInvocationRequest<unknown>,
  ): TopicSelectionResolvedModelProfile {
    const resolved = this.modelProfileRegistry.resolveProfile({
      profile_id: input.profile_id,
      execution_mode: input.execution_mode,
      run_mode: input.run_mode,
      model_option_id: input.model_option_id ?? null,
    });
    if (resolved.profile.output_contract !== input.output_contract) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'output_contract is not allowed by model profile.');
    }
    return resolved;
  }

  private modelRefForResolvedProfile(
    resolvedProfile: TopicSelectionResolvedModelProfile,
  ): LlmModelRef | null {
    const option = resolvedProfile.selected_model_option;
    if (!option || !this.isProviderId(option.provider_id)) {
      return null;
    }
    return {
      providerId: option.provider_id,
      modelId: option.model_id,
      profileId: resolvedProfile.profile.profile_id,
    };
  }

  private requestPolicyForResolvedProfile(
    resolvedProfile: TopicSelectionResolvedModelProfile,
  ): LlmRequestPolicy {
    const option = resolvedProfile.selected_model_option;
    const retryPolicy = resolvedProfile.profile.failure_handling_policy.technical_retry;
    return {
      ...(option?.request_policy?.timeout_ms
        ? { timeoutMs: option.request_policy.timeout_ms }
        : {}),
      maxRetries: retryPolicy.enabled
        ? Math.max(0, retryPolicy.max_provider_call_attempts - 1)
        : 0,
    };
  }

  private isProviderId(value: string): value is LlmModelRef['providerId'] {
    return value === 'openai' || value === 'dashscope' || value === 'deepseek';
  }
}
