import { useId } from 'react'
import { useFieldArray } from 'react-hook-form'
import type {
  Control,
  FieldArrayPath,
  FieldValues,
  Path,
  UseFormRegister,
} from 'react-hook-form'
import type {
  InputHTMLAttributes,
  Ref,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { Plus, X } from 'lucide-react'
import type { KeyValuePair } from '@/types/nodes'

/**
 * Tiny field primitives shared by every per-type form. Each forwards the
 * underlying element's ref + native props so RHF's `{...register('name')}`
 * spread works directly. React 19 passes `ref` as a plain prop for
 * function components — no forwardRef wrapper needed.
 *
 * `error` renders in danger color below the control when present. These
 * components only display the error; evaluation happens in the zod
 * resolver wired by the parent form.
 */

const inputClass =
  'rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-2.5 py-1.5 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]'

const errorInputClass =
  'rounded-md border border-[var(--color-danger)] bg-[var(--color-surface-raised)] px-2.5 py-1.5 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-danger)]'

const labelClass = 'text-xs font-medium text-[var(--color-text-secondary)]'
const errorClass = 'text-xs text-[var(--color-danger)]'

type FieldCommon = {
  label: string
  error?: string | undefined
}

export type TextFieldProps = FieldCommon &
  InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }

export function TextField({ label, error, id, ref, className, ...rest }: TextFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className={labelClass}>
        {label}
      </label>
      <input
        id={fieldId}
        ref={ref}
        className={className ?? (error ? errorInputClass : inputClass)}
        {...rest}
      />
      {error ? <span className={errorClass}>{error}</span> : null}
    </div>
  )
}

export type TextAreaFieldProps = FieldCommon &
  TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }

export function TextAreaField({
  label,
  error,
  id,
  ref,
  rows = 3,
  ...rest
}: TextAreaFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className={labelClass}>
        {label}
      </label>
      <textarea
        id={fieldId}
        ref={ref}
        rows={rows}
        className={error ? errorInputClass : inputClass}
        {...rest}
      />
      {error ? <span className={errorClass}>{error}</span> : null}
    </div>
  )
}

export type SelectOption = { value: string; label: string }

export type SelectFieldProps = FieldCommon &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
    options: readonly SelectOption[]
    placeholder?: string
    ref?: Ref<HTMLSelectElement>
  }

export function SelectField({
  label,
  error,
  id,
  ref,
  options,
  placeholder,
  ...rest
}: SelectFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className={labelClass}>
        {label}
      </label>
      <select
        id={fieldId}
        ref={ref}
        className={error ? errorInputClass : inputClass}
        {...rest}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? <span className={errorClass}>{error}</span> : null}
    </div>
  )
}

export type NumberFieldProps = FieldCommon &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { ref?: Ref<HTMLInputElement> }

export function NumberField(props: NumberFieldProps) {
  return <TextField {...props} type="number" inputMode="decimal" />
}

export type CheckboxFieldProps = FieldCommon &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { ref?: Ref<HTMLInputElement> }

export function CheckboxField({ label, error, id, ref, ...rest }: CheckboxFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
        <input
          id={fieldId}
          ref={ref}
          type="checkbox"
          className="h-4 w-4 rounded border-[var(--color-border-strong)] text-[var(--color-accent)]"
          {...rest}
        />
        {label}
      </label>
      {error ? <span className={errorClass}>{error}</span> : null}
    </div>
  )
}

export type KeyValueListFieldProps<T extends FieldValues> = {
  label: string
  control: Control<T>
  register: UseFormRegister<T>
  name: FieldArrayPath<T>
  error?: string
}

export function KeyValueListField<T extends FieldValues>({
  label,
  control,
  register,
  name,
  error,
}: KeyValueListFieldProps<T>) {
  const { fields, append, remove } = useFieldArray({ control, name })
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className={labelClass}>{label}</span>
        <button
          type="button"
          onClick={() =>
            // KeyValuePair element — id is our stable data id, not RHF's internal tracking id
            append({ id: crypto.randomUUID(), key: '', value: '' } as KeyValuePair as never)
          }
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>
      {fields.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">No entries yet.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-1">
              {/* preserve our data id across re-renders */}
              <input type="hidden" {...register(`${name}.${index}.id` as Path<T>)} />
              <input
                placeholder="Key"
                className={`${inputClass} min-w-0 flex-1`}
                {...register(`${name}.${index}.key` as Path<T>)}
              />
              <input
                placeholder="Value"
                className={`${inputClass} min-w-0 flex-1`}
                {...register(`${name}.${index}.value` as Path<T>)}
              />
              <button
                type="button"
                onClick={() => remove(index)}
                className="shrink-0 rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      {error ? <span className={errorClass}>{error}</span> : null}
    </div>
  )
}
