const RESEARCH_ARGUMENT_AUTHORITY_PATTERN = /research[-_]?argument|researchArgument/;

export function summarizeWritingEntryPacket(packet) {
  const payload = objectOrEmpty(packet.packet_payload);
  const admittedClaimRefs = arrayOrEmpty(payload.admitted_claim_refs);
  const claimTracePacketRefs = arrayOrEmpty(payload.claim_trace_packet_refs);
  const failedRunRefs = arrayOrEmpty(payload.failed_run_refs);
  return {
    packet_id: packet.writing_entry_packet_id,
    packet_status: packet.packet_status,
    dossier_id: packet.dossier_id,
    dossier_status: packet.dossier_status,
    readiness_gate_result_id: packet.readiness_gate_result_id,
    trace_manifest_id: packet.trace_manifest_id,
    trace_manifest_ref: packet.trace_manifest_ref ?? null,
    admitted_claim_ref_count: admittedClaimRefs.length,
    admitted_claim_refs: admittedClaimRefs,
    claim_trace_packet_ref_count: claimTracePacketRefs.length,
    claim_trace_packet_refs: claimTracePacketRefs,
    failed_run_ref_count: failedRunRefs.length,
    failed_run_refs: failedRunRefs,
    projection_policy_version_id: packet.projection_policy_version_id,
    writing_target_ref: packet.writing_target_ref ?? null,
    projection_only: true,
    writing_authority_mutated: false,
  };
}

export function findResearchArgumentAuthorityFindings(value, source, path = '$') {
  const findings = [];
  collectResearchArgumentAuthorityFindings(value, source, path, findings);
  return findings;
}

function collectResearchArgumentAuthorityFindings(value, source, path, findings) {
  if (value === null || value === undefined) {
    return;
  }
  if (typeof value === 'string') {
    if (RESEARCH_ARGUMENT_AUTHORITY_PATTERN.test(value)) {
      findings.push({
        severity: 'error',
        source,
        path,
        message: 'research-argument reference found in replay authority payload or runtime evidence.',
      });
    }
    return;
  }
  if (typeof value !== 'object') {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectResearchArgumentAuthorityFindings(item, source, `${path}[${index}]`, findings);
    });
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (key === 'ref_type' && typeof nested === 'string' && RESEARCH_ARGUMENT_AUTHORITY_PATTERN.test(nested)) {
      findings.push({
        severity: 'error',
        source,
        path: `${path}.ref_type`,
        message: 'research-argument ref_type found in replay authority payload or runtime evidence.',
      });
    }
    collectResearchArgumentAuthorityFindings(nested, source, `${path}.${key}`, findings);
  }
}

function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}

function objectOrEmpty(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
