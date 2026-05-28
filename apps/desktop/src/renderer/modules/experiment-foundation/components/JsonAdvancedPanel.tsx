import { useState } from 'react';
import { prettyJson } from '../utils';

type CommonProps = {
  title?: string;
  value: unknown;
  helpText?: string;
};

export type JsonAdvancedPanelProps =
  | (CommonProps & { editable?: false; onChange?: never })
  | (CommonProps & { editable: true; onChange: (nextValue: string) => void });

export function JsonAdvancedPanel(props: JsonAdvancedPanelProps) {
  const { title = '高级 JSON', value, helpText } = props;
  const editable = props.editable === true;
  const onChange = editable ? props.onChange : undefined;
  const [expanded, setExpanded] = useState<boolean>(false);
  const serialized = typeof value === 'string' ? value : prettyJson(value ?? null);

  return (
    <section data-ui="section" data-padding="none">
      <div data-ui="toolbar" data-align="between" data-wrap="wrap">
        <p data-ui="text" data-variant="label" data-tone="muted">
          {title}
        </p>
        <button
          data-ui="button"
          data-variant="ghost"
          data-size="sm"
          type="button"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? '收起' : '展开'}
        </button>
      </div>
      {helpText ? (
        <p data-ui="text" data-variant="caption" data-tone="muted">
          {helpText}
        </p>
      ) : null}
      {expanded ? (
        editable && onChange ? (
          <textarea
            data-ui="textarea"
            data-size="sm"
            rows={14}
            value={serialized}
            spellCheck={false}
            onChange={(event) => onChange(event.target.value)}
          />
        ) : (
          <textarea
            data-ui="textarea"
            data-size="sm"
            rows={14}
            readOnly
            value={serialized}
            spellCheck={false}
          />
        )
      ) : null}
    </section>
  );
}
