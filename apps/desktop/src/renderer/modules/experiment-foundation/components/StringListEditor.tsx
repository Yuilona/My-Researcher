export type StringListEditorProps = {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
};

/**
 * Compact editor for a `string[]` field. Used by typed asset views for
 * aliases / task_types / similar free-text lists.
 */
export function StringListEditor({ label, values, onChange, placeholder }: StringListEditorProps) {
  const handleItemChange = (index: number, next: string) => {
    const draft = [...values];
    draft[index] = next;
    onChange(draft);
  };
  const handleAdd = () => onChange([...values, '']);
  const handleRemove = (index: number) => {
    const draft = [...values];
    draft.splice(index, 1);
    onChange(draft);
  };
  return (
    <section data-ui="section" data-padding="none">
      <div data-ui="stack" data-direction="col" data-gap="2">
        <div data-ui="toolbar" data-align="between" data-wrap="wrap">
          <p data-ui="text" data-variant="label" data-tone="primary">
            {label}
          </p>
          <button data-ui="button" data-variant="secondary" data-size="sm" type="button" onClick={handleAdd}>
            添加
          </button>
        </div>
        {values.length === 0 ? (
          <p data-ui="text" data-variant="caption" data-tone="muted">
            （空）
          </p>
        ) : (
          values.map((value, index) => (
            <div key={index} data-ui="stack" data-direction="row" data-gap="2" data-wrap="wrap">
              <input
                data-ui="input"
                data-size="sm"
                placeholder={placeholder}
                value={value}
                onChange={(event) => handleItemChange(index, event.target.value)}
              />
              <button data-ui="button" data-variant="ghost" data-size="sm" type="button" onClick={() => handleRemove(index)}>
                删除
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
